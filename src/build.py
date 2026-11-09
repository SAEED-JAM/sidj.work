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
  lock.js        private parts of a case: the password gate and the sealed images and video
The two scripts share one scope (wrapped in a single IIFE here).

Checks: every local <img> gets its intrinsic width/height (so space is reserved before it loads),
local paths become root-relative (they must resolve from /<case>/ too), and the build fails on
duplicate ids or on a $('#id') / getElementById('id') in the scripts that matches no element.
"""
import html
import json
import os
import re
import subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = "https://sidj.work"
HOME = {
    "title": "Sid Jameson · AI Design Engineer and Product Designer",
    "description": "Sid Jameson is an AI design engineer at Huma and a product designer who works in code with Claude. "
                   "Case studies from Huma, Snappfood, Balad Maps and Graph.",
    "image": "og-image.png",
    "image_alt": "Sid Jameson: I’m a product designer who works in code. AI Design Engineer at Huma.",
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


PERSON = {
    "@type": "Person", "@id": f"{SITE}/#person", "name": "Sid Jameson",
    "alternateName": ["Mir Saeed Jamshidi", "Saeed Jamshidi"], "url": f"{SITE}/",
    "image": f"{SITE}/assets/img/portrait.webp", "jobTitle": "AI Design Engineer",
    "description": "AI design engineer at Huma, designing healthcare software in code with Claude. Eight years of product "
                   "design across trading, security, maps, food delivery and AI learning.",
    "worksFor": {"@type": "Organization", "name": "Huma", "url": "https://huma.com"},
    "address": {"@type": "PostalAddress", "addressLocality": "Yerevan", "addressCountry": "AM"},
    "alumniOf": {"@type": "CollegeOrUniversity", "name": "University of Zanjan"},
    "knowsAbout": ["Product design", "AI product design", "Design engineering", "Design systems", "Design leadership",
                   "Healthcare UX", "Agentic AI workflows"],
    "sameAs": ["https://www.linkedin.com/in/mirsaeedjamshidi/", "https://medium.com/@msaeedjg"],
}
WEBSITE = {"@type": "WebSite", "@id": f"{SITE}/#website", "url": f"{SITE}/", "name": "Sid Jameson",
           "inLanguage": "en", "publisher": {"@id": f"{SITE}/#person"}}


def jsonld(meta, url, modified):
    page = {"@id": url + "#page", "url": url, "name": meta["title"], "description": meta["description"],
            "inLanguage": "en", "isPartOf": {"@id": f"{SITE}/#website"}, "dateModified": modified,
            "primaryImageOfPage": {"@type": "ImageObject", "url": f"{SITE}/assets/img/{meta['image']}", "width": 1200, "height": 630}}
    graph = [PERSON, WEBSITE]
    if meta["og_type"] == "profile":
        graph.append({"@type": "ProfilePage", **page, "mainEntity": {"@id": f"{SITE}/#person"}})
    else:
        graph.append({"@type": "WebPage", **page, "breadcrumb": {"@id": url + "#breadcrumb"}, "mainEntity": {"@id": url + "#work"}})
        graph.append({"@type": "CreativeWork", "@id": url + "#work", "name": meta["name"], "headline": meta["name"],
                      "description": meta["description"], "url": url, "image": f"{SITE}/assets/img/{meta['image']}",
                      "author": {"@id": f"{SITE}/#person"}, "creator": {"@id": f"{SITE}/#person"},
                      "genre": meta.get("genre", "Product design case study"), "inLanguage": "en", "dateModified": modified})
        graph.append({"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Sid Jameson", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": meta["name"], "item": url}]})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def last_changed(*paths):
    """Date of the last commit touching these paths (today for uncommitted work)."""
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", *paths], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        dirty = subprocess.run(["git", "status", "--porcelain", "--", *paths], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    except OSError:
        out, dirty = "", ""
    import datetime
    return datetime.date.today().isoformat() if dirty or not out else out


def only_case(body, slug):
    """Drops every case article except this one, so a case URL carries only its own story."""
    starts = [m.start() for m in re.finditer(r'<article class="case" id="case-', body)]
    keep, out, last = f'<article class="case" id="case-{slug}"', [], 0
    for i, s in enumerate(starts):
        end = body.rfind("</article>", s, starts[i + 1] if i + 1 < len(starts) else body.index("</article>", s) + 10) + len("</article>")
        if not body.startswith(keep, s):
            out.append(body[last:s]); last = end
    return "".join(out) + body[last:]


def head(meta, url, html_class=""):
    attr = lambda s: html.escape(s, quote=True)
    out = read("head.html")
    for key, val in (("home_title", HOME["title"]), ("title", meta["title"]), ("description", meta["description"]),
                     ("url", url), ("image", f"{SITE}/assets/img/{meta['image']}"), ("image_alt", meta["image_alt"]),
                     ("og_type", meta["og_type"])):
        out = out.replace("{{" + key + "}}", attr(val))
    out = out.replace("{{jsonld}}", jsonld(meta, url, meta["modified"]))
    return out.replace("{{html_class}}", f' class="{html_class}"' if html_class else "")


def build():
    css = (read("base.css") + read("home.css") + read("case.css") + read("bento.css")).strip()
    cases = read("cases.html")
    body = read("home.html") + "\n" + cases + "\n" + read("overlays.html")
    js = "(() => {\n" + read("home.js") + "\n" + read("lock.js") + "\n" + read("cases.js") + "\n" + read("bento.js") + "})();\n"
    # the Design Desk bento appears on the home page and in its case; each copy gets its own gradient id
    bento, n = read("bento.html"), iter(range(1, 99))
    body = re.sub(r"\{\{bento\}\}", lambda m: bento.replace("{{n}}", str(next(n))), body)
    body = re.sub(r'<img\b[^>]*?\bsrc="([^"]+)"[^>]*>', add_size, body)
    body = re.sub(LOCAL, r"\1/\2", body)

    ids = re.findall(r'\sid="([^"]+)"', body)
    # a private part is encrypted; its gate lists the ids inside, so the checks still cover them
    ids += [i for s in re.findall(r'\sdata-ids="([^"]*)"', body) for i in s.split()]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise SystemExit(f"duplicate ids: {dupes}")
    refs = set(re.findall(r"\$\('#([A-Za-z][\w-]*)'\)", js)) | set(re.findall(r"getElementById\('([\w-]+)'\)", js))
    if refs - set(ids):
        raise SystemExit(f"scripts look up ids that don't exist: {sorted(refs - set(ids))}")

    tail = lambda b: "<body>\n" + b + "\n<script>\n" + js + "</script>\n</body>\n</html>\n"
    HOME["modified"] = last_changed("src", "assets")
    page = head(HOME, SITE + "/").replace("{{css}}", css) + tail(body)
    write("index.html", page)
    print(f"index.html: {len(page):,} bytes")

    urls = [(SITE + "/", HOME["modified"])]
    for m in re.finditer(r'<article class="case" id="case-([a-z-]+)" data-title="([^"]+)" data-page-title="([^"]+)" data-desc="([^"]+)"', cases):
        slug, name, title, desc = m.group(1), *(html.unescape(g) for g in m.groups()[1:])
        meta = {"title": title, "description": desc, "image": f"og-{slug}.png", "name": name,
                "image_alt": f"{name}: a case study by Sid Jameson", "og_type": "article",
                "modified": last_changed("src/cases.html", "assets/img", "assets/vid")}
        # same document, this case already open: no flash of the home page, and crawlers see the case
        b = only_case(body, slug).replace('<div class="sheet" id="sheet" hidden', '<div class="sheet" id="sheet"', 1)
        # the home page stays in the document for the scripts, hidden; closing the case loads the real home page
        b = b.replace("<main>", "<main hidden>", 1).replace('<footer class="site"', '<footer class="site" hidden', 1)
        b = re.sub(rf'(<article class="case" id="case-{slug}"[^>]*?) hidden>', r"\1>", b, count=1)
        b = b.replace('<span id="sheetTitleText"></span>', f'<span id="sheetTitleText">{html.escape(name)}</span>', 1)
        url = f"{SITE}/{slug}/"
        write(f"{slug}/index.html", head(meta, url, "locked").replace("{{css}}", css) + tail(b))
        urls.append((url, meta["modified"]))
        print(f"{slug}/index.html")
    urls.append(build_next())
    urls.extend(build_built())
    urls.append((SITE + "/Sid_Jameson_Resume.pdf", last_changed("Sid_Jameson_Resume.pdf")))

    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n" for u, d in urls) + "</urlset>\n")


NEXT = {
    "title": "Ask-back review: a speculative prototype · Sid Jameson",
    "name": "Ask-back review",
    "description": "A speculative prototype by Sid Jameson: when a coding agent finishes a pull request, it asks the reviewer "
                   "two or three questions instead of writing a report, and the merge waits for the answers.",
    "image": "og-image.png",
    "image_alt": "Ask-back review: a speculative prototype by Sid Jameson",
    "og_type": "article",
    "genre": "Speculative design prototype",
}


def build_next():
    """/next: a standalone page with the site's tokens and its own stylesheet and script."""
    body, js = read("next.html"), read("next.js")
    body = re.sub(LOCAL, r"\1/\2", body)
    ids = re.findall(r'\sid="([^"]+)"', body)
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise SystemExit(f"next: duplicate ids: {dupes}")
    made = set(re.findall(r'\sid="([\w-]+)"', js))  # ids the script renders itself
    refs = set(re.findall(r"getElementById\('([\w-]+)'\)", js))
    if refs - set(ids) - made:
        raise SystemExit(f"next: script looks up ids that don't exist: {sorted(refs - set(ids) - made)}")
    NEXT["modified"] = last_changed("src/next.html", "src/next.css", "src/next.js")
    url = f"{SITE}/next/"
    css = (read("base.css") + read("next.css")).strip()
    write("next/index.html", head(NEXT, url).replace("{{css}}", css)
          + "<body>\n" + body + "\n<script>\n" + js + "</script>\n</body>\n</html>\n")
    print("next/index.html")
    return url, NEXT["modified"]


EXT = ('<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" fill="none" '
       'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>')
BUILT = [  # slug, name, one line, page title, description
    ("luys-map", "Luys Map", "Telegram app for outages in Yerevan",
     "Luys Map: power, water and gas outages in Yerevan · Sid Jameson",
     "Luys Map, built and run by Sid Jameson: every power, water and gas outage in Yerevan on one map, with alerts "
     "for the places you save. Six sources, a collector every 15 minutes, four languages."),
    ("emlagoo", "Emlagoo", "Android dictation app for Persian schoolchildren",
     "Emlagoo: a dictation teacher for Persian schoolchildren · Sid Jameson",
     "Emlagoo, built by Sid Jameson: the official textbook audio, aligned word by word and played phrase by phrase "
     "for dictation homework. 7.6 hours of audio, 34,361 words, live on Cafe Bazaar."),
    ("haftkhan", "Haft Khan", "A funny game from the Shahnameh",
     "Haft Khan: Rostam's seven labours, a mobile game · Sid Jameson",
     "Haft Khan, made by Sid Jameson: a funny action-adventure true to Ferdowsi's Shahnameh, in Unity, live on "
     "Cafe Bazaar. Seven labours, fifteen achievements, Persian and English."),
    ("safhegardan", "SafheGardan", "A record player for the phone",
     "SafheGardan: bringing the ritual of vinyl to the phone · Sid Jameson",
     "SafheGardan, a prototype by Sid Jameson: crates, a needle drop and real crackle on the phone, playing 28,160 "
     "public-domain 78 rpm sides. Web, Android and iOS from one codebase."),
]
BUILT_FRAME = """<script>try{if(!localStorage.getItem('theme')&&matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark'}catch(e){}</script>
<a class="skip" href="#main">Skip to content</a>
<header class="b-top"><div class="b-top-in"><a class="brand" href="/">Sid Jameson</a><a class="b-back" href="/#built">All projects</a>
<button class="theme" id="themeBtn" type="button" aria-label="Switch to dark theme"><svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button></div></header>
<main id="main">
{{body}}
</main>
<footer class="b-foot"><h2>Also built on my own</h2><div class="b-others">{{others}}</div><p class="home">More work, experience and contact on <a href="/">sidj.work</a></p></footer>
"""
LUYS_USERS = ""  # e.g. '<p class="b-users">1,234 people use it</p>' once the number is in


def build_built():
    """/luys-map/, /emlagoo/, /haftkhan/, /safhegardan/: one page per product I built on my own."""
    css = (read("base.css") + read("built.css")).strip()
    js = read("built.js")
    urls = []
    for slug, name, line, title, desc in BUILT:
        others = "".join(f'<a class="b-other" href="/{s}/"><img src="assets/img/cover-{s.split("-")[0]}.webp" alt="" loading="lazy">'
                         f"<b>{n}</b><span>{html.escape(l)}</span></a>" for s, n, l, *_ in BUILT if s != slug)
        body = BUILT_FRAME.replace("{{body}}", read(f"built-{slug}.html")).replace("{{others}}", others)
        body = body.replace("{{ext}}", EXT).replace("{{luys_users}}", LUYS_USERS)
        body = re.sub(r'<img\b[^>]*?\bsrc="([^"]+)"[^>]*>', add_size, body)
        body = re.sub(LOCAL, r"\1/\2", body)
        ids = re.findall(r'\sid="([^"]+)"', body)
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        refs = set(re.findall(r"getElementById\('([\w-]+)'\)", js))
        if dupes or refs - set(ids):
            raise SystemExit(f"{slug}: duplicate ids {dupes} or missing {sorted(refs - set(ids))}")
        meta = {"title": title, "description": desc, "image": "og-image.png", "name": name,
                "image_alt": f"{name}, built by Sid Jameson", "og_type": "article", "genre": "Product built by the author",
                "modified": last_changed(f"src/built-{slug}.html", "src/built.css", "src/built.js")}
        url = f"{SITE}/{slug}/"
        write(f"{slug}/index.html", head(meta, url).replace("{{css}}", css)
              + "<body>\n" + body + "\n<script>\n" + js + "</script>\n</body>\n</html>\n")
        print(f"{slug}/index.html")
        urls.append((url, meta["modified"]))
    return urls


if __name__ == "__main__":
    build()
