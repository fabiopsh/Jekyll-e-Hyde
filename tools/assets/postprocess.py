"""Bring raw SDXL images to the game's size and to the common palette.

Two stages for every raw image output/raw/<kind>/<id>_v<n>.png:

1. reduce -> output/reduced/<kind>/<id>_v<n>.png (final size, original colours)
   background  centre crop to 16:9, grid reduction to 480x270
   character   background removal (rembg), crop to the figure, grid reduction to 64 px of height
   portrait    keeps its backdrop (no cut-out); the rembg mask only frames the shot: 4:5 box from just
               above the hat, centred on the head, down to the chest; grid reduction to 128x160
   item        background removal, crop, fit into 32x32 (1 px margin)
   illustration no cut-out: centre crop to 4:5, grid reduction to 160x200
   The full-size cutout of characters, portraits and items is kept in output/cutout/<kind>/.
2. palette -> output/processed/<kind>/<id>_v<n>.png
   every opaque pixel takes the nearest colour of palette.hex (CIELAB distance, no dithering).
   A request with `palette_size: 32` uses only the first 32 colours (the day palette, before the night
   colours were added): for the approved assets that the new colours made worse (palette_check.py).

"Grid reduction": the image is resized to CELL times the final size, then every CELL x CELL block becomes one
pixel with the per-channel median of its opaque pixels (sharper edges than an average); a block is opaque
when at least half of its pixels are.

--make-palette builds palette.hex (PALETTE_COLORS colours) from the reduced backgrounds: k-means in CIELAB
over all their pixels. Backgrounds with a choice in data/selections.yaml contribute only the chosen variant.
With --sprite-share 0.15 the chosen characters, portraits and items weigh 15% (see make_palette).

--extend-palette 8 appends 8 colours to palette.hex and keeps the existing ones: k-means in CIELAB over the
reduced images of --ids (only the chosen variant where there is a choice) in which the old colours are fixed
centres and only the new ones move, so they settle where the old palette is far from those pixels
(used on 2026-10-16 for the night colours, see README).

Examples:
    uv run postprocess.py                          # everything not processed yet
    uv run postprocess.py --kind background --make-palette
    uv run postprocess.py --ids utterson --force   # redo both stages
"""

from __future__ import annotations

import argparse
import os
import time
import warnings
from datetime import date

import numpy as np
from PIL import Image, ImageDraw

import config

os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

CELL = 4                    # grid reduction: each final pixel comes from a CELL x CELL block
KEEP_FRACTION = 0.10        # cutout fragments smaller than 10% of the main body are removed
BACKGROUND_TOLERANCE = 60   # summed RGB distance under which an enclosed pixel counts as background
OPENING_MAX_ALPHA = 16      # rembg alpha under which a background-coloured hole is a real opening
NO_CUTOUT = ("background", "illustration")  # kinds that never load rembg


# ---- colour ---------------------------------------------------------------------------------------------

def srgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """(..., 3) uint8 sRGB -> (..., 3) float CIELAB (D65)."""
    c = rgb.astype(np.float64) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def lab_to_srgb(lab: np.ndarray) -> np.ndarray:
    fy = (lab[..., 0] + 16) / 116
    f = np.stack([fy + lab[..., 1] / 500, fy, fy - lab[..., 2] / 200], axis=-1)
    xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.95047, 1.0, 1.08883])
    m = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]])
    c = np.clip(xyz @ m.T, 0, 1)
    c = np.where(c > 0.0031308, 1.055 * c ** (1 / 2.4) - 0.055, 12.92 * c)
    return np.clip(np.round(c * 255), 0, 255).astype(np.uint8)


def nearest_palette(rgb: np.ndarray, palette: np.ndarray) -> np.ndarray:
    """Map (N, 3) uint8 colours to the nearest palette colour in CIELAB; no dithering."""
    unique, inverse = np.unique(rgb.reshape(-1, 3), axis=0, return_inverse=True)
    distance = ((srgb_to_lab(unique)[:, None, :] - srgb_to_lab(palette)[None, :, :]) ** 2).sum(axis=2)
    return palette[distance.argmin(axis=1)][inverse.reshape(-1)]


def kmeans_palette(pixels: np.ndarray, colors: int, iterations: int = 30) -> np.ndarray:
    """k-means (k-means++ start, fixed seed) of (N, 3) uint8 pixels in CIELAB -> (colors, 3) uint8."""
    rng = np.random.default_rng(0)
    lab = srgb_to_lab(pixels)
    centres = [lab[rng.integers(len(lab))]]
    for _ in range(colors - 1):
        d = np.min([((lab - c) ** 2).sum(axis=1) for c in centres], axis=0)
        centres.append(lab[rng.choice(len(lab), p=d / d.sum())])
    centres = np.array(centres)
    for _ in range(iterations):
        labels = ((lab[:, None, :] - centres[None]) ** 2).sum(axis=2).argmin(axis=1)
        for k in range(colors):
            members = lab[labels == k]
            if len(members):
                centres[k] = members.mean(axis=0)
    rgb = np.unique(lab_to_srgb(centres), axis=0)
    return rgb[np.argsort(srgb_to_lab(rgb)[:, 0])]  # dark to light


# ---- geometry -------------------------------------------------------------------------------------------

def grid_reduce(image: Image.Image, size: tuple[int, int], cell: int = CELL) -> Image.Image:
    """RGBA image -> RGBA of `size`; each pixel = median of the opaque pixels of a cell x cell block."""
    big = image.convert("RGBA").resize((size[0] * cell, size[1] * cell), Image.Resampling.LANCZOS)
    px = np.asarray(big).astype(np.float64)
    opaque = px[..., 3] >= config.ALPHA_THRESHOLD
    rgb = np.where(opaque[..., None], px[..., :3], np.nan)
    h, w = size[1], size[0]
    blocks = rgb.reshape(h, cell, w, cell, 3).transpose(0, 2, 1, 3, 4).reshape(h, w, cell * cell, 3)
    coverage = opaque.reshape(h, cell, w, cell).mean(axis=(1, 3))
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)  # all-transparent blocks: median of nothing
        median = np.nanmedian(blocks, axis=2)
    out = np.zeros((h, w, 4), dtype=np.uint8)
    solid = coverage >= 0.5
    out[solid, :3] = np.clip(np.round(median[solid]), 0, 255).astype(np.uint8)
    out[solid, 3] = 255
    return Image.fromarray(out, "RGBA")


def crop_aspect(image: Image.Image, aspect_w: int, aspect_h: int) -> Image.Image:
    """Largest centred crop with the aspect ratio aspect_w:aspect_h."""
    w, h = image.size
    if w * aspect_h > h * aspect_w:  # too wide
        new_w = h * aspect_w // aspect_h
        return image.crop(((w - new_w) // 2, 0, (w - new_w) // 2 + new_w, h))
    new_h = w * aspect_h // aspect_w
    return image.crop((0, (h - new_h) // 2, w, (h - new_h) // 2 + new_h))


def crop_16_9(image: Image.Image) -> Image.Image:
    return crop_aspect(image, 16, 9)


# ---- cutout (same approach as ASE-Tamer-Project/tools/monster-gen) ------------------------------------

def hard_alpha(alpha: Image.Image) -> Image.Image:
    return alpha.point(lambda a: 255 if a >= config.ALPHA_THRESHOLD else 0)


def keep_main_parts(alpha: Image.Image) -> Image.Image:
    """Drop opaque fragments much smaller than the main body (specks, ground lines)."""
    from scipy import ndimage

    labels, count = ndimage.label(np.asarray(alpha) > 0)
    if count == 0:
        return alpha
    sizes = ndimage.sum(np.ones_like(labels), labels, index=range(1, count + 1))
    keep = [i + 1 for i, n in enumerate(sizes) if n >= KEEP_FRACTION * sizes.max()]
    return Image.fromarray(np.where(np.isin(labels, keep), 255, 0).astype(np.uint8))


def fill_holes(alpha: Image.Image, soft_alpha: Image.Image, raw: Image.Image) -> Image.Image:
    """Make opaque the enclosed transparent pixels that are not background colour.

    rembg gives light parts (shirt collar, highlights) a partial alpha that the threshold turns into holes;
    real openings show the background colour and were fully transparent for rembg, so they stay open.
    """
    padded = Image.new("L", (alpha.width + 2, alpha.height + 2), 0)
    padded.paste(alpha, (1, 1))
    ImageDraw.floodfill(padded, (0, 0), 128)
    outside = np.asarray(padded)[1:-1, 1:-1] == 128
    rgb = np.asarray(raw.convert("RGB")).astype(int)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    distance = np.abs(rgb - np.median(border, axis=0)).sum(axis=2)
    opaque = np.asarray(alpha) > 0
    holes = ~outside & ~opaque
    filled = opaque | (holes & ((np.asarray(soft_alpha) > OPENING_MAX_ALPHA) | (distance > BACKGROUND_TOLERANCE)))
    return Image.fromarray(np.where(filled, 255, 0).astype(np.uint8))


def remove_stray_pixels(image: Image.Image) -> Image.Image:
    """Clear opaque pixels with no opaque 4-neighbour."""
    px = np.asarray(image).copy()
    opaque = px[..., 3] > 0
    p = np.pad(opaque, 1)
    neighbours = p[:-2, 1:-1].astype(int) + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]
    px[opaque & (neighbours == 0)] = 0
    return Image.fromarray(px, "RGBA")


def cut_out(raw: Image.Image, session) -> tuple[Image.Image, Image.Image]:
    """-> (full-size cutout RGBA, subject cropped to its bounding box)."""
    from rembg import remove

    soft = remove(raw, session=session).convert("RGBA").getchannel("A")
    alpha = fill_holes(keep_main_parts(hard_alpha(soft)), soft, raw)
    subject = raw.convert("RGBA")
    subject.putalpha(alpha)  # colours from the raw image: rembg darkens the pixels it made transparent
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("background removal left an empty image")
    return subject, subject.crop(bbox)


def fit(subject: Image.Image, box: tuple[int, int], canvas: tuple[int, int], anchor: str) -> Image.Image:
    """Grid-reduce `subject` to fit inside `box`, then place it on a transparent `canvas`."""
    scale = min(box[0] / subject.width, box[1] / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    small = remove_stray_pixels(grid_reduce(subject, size))
    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    x = (canvas[0] - size[0]) // 2
    y = canvas[1] - size[1] if anchor == "bottom" else (canvas[1] - size[1]) // 2
    out.paste(small, (x, y), small)
    return out


PORTRAIT_TOP_MARGIN = 0.05  # space above the hat, as a share of the image height
PORTRAIT_DEPTH = 0.82       # how much of the figure below the hat top enters the frame (head + shoulders)


def frame_portrait(raw: Image.Image, alpha: Image.Image) -> Image.Image:
    """Portraits keep the generated backdrop: cutting them out ate pale clothes on pale grounds (the first
    Enfield portrait lost a shoulder). The mask is used only to find the hat top and the head centre."""
    width, height = raw.size
    mask = np.asarray(alpha) >= config.ALPHA_THRESHOLD
    rows = np.flatnonzero(mask.any(axis=1))
    top = int(rows[0]) if rows.size else 0
    head = mask[top: top + max(1, (height - top) // 4)]  # top quarter of the figure: hat and head
    cols = np.flatnonzero(head.any(axis=0))
    centre = (cols[0] + cols[-1]) / 2 if cols.size else width / 2

    aspect = config.PORTRAIT_SIZE[0] / config.PORTRAIT_SIZE[1]
    y0 = max(0, top - round(PORTRAIT_TOP_MARGIN * height))
    h = min(height - y0, round((height - top) * PORTRAIT_DEPTH) + (top - y0))
    w = round(h * aspect)
    if w > width:
        w = width
        h = round(w / aspect)
    x0 = int(min(max(0, centre - w / 2), width - w))
    return grid_reduce(raw.convert("RGBA").crop((x0, y0, x0 + w, y0 + h)), config.PORTRAIT_SIZE)


def reduce(kind: str, raw: Image.Image, session, height: int | None = None) -> tuple[Image.Image, Image.Image | None]:
    """-> (reduced image, full-size cutout or None). `height`: character height in px instead of
    CHARACTER_HEIGHT (request key `height`, e.g. 51 for a figure 80% as tall as the others)."""
    if kind == "background":
        return grid_reduce(crop_16_9(raw.convert("RGBA")), config.BACKGROUND_SIZE), None
    if kind == "illustration":
        return grid_reduce(crop_aspect(raw.convert("RGBA"), 4, 5), config.ILLUSTRATION_SIZE), None
    cutout, subject = cut_out(raw, session)
    if kind == "portrait":
        return frame_portrait(raw, cutout.getchannel("A")), cutout
    if kind == "character":
        height = height or config.CHARACTER_HEIGHT
        width = max(1, round(subject.width * height / subject.height))
        return remove_stray_pixels(grid_reduce(subject, (width, height))), cutout
    inner = (config.ITEM_SIZE[0] - 2, config.ITEM_SIZE[1] - 2)
    return fit(subject, inner, config.ITEM_SIZE, "centre"), cutout


def apply_palette(image: Image.Image, palette: np.ndarray | None) -> Image.Image:
    px = np.asarray(image.convert("RGBA")).copy()
    opaque = px[..., 3] > 0
    if not opaque.any():
        return image
    if palette is None:  # no palette.hex yet: per-image palette, only to get a preview
        sample = Image.fromarray(px[opaque][None, :, :3])
        pal = sample.quantize(colors=config.PALETTE_COLORS, method=Image.Quantize.MEDIANCUT)
        palette = np.array(pal.getpalette()[: 3 * config.PALETTE_COLORS], dtype=np.uint8).reshape(-1, 3)
    px[opaque, :3] = nearest_palette(px[opaque, :3], palette)
    return Image.fromarray(px, "RGBA")


def despeckle(image: Image.Image, passes: int = 1) -> Image.Image:
    """Remove isolated pixels after the palette step (request key `despeckle: <passes>`): a pixel whose colour
    appears at most once among its 8 neighbours (itself + 1) takes the most frequent colour of its neighbours,
    if that colour fills at least 4 of them. Lines 1 px wide have 2 same-colour neighbours and stay; only
    their end points and lone dots go. Transparent pixels are left alone."""
    px = np.asarray(image.convert("RGBA")).copy()
    h, w, _ = px.shape
    for _ in range(passes):
        opaque = px[..., 3] > 0
        colours, idx = np.unique(px[..., :3].reshape(-1, 3), axis=0, return_inverse=True)
        idx = idx.reshape(h, w)
        pad = np.pad(idx, 1, mode="edge")
        shifts = [pad[1 + dy:1 + dy + h, 1 + dx:1 + dx + w] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy, dx) != (0, 0)]
        counts = np.stack([sum((s == k).astype(np.int8) for s in shifts) for k in range(len(colours))])  # (K, h, w)
        same = np.take_along_axis(counts, idx[None], axis=0)[0]
        mode = counts.argmax(axis=0)
        top = counts.max(axis=0)
        fix = opaque & (same <= 1) & (top >= 4)
        px[fix, :3] = colours[mode[fix]]
    return Image.fromarray(px, "RGBA")


def extend_palette(paths: list, colors: int, iterations: int = 40) -> np.ndarray:
    """Constrained k-means: the current palette.hex colours are fixed centres, `colors` new centres move.
    New centres start k-means++ style from the pixels farthest from every centre so far (fixed seed)."""
    old = np.array(config.load_palette(), dtype=np.uint8)
    pixels = np.concatenate([np.asarray(Image.open(p).convert("RGB")).reshape(-1, 3) for p in paths])
    lab = srgb_to_lab(pixels)
    fixed = srgb_to_lab(old)
    rng = np.random.default_rng(0)
    centres = list(fixed)
    for _ in range(colors):
        d = np.min([((lab - c) ** 2).sum(axis=1) for c in centres], axis=0)
        centres.append(lab[rng.choice(len(lab), p=d / d.sum())])
    centres = np.array(centres)
    for _ in range(iterations):
        labels = ((lab[:, None, :] - centres[None]) ** 2).sum(axis=2).argmin(axis=1)
        for k in range(len(fixed), len(centres)):
            members = lab[labels == k]
            if len(members):
                centres[k] = members.mean(axis=0)
    labels = ((lab[:, None, :] - centres[None]) ** 2).sum(axis=2).argmin(axis=1)
    new = lab_to_srgb(centres[len(fixed):])
    for k, rgb in enumerate(new):
        share = (labels == len(fixed) + k).mean()
        print(f"  new colour {rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}: {share:.1%} of the source pixels")
    return new


def make_palette(colors: int, sprite_share: float) -> None:
    """k-means palette from the reduced backgrounds, plus the chosen sprites when sprite_share > 0.

    Backgrounds with a choice in selections.yaml give only the chosen variant. Sprites (characters,
    portraits, items) count only when chosen; their pixels are repeated so that together they weigh
    `sprite_share` of the total (a 10x64 figure is otherwise invisible next to a 480x270 background).
    """
    selections = config.load_selections()

    def chosen(kind: str, only_selected: bool) -> list:
        out = []
        for path in sorted((config.REDUCED_DIR / kind).glob("*.png")):
            asset_id, variant = config.parse_file_name(path)
            if asset_id in selections:
                if selections[asset_id]["variant"] == variant:
                    out.append(path)
            elif not only_selected:
                out.append(path)
        return out

    backgrounds = chosen("background", only_selected=False)
    if not backgrounds:
        raise SystemExit("no reduced backgrounds: run postprocess.py --kind background first")
    pixels = np.concatenate([np.asarray(Image.open(p).convert("RGB")).reshape(-1, 3) for p in backgrounds])
    sprites = []
    if sprite_share > 0:
        sprites = [p for kind in ("character", "portrait", "item") for p in chosen(kind, only_selected=True)]
    if sprites:
        sprite_px = np.concatenate([np.asarray(Image.open(p).convert("RGBA")).reshape(-1, 4) for p in sprites])
        sprite_px = sprite_px[sprite_px[:, 3] > 0, :3]
        repeat = max(1, round(sprite_share * len(pixels) / ((1 - sprite_share) * len(sprite_px))))
        pixels = np.concatenate([pixels, np.repeat(sprite_px, repeat, axis=0)])
    palette = kmeans_palette(pixels, colors)
    lines = [f"{r:02x}{g:02x}{b:02x}" for r, g, b in palette]
    config.PALETTE_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    used = ", ".join(p.name for p in backgrounds + sprites)
    print(f"palette.hex: {len(palette)} colours from {used} (sprite share {sprite_share:.0%}), "
          f"{date.today().isoformat()}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--kind", choices=config.KINDS, help="only this kind")
    parser.add_argument("--ids", help="comma-separated asset ids")
    parser.add_argument("--force", action="store_true", help="redo the reduce stage too")
    parser.add_argument("--make-palette", action="store_true", help="rebuild palette.hex from the backgrounds")
    parser.add_argument("--colors", type=int, default=config.PALETTE_COLORS, help="colours for --make-palette")
    parser.add_argument("--extend-palette", type=int, metavar="N",
                        help="append N colours to palette.hex from the reduced images of --ids (k-means)")
    parser.add_argument("--dry-palette", action="store_true",
                        help="with --extend-palette: print the colours, do not write palette.hex")
    parser.add_argument("--sprite-share", type=float, default=0.0,
                        help="with --make-palette: weight of the chosen sprites in the palette, e.g. 0.15")
    args = parser.parse_args()

    requests = config.load_requests()
    wanted = {r["id"] for r in config.select_requests(requests, args.ids, args.kind)}
    raws = [p for kind in config.KINDS for p in sorted((config.RAW_DIR / kind).glob("*.png"))
            if config.parse_file_name(p)[0] in wanted]
    if not raws:
        raise SystemExit("no raw images for the chosen assets: run generate.py first")

    session = None
    start = time.perf_counter()
    for done, raw_path in enumerate(raws, start=1):
        kind = raw_path.parent.name
        reduced_path = config.REDUCED_DIR / kind / raw_path.name
        if reduced_path.exists() and not args.force:
            continue
        if kind not in NO_CUTOUT and session is None:
            from rembg import new_session

            session = new_session(config.REMBG_MODEL)
        t = time.perf_counter()
        try:
            reduced, cutout = reduce(kind, Image.open(raw_path).convert("RGB"), session,
                                     requests[config.parse_file_name(raw_path)[0]].get("height"))
        except ValueError as exc:
            print(f"[{done}/{len(raws)}] {raw_path.name} FAILED: {exc}")
            continue
        reduced_path.parent.mkdir(parents=True, exist_ok=True)
        reduced.save(reduced_path)
        if cutout is not None:
            (config.CUTOUT_DIR / kind).mkdir(parents=True, exist_ok=True)
            cutout.save(config.CUTOUT_DIR / kind / raw_path.name)
        print(f"[{done}/{len(raws)}] reduced {kind}/{raw_path.name} -> {reduced.width}x{reduced.height} "
              f"({time.perf_counter() - t:.1f}s)", flush=True)

    if args.make_palette:
        make_palette(args.colors, args.sprite_share)
    if args.extend_palette:
        selections = config.load_selections()
        sources = []
        for raw_path in raws:
            asset_id, variant = config.parse_file_name(raw_path)
            if asset_id in selections and selections[asset_id]["variant"] != variant:
                continue
            sources.append(config.REDUCED_DIR / raw_path.parent.name / raw_path.name)
        print(f"extending palette.hex by {args.extend_palette} colours from {', '.join(p.name for p in sources)}")
        new = extend_palette(sources, args.extend_palette)
        if args.dry_palette:
            return
        with config.PALETTE_FILE.open("a", encoding="utf-8") as f:
            f.write("".join(f"{r:02x}{g:02x}{b:02x}\n" for r, g, b in new))
    palette = config.load_palette()
    if palette is None:
        print("WARNING: no palette.hex, each image gets its own palette (run with --make-palette)")
    palette = np.array(palette, dtype=np.uint8) if palette else None

    # The palette stage is cheap: always redone, so a new palette.hex reaches every image.
    for raw_path in raws:
        kind = raw_path.parent.name
        reduced_path = config.REDUCED_DIR / kind / raw_path.name
        if not reduced_path.exists():
            continue
        out = config.PROCESSED_DIR / kind / raw_path.name
        out.parent.mkdir(parents=True, exist_ok=True)
        size = requests[config.parse_file_name(raw_path)[0]].get("palette_size")
        result = apply_palette(Image.open(reduced_path), palette[:size] if size and palette is not None else palette)
        if requests[config.parse_file_name(raw_path)[0]].get("despeckle"):
            result = despeckle(result, requests[config.parse_file_name(raw_path)[0]]["despeckle"])
        result.save(out)
    print(f"done in {time.perf_counter() - start:.1f}s -> {config.PROCESSED_DIR}")


if __name__ == "__main__":
    main()
