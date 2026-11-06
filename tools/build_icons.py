"""Builds the PNG icons of the app (same drawing as icons/icon.svg), with no external libraries.

Usage: python tools/build_icons.py icons
"""
import math, struct, sys, zlib

BACKGROUND = (15, 110, 120)
WHITE = (255, 255, 255)
LIGHT = (158, 230, 234)


def colour_at(x, y):
    """Colour of point (x, y) in the 512x512 drawing; None outside the icon."""
    # Square with rounded corners (radius 112)
    r = 112
    cx, cy = min(max(x, r), 512 - r), min(max(y, r), 512 - r)
    if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
        return None
    # Branch segments (width 30, rounded ends)
    def near(ax, ay, bx, by, w):
        dx, dy = bx - ax, by - ay
        t = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x - (ax + t * dx), y - (ay + t * dy)) <= w / 2
    if math.hypot(x - 364, y - 352) <= 52:
        return LIGHT
    if math.hypot(x - 256, y - 140) <= 52:
        return WHITE
    if abs(math.hypot(x - 148, y - 352) - 46) <= 13:
        return WHITE
    if near(256, 150, 256, 236, 30) or near(256, 236, 156, 330, 30) or near(256, 236, 356, 330, 30):
        return WHITE
    return BACKGROUND


def png(size, path, samples=3):
    rows = bytearray()
    for py in range(size):
        rows.append(0)  # PNG filter: none
        for px in range(size):
            total, covered = [0, 0, 0], 0
            for sy in range(samples):
                for sx in range(samples):
                    x = (px + (sx + 0.5) / samples) * 512 / size
                    y = (py + (sy + 0.5) / samples) * 512 / size
                    c = colour_at(x, y)
                    if c:
                        covered += 1
                        for i in range(3):
                            total[i] += c[i]
            alpha = round(255 * covered / samples ** 2)
            colour = [round(v / covered) for v in total] if covered else [0, 0, 0]
            rows.extend(colour + [alpha])

    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(bytes(rows), 9)))
        f.write(chunk(b"IEND", b""))


folder = sys.argv[1]
for size in (180, 192, 512):
    png(size, f"{folder}/icon-{size}.png")
    print("written", size)
