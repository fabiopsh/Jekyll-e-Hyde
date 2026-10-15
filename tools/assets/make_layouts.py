"""Draw the composition sketches of the illustrations: data/layouts/<id>.png (blocks of flat colour).

SDXL alone did not place the figures where the book puts them (a man and a girl coming to the same corner,
a circle around one man, a hand at the lock, a court with windows only on the first floor, big coins).
The door close-ups start from a box of the approved day background, so the door is the same. The sketch fixes
the composition; generate.py repaints it (img2img, `strength` in data/assets.yaml). Re-run after a change:

    uv run make_layouts.py                      # all sketches
    uv run make_layouts.py --ids ill_c1_court   # one sketch
"""

from __future__ import annotations

import argparse

from PIL import Image, ImageDraw

import config

W, H = 896, 1152  # generation size of illustrations (prompts/style.yaml)

NIGHT_SKY = (26, 28, 40)
WALL_DARK = (52, 42, 44)
WALL = (78, 60, 56)
STONE = (96, 92, 88)
GROUND = (58, 56, 60)
LAMP = (232, 200, 150)
GLOW = (120, 96, 72)
BLACK = (8, 8, 10)
WOOD = (110, 72, 50)
WINDOW = (150, 160, 170)


def lamp(draw: ImageDraw.ImageDraw, x: int, top: int, bottom: int) -> None:
    """Gas lamp post: pale glow, lantern, thin black post."""
    draw.ellipse((x - 90, top - 70, x + 90, top + 110), fill=GLOW)
    draw.rectangle((x - 6, top + 40, x + 6, bottom), fill=BLACK)
    draw.polygon([(x - 26, top), (x + 26, top), (x + 18, top + 50), (x - 18, top + 50)], fill=LAMP)


def figure(draw: ImageDraw.ImageDraw, x: int, foot: int, height: int, colour, skirt: bool = False,
           stride: bool = False) -> None:
    """Very simple standing or walking figure; x is the centre, foot the ground line."""
    head = height // 7
    hw = height * 0.13  # half width of the body
    top = foot - height
    draw.ellipse((x - head // 2, top, x + head // 2, top + head), fill=colour)
    body_top, hip = top + head, top + int(height * 0.55)
    if skirt:
        draw.polygon([(x - hw * 0.8, body_top), (x + hw * 0.8, body_top), (x + hw * 1.5, foot - head // 3),
                      (x - hw * 1.5, foot - head // 3)], fill=colour)
        draw.rectangle((x - hw * 0.6, foot - head // 3, x - hw * 0.2, foot), fill=colour)
        draw.rectangle((x + hw * 0.2, foot - head // 3, x + hw * 0.6, foot), fill=colour)
        return
    draw.polygon([(x - hw, body_top), (x + hw, body_top), (x + hw * 0.9, hip), (x - hw * 0.9, hip)], fill=colour)
    if stride:
        draw.polygon([(x - hw * 0.8, hip), (x, hip), (x - hw * 2.2, foot), (x - hw * 2.9, foot)], fill=colour)
        draw.polygon([(x, hip), (x + hw * 0.8, hip), (x + hw * 2.6, foot), (x + hw * 1.9, foot)], fill=colour)
    else:
        draw.rectangle((x - hw * 0.8, hip, x - hw * 0.1, foot), fill=colour)
        draw.rectangle((x + hw * 0.1, hip, x + hw * 0.8, foot), fill=colour)


def gentleman_back(draw: ImageDraw.ImageDraw, x: int, foot: int, height: int, coat, trousers, hat) -> None:
    """A gentleman seen from behind: top hat, frock coat to the knees, trousers. As in the pose sketches
    (docs/DECISIONI.md D18) the coat colour tells the two apart: dark for Utterson, light grey for Enfield."""
    head = height // 8
    top = foot - height
    draw.rectangle((x - head * 0.45, top, x + head * 0.45, top + head * 1.1), fill=hat)       # crown
    draw.rectangle((x - head * 0.8, top + head * 1.05, x + head * 0.8, top + head * 1.25), fill=hat)  # brim
    draw.ellipse((x - head * 0.5, top + head * 1.1, x + head * 0.5, top + head * 2.1), fill=(70, 56, 50))
    knee = top + int(height * 0.72)
    draw.polygon([(x - head * 0.95, top + head * 2.1), (x + head * 0.95, top + head * 2.1),
                  (x + head * 1.15, knee), (x - head * 1.15, knee)], fill=coat)
    draw.rectangle((x - head * 0.7, knee, x - head * 0.1, foot), fill=trousers)
    draw.rectangle((x + head * 0.1, knee, x + head * 0.7, foot), fill=trousers)


def sunday_walk() -> Image.Image:
    """A quiet street on a Sunday in perspective; the two friends seen from behind, side by side, the taller
    in a dark coat on the left, the other in a light grey coat on the right."""
    im = Image.new("RGB", (W, H), (200, 210, 214))
    d = ImageDraw.Draw(im)
    d.polygon([(0, 0), (330, 380), (330, 720), (0, 1000)], fill=(120, 76, 60))       # left fronts
    d.polygon([(896, 0), (566, 380), (566, 720), (896, 1000)], fill=(110, 100, 92))  # right fronts
    d.rectangle((330, 300, 566, 720), fill=(150, 146, 140))                          # far end of the street
    d.polygon([(0, 1000), (330, 720), (566, 720), (896, 1000), (896, H), (0, H)], fill=(150, 140, 126))
    gentleman_back(d, 320, 1080, 620, (34, 32, 36), (30, 28, 30), (16, 14, 16))      # dark, taller
    gentleman_back(d, 590, 1080, 570, (178, 178, 172), (54, 50, 52), (16, 14, 16))   # light grey
    return im


def corner() -> Image.Image:
    """A corner seen across the road: the man walks along the main street (left, towards the corner),
    the girl runs down the cross street (right, towards the corner). Before they meet."""
    im = Image.new("RGB", (W, H), NIGHT_SKY)
    d = ImageDraw.Draw(im)
    d.polygon([(0, 120), (470, 220), (470, 860), (0, 900)], fill=WALL)              # main street front
    d.polygon([(470, 220), (896, 330), (896, 790), (470, 860)], fill=WALL_DARK)     # cross street front
    for x0 in (60, 200, 340):
        d.rectangle((x0, 300, x0 + 70, 420), fill=WALL_DARK)
    d.rectangle((0, 900, 896, H), fill=GROUND)
    d.polygon([(0, 860), (470, 860), (896, 790), (896, 900), (0, 940)], fill=STONE)  # pavement
    lamp(d, 470, 420, 880)
    figure(d, 240, 1010, 420, BLACK, stride=True)           # the little man, only a silhouette
    figure(d, 700, 940, 260, (40, 34, 40), skirt=True)       # the girl, small dark silhouette
    return im


def crowd() -> Image.Image:
    """Night street, lamps; a ring of people seen slightly from above, a small black figure in the middle."""
    im = Image.new("RGB", (W, H), NIGHT_SKY)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 520), fill=WALL_DARK)
    for x0 in (60, 330, 600):
        d.rectangle((x0, 140, x0 + 120, 300), fill=(150, 110, 70))  # lit windows
    d.rectangle((0, 520, W, H), fill=GROUND)
    lamp(d, 120, 300, 700)
    lamp(d, 780, 300, 700)
    people = [(150, 860, (110, 70, 60), True), (300, 760, (60, 50, 70), False), (450, 730, (90, 80, 70), False),
              (610, 760, (120, 60, 60), True), (750, 860, (70, 60, 50), False), (260, 1040, (100, 64, 58), True),
              (640, 1040, (66, 56, 64), False)]
    for x, foot, colour, skirt in people:
        figure(d, x, foot, 340 if foot > 900 else 300, colour, skirt=skirt)
        head = (340 if foot > 900 else 300) // 7
        top = foot - (340 if foot > 900 else 300)
        d.ellipse((x - head // 2 + 4, top + 4, x + head // 2 - 4, top + head - 4), fill=(200, 150, 120))  # faces
    figure(d, 450, 930, 230, BLACK)  # the man in the middle: no face, only black
    return im


DOOR_BOX = (229, 108, 289, 183)  # the door of assets/backgrounds/loc_by_street.png, 4:5 (pixels of 480x270)
LOCK_BOX = (248, 134, 280, 174)  # its lock, 4:5, for the close-up of the key


def from_background(box: tuple[int, int, int, int], grade=None) -> Image.Image:
    """A 4:5 box of the approved day background at the illustration size (generate.load_layout)."""
    from generate import load_layout

    request = {"layout": "assets/backgrounds/loc_by_street.png", "layout_crop": list(box)}
    if grade:
        request["layout_grade"] = grade
    return load_layout(request, (W, H))


def door_key() -> Image.Image:
    """Night close-up of the lock of the same door as loc_by_street (cut from the day background and
    darkened), lit from the left by a gas lamp; a hand in a dark glove from the right turns the key."""
    import numpy as np

    im = from_background(LOCK_BOX, grade=[0.32, 0.32, 0.45])
    px = np.asarray(im).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    light = np.exp(-(((xx + 100) / 600) ** 2 + ((yy - 450) / 500) ** 2))[..., None]  # gas light from the left
    px = np.clip(px + light * np.array([110, 80, 40], np.float32), 0, 255)
    im = Image.fromarray(px.astype(np.uint8))
    d = ImageDraw.Draw(im)
    glove, edge, sleeve, key = (62, 48, 42), (150, 122, 100), (26, 24, 30), (210, 176, 100)
    kx, ky, k = 330, 560, 1.7                                           # keyhole and size of the hand

    def at(dx: float, dy: float) -> tuple[float, float]:
        return kx + dx * k, ky + dy * k

    d.ellipse((*at(-10, -18), *at(10, 4)), fill=BLACK)                 # keyhole
    d.polygon([at(-6, 0), at(6, 0), at(9, 26), at(-9, 26)], fill=BLACK)
    d.rectangle((*at(0, -8), *at(60, 3)), fill=key)                     # shank going into the lock
    d.ellipse((*at(52, -32), *at(102, 22)), outline=key, width=14)      # bow
    d.polygon([at(80, -50), at(160, -80), at(230, -58), at(245, 30), at(210, 85), at(120, 92), at(85, 50)],
              fill=glove, outline=edge, width=6)                        # back of the hand
    d.polygon([at(85, -46), at(48, -44), at(40, -22), at(78, -12), at(115, -22)],
              fill=glove, outline=edge, width=6)                        # thumb on the bow
    for x0, y0 in ((48, 8), (78, 42), (120, 66)):
        d.ellipse((*at(x0, y0), *at(x0 + 56, y0 + 42)), fill=glove, outline=edge, width=5)  # curled fingers
    d.polygon([at(225, -80), (W, ky - 200), (W, ky + 230), at(225, 95)], fill=sleeve)
    d.line([at(226, -74), at(226, 90)], fill=edge, width=8)             # cuff of the glove
    return im


def door_closeup() -> Image.Image:
    """The door of loc_by_street, cut from the day background so that its shape and colours are the same,
    plus what the book adds (r. 58-64): two worn steps, burnt matches on them, knife cuts on the mouldings."""
    import numpy as np

    im = from_background(DOOR_BOX)
    d = ImageDraw.Draw(im)
    d.rectangle((90, 1000, 806, 1060), fill=(128, 120, 110))   # upper step
    d.rectangle((40, 1060, 856, 1152), fill=(112, 104, 96))    # lower step
    for x, y, angle in ((260, 1030, 8), (330, 1040, -14), (520, 1100, 20), (600, 1095, -6), (700, 1120, 12)):
        dx = int(60 * np.cos(np.radians(angle)))
        dy = int(60 * np.sin(np.radians(angle)))
        d.line([(x, y), (x + dx, y + dy)], fill=(176, 140, 96), width=7)   # burnt matches
        d.ellipse((x + dx - 7, y + dy - 7, x + dx + 7, y + dy + 7), fill=BLACK)
    for x, y in ((250, 420), (262, 470), (640, 380), (628, 640), (250, 760)):
        d.line([(x, y), (x + 34, y + 22)], fill=(170, 130, 96), width=5)    # knife cuts on the mouldings
    return im


def cheque() -> Image.Image:
    """Top-down: a dark table at dawn, ten big gold coins and a folded blank cheque, large enough to read
    at 160x200. Pale dawn light from the top left. No writing on the cheque (the name is not told)."""
    import numpy as np

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    px = np.zeros((H, W, 3), np.float32) + np.array([86, 56, 42], np.float32)
    px += (((yy // 120) % 2) * 8)[..., None]                       # boards of the table
    dawn = np.exp(-(((xx + 50) / 800) ** 2 + ((yy + 50) / 800) ** 2))[..., None]
    px = np.clip(px + dawn * np.array([110, 80, 70], np.float32), 0, 255)
    im = Image.fromarray(px.astype(np.uint8))
    d = ImageDraw.Draw(im)
    paper = [(150, 640), (690, 560), (740, 900), (200, 980)]        # the cheque folded in two, blank
    d.polygon([(x + 18, y + 18) for x, y in paper], fill=(50, 32, 26))
    d.polygon([(150, 640), (420, 600), (470, 940), (200, 980)], fill=(232, 220, 194))  # top half, lit
    d.polygon([(420, 600), (690, 560), (740, 900), (470, 940)], fill=(196, 184, 160))  # under half, shaded
    d.line([(420, 600), (470, 940)], fill=(150, 138, 118), width=6)  # fold
    coins = [(250, 230), (390, 200), (530, 250), (660, 210), (300, 370), (450, 350), (600, 390),
             (380, 500), (530, 520), (700, 470)]
    for x, y in coins:
        r = 62
        d.ellipse((x - r + 10, y - r + 12, x + r + 10, y + r + 12), fill=(48, 30, 24))  # shadow
        d.ellipse((x - r, y - r, x + r, y + r), fill=(176, 130, 48))
        d.ellipse((x - r + 12, y - r + 12, x + r - 12, y + r - 12), fill=(224, 182, 84))
        d.ellipse((x - 28, y - 40, x - 4, y - 16), fill=(250, 220, 140))              # shine
    return im


def court() -> Image.Image:
    """Closed court: buildings packed together on both sides, the back building with three shut windows on
    the first floor and none below, a chimney with smoke, grey sky."""
    im = Image.new("RGB", (W, H), (140, 136, 130))
    d = ImageDraw.Draw(im)
    d.polygon([(0, 80), (200, 260), (200, 980), (0, 1152)], fill=WALL_DARK)             # left side
    d.polygon([(896, 120), (700, 280), (700, 980), (896, 1152)], fill=(66, 54, 52))      # right side
    d.rectangle((200, 300, 700, 980), fill=WALL)                                          # back building
    d.polygon([(200, 300), (450, 200), (700, 300)], fill=(60, 56, 58))                    # roof
    d.rectangle((560, 120, 620, 260), fill=(110, 66, 50))                                 # chimney
    d.ellipse((540, 20, 680, 120), fill=(180, 178, 176))                                  # smoke
    d.ellipse((600, -30, 760, 70), fill=(170, 168, 166))
    for x0 in (250, 405, 560):
        d.rectangle((x0, 420, x0 + 90, 560), fill=WINDOW)                                 # three windows
        d.rectangle((x0 + 42, 420, x0 + 48, 560), fill=WALL_DARK)
    d.rectangle((200, 640, 700, 980), fill=(84, 66, 60))                                  # blank lower wall
    d.polygon([(0, 1152), (200, 980), (700, 980), (896, 1152)], fill=STONE)               # paving
    return im


def by_street_night() -> Image.Image:
    """Night start for loc_by_street_night: the exported day background (assets/backgrounds/loc_by_street.png)
    at the generation size, darkened towards blue, its gas lamp lit (glow and pool of light), a light haze
    of fog, the door in deeper shadow. Same composition as the day image (generate.load_layout)."""
    import numpy as np

    from generate import load_layout

    size = (1344, 768)
    base = load_layout({"layout": "assets/backgrounds/loc_by_street.png", "layout_grade": [0.26, 0.3, 0.44]}, size)
    px = np.asarray(base).astype(np.float32)
    yy, xx = np.mgrid[0:size[1], 0:size[0]].astype(np.float32)
    scale, top = 1344 / 480, 6  # day pixel -> layout pixel (load_layout pads 6 rows above)

    def at(x: float, y: float) -> tuple[float, float]:
        return x * scale, y * scale + top

    door = np.zeros(size[::-1], np.float32)  # the door of the gable house: deeper shadow
    (x0, y0), (x1, y1) = at(236, 110), at(280, 182)
    door[int(y0):int(y1), int(x0):int(x1)] = 1
    px *= 1 - 0.45 * door[..., None]
    fog = np.clip((yy - 200) / 568, 0, 1)[..., None] * 0.18 + 0.06  # light haze, thicker near the ground
    px = px * (1 - fog) + np.array([96, 118, 168], np.float32) * fog
    lx, ly = at(461, 22)                     # lantern of the gas lamp on the right
    glow = np.exp(-((xx - lx) ** 2 + (yy - ly) ** 2) / (2 * 70.0 ** 2))
    pool = np.exp(-(((xx - lx) / 170) ** 2 + ((yy - 575) / 50) ** 2))  # light on the pavement below it
    light = np.maximum(glow, 0.6 * pool)[..., None]
    px = px + light * np.array([235, 190, 120], np.float32) * 0.9
    core = (np.abs(xx - lx) < 14) & (np.abs(yy - ly) < 22)
    px[core] = (250, 225, 170)
    return Image.fromarray(np.clip(px, 0, 255).astype(np.uint8))


LAYOUTS = {"loc_by_street_night": by_street_night, "ill_c1_sunday_walk": sunday_walk, "ill_c1_corner": corner, "ill_c1_crowd": crowd, "ill_c1_door_key": door_key, "ill_c1_court": court,
           "ill_c1_door_closeup": door_closeup, "ill_c1_cheque": cheque}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ids", help="comma-separated layout ids (default: all)")
    args = parser.parse_args()
    ids = [x.strip() for x in args.ids.split(",")] if args.ids else list(LAYOUTS)
    out_dir = config.DATA_DIR / "layouts"
    out_dir.mkdir(parents=True, exist_ok=True)
    for layout_id in ids:
        path = out_dir / f"{layout_id}.png"
        LAYOUTS[layout_id]().save(path)
        print(f"layout -> {path}")


if __name__ == "__main__":
    main()
