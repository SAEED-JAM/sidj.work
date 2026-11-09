/* Shared behaviour for the "Built on my own" pages: theme, reveal-on-scroll, click-to-play video,
   and Emlagoo's word-timing player (real timings, no audio). */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* theme */
const root = document.documentElement, tb = document.getElementById('themeBtn');
const sync = () => tb.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
tb.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  sync();
});
sync();

/* reveal: below-the-fold blocks fade in; charts animate when they arrive */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.remove('pre'); e.target.classList.add('in'); io.unobserve(e.target);
}), { rootMargin: '0px 0px -12% 0px' });
$$('.rv, [data-anim]').forEach(el => {
  if (!reduce && el.classList.contains('rv') && el.getBoundingClientRect().top > innerHeight) el.classList.add('pre');
  io.observe(el);
});

/* looping videos: muted, only while on screen, never for reduced motion */
const vio = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && !reduce) v.play().catch(() => {}); else v.pause();
}), { threshold: .25 });
$$('video[data-loop]').forEach(v => vio.observe(v));

/* click-to-play (trailer with sound) */
$$('[data-play]').forEach(btn => btn.addEventListener('click', () => {
  const box = btn.closest('.b-media'), v = $('video', box);
  box.classList.add('playing'); v.controls = true; v.muted = false; v.play().catch(() => {});
  v.focus();
}));

/* Emlagoo: words light up on their real timestamps */
const al = $('[data-align]');
if (al) {
  const data = JSON.parse($('script[type="application/json"]', al).textContent);
  const words = data.words, t0 = words[0][1], t1 = words[words.length - 1][2], span = t1 - t0;
  const box = $('.b-words', al), track = $('.b-track', al), head = $('.head', track), btn = $('.b-align-btn', al), cur = $('.cur', al);
  box.innerHTML = words.map(([t, , , src], i) => `<span class="${src}" data-i="${i}">${t}</span>`).join(' ');
  track.insertAdjacentHTML('afterbegin', words.map(([, s, e, src]) =>
    `<i class="${src}" style="right:${((s - t0) / span * 100).toFixed(2)}%;width:${Math.max(.4, (e - s) / span * 100).toFixed(2)}%"></i>`).join(''));
  $('.end', al).textContent = span.toFixed(1) + ' s';
  const spans = $$('span', box);
  let timer = 0, start = 0, playing = false;
  const label = (p) => { btn.innerHTML = p ? '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>Pause'
    : '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>Play the timings'; btn.setAttribute('aria-pressed', p); };
  const paint = (t) => {
    words.forEach(([, s, e], i) => { spans[i].classList.toggle('on', t >= s && t < e); spans[i].classList.toggle('done', t >= e); });
    head.style.right = Math.min(100, (t - t0) / span * 100) + '%';
    cur.textContent = Math.max(0, t - t0).toFixed(1) + ' s';
  };
  const stop = () => { playing = false; clearInterval(timer); label(false); };
  const tick = () => {
    const t = t0 + (performance.now() - start) / 1000;
    paint(t);
    if (t >= t1) stop();
  };
  const play = (from) => { clearInterval(timer); playing = true; label(true); start = performance.now() - (from - t0) * 1000; timer = setInterval(tick, 40); };
  btn.addEventListener('click', () => { if (playing) stop(); else play(t0); });
  // tap a word to start from it
  box.addEventListener('click', (e) => { const sp = e.target.closest('span[data-i]'); if (sp) play(words[+sp.dataset.i][1]); });
  label(false); paint(t0 - 1);
}

/* numbers count up the first time they come into view */
const fmt = (n) => n.toLocaleString('en-US');
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const el = e.target, m = el.textContent.trim().match(/^([\d,]+)(\+?)$/);
  if (!m || reduce) return;
  const to = +m[1].replace(/,/g, ''), suf = m[2], t0 = performance.now(), dur = 1200;
  const step = (now) => { const k = Math.min(1, (now - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
    el.textContent = fmt(v) + suf; if (k < 1) requestAnimationFrame(step); };
  el.textContent = '0' + suf; requestAnimationFrame(step);
  setTimeout(() => { el.textContent = fmt(to) + suf; }, dur + 200);   // lands on the real number even if frames are throttled
}), { threshold: .6 });
$$('.b-stats dt, .b-facts dt').forEach(el => cio.observe(el));

/* a soft light follows the pointer across cards */
document.addEventListener('pointermove', (e) => {
  const c = e.target.closest && e.target.closest('.b-fcard, .b-card, .b-exp');
  if (!c) return; const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
});

/* phone screens tilt toward the pointer */
if (!reduce && matchMedia('(hover: hover)').matches) $$('.b-gal.phones figure').forEach(f => {
  const img = $('img', f);
  f.addEventListener('pointermove', (e) => { const r = img.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    img.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg'); img.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg'); });
  f.addEventListener('pointerleave', () => { img.style.setProperty('--ry', '0deg'); img.style.setProperty('--rx', '0deg'); });
});

/* galleries: drag sideways with the mouse */
$$('.b-gal').forEach(g => {
  let down = false, x0 = 0, s0 = 0, moved = false;
  g.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = g.scrollLeft; });
  addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = true; g.classList.add('drag'); } g.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; setTimeout(() => g.classList.remove('drag'), 0); });
  g.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
});

/* click a picture to see it large */
let lb = null, back = null;
const closeLb = () => { if (!lb) return; lb.classList.remove('on'); const l = lb; lb = null; setTimeout(() => l.remove(), 250); back && back.focus(); };
document.addEventListener('click', (e) => {
  const img = e.target.closest('.b-gal img, .b-row figure.zoom img');
  if (!img) return;
  back = img; lb = document.createElement('div'); lb.className = 'b-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', img.alt || 'Image');
  lb.innerHTML = `<img src="${img.currentSrc || img.src}" alt="${(img.alt || '').replace(/"/g, '&quot;')}"><button type="button" aria-label="Close">×</button>`;
  lb.addEventListener('click', closeLb); document.body.appendChild(lb);
  setTimeout(() => lb && lb.classList.add('on'), 20); $('button', lb).focus();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
$$('.b-gal img, .b-row figure.zoom img').forEach(i => { i.tabIndex = 0; i.addEventListener('keydown', (e) => { if (e.key === 'Enter') i.click(); }); });

/* Luys Map: switch networks off and watch the house */
const house = $('[data-house]');
if (house) {
  const TILE = { '': 1, power: 2, water: 3, gas: 4, 'power,water': 5, 'power,gas': 6, 'water,gas': 7, 'power,water,gas': 8 };
  const box = $('.b-house-img', house), say = $('.b-house-s', house), base = $('img', box).src.replace(/house-\d\.webp.*/, '');
  for (let i = 1; i <= 8; i++) new Image().src = `${base}house-${i}.webp`;   // warm the cache so switching is instant
  const btns = $$('button', house);
  btns.forEach(b => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    const out = btns.filter(x => x.getAttribute('aria-pressed') === 'true').map(x => x.dataset.net);
    const img = new Image();
    img.src = `${base}house-${TILE[out.join(',')]}.webp`; img.alt = out.length ? `The house with ${out.join(' and ')} out` : 'The house with everything working';
    img.className = 'out'; box.appendChild(img);
    [...box.querySelectorAll('img')].forEach(o => { if (o !== img) { o.classList.add('out'); setTimeout(() => o.remove(), 500); } });
    setTimeout(() => img.classList.remove('out'), 20);
    say.textContent = !out.length ? 'Everything works.' : out.length === 3 ? 'Power, water and gas are all out.' : `${(t => t[0].toUpperCase() + t.slice(1))(out.join(' and '))} ${out.length > 1 ? 'are' : 'is'} out. The rest still glows.`;
  }));
}

/* SafheGardan: the path's line fills as you read down it */
const tl = $('.b-tl');
if (tl) {
  const upd = () => { const r = tl.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height)); tl.style.setProperty('--prog', p.toFixed(3)); };
  addEventListener('scroll', upd, { passive: true }); upd();
}
})();
