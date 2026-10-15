"""Derive idle and walk frames from a character's base pose (side view, facing right, 64 px tall).

Input:  output/processed/character/<id>_v<n>.png, the variant chosen in data/selections.yaml (or --variant);
        `flip: true` in selections.yaml mirrors it first (the game expects characters facing right).
Output: output/anim/<id>.png          spritesheet, frames side by side
        output/anim/<id>.json         Phaser atlas, JSON "hash" format (same as Aseprite's export)
        output/anim/<id>_preview.png  frames at 4x with their names, to check by eye
        output/anim/<id>_preview.gif  animation at 4x (idle twice, then walk twice)

Frames (bands from prompts/characters.yaml -> anim, as fractions of the height from the top):
    idle_0  base pose
    idle_1  rows above `chest` sink by 1 px (breathing)
    walk_0  legs apart: below `hip` the front half of the legs is sheared forward, the back half backward,
            up to WALK_STRIDE px at the feet; the back half is darkened (far leg)
    walk_1  legs together, body above `hip` raised by 1 px
    walk_2  as walk_0 with the other leg in front: the front half is now the far leg (darker, behind)
    walk_3  as walk_1
All frames have the same size; the feet are on the last row and centred, so the origin is (0.5, 1).

Example:
    uv run animate.py --ids utterson
    uv run animate.py --ids utterson --variant 1
"""

from __future__ import annotations

import argparse
import json
from datetime import date

import numpy as np
from PIL import Image, ImageDraw

import config
from postprocess import nearest_palette

WALK_STRIDE = 2       # px of horizontal shift at the feet in walk_0 / walk_2
FAR_LEG_SHADE = 0.72  # brightness of the far leg before mapping back to the palette
DURATION_MS = {"idle": 600, "walk": 140}
DEFAULT_BANDS = {"chest": 0.30, "hip": 0.62}


def shift_above(px: np.ndarray, row: int, dy: int) -> np.ndarray:
    """Move every row above `row` by dy (+1 down, -1 up); the gap is closed by stretching row `row`."""
    out = px.copy()
    if dy > 0:   # rows [0, row) move down by one; the original row `row` is lost
        out[1:row + 1] = px[0:row]
        out[0] = 0
    elif dy < 0:  # rows [1, row] move up by one, row `row` is duplicated
        out[0:row] = px[1:row + 1]
    return out


def shear_legs(px: np.ndarray, hip: int, stride: int, far_is_front: bool, palette) -> np.ndarray:
    """Split the legs (rows >= hip) at their middle column and shear the halves apart."""
    h, w, _ = px.shape
    out = px.copy()
    out[hip:] = 0
    legs = px[hip:]
    cols = np.where((legs[..., 3] > 0).any(axis=0))[0]
    if len(cols) == 0:
        return px
    middle = (cols.min() + cols.max() + 1) / 2
    halves = []
    for front in (False, True):
        part = legs.copy()
        mask = (np.arange(w) >= middle) if front else (np.arange(w) < middle)
        part[:, ~mask] = 0
        far = front == far_is_front
        if far and palette is not None:
            opaque = part[..., 3] > 0
            darker = (part[opaque, :3].astype(float) * FAR_LEG_SHADE).astype(np.uint8)
            part[opaque, :3] = nearest_palette(darker, palette)
        sheared = np.zeros_like(part)
        rows = len(part)
        for r in range(rows):
            offset = round(stride * (r + 1) / rows) * (1 if front else -1)
            src = part[r]
            if offset > 0:
                sheared[r, offset:] = src[:w - offset]
            elif offset < 0:
                sheared[r, :w + offset] = src[-offset:]
            else:
                sheared[r] = src
        halves.append((far, sheared))
    # far leg first, near leg on top
    for _, layer in sorted(halves, key=lambda item: not item[0]):
        opaque = layer[..., 3] > 0
        out[hip:][opaque] = layer[opaque]
    return out


def build_frames(base: Image.Image, bands: dict, palette) -> tuple[dict[str, np.ndarray], tuple[int, int]]:
    px0 = np.asarray(base.convert("RGBA"))
    h, w, _ = px0.shape
    bottom = px0[-3:, :, 3] > 0
    feet = np.where(bottom.any(axis=0))[0]
    foot_x = (feet.min() + feet.max() + 1) / 2 if len(feet) else w / 2
    pad = WALK_STRIDE + 1
    half = int(np.ceil(max(foot_x, w - foot_x))) + pad
    frame_w, frame_h = 2 * half, h + 1  # +1 row on top for the raised body
    left = int(round(half - foot_x))

    canvas = np.zeros((frame_h, frame_w, 4), dtype=np.uint8)
    canvas[1:, left:left + w] = px0
    chest = 1 + round(bands["chest"] * h)
    hip = 1 + round(bands["hip"] * h)

    stride_near = shear_legs(canvas, hip, WALK_STRIDE, far_is_front=False, palette=palette)
    stride_far = shear_legs(canvas, hip, WALK_STRIDE, far_is_front=True, palette=palette)
    passing = shift_above(canvas, hip, -1)
    frames = {
        "idle_0": canvas,
        "idle_1": shift_above(canvas, chest, +1),
        "walk_0": stride_near,
        "walk_1": passing,
        "walk_2": stride_far,
        "walk_3": passing,
    }
    return frames, (frame_w, frame_h)


def write_atlas(asset_id: str, variant: int, frames: dict[str, np.ndarray], size: tuple[int, int],
                source: str) -> None:
    frame_w, frame_h = size
    names = list(frames)
    sheet = Image.new("RGBA", (frame_w * len(names), frame_h), (0, 0, 0, 0))
    atlas_frames = {}
    for i, name in enumerate(names):
        sheet.paste(Image.fromarray(frames[name], "RGBA"), (i * frame_w, 0))
        rect = {"x": i * frame_w, "y": 0, "w": frame_w, "h": frame_h}
        atlas_frames[name] = {
            "frame": rect,
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": frame_w, "h": frame_h},
            "sourceSize": {"w": frame_w, "h": frame_h},
            "anchor": {"x": 0.5, "y": 1.0},  # Phaser reads `anchor` as the frame pivot: feet, centred
            "duration": DURATION_MS[name.split("_")[0]],
        }
    tags, start = [], 0
    for tag in ("idle", "walk"):
        count = sum(1 for n in names if n.startswith(tag + "_"))
        tags.append({"name": tag, "from": start, "to": start + count - 1, "direction": "forward"})
        start += count
    atlas = {
        "frames": atlas_frames,
        "meta": {
            "app": "jekyll-e-hyde tools/assets/animate.py",
            "version": "1",
            "image": f"{asset_id}.png",
            "format": "RGBA8888",
            "size": {"w": sheet.width, "h": sheet.height},
            "scale": "1",
            "frameTags": tags,
            "source": {"file": source, "variant": variant, "date": date.today().isoformat()},
        },
    }
    config.ANIM_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(config.ANIM_DIR / f"{asset_id}.png")
    (config.ANIM_DIR / f"{asset_id}.json").write_text(json.dumps(atlas, indent=2) + "\n", encoding="utf-8")

    # previews for checking by eye
    scale = 4
    label_h = 20
    preview = Image.new("RGB", (sheet.width * scale + (len(names) - 1) * 8, frame_h * scale + label_h), (96, 120, 96))
    draw = ImageDraw.Draw(preview)
    for i, name in enumerate(names):
        x = i * (frame_w * scale + 8)
        tile = Image.fromarray(frames[name], "RGBA").resize((frame_w * scale, frame_h * scale), Image.Resampling.NEAREST)
        preview.paste(tile, (x, label_h), tile)
        draw.text((x + 2, 4), name, fill=(255, 255, 255))
    preview.save(config.ANIM_DIR / f"{asset_id}_preview.png")
    order = ["idle_0", "idle_1"] * 2 + ["walk_0", "walk_1", "walk_2", "walk_3"] * 3
    gif = []
    for name in order:
        tile = Image.new("RGBA", (frame_w * scale, frame_h * scale), (96, 120, 96, 255))
        big = Image.fromarray(frames[name], "RGBA").resize(tile.size, Image.Resampling.NEAREST)
        tile.paste(big, (0, 0), big)
        gif.append(tile.convert("RGB"))
    gif[0].save(config.ANIM_DIR / f"{asset_id}_preview.gif", save_all=True, append_images=gif[1:], loop=0,
                duration=[DURATION_MS[n.split("_")[0]] for n in order])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ids", required=True, help="comma-separated character ids")
    parser.add_argument("--variant", type=int, help="variant to animate (default: data/selections.yaml)")
    args = parser.parse_args()

    requests = config.load_requests()
    characters = config.load_yaml(config.CHARACTERS_FILE)
    selections = config.load_selections()
    palette = config.load_palette()
    palette = np.array(palette, dtype=np.uint8) if palette else None

    for request in config.select_requests(requests, args.ids, None):
        asset_id = request["id"]
        if request["kind"] != "character":
            print(f"{asset_id}: kind {request['kind']}, skipped (only characters are animated)")
            continue
        choice = selections.get(asset_id, {"variant": 0, "flip": False})
        variant = args.variant if args.variant is not None else choice["variant"]
        path = config.PROCESSED_DIR / "character" / config.file_name(asset_id, variant)
        if not path.exists():
            raise SystemExit(f"{path} missing: run generate.py and postprocess.py first")
        base = Image.open(path).convert("RGBA")
        if choice["flip"]:
            base = base.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        bands = {**DEFAULT_BANDS, **(characters.get(request.get("character", asset_id), {}).get("anim") or {})}
        frames, size = build_frames(base, bands, palette)
        source = str(path.relative_to(config.ROOT)).replace("\\", "/")
        write_atlas(asset_id, variant, frames, size, source)
        print(f"{asset_id} v{variant}: {len(frames)} frames {size[0]}x{size[1]} -> {config.ANIM_DIR / asset_id}.png/.json")


if __name__ == "__main__":
    main()
