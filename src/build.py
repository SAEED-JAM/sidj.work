"""Assembles the site from the parts in this folder.

    python3 build.py

Writes ../index.html (home) and ../<case>/index.html for every case study, so each case has
a real URL with its own title, description and share image (sidj.work/promotion-center/).
A case page is the same document with that case already open; the scripts take it from there.
Also writes ../sitemap.xml.

Parts, in page order:
  head.html      <head> template: {{title}}, {{description}}, {{url}}, {{image}} ... and {{css}}
  base.css       tokens, fonts, globals     home.css   home page sections
  case.css       case-study sheet and its widgets
  home.html      the home page              cases.html the four case studies; each <article>
                                                       carries data-page-title and data-desc
  overlays.html  résumé viewer, video and image lightboxes
  home.js        home page behaviour        cases.js   case studies, overlays, timeline
The two scripts share one scope (wrapped in a single IIFE here).

Checks: every local <img> gets its intrinsic width/height (so space is reserved before it loads),
local paths become root-relative (they must resolve from /<case>/ too), and the build fails on
duplicate ids or on a $('#id') / getElementById('id') in the scripts that matches no element.
"""
import html
import os
import re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = "https://sidj.work"
HOME = {
    "title": "Sid Jameson · AI Design Engineer",
    "description": "Sid Jameson is an AI design engineer at Huma, designing and building healthcare software in code "
                   "with Claude. Case studies from Snappfood, Balad Maps and Graph.",
    "image": "og-image.png",
    "image_alt": "Sid Jameson, AI Design Engineer at Huma. I design products that think, and build them in code.",
    "og_type": "profile",
}


def read(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read()


def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


_dims = {}


def add_size(match):
    tag, src = match.group(0), match.group(1)
    if re.search(r"\swidth=", tag) or not src.startswith("assets/"):
        return tag
    if src not in _dims:
        with Image.open(os.path.join(ROOT, src)) as im:
            _dims[src] = im.size
    w, h = _dims[src]
    return tag[:-1].rstrip("/").rstrip() + f' width="{w}" height="{h}">'


LOCAL = r'(\s(?:src|href|poster|data-[a-z-]+)=")(assets/|favicon\.ico|apple-touch-icon\.png|site\.webmanifest|Sid_Jameson_Resume\.pdf)'


def head(meta, url, html_class=""):
    attr = lambda s: html.escape(s, quote=True)
    out = read("head.html")
    for key, val in (("home_title", HOME["title"]), ("title", meta["title"]), ("description", meta["description"]),
                     ("url", url), ("image", f"{SITE}/assets/img/{meta['image']}"), ("image_alt", meta["image_alt"]),
                     ("og_type", meta["og_type"])):
        out = out.replace("{{" + key + "}}", attr(val))
    return out.replace("{{html_class}}", f' class="{html_class}"' if html_class else "")


def build():
    css = (read("base.css") + read("home.css") + read("case.css")).strip()
    cases = read("cases.html")
    body = read("home.html") + "\n" + cases + "\n" + read("overlays.html")
    js = "(() => {\n" + read("home.js") + "\n" + read("cases.js") + "})();\n"
    body = re.sub(r'<img\b[^>]*?\bsrc="([^"]+)"[^>]*>', add_size, body)
    body = re.sub(LOCAL, r"\1/\2", body)

    ids = re.findall(r'\sid="([^"]+)"', body)
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise SystemExit(f"duplicate ids: {dupes}")
    refs = set(re.findall(r"\$\('#([A-Za-z][\w-]*)'\)", js)) | set(re.findall(r"getElementById\('([\w-]+)'\)", js))
    if refs - set(ids):
        raise SystemExit(f"scripts look up ids that don't exist: {sorted(refs - set(ids))}")

    tail = lambda b: "<body>\n" + b + "\n<script>\n" + js + "</script>\n</body>\n</html>\n"
    page = head(HOME, SITE + "/").replace("{{css}}", css) + tail(body)
    write("index.html", page)
    print(f"index.html: {len(page):,} bytes")

    urls = [SITE + "/"]
    for m in re.finditer(r'<article class="case" id="case-([a-z-]+)" data-title="([^"]+)" data-page-title="([^"]+)" data-desc="([^"]+)"', cases):
        slug, name, title, desc = m.group(1), *(html.unescape(g) for g in m.groups()[1:])
        meta = {"title": title, "description": desc, "image": f"og-{slug}.png",
                "image_alt": f"{name}: a case study by Sid Jameson", "og_type": "article"}
        # same document, this case already open: no flash of the home page, and crawlers see the case
        b = body.replace('<div class="sheet" id="sheet" hidden', '<div class="sheet" id="sheet"', 1)
        b = re.sub(rf'(<article class="case" id="case-{slug}"[^>]*?) hidden>', r"\1>", b, count=1)
        b = b.replace('<span id="sheetTitleText"></span>', f'<span id="sheetTitleText">{html.escape(name)}</span>', 1)
        url = f"{SITE}/{slug}/"
        write(f"{slug}/index.html", head(meta, url, "locked").replace("{{css}}", css) + tail(b))
        urls.append(url)
        print(f"{slug}/index.html")
    urls.append(SITE + "/Sid_Jameson_Resume.pdf")

    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")


if __name__ == "__main__":
    build()
