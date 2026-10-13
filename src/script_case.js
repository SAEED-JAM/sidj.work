/* ===== segmented controls ===== */
const segInit = seg => {
  const btns = $$('button', seg), thumb = $('.thumb', seg), panes = $$('.pane', $(`[data-panes="${seg.dataset.seg}"]`));
  const place = b => { thumb.style.width = b.offsetWidth + 'px'; thumb.style.transform = `translateX(${b.offsetLeft - 4}px)`; };
  const pick = i => { btns.forEach((b, k) => b.setAttribute('aria-selected', k === i)); panes.forEach((p, k) => { p.classList.toggle('on', k === i); $$('video', p).forEach(v => k === i ? (v.preload = 'auto', v.play().catch(() => {})) : v.pause()); }); place(btns[i]); };
  btns.forEach((b, i) => { b.addEventListener('click', () => pick(i)); b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length; btns[n].focus(); pick(n); } }); });
  seg._place = () => place(btns.find(b => b.getAttribute('aria-selected') === 'true') || btns[0]);
  seg._place(); new ResizeObserver(seg._place).observe(seg);
};
$$('.seg').forEach(segInit);

/* ===== steppers (auto-advance while visible) ===== */
$$('[data-stepper]').forEach(st => {
  const steps = $$('.step', st), panes = $$('.pane', $(`[data-step-panes="${st.dataset.stepper}"]`)); let i = 0, timer, visible = false, manual = false;
  const dur = 5000; st.style.setProperty('--dur', dur + 'ms');
  const go = n => { i = n; steps.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); const bar = $('.bar i', s); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }); panes.forEach((p, k) => p.classList.toggle('on', k === i)); schedule(); };
  const schedule = () => { clearTimeout(timer); if (visible && !manual && !reduce) timer = setTimeout(() => go((i + 1) % steps.length), dur); };
  steps.forEach((s, k) => s.addEventListener('click', () => { manual = true; st.classList.add('paused'); go(k); }));
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
  tr.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.shiftKey === false) return; }, { passive: true });
});

/* ===== compare sliders ===== */
$$('[data-compare]').forEach(c => {
  const input = $('input', c); const set = v => { c.style.setProperty('--pos', v + '%'); $('.l-b', c).style.opacity = v < 14 ? 0 : 1; $('.l-a', c).style.opacity = v > 86 ? 0 : 1; };
  input.addEventListener('input', () => set(input.value));
  c.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.buttons === 0 && fine) { const r = c.getBoundingClientRect(); const v = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); input.value = v; set(v); } });
  // intro nudge when it first appears
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !reduce) { io.disconnect(); const t0 = performance.now(); const anim = t => { const p = Math.min(1, (t - t0) / 1600); const v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p); input.value = v; set(v); if (p < 1) requestAnimationFrame(anim); }; requestAnimationFrame(anim); } }), { threshold: .6 });
  io.observe(c);
});

/* ===== persona flips ===== */
$$('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('on')));

/* ===== matrix ===== */
const MX = [['Mobile application',1,1,1,1,1],['Job listings',1,1,1,1,1],['Networking',1,0,0,0,0],['Company reviews',0,0,1,0,0],['Salary information',0,0,1,0,0],['Résumé-building tools',1,0,0,1,1],['Personalized recommendations',0,1,0,1,1],['Advanced search filters',0,1,0,1,1],['Applicant management',0,0,0,0,1],['User-generated content',0,0,1,0,0],['Extensive professional network',1,0,0,0,0],['Job alerts',1,1,1,1,1],['Company insights',1,0,1,0,0],['Skill assessments',0,0,0,1,1],['Interview preparation',0,1,1,0,0]];
const mx = $('#matrix');
if (mx) {
  $('tbody', mx).innerHTML = MX.map(r => `<tr class="${r.slice(1).every(v => v === r[1]) ? 'same' : ''}"><td>${r[0]}</td>${r.slice(1).map(v => `<td class="${v ? 'y' : 'n'}">${v ? '✓' : '—'}</td>`).join('')}</tr>`).join('');
  let col = 0;
  $$('thead th', mx).forEach((th, i) => i && th.addEventListener('click', () => { col = col === i ? 0 : i; mx.classList.toggle('focus', !!col); $$('tr', mx).forEach(tr => [...tr.children].forEach((c, k) => c.classList.toggle('col-on', k === col && col))); }));
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

/* ===== lightbox ===== */
const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
const openLb = (src, alt, cap) => { lbImg.src = src; lbImg.alt = alt || ''; lbCap.textContent = cap || ''; lb.hidden = false; lb.classList.remove('zoomed'); requestAnimationFrame(() => lb.classList.add('on')); };
const closeLb = () => { lb.classList.remove('on'); setTimeout(() => { lb.hidden = true; lbImg.src = ''; }, 300); };
document.addEventListener('click', e => {
  const fr = e.target.closest('.fig:not(.vid) .frame, .ph'); if (!fr) return;
  const img = $('img', fr); const cap = fr.closest('.fig') ? ($('figcaption', fr.closest('.fig')) || {}).textContent : '';
  openLb(fr.dataset.zoomSrc || img.currentSrc || img.src, img.alt, cap);
});
lbImg.addEventListener('click', e => { e.stopPropagation(); if (lbImg.naturalWidth > lb.clientWidth) { const zoomed = lb.classList.toggle('zoomed'); if (zoomed) { const r = lbImg.getBoundingClientRect(); lb.scrollLeft = (lbImg.scrollWidth - lb.clientWidth) * ((e.clientX - r.left) / r.width); lb.scrollTop = (lbImg.scrollHeight - lb.clientHeight) * ((e.clientY - r.top) / r.height); } } else closeLb(); });
lb.addEventListener('click', closeLb); $('#lbClose').addEventListener('click', e => { e.stopPropagation(); closeLb(); });

/* ===== case sheet ===== */
const sheet = $('#sheet'), titleBox = $('#sheetTitle'), ring = $('#ringFg'), CIRC = 87.96;
let current = null, lastCard = null;
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
const sheetVids = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && !reduce && !v.closest('.pane:not(.on)') && !sheet.hidden) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { root: sheet, threshold: .35 });
$$('.case video[data-auto]').forEach(v => { vObs.unobserve(v); sheetVids.observe(v); });

const openCase = (slug, fromCard, instant) => {
  const art = document.getElementById('case-' + slug); if (!art) return;
  $$('.case', sheet).forEach(a => a.hidden = a !== art);
  current = art; lastCard = fromCard || lastCard;
  sheet.style.setProperty('--tint', art.style.getPropertyValue('--tint'));
  ring.style.stroke = art.style.getPropertyValue('--tint');
  $('#sheetTitleText').textContent = art.dataset.title;
  const wasHidden = sheet.hidden; sheet.hidden = false; root.classList.add('locked'); sheet.scrollTop = 0;
  buildToc(art);
  $$('.chap, .box, .fig, .compare, .outcome', art).forEach(el => { if (!reduce && el.getBoundingClientRect().top > innerHeight) { el.classList.add('rv', 'pre'); sheetRv.observe(el); } });
  $$('[data-count]', art).forEach(el => { el._done = false; sheetCounters.observe(el); });
  $$('.seg', art).forEach(s => s._place && s._place());
  if (history.replaceState && location.hash !== '#' + slug) history.pushState({ case: slug }, '', '#' + slug);
  if (!reduce && !instant) {
    const cover = $('.case-cover', art);
    if (fromCard && wasHidden) {
      const from = $('.cover', fromCard).getBoundingClientRect(), to = cover.getBoundingClientRect();
      const sx = from.width / to.width, sy = from.height / to.height;
      cover.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`, borderRadius: '32px' }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.22,1,.36,1)' });
      sheet.animate([{ backgroundColor: 'transparent' }, { backgroundColor: getComputedStyle(document.body).backgroundColor }], { duration: 400, easing: 'ease-out' });
      $$('.case-hero .wrap > :not(.case-cover)', art).forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 120 + i * 50, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
      $$('.case-body', art).forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 300, fill: 'backwards' }));
    } else {
      art.animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  }
  setTimeout(() => $('#sheetBack').focus({ preventScroll: true }), 50);
};
const closeCase = (fromPop) => {
  if (sheet.hidden) return;
  const done = () => { sheet.hidden = true; root.classList.remove('locked'); $$('video', sheet).forEach(v => v.pause()); if (lastCard) lastCard.focus({ preventScroll: true }); };
  if (!fromPop && location.hash) history.pushState('', '', location.pathname + location.search);
  if (reduce) return done();
  sheet.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(40px) scale(.985)' }], { duration: 380, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = done;
};
document.addEventListener('click', e => { const t = e.target.closest('[data-open]'); if (!t) return; e.preventDefault(); const inSheet = !sheet.hidden; openCase(t.dataset.open, t.classList.contains('card') ? t : null); if (inSheet) sheet.scrollTop = 0; });
$('#sheetBack').addEventListener('click', () => closeCase());
addEventListener('keydown', e => { if (e.key === 'Escape') { if (!lb.hidden) closeLb(); else closeCase(); } });
addEventListener('popstate', () => { const slug = location.hash.slice(1); if (document.getElementById('case-' + slug)) openCase(slug, null, true); else closeCase(true); });
sheet.addEventListener('scroll', () => {
  const max = sheet.scrollHeight - sheet.clientHeight, p = max ? sheet.scrollTop / max : 0;
  ring.style.strokeDashoffset = CIRC * (1 - p);
  titleBox.classList.toggle('on', sheet.scrollTop > 380);
}, { passive: true });
const initial = location.hash.slice(1);
if (document.getElementById('case-' + initial)) openCase(initial, null, true);
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
  xpTrack.addEventListener('keydown', e => { if (e.key === 'ArrowRight') xpTrack.scrollBy({ left: 300, behavior: 'smooth' }); if (e.key === 'ArrowLeft') xpTrack.scrollBy({ left: -300, behavior: 'smooth' }); });
  xpTrack.tabIndex = 0;
  const reveal = c => setTimeout(() => { const l = c.offsetLeft - edge(), r = c.offsetLeft + c.offsetWidth - xpTrack.clientWidth + edge(); if (xpTrack.scrollLeft > l) xpTrack.scrollTo({ left: l, behavior: 'smooth' }); else if (xpTrack.scrollLeft < r) xpTrack.scrollTo({ left: r, behavior: 'smooth' }); upd(); }, 420);
  $$('.xc-toggle', xpTrack).forEach(b => b.addEventListener('click', () => { const c = b.closest('.xc'), open = !c.classList.contains('open'); c.classList.toggle('open', open); b.setAttribute('aria-expanded', open); $('span', b).textContent = open ? 'Less' : 'Details'; if (open) reveal(c); }));
  $$('[data-jump]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); const c = document.getElementById(a.dataset.jump); if (!c) return;
    document.getElementById('experience').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => { xpTrack.scrollTo({ left: c.offsetLeft - edge(), behavior: reduce ? 'auto' : 'smooth' }); const t = $('.xc-toggle', c); if (t && !c.classList.contains('open')) t.click(); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }, reduce ? 0 : 500);
  }));
}
/* ===== video lightbox ===== */
const vlb = $('#vlb'), vlbVid = $('#vlbVid');
const openV = (src, poster, cap) => { vlbVid.src = src; vlbVid.poster = poster || ''; $('#vlbCap').textContent = cap || ''; vlb.hidden = false; setTimeout(() => vlb.classList.add('on'), 20); vlbVid.currentTime = 0; vlbVid.play().catch(() => {}); };
const closeV = () => { vlb.classList.remove('on'); vlbVid.pause(); setTimeout(() => { vlb.hidden = true; vlbVid.removeAttribute('src'); vlbVid.load(); }, 300); };
document.addEventListener('click', e => {
  const m = e.target.closest('.shot-media, .fig.vid .frame'); if (!m) return;
  const v = $('video', m), src = $('source', v)?.src || v.currentSrc;
  const fig = m.closest('figure'), cap = fig ? [...fig.querySelectorAll('figcaption b, figcaption span, figcaption')].map(x => x.textContent.trim()).filter(Boolean)[0] : '';
  openV(src, v.poster, fig?.querySelector('figcaption b')?.textContent || cap);
});
$('#vlbClose').addEventListener('click', e => { e.stopPropagation(); closeV(); });
vlb.addEventListener('click', e => { if (e.target === vlb) closeV(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !vlb.hidden) { e.stopImmediatePropagation(); closeV(); } }, true);
/* ===== résumé viewer ===== */
const rsv = $('#rsv'), rsvPage = $('#rsvPage'); let rz = 1;
const rsvScroll = $('#rsvScroll');
const setZ = z => { rz = Math.max(.6, Math.min(2.2, z)); const cs = getComputedStyle(rsvScroll), avail = rsvScroll.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); rsvPage.style.width = Math.min(860, avail) * rz + 'px'; $('#rsvZ').textContent = Math.round(rz * 100) + '%'; };
addEventListener('resize', () => { if (!rsv.hidden) setZ(rz); });
const openR = () => { rsv.hidden = false; setZ(rz); root.classList.add('locked'); setTimeout(() => rsv.classList.add('on'), 20); $('#rsvClose').focus({ preventScroll: true }); };
const closeR = () => { rsv.classList.remove('on'); setTimeout(() => { rsv.hidden = true; if (sheet.hidden) root.classList.remove('locked'); }, 300); };
$$('[data-resume]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openR(); }));
$('#rsvIn').addEventListener('click', () => setZ(rz + .2)); $('#rsvOut').addEventListener('click', () => setZ(rz - .2));
$('#rsvClose').addEventListener('click', closeR);
$('#rsvScroll').addEventListener('click', e => { if (e.target.id === 'rsvScroll') closeR(); });
rsvPage.addEventListener('dblclick', () => setZ(rz > 1.05 ? 1 : 1.6));
addEventListener('keydown', e => { if (e.key === 'Escape' && !rsv.hidden) { e.stopImmediatePropagation(); closeR(); } }, true);
})();
