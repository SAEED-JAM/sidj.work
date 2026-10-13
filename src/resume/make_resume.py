"""Builds Sid_Jameson_Resume.pdf (one A4 page) and the preview image the site shows.

Run from this folder:  python3 make_resume.py
Needs PyMuPDF, Pillow and fontTools (pip install pymupdf pillow fonttools). Fonts are Carlito with ligatures
removed, so the PDF text extracts cleanly for ATS parsers.
"""
import os
import fitz
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "Sid_Jameson_Resume.pdf")
PREVIEW = os.path.join(ROOT, "assets", "img", "resume.webp")

CSS = """
@font-face {font-family: C; src: url(Carlito-Regular.ttf);}
@font-face {font-family: C; src: url(Carlito-Bold.ttf); font-weight: bold;}
@font-face {font-family: C; src: url(Carlito-Italic.ttf); font-style: italic;}
@font-face {font-family: C; src: url(Carlito-BoldItalic.ttf); font-weight: bold; font-style: italic;}
* {font-family: C; }
body {font-size: 9.5pt; color: #000; line-height: 1.17;}
p {margin: 0;}
.name {font-size: 16pt; font-weight: bold; color: #1f2a44;}
.title {font-size: 11pt; color: #555555; margin-top: 3pt;}
.links {font-size: 9pt; color: #555555; margin-top: 5pt;}
a {color: #1155cc; text-decoration: none;}
.h {font-size: 9.5pt; font-weight: bold; color: #1f2a44; margin-top: 10.5pt; margin-bottom: 1pt; letter-spacing: 0.4pt;}
.rowp {margin-top: 6.5pt;}
.co {font-size: 10pt; font-weight: bold; color: #1f2a44;}
.role {font-size: 9.5pt; font-weight: bold; color: #1f2a44;}
.about {font-size: 8.5pt; font-style: italic; color: #555555; margin-top: 1pt;}
ul {margin: 1pt 0 0 0; padding-left: 15pt;}
li {margin-top: 1.1pt;}
.edu {margin-top: 2pt;}
.edu span {color: #555555;}
.earlier {margin-top: 2pt;}
"""

DATES = []  # (text, is_sub_role); drawn right-aligned after layout


def row(left, right, cls="co", sub=False):
    i = len(DATES)
    DATES.append((right, sub))
    return f'<p class="{cls} rowp" id="d{i}">{left}</p>'


def ul(*items):
    return "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


HTML = f"""
<p class="name">Sid Jameson</p>
<p class="title">AI Design Engineer · Former Product Design Manager</p>
<p class="links"><a href="mailto:msaeedjg@gmail.com">msaeedjg@gmail.com</a>  |  <a href="https://sidj.work">Portfolio</a>  |  <a href="https://www.linkedin.com/in/mirsaeedjamshidi/">LinkedIn</a>  |  <a href="https://medium.com/@msaeedjg">Medium</a>  |  Yerevan, Armenia</p>

<p class="h">SUMMARY</p>
<p>Eight years designing complex, data-heavy products: trading, security, maps, food delivery, AI learning, and now healthcare.
I help decide what's worth building and make the case to Product, Engineering and the business. <b>Built and led design teams
from scratch</b>, most recently at Andarz, Wallex's AI learning product. Today I design in code with Claude and build the AI
workflows our design team runs on.</p>

<p class="h">EXPERIENCE</p>
{row("AI Design Engineer · Huma", "06/2026 – Present")}
<p class="about">Digital health. Designing Atlas, Huma's UK healthcare product, in code with Claude instead of Figma.</p>
{ul("Built a <b>task audit agent</b>: from a Jira ticket it lists every design change needed, each traced to a PRD line, product decision or acceptance criterion, with before/after sheets.",
    "Built a <b>handoff slicer</b> that produces one HTML file per handoff, so engineers reach every screen state from a single control panel without a design tool.",
    "Built a <b>decision helper</b> for gaps in the PRD: it checks decision notes, NHS England and ICO guidance and competitors, then records the answer in a pull request.")}

{row("Wallex", "11/2024 – 06/2026")}
<p class="about">Iranian crypto exchange and fintech platform (1M+ users): crypto trading and NFT-based lending.</p>
{row("AI Product Design Manager, Andarz (Wallex's AI learning product)", "08/2025 – 06/2026", "role", True)}
{ul("Led design for Andarz, defining how the AI tutor behaves: its tone, what it remembers between sessions, and when it steps in. Developed the <b>M3 framework</b> (Moment, Memory, Momentum).",
    "Built the design team from zero to <b>four designers</b>. AI-assisted, explainable learning: <b>+32% weekly active users, +21% session completion</b>.",
    "Set a prototyping-to-shipping workflow on Figma Make and Cursor; kept design <b>2–3 sprints ahead of engineering</b>.")}
{row("Product Design Manager", "11/2024 – 09/2025", "role", True)}
{ul("Sole design lead between Product and Engineering; built POCs and MVPs for fast validation in a high-stakes trading environment.",
    "Set the platform-wide visual language. Revision cycles dropped <b>from five rounds to two</b>; on-time delivery up <b>25%</b>.")}

{row("Senior Product Designer · Snappfood", "09/2023 – 11/2024")}
<p class="about">On-demand food delivery, 5M+ users, 330K+ daily orders. Promotions (12/2023 – 11/2024); Search &amp; Discovery (09/2023 – 12/2023).</p>
{ul("Owned the Cashback Service turnaround end to end. <b>Usage up 40%, cost down 58%</b>.",
    "Led Promotions design across four cycles and shipped Promotion Center: <b>+20% party orders</b>, <b>+62% pages per session</b> and <b>+5 pts</b> basket conversion for sessions that used it.")}

{row("Product Design Team Lead · Fadak Trains", "10/2022 – 09/2023")}
<p class="about">Premium railway service in Iran. Product Design Consultant (part-time) from 10/2022, Team Lead from 01/2023.</p>
{ul("Raised design speed <b>28%</b> with an end-to-end research, prototype and test process; a design system with four component libraries made UI design <b>20% faster</b>.",
    "Mentored junior and mid-level designers; regular reviews cut revision rounds by <b>50%</b>. Brought <b>2 new products</b> to market with engineering and marketing.")}

{row("Senior Product Designer · Avand HR", "09/2021 – 12/2024")}
<p class="about">Recruitment and talent-management platform with AI-driven job matching.</p>
{ul("Directed an end-to-end product redesign from cross-team research. <b>95% user satisfaction</b>.",
    "Ran delivery as de facto design PM across <b>5 cross-functional teams</b>; timelines improved <b>20%</b>.")}

{row("Product Design Team Lead · Graph Inc.", "06/2020 – 06/2023")}
<p class="about">Threat detection and response: XDR, EDR/MDR and FAM products. Product Designer until 03/2021, then Team Lead.</p>
{ul("Led the FAM product design team; products rated <b>4.5/5</b> by customers.",
    "Design and stakeholder alignment behind a <b>25% revenue increase</b> on the FAM line; launched a Kiosk product that lifted sales <b>20%</b> and retention <b>15%</b>.")}

<p class="h">OTHER EXPERIENCE</p>
<p class="earlier"><b>Product Designer</b>, BluefoxAI (2020 – 2021) and Hezardastan Group (2020 – 2021) · <b>Lead UI/UX Designer</b>, apiEco (2020) ·
<b style="white-space:nowrap">UI/UX Designer</b>, Anardoni, an iOS app store with 1M+ users (2018 – 2020) · <b>UX Designer</b>, Cafe Bazaar and Balad (apprenticeships, 2019) ·
<b>UI/UX Designer</b>, BINATEB (2019) · <b>Graphic Designer</b>, Masire Sefid and Azarnegar (2017 – 2018)</p>

<p class="h">EDUCATION</p>
<p class="edu"><b>B.Sc. in Software Engineering</b><span>  ·  University of Zanjan, Iran (2016 – 2020)</span></p>
"""

LINKS = [("msaeedjg@gmail.com", "mailto:msaeedjg@gmail.com"), ("Portfolio", "https://sidj.work"),
         ("LinkedIn", "https://www.linkedin.com/in/mirsaeedjamshidi/"), ("Medium", "https://medium.com/@msaeedjg")]


def ensure_fonts():
    """Downloads Carlito (OFL) and removes its ligature table so text extracts cleanly.
    The modified files stay local (gitignored); only subsets get embedded in the PDF."""
    import urllib.request
    from fontTools.ttLib import TTFont
    os.makedirs(FONTS, exist_ok=True)
    for n in ("Regular", "Bold", "Italic", "BoldItalic"):
        path = os.path.join(FONTS, f"Carlito-{n}.ttf")
        if os.path.exists(path):
            continue
        urllib.request.urlretrieve(f"https://github.com/google/fonts/raw/main/ofl/carlito/Carlito-{n}.ttf", path)
        f = TTFont(path)
        if "GSUB" in f:
            del f["GSUB"]
        f.save(path)


def build():
    ensure_fonts()
    story = fitz.Story(html=HTML, user_css=CSS, archive=fitz.Archive(FONTS))
    media = fitz.paper_rect("a4")
    where = media + (47, 34, -47, -30)
    pos = {}

    def rec(p):
        if p.id and p.id.startswith("d") and p.open_close & 1:
            pos[p.id] = (p.page_num, fitz.Rect(p.rect))

    tmp = OUT + ".tmp.pdf"
    writer = fitz.DocumentWriter(tmp)
    more, pages = 1, 0
    while more:
        dev = writer.begin_page(media)
        more, _ = story.place(where)
        story.element_positions(rec, {"page_num": pages})
        story.draw(dev)
        writer.end_page()
        pages += 1
    writer.close()

    doc = fitz.open(tmp)
    reg = os.path.join(FONTS, "Carlito-Regular.ttf")
    font = fitz.Font(fontfile=reg)
    for i, (txt, sub) in enumerate(DATES):
        pg, r = pos["d%d" % i]
        page = doc[pg]
        size = 8.5 if sub else 9
        page.insert_font(fontname="carl", fontfile=reg)
        page.insert_text((where.x1 - font.text_length(txt, fontsize=size), r.y0 + (8.4 if sub else 8.6)),
                         txt, fontname="carl", fontsize=size, color=(0x55 / 255,) * 3)
    p0 = doc[0]
    for word, uri in LINKS:
        hits = [r for r in p0.search_for(word) if r.y0 < 90]
        if hits:
            p0.insert_link({"kind": fitz.LINK_URI, "from": hits[0], "uri": uri})
    doc.set_metadata({"title": "Sid Jameson - Resume", "author": "Sid Jameson", "subject": "Résumé of Sid Jameson, AI Design Engineer"})
    doc.set_language("en-US")
    doc.subset_fonts()
    doc.save(OUT, garbage=4, deflate=True)
    doc.close()
    os.remove(tmp)

    d = fitz.open(OUT)
    d[0].get_pixmap(matrix=fitz.Matrix(2.6, 2.6)).save(PREVIEW + ".png")
    Image.open(PREVIEW + ".png").convert("RGB").save(PREVIEW, quality=90, method=6)
    os.remove(PREVIEW + ".png")
    W, H = d[0].rect.width, d[0].rect.height
    print(f"{OUT}: {pages} page(s)")
    for l in d[0].get_links():  # hotspot positions for the site's viewer
        r = l["from"]
        print(l["uri"], f"left:{r.x0/W*100:.2f}%;top:{r.y0/H*100:.2f}%;width:{r.width/W*100:.2f}%;height:{r.height/H*100:.2f}%")


if __name__ == "__main__":
    build()
