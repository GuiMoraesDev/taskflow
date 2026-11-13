#!/usr/bin/env python3
"""Writes .claude-plugin/icon.png: three stacked rounded bars on a dark square."""
import os
import struct
import zlib

SIZE = 512
BG = (0x1F, 0x29, 0x37)
FG = (0x34, 0xD3, 0x99)

BAR_H = 64
BAR_GAP = 48
BAR_RADIUS = BAR_H // 2
BARS = [(96, 416), (96, 352), (96, 288)]  # (x0, x1) from top to bottom


def inside_bar(x, y, x0, x1, y0):
    if not (y0 <= y < y0 + BAR_H and x0 <= x < x1):
        return False
    cy = y0 + BAR_RADIUS
    for cx in (x0 + BAR_RADIUS, x1 - BAR_RADIUS):
        if (x < x0 + BAR_RADIUS and cx == x0 + BAR_RADIUS) or (x >= x1 - BAR_RADIUS and cx == x1 - BAR_RADIUS):
            return (x - cx) ** 2 + (y - cy) ** 2 < BAR_RADIUS ** 2
    return True


def pixel(x, y):
    total = len(BARS) * BAR_H + (len(BARS) - 1) * BAR_GAP
    top = (SIZE - total) // 2
    for i, (x0, x1) in enumerate(BARS):
        if inside_bar(x, y, x0, x1, top + i * (BAR_H + BAR_GAP)):
            return FG
    return BG


def chunk(tag, data):
    body = tag + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def main():
    raw = bytearray()
    for y in range(SIZE):
        raw.append(0)
        for x in range(SIZE):
            raw.extend(pixel(x, y))
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root, ".claude-plugin", "icon.png"), "wb") as f:
        f.write(png)


if __name__ == "__main__":
    main()
