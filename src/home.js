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

/* workflow: five tabs that walk through on their own, pause on hover or focus, and stop once someone picks one */
const wf = $('#wf');
if (wf) {
  const tabs = $$('.wf-t', wf), panes = $$('.wf-p', wf), play = $('#wfPlay'), DUR = 8000;
  let step = 0, timer, playing = !reduce, visible = false, hold = false;
  wf.style.setProperty('--wf-dur', DUR + 'ms');
  const show = (i, focus) => {
    step = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => { const on = k === step; t.classList.remove('on'); void t.offsetWidth; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panes.forEach((p, k) => p.classList.toggle('on', k === step));
    if (focus) tabs[step].focus();
    const rail = tabs[step].parentElement;
    if (rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: tabs[step].offsetLeft - rail.offsetLeft - 2, behavior: reduce ? 'auto' : 'smooth' });
    schedule();
  };
  const schedule = () => { clearTimeout(timer); if (playing && visible && !hold) timer = setTimeout(() => show(step + 1), DUR); };
  const setPlaying = on => { playing = on; wf.classList.toggle('stopped', !on); play.classList.toggle('paused', !on); play.setAttribute('aria-label', on ? 'Pause walkthrough' : 'Play walkthrough'); if (on) show(step); else clearTimeout(timer); };
  const holdWf = on => { hold = on; wf.classList.toggle('paused', on); if (on) clearTimeout(timer); else show(step); };
  tabs.forEach((t, k) => t.addEventListener('click', () => { setPlaying(false); show(k); }));
  tabs[0].parentElement.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); setPlaying(false); show(step + d, true); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setPlaying(false); show(e.key === 'Home' ? 0 : tabs.length - 1, true); }
  });
  play.addEventListener('click', () => setPlaying(!playing));
  const stage = $('.wf-stage', wf);
  stage.addEventListener('pointerenter', () => holdWf(true)); stage.addEventListener('pointerleave', () => holdWf(false));
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; schedule(); }), { threshold: .35 }).observe(wf);
  setPlaying(playing);
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

