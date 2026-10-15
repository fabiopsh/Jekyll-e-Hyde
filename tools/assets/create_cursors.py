"""Generate themed Victorian pixel art cursors for Jekyll & Hyde.
Generates 32x32 PNG and SVG cursors:
- cursor_default: Elegant Victorian ivory/leather glove with brass cuff and dark outline
- cursor_pointer: Luminous amber/gold Victorian glove with glowing border for interactive elements
"""
import os
import struct
import zlib

def write_png(filename: str, width: int, height: int, rgba_data: bytes):
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # Filter type 0 (None)
        raw.extend(rgba_data[y * width * 4 : (y + 1) * width * 4])
    compressed = zlib.compress(bytes(raw), 9)

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(struct.pack('>I', len(ihdr)) + b'IHDR' + ihdr + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr)))
    # IDAT
    png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', zlib.crc32(b'IDAT' + compressed)))
    # IEND
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND')))
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)

def write_svg(filename: str, width: int, height: int, pixel_grid, palette):
    rects = []
    for y, row in enumerate(pixel_grid):
        for x, char in enumerate(row):
            if char in palette and palette[char] is not None:
                color, alpha = palette[char]
                fill = f"#{color:06x}"
                op = f' opacity="{alpha}"' if alpha < 1.0 else ''
                rects.append(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{fill}"{op}/>')
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" shape-rendering="crispEdges">
{''.join(rects)}
</svg>'''
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(svg)

# 32x32 Victorian Pointing Hand (LucasArts / Sierra style)
# Hotspot at (2, 2)
# Palette tokens:
# ' ' = transparent
# '#' = dark outline
# 'H' = highlight
# 'M' = midtone
# 'S' = shadow
# 'G' = gold/brass
# 'D' = dark gold
# 'R' = ruby gemstone cuff button

DEFAULT_GRID = [
    "                                ", # 0
    "  ##                            ", # 1
    " #HH#                           ", # 2  <-- (2, 2) Tip of index finger
    " #HMH#                          ", # 3
    "  #HMH#                         ", # 4
    "  #HMH#                         ", # 5
    "   #HMH#                        ", # 6
    "   #HMH#        ####            ", # 7
    "    #HMH#      #HMMH#           ", # 8
    "    #HMH#     #HMMMMH#          ", # 9
    "     #HMH#   #HMMMMMMH#         ", # 10
    "     #HMH#  #HMM#MMMMM#         ", # 11
    "      #HMH##HMM# #MMMM#         ", # 12
    "  #### #HMHHMM#   #MMM#         ", # 13
    " #HHHH##HMHMM#    #MMMH#        ", # 14
    " #HMMMHHHMMMM#   #HMMMS#        ", # 15
    "  #HMMMMMMMMM#   #HMMMS#        ", # 16
    "   #HMMMMMMMMH# #HMMMMS#        ", # 17
    "    #HMMMMMMMMH##HMMMMS#        ", # 18
    "     #HMMMMMMMMHHMMMMS#         ", # 19
    "      #HMMMMMMMMMMMMMS#         ", # 20
    "       #HMMMMMMMMMMMMS#         ", # 21
    "        #HMMMMMMMMMMMS#         ", # 22
    "        #SMMMMMMMMMMMS#         ", # 23
    "        #GGGGGGGGGGGGG#         ", # 24  <-- Brass Victorian cuff
    "        #GHHDGGGGGGGGG#         ", # 25
    "        #GHRDGGGGDDDDG#         ", # 26  <-- Gem button
    "        #GHHDGGGGDDDDG#         ", # 27
    "        #DDDDDDDDDDDDD#         ", # 28
    "         #############          ", # 29
    "                                ", # 30
    "                                ", # 31
]

DEFAULT_PALETTE = {
    ' ': None,
    '#': (0x120d08, 1.0),      # Deep Victorian dark brown/black outline
    'H': (0xf5efe0, 1.0),      # Vintage ivory white highlight
    'M': (0xd3c4a8, 1.0),      # Elegant glove leather midtone
    'S': (0x8e7e68, 1.0),      # Glove crease shadow
    'G': (0xd4af37, 1.0),      # Polished Victorian brass/gold
    'D': (0x7a5b1c, 1.0),      # Tarnished antique gold
    'R': (0xa82824, 1.0),      # Crimson cabochon gemstone
}

# Luminous Golden Hand (interactive hover cursor)
# Warmer, high-contrast amber/gold glow so interactive hotspots pop immediately
POINTER_GRID = [
    "                                ", # 0
    "  ##                            ", # 1
    " #HH#                           ", # 2  <-- (2, 2)
    " #HMH#                          ", # 3
    "  #HMH#                         ", # 4
    "  #HMH#                         ", # 5
    "   #HMH#                        ", # 6
    "   #HMH#        ####            ", # 7
    "    #HMH#      #HMMH#           ", # 8
    "    #HMH#     #HMMMMH#          ", # 9
    "     #HMH#   #HMMMMMMH#         ", # 10
    "     #HMH#  #HMM#MMMMM#         ", # 11
    "      #HMH##HMM# #MMMM#         ", # 12
    "  #### #HMHHMM#   #MMM#         ", # 13
    " #HHHH##HMHMM#    #MMMH#        ", # 14
    " #HMMMHHHMMMM#   #HMMMS#        ", # 15
    "  #HMMMMMMMMM#   #HMMMS#        ", # 16
    "   #HMMMMMMMMH# #HMMMMS#        ", # 17
    "    #HMMMMMMMMH##HMMMMS#        ", # 18
    "     #HMMMMMMMMHHMMMMS#         ", # 19
    "      #HMMMMMMMMMMMMMS#         ", # 20
    "       #HMMMMMMMMMMMMS#         ", # 21
    "        #HMMMMMMMMMMMS#         ", # 22
    "        #SMMMMMMMMMMMS#         ", # 23
    "        #GGGGGGGGGGGGG#         ", # 24
    "        #GHHDGGGGGGGGG#         ", # 25
    "        #GHRDGGGGDDDDG#         ", # 26
    "        #GHHDGGGGDDDDG#         ", # 27
    "        #DDDDDDDDDDDDD#         ", # 28
    "         #############          ", # 29
    "                                ", # 30
    "                                ", # 31
]

POINTER_PALETTE = {
    ' ': None,
    '#': (0x241400, 1.0),      # Deep warm umber outline
    'H': (0xfffae0, 1.0),      # Radiant gold highlight
    'M': (0xffc83b, 1.0),      # Brilliant amber/gold midtone
    'S': (0xb87700, 1.0),      # Rich bronze shadow
    'G': (0xffdf6d, 1.0),      # Bright polished brass
    'D': (0x945f00, 1.0),      # Antique gold trim
    'R': (0x00c0a0, 1.0),      # Cyan/emerald cabochon gemstone
}

def grid_to_rgba(grid, palette):
    out = bytearray(32 * 32 * 4)
    for y in range(32):
        row = grid[y]
        for x in range(32):
            char = row[x] if x < len(row) else ' '
            idx = (y * 32 + x) * 4
            val = palette.get(char)
            if val is not None:
                color, alpha = val
                out[idx + 0] = (color >> 16) & 0xff
                out[idx + 1] = (color >> 8) & 0xff
                out[idx + 2] = color & 0xff
                out[idx + 3] = int(alpha * 255)
            else:
                out[idx + 0] = 0
                out[idx + 1] = 0
                out[idx + 2] = 0
                out[idx + 3] = 0
    return bytes(out)

def main():
    target_dir = os.path.join(os.path.dirname(__file__), '../../assets/ui')
    os.makedirs(target_dir, exist_ok=True)
    
    # 1. Default Victorian Cursor
    def_rgba = grid_to_rgba(DEFAULT_GRID, DEFAULT_PALETTE)
    write_png(os.path.join(target_dir, 'cursor_default.png'), 32, 32, def_rgba)
    write_svg(os.path.join(target_dir, 'cursor_default.svg'), 32, 32, DEFAULT_GRID, DEFAULT_PALETTE)
    print("Generated cursor_default.png and cursor_default.svg")

    # 2. Interactive Gold Pointer Cursor
    ptr_rgba = grid_to_rgba(POINTER_GRID, POINTER_PALETTE)
    write_png(os.path.join(target_dir, 'cursor_pointer.png'), 32, 32, ptr_rgba)
    write_svg(os.path.join(target_dir, 'cursor_pointer.svg'), 32, 32, POINTER_GRID, POINTER_PALETTE)
    print("Generated cursor_pointer.png and cursor_pointer.svg")

if __name__ == '__main__':
    main()
