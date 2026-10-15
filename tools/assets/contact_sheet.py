"""Generate contact sheets for generated asset variants to facilitate visual inspection.

Output: output/sheets/<id>.png showing all variants side-by-side with variant numbers
and highlighting the chosen one from data/selections.yaml.
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

        # Scale up small images for better visibility (items 8x, characters 4x, portraits 2x, backgrounds 1x)
        scale = 1
        if req_kind == "item":
            scale = 8
        elif req_kind == "character":
            scale = 4
        elif req_kind == "portrait":
            scale = 2

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
            if req_kind in ("character", "portrait", "item"):
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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ids", help="comma-separated asset ids")
    parser.add_argument("--kind", choices=config.KINDS, help="only this kind")
    args = parser.parse_args()
    make_contact_sheets(args.ids, args.kind)


if __name__ == "__main__":
    main()
