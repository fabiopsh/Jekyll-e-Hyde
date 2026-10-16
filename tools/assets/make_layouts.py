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


# ---- Chapter 2: character pose sketches (832x1216, profile facing right, as pose_profile_enfield.png) ----------

def pose_profile(height, *, hat=None, hair, face, coat, coat_len=0.70, torso=1.0, waistcoat=None, shirt=None,
                 trousers, shoes=(22, 22, 24), hair_big=1.0) -> Image.Image:
    """Standing figure in profile facing right, flat colour blocks on a pale ground (same method as the first
    two pose sketches, docs/DECISIONI.md D18): `height` px from hat/hair top to the soles, proportions as in
    pose_profile_enfield.png (hat 14%, head 12%, coat down to 74% of the height, legs and shoes below).
    `torso` widens the body, `coat_len` is the share of the height where the coat ends."""
    im = Image.new("RGB", (832, 1216), (242, 242, 242))
    d = ImageDraw.Draw(im)
    cx, foot = 416, 1148
    top = foot - height
    u = height / 1088.0
    hat_h = int(158 * u) if hat else 0
    head_top = top + hat_h
    head_h = int(130 * u)
    hw = int(78 * u)                                           # half width of the head (profile)
    d.ellipse((cx - hw * 0.8, head_top - 8 * u, cx + hw, head_top + head_h), fill=face)
    d.polygon([(cx + hw * 0.7, head_top + head_h * 0.35), (cx + hw * 1.12, head_top + head_h * 0.62),
               (cx + hw * 0.6, head_top + head_h * 0.68)], fill=face)  # nose
    d.ellipse((cx - hw * 1.05, head_top - 20 * u * hair_big, cx + hw * 0.35, head_top + head_h * 0.62 * hair_big),
              fill=hair)                                    # hair over the back of the head
    d.rectangle((cx + hw * 0.34, head_top + head_h * 0.34, cx + hw * 0.34 + 10 * u, head_top + head_h * 0.34 + 10 * u),
                fill=(30, 26, 28))                           # eye
    if hat:
        d.rectangle((cx - 46 * u, top, cx + 47 * u, top + hat_h * 0.9), fill=hat)
        d.rectangle((cx - 70 * u, top + hat_h * 0.82, cx + 73 * u, top + hat_h * 0.98), fill=hat)
    neck_y = head_top + head_h
    d.rectangle((cx - 18 * u, neck_y - 10 * u, cx + 28 * u, neck_y + 40 * u), fill=face)
    tt = neck_y + 26 * u                                        # shoulders
    bw = 77 * u * torso
    coat_bottom = top + height * coat_len
    d.polygon([(cx - bw, tt), (cx + bw * 1.05, tt), (cx + bw * 1.1, coat_bottom), (cx - bw * 1.05, coat_bottom)], fill=coat)
    if shirt:
        d.polygon([(cx + bw * 0.25, tt), (cx + bw * 1.0, tt), (cx + bw * 1.0, tt + 220 * u), (cx + bw * 0.35, tt + 160 * u)], fill=shirt)
    if waistcoat:
        d.polygon([(cx + bw * 0.4, tt + 20 * u), (cx + bw * 1.02, tt + 40 * u), (cx + bw * 1.08, coat_bottom - 120 * u),
                   (cx + bw * 0.5, coat_bottom - 120 * u)], fill=waistcoat)
    sleeve = tuple(max(0, c - 16) for c in coat)
    d.polygon([(cx - bw * 0.45, tt + 20 * u), (cx + bw * 0.35, tt + 20 * u), (cx + bw * 0.3, coat_bottom - 70 * u),
               (cx - bw * 0.4, coat_bottom - 70 * u)], fill=sleeve)
    d.ellipse((cx - bw * 0.4, coat_bottom - 80 * u, cx + bw * 0.3, coat_bottom - 10 * u), fill=face)  # hand
    leg = bw * 0.62
    d.rectangle((cx - leg, coat_bottom, cx - 3 * u, foot - 43 * u), fill=trousers)
    d.rectangle((cx + 3 * u, coat_bottom, cx + leg, foot - 43 * u), fill=tuple(c + 10 for c in trousers))
    d.polygon([(cx - leg - 12 * u, foot - 43 * u), (cx + leg * 0.2, foot - 43 * u), (cx + leg * 1.7, foot - 18 * u),
               (cx + leg * 1.7, foot), (cx - leg - 18 * u, foot)], fill=shoes)
    return im


def pose_lanyon() -> Image.Image:
    """Hale, dapper, stout gentleman about fifty: black frock coat, pale waistcoat, ruddy face, shock of white hair."""
    return pose_profile(1010, hair=(238, 238, 236), face=(204, 112, 98), coat=(28, 28, 32), coat_len=0.70,
                        torso=1.28, waistcoat=(214, 208, 190), trousers=(52, 50, 56), hair_big=1.25)


def pose_poole() -> Image.Image:
    """Elderly butler: black tail coat, white shirt front, black tie and trousers, grey hair, no hat."""
    return pose_profile(1060, hair=(168, 168, 170), face=(218, 188, 164), coat=(22, 22, 26), coat_len=0.72,
                        torso=0.98, shirt=(238, 238, 232), trousers=(30, 30, 34))


def pose_hyde() -> Image.Image:
    """Small, dwarfish, pale man in plain dark clothes and a plain black top hat; upright, no deformity.
    Slighter body than the gentlemen; postprocess.py scales him to 80% of their height (`height` in assets.yaml)."""
    return pose_profile(880, hat=(24, 24, 28), hair=(40, 36, 36), face=(232, 224, 214), coat=(38, 36, 42),
                        coat_len=0.68, torso=0.9, trousers=(30, 30, 34))


# ---- Chapter 2: backgrounds (generation size 1344x768; drawn at 1344x756 = 480x270 x 2.8, load_layout pads) ----

S = 1344 / 480.0  # game pixel -> layout pixel


def _bg_canvas(fill):
    im = Image.new("RGB", (1344, 756), fill)
    return im, ImageDraw.Draw(im)


def _r(d, x, y, w, h, fill, outline=None, width=1):
    """Rectangle in game pixels (x, y, w, h)."""
    d.rectangle((x * S, y * S, (x + w) * S, (y + h) * S), fill=fill, outline=outline, width=width)


def _glow(im, cx, cy, radius, colour, strength):
    """Add a soft radial glow (game pixel centre, radius) to the sketch."""
    import numpy as np

    px = np.asarray(im).astype(np.float32)
    yy, xx = np.mgrid[0:px.shape[0], 0:px.shape[1]].astype(np.float32)
    g = np.exp(-(((xx - cx * S) / (radius * S)) ** 2 + ((yy - cy * S) / (radius * S)) ** 2))[..., None]
    return Image.fromarray(np.clip(px + g * np.array(colour, np.float32) * strength, 0, 255).astype(np.uint8))


def _planks(d, y0, y1, colour, line, step=14):
    _r(d, 0, y0, 480, y1 - y0, colour)
    for y in range(y0, y1, step):
        d.line([(0, y * S), (1344, y * S)], fill=line, width=3)
    for k in range(0, 480, 46):
        d.line([(k * S, y0 * S), ((k - 30) * S, y1 * S)], fill=line, width=2)


def _wall_floor(d, wall, floor, ceiling, base=185, top=55, line=None):
    """Ceiling (y0-top), back wall (top-base), floor (base-270), all flat colour (game pixels)."""
    _r(d, 0, 0, 480, top, ceiling)
    _r(d, 0, top, 480, base - top, wall)
    _r(d, 0, base, 480, 270 - base, floor)
    _r(d, 0, top - 3, 480, 6, tuple(min(255, c + 24) for c in wall))      # cornice
    _r(d, 0, base - 2, 480, 3, tuple(max(0, c - 40) for c in wall))       # skirting line
    if line:
        for y in range(base + 14, 270, 16):
            d.line([(0, y * S), (1344, y * S)], fill=line, width=2)


def _door(d, x, y, w, h, wood, panel, knob=(214, 170, 70)):
    """Panelled door with a brass knob (game pixels)."""
    _r(d, x - 3, y - 3, w + 6, h + 3, tuple(max(0, c - 40) for c in wood))     # frame
    _r(d, x, y, w, h, wood)
    pw, ph = (w - 12) / 2, (h - 20) / 2 - 3
    for dx in (4, 8 + pw):
        _r(d, x + dx, y + 6, pw, ph, panel)
        _r(d, x + dx, y + 14 + ph, pw, ph, panel)
    _r(d, x + w - 8, y + h * 0.52, 4, 4, knob)


def utterson_study() -> Image.Image:
    """Utterson's study, evenly lit (the game adds the candle mood). 1 m = 40 px, wall base y185, ceiling to y55.
    Fireplace x30-110 (mantel y137), bookshelf x130-200 y97-185, desk with one candle x215-295 y153-185,
    iron safe x330-372 y140-185, panelled door x405-447 y100-185."""
    im, d = _bg_canvas((0, 0, 0))
    _wall_floor(d, (176, 140, 104), (150, 108, 72), (196, 176, 148), line=(128, 90, 60))
    _r(d, 0, 140, 480, 45, (150, 112, 80))                                  # panelled dado
    _r(d, 0, 138, 480, 3, (112, 80, 56))
    _r(d, 30, 140, 80, 45, (140, 136, 130))                                 # fireplace surround
    _r(d, 26, 133, 88, 7, (190, 180, 164))                                  # mantel shelf
    _r(d, 44, 150, 52, 35, (36, 30, 30))                                    # firebox
    _r(d, 56, 174, 28, 8, (226, 110, 40))                                   # low embers
    _r(d, 52, 82, 36, 44, (104, 78, 40))                                    # painting above the mantel
    _r(d, 56, 86, 28, 36, (96, 120, 100))
    _r(d, 130, 97, 70, 88, (96, 64, 40))                                    # bookshelf
    colours = [(150, 70, 60), (70, 100, 80), (190, 160, 100), (90, 80, 70), (120, 80, 110), (100, 120, 140)]
    for row in range(4):
        _r(d, 134, 100 + row * 21, 62, 18, (60, 40, 28))
        for k in range(8):
            _r(d, 135 + k * 7.6, 101 + row * 21, 6, 16, colours[(row * 2 + k) % len(colours)])
    _r(d, 215, 153, 80, 6, (120, 78, 48))                                   # desk top
    _r(d, 218, 159, 74, 26, (100, 64, 40))
    _r(d, 224, 163, 28, 18, (82, 52, 34))
    _r(d, 256, 163, 28, 18, (82, 52, 34))
    _r(d, 251, 138, 7, 15, (240, 232, 200))                                 # the one candle
    _r(d, 252, 131, 5, 7, (250, 200, 80))
    _r(d, 330, 140, 42, 45, (62, 66, 74), outline=(30, 32, 38), width=5)    # iron safe
    _r(d, 336, 146, 30, 33, (78, 82, 92))
    _r(d, 349, 157, 5, 8, (220, 176, 70))                                   # brass keyhole
    _r(d, 358, 158, 4, 10, (220, 176, 70))                                  # brass handle
    _door(d, 405, 100, 42, 85, (118, 76, 48), (136, 90, 58))
    return im


def lanyon_dining_room() -> Image.Image:
    """Dining room, evenly lit. 1 m = 40 px, wall base y185. Door x20-62 y100-185, table with white cloth,
    decanter and glasses x160-330 y150-192 with chairs, fireplace x380-460 y137-185, framed pictures."""
    im, d = _bg_canvas((0, 0, 0))
    _wall_floor(d, (176, 108, 98), (146, 104, 70), (214, 202, 180), line=(124, 88, 58))
    _r(d, 0, 140, 480, 45, (110, 74, 52))                                    # wainscot
    _r(d, 0, 138, 480, 3, (170, 130, 88))
    _door(d, 20, 100, 42, 85, (120, 78, 50), (138, 92, 60))
    for (x, y, w, h, c) in ((80, 74, 40, 44, (96, 126, 108)), (186, 66, 58, 42, (110, 120, 150)),
                            (272, 76, 40, 40, (150, 120, 90)), (330, 72, 30, 44, (96, 126, 108))):
        _r(d, x - 4, y - 4, w + 8, h + 8, (206, 164, 76))                     # gilt frame
        _r(d, x, y, w, h, c)
    for x in (140, 330):
        _r(d, x + 2, 128, 8, 50, (96, 60, 40))                                # chair backs, at the table ends
        _r(d, x, 168, 20, 6, (120, 76, 50))
        _r(d, x + 2, 174, 4, 14, (96, 60, 40))
        _r(d, x + 14, 174, 4, 14, (96, 60, 40))
    _r(d, 160, 150, 170, 7, (244, 240, 230))                                  # white cloth, top
    _r(d, 164, 157, 162, 35, (230, 226, 216))                                 # white cloth, hanging
    _r(d, 164, 186, 162, 6, (206, 200, 190))
    _r(d, 202, 130, 9, 20, (110, 30, 44))                                     # wine decanter
    _r(d, 199, 142, 15, 8, (110, 30, 44))
    for x in (232, 252, 272):
        _r(d, x, 138, 7, 12, (200, 214, 222))                                 # glasses
    _r(d, 380, 137, 80, 48, (146, 136, 126))                                  # fireplace
    _r(d, 374, 131, 92, 7, (196, 186, 170))
    _r(d, 394, 150, 52, 35, (36, 30, 30))
    _r(d, 404, 172, 32, 10, (226, 110, 40))
    _r(d, 398, 84, 44, 44, (206, 164, 76))                                    # picture over the fireplace
    _r(d, 402, 88, 36, 36, (96, 126, 108))
    return im


def jekyll_square() -> Image.Image:
    """Overcast day, façades seen across the pavement (engine adds the night light). 1 m = 40 px, façade base y192,
    pavement y195-268. Passage to a side street x0-35, second house from it: door x160-196 y118-192 under a
    semicircular fanlight y106-118; neighbours decayed with brass plates."""
    im, d = _bg_canvas((200, 206, 214))
    _r(d, 0, 0, 480, 270, (196, 202, 210))                                    # overcast sky
    houses = ((35, 125, (136, 128, 124)), (125, 235, (150, 92, 72)), (235, 345, (132, 126, 124)),
              (345, 480, (140, 130, 124)))
    for x0, x1, c in houses:
        _r(d, x0, 28, x1 - x0, 164, c)
        _r(d, x0, 22, x1 - x0, 8, tuple(max(0, v - 50) for v in c))           # roof edge
        _r(d, x0 + 8, 8, 18, 18, (110, 100, 98))                              # chimney
        _r(d, x0, 28, 3, 164, tuple(max(0, v - 60) for v in c))               # party wall line
    for x0, x1, c in houses:
        n = int((x1 - x0) // 34)
        for k in range(n):
            wx = x0 + 10 + k * ((x1 - x0 - 20) / n)
            rich = x0 == 125
            for wy in (40, 82):
                _r(d, wx, wy, 20, 28, (216, 222, 226) if rich else (110, 118, 126), outline=(236, 232, 220) if rich else (84, 80, 80), width=3)
            if not rich or k != 1:
                _r(d, wx, 126, 20, 26, (216, 222, 226) if rich else (110, 118, 126), outline=(236, 232, 220) if rich else (84, 80, 80), width=3)
    for x0 in (50, 250, 360, 410):
        _r(d, x0, 130, 28, 62, (80, 66, 60), outline=(56, 46, 44), width=3)  # decayed doors
        _r(d, x0 + 32, 140, 6, 9, (200, 160, 70))                            # brass plates
        _r(d, x0 + 32, 154, 6, 9, (200, 160, 70))
    _r(d, 156, 118, 44, 74, (236, 232, 220))                                  # stone surround of the rich door
    _r(d, 160, 118, 36, 74, (70, 40, 34), outline=(40, 24, 20), width=3)      # the door
    _r(d, 163, 124, 13, 28, (90, 54, 44))
    _r(d, 180, 124, 13, 28, (90, 54, 44))
    d.pieslice((160 * S, 106 * S, 196 * S, 130 * S), 180, 360, fill=(226, 208, 150), outline=(236, 232, 220), width=5)  # fanlight
    _r(d, 150, 192, 56, 4, (200, 196, 190))                                   # step
    _r(d, 0, 40, 35, 152, (96, 100, 112))                                     # opening to the side street
    _r(d, 0, 195, 480, 75, (140, 138, 140))                                   # pavement
    for k in range(0, 480, 60):
        d.line([(k * S, 196 * S), ((k - 30) * S, 270 * S)], fill=(116, 114, 118), width=2)
    _r(d, 0, 192, 480, 4, (176, 172, 168))                                    # kerb
    return im


def jekyll_hall() -> Image.Image:
    """Hall, evenly lit. 1 m = 40 px, wall base y185, low beamed ceiling y0-45. Front door x15-60 y95-185, open hearth
    x150-250 y120-185 with a high brass fender, oak cabinets x290-390 y115-185, inner door x420-462 y100-185."""
    im, d = _bg_canvas((0, 0, 0))
    _r(d, 0, 0, 480, 45, (112, 78, 52))                                       # low ceiling
    for x in range(10, 480, 80):
        _r(d, x, 0, 14, 48, (84, 56, 38))                                     # beams
    _r(d, 0, 45, 480, 140, (164, 114, 76))                                    # oak panelled wall
    for x in range(0, 480, 40):
        _r(d, x, 50, 2, 135, (130, 90, 60))
    _r(d, 0, 183, 480, 85, (150, 146, 140))                                   # flagged floor
    for y in range(185, 270, 14):
        d.line([(0, y * S), (1344, y * S)], fill=(116, 112, 108), width=2)
        for x in range(((y // 14) % 2) * 20, 480, 40):
            d.line([(x * S, y * S), (x * S, (y + 14) * S)], fill=(116, 112, 108), width=2)
    _door(d, 15, 95, 45, 90, (92, 58, 38), (108, 70, 46))                     # front door
    _door(d, 420, 100, 42, 85, (108, 70, 46), (124, 84, 56))                  # inner door
    _r(d, 150, 120, 100, 65, (150, 144, 136))                                 # hearth surround
    _r(d, 144, 114, 112, 8, (190, 182, 166))
    _r(d, 166, 134, 68, 51, (34, 28, 26))                                     # firebox
    _r(d, 174, 156, 52, 27, (240, 130, 40))                                   # bright fire
    _r(d, 186, 142, 28, 28, (252, 204, 90))
    _r(d, 146, 165, 108, 4, (214, 170, 70))                                   # high brass fender
    _r(d, 146, 181, 108, 4, (214, 170, 70))
    for x in range(150, 254, 9):
        _r(d, x, 165, 2, 20, (214, 170, 70))
    _r(d, 290, 115, 100, 70, (112, 72, 46), outline=(80, 50, 32), width=4)    # oak cabinets
    _r(d, 297, 122, 40, 34, (176, 196, 200))
    _r(d, 343, 122, 40, 34, (176, 196, 200))
    _r(d, 297, 162, 86, 20, (132, 88, 58))
    return im


LAYOUTS = {"pose_profile_lanyon": pose_lanyon, "pose_profile_poole": pose_poole, "pose_profile_hyde": pose_hyde,
           "loc_utterson_study": utterson_study, "loc_lanyon_dining_room": lanyon_dining_room,
           "loc_jekyll_square": jekyll_square, "loc_jekyll_hall": jekyll_hall,
           "loc_by_street_night": by_street_night, "ill_c1_sunday_walk": sunday_walk, "ill_c1_corner": corner, "ill_c1_crowd": crowd, "ill_c1_door_key": door_key, "ill_c1_court": court,
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
