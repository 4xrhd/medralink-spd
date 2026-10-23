"""Cuts the cross mark out of public/logo.png into a tight, transparent square icon
(public/logo-mark.png) for small UI sizes. The original logo file is left unchanged.
Run: python3 scripts/crop-logo-mark.py
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "public", "logo.png")
OUT = os.path.join(HERE, "..", "public", "logo-mark.png")
MARK_RIGHT_EDGE = 405  # the wordmark starts to the right of this column
SIZE = 256


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    mark = img.crop((0, 0, MARK_RIGHT_EDGE, img.height))
    ink = Image.eval(mark.convert("L"), lambda p: 255 if p < 235 else 0)
    mark = mark.crop(ink.getbbox())

    # White background becomes transparent, with soft edges kept from the anti-aliasing
    rgba = mark.convert("RGBA")
    rgba.putdata([(r, g, b, max(0, min(255, (255 - min(r, g, b)) * 3))) for r, g, b, _ in rgba.get_flattened_data()])

    side = max(rgba.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(rgba, ((side - rgba.width) // 2, (side - rgba.height) // 2))
    square.resize((SIZE, SIZE), Image.LANCZOS).save(OUT)
    print(f"Saved {OUT}")


if __name__ == "__main__":
    main()
