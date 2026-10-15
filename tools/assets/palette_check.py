"""Effect of a palette change on the approved assets, before re-exporting them.

For every asset with a choice in data/selections.yaml (or only --ids), the reduced image (final size, colours
before the palette) is mapped to palette.hex into output/palette_check/<kind>/<id>.png, and compared with the
current output/processed/<kind>/<id>_v<n>.png (made with the previous palette). Printed per asset:

    changed   share of opaque pixels whose colour is now different
    error     mean CIELAB distance between the reduced image and its palette version, before -> after
              (lower = closer to the colours SDXL drew)
    new       share of pixels that took one of the colours added to palette.hex after line --old-count

Nothing is written to assets/: re-export with export.py (and animate.py for characters) after looking at
output/palette_check/.

    uv run palette_check.py --old-count 32
"""

from __future__ import annotations

import argparse

import numpy as np
from PIL import Image

import config
from postprocess import apply_palette, srgb_to_lab


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ids", help="comma-separated asset ids (default: every chosen asset)")
    parser.add_argument("--old-count", type=int, default=32, help="colours of palette.hex before the change")
    args = parser.parse_args()

    palette = np.array(config.load_palette(), dtype=np.uint8)
    added = {tuple(c) for c in palette[args.old_count:]}
    selections = config.load_selections()
    requests = config.load_requests()
    ids = [x.strip() for x in args.ids.split(",")] if args.ids else list(selections)
    out_dir = config.OUTPUT_DIR / "palette_check"
    print(f"{'asset':28} {'changed':>8} {'error before -> after':>22} {'new colours':>12}")
    for asset_id in ids:
        kind = requests[asset_id]["kind"]
        name = config.file_name(asset_id, selections[asset_id]["variant"])
        reduced_path, old_path = config.REDUCED_DIR / kind / name, config.PROCESSED_DIR / kind / name
        if not reduced_path.exists() or not old_path.exists():
            print(f"{asset_id:28} missing reduced or processed image")
            continue
        reduced = np.asarray(Image.open(reduced_path).convert("RGBA"))
        new_img = apply_palette(Image.open(reduced_path), palette)  # full palette, ignoring palette_size
        (out_dir / kind).mkdir(parents=True, exist_ok=True)
        new_img.save(out_dir / kind / f"{asset_id}.png")
        new = np.asarray(new_img.convert("RGBA"))
        old = np.asarray(Image.open(old_path).convert("RGBA"))
        opaque = reduced[..., 3] > 0
        changed = (np.abs(new[..., :3].astype(int) - old[..., :3]).sum(axis=2) > 0)[opaque].mean()
        lab = srgb_to_lab(reduced[..., :3][opaque])
        err_old = np.sqrt(((lab - srgb_to_lab(old[..., :3][opaque])) ** 2).sum(axis=1)).mean()
        err_new = np.sqrt(((lab - srgb_to_lab(new[..., :3][opaque])) ** 2).sum(axis=1)).mean()
        took_new = np.array([tuple(p) in added for p in new[..., :3][opaque]]).mean()
        print(f"{asset_id:28} {changed:8.1%} {err_old:10.2f} -> {err_new:<9.2f} {took_new:12.1%}")
    print(f"-> {out_dir}")


if __name__ == "__main__":
    main()
