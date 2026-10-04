#!/usr/bin/env python3
"""Build web/print-ready copies of the presentation imagery into assets/opt/.

Originals in assets/ are kept untouched; the site and the PDF export use the
optimized copies (progressive JPEG, capped long side) so the deck loads fast
and the PDF stays a sensible size while keeping print-grade resolution.

Usage:  python3 tools/optimize-images.py   (requires Pillow)
"""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets"
OUT = SRC / "opt"
OUT.mkdir(exist_ok=True)

MAX_SIDE = 2400
QUALITY = 82


def save_jpeg(im: Image.Image, name: str, max_side: int = MAX_SIDE, quality: int = QUALITY):
    im = im.convert("RGB")
    if max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    dst = OUT / name
    im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True, subsampling="4:2:0")
    return dst


def main():
    skip = {"logo.png", "imarat-logo-gold.png", "imarat-logo-white.png"}
    for f in sorted(SRC.iterdir()):
        if f.suffix.lower() not in {".jpg", ".jpeg", ".png"} or f.name in skip:
            continue
        dst = save_jpeg(Image.open(f), f.stem + ".jpg")
        print(f"{f.name:32s} {f.stat().st_size/1e6:6.2f} MB -> {dst.stat().st_size/1e3:7.0f} KB")

    # Pharma School interior collage -> six individual room photos (labels cropped off)
    collage = Image.open(SRC / "school-interior.png").convert("RGB")
    cols = [(0, 594), (604, 1144), (1154, 1681)]
    rows = [(0, 404), (466, 872)]
    names = [["kimyo", "biologiya", "pharmatech"], ["kutubxona", "konferensiya", "it"]]
    for r, (y0, y1) in enumerate(rows):
        for c, (x0, x1) in enumerate(cols):
            tile = collage.crop((x0, y0, x1, y1))
            tile = tile.resize((tile.width * 2, tile.height * 2), Image.LANCZOS)
            tile = tile.filter(ImageFilter.UnsharpMask(radius=1.4, percent=60, threshold=2))
            save_jpeg(tile, f"school-room-{names[r][c]}.jpg", quality=86)

    # Education quarter close-up from the aerial render (school + kindergarten, lower left)
    aerial = Image.open(SRC / "render-extra-9.jpg").convert("RGB")
    save_jpeg(aerial.crop((150, 420, 1150, 1116)), "edu-quarter-aerial.jpg", quality=86)

    # Logos: trimmed, web-sized PNGs
    for name in ["logo_white.png", "logo_dark.png"]:
        im = Image.open(ROOT / name).convert("RGBA")
        im = im.crop(im.getbbox())
        im.thumbnail((900, 900), Image.LANCZOS)
        im.save(OUT / name, optimize=True)
    for name in ["imarat-logo-white.png", "imarat-logo-gold.png"]:
        im = Image.open(SRC / name).convert("RGBA")
        im.save(OUT / name, optimize=True)


if __name__ == "__main__":
    main()
