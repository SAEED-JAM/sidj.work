"""Replaces the Workflow section in home.html with the lane diagram."""
H = open("home.html").read()

ICONS = {
 "scan": '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 10h8M8 14h5"/>',
 "chat": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
 "scale": '<path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z"/>',
 "code": '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
 "screen": '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
 "slice": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
 "rocket": '<path d="M5 15c-1.5 1.5-2 4-2 6 2 0 4.5-.5 6-2M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5z"/><circle cx="15" cy="9" r="1.5"/>',
 "loop": '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
 "pause": '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
 "play": '<path d="M7 4v16l13-8z"/>',
}
def ic(k, fill=False):
    a = 'fill="currentColor" stroke="none"' if fill else 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'
    return f'<svg viewBox="0 0 24 24" {a}>{ICONS[k]}</svg>'

def node(nid, icon, title, sub, cls=""):
    return f'<div class="wn {cls}" data-n="{nid}"><span class="wn-ic">{ic(icon)}</span><div><b>{title}</b><small>{sub}</small></div><i class="wn-dot"></i></div>'

me = ('<div class="wn me" data-n="me"><span class="wn-orb"><img src="assets/img/portrait.webp" alt=""></span>'
      '<div><b>Sid</b><small>AI design engineer</small></div><i class="wn-dot"></i></div>')

LANES = [
 ("01", "Understand", "single", node("task", "scan", "Task audit", "Ticket, PRDs &amp; decisions")),
 ("02", "Think with AI", "think", node("claude", "chat", "Claude", "Thinking partner") + me + node("decide", "scale", "Decision helper", "PRD gaps · NHS &amp; ICO")),
 ("03", "Bridge", "single", node("code", "code", "Claude Code", "Design ↔ code, no Figma")),
 ("04", "Make", "pair", node("proto", "screen", "HTML prototype", "Screens &amp; flows on the design system") + node("slicer", "slice", "Handoff slicer", "Every state in one file")),
 ("05", "Ship", "single", node("ship", "rocket", "Shipped", "PR · live · tracked")),
]
lanes = "\n".join(f'''        <div class="wl wl-{kind}" data-l="{i}">
          <span class="wl-h mono"><em>{num}</em> {name}</span>
          <div class="wl-body">{body}</div>
        </div>''' for i, (num, name, kind, body) in enumerate(LANES))

section = f'''<section class="sec" id="workflow" style="padding-top:0">
  <div class="col">
    <div class="sec-head rv"><h2>Workflow</h2><p>How a ticket becomes shipped software at Huma: in code, with Claude, and no Figma.</p></div>
  </div>
  <div class="wrap">
    <div class="wf-panel rv">
      <div class="wf" id="wf" data-step="0">
        <svg class="wf-svg" id="wfSvg" aria-hidden="true"></svg>
        <div class="wf-labels" id="wfLabels" aria-hidden="true"></div>
{lanes}
        <div class="wf-loop-pill" id="wfLoop">{ic("loop")}Feedback loop · learn &amp; iterate</div>
      </div>
      <div class="wf-foot">
        <span class="wf-cap"><b id="wfNum">01 / 06</b><span id="wfCap">Start from a real ticket</span></span>
        <button class="wf-play" id="wfPlay" aria-label="Pause walkthrough"><span class="i-pause">{ic("pause", True)}</span><span class="i-play">{ic("play", True)}</span></button>
      </div>
    </div>
  </div>
</section>'''

s = H.index('<section class="sec" id="workflow"'); e = H.index('</section>', s) + len('</section>')
H = H[:s] + section + H[e:]
open("home.html", "w").write(H)
print("ok")
