/* private cases: the locked part of a case ships encrypted (AES-256-GCM, the key comes from the password through
   PBKDF2), and so does every image and video in it. Unlocking keeps the key and the opened part for this tab only,
   then reloads, so every script below meets the whole case. Runs before cases.js on purpose. */
const lockStore = {
  get: k => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); return true; } catch { return false; } },
  del: k => { try { sessionStorage.removeItem(k); } catch {} },
};
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const toB64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const lockOpen = (key, bytes) => crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, key, bytes.subarray(12));

// a part this tab already opened goes back in place before anything else reads the page
let unlockedNow = null;
$$('.lockgate').forEach(g => {
  const html = lockStore.get(`lock:${g.dataset.lock}:${g.dataset.v}`); if (!html) return;
  const t = document.createElement('template'); t.innerHTML = html; g.replaceWith(t.content);
  if (lockStore.get('lock:scroll') === g.dataset.lock) unlockedNow = g.dataset.lock;
});
if (unlockedNow) {
  lockStore.del('lock:scroll');
  // land where the gate was, once the case has opened and laid itself out
  addEventListener('load', () => requestAnimationFrame(() => {
    const a = document.getElementById('unlocked-' + unlockedNow), sc = a && a.closest('.sheet');
    if (sc) sc.scrollTo({ top: a.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 90 });
  }));
}

// sealed media: fetched and opened when it comes near, with the tab's key
const lockKeyP = (() => { let p; return () => p ||= (async () => {
  const raw = lockStore.get('lock:key'); if (!raw) throw new Error('locked');
  return crypto.subtle.importKey('raw', fromB64(raw), 'AES-GCM', false, ['decrypt']);
})(); })();
const lockUrls = new Map();
const lockUrl = (url, type) => {
  if (!lockUrls.has(url)) lockUrls.set(url, (async () => {
    const key = await lockKeyP(), r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return URL.createObjectURL(new Blob([await lockOpen(key, new Uint8Array(await r.arrayBuffer()))], { type }));
  })());
  return lockUrls.get(url);
};
// resolves once a video's sealed source is ready to play
const lockVideo = v => v._lockReady ||= (async () => {
  const s = $('source[data-lsrc]', v); if (!s) return;
  s.src = await lockUrl(s.dataset.lsrc, s.dataset.ltype); s.removeAttribute('data-lsrc'); v.load();
})();
const lockShow = el => {
  if (el.tagName === 'VIDEO') {
    if (el.dataset.lposter) lockUrl(el.dataset.lposter, el.dataset.ltype).then(u => { el.poster = u; }).catch(() => {});
    lockVideo(el).catch(() => {});
  } else lockUrl(el.dataset.lsrc, el.dataset.ltype).then(u => { el.src = u; el.removeAttribute('data-lsrc'); }).catch(() => {});
};
const sealed = [...$$('img[data-lsrc]'), ...$$('video').filter(v => v.dataset.lposter || $('source[data-lsrc]', v))];
if (sealed.length) {
  const near = new Map();
  sealed.forEach(el => {
    const root = el.closest('.sheet');
    if (!near.has(root)) near.set(root, new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); lockShow(e.target); } }), { root, rootMargin: '1200px 0px' }));
    near.get(root).observe(el);
  });
}

// the gate: the password opens the part in place, then the page reloads with it
$$('.lockgate').forEach(g => {
  const form = $('.lock-form', g), input = $('input', form), btn = $('button', form), msg = $('.lock-msg', g);
  const fail = text => { g.classList.remove('busy'); g.classList.add('wrong'); msg.textContent = text; btn.disabled = false; setTimeout(() => g.classList.remove('wrong'), 450); };
  input.addEventListener('input', () => { if (msg.textContent && !g.classList.contains('busy')) msg.textContent = ''; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!input.value) { input.focus(); return; }
    if (!window.crypto?.subtle) return fail('This browser can’t open private pages. Try a current Safari, Chrome or Firefox.');
    g.classList.add('busy'); btn.disabled = true; msg.textContent = 'Checking…';
    let key, html;
    try {
      const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(input.value), 'PBKDF2', false, ['deriveKey']);
      key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: fromB64(g.dataset.salt), iterations: +g.dataset.iter, hash: 'SHA-256' },
        base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
      html = new TextDecoder().decode(await lockOpen(key, fromB64($('.lock-data', g).textContent.trim())));
    } catch { input.select(); return fail('That password doesn’t match. Check it and try again.'); }
    const raw = toB64(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
    if (!(lockStore.set('lock:key', raw) && lockStore.set(`lock:${g.dataset.lock}:${g.dataset.v}`, html))) {
      return fail('This browser is blocking site storage, so the case can’t open. Allow it for this site and try again.');
    }
    lockStore.set('lock:scroll', g.dataset.lock);
    g.classList.remove('busy'); g.classList.add('open'); msg.textContent = 'Unlocked. Opening the full case…';
    setTimeout(() => location.reload(), reduce ? 0 : 650);
  });
});
