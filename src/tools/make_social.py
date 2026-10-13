"""Builds the share cards (og-image.png for the home page, og-<case>.png per case study),
favicons and the apple-touch-icon.

Run from this folder:  python3 make_social.py
Needs Pillow. Downloads Geist (SIL OFL) into a local, gitignored cache on first run.
"""
import os
import urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
IMG = os.path.join(ROOT, "assets", "img")
CACHE = os.path.join(HERE, ".fonts")
GEIST = os.path.join(CACHE, "Geist.ttf")
MONO = os.path.join(CACHE, "GeistMono.ttf")

INK, INK2, INK3, BG = (17, 17, 20), (91, 92, 100), (110, 111, 120), (251, 251, 252)


def fonts():
    os.makedirs(CACHE, exist_ok=True)
    for path, url in ((GEIST, "https://github.com/google/fonts/raw/main/ofl/geist/Geist%5Bwght%5D.ttf"),
                      (MONO, "https://github.com/google/fonts/raw/main/ofl/geistmono/GeistMono%5Bwght%5D.ttf")):
        if not os.path.exists(path):
            urllib.request.urlretrieve(url, path)


def font(path, size, weight):
    f = ImageFont.truetype(path, size)
    f.set_variation_by_axes([weight])
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
    glow = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(glow)
    for (x, y, r, c) in ((80, -60, 300, (255, 217, 199)), (1150, -40, 320, (225, 219, 255)),
                         (560, 120, 220, (205, 238, 228)), (900, 620, 260, (212, 230, 255))):
        g.ellipse((x - r, y - r, x + r, y + r), fill=c)
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    base = Image.blend(base, glow, 0.75)
    d = ImageDraw.Draw(base)

    # right: the four case-study illustrations
    tile, gap = 168, 14
    x0, y0 = W - 96 - (2 * tile + gap), (H - (2 * tile + gap)) // 2
    for i, name in enumerate(("promo", "balad", "vault", "jobs")):
        t = Image.open(os.path.join(IMG, f"art-{name}.webp")).convert("RGB").resize((tile, tile), Image.LANCZOS)
        t = rounded(t, 22)
        base.paste(t, (x0 + (i % 2) * (tile + gap), y0 + (i // 2) * (tile + gap)), t)

    # left: portrait, statement, name
    p = Image.open(os.path.join(IMG, "portrait.webp")).convert("RGB").resize((96, 96), Image.LANCZOS)
    p = rounded(p, 26)
    base.paste(p, (96, 92), p)
    d.text((212, 104), "Sid Jameson", font=font(GEIST, 34, 600), fill=INK)
    d.text((212, 146), "AI Design Engineer at Huma", font=font(GEIST, 24, 400), fill=INK2)

    big = font(GEIST, 46, 500)
    d.text((96, 270), "I take complex products", font=big, fill=INK)
    line2a = "and make them feel "
    d.text((96, 330), line2a, font=big, fill=INK)
    sx = 96 + d.textlength(line2a, font=big)
    d.text((sx, 330), "simple.", font=big, fill=INK)
    sw = d.textlength("simple", font=big)
    d.rounded_rectangle((sx, 330 + 56, sx + sw, 330 + 59), 2, fill=INK)
    d.text((96, 452), "Case studies · Experience · Workflow · Writing", font=font(GEIST, 22, 400), fill=INK3)
    d.text((96, 520), "sidj.work", font=font(MONO, 24, 500), fill=INK)
    base.save(os.path.join(IMG, "og-image.png"), optimize=True)


CASES = [  # slug, art, tint, eyebrow, title, line, chips
    ("promotion-center", "promo", (242, 20, 125), "Snappfood · Food delivery · 2023–2024", "Promotion Center",
     "One discovery page for people who order by price.", ["+20% party orders", "+62% pages per session"]),
    ("balad-maps", "balad", (107, 77, 255), "Balad Maps · Maps & local search", "Search & Discovery",
     "Results that show what kind of place you’re after.", ["+15% POI engagement", "−8% search bounce"]),
    ("graph-vault", "vault", (47, 107, 255), "Graph Inc. · B2B security", "Graph Vault",
     "Secure file sharing for organizations that can’t use Google Drive or Dropbox.", ["Sole designer"]),
    ("job-search", "jobs", (232, 137, 43), "Design exercise · Mobile app", "Job Search App",
     "The whole process, from requirements to a UI kit.", ["Research", "Personas", "IA", "UI kit"]),
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


def og_case(slug, art, tint, eyebrow, title, line, chips):
    W, H = 1200, 630
    base = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    g = ImageDraw.Draw(glow)
    soft = tuple(int(c * .22 + b * .78) for c, b in zip(tint, BG))
    for (x, y, r, c) in ((120, -80, 320, soft), (1100, 640, 300, soft), (700, 120, 200, (225, 219, 255))):
        g.ellipse((x - r, y - r, x + r, y + r), fill=c)
    base = Image.blend(base, glow.filter(ImageFilter.GaussianBlur(130)), .8)
    d = ImageDraw.Draw(base)
    size = 400
    t = rounded(Image.open(os.path.join(IMG, f"art-{art}.webp")).convert("RGB").resize((size, size), Image.LANCZOS), 32)
    base.paste(t, (W - 96 - size, (H - size) // 2), t)
    x, maxw = 96, W - 96 - size - 96 - 24
    d.text((x, 96), "CASE STUDY", font=font(MONO, 18, 500), fill=tint)
    d.text((x, 128), eyebrow, font=font(GEIST, 22, 450), fill=INK3)
    chips_y = H - 96 - 44 - 34 - 40          # chips sit above the name line
    body = font(GEIST, 26, 420)
    for fs in range(62, 44, -2):             # largest title that leaves room for the chips
        big = font(GEIST, fs, 620)
        tl, bl = balanced(d, title, big, maxw), balanced(d, line, body, maxw)
        end = 186 + len(tl) * (fs + 8) + 14 + len(bl) * 36
        if end <= chips_y - 22:
            break
    y = 186
    for ln in tl:
        d.text((x, y), ln, font=big, fill=INK); y += fs + 8
    y += 14
    for ln in bl:
        d.text((x, y), ln, font=body, fill=INK2); y += 36
    cx, cf = x, font(GEIST, 20, 520)
    for chip in chips:
        w = d.textlength(chip, font=cf) + 32
        if cx + w > x + maxw:
            break
        d.rounded_rectangle((cx, chips_y, cx + w, chips_y + 40), 20, fill=(255, 255, 255), outline=(226, 226, 230))
        d.text((cx + 16, chips_y + 8), chip, font=cf, fill=INK); cx += w + 10
    p = rounded(Image.open(os.path.join(IMG, "portrait.webp")).convert("RGB").resize((44, 44), Image.LANCZOS), 22)
    base.paste(p, (x, H - 96 - 44), p)
    d.text((x + 58, H - 96 - 38), "Sid Jameson", font=font(GEIST, 21, 600), fill=INK)
    d.text((x + 58, H - 96 - 12), "sidj.work", font=font(MONO, 17, 500), fill=INK3)
    base.save(os.path.join(IMG, f"og-{slug}.png"), optimize=True)


def icons():
    def mono(size):
        im = Image.new("RGB", (size, size), INK)
        d = ImageDraw.Draw(im)
        f = font(GEIST, int(size * 0.42), 650)
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
