"""Plain-text copies of the site for AI agents and crawlers, made from the same sources as the pages.

A recruiter's agent that fetches a page gets the whole design with it: navigation, every case study in one
document, markup. These files carry only the words, in reading order:

  /llms.txt        who I am and where each page's plain copy is (the llms.txt convention)
  /llms-full.txt   everything below in one file
  /profile.md      the home page: intro, experience, writing, recommendations, contact
  /<slug>.md       one per case study and per product I built

Nothing here is written by hand, so the copies can't drift from the pages. A private part of a case
(see lock.js) is encrypted in the source and stays out; its gate's public description is kept.
"""
import html
import re
from html.parser import HTMLParser

SKIP_TAGS = {"script", "style", "svg", "nav", "button", "video", "audio", "form", "template", "noscript", "canvas"}
SKIP_CLASS = {"toc", "next-case", "lock-peek", "lock-form", "lock-msg", "lock-ic", "sheet-bar", "case-bento", "skip",
              "q-names", "xp-nav", "xp-ctrl", "b-top", "b-foot", "facts", "fl-foot", "fl-cta"}
BLOCK = {"p", "div", "section", "article", "header", "footer", "main", "figure", "figcaption", "ul", "ol", "dl", "table",
         "tr", "blockquote", "details", "summary", "aside", "pre"}
VOID = {"img", "br", "hr", "input", "meta", "link", "source", "wbr"}
# instructions for the pointer mean nothing in a text copy
UI_ONLY = re.compile(r"\s*(Click to zoom\.?|Drag to compare|Scroll or drag sideways for earlier roles, and open a card for details\.|Click to play\.?)")
ROWS = {"results", "meta", "outcome", "b-stats", "wf-io"}  # children of these read as "label: value" lines


class Markdown(HTMLParser):
    def __init__(self, site, shift=0):
        super().__init__(convert_charrefs=True)
        self.site, self.shift = site, shift
        self.out, self.buf, self.stack = [], [], []   # stack: (tag, classes, skipped)
        self.skip, self.list, self.href, self.a_at = 0, [], None, 0

    # -- text
    def text(self, s):
        if self.skip:
            return
        s = re.sub(r"\s+", " ", s)
        if s:
            self.buf.append(s)

    def flush(self, prefix=""):
        line = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        self.buf = []
        line = line.replace("****", "")
        line = UI_ONLY.sub("", line).strip()
        line = re.sub(r"\s+([,.;:!?])", r"\1", line)
        if line:
            self.out.append(prefix + line)

    def in_rows(self):
        return len(self.stack) >= 2 and (self.stack[-2][1] & ROWS or self.stack[-2][0] == "dl")

    # -- tags
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = set((a.get("class") or "").split())
        if tag in VOID:
            if tag == "br":
                self.text(" ")
            elif tag == "img" and not self.skip and (a.get("alt") or "").strip() and len(a["alt"]) > 12:
                self.flush(); self.out.append(f"_Image: {a['alt'].strip()}_")
            return
        skipped = bool(self.skip or tag in SKIP_TAGS or cls & SKIP_CLASS or a.get("aria-hidden") == "true")
        self.stack.append((tag, cls, skipped))
        if skipped:
            self.skip += 1
            return
        if tag in BLOCK or re.fullmatch(r"h[1-6]", tag) or tag in ("li", "dt"):
            self.flush()
        if tag in ("ul", "ol"):
            self.list.append(tag)
            if a.get("aria-label"):   # a list named only for screen readers keeps its name
                self.out.append(a["aria-label"].strip() + ":")
        elif tag in ("b", "strong") or tag == "dt":
            self.buf.append(" **")
        elif tag in ("em", "i") and "mono" not in cls:
            self.buf.append(" ")
        elif tag == "a":
            self.href, self.a_at = a.get("href"), len(self.out)
            self.buf.append(" [")
        elif tag in ("span", "small", "td", "th", "code"):
            self.buf.append(" ")

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        while self.stack and self.stack[-1][0] != tag:   # unclosed inline tags
            if self.stack.pop()[2]:
                self.skip -= 1
        if not self.stack:
            return
        _, cls, skipped = self.stack[-1]
        if skipped:
            self.stack.pop(); self.skip -= 1
            return
        m = re.fullmatch(r"h([1-6])", tag)
        if m:
            self.flush("#" * min(6, max(1, int(m.group(1)) + self.shift)) + " ")
        elif tag == "li":
            self.flush("  " * (len(self.list) - 1) + "- ")
        elif tag in ("ul", "ol"):
            self.flush(); self.list.pop()
        elif tag in ("b", "strong"):
            self.buf.append("** ")
        elif tag == "dt":
            self.buf.append(":** ")
        elif tag == "a":
            href, self.href = self.href, None
            ok = href and not href.startswith("#") and not href.startswith("javascript")
            if ok and href.startswith("/"):
                href = self.site + href
            if len(self.out) != self.a_at:   # a card-sized link with headings inside: its address goes on its own line
                self.flush()
                self.out[self.a_at] = re.sub(r"^(#+ |- |> )?\[ ?", r"\1", self.out[self.a_at])
                self.out = [l for l in self.out if l.strip() not in ("", "[")]
                if ok:
                    self.out.append(f"Link: {href}")
            elif ok:
                self.buf.append(f"]({href}) ")
            else:   # an in-page jump: keep the words, drop the link
                for i in range(len(self.buf) - 1, -1, -1):
                    if self.buf[i] == " [":
                        self.buf[i] = " "; break
        elif tag == "dd" and len(self.stack) >= 2 and self.stack[-2][0] == "dl":
            self.flush("- ")
        elif tag == "blockquote":
            self.flush("> ")
        elif tag == "div" and self.in_rows():
            self.flush("- ")
        elif tag in BLOCK:
            self.flush()
        elif tag in ("span", "small", "td", "th", "i", "em"):
            self.buf.append(" ")
        self.stack.pop()

    def handle_data(self, data):
        self.text(data)

    def result(self):
        self.flush()
        lines, out = self.out, []
        for i, l in enumerate(lines):
            item, prev_item = l.lstrip().startswith("- "), i and lines[i - 1].lstrip().startswith("- ")
            if out and not (item and prev_item):
                out.append("")
            out.append(l)
        return "\n".join(out).strip() + "\n"


def to_md(fragment, site, shift=0):
    p = Markdown(site, shift)
    p.feed(fragment.replace("{{ext}}", ""))
    p.close()
    return p.result()


def section(body, sec_id):
    """One <section id=...> of the home page."""
    m = re.search(rf'<section\b[^>]*\bid="{sec_id}"[\s\S]*?</section>', body)
    return m.group(0) if m else ""


def case_articles(cases):
    """slug -> (title, description, html) for every case study."""
    out = {}
    for m in re.finditer(r'<article class="case" id="case-([a-z-]+)" data-title="([^"]+)" data-page-title="[^"]+" data-desc="([^"]+)"', cases):
        end = cases.index("</article>", m.start())
        out[m.group(1)] = (html.unescape(m.group(2)), html.unescape(m.group(3)), cases[m.start():end])
    return out


def front(title, url, desc, facts=()):
    lines = [f"# {title}", "", f"> {desc}", "", f"Page: {url}", "Author: Sid Jameson (https://sidj.work/)"]
    lines += list(facts)
    return "\n".join(lines) + "\n\n"


def build_ai(site, home_meta, person, home, cases, built, read, write, next_meta=None):
    """Writes the plain copies; returns the paths written."""
    arts = case_articles(cases)
    email = re.search(r'mailto:([\w.+-]+@[\w.-]+)', home).group(1)
    links = {"LinkedIn": person["sameAs"][0], "Medium": person["sameAs"][1], "GitHub": next((u for u in person["sameAs"] if "github" in u), "")}
    open_to = re.sub(r"<[^>]+>", "", re.search(r'id="contact"[\s\S]*?<div class="sec-h[^>]*><h2>Contact</h2><p>(.*?)</p>', home).group(1))
    aka = re.sub(r"<[^>]+>", "", re.search(r'<p class="aka">(.*?)</p>', home).group(1))

    facts = [
        f"- **Name:** {person['name']} (also {', '.join(person['alternateName'])}). {aka}",
        f"- **Current role:** {person['jobTitle']} at {person['worksFor']['name']}",
        f"- **Based in:** {person['address']['addressLocality']}, Armenia",
        f"- **Looking for:** {html.unescape(open_to)}",
        f"- **Email:** {email}",
        "- **Profiles:** " + ", ".join(f"[{k}]({v})" for k, v in links.items() if v),
        f"- **Résumé (PDF):** {site}/Sid_Jameson_Resume.pdf",
    ]
    pages = {}

    # profile.md: the home page without the embedded cases
    md = front(home_meta["title"], site + "/", home_meta["description"])
    md += "## At a glance\n\n" + "\n".join(facts) + "\n\n"
    md += to_md(section(home, "top"), site, 1)
    md += "\n## Case studies\n\n" + "".join(f"- [{t}]({site}/{s}.md): {d}\n" for s, (t, d, _) in arts.items())
    if built:
        md += "\n## Built on my own\n\n" + "".join(f"- [{n}]({site}/{s}.md): {l}. {d}\n" for s, n, l, _, d in built)
    for sid in ("workflow", "experience", "writing", "words"):
        md += "\n" + to_md(section(home, sid), site)
    md += "\n## Contact\n\n" + "\n".join(facts[3:]) + "\n"
    pages["profile.md"] = md

    for slug, (title, desc, art) in arts.items():
        note = ""
        if 'class="chap lockgate"' in art:
            note = ("\n_Part of this case study is private and is not in this copy. The public part is complete "
                    f"as written; the rest is available from the author on request ({email})._\n")
        pages[f"{slug}.md"] = front(f"{title}: a case study by Sid Jameson", f"{site}/{slug}/", desc) + to_md(art, site) + note
    for slug, name, line, title, desc in built:
        pages[f"{slug}.md"] = front(f"{name}: {line}", f"{site}/{slug}/", desc) + to_md(read(f"built-{slug}.html"), site)
    if next_meta:
        pages["next.md"] = front(next_meta["name"] + ": a speculative prototype by Sid Jameson", f"{site}/next/",
                                 next_meta["description"]) + to_md(read("next.html"), site)

    # llms.txt: the index
    idx = [f"# {person['name']}", "", f"> {person['description']}", "",
           "This is the personal site of Sid Jameson, a product designer and AI design engineer. Every page has a plain "
           "Markdown copy, listed below, with the page's words and none of its markup (images are described by their captions; "
           "one case study has a private part, which is left out and marked). "
           f"[llms-full.txt]({site}/llms-full.txt) holds all of them in one file.", "",
           "## At a glance", "", *facts, "",
           "## Profile", "", f"- [Profile]({site}/profile.md): introduction, how I work with AI, experience, writing, recommendations, contact", "",
           "## Case studies", ""]
    idx += [f"- [{t}]({site}/{s}.md): {d}" for s, (t, d, _) in arts.items()]
    if built:
        idx += ["", "## Built on my own", ""] + [f"- [{n}]({site}/{s}.md): {l}. {d}" for s, n, l, _, d in built]
    if next_meta:
        idx += ["", "## Optional", "", f"- [{next_meta['name']}]({site}/next.md): {next_meta['description']}"]
    pages["llms.txt"] = "\n".join(idx) + "\n"
    order = ["profile.md"] + [f"{s}.md" for s in arts] + [f"{s}.md" for s, *_ in built] + (["next.md"] if next_meta else [])
    pages["llms-full.txt"] = "\n\n---\n\n".join(pages[p].strip() for p in order) + "\n"

    for path, text in pages.items():
        write(path, text)
    return pages
