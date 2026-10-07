// lib.js (from the motion-graphics skill template, team-v3 ad): deterministic motion helpers.
// Every scene computes its whole state from t inside
// window.seek(t): no CSS transitions, no timers, no state carried between frames.
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
  const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const easeInOutCubic = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
  const easeInCubic = (x) => Math.pow(clamp(x), 3);

  // Closed-form damped spring step response (0 -> 1), started at t0.
  // freq in Hz, zeta = damping ratio (<1 overshoots). Peak overshoot for zeta 0.7 ~ 4.6%.
  function spring(t, t0, freq = 2.2, zeta = 0.72) {
    const x = t - t0;
    if (x <= 0) return 0;
    const w = 2 * Math.PI * freq;
    if (zeta >= 1) return 1 - Math.exp(-w * x) * (1 + w * x);
    const wd = w * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * x));
  }
  // A value that springs between targets: keys = [[t0, value], [t1, value], ...]
  // Sum of one spring per change, so it stays a pure function of t.
  function springTo(t, keys, freq = 2.2, zeta = 0.72) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * spring(t, keys[i][0], freq, zeta);
    return v;
  }
  // in/out envelope: rises with a spring at tin, falls with ease at tout
  function inOut(t, tin, tout, dIn = 0.5, dOut = 0.35) {
    const a = easeOutCubic(prog(t, tin, tin + dIn));
    const b = 1 - easeInCubic(prog(t, tout - dOut, tout));
    return Math.min(a, b);
  }
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  // seeded PRNG for build time only
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  async function ready(extra = [], images = [], after = null) {
    const loads = [
      '700 100px "Karantina"',
      '400 40px "Rubik"', '500 40px "Rubik"', '700 40px "Rubik"',
    ].concat(extra);
    for (const f of loads) { try { await document.fonts.load(f, 'אבגabc123'); } catch (e) {} }
    await document.fonts.ready;
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map((im) => (im.complete ? 1 : new Promise((r) => { im.onload = r; im.onerror = r; }))));
    // images used inside SVG (<image href>) are not in document.images: preload + decode them
    await Promise.all(images.map((src) => new Promise((r) => { const im = new Image(); im.onload = () => (im.decode ? im.decode().then(r, r) : r()); im.onerror = r; im.src = src; })));
    if (after) after();
    window.__ready = true;
  }

  const qs = new URLSearchParams(location.search);
  window.MG = { clamp, lerp, prog, easeOutCubic, easeInOutCubic, easeOutExpo, easeInCubic, spring, springTo, inOut, hash, rng, ready, qs };
})();
