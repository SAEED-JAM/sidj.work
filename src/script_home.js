(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;

/* theme */
const store = { get(k){ try { return localStorage.getItem(k) } catch(e){ return null } }, set(k,v){ try { localStorage.setItem(k,v) } catch(e){} } };
const saved = store.get('theme'); if (saved) root.dataset.theme = saved;
const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
$('#themeBtn').addEventListener('click', e => {
  const next = isDark() ? 'light' : 'dark';
  const apply = () => { root.dataset.theme = next; store.set('theme', next); };
  if (!document.startViewTransition || reduce) return apply();
  const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width/2, y = r.top + r.height/2;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] }, { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' }));
});
const vt = document.createElement('style'); vt.textContent = '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}'; document.head.appendChild(vt);

/* toast + copy */
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2000); };
const copy = (text, msg) => {
  const fallback = () => { const el = $('#email'); if (text === el.textContent) { const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); } toast('Selected. Press ⌘C to copy'); };
  try { navigator.clipboard.writeText(text).then(() => toast(msg), fallback); } catch (e) { fallback(); }
};
$$('.copy-mail').forEach(b => b.addEventListener('click', () => { copy($('#email').textContent, 'Email copied'); if (b.classList.contains('btn')) { b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1600); } }));
$$('.sw').forEach(s => s.addEventListener('click', () => copy(s.dataset.hex, s.dataset.hex + ' copied')));

/* clock */
const tick = () => { const t = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Yerevan' }).format(new Date()); $('#clock').textContent = t; $('#clock2').textContent = t; };
tick(); setInterval(tick, 15000);

/* pointer drift for the top glow */
if (fine && !reduce) { let raf; addEventListener('pointermove', e => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { root.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(3)); root.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(3)); }); }, { passive: true }); }

/* "complex" tangles, then settles; "simple" gets a calm underline */
const tg = $('#tangle'), calm = $('#calm');
tg.innerHTML = [...tg.textContent].map(c => `<span aria-hidden="true">${c}</span>`).join('');
const letters = $$('span', tg);
const knot = () => { tg.classList.add('knot'); letters.forEach(l => { l.style.setProperty('--tx', (Math.random() * 16 - 8).toFixed(1) + 'px'); l.style.setProperty('--ty', (Math.random() * 18 - 9).toFixed(1) + 'px'); l.style.setProperty('--tr', (Math.random() * 50 - 25).toFixed(0) + 'deg'); }); };
const untie = () => { tg.classList.remove('knot'); letters.forEach((l, i) => { l.style.transitionDelay = i * 35 + 'ms'; l.style.setProperty('--tx', '0px'); l.style.setProperty('--ty', '0px'); l.style.setProperty('--tr', '0deg'); }); setTimeout(() => letters.forEach(l => l.style.transitionDelay = ''), 900); };
if (!reduce) {
  knot(); setTimeout(() => { untie(); setTimeout(() => calm.classList.add('on'), 500); }, 700);
  tg.addEventListener('pointerenter', () => { calm.classList.remove('on'); knot(); });
  tg.addEventListener('pointerleave', () => { untie(); setTimeout(() => calm.classList.add('on'), 500); });
} else calm.classList.add('on');

/* section rail */
const railLinks = $$('#rail a');
const secObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) railLinks.forEach(l => l.classList.toggle('on', l.dataset.sec === e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
['top','work','experience','workflow','writing','contact'].forEach(id => secObs.observe(document.getElementById(id)));

/* reveal: only below-the-fold elements, and they rest visible */
const rvObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); rvObs.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
if (!reduce) $$('main .rv').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); rvObs.observe(el); } });

/* counters (case studies) */
const fmt = (el, v) => { el.textContent = (el.dataset.prefix || '') + Math.round(v) + (el.dataset.suffix || ''); };
const runCount = el => { if (el._done || reduce) return; el._done = true; const to = +el.dataset.count, t0 = performance.now(), d = 1300; const step = t => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 4); fmt(el, to * e); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

/* work: cursor chip */
const chip = $('#cursorChip');
if (fine) $$('.work').forEach(w => {
  const cover = $('.cover', w);
  cover.addEventListener('pointermove', e => { chip.style.left = e.clientX + 'px'; chip.style.top = e.clientY + 'px'; });
  cover.addEventListener('pointerenter', () => chip.classList.add('on'));
  cover.addEventListener('pointerleave', () => chip.classList.remove('on'));
});

/* videos play when visible */
const vObs = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && !reduce && !v.closest('.pane:not(.on)')) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { threshold: .35 });
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
    { cap: 'Start from a real ticket', lanes: [0], nodes: ['task'], edges: ['e1'] },
    { cap: 'Think it through with Claude', lanes: [1], nodes: ['claude', 'me'], edges: ['e2'] },
    { cap: 'Fill the PRD gaps with real guidance', lanes: [1], nodes: ['decide', 'me'], edges: ['e3'] },
    { cap: 'Bridge design and code with Claude Code', lanes: [2], nodes: ['code'], edges: ['e4'] },
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
        const x = b.cx + (e.up ? 0 : 0); const y1 = e.up ? a.t - 2 : a.b + 2, y2 = e.up ? b.b + 6 : b.t - 6;
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
    $('#wfNum').textContent = `0${step + 1} / 0${STEPS.length}`; $('#wfCap').textContent = st.cap;
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
const qs = $$('.q'), qd = $$('#qDots button'), qbox = $('#quotes'); let qi = 0, qt, hold = false;
const showQ = i => { qi = i; qs.forEach((q, k) => q.classList.toggle('on', k === i)); qd.forEach((d, k) => { d.classList.remove('on'); void d.offsetWidth; d.classList.toggle('on', k === i); }); clearTimeout(qt); if (!reduce && !hold) qt = setTimeout(() => showQ((qi + 1) % qs.length), 7000); };
qd.forEach((d, k) => d.addEventListener('click', () => showQ(k))); showQ(0);
qbox.addEventListener('pointerenter', () => { hold = true; clearTimeout(qt); qbox.classList.add('paused'); });
qbox.addEventListener('pointerleave', () => { hold = false; qbox.classList.remove('paused'); showQ(qi); });

