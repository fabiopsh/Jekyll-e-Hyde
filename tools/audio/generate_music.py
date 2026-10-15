"""Local AI soundtrack generation using Meta MusicGen.

Generates music from prompt definitions in data/tracks.yaml, applies seamless
crossfade looping, and exports to assets/audio/music/<id>.ogg (and .wav)
along with assets/audio/manifest.json.

Examples:
    uv run generate_music.py --ids mus_menu_theme
    uv run generate_music.py --ids mus_by_street
    uv run generate_music.py
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
import yaml
from transformers import AutoProcessor, MusicgenForConditionalGeneration

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent

DATA_FILE = ROOT / "data" / "tracks.yaml"
OUTPUT_RAW = ROOT / "output" / "raw"
OUTPUT_LOOPED = ROOT / "output" / "looped"

GAME_AUDIO_DIR = REPO / "assets" / "audio" / "music"
GAME_MANIFEST = REPO / "assets" / "audio" / "manifest.json"

DEFAULT_MODEL = "facebook/musicgen-small"


def load_tracks() -> list[dict]:
    data = yaml.safe_load(DATA_FILE.read_text(encoding="utf-8")) or {}
    return data.get("tracks", [])


def make_seamless_loop(audio: np.ndarray, sr: int, crossfade_sec: float) -> np.ndarray:
    """Blend the tail into the beginning using an equal-power crossfade to create a loop."""
    c_samples = int(crossfade_sec * sr)
    if c_samples <= 0 or c_samples >= len(audio) // 2:
        return audio

    # Split: head, body, tail
    head = audio[:c_samples].copy()
    body = audio[c_samples:-c_samples]
    tail = audio[-c_samples:].copy()

    # Equal power fade: fade-out tail, fade-in head
    t = np.linspace(0, 1, c_samples)
    fade_in = np.sin(t * np.pi / 2)
    fade_out = np.cos(t * np.pi / 2)

    if audio.ndim == 1:
        blended = tail * fade_out + head * fade_in
        return np.concatenate([blended, body])
    else:
        blended = tail * fade_out[:, None] + head * fade_in[:, None]
        return np.concatenate([blended, body], axis=0)


def generate(
    ids: str | None = None,
    model_id: str = DEFAULT_MODEL,
    force: bool = False,
) -> None:
    all_tracks = load_tracks()
    if ids:
        wanted = [x.strip() for x in ids.split(",") if x.strip()]
        tracks = [t for t in all_tracks if t["id"] in wanted]
    else:
        tracks = all_tracks

    if not tracks:
        print("no tracks to generate")
        return

    OUTPUT_RAW.mkdir(parents=True, exist_ok=True)
    OUTPUT_LOOPED.mkdir(parents=True, exist_ok=True)
    GAME_AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading MusicGen ({model_id}) on CUDA (torch.float16)...")
    t0 = time.perf_counter()
    processor = AutoProcessor.from_pretrained(model_id)
    model = MusicgenForConditionalGeneration.from_pretrained(
        model_id, torch_dtype=torch.float16
    ).to("cuda")
    print(f"model loaded in {time.perf_counter() - t0:.1f}s")

    sr = model.config.audio_encoder.sampling_rate # 32000
    manifest_entries = {}
    if GAME_MANIFEST.exists():
        try:
            for item in json.loads(GAME_MANIFEST.read_text(encoding="utf-8")):
                manifest_entries[item["id"]] = item
        except Exception:
            pass

    for i, track in enumerate(tracks, 1):
        track_id = track["id"]
        dest_mp3 = GAME_AUDIO_DIR / f"{track_id}.mp3"
        dest_wav = GAME_AUDIO_DIR / f"{track_id}.wav"
        if dest_mp3.exists() and not force:
            print(f"[{i}/{len(tracks)}] {track_id} exists in {dest_mp3.name}, skipping (use --force to redo)", flush=True)
            continue

        duration = track.get("duration", 22)
        crossfade = track.get("loop_crossfade", 2.0)
        # MusicGen small has a hard positional limit of 1500 tokens (30s at 50 tokens/s).
        # We clamp to 1200 tokens (24s) so that prompt tokens + audio tokens are well within 1500.
        max_tokens = min(int((duration + crossfade) * 50), 1200)

        prompt = track["prompt"]
        print(f"\n[{i}/{len(tracks)}] Generating '{track_id}' ({duration}s, {max_tokens} tokens)...", flush=True)
        print(f"  prompt: {prompt}", flush=True)

        t_gen = time.perf_counter()
        try:
            inputs = processor(text=[prompt], padding=True, return_tensors="pt").to("cuda")
            with torch.no_grad():
                output = model.generate(**inputs, max_new_tokens=max_tokens)

            # Output shape: (batch, channels, samples)
            wav = output[0].cpu().float().numpy()
            if wav.ndim == 2:
                wav = wav[0]  # mono 1D array

            # Normalize audio peak
            peak = float(np.max(np.abs(wav)))
            if peak > 0:
                wav = (wav / peak) * track.get("volume", 0.85)

            # Save raw audio
            raw_path = OUTPUT_RAW / f"{track_id}.wav"
            sf.write(str(raw_path), wav, sr)

            # Make seamless loop
            looped = make_seamless_loop(wav, sr, crossfade)
            loop_path_mp3 = OUTPUT_LOOPED / f"{track_id}.mp3"
            loop_path_wav = OUTPUT_LOOPED / f"{track_id}.wav"
            sf.write(str(loop_path_mp3), looped, sr)
            sf.write(str(loop_path_wav), looped, sr)

            # Copy to game assets
            sf.write(str(dest_mp3), looped, sr)
            sf.write(str(dest_wav), looped, sr)
            print(f"  generated in {time.perf_counter() - t_gen:.1f}s -> {dest_mp3.relative_to(REPO)}", flush=True)

            manifest_entries[track_id] = {
                "id": track_id,
                "scene": track.get("scene"),
                "title": track.get("title"),
                "model": model_id,
                "duration": duration,
                "sampling_rate": sr,
                "file": f"music/{track_id}.mp3",
                "prompt": prompt,
                "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
        except Exception:
            import traceback
            traceback.print_exc()
            raise

    # Write manifest
    GAME_MANIFEST.write_text(
        json.dumps(list(manifest_entries.values()), indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"\nAudio manifest updated -> {GAME_MANIFEST.relative_to(REPO)}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ids", help="comma-separated track ids to generate")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"MusicGen model (default: {DEFAULT_MODEL})")
    parser.add_argument("--force", action="store_true", help="overwrite existing tracks")
    args = parser.parse_args()
    generate(args.ids, args.model, args.force)


if __name__ == "__main__":
    main()
