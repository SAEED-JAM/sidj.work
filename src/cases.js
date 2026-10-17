/* ===== segmented controls (tabs) ===== */
let segN = 0;
const segInit = seg => {
  const btns = $$('button', seg), thumb = $('.thumb', seg), panes = $$('.pane', $(`[data-panes="${seg.dataset.seg}"]`)), n = ++segN;
  const h = $('h2', seg.closest('.chap')); if (h && !seg.hasAttribute('aria-label')) seg.setAttribute('aria-label', h.textContent);
  btns.forEach((b, k) => { b.type = 'button'; b.id = `seg${n}-t${k}`; if (panes[k]) { panes[k].id = `seg${n}-p${k}`; panes[k].setAttribute('role', 'tabpanel'); panes[k].setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', panes[k].id); } });
  const place = b => { thumb.style.width = b.offsetWidth + 'px'; thumb.style.transform = `translateX(${b.offsetLeft}px)`; };
  const pick = i => {
    btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
    panes.forEach((p, k) => { p.classList.toggle('on', k === i); $$('video', p).forEach(v => k === i && autoplay(v) ? (v.preload = 'auto', v.play().catch(() => {})) : v.pause()); });
    place(btns[i]);
  };
  btns.forEach((b, i) => {
    b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
    b.addEventListener('click', () => pick(i));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const k = (i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length; btns[k].focus(); pick(k); } });
  });
  seg._place = () => place(btns.find(b => b.getAttribute('aria-selected') === 'true') || btns[0]);
  seg._place(); new ResizeObserver(seg._place).observe(seg);
};
$$('.seg').forEach(segInit);

/* ===== steppers (auto-advance while visible) ===== */
$$('[data-stepper]').forEach(st => {
  const steps = $$('.step', st), panes = $$('.pane', $(`[data-step-panes="${st.dataset.stepper}"]`)); let i = 0, timer, visible = false, manual = false;
  const dur = 5000; st.style.setProperty('--dur', dur + 'ms');
  const go = n => { i = n; steps.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); s.setAttribute('aria-pressed', k === i); const bar = $('.bar i', s); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }); panes.forEach((p, k) => p.classList.toggle('on', k === i)); schedule(); };
  let held = false;
  const schedule = () => { clearTimeout(timer); if (visible && !manual && !reduce && !held) timer = setTimeout(() => go((i + 1) % steps.length), dur); };
  const hold = on => { if (manual) return; held = on; st.classList.toggle('paused', on); if (on) clearTimeout(timer); else go(i); };
  steps.forEach((s, k) => { s.type = 'button'; s.addEventListener('click', () => { manual = true; held = false; st.classList.add('paused'); go(k); }); });
  st.addEventListener('pointerenter', () => hold(true)); st.addEventListener('pointerleave', () => hold(false));
  st.addEventListener('focusin', () => hold(true)); st.addEventListener('focusout', e => { if (!st.contains(e.relatedTarget)) hold(false); });
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible) go(i); else clearTimeout(timer); }), { threshold: .5 }).observe(st);
  if (reduce) st.classList.add('paused');
});

/* ===== carousels with drag ===== */
const dragScroll = (el, onMove) => {
  let down = false, sx = 0, sl = 0, moved = false;
  el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; el.classList.add('drag'); } el.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; el.classList.remove('drag'); });
  el.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  el.addEventListener('scroll', () => onMove && onMove(), { passive: true });
};
$$('.carousel').forEach(c => {
  const tr = $('.c-track', c), bar = $('.c-bar i', c), prev = $('.c-prev', c), next = $('.c-next', c);
  const upd = () => { const max = tr.scrollWidth - tr.clientWidth, p = max ? tr.scrollLeft / max : 0, w = tr.clientWidth / tr.scrollWidth; bar.style.width = w * 100 + '%'; bar.style.transform = `translateX(${p * (1 / w - 1) * 100}%)`; prev.disabled = tr.scrollLeft < 4; next.disabled = tr.scrollLeft > max - 4; };
  const by = d => { const item = tr.children[0]; tr.scrollBy({ left: d * (item.offsetWidth + 18), behavior: reduce ? 'auto' : 'smooth' }); };
  prev.addEventListener('click', () => by(-1)); next.addEventListener('click', () => by(1));
  dragScroll(tr, upd); new ResizeObserver(upd).observe(tr); upd();
});

/* ===== panorama ===== */
$$('[data-pano]').forEach(p => {
  const tr = $('.pano-track', p), mini = p.nextElementSibling && $('i', p.nextElementSibling);
  const upd = () => { if (!mini) return; const w = tr.clientWidth / tr.scrollWidth; mini.style.width = w * 100 + '%'; mini.style.left = (tr.scrollLeft / tr.scrollWidth) * 100 + '%'; if (tr.scrollLeft > 10) p.classList.add('used'); };
  dragScroll(tr, upd); new ResizeObserver(upd).observe(tr); $('img', p).addEventListener('load', upd); upd();
});

/* ===== compare sliders ===== */
$$('[data-compare]').forEach(c => {
  const input = $('input', c), name = $('h3', c.closest('.compare-row'))?.textContent;
  if (name) input.setAttribute('aria-label', 'Before and after: ' + name);
  const set = v => { c.style.setProperty('--pos', v + '%'); $('.l-b', c).style.opacity = v < 14 ? 0 : 1; $('.l-a', c).style.opacity = v > 86 ? 0 : 1; input.setAttribute('aria-valuetext', `${Math.round(v)}% before, ${100 - Math.round(v)}% after`); };
  input.addEventListener('input', () => set(input.value));
  c.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.buttons === 0 && fine) { const r = c.getBoundingClientRect(); const v = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); input.value = v; set(v); } });
  // intro nudge when it first appears
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !reduce) { io.disconnect(); const t0 = performance.now(); const anim = t => { const p = Math.min(1, (t - t0) / 1600); const v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p); input.value = v; set(v); if (p < 1) requestAnimationFrame(anim); }; requestAnimationFrame(anim); } }), { threshold: .6 });
  io.observe(c);
});

/* ===== persona flips ===== */
$$('.flip').forEach(f => { const b = $('.flip-btn', f); f.addEventListener('click', () => b.setAttribute('aria-pressed', f.classList.toggle('on'))); });

/* ===== matrix ===== */
const MX = [['Mobile application',1,1,1,1,1],['Job listings',1,1,1,1,1],['Networking',1,0,0,0,0],['Company reviews',0,1,1,0,0],['Salary information',0,1,1,0,0],['Résumé-building tools',1,0,0,1,1],['Personalized recommendations',0,1,0,1,1],['Advanced search filters',0,1,0,1,1],['Applicant management',0,0,0,0,1],['User-generated content',0,0,1,0,0],['Extensive professional network',1,0,0,0,0],['Job alerts',1,1,1,1,1],['Company insights',1,0,1,0,0],['Skill assessments',0,0,0,1,1],['Interview preparation',0,1,1,0,0]];
const mx = $('#matrix');
if (mx) {
  $('tbody', mx).innerHTML = MX.map(r => `<tr class="${r.slice(1).every(v => v === r[1]) ? 'same' : ''}"><th scope="row">${r[0]}</th>${r.slice(1).map(v => `<td class="${v ? 'y' : 'n'}"><span aria-hidden="true">${v ? '✓' : '—'}</span><span class="sr-only">${v ? 'Yes' : 'No'}</span></td>`).join('')}</tr>`).join('');
  let col = 0; const heads = $$('thead button', mx);
  heads.forEach((b, k) => b.addEventListener('click', () => { const i = k + 1; col = col === i ? 0 : i; mx.classList.toggle('focus', !!col); heads.forEach((x, n) => x.setAttribute('aria-pressed', col === n + 1)); $$('tr', mx).forEach(tr => [...tr.children].forEach((c, n) => c.classList.toggle('col-on', n === col && col))); }));
  $('#mxDiff').addEventListener('change', e => mx.style.setProperty('--same', e.target.checked ? 'none' : 'table-row'));
}

/* ===== accordions: smooth open ===== */
$$('.acc details').forEach(d => {
  const s = $('summary', d), body = $('.ans', d);
  s.addEventListener('click', e => {
    if (reduce) return; e.preventDefault();
    if (d.open) { const h = body.offsetHeight; body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 350, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => d.open = false; }
    else { d.open = true; const h = body.offsetHeight; body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' }); }
  });
  body.style.overflow = 'hidden';
});

/* ===== image lightbox ===== */
const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbZoom = $('#lbZoom');
const canZoom = () => lbImg.naturalWidth > lb.clientWidth;
const setZoom = (on, fx = .5, fy = .5) => {
  lb.classList.toggle('zoomed', on); lbZoom.setAttribute('aria-pressed', on); lbZoom.setAttribute('aria-label', on ? 'Fit to screen' : 'Zoom in');
  if (on) { lb.scrollLeft = (lbImg.scrollWidth - lb.clientWidth) * fx; lb.scrollTop = (lbImg.scrollHeight - lb.clientHeight) * fy; }
};
const openLb = (src, alt, cap) => {
  clearTimeout(lb._t); lb._closing = false; lbImg.src = src; lbImg.alt = alt || ''; lbCap.textContent = cap || '';
  lb.hidden = false; setZoom(false); lbZoom.hidden = true; pushLayer(lb, closeLb);
  requestAnimationFrame(() => lb.classList.add('on')); $('#lbClose').focus({ preventScroll: true });
};
lbImg.addEventListener('load', () => { lbZoom.hidden = !canZoom(); });
const closeLb = () => {
  if (lb.hidden || lb._closing) return;
  lb._closing = true; lb.classList.remove('on'); popLayer(lb);
  lb._t = setTimeout(() => { lb.hidden = true; lb._closing = false; lbImg.removeAttribute('src'); }, 300);
};
document.addEventListener('click', e => {
  const fr = e.target.closest('.fig:not(.vid) .frame, .ph'); if (!fr) return;
  const img = $('img', fr); const cap = fr.closest('.fig') ? ($('figcaption', fr.closest('.fig')) || {}).textContent : '';
  openLb(fr.dataset.zoomSrc || img.currentSrc || img.src, img.alt, cap);
});
$$('.fig:not(.vid) .frame, .ph').forEach(f => { f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Enlarge: ' + ($('img', f)?.alt || 'image')); });
$$('.fig.vid .frame').forEach(f => { f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Play video larger'); });
document.addEventListener('keydown', e => { const fr = e.target.closest && e.target.closest('.fig .frame, .ph'); if (fr && fr === e.target && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fr.click(); } });
lbImg.addEventListener('click', e => { e.stopPropagation(); if (!canZoom()) return closeLb(); const r = lbImg.getBoundingClientRect(); setZoom(!lb.classList.contains('zoomed'), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
lbZoom.addEventListener('click', e => { e.stopPropagation(); setZoom(!lb.classList.contains('zoomed')); });
lb.addEventListener('click', closeLb); $('#lbClose').addEventListener('click', e => { e.stopPropagation(); closeLb(); });

/* ===== case sheet ===== */
const sheet = $('#sheet'), titleBox = $('#sheetTitle'), ring = $('#ringFg'), CIRC = 87.96;
const tocs = new WeakMap();
const buildToc = art => {
  if (tocs.has(art)) return tocs.get(art);
  const toc = $('.toc', art), chaps = $$('.chap', art);
  toc.innerHTML = chaps.map(c => `<a href="#${c.id}" data-id="${c.id}">${c.dataset.toc}</a>`).join('');
  $$('a', toc).forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = document.getElementById(a.dataset.id); sheet.scrollTo({ top: t.offsetTop - 80, behavior: reduce ? 'auto' : 'smooth' }); }));
  const obs = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) $$('a', toc).forEach(a => a.classList.toggle('on', a.dataset.id === en.target.id)); }), { root: sheet, rootMargin: '-30% 0px -60% 0px' });
  chaps.forEach(c => obs.observe(c)); tocs.set(art, obs); return obs;
};
const sheetRv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); sheetRv.unobserve(e.target); } }), { root: sheet, rootMargin: '0px 0px -6% 0px' });
const sheetCounters = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCount(e.target); sheetCounters.unobserve(e.target); } }), { root: sheet, threshold: .6 });
const sheetVids = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && autoplay(v) && !v.closest('.pane:not(.on)') && !sheet.hidden) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { root: sheet, threshold: .35 });
$$('.case video[data-auto]').forEach(v => sheetVids.observe(v));

let closeAnim = null;
const SLUGS = $$('.case', sheet).map(a => a.id.slice(5));
const casePath = slug => '/' + slug + '/';
const slugFromUrl = () => { const p = location.pathname.match(/^\/([a-z-]+)\/?$/), h = location.hash.slice(1); return p && SLUGS.includes(p[1]) ? p[1] : SLUGS.includes(h) ? h : null; };
const openCase = (slug, fromCard, instant, nav = true, focus = true) => {
  const art = document.getElementById('case-' + slug); if (!art) return;
  if (closeAnim) { clearTimeout(closeAnim._timer); closeAnim.onfinish = null; closeAnim.cancel(); closeAnim = null; }
  $$('.case', sheet).forEach(a => a.hidden = a !== art);
  sheet.style.setProperty('--tint', art.style.getPropertyValue('--tint'));
  ring.style.stroke = art.style.getPropertyValue('--tint');
  $('#sheetTitleText').textContent = art.dataset.title;
  sheet.setAttribute('aria-label', art.dataset.title + ', case study');
  const wasHidden = sheet.hidden; sheet.hidden = false; sheet.scrollTop = 0;
  if (!layers.some(l => l.el === sheet)) pushLayer(sheet, () => closeCase());
  $$('video[data-poster]', art).forEach(v => { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); });
  document.title = art.dataset.pageTitle || art.dataset.title;
  buildToc(art);
  $$('.chap, .box, .fig, .compare, .outcome', art).forEach(el => { if (!reduce && el.getBoundingClientRect().top > innerHeight) { el.classList.add('rv', 'pre'); sheetRv.observe(el); } });
  $$('[data-count]', art).forEach(el => { el._done = false; sheetCounters.observe(el); });
  $$('.seg', art).forEach(s => s._place && s._place());
  if (nav && location.pathname !== casePath(slug)) {
    if (wasHidden) history.pushState({ case: slug, home: true }, '', casePath(slug));
    else history.replaceState({ case: slug, home: !!history.state?.home }, '', casePath(slug));
  }
  if (!reduce && !instant) {
    const cover = $('.case-cover', art), fromCover = fromCard && $('.cover', fromCard);
    if (fromCover && cover && wasHidden) {
      const from = fromCover.getBoundingClientRect(), to = cover.getBoundingClientRect();
      cover.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.22,1,.36,1)' });
      sheet.animate([{ backgroundColor: 'transparent' }, { backgroundColor: getComputedStyle(document.body).backgroundColor }], { duration: 400, easing: 'ease-out' });
      $$('.case-intro > *, .case-hero .meta, .case-hero .results', art).forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 120 + i * 50, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
      $$('.case-body', art).forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 300, fill: 'backwards' }));
    } else {
      art.animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  }
  if (focus) setTimeout(() => $('#sheetBack').focus({ preventScroll: true }), 50);
};
const closeCase = fromPop => {
  if (sheet.hidden || closeAnim) return;
  if ($('main').hidden) { location.href = '/'; return; } // a case page: the home page is a real page load
  if (!fromPop) {
    if (history.state?.home) return history.back(); // popstate does the closing
    history.pushState(null, '', '/');
  }
  document.title = root.dataset.homeTitle || document.title;
  let finished = false, t;
  const done = () => { if (finished) return; finished = true; clearTimeout(t); const a = closeAnim; closeAnim = null; sheet.hidden = true; if (a) { a.onfinish = null; a.cancel(); } $$('video', sheet).forEach(v => v.pause()); popLayer(sheet); };
  if (reduce) return done();
  closeAnim = sheet.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(40px) scale(.985)' }], { duration: 380, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  closeAnim.onfinish = done;
  t = setTimeout(done, 450); // background tabs may not run animations
  closeAnim._timer = t;
};
document.addEventListener('click', e => { const t = e.target.closest('[data-open]'); if (!t || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button || !document.getElementById('case-' + t.dataset.open)) return; e.preventDefault(); const inSheet = !sheet.hidden; openCase(t.dataset.open, t.classList.contains('project') ? t : null); if (inSheet) sheet.scrollTop = 0; });
$('#sheetBack').addEventListener('click', () => closeCase());
addEventListener('popstate', () => {
  for (let n = layers.length; n-- && layers.length && layers[layers.length - 1].el !== sheet;) layers[layers.length - 1].close();
  const slug = slugFromUrl(); if (slug) openCase(slug, null, true, false); else closeCase(true);
});
sheet.addEventListener('scroll', () => {
  const max = sheet.scrollHeight - sheet.clientHeight, p = max ? sheet.scrollTop / max : 0;
  ring.style.strokeDashoffset = CIRC * (1 - p);
  titleBox.classList.toggle('on', sheet.scrollTop > 380);
}, { passive: true });
const initial = slugFromUrl();
if (initial) { openCase(initial, null, true, false, false); if (location.pathname !== casePath(initial)) history.replaceState(null, '', casePath(initial)); }
/* ===== experience timeline ===== */
const xpTrack = $('#xpTrack');
if (xpTrack) {
  const cards = $$('.xc', xpTrack), bar = $('.xp-bar i'), prevB = $('.xp-prev'), nextB = $('.xp-next'), range = $('#xpRange');
  const edge = () => parseFloat(getComputedStyle(xpTrack).paddingLeft) || 0;
  const upd = () => {
    const max = xpTrack.scrollWidth - xpTrack.clientWidth, p = max ? xpTrack.scrollLeft / max : 0, w = xpTrack.clientWidth / xpTrack.scrollWidth;
    bar.style.width = (w * 100) + '%'; bar.style.transform = `translateX(${p * (1 / w - 1) * 100}%)`;
    prevB.disabled = xpTrack.scrollLeft < 4; nextB.disabled = xpTrack.scrollLeft > max - 4;
    const first = cards.find(c => c.offsetLeft + c.offsetWidth - edge() > xpTrack.scrollLeft + 8) || cards[0];
    range.textContent = $('.xc-yr', first).textContent;
  };
  const step = () => (cards[0].offsetWidth + 16) * (innerWidth < 640 ? 1 : 2);
  prevB.addEventListener('click', () => xpTrack.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
  nextB.addEventListener('click', () => xpTrack.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
  dragScroll(xpTrack, upd); new ResizeObserver(upd).observe(xpTrack); upd();
  const glide = reduce ? 'auto' : 'smooth';
  xpTrack.addEventListener('keydown', e => { if (e.target !== xpTrack) return; if (e.key === 'ArrowRight') xpTrack.scrollBy({ left: 300, behavior: glide }); if (e.key === 'ArrowLeft') xpTrack.scrollBy({ left: -300, behavior: glide }); });
  xpTrack.tabIndex = 0;
  const reveal = c => setTimeout(() => { const l = c.offsetLeft - edge(), r = c.offsetLeft + c.offsetWidth - xpTrack.clientWidth + edge(); if (xpTrack.scrollLeft > l) xpTrack.scrollTo({ left: l, behavior: glide }); else if (xpTrack.scrollLeft < r) xpTrack.scrollTo({ left: r, behavior: glide }); upd(); }, 420);
  $$('.xc-toggle', xpTrack).forEach(b => b.addEventListener('click', () => { const c = b.closest('.xc'), open = !c.classList.contains('open'); c.classList.toggle('open', open); b.setAttribute('aria-expanded', open); $('span', b).textContent = open ? 'Less' : 'Details'; if (open) reveal(c); }));
  $$('[data-jump]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); const c = document.getElementById(a.dataset.jump); if (!c) return;
    document.getElementById('experience').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => { xpTrack.scrollTo({ left: c.offsetLeft - edge(), behavior: reduce ? 'auto' : 'smooth' }); const t = $('.xc-toggle', c); if (t && !c.classList.contains('open')) t.click(); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }, reduce ? 0 : 500);
  }));
}
/* ===== video lightbox ===== */
const vlb = $('#vlb'), vlbVid = $('#vlbVid');
const openV = (src, poster, cap) => {
  clearTimeout(vlb._t); vlb._closing = false; vlbVid.src = src; vlbVid.poster = poster || ''; $('#vlbCap').textContent = cap || '';
  vlb.hidden = false; pushLayer(vlb, closeV); setTimeout(() => vlb.classList.add('on'), 20);
  vlbVid.currentTime = 0; vlbVid.play().catch(() => {}); $('#vlbClose').focus({ preventScroll: true });
};
const closeV = () => {
  if (vlb.hidden || vlb._closing) return;
  vlb._closing = true; vlb.classList.remove('on'); vlbVid.pause(); popLayer(vlb);
  vlb._t = setTimeout(() => { vlb.hidden = true; vlb._closing = false; vlbVid.removeAttribute('src'); vlbVid.load(); }, 300);
};
document.addEventListener('click', e => {
  const m = e.target.closest('.shot-media, .fig.vid .frame'); if (!m) return;
  const v = $('video', m), src = v.dataset.full || $('source', v)?.src || v.currentSrc;
  const fig = m.closest('figure');
  openV(src, v.poster || v.dataset.poster, fig?.querySelector('figcaption b')?.textContent || fig?.querySelector('figcaption')?.textContent || '');
});
$('#vlbClose').addEventListener('click', e => { e.stopPropagation(); closeV(); });
vlb.addEventListener('click', e => { if (e.target === vlb) closeV(); });
/* ===== résumé viewer ===== */
const rsv = $('#rsv'), rsvPage = $('#rsvPage'), rsvScroll = $('#rsvScroll'); let rz = 1;
const setZ = z => { rz = Math.max(.6, Math.min(2.2, z)); const cs = getComputedStyle(rsvScroll), avail = rsvScroll.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); rsvPage.style.width = Math.min(860, avail) * rz + 'px'; $('#rsvZ').textContent = Math.round(rz * 100) + '%'; };
addEventListener('resize', () => { if (!rsv.hidden) setZ(rz); });
const openR = () => {
  clearTimeout(rsv._t); rsv._closing = false; rsv.hidden = false; setZ(rz); pushLayer(rsv, closeR);
  setTimeout(() => rsv.classList.add('on'), 20); $('#rsvClose').focus({ preventScroll: true });
};
const closeR = () => {
  if (rsv.hidden || rsv._closing) return;
  rsv._closing = true; rsv.classList.remove('on'); popLayer(rsv);
  rsv._t = setTimeout(() => { rsv.hidden = true; rsv._closing = false; }, 300);
};
$$('[data-resume]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openR(); }));
$('#rsvIn').addEventListener('click', () => setZ(rz + .2)); $('#rsvOut').addEventListener('click', () => setZ(rz - .2));
$('#rsvClose').addEventListener('click', closeR);
rsvScroll.addEventListener('click', e => { if (e.target === rsvScroll) closeR(); });
rsvPage.addEventListener('dblclick', () => setZ(rz > 1.05 ? 1 : 1.6));

/* ===== the Design Desk case ===== */
/* anatomy: hover, focus or tap a part to light what it talks to; lines are drawn from the parts' real boxes */
const anat = $('#ddAnat');
if (anat) {
  const svg = $('#ddAnatSvg'), cap = $('#ddAnatCap'), N = id => $(`[data-n="${id}"]`, anat);
  const EDGES = [['designer', 'desk'], ['desk', 'researcher'], ['desk', 'helper'], ['desk', 'drawer'], ['desk', 'generator'], ['desk', 'checker'], ['desk', 'board'],
    ['po', 'board'], ['po', 'git'], ['researcher', 'git'], ['researcher', 'jira'], ['researcher', 'hub'], ['helper', 'git'], ['drawer', 'workspace'], ['ds', 'drawer'],
    ['generator', 'workspace'], ['checker', 'workspace'], ['checker', 'git'], ['workspace', 'hub']];
  const SAY = {
    git: 'The knowledge base: PRDs, numbered decisions, the question queue and briefs. Answers land here by pull request; nothing designed does.',
    jira: 'One ticket per story. The researcher reads it first, and the link goes back only after the designer confirms.',
    designer: 'Answers questions one at a time, each with options, and reviews on the canvas. Every comment becomes a round item, word for word.',
    po: 'Approves on the board or sends a story back with a note. Gets one pull request per task, holding all of its questions.',
    desk: 'The one chat a designer talks to. It finds where a story is, runs the next step with the right agent and stops at every person. It never draws and never decides.',
    researcher: 'Cheap model, read-only. Reads the ticket, PRD, decisions and brief, sweeps every canvas for parts that already exist, and writes the story record.',
    helper: 'Cheap model. Settles a question from the PRD, decision notes, NHS England and ICO guidance and peer products, or brings it back with options.',
    drawer: 'Strong model. Owns one workspace and adds each state to its surface as a scenario, from design-system components only.',
    generator: 'A script with no model. Turns the record into the cover, slice, before/after sheets, notes and state boards, and won’t run on any lint error.',
    checker: 'Strong model, fresh context, run once. Reads the PRD itself, never the drawer’s chat, and reports what’s missing first.',
    workspace: 'One canvas per story: the surfaces it changes, a frozen BEFORE of each, and everything the generator writes. Closed after promotion.',
    hub: 'One copy of every surface in the product, plus a handoff page per set. Only promotion changes it.',
    ds: 'The only source of components: the NHS design system, a Material 3 kit, shared patterns and the app shell.',
    board: 'Every story’s step, live. The desk updates it at each step, and the product owner approves there.',
  };
  const NAME = id => $('b', N(id)).textContent;
  const DEF = cap.innerHTML;
  const draw = () => {
    if (getComputedStyle(svg).display === 'none') return;
    const A = anat.getBoundingClientRect();
    if (!A.width) return;
    const box = el => { const r = el.getBoundingClientRect(); return { l: r.left - A.left, r: r.right - A.left, t: r.top - A.top, b: r.bottom - A.top, x: r.left - A.left + r.width / 2, y: r.top - A.top + r.height / 2 }; };
    svg.setAttribute('viewBox', `0 0 ${A.width} ${A.height}`);
    svg.innerHTML = EDGES.map(([f, t]) => {
      const a = box(N(f)), b = box(N(t)), dx = b.x - a.x, dy = b.y - a.y;
      let d;
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        const x1 = dx > 0 ? a.r : a.l, x2 = dx > 0 ? b.l : b.r, m = (x1 + x2) / 2;
        d = `M${x1} ${a.y} C${m} ${a.y} ${m} ${b.y} ${x2} ${b.y}`;
      } else {
        const y1 = dy > 0 ? a.b : a.t, y2 = dy > 0 ? b.t : b.b, m = (y1 + y2) / 2;
        d = `M${a.x} ${y1} C${a.x} ${m} ${b.x} ${m} ${b.x} ${y2}`;
      }
      return `<path data-a="${f}" data-b="${t}" d="${d}"/>`;
    }).join('');
  };
  const focus = id => {
    anat.classList.toggle('focus', !!id);
    const near = new Set(id ? EDGES.filter(e => e.includes(id)).flat() : []);
    $$('.dd-n', anat).forEach(n => { n.classList.toggle('on', n.dataset.n === id); n.classList.toggle('near', near.has(n.dataset.n) && n.dataset.n !== id); });
    $$('path', svg).forEach(p => p.classList.toggle('on', !!id && (p.dataset.a === id || p.dataset.b === id)));
    cap.innerHTML = id ? `<b>${NAME(id)}.</b> ${SAY[id]}` : DEF;
  };
  let pinned = null;
  $$('.dd-n', anat).forEach(n => {
    n.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') focus(n.dataset.n); });
    n.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') focus(pinned); });
    n.addEventListener('focus', () => focus(n.dataset.n));
    n.addEventListener('blur', () => focus(pinned));
    n.addEventListener('click', () => { pinned = pinned === n.dataset.n ? null : n.dataset.n; focus(pinned); });
  });
  new ResizeObserver(() => requestAnimationFrame(draw)).observe(anat);
  draw();
}

/* charts: one tooltip per chart, on hover and keyboard focus; the values also sit on the marks and in the table */
$$('.dd-chart').forEach(ch => {
  const tip = document.createElement('div'); tip.className = 'dd-tip'; tip.setAttribute('aria-hidden', 'true'); ch.appendChild(tip);
  const marks = $$('.dd-bar, .dd-colb', ch), unit = ch.classList.contains('dd-col') ? ['story signed off', 'stories signed off'] : ['finding', 'findings'];
  const show = m => {
    const v = +$('b', m).textContent, l = $('.l', m).textContent;
    tip.replaceChildren(Object.assign(document.createElement('b'), { textContent: `${v} ${v === 1 ? unit[0] : unit[1]}` }), Object.assign(document.createElement('span'), { textContent: l }));
    const C = ch.getBoundingClientRect(), r = ($('.t i', m) || m).getBoundingClientRect();
    tip.classList.add('on');
    const w = tip.offsetWidth, x = Math.min(Math.max(8, r.left - C.left + r.width / 2 - w / 2), C.width - w - 8);
    tip.style.left = x + 'px'; tip.style.top = Math.max(8, r.top - C.top - tip.offsetHeight - 10) + 'px';
  };
  const hide = () => tip.classList.remove('on');
  marks.forEach(m => {
    m.setAttribute('aria-label', `${$('.l', m).textContent}: ${$('b', m).textContent}`);
    m.addEventListener('pointerenter', () => show(m)); m.addEventListener('pointerleave', hide);
    m.addEventListener('focus', () => show(m)); m.addEventListener('blur', hide);
  });
});

/* the film: play with sound on request, native controls once it runs, pause when it leaves the screen or the case closes */
$$('.dd-film').forEach(f => {
  const v = $('video', f);
  $('.dd-play', f).addEventListener('click', () => { v.controls = true; v.muted = false; v.play().catch(() => {}); });
  v.addEventListener('play', () => f.classList.add('playing'));
  v.addEventListener('ended', () => { f.classList.remove('playing'); v.controls = false; });
  new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && !v.paused) v.pause(); })).observe(v);
});

/* workflow: the swimlane map is the tab list, the panel below shows the chosen step.
   Connectors are drawn from the nodes' real boxes; on narrow screens the map is a plain list. */
const wf = $('#wf');
if (wf) {
  const map = $('.wm', wf), tabs = $$('.wm-n', wf), panes = $$('.wf-p', wf), svg = $('#wmSvg'), labels = $('#wmLabels');
  const play = $('#wfPlay'), DUR = 8000, wide = { get matches() { return wf.clientWidth >= 980; } };
  // the edge into each step lights up with it; review also lights its rounds loop, approval its send-back loop
  const LIT = [[], ['e1'], ['e2'], ['e3'], ['e4'], ['e5'], ['e6', 'loopR'], ['e7', 'loopA'], ['e8']];
  let step = 0, timer, playing = !reduce, visible = false, hold = false;
  wf.style.setProperty('--wf-dur', DUR + 'ms');

  const draw = () => {
    if (!wide.matches) { svg.innerHTML = ''; labels.innerHTML = ''; return; }
    const M = map.getBoundingClientRect();
    const box = el => { const r = el.getBoundingClientRect(); return { l: r.left - M.left, r: r.right - M.left, t: r.top - M.top, b: r.bottom - M.top, cx: r.left - M.left + r.width / 2, cy: r.top - M.top + r.height / 2 }; };
    const B = tabs.map(box), R = 8;
    let paths = '', labs = '';
    const path = (id, d, cls = '') => { paths += `<path data-e="${id}" class="${cls}" d="${d}" marker-end="url(#wmArrow)"/>`; };
    for (let i = 0; i < B.length - 1; i++) {
      const a = B[i], b = B[i + 1], x1 = a.r, y1 = a.cy, x2 = b.l - 4, y2 = b.cy;
      if (Math.abs(y1 - y2) < 2) { path('e' + (i + 1), `M${x1} ${y1} H${x2}`); continue; }
      const xm = (a.r + b.l) / 2, s = y2 > y1 ? 1 : -1;
      path('e' + (i + 1), `M${x1} ${y1} H${xm - R} Q${xm} ${y1} ${xm} ${y1 + s * R} V${y2 - s * R} Q${xm} ${y2} ${xm + R} ${y2} H${x2}`);
    }
    // review rounds: from Review down under the lanes and back up into Draw
    const rv = B[6], dr = B[3], yb = Math.max(...B.map(b => b.b)) + 26;
    path('loopR', `M${rv.cx} ${rv.b} V${yb - R} Q${rv.cx} ${yb} ${rv.cx - R} ${yb} H${dr.cx + R} Q${dr.cx} ${yb} ${dr.cx} ${yb - R} V${dr.b + 4}`, 'loop');
    labs += `<span data-e="loopR" style="left:${(rv.cx + dr.cx) / 2}px;top:${yb}px">Each review round: draw, generate and check again</span>`;
    // approval sent back: over the top from Approval to Review
    const ap = B[7], yt = Math.min(...B.map(b => b.t)) - 22;
    path('loopA', `M${ap.cx} ${ap.t} V${yt + R} Q${ap.cx} ${yt} ${ap.cx - R} ${yt} H${rv.cx + R} Q${rv.cx} ${yt} ${rv.cx} ${yt + R} V${rv.t - 4}`, 'loop');
    labs += `<span data-e="loopA" style="left:${(ap.cx + rv.cx) / 2}px;top:${yt}px">Sent back with a note</span>`;
    svg.setAttribute('viewBox', `0 0 ${M.width} ${M.height}`);
    svg.innerHTML = `<defs><marker id="wmArrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L6 4L1 7" fill="none" stroke-width="1.4"/></marker></defs>${paths}`;
    labels.innerHTML = labs;
    light();
  };
  const light = () => $$('[data-e]', wf).forEach(el => el.classList.toggle('on', LIT[step].includes(el.dataset.e)));

  const show = (i, focus) => {
    step = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => { const on = k === step; t.classList.remove('on'); void t.offsetWidth; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panes.forEach((p, k) => p.classList.toggle('on', k === step));
    $('#wfNum').textContent = `Step ${step + 1} of ${tabs.length}`;
    $('#wfName').textContent = $('b', tabs[step]).textContent;
    light();
    if (focus) tabs[step].focus();
    schedule();
  };
  const schedule = () => { clearTimeout(timer); if (playing && visible && !hold) timer = setTimeout(() => show(step + 1), DUR); };
  const setPlaying = on => { playing = on; wf.classList.toggle('stopped', !on); play.classList.toggle('paused', !on); play.setAttribute('aria-label', on ? 'Pause walkthrough' : 'Play walkthrough'); if (on) show(step); else clearTimeout(timer); };
  const holdWf = on => { hold = on; wf.classList.toggle('paused', on); if (on) clearTimeout(timer); else show(step); };
  // on a phone the panel sits under the list, so bring it into view after a tap
  const reveal = () => { if (wf.clientWidth < 700) $('.wf-stage', wf).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };

  tabs.forEach((t, k) => t.addEventListener('click', () => { setPlaying(false); show(k); reveal(); }));
  map.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (d) { e.preventDefault(); setPlaying(false); show(step + d, true); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setPlaying(false); show(e.key === 'Home' ? 0 : tabs.length - 1, true); }
  });
  $('#wfPrev').addEventListener('click', () => { setPlaying(false); show(step - 1); });
  $('#wfNext').addEventListener('click', () => { setPlaying(false); show(step + 1); });
  play.addEventListener('click', () => setPlaying(!playing));
  const stage = $('.wf-stage', wf);
  stage.addEventListener('pointerenter', () => holdWf(true)); stage.addEventListener('pointerleave', () => holdWf(false));
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; schedule(); }), { threshold: .25 }).observe(wf);
  new ResizeObserver(() => requestAnimationFrame(draw)).observe(map);
  setPlaying(playing);
  draw();
}


/* the playbook: the page's contents are the tab list; the step strip opens the steps panel at that step;
   the first-session checks tick in order whenever "Start a session" is shown */
const pb = $('#ddPb');
if (pb) {
  const tabs = $$('[role="tab"]', pb), panels = $$('.dd-pb-panel', pb), STEPS = JSON.parse($('#ddPbSteps').textContent);
  const checks = $('.dd-pb-checks', pb), strip = $$('.dd-pb-strip button', pb);
  let seen = false, cur = 0;
  const runChecks = () => { checks.classList.remove('run'); void checks.offsetWidth; checks.classList.add('run'); };
  const show = (k, focus) => {
    tabs.forEach(t => { const on = t.dataset.p === k; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); if (on && t.scrollIntoView && pb.clientWidth < 700) t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
    panels.forEach(p => { const on = p.dataset.p === k; p.classList.toggle('on', on); p.inert = !on; });
    strip.forEach((b, i) => b.classList.toggle('cur', k === 'steps' && i === cur));
    if (k === 'session' && seen) runChecks();
  };
  const step = i => {
    cur = (i + STEPS.length) % STEPS.length; const s = STEPS[cur];
    $('.dd-pb-num', pb).textContent = String(cur + 1).padStart(2, '0');
    $('#ddPbSName').textContent = s.n; $('#ddPbSWho').textContent = s.w; $('#ddPbSText').textContent = s.d;
    const tag = $('#ddPbSTag'); tag.textContent = s.h ? 'Waits for a person' : 'Agent'; tag.classList.toggle('p', !!s.h);
    show('steps');
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(t.dataset.p));
    t.addEventListener('keydown', e => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); show(tabs[(i + d + tabs.length) % tabs.length].dataset.p, true); }
      if (e.key === 'Home') { e.preventDefault(); show(tabs[0].dataset.p, true); }
      if (e.key === 'End') { e.preventDefault(); show(tabs[tabs.length - 1].dataset.p, true); }
    });
  });
  strip.forEach(b => b.addEventListener('click', () => step(+b.dataset.s)));
  $$('.dd-pb-mini', pb).forEach(b => b.addEventListener('click', () => step(cur + +b.dataset.d)));
  $('.dd-pb-replay', pb).addEventListener('click', runChecks);
  const copy = $('.dd-pb-copy', pb);
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#ddPbPrompt').textContent.trim()); copy.textContent = 'Copied'; copy.classList.add('ok'); }
    catch { copy.textContent = 'Select to copy'; }
    setTimeout(() => { copy.textContent = 'Copy'; copy.classList.remove('ok'); }, 1600);
  });
  new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting) { seen = true; if ($('.dd-pb-panel.on', pb).dataset.p === 'session') runChecks(); io.disconnect(); } }), { threshold: .45 }).observe(pb);
}
