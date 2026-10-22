/* Design Desk bento: each stage plays its story while on screen; the pointer tilts the scene */
{
  /* each scene: [time in ms, class to add]; "out" plays the exit, then the loop restarts */
  const PLAN = {
    au: [[0, 's1'], [650, 's2'], [1500, 's3'], [2500, 's4'], [4300, 's5'], [8000, 'out'], [8900, 'reset']],
    de: [[0, 's1'], [900, 's2'], [1600, 's3'], [3700, 's5'], [8000, 'out'], [8900, 'reset']],
    cd: [[0, 's1'], [700, 's2'], [1900, 's3'], [3200, 's4'], [4300, 's5'], [8200, 'out'], [9100, 'reset']],
    ho: [[0, 's1'], [900, 's2'], [2400, 's3'], [3300, 's4'], [4700, 's5'], [8200, 'out'], [9100, 'reset']],
    hb: []
  };
  const STEPS = ['bx-s1', 'bx-s2', 'bx-s3', 'bx-s4', 'bx-s5', 'bx-out'];
  const runners = new Map();
  const start = stage => {
    const plan = PLAN[stage.dataset.scene]; if (!plan.length || runners.has(stage)) return;
    const timers = []; runners.set(stage, timers);
    const cycle = () => {
      stage.classList.remove(...STEPS);
      plan.forEach(([t, c]) => timers.push(setTimeout(() => { if (c === 'reset') cycle(); else stage.classList.add('bx-' + c); }, t)));
    };
    if (reduce) { stage.classList.add('bx-s1', 'bx-s2', 'bx-s3', 'bx-s4', 'bx-s5'); return; }
    cycle();
  };
  const stop = stage => { const t = runners.get(stage); if (t) { t.forEach(clearTimeout); runners.delete(stage); } };
  const io = new IntersectionObserver(es => es.forEach(e => {
    e.target.classList.toggle('bx-paused', !e.isIntersecting);
    if (e.isIntersecting) start(e.target); else stop(e.target);
  }), { threshold: .2 });
  document.querySelectorAll('.bx-stage').forEach(s => io.observe(s));
  document.addEventListener('visibilitychange', () => document.querySelectorAll('.bx-stage').forEach(s => { if (document.hidden) stop(s); }));

  /* pointer: tilt the scene and move the light */
  if (!reduce && matchMedia('(hover: hover)').matches) document.querySelectorAll('.bx-c, .bx-cover').forEach(card => {
    const scene = card.querySelector('.bx-scene'); let raf = 0;
    card.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--bx-lx', x * 100 + '%'); card.style.setProperty('--bx-ly', y * 100 + '%');
        scene.style.setProperty('--bx-ry', ((x - .5) * 14).toFixed(2) + 'deg'); scene.style.setProperty('--bx-rx', ((.5 - y) * 10).toFixed(2) + 'deg');
      });
    });
    card.addEventListener('pointerleave', () => { scene.style.setProperty('--bx-rx', '0deg'); scene.style.setProperty('--bx-ry', '0deg'); });
  });

  /* a card takes you to its step in the case: tabs are selected, then scrolled into view */
  const go = card => {
    const t = document.getElementById(card.dataset.go) || $('.lockgate', card.closest('.case') || document); if (!t) return; // still locked: go to the gate
    if (t.getAttribute('role') === 'tab') t.click();
    const box = t.getAttribute('role') === 'tab' ? (t.closest('.wf') || t) : t;
    const sc = box.closest('.sheet'), y = box.getBoundingClientRect().top - 90, behavior = reduce ? 'auto' : 'smooth';
    if (sc) sc.scrollTo({ top: sc.scrollTop + y, behavior }); else window.scrollTo({ top: scrollY + y, behavior });
  };
  document.querySelectorAll('.bx-c[data-go]').forEach(card => {
    card.addEventListener('click', () => go(card));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(card); } });
  });
}
