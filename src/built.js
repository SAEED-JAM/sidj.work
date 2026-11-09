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
  btn.addEventListener('click', () => {
    if (playing) { stop(); return; }
    playing = true; label(true); start = performance.now(); timer = setInterval(tick, 40);
  });
  label(false); paint(t0 - 1);
}
})();
