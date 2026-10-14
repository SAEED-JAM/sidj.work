"""Builds the share cards (og-image.png for the home page, og-<case>.png per case study),
favicons and the apple-touch-icon.

Run from this folder:  python3 make_social.py
Needs Pillow. Downloads Archivo (SIL OFL) into a local, gitignored cache on first run.
"""
import os
import urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
IMG = os.path.join(ROOT, "assets", "img")
CACHE = os.path.join(HERE, ".fonts")
ARCHIVO = os.path.join(CACHE, "Archivo.ttf")

INK, INK2, INK3, BG = (18, 18, 18), (77, 77, 75), (108, 108, 105), (252, 252, 251)


def fonts():
    os.makedirs(CACHE, exist_ok=True)
    for path, url in ((ARCHIVO, "https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth,wght%5D.ttf"),):
        if not os.path.exists(path):
            urllib.request.urlretrieve(url, path)


def font(path, size, weight, width=100):
    """Archivo's axes are weight then width."""
    f = ImageFont.truetype(path, size)
    f.set_variation_by_axes([weight, width])
    return f


def rounded(im, r):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = Image.new("RGBA", im.size)
    out.paste(im.convert("RGBA"), (0, 0), mask)
    return out


def og_image():
    W, H = 1200, 630
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    tile, gap = 196, 12
    x0, y0 = W - 72 - (2 * tile + gap), (H - (2 * tile + gap)) // 2
    for i, name in enumerate(("promo", "balad", "vault", "jobs")):
        t = Image.open(os.path.join(IMG, f"cover-{name}.webp")).convert("RGB")
        t = t.resize((tile * 4 // 3 + 1, tile), Image.LANCZOS).crop((tile // 6, 0, tile // 6 + tile, tile))
        t = rounded(t, 10)
        base.paste(t, (x0 + (i % 2) * (tile + gap), y0 + (i // 2) * (tile + gap)), t)
    d.text((72, 72), "Sid Jameson", font=font(ARCHIVO, 26, 600), fill=INK)
    big = font(ARCHIVO, 58, 580, 90)
    y = 210
    for ln in ("I’m a product designer", "who works in code."):
        d.text((72, y), ln, font=big, fill=INK); y += 62
    small = font(ARCHIVO, 23, 400)
    y += 26
    for ln in ("AI Design Engineer at Huma, in Yerevan.", "Before: Wallex, Snappfood, Graph, Cafe Bazaar."):
        d.text((72, y), ln, font=small, fill=INK2); y += 34
    d.line((72, H - 104, x0 - 48, H - 104), fill=(18, 18, 18), width=2)
    d.text((72, H - 88), "sidj.work", font=font(ARCHIVO, 22, 500), fill=INK)
    base.save(os.path.join(IMG, "og-image.png"), optimize=True)


CASES = [  # slug, cover, tint, eyebrow, title, line, results
    ("ai-design-workflow", "desk", (201, 100, 66), "Huma · UK Primary Care · 2026", "The Design Desk",
     "An agentic design workflow: agents read, draw and check; people answer and approve.", ["A pilot set in 3 days"]),
    ("promotion-center", "promo", (242, 20, 125), "Snappfood · Food delivery · 2023–2024", "Promotion Center",
     "One discovery page for people who order by price.", ["Party orders up 20%"]),
    ("balad-maps", "balad", (107, 77, 255), "Balad Maps · Maps & local search", "Search & Discovery",
     "Results that show what kind of place you’re after.", ["Search bounce down 8%"]),
    ("graph-vault", "vault", (47, 107, 255), "Graph Inc. · B2B security", "Graph Vault",
     "Secure file sharing for organizations that can’t use Google Drive or Dropbox.", ["Designed from the first version"]),
    ("job-search", "jobs", (232, 137, 43), "Design exercise · Mobile app", "Job Search App",
     "The whole process, from requirements to a UI kit.", ["Requirements to UI kit"]),
]


def wrap(d, text, f, width):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width or not cur:
            cur = t
        else:
            lines.append(cur); cur = w
    return lines + [cur]


def balanced(d, text, f, width):
    """Fewest lines at this width, then the narrowest width that keeps that count: no one-word last line."""
    n = len(wrap(d, text, f, width))
    while width > 120 and len(wrap(d, text, f, width - 8)) == n:
        width -= 8
    return wrap(d, text, f, width)


def og_case(slug, art, tint, eyebrow, title, line, results):
    W, H = 1200, 630
    base = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(base)
    cw = 560
    c = Image.open(os.path.join(IMG, f"cover-{art}.webp")).convert("RGB").resize((cw, cw * 3 // 4), Image.LANCZOS)
    c = rounded(c, 12)
    base.paste(c, (W - 72 - cw, (H - c.height) // 2), c)
    x, maxw = 72, W - 72 - cw - 72 - 40
    d.text((x, 72), "Sid Jameson · Case study", font=font(ARCHIVO, 22, 500), fill=INK3)
    big = font(ARCHIVO, 56, 580, 90)
    tl = balanced(d, title, big, maxw)
    y = 176
    for ln in tl:
        d.text((x, y), ln, font=big, fill=INK); y += 60
    body = font(ARCHIVO, 24, 400)
    y += 18
    d.text((x, y), eyebrow, font=font(ARCHIVO, 20, 500), fill=INK3); y += 40
    for ln in balanced(d, line, body, maxw):
        d.text((x, y), ln, font=body, fill=INK2); y += 34
    d.line((x, H - 104, x + maxw, H - 104), fill=(18, 18, 18), width=2)
    d.text((x, H - 88), results[0], font=font(ARCHIVO, 22, 500), fill=INK)
    base.save(os.path.join(IMG, f"og-{slug}.png"), optimize=True)


def icons():
    def mono(size):
        im = Image.new("RGB", (size, size), INK)
        d = ImageDraw.Draw(im)
        f = font(ARCHIVO, int(size * 0.44), 620, 92)
        tw = d.textlength("SJ", font=f)
        asc, desc = f.getmetrics()
        d.text(((size - tw) / 2, (size - asc - desc) / 2 + size * 0.02), "SJ", font=f, fill=(255, 255, 255))
        return im
    mono(180).save(os.path.join(ROOT, "apple-touch-icon.png"), optimize=True)
    mono(512).save(os.path.join(IMG, "icon-512.png"), optimize=True)
    r = rounded(mono(256), 64)
    r.resize((32, 32), Image.LANCZOS).save(os.path.join(IMG, "favicon-32.png"), optimize=True)
    r.save(os.path.join(ROOT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == "__main__":
    fonts()
    og_image()
    for c in CASES:
        og_case(*c)
    icons()
    print("ok")
