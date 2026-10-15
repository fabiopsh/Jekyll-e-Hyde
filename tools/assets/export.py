"""Export chosen asset variants to the game's assets/ folder and write assets/manifest.json.

Reads data/selections.yaml and data/assets.yaml.
Copies:
  background -> assets/backgrounds/<id>.png
  character  -> assets/characters/<id>.png, assets/characters/<id>.json (from output/anim/)
  portrait   -> assets/portraits/<id>.png
  item       -> assets/items/<id>.png
  illustration -> assets/illustrations/<id>.png
"""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import config


def export_assets(ids: str | None = None) -> None:
    requests = config.load_requests()
    selections = config.load_selections()
    raw_manifest = config.manifest_entries()

    selected_requests = config.select_requests(requests, ids, None)
    config.GAME_ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    manifest_records = []
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    for req in selected_requests:
        asset_id = req["id"]
        kind = req["kind"]
        if asset_id not in selections:
            print(f"skipping {asset_id}: no selection in data/selections.yaml")
            continue

        choice = selections[asset_id]
        variant = choice["variant"]
        meta = raw_manifest.get((asset_id, variant), {})

        folder_name = config.GAME_FOLDERS.get(kind, f"{kind}s")
        target_dir = config.GAME_ASSETS_DIR / folder_name
        target_dir.mkdir(parents=True, exist_ok=True)

        if kind == "character":
            # Animated spritesheet + atlas
            sheet_src = config.ANIM_DIR / f"{asset_id}.png"
            json_src = config.ANIM_DIR / f"{asset_id}.json"
            if not sheet_src.exists() or not json_src.exists():
                print(f"skipping {asset_id}: animation not found in {config.ANIM_DIR} (run animate.py first)")
                continue

            shutil.copy2(sheet_src, target_dir / f"{asset_id}.png")
            shutil.copy2(json_src, target_dir / f"{asset_id}.json")
            print(f"exported {asset_id} -> {target_dir / f'{asset_id}.png'} and .json")

            manifest_records.append({
                "id": asset_id,
                "kind": kind,
                "variant": variant,
                "flip": choice.get("flip", False),
                "files": [
                    f"{folder_name}/{asset_id}.png",
                    f"{folder_name}/{asset_id}.json",
                ],
                "seed": meta.get("seed"),
                "prompt": meta.get("prompt"),
                "exported_at": now,
            })
        else:
            src_file = config.PROCESSED_DIR / kind / config.file_name(asset_id, variant)
            if not src_file.exists():
                print(f"skipping {asset_id}: processed file {src_file} does not exist (run postprocess.py first)")
                continue

            dest_file = target_dir / f"{asset_id}.png"
            shutil.copy2(src_file, dest_file)
            print(f"exported {asset_id} (v{variant}) -> {dest_file}")

            manifest_records.append({
                "id": asset_id,
                "kind": kind,
                "variant": variant,
                "files": [f"{folder_name}/{asset_id}.png"],
                "seed": meta.get("seed"),
                "prompt": meta.get("prompt"),
                "exported_at": now,
            })

    # Update or write assets/manifest.json
    existing = []
    if config.GAME_MANIFEST.exists():
        try:
            existing = json.loads(config.GAME_MANIFEST.read_text(encoding="utf-8"))
        except Exception:
            existing = []

    merged = {item["id"]: item for item in existing}
    for r in manifest_records:
        merged[r["id"]] = r

    config.GAME_MANIFEST.write_text(
        json.dumps(list(merged.values()), indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"manifest updated -> {config.GAME_MANIFEST}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ids", help="comma-separated asset ids (default: all selected)")
    args = parser.parse_args()
    export_assets(args.ids)


if __name__ == "__main__":
    main()
