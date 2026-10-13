"""Regenerates the Experience (horizontal timeline) and Workflow sections inside home.html."""
import re

H = open("home.html").read()

# ---------- Experience data (LinkedIn, newest first) ----------
XP = [
 dict(id="huma", logo="huma.png", co="Huma", meta="Full-time · 5 mos", yrs="2026 — Now", now=True, roles=[
   ("AI Design Engineer", "Jun 2026 — Present · Armenia, on-site")],
   more='<p>I design Atlas, Huma’s UK healthcare product, and build the AI workflows the design team uses every day. I work in code with Claude instead of Figma.</p><ul><li><b>Task audit agent:</b> every design change a Jira ticket needs, each traced to a PRD line, decision or acceptance criterion.</li><li><b>Handoff slicer:</b> one HTML file per handoff, every screen state reachable from one control panel.</li><li><b>Decision helper:</b> answers what the PRD leaves open from decision notes, NHS England and ICO guidance and competitors, then records it in a pull request.</li></ul>'),
 dict(id="wallex", logo="wallex.png", co="Wallex", meta="Full-time · 1 yr 8 mos", yrs="2024 — 2026", roles=[
   ("AI Product Design Manager", "Aug 2025 — Jun 2026"), ("Product Design Manager", "Nov 2024 — Sep 2025 · Tehran")],
   more='<p>Led design for ANDARZ, Wallex’s AI learning product: how the AI tutor behaves, what it remembers between sessions, and when it steps in as a learner hesitates. Developed the M3 framework (Moment, Memory, Momentum).</p><ul><li>Built the design team from zero to <b>four designers</b>.</li><li><b>+32% weekly active users, +21% session completion</b>.</li><li>Platform-wide visual language: revisions <b>from five rounds to two</b>.</li></ul>'),
 dict(id="snappfood", logo="snappfood.png", co="Snappfood", meta="Full-time · 1 yr 3 mos", yrs="2023 — 2024", roles=[
   ("Senior Product Designer, Promotions", "Dec 2023 — Nov 2024"), ("Senior Product Designer, Search & Discovery", "Sep 2023 — Dec 2023")],
   more='<ul><li>Cashback turnaround end to end: <b>usage +40%, cost −58%</b>.</li><li>Shipped the <a href="#promotion-center" data-open="promotion-center">Promotion Center</a>: <b>+62% engagement</b>.</li></ul>'),
 dict(id="fadak", logo="fadak.png", co="Fadak Trains", meta="1 yr", yrs="2022 — 2023", roles=[
   ("Product Design Team Lead", "Jan 2023 — Sep 2023 · Full-time"), ("Product Design Consultant", "Oct 2022 — Jan 2023 · Part-time")],
   more='<ul><li>Design speed <b>+28%</b> through an end-to-end research, prototype and test process.</li><li>A design system with four component libraries: UI design <b>20% faster</b>.</li><li><b>50% fewer revisions</b> and <b>2 new products</b> brought to market.</li></ul>'),
 dict(id="graph", logo="graph.png", co="Graph Inc.", meta="Full-time · 3 yrs 1 mo", yrs="2020 — 2023", roles=[
   ("Product Design Team Lead", "Mar 2021 — Jun 2023"), ("Product Designer", "Jun 2020 — Mar 2021 · Tehran")],
   more='<ul><li>Led the FAM product design team; products rated <b>4.5/5</b> by customers.</li><li>FAM product line revenue <b>+25%</b>.</li><li>Kiosk product: <b>+20% sales</b>; extended to FAM, <b>+15% retention</b>.</li></ul>'),
 dict(id="hezardastan", logo="hezardastan.png", co="Hezardastan Group", meta="Part-time · 1 yr 3 mos", yrs="2020 — 2021", roles=[
   ("Product Designer", "Sep 2020 — Nov 2021 · Tehran")], more=""),
 dict(id="bluefox", logo="bluefox.png", co="BluefoxAI", meta="Full-time · 1 yr", yrs="2020 — 2021", roles=[
   ("Product Designer", "Sep 2020 — Aug 2021")],
   more='<p>AI, machine learning and data analysis applied to immigration, so applicants drive their own journey.</p>'),
 dict(id="apieco", logo="apieco.png", co="apiEco", meta="6 mos", yrs="2020", roles=[
   ("Lead UI/UX Designer", "Apr 2020 — Aug 2020 · Full-time"), ("UI/UX Designer", "Mar 2020 · Freelance")],
   more='<p>A platform for designing, publishing, testing and managing APIs.</p>'),
 dict(id="anardoni", logo="anardoni.png", co="Anardoni", meta="Self-employed · 2 yrs 5 mos", yrs="2018 — 2020", roles=[
   ("UI/UX Designer", "Jan 2018 — May 2020 · Tehran")],
   more='<p>An iOS app store with over 1 million active users.</p><ul><li>Led the UX research and design team.</li><li>Wireframes, storyboards, icons and campaign visuals.</li></ul>'),
 dict(id="bazaar", logo="bazaar.png", co="Cafe Bazaar", meta="Apprenticeship · 4 mos", yrs="2019", roles=[
   ("UX Designer", "Aug 2019 — Nov 2019")], more='<p>Iran’s Android app platform, with over 40 million users.</p>'),
 dict(id="balad", logo="balad.png", co="Balad", meta="Apprenticeship · 4 mos", yrs="2019", roles=[
   ("UX Designer", "Aug 2019 — Nov 2019")],
   more='<ul><li>User testing and usability studies that led to several design improvements.</li></ul>'),
 dict(id="binateb", logo="binateb.png", co="BINATEB", meta="Freelance · 7 mos", yrs="2019", roles=[
   ("UX Designer", "Feb 2019 — Aug 2019 · Tehran"), ("UI Designer", "Feb 2019 — Jun 2019")],
   more='<p>Glasses lens replacement and eye exams from home.</p><ul><li>UX for the Rx lens ordering flow; led the web and app design team.</li><li>Supported implementation with HTML and CSS.</li></ul>'),
 dict(id="masire", logo="masire.png", co="Masire Sefid Ad Co.", meta="Part-time · 6 mos", yrs="2018", roles=[
   ("Graphic Designer", "Feb 2018 — Jul 2018 · Zanjan")], more=""),
 dict(id="azarnegar", logo="azarnegar.png", co="Azarnegar", meta="Apprenticeship · 1 yr 1 mo", yrs="2017", roles=[
   ("Designer", "Jan 2017 — Jan 2018 · Ardabil")], more='<p>Print, publication and advertising design.</p>'),
]

def card(x):
    roles = "".join(f'<div class="xr"><h4>{t}</h4><span>{w}</span></div>' for t, w in x["roles"])
    more = (f'<div class="xc-more"><div>{x["more"]}</div></div>'
            f'<button class="xc-toggle" aria-expanded="false"><span>Details</span><i class="plus" aria-hidden="true"></i></button>') if x["more"] else ""
    return f'''        <article class="xc{' now' if x.get('now') else ''}" id="xp-{x['id']}">
          <span class="xc-yr mono">{x['yrs']}</span><span class="xc-dot" aria-hidden="true"></span>
          <div class="xc-card">
            <div class="xc-head"><span class="logo"><img src="assets/logo/{x['logo']}" alt=""></span><div><b>{x['co']}</b><small>{x['meta']}</small></div></div>
            <div class="xc-roles">{roles}</div>
            {more}
          </div>
        </article>'''

ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>'
ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>'
xp_section = f'''<section class="sec" id="experience" style="padding-top:0">
  <div class="col">
    <div class="sec-head rv"><h2>Experience</h2><p>From LinkedIn, newest first. Drag or scroll sideways to go back in time; open a card for details.</p></div>
  </div>
  <div class="xp-wrap rv">
    <div class="xp-track" id="xpTrack">
{chr(10).join(card(x) for x in XP)}
        <article class="xc edu-card">
          <span class="xc-yr mono">2016 — 2020</span><span class="xc-dot" aria-hidden="true"></span>
          <div class="xc-card"><div class="xc-head"><span class="logo edu-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/></svg></span><div><b>University of Zanjan</b><small>Education</small></div></div>
            <div class="xc-roles"><div class="xr"><h4>B.Sc. Software Engineering</h4><span>2016 — 2020</span></div></div></div>
        </article>
    </div>
  </div>
  <div class="col">
    <div class="xp-ctrl"><button class="xp-prev" aria-label="Newer">{ARROW_L}</button><button class="xp-next" aria-label="Older">{ARROW_R}</button><div class="xp-bar"><i></i></div><span class="mono muted" id="xpRange">2026</span></div>
  </div>
</section>'''

# ---------- Workflow ----------
ICONS = {
 "doc": '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
 "scan": '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 12h8"/>',
 "chat": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
 "scale": '<path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z"/>',
 "code": '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
 "layers": '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
 "slice": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
 "pr": '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v7M18 15.5V9a3 3 0 0 0-3-3h-4"/><path d="M13 4l-2 2 2 2"/>',
 "rocket": '<path d="M5 15c-1.5 1.5-2 4-2 6 2 0 4.5-.5 6-2M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5z"/><circle cx="15" cy="9" r="1.5"/>',
}
def ic(k): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{ICONS[k]}</svg>'
STAGES = [
 ("Understand", [("doc", "Jira task &amp; PRDs", "Scope, acceptance criteria, the decisions already made"),
                 ("scan", "Task audit agent", "A change list where every item cites its source")]),
 ("Think with AI", [("me", "Sid", "Owns the call: what’s worth building and why"),
                    ("chat", "Claude", "Thinking partner for options and trade-offs"),
                    ("scale", "Decision helper", "Fills PRD gaps from decision notes, NHS and ICO guidance")]),
 ("Make", [("code", "Claude Code", "Screens and flows built as working HTML prototypes"),
           ("layers", "Design system", "Tokens and the components already built")]),
 ("Hand off", [("slice", "Handoff slicer", "One HTML file, every screen state from one panel"),
               ("pr", "Pull request", "Decisions recorded where engineers already work")]),
 ("Ship", [("rocket", "Shipped", "Live, measured, and fed back into the next task")]),
]
def node(k, t, d):
    if k == "me":
        return f'<div class="wf-node me"><span class="wf-ic"><img src="assets/img/portrait.webp" alt=""></span><div><b>{t}</b><small>{d}</small></div></div>'
    return f'<div class="wf-node"><span class="wf-ic">{ic(k)}</span><div><b>{t}</b><small>{d}</small></div></div>'
stages_html = "\n".join(f'''        <div class="wf-stage" data-i="{i}">
          <div class="wf-label"><span class="wf-num">{i+1}</span><span class="mono">{name}</span></div>
          <div class="wf-nodes">{''.join(node(*n) for n in nodes)}</div>
        </div>''' for i, (name, nodes) in enumerate(STAGES))
wf_section = f'''<section class="sec" id="workflow" style="padding-top:0">
  <div class="col">
    <div class="sec-head rv"><h2>Workflow</h2><p>How a task moves from ticket to shipped at Huma. In code, with Claude, and no Figma.</p></div>
    <div class="wf rv" id="wf">
      <div class="wf-rail" aria-hidden="true"><i class="wf-fill"></i><i class="wf-pulse"></i></div>
{stages_html}
      <div class="wf-loop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/></svg>Feedback loop: learn, then the next ticket</div>
    </div>
  </div>
</section>'''

s = H.index('<section class="sec" id="experience"'); e = H.index('</section>', s) + len('</section>')
H = H[:s] + xp_section + "\n\n" + wf_section + H[e:]
H = H.replace('<a href="#experience" data-sec="experience"><i></i><span>Experience</span></a>',
              '<a href="#experience" data-sec="experience"><i></i><span>Experience</span></a>\n  <a href="#workflow" data-sec="workflow"><i></i><span>Workflow</span></a>')
open("home.html", "w").write(H)
print("ok", H.count('class="xc'), H.count('wf-stage'))
