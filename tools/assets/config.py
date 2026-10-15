"""Shared paths, parameters and helpers for the asset pipeline."""

from __future__ import annotations

import json
import zlib
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent

PROMPTS_DIR = ROOT / "prompts"
STYLE_FILE = PROMPTS_DIR / "style.yaml"
CHARACTERS_FILE = PROMPTS_DIR / "characters.yaml"

DATA_DIR = ROOT / "data"
ASSETS_FILE = DATA_DIR / "assets.yaml"
SELECTIONS_FILE = DATA_DIR / "selections.yaml"
PALETTE_FILE = ROOT / "palette.hex"

OUTPUT_DIR = ROOT / "output"
RAW_DIR = OUTPUT_DIR / "raw"              # straight from SDXL: raw/<kind>/<id>_v<n>.png
MANIFEST_FILE = RAW_DIR / "manifest.jsonl"  # one line per generated image
CUTOUT_DIR = OUTPUT_DIR / "cutout"        # full size, transparent background (not for backgrounds)
REDUCED_DIR = OUTPUT_DIR / "reduced"      # final size, colours not yet mapped to the palette
PROCESSED_DIR = OUTPUT_DIR / "processed"  # final size, common palette
ANIM_DIR = OUTPUT_DIR / "anim"            # spritesheet + atlas per character
SHEETS_DIR = OUTPUT_DIR / "sheets"        # contact sheets for manual choice

GAME_ASSETS_DIR = REPO / "assets"
GAME_MANIFEST = GAME_ASSETS_DIR / "manifest.json"
GAME_FOLDERS = {"background": "backgrounds", "character": "characters", "portrait": "portraits", "item": "items"}

KINDS = ("background", "character", "portrait", "item")

# Image generation
BASE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
VAE_MODEL = "madebyollin/sdxl-vae-fp16-fix"
PIXEL_LORA = "nerijs/pixel-art-xl"
PIXEL_LORA_FILE = "pixel-art-xl.safetensors"
LCM_LORA = "latent-consistency/lcm-lora-sdxl"
MAX_PROMPT_TOKENS = 77  # CLIP limit: SDXL ignores everything after it

# Post-processing
REMBG_MODEL = "isnet-general-use"
ALPHA_THRESHOLD = 128   # alpha >= threshold becomes opaque, the rest transparent
BACKGROUND_SIZE = (480, 270)
CHARACTER_HEIGHT = 64
PORTRAIT_SIZE = (128, 160)
ITEM_SIZE = (32, 32)
PALETTE_COLORS = 32


def load_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def load_requests() -> dict[str, dict]:
    """Asset requests from data/assets.yaml, keyed by id."""
    requests = {}
    for item in load_yaml(ASSETS_FILE)["assets"]:
        if item["kind"] not in KINDS:
            raise SystemExit(f"{item['id']}: unknown kind {item['kind']!r}")
        if item["id"] in requests:
            raise SystemExit(f"duplicate asset id {item['id']}")
        requests[item["id"]] = item
    return requests


def select_requests(requests: dict[str, dict], ids: str | None, kind: str | None) -> list[dict]:
    """Filter by comma-separated ids and/or kind; unknown ids are an error."""
    chosen = list(requests.values())
    if ids:
        wanted = [x.strip() for x in ids.split(",") if x.strip()]
        unknown = [x for x in wanted if x not in requests]
        if unknown:
            raise SystemExit(f"unknown asset ids: {unknown} (see {ASSETS_FILE.name})")
        chosen = [requests[x] for x in wanted]
    if kind:
        chosen = [r for r in chosen if r["kind"] == kind]
    return chosen


def seed_for(asset_id: str, variant: int) -> int:
    """Fixed seed: stable hash of the id (CRC32 mod 100000) * 100 + variant number."""
    return (zlib.crc32(asset_id.encode("utf-8")) % 100_000) * 100 + variant


def file_name(asset_id: str, variant: int) -> str:
    return f"{asset_id}_v{variant}.png"


def parse_file_name(path: Path) -> tuple[str, int]:
    stem, variant = path.stem.rsplit("_v", 1)
    return stem, int(variant)


def load_selections() -> dict[str, dict]:
    """data/selections.yaml: `id: 2` or `id: {variant: 2, flip: true}` -> {id: {variant, flip}}."""
    if not SELECTIONS_FILE.exists():
        return {}
    out = {}
    for asset_id, value in (load_yaml(SELECTIONS_FILE).get("selections") or {}).items():
        if isinstance(value, int):
            value = {"variant": value}
        out[asset_id] = {"variant": int(value["variant"]), "flip": bool(value.get("flip", False))}
    return out


def manifest_entries() -> dict[tuple[str, int], dict]:
    """Last manifest line for every (id, variant)."""
    entries = {}
    if MANIFEST_FILE.exists():
        for line in MANIFEST_FILE.read_text(encoding="utf-8").splitlines():
            if line.strip():
                entry = json.loads(line)
                entries[(entry["id"], entry["variant"])] = entry
    return entries


def load_palette() -> list[tuple[int, int, int]] | None:
    """palette.hex: one RRGGBB per line (Lospec / Aseprite .hex format)."""
    if not PALETTE_FILE.exists():
        return None
    colors = []
    for line in PALETTE_FILE.read_text(encoding="utf-8").split():
        line = line.strip().lstrip("#")
        if line:
            colors.append(tuple(int(line[i:i + 2], 16) for i in (0, 2, 4)))
    return colors or None
