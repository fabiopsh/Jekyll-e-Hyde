"""Generate raw images with SDXL + Pixel Art XL LoRA.

Input:  data/assets.yaml (requests), prompts/style.yaml, prompts/characters.yaml
Output: output/raw/<kind>/<id>_v<n>.png and one line per image in output/raw/manifest.jsonl
        (prompt, seed, sampler settings, seconds taken).

A request with `layout: layouts/<id>.png` starts from that composition sketch (img2img, `strength` in
assets.yaml, default 0.8) instead of pure noise. Each of its `regions` (box in pixels of the generated image)
is then repainted alone (inpainting) with its own subject and extra negative words.

Seeds are fixed (config.seed_for: CRC32 of the id, times 100, plus the variant number), so a variant can be
regenerated identically. Existing images are skipped: to resume after an interruption, run again.

Examples:
    uv run generate.py --dry-run                               # prompts, token counts, files; no GPU
    uv run generate.py --kind background --ids loc_by_street   # variants as in data/assets.yaml
    uv run generate.py --ids utterson --variants 8             # adds variants 4-7 only
    uv run generate.py --ids obj_door_key --lcm                # fast draft (8 steps)
    uv run generate.py --ids utterson --force                  # regenerate existing files
"""

from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timezone

import config

LAYOUT_NOISE = 24       # default `noise`: std. deviation of the grain added to a layout sketch (0-255 scale)
DEFAULT_STRENGTH = 0.8  # img2img with a layout sketch: 1.0 ignores the sketch, 0.5 keeps it almost as is

# Windows without developer mode cannot create symlinks in the HF cache; harmless, just noisy.
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


def build_prompt(request: dict, style: dict, characters: dict) -> tuple[str, str]:
    """Return (prompt, negative prompt) for a request."""
    kind = request["kind"]
    block = style[kind]
    sheet = {}
    if kind in ("background", "item"):
        subject = request["subject"]
    else:
        sheet = characters.get(request["character"])
        if sheet is None:
            raise SystemExit(f"{request['id']}: character {request['character']!r} not in prompts/characters.yaml")
        if kind == "character":
            pose = request.get("pose_text") or block["pose"]
            subject = f"{sheet['appearance']}, {pose}"
        else:
            mood = request.get("mood", "neutral")
            if mood not in block["moods"]:
                raise SystemExit(f"{request['id']}: mood {mood!r} not in prompts/style.yaml portrait.moods")
            subject = f"{sheet['appearance']}, {block['moods'][mood]}"
    prompt = ", ".join(part.strip() for part in (block["prefix"], subject, block["suffix"]) if part)
    negative = block["negative"]
    if kind in ("character", "portrait") and sheet.get("negative_extra"):
        negative = f"{negative}, {sheet['negative_extra']}"
    return " ".join(prompt.split()), " ".join(negative.split())


def region_prompt(region: dict, block: dict) -> tuple[str, str]:
    prompt = ", ".join(part.strip() for part in (block["prefix"], region["subject"], block["suffix"]))
    negative = ", ".join(x for x in (block["negative"], region.get("negative_extra", "")) if x)
    return " ".join(prompt.split()), " ".join(negative.split())


def add_noise(sketch, seed: int, sigma: float):
    """Grain on the flat colour blocks of a layout: without it SDXL keeps the surfaces flat."""
    import numpy as np
    from PIL import Image

    rng = np.random.default_rng(seed)
    pixels = np.asarray(sketch).astype(np.float32)
    pixels += rng.normal(0, sigma, pixels.shape)
    return Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8))


def load_tokenizer():
    from transformers import CLIPTokenizer, logging

    logging.set_verbosity_error()  # the >77 tokens message is reported by us, more clearly

    return CLIPTokenizer.from_pretrained(config.BASE_MODEL, subfolder="tokenizer")


def load_pipeline(use_lcm: bool, lora_weight: float):
    import torch
    from diffusers import AutoencoderKL, LCMScheduler, StableDiffusionXLPipeline

    vae = AutoencoderKL.from_pretrained(config.VAE_MODEL, torch_dtype=torch.float16)
    pipe = StableDiffusionXLPipeline.from_pretrained(
        config.BASE_MODEL, vae=vae, torch_dtype=torch.float16, variant="fp16", use_safetensors=True,
    )
    pipe.load_lora_weights(config.PIXEL_LORA, weight_name=config.PIXEL_LORA_FILE, adapter_name="pixel")
    if use_lcm:
        pipe.load_lora_weights(config.LCM_LORA, adapter_name="lcm")
        pipe.set_adapters(["lcm", "pixel"], adapter_weights=[1.0, lora_weight])
        pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
    else:
        pipe.set_adapters(["pixel"], adapter_weights=[lora_weight])
    pipe.to("cuda")
    pipe.set_progress_bar_config(disable=True)
    return pipe


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--kind", choices=config.KINDS, help="only requests of this kind")
    parser.add_argument("--ids", help="comma-separated asset ids (default: all requests)")
    parser.add_argument("--variants", type=int, help="variants per asset (default: `variants` in assets.yaml)")
    parser.add_argument("--lcm", action="store_true", help="LCM LoRA: 8 steps, faster, less detail")
    parser.add_argument("--steps", type=int, help="inference steps (default from style.yaml sampler)")
    parser.add_argument("--guidance", type=float, help="guidance scale (default from style.yaml sampler)")
    parser.add_argument("--lora-weight", type=float, help="Pixel Art XL weight (default from style.yaml sampler)")
    parser.add_argument("--force", action="store_true", help="regenerate images that already exist")
    parser.add_argument("--dry-run", action="store_true", help="print prompts and planned files, no GPU")
    args = parser.parse_args()

    style = config.load_yaml(config.STYLE_FILE)
    characters = config.load_yaml(config.CHARACTERS_FILE)
    requests = config.select_requests(config.load_requests(), args.ids, args.kind)
    if not requests:
        raise SystemExit("no matching requests")

    sampler = style["sampler"]["lcm" if args.lcm else "standard"]
    steps = args.steps or sampler["steps"]
    guidance = args.guidance if args.guidance is not None else sampler["guidance"]
    lora_weight = args.lora_weight if args.lora_weight is not None else sampler["lora_weight"]

    tokenizer = load_tokenizer()
    jobs = []
    for request in requests:
        prompt, negative = build_prompt(request, style, characters)
        tokens = len(tokenizer(prompt).input_ids)
        block = style[request["kind"]]
        print(f"\n{request['id']} ({request['kind']}, {block['width']}x{block['height']}) prompt {tokens} tokens"
              + ("  WARNING: over the 77-token limit, the end is ignored" if tokens > config.MAX_PROMPT_TOKENS else ""))
        if args.dry_run:
            print(f"  prompt:   {prompt}\n  negative: {negative}")
        for region in request.get("regions", []):
            r_prompt, r_negative = region_prompt(region, block)
            r_tokens = len(tokenizer(r_prompt).input_ids)
            print(f"  region {region['box']}: prompt {r_tokens} tokens"
                  + ("  WARNING: over the 77-token limit" if r_tokens > config.MAX_PROMPT_TOKENS else ""))
            if args.dry_run:
                print(f"    prompt:   {r_prompt}\n    negative: {r_negative}")
        for variant in range(args.variants or request.get("variants", 4)):
            path = config.RAW_DIR / request["kind"] / config.file_name(request["id"], variant)
            exists = path.exists()
            if args.dry_run:
                print(f"  v{variant} seed {config.seed_for(request['id'], variant)} -> "
                      f"{path.relative_to(config.ROOT)}{'  (exists, skipped)' if exists and not args.force else ''}")
            if exists and not args.force:
                continue
            jobs.append((request, variant, prompt, negative, path))

    mode = "LCM" if args.lcm else "standard"
    print(f"\n{len(jobs)} images to generate ({mode}: {steps} steps, guidance {guidance}, LoRA weight {lora_weight})")
    if args.dry_run or not jobs:
        if not jobs:
            print("nothing to do (use --force to regenerate existing images)")
        return

    import torch
    from PIL import Image

    t0 = time.perf_counter()
    pipe = load_pipeline(args.lcm, lora_weight)
    print(f"pipeline loaded in {time.perf_counter() - t0:.0f}s", flush=True)

    img2img = inpaint = None
    start = time.perf_counter()
    config.MANIFEST_FILE.parent.mkdir(parents=True, exist_ok=True)
    with config.MANIFEST_FILE.open("a", encoding="utf-8") as manifest:
        for done, (request, variant, prompt, negative, path) in enumerate(jobs, start=1):
            block = style[request["kind"]]
            seed = config.seed_for(request["id"], variant)
            t_img = time.perf_counter()
            common = dict(prompt=prompt, negative_prompt=negative, num_inference_steps=steps,
                          guidance_scale=guidance, generator=torch.Generator("cuda").manual_seed(seed))
            layout = request.get("layout")
            strength = request.get("strength", DEFAULT_STRENGTH)
            if layout:
                # Composition sketch (blocks of colour) repainted by SDXL: fixes where the floor,
                # the walls and the doors are, which the text prompt alone does not control.
                if img2img is None:
                    from diffusers import StableDiffusionXLImg2ImgPipeline

                    # Same modules, no copy. (from_pipe re-cast them here: VRAM full, >10x slower.)
                    img2img = StableDiffusionXLImg2ImgPipeline(**pipe.components)
                    img2img.set_progress_bar_config(disable=True)
                sketch = Image.open(config.DATA_DIR / layout).convert("RGB").resize(
                    (block["width"], block["height"]), Image.Resampling.LANCZOS)
                noise = request.get("noise", LAYOUT_NOISE)
                image = img2img(image=add_noise(sketch, seed, noise), strength=strength, **common).images[0]
                for region in request.get("regions", []):
                    # Second pass on one box only (inpainting): the box starts again from the sketch and
                    # gets its own prompt and negative, e.g. "windows" for a blind wall, which in the
                    # main prompt would also remove the shop windows.
                    if inpaint is None:
                        from diffusers import StableDiffusionXLInpaintPipeline

                        inpaint = StableDiffusionXLInpaintPipeline(**pipe.components)
                        inpaint.set_progress_bar_config(disable=True)
                    box = tuple(region["box"])
                    start_image = image.copy()
                    start_image.paste(add_noise(sketch.crop(box), seed + 1, noise), box[:2])
                    mask = Image.new("L", image.size, 0)
                    mask.paste(255, box)
                    r_prompt, r_negative = region_prompt(region, block)
                    image = inpaint(
                        prompt=r_prompt, negative_prompt=r_negative, image=start_image, mask_image=mask,
                        width=image.width, height=image.height, strength=region.get("strength", DEFAULT_STRENGTH),
                        num_inference_steps=steps, guidance_scale=guidance,
                        generator=torch.Generator("cuda").manual_seed(seed + 1),
                    ).images[0]
            else:
                image = pipe(width=block["width"], height=block["height"], **common).images[0]
            path.parent.mkdir(parents=True, exist_ok=True)
            image.save(path)
            seconds = time.perf_counter() - t_img
            manifest.write(json.dumps({
                "id": request["id"], "kind": request["kind"], "variant": variant, "seed": seed,
                "file": str(path.relative_to(config.ROOT)).replace("\\", "/"),
                "prompt": prompt, "negative_prompt": negative,
                "base_model": config.BASE_MODEL, "lora": config.PIXEL_LORA, "lcm": args.lcm,
                "steps": steps, "guidance": guidance, "lora_weight": lora_weight,
                "width": block["width"], "height": block["height"],
                "layout": layout, "strength": strength if layout else None,
                "regions": request.get("regions") if layout else None, "seconds": round(seconds, 1),
                "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }) + "\n")
            manifest.flush()
            elapsed = time.perf_counter() - start
            print(f"[{done}/{len(jobs)}] {path.name} seed {seed}: {seconds:.1f}s "
                  f"(elapsed {elapsed:.0f}s, ETA {elapsed / done * (len(jobs) - done):.0f}s)", flush=True)
    print(f"done in {time.perf_counter() - start:.0f}s -> {config.RAW_DIR}")


if __name__ == "__main__":
    main()
