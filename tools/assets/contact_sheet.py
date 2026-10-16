"""Generate contact sheets for generated asset variants to facilitate visual inspection.

Output: output/sheets/<id>.png showing all variants side-by-side with variant numbers
and highlighting the chosen one from data/selections.yaml.

--summary NAME: one sheet output/sheets/NAME.png with only the chosen variant of each asset (in the order of
--ids), enlarged --scale times, in rows at most --max-width pixels wide. Example:
    uv run contact_sheet.py --summary c1_illustrations --kind illustration --scale 2
"""

from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

import config


def make_contact_sheets(ids: str | None = None, kind: str | None = None) -> None:
    requests = config.load_requests()
    selections = config.load_selections()
    selected_requests = config.select_requests(requests, ids, kind)

    config.SHEETS_DIR.mkdir(parents=True, exist_ok=True)

    for req in selected_requests:
        asset_id = req["id"]
        req_kind = req["kind"]
        choice = selections.get(asset_id, {}).get("variant")

        # Prefer processed images, fall back to reduced or raw
        source_dir = config.PROCESSED_DIR / req_kind
        if not source_dir.exists():
            source_dir = config.REDUCED_DIR / req_kind
        if not source_dir.exists():
            source_dir = config.RAW_DIR / req_kind

        variants = sorted(source_dir.glob(f"{asset_id}_v*.png"))
        if not variants:
            continue

        images = []
        for vpath in variants:
            _, vnum = config.parse_file_name(vpath)
            im = Image.open(vpath).convert("RGBA")
            images.append((vnum, im))

        if not images:
            continue

        # Scale up small images for better visibility (items 8x, characters 4x, portraits and illustrations 2x, backgrounds 1x)
        scale = 1
        if req_kind == "item":
            scale = 8
        elif req_kind == "character":
            scale = 4
        elif req_kind in ("portrait", "illustration"):
            scale = 2
        elif req_kind == "prop":
            scale = 4

        scaled_imgs = []
        for vnum, im in images:
            w, h = im.size
            scaled = im.resize((w * scale, h * scale), Image.Resampling.NEAREST)
            scaled_imgs.append((vnum, scaled))

        tile_w = max(im.width for _, im in scaled_imgs)
        tile_h = max(im.height for _, im in scaled_imgs)
        pad = 16
        header_h = 28

        sheet_w = len(scaled_imgs) * (tile_w + pad) + pad
        sheet_h = tile_h + header_h + pad * 2

        sheet = Image.new("RGBA", (sheet_w, sheet_h), (24, 20, 28, 255))
        draw = ImageDraw.Draw(sheet)

        for i, (vnum, im) in enumerate(scaled_imgs):
            x = pad + i * (tile_w + pad)
            y = pad + header_h

            is_chosen = (vnum == choice)
            border_color = (201, 162, 74) if is_chosen else (80, 70, 60) # gold accent or dark border
            border_width = 3 if is_chosen else 1

            # Background checkerboard for transparent images
            if req_kind in ("character", "portrait", "item", "prop"):
                checker = Image.new("RGBA", (im.width, im.height), (40, 36, 44, 255))
                sheet.paste(checker, (x, y))

            sheet.paste(im, (x, y), im)
            draw.rectangle([x - border_width, y - border_width, x + im.width + border_width - 1, y + im.height + border_width - 1], outline=border_color, width=border_width)

            label = f"v{vnum}" + (" (SELECTED)" if is_chosen else "")
            draw.text((x + 2, y - 22), label, fill=border_color)

        title = f"{asset_id} ({req_kind})"
        draw.text((pad, 4), title, fill=(232, 224, 204))

        out_path = config.SHEETS_DIR / f"{asset_id}.png"
        sheet.save(out_path)
        print(f"contact sheet -> {out_path}")


def make_summary(name: str, ids: str | None, kind: str | None, scale: int, max_width: int) -> None:
    """Chosen variants only, enlarged with nearest neighbour, wrapped in rows, id under each tile."""
    selections = config.load_selections()
    tiles = []
    for req in config.select_requests(config.load_requests(), ids, kind):
        choice = selections.get(req["id"])
        path = config.PROCESSED_DIR / req["kind"] / config.file_name(req["id"], choice["variant"]) if choice else None
        if path is None or not path.exists():
            print(f"skipping {req['id']}: no chosen processed variant")
            continue
        im = Image.open(path).convert("RGBA")
        if choice["flip"]:
            im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        tiles.append((f"{req['id']} v{choice['variant']}", im.resize((im.width * scale, im.height * scale),
                                                                      Image.Resampling.NEAREST)))
    if not tiles:
        raise SystemExit("nothing to put in the summary")
    pad, label_h = 16, 20
    rows, row, width = [], [], pad
    for tile in tiles:
        if row and width + tile[1].width + pad > max_width:
            rows.append(row)
            row, width = [], pad
        row.append(tile)
        width += tile[1].width + pad
    rows.append(row)
    sheet_w = max(pad + sum(t.width + pad for _, t in r) for r in rows)
    sheet_h = pad + sum(max(t.height for _, t in r) + label_h + pad for r in rows)
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (24, 20, 28, 255))
    draw = ImageDraw.Draw(sheet)
    y = pad
    for r in rows:
        x = pad
        for label, im in r:
            sheet.paste(im, (x, y), im)
            draw.text((x, y + im.height + 4), label, fill=(232, 224, 204))
            x += im.width + pad
        y += max(t.height for _, t in r) + label_h + pad
    config.SHEETS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = config.SHEETS_DIR / f"{name}.png"
    sheet.save(out_path)
    print(f"summary sheet ({len(tiles)} assets, x{scale}) -> {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ids", help="comma-separated asset ids")
    parser.add_argument("--kind", choices=config.KINDS, help="only this kind")
    parser.add_argument("--summary", metavar="NAME", help="one sheet of the chosen variants: output/sheets/NAME.png")
    parser.add_argument("--scale", type=int, default=2, help="with --summary: enlargement factor (default 2)")
    parser.add_argument("--max-width", type=int, default=1400, help="with --summary: row width in pixels")
    args = parser.parse_args()
    if args.summary:
        make_summary(args.summary, args.ids, args.kind, args.scale, args.max_width)
    else:
        make_contact_sheets(args.ids, args.kind)


if __name__ == "__main__":
    main()
