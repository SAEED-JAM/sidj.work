const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;

/* overlay stack: one place for scroll lock, inert background, Escape and focus return */
const layers = [];
const behind = () => [$('main'), $('#nav'), $('footer.site')];
const syncLayers = () => {
  const top = layers[layers.length - 1];
  behind().forEach(el => { if (el) el.inert = !!top; });
  layers.forEach(l => { l.el.inert = l !== top; });
  root.classList.toggle('locked', layers.length > 0);
};
const pushLayer = (el, close) => {
  if (layers.some(l => l.el === el)) return;
  layers.push({ el, close, opener: document.activeElement });
  syncLayers();
};
const popLayer = el => {
  const i = layers.findIndex(l => l.el === el); if (i < 0) return;
  const [l] = layers.splice(i, 1); l.el.inert = false; syncLayers();
  if (l.opener && l.opener !== document.body && document.contains(l.opener) && l.opener.checkVisibility?.() !== false) l.opener.focus({ preventScroll: true });
  else if (l.el.contains(document.activeElement)) document.activeElement.blur(); // never leave focus inside a closed layer
};
addEventListener('keydown', e => { if (e.key === 'Escape' && layers.length) { e.preventDefault(); layers[layers.length - 1].close(); } });

/* theme */
const store = { get(k){ try { return localStorage.getItem(k) } catch(e){ return null } }, set(k,v){ try { localStorage.setItem(k,v) } catch(e){} } };
const saved = store.get('theme'); if (saved) root.dataset.theme = saved;
const isDark = () => root.dataset.theme === 'dark';
const themeLabel = () => { $('#themeBtn').setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme'); const m = $('meta[name="theme-color"]'); if (m) m.content = isDark() ? '#09090b' : '#fbfbfc'; };
themeLabel();
$('#themeBtn').addEventListener('click', e => {
  const next = isDark() ? 'light' : 'dark';
  const apply = () => { root.dataset.theme = next; store.set('theme', next); themeLabel(); };
  if (!document.startViewTransition || reduce) return apply();
  const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width/2, y = r.top + r.height/2;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] }, { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }));
});
const vt = document.createElement('style'); vt.textContent = '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}'; document.head.appendChild(vt);

/* compact menu (below 1180px, where the section rail is hidden) */
const menuBtn = $('#menuBtn'), menu = $('#menu');
const setMenu = open => {
  menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open); menuBtn.textContent = open ? 'Close' : 'Menu';
  if (open) { requestAnimationFrame(() => menu.classList.add('on')); $('a', menu).focus({ preventScroll: true }); } else menu.classList.remove('on');
};
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', e => { if (e.target.closest('a, button')) setMenu(false); });
document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#menu, #menuBtn')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
menu.addEventListener('focusout', e => { if (e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== menuBtn) setMenu(false); });
matchMedia('(min-width: 1181px)').addEventListener('change', e => { if (e.matches && !menu.hidden) setMenu(false); });

/* toast + copy */
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2000); };
const copy = (text, msg) => {
  const fallback = () => {
    const el = $('#email'), key = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘C' : 'Ctrl+C';
    if (text === el.textContent) { const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); toast(`Selected. Press ${key} to copy`); }
    else toast(`Couldn’t copy. It’s ${text}`);
  };
  try { navigator.clipboard.writeText(text).then(() => toast(msg), fallback); } catch (e) { fallback(); }
};
$$('.copy-mail').forEach(b => b.addEventListener('click', () => { copy($('#email').textContent, 'Email copied'); if (b.textContent.trim()) { const t = b.textContent; b.textContent = 'Copied'; setTimeout(() => b.textContent = t, 1600); } }));
$$('.sw').forEach(s => s.addEventListener('click', () => copy(s.dataset.hex, s.dataset.hex + ' copied')));

/* clock */
const tick = () => { const t = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Yerevan' }).format(new Date()); $('#clock').textContent = t; $('#clock2').textContent = t; };
tick(); setInterval(tick, 15000);

/* pointer drift for the top glow */
/* time in the current role, counted the way LinkedIn does (both end months included) */
$$('[data-since]').forEach(el => {
  const [y, m] = el.dataset.since.split('-').map(Number), d = new Date(), n = (d.getFullYear() - y) * 12 + d.getMonth() + 2 - m;
  const yr = Math.floor(n / 12), mo = n % 12;
  if (n > 0) el.textContent = ' · ' + [yr && yr + (yr > 1 ? ' yrs' : ' yr'), mo && mo + (mo > 1 ? ' mos' : ' mo')].filter(Boolean).join(' ');
});

/* header: a rule once the page scrolls; the current section's link is underlined */
const nav = $('#nav'), navLinks = $$('.links a'), SECS = ['top', 'work', 'workflow', 'experience', 'writing', 'words', 'contact'];
const markNav = id => navLinks.forEach(l => l.dataset.sec === id ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current'));
const secObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) markNav(e.target.id); }), { rootMargin: '-40% 0px -55% 0px' });
SECS.forEach(id => secObs.observe(document.getElementById(id)));
const onScroll = () => { nav.classList.toggle('scrolled', scrollY > 8); if (innerHeight + scrollY >= document.documentElement.scrollHeight - 8) markNav('contact'); };
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* reveal: only below-the-fold elements, and they rest visible */
const rvObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); rvObs.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
if (!reduce) $$('main .rv').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); rvObs.observe(el); } });

/* counters (case studies) */
const fmt = (el, v) => { el.textContent = (el.dataset.prefix || '') + Math.round(v) + (el.dataset.suffix || ''); };
const runCount = el => { if (el._done || reduce) return; el._done = true; const to = +el.dataset.count, t0 = performance.now(), d = 1300; const step = t => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 4); fmt(el, to * e); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

/* videos play when visible, each with its own pause button */
const autoplay = v => !reduce && !v._userPaused;
$$('video[data-auto]').forEach(v => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'vp paused'; b.setAttribute('aria-label', 'Play video');
  b.innerHTML = '<svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg><svg class="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';
  b.addEventListener('click', e => { e.stopPropagation(); if (v.paused) { v._userPaused = false; v.preload = 'auto'; v.play().catch(() => {}); } else { v._userPaused = true; v.pause(); } });
  v.addEventListener('play', () => { b.classList.remove('paused'); b.setAttribute('aria-label', 'Pause video'); });
  v.addEventListener('pause', () => { b.classList.add('paused'); b.setAttribute('aria-label', 'Play video'); });
  v.parentElement.appendChild(b);
});
const vObs = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && autoplay(v) && !v.closest('.pane:not(.on)')) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { threshold: .35 });
$$('main video[data-auto]').forEach(v => vObs.observe(v));

/* workflow: lane diagram with connectors and a walkthrough */
const wf = $('#wf');
if (wf) {
  const svg = $('#wfSvg'), labels = $('#wfLabels'), N = id => $(`[data-n="${id}"]`, wf);
  const EDGES = [
    { id: 'e1', from: 'task', to: 'me', label: 'ticket' },
    { id: 'e2', from: 'claude', to: 'me', v: true, label: 'ideas' },
    { id: 'e3', from: 'decide', to: 'me', v: true, up: true, label: 'guidance' },
    { id: 'e4', from: 'me', to: 'code', label: 'intent' },
    { id: 'e5', from: 'code', to: 'proto', label: 'UI' },
    { id: 'e6', from: 'code', to: 'slicer', label: 'handoff' },
    { id: 'e7', from: 'proto', to: 'ship' },
    { id: 'e8', from: 'slicer', to: 'ship' },
  ];
  const STEPS = [
    { cap: 'Start from the ticket', lanes: [0], nodes: ['task'], edges: ['e1'] },
    { cap: 'Think it through with Claude', lanes: [1], nodes: ['claude', 'me'], edges: ['e2'] },
    { cap: 'Fill PRD gaps from NHS and ICO guidance', lanes: [1], nodes: ['decide', 'me'], edges: ['e3'] },
    { cap: 'Build the screens in code with Claude Code', lanes: [2], nodes: ['code'], edges: ['e4'] },
    { cap: 'Prototype and hand off in parallel', lanes: [3], nodes: ['proto', 'slicer'], edges: ['e5', 'e6'] },
    { cap: 'Ship, measure, and loop back', lanes: [4], nodes: ['ship', 'task'], edges: ['e7', 'e8', 'loop'] },
  ];
  const draw = () => {
    if (getComputedStyle(svg).display === 'none') return;
    const W = wf.getBoundingClientRect(), box = el => { const r = el.getBoundingClientRect(); return { l: r.left - W.left, r: r.right - W.left, t: r.top - W.top, b: r.bottom - W.top, cx: r.left - W.left + r.width / 2, cy: r.top - W.top + r.height / 2 }; };
    let paths = '', dots = '', labs = '';
    const add = (id, d, ex, ey, lx, ly, label, cls = '') => {
      paths += `<path data-e="${id}" class="${cls}" d="${d}" marker-end="url(#wfArrow)"/>`;
      dots += `<circle data-e="${id}" cx="${ex}" cy="${ey}" r="3"/>`;
      if (label) labs += `<span data-e="${id}" style="left:${lx}px;top:${ly}px">${label}</span>`;
    };
    EDGES.forEach(e => {
      const a = box(N(e.from)), b = box(N(e.to));
      if (e.v) {
        const x = b.cx; const y1 = e.up ? a.t - 2 : a.b + 2, y2 = e.up ? b.b + 6 : b.t - 6;
        add(e.id, `M${x - 5} ${y1} L${x - 5} ${y2}`, x - 5, y2, x + 26, (y1 + y2) / 2, e.label);
        paths += `<path data-e="${e.id}" d="M${x + 5} ${y2} L${x + 5} ${y1}" marker-end="url(#wfArrow)"/>`;
      } else {
        const x1 = a.r + 2, y1 = a.cy, x2 = b.l - 6, y2 = b.cy, mx = (x1 + x2) / 2;
        add(e.id, `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`, x2, y2, mx, (y1 + y2) / 2, e.label);
      }
    });
    const s = box(N('ship')), t = box(N('task')), yb = W.height - 34;
    paths += `<path data-e="loop" class="loop" d="M${s.cx} ${s.b + 4} L${s.cx} ${yb - 12} Q${s.cx} ${yb} ${s.cx - 12} ${yb} L${t.cx + 12} ${yb} Q${t.cx} ${yb} ${t.cx} ${yb - 12} L${t.cx} ${t.b + 8}" marker-end="url(#wfArrow)"/>`;
    svg.setAttribute('viewBox', `0 0 ${W.width} ${W.height}`);
    svg.innerHTML = `<defs><marker id="wfArrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L6 4L1 7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="none" style="stroke:var(--wf);opacity:1;animation:none"/></marker></defs>${paths}${dots}`;
    labels.innerHTML = labs;
    apply();
  };
  let step = 0, timer, playing = !reduce, visible = false;
  const apply = () => {
    const st = STEPS[step];
    $$('.wl', wf).forEach((l, i) => l.classList.toggle('on', st.lanes.includes(i)));
    $$('.wn', wf).forEach(n => n.classList.toggle('on', st.nodes.includes(n.dataset.n)));
    $$('[data-e]', wf).forEach(el => el.classList.toggle('on', st.edges.includes(el.dataset.e)));
    wf.classList.toggle('loop-on', st.edges.includes('loop'));
    $('#wfNum').textContent = `Step ${step + 1} of ${STEPS.length}`; $('#wfCap').textContent = st.cap;
  };
  const go = i => { step = (i + STEPS.length) % STEPS.length; apply(); schedule(); };
  const schedule = () => { clearTimeout(timer); if (playing && visible) timer = setTimeout(() => go(step + 1), 3200); };
  const play = $('#wfPlay');
  play.addEventListener('click', () => { playing = !playing; play.classList.toggle('paused', !playing); play.setAttribute('aria-label', playing ? 'Pause walkthrough' : 'Play walkthrough'); schedule(); });
  if (!playing) play.classList.add('paused');
  $$('.wl', wf).forEach((l, i) => l.addEventListener('click', () => { const k = STEPS.findIndex(s => s.lanes.includes(i)); if (k >= 0) go(k); }));
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; schedule(); }), { threshold: .35 }).observe(wf);
  new ResizeObserver(() => requestAnimationFrame(draw)).observe(wf);
  draw();
}

/* quotes */
const qs = $$('.q'), qd = $$('#qDots button'), qbox = $('#quotes'); let qi = 0, qt, hold = false, stopped = reduce;
const showQ = i => { qi = i; qs.forEach((q, k) => q.classList.toggle('on', k === i)); qd.forEach((d, k) => { d.classList.remove('on'); void d.offsetWidth; d.classList.toggle('on', k === i); d.setAttribute('aria-pressed', k === i); }); clearTimeout(qt); if (!stopped && !hold) qt = setTimeout(() => showQ((qi + 1) % qs.length), 7000); };
const holdQ = on => { hold = on; qbox.classList.toggle('paused', on); if (on) clearTimeout(qt); else showQ(qi); };
qd.forEach((d, k) => d.addEventListener('click', () => { stopped = true; qbox.classList.add('stopped'); showQ(k); }));
qbox.addEventListener('pointerenter', () => holdQ(true)); qbox.addEventListener('pointerleave', () => holdQ(false));
qbox.addEventListener('focusin', () => holdQ(true)); qbox.addEventListener('focusout', e => { if (!qbox.contains(e.relatedTarget)) holdQ(false); });
if (stopped) qbox.classList.add('stopped');
showQ(0);

