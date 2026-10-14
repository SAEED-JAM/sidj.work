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

/* process: the map draws its own connectors from the cards' real boxes. One dot carries the work along them,
   leg by leg; the next step starts only when the dot has landed. */
const fl = $('#fl');
if (fl) {
  const board = $('#flBoard'), svg = $('#flSvg'), labels = $('#flLabels'), N = id => $(`[data-n="${id}"]`, board);
  const NS = 'http://www.w3.org/2000/svg';
  // each step is a list of legs; a leg is one or more arrows travelled at the same time
  const STEPS = [
    { cap: 'Start from the problem', lanes: [0], nodes: ['problem', 'me'], legs: [['e1']] },
    { cap: 'Think it through with Claude', lanes: [1], nodes: ['claude', 'me'], legs: [['e2r'], ['e2']] },
    { cap: 'Ground it in the design system', lanes: [1], nodes: ['ds', 'me'], legs: [['e3r'], ['e3']] },
    { cap: 'Hand the intent to the agents', lanes: [2], nodes: ['me', 'agents'], legs: [['e4']] },
    { cap: 'Prototype and hand off in parallel', lanes: [3], nodes: ['agents', 'proto', 'handoff'], legs: [['e5', 'e6']] },
    { cap: 'Ship, then learn and loop back', lanes: [4], nodes: ['ship', 'problem'], legs: [['e7', 'e8'], ['loop']] },
  ];
  const TO = { e1: 'me', e2: 'me', e2r: 'claude', e3: 'me', e3r: 'ds', e4: 'agents', e5: 'proto', e6: 'handoff', e7: 'ship', e8: 'ship', loop: 'problem' };
  const draw = () => {
    if (getComputedStyle(svg).display === 'none') { apply(); return; }
    const B = board.getBoundingClientRect();
    const box = el => { const r = el.getBoundingClientRect(); return { l: r.left - B.left, r: r.right - B.left, t: r.top - B.top, b: r.bottom - B.top, cx: r.left - B.left + r.width / 2, cy: r.top - B.top + r.height / 2 }; };
    let p = '', l = '';
    const path = (id, d, cls = '') => { p += `<path data-e="${id}" class="${cls}" d="${d}" marker-end="url(#flArrow)"/>`; };
    const label = (ids, x, y, text) => { l += `<span data-e="${ids}" style="left:${x}px;top:${y}px">${text}</span>`; };
    const side = (id, from, to, text) => {   // left to right, the label sitting just above the line
      const a = box(N(from)), b = box(N(to)), x1 = a.r + 2, y1 = a.cy, x2 = b.l - 7, y2 = b.cy, m = (x1 + x2) / 2;
      path(id, `M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`); if (text) label(id, m, Math.min(y1, y2) - 15, text);
    };
    const pair = (id, from, up, text) => {   // two arrows side by side: out to the helper and back to Sid
      const a = box(N(from)), b = box(N('me')), x = b.cx;
      const y1 = up ? a.t - 3 : a.b + 3, y2 = up ? b.b + 3 : b.t - 3;
      path(id, `M${x - 7} ${y1} L${x - 7} ${y2 + (up ? 4 : -4)}`);
      path(id + 'r', `M${x + 7} ${y2} L${x + 7} ${y1 + (up ? -4 : 4)}`);
      label(id + ' ' + id + 'r', x + 40, (y1 + y2) / 2, text);
    };
    side('e1', 'problem', 'me', 'brief');
    pair('e2', 'claude', false, 'ideas');
    pair('e3', 'ds', true, 'rules');
    side('e4', 'me', 'agents', 'intent');
    const ag = box(N('agents'));
    ['proto', 'handoff'].forEach((to, i) => {
      const b = box(N(to)), x1 = ag.r + 2, y1 = ag.cy, x2 = b.l - 7, y2 = b.cy, k = Math.min(48, (x2 - x1) * .55);
      path(i ? 'e6' : 'e5', `M${x1} ${y1} C${x1 + k} ${y1} ${x2 - k} ${y2} ${x2} ${y2}`);
      label(i ? 'e6' : 'e5', (x1 + x2) / 2, (y1 + y2) / 2, i ? 'specs' : 'UI');
    });
    side('e7', 'proto', 'ship'); side('e8', 'handoff', 'ship');
    const s = box(N('ship')), t = box(N('problem')), yb = B.height - 34;
    path('loop', `M${s.cx} ${s.b + 4} L${s.cx} ${yb - 14} Q${s.cx} ${yb} ${s.cx - 14} ${yb} L${t.cx + 14} ${yb} Q${t.cx} ${yb} ${t.cx} ${yb - 14} L${t.cx} ${t.b + 9}`, 'loop');
    svg.setAttribute('viewBox', `0 0 ${B.width} ${B.height}`);
    svg.innerHTML = `<defs><marker id="flArrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1.5L8 5L1 8.5z"/></marker></defs>${p}<g class="fl-run"></g>`;
    labels.innerHTML = l;
    runs = {};
    apply();
  };

  /* the travelling dot: a glow, a short trail, and the arrow filling behind it */
  let runs = {};
  const run = id => {
    if (runs[id]) return runs[id];
    const src = $(`path[data-e="${id}"]`, svg); if (!src) return null;
    const g = $('.fl-run', svg), mk = (tag, a) => { const el = document.createElementNS(NS, tag); for (const k in a) el.setAttribute(k, a[k]); g.appendChild(el); return el; };
    const len = src.getTotalLength();
    return runs[id] = { id, src, len,
      fill: mk('path', { d: src.getAttribute('d'), class: 'fl-fill', 'stroke-dasharray': len, 'stroke-dashoffset': len }),
      trail: [1, 2, 3, 4, 5].map(k => mk('circle', { r: 4 - k * .55, class: 'fl-trail' })),
      glow: mk('circle', { r: 13, class: 'fl-glow' }), dot: mk('circle', { r: 5.5, class: 'fl-dot2' }) };
  };
  const ease = q => q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
  const hide = r => [r.fill, r.dot, r.glow, ...r.trail].forEach(el => el.style.opacity = 0);
  const land = id => { const n = N(TO[id]); n.classList.remove('hit'); void n.offsetWidth; n.classList.add('hit'); setTimeout(() => n.classList.remove('hit'), 900); };

  let step = 0, leg = 0, legStart = 0, legDur = 1000, holdUntil = 0, playing = !reduce, visible = false, raf;
  // short arrows still get time to be seen; the dot rests on each card for a beat before it moves on
  const legTime = ids => Math.max(...ids.map(id => { const r = run(id); return r ? Math.min(id === 'loop' ? 2600 : 1700, Math.max(1150, r.len * 7)) : 1150; }));
  const REST = 550, HOLD = 700;
  const startLeg = now => { leg = Math.min(leg, STEPS[step].legs.length - 1); legStart = now + REST; legDur = legTime(STEPS[step].legs[leg]); };
  const tick = now => {
    raf = requestAnimationFrame(tick);
    if (getComputedStyle(svg).display === 'none') return;
    const legs = STEPS[step].legs;
    if (holdUntil) {   // the step is done: the dot waits on the card, then carries on into the next step
      if (now >= holdUntil) { holdUntil = 0; if (playing) go(step + 1, now); else { Object.values(runs).forEach(hide); leg = 0; startLeg(now); } }
      return;
    }
    const q = Math.max(0, Math.min(1, (now - legStart) / legDur)), e = ease(q);
    legs[leg].forEach(id => {
      const r = run(id); if (!r) return;
      const at = d => r.src.getPointAtLength(Math.max(0, Math.min(1, d)) * r.len), p = at(e);
      for (const el of [r.dot, r.glow]) { el.setAttribute('cx', p.x); el.setAttribute('cy', p.y); el.style.opacity = 1; }
      r.trail.forEach((c, i) => { const tp = at(ease(Math.max(0, q - (i + 1) * .045))); c.setAttribute('cx', tp.x); c.setAttribute('cy', tp.y); c.style.opacity = q > 0 && q < 1 ? .55 - i * .1 : 0; });
      r.fill.setAttribute('stroke-dashoffset', r.len * (1 - e)); r.fill.style.opacity = 1;
    });
    if (q >= 1) {
      legs[leg].forEach(land);
      if (leg < legs.length - 1) { legs[leg].forEach(id => runs[id] && hide(runs[id])); leg++; startLeg(now); }
      else holdUntil = now + HOLD;
    }
  };
  const apply = () => {
    const st = STEPS[step], lit = st.legs.flat();
    $$('.fl-lane', board).forEach((x, i) => x.classList.toggle('on', st.lanes.includes(i)));
    $$('.fl-n', board).forEach(n => n.classList.toggle('on', st.nodes.includes(n.dataset.n)));
    $$('path[data-e]', svg).forEach(el => el.classList.toggle('on', lit.includes(el.dataset.e)));
    $$('span[data-e]', labels).forEach(el => el.classList.toggle('on', el.dataset.e.split(' ').some(id => lit.includes(id))));
    fl.classList.toggle('loop-on', lit.includes('loop'));
    $('#flNum').textContent = `${String(step + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}`;
    $('#flCap').textContent = st.cap;
  };
  const go = (i, now = performance.now()) => { Object.values(runs).forEach(hide); holdUntil = 0; step = (i + STEPS.length) % STEPS.length; leg = 0; apply(); startLeg(now); };
  const animate = () => { cancelAnimationFrame(raf); if (!reduce && visible) { startLeg(performance.now()); raf = requestAnimationFrame(tick); } };
  const play = $('#flPlay');
  const setPlaying = on => { playing = on; play.classList.toggle('paused', !on); play.setAttribute('aria-label', on ? 'Pause walkthrough' : 'Play walkthrough'); };
  play.addEventListener('click', () => setPlaying(!playing));
  $$('.fl-lane', board).forEach((x, i) => x.addEventListener('click', () => { const k = STEPS.findIndex(s => s.lanes.includes(i)); if (k >= 0) { setPlaying(false); go(k); } }));
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; animate(); }), { threshold: .25 }).observe(fl);
  new ResizeObserver(() => requestAnimationFrame(draw)).observe(board);
  setPlaying(playing); draw();
  // the case study link shows only when the case is on the site
  const cta = $('.fl-cta', fl);
  if (cta && document.querySelector('.case[id="case-ai-design-workflow"]')) cta.hidden = false;
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

