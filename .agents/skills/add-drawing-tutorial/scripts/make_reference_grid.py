#!/usr/bin/env python3
"""
Overlays an 800x600 Paper Companion coordinate grid on a reference image so
an AI agent can visually read exact (x, y) SVG coordinates for drawing steps.

Usage:
    python3 .agents/skills/add-drawing-tutorial/scripts/make_reference_grid.py <input_image> <output_grid_png>
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw


def make_grid(input_path: Path, output_path: Path) -> None:
    src = Image.open(input_path).convert("RGBA")
    target_w, target_h = 800, 600

    # Fit image inside 800x600 preserving aspect ratio, centered on paper
    scale = min(target_w / src.width, target_h / src.height)
    new_w = max(1, int(round(src.width * scale)))
    new_h = max(1, int(round(src.height * scale)))
    resized = src.resize((new_w, new_h), Image.Resampling.NEAREST)

    canvas = Image.new("RGBA", (target_w, target_h), (255, 253, 249, 255))
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)

    draw = ImageDraw.Draw(canvas)

    # Vertical grid lines every 50px
    for x in range(0, target_w + 1, 50):
        is_center = x == 400
        is_major = x % 100 == 0
        color = (
            (2, 132, 199, 230)
            if is_center
            else (225, 29, 72, 185)
            if is_major
            else (59, 130, 246, 115)
        )
        width = 3 if is_center else (2 if is_major else 1)
        draw.line([(x, 0), (x, target_h)], fill=color, width=width)
        if x < target_w:
            draw.text((x + 3, 4), str(x), fill=(250, 204, 21, 255))
            draw.text((x + 3, target_h - 18), str(x), fill=(250, 204, 21, 255))

    # Horizontal grid lines every 50px
    for y in range(0, target_h + 1, 50):
        is_center = y == 300
        is_major = y % 100 == 0
        color = (
            (2, 132, 199, 230)
            if is_center
            else (225, 29, 72, 185)
            if is_major
            else (59, 130, 246, 115)
        )
        width = 3 if is_center else (2 if is_major else 1)
        draw.line([(0, y), (target_w, y)], fill=color, width=width)
        if y < target_h:
            draw.text((4, y + 3), str(y), fill=(250, 204, 21, 255))
            draw.text((target_w - 30, y + 3), str(y), fill=(250, 204, 21, 255))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path)
    print(f"Saved 800x600 gridded reference image to {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(
            "Usage: python3 make_reference_grid.py <input_image> <output_grid_png>",
            file=sys.stderr,
        )
        sys.exit(1)
    make_grid(Path(sys.argv[1]), Path(sys.argv[2]))
