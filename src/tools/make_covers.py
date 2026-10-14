"""Builds the project covers (assets/img/cover-*.webp) from real product screens.

Run from this folder:  python3 make_covers.py
Needs Pillow. The Vault cover uses a frame from assets/vid/vault-challenge.mp4, saved once
as assets/img/vault-window.webp (see VAULT below).
"""
import os
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.abspath(os.path.join(HERE, "..", "..", "assets", "img"))
W, H = 1600, 1200


def rounded(im, r, corners=(1, 1, 1, 1)):
    """Rounds the given corners (tl, tr, br, bl) and adds a hairline edge."""
    im = im.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255, corners=tuple(bool(c) for c in corners))
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    edge = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(edge).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, outline=(17, 17, 17, 22), width=2, corners=tuple(bool(c) for c in corners))
    return Image.alpha_composite(out, edge)


def place(canvas, im, x, y, shadow=True):
    if shadow:
        sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        a = im.split()[3].point(lambda v: int(v * 0.16))
        blk = Image.new("RGBA", im.size, (20, 20, 25, 255)); blk.putalpha(a)
        sh.paste(blk, (x, y + 22), blk)
        canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(34)))
    canvas.alpha_composite(im, (x, y))


def width(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def promo():
    c = Image.new("RGBA", (W, H), (243, 236, 238, 255))
    a = Image.open(os.path.join(IMG, "promo-20.webp")).convert("RGB").crop((103, 265, 773, 1439))
    b = Image.open(os.path.join(IMG, "promo-07.webp")).convert("RGB").crop((590, 172, 1012, 860))
    a, b = width(a, 540), width(b, 540)
    place(c, rounded(a, 44, (1, 1, 0, 0)), 238, H - a.height + 4)
    place(c, rounded(b, 44, (1, 1, 0, 0)), 822, H - b.height + 4)
    return c


def balad():
    c = Image.new("RGBA", (W, H), (236, 235, 243, 255))
    shots = [Image.open(os.path.join(IMG, f"balad-{n}-after.webp")).convert("RGB") for n in ("search", "card", "list")]
    w, gap = 430, 44
    x0 = (W - (3 * w + 2 * gap)) // 2
    for i, s in enumerate(shots):
        s = width(s, w)
        y = 150 if i == 1 else 250
        place(c, rounded(s, 46), x0 + i * (w + gap), y)
    return c


def vault():
    c = Image.new("RGBA", (W, H), (232, 237, 244, 255))
    win = Image.open(os.path.join(IMG, "vault-window.webp")).convert("RGB")
    win = width(win, 1380)
    place(c, rounded(win, 22), (W - win.width) // 2, (H - win.height) // 2 + 20)
    return c


def jobs():
    a = Image.open(os.path.join(IMG, "art-jobs.webp")).convert("RGB")
    a = a.resize((1600, 1600), Image.LANCZOS).crop((0, 140, 1600, 1340))
    return a.convert("RGBA")


if __name__ == "__main__":
    for name, fn in (("promo", promo), ("balad", balad), ("vault", vault), ("jobs", jobs)):
        fn().convert("RGB").save(os.path.join(IMG, f"cover-{name}.webp"), quality=86, method=6)
        print("cover-" + name)
