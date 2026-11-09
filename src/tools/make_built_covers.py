"""Covers for the "Built on my own" section (assets/img/cover-luys.webp, cover-emlagoo.webp).

    python3 make_built_covers.py ~/Documents/LuysMap ~/Documents/DikteGoo

Three real screens from each product's own repo, side by side on a soft background,
in the same 4:3 frame and style as make_covers.py. Needs Pillow.
"""
import os
import sys
from PIL import Image, ImageDraw
from make_covers import rounded, place, width, IMG, W, H


def bg(top, bottom):
    im = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
    return im


def cover(screens, top, bottom, out):
    c = bg(top, bottom)
    w, gap = 440, 56
    phones = [rounded(width(Image.open(p).convert("RGB"), w), 40) for p in screens]
    x0 = (W - (w * 3 + gap * 2)) // 2
    for i, ph in enumerate(phones):
        # the middle screen sits higher, the outer two lower, so they read as one set
        y = 120 if i == 1 else 210
        ph = ph.crop((0, 0, ph.width, min(ph.height, H - y + 40)))
        place(c, ph, x0 + i * (w + gap), y)
    c.convert("RGB").save(os.path.join(IMG, out), "WEBP", quality=86, method=6)
    print(out)


if __name__ == "__main__":
    luys, emla = (os.path.expanduser(a) for a in sys.argv[1:3])
    cover([f"{luys}/design/shots/{n}-en.png" for n in ("detail", "home", "insights")],
          (238, 236, 252), (226, 224, 246), "cover-luys.webp")
    cover([f"{emla}/design/assets/store/screens-raw/{n}.jpg" for n in ("02-lessons", "04-dictate", "05-word-tap")],
          (250, 244, 236), (240, 236, 230), "cover-emlagoo.webp")
