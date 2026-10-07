// rig.js: the cute Partyia deer as a posable SVG puppet + the prop drawings of the ad (team-v3).
// Head geometry is the one in team-v2/deer.js (same face, ears, antlers, colours); body, arms and
// legs are new: rubber-hose limbs driven by 2-bone IK, so a pose is "where the hooves are".
// Everything is set from a pose object every frame (no state), so scenes stay a pure function of t.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    ink: '#2E1710', eye: '#2a120a', hoof: '#3a1a10',
    o: '#E8873B', od: '#D35400', om: '#DE7A33', cr: '#F6DDB0', crl: '#FBEBCB',
    paper: '#F4EADB', paper2: '#EBDDC7', paper3: '#E2D1B6', peach: '#F2C79C',
    burnt: '#C4531A', burnt2: '#9C3F0E', ink2: '#5E4135', ink3: '#8B6E5F', tongue: '#E0644E',
    beer: '#EE9B35', foam: '#FFF6E6', lit: '#FFC96E',
  };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const n2 = (x) => (Math.round(x * 100) / 100);
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function tf(e, s) { if (e.__tf !== s) { e.setAttribute('transform', s); e.__tf = s; } }
  function vis(e, on) { const d = on ? '' : 'none'; if (e.style.display !== d) e.style.display = d; }

  // ---------- 2-bone IK. side: -1 = deer's left arm (viewer's left), +1 = right. bend: 0 auto, +-1 forced ----------
  function ik(sx, sy, tx, ty, L1, L2, side, bend) {
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 0.001;
    const maxd = L1 + L2 - 0.05, mind = Math.abs(L1 - L2) + 0.5;
    if (d > maxd) { tx = sx + dx / d * maxd; ty = sy + dy / d * maxd; d = maxd; }
    else if (d < mind) { tx = sx + dx / d * mind; ty = sy + dy / d * mind; d = mind; }
    const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const base = Math.atan2(ty - sy, tx - sx);
    const c1 = { x: sx + L1 * Math.cos(base + a), y: sy + L1 * Math.sin(base + a) };
    const c2 = { x: sx + L1 * Math.cos(base - a), y: sy + L1 * Math.sin(base - a) };
    let e;
    if (bend === 1) e = c1; else if (bend === -1) e = c2;
    else { const sc = (c) => side * c.x + 0.8 * c.y; e = sc(c1) >= sc(c2) ? c1 : c2; }
    return { ex: e.x, ey: e.y, hx: tx, hy: ty };
  }

  // ---------- the deer ----------
  const SH = [[-30, -114], [30, -114]];
  const HIP = [[-18, -46], [18, -46]];
  const BODY_D = 'M -22 -142 C -28 -126, -42 -116, -45 -96 C -50 -72, -50 -50, -38 -40 C -26 -30, 26 -30, 38 -40 C 50 -50, 50 -72, 45 -96 C 42 -116, 28 -126, 22 -142 Z';
  const BELLY_D = 'M -17 -116 C -29 -98, -31 -66, -24 -48 C -13 -39, 13 -39, 24 -48 C 31 -66, 29 -98, 17 -116 C 8 -108, -8 -108, -17 -116 Z';
  const HEAD_D = 'M100 66 C 137 66, 153 94, 149 126 C 145 158, 128 182, 100 186 C 72 182, 55 158, 51 126 C 47 94, 63 66, 100 66 Z';
  const SHADE_D = 'M100 70 C 128 72, 142 92, 144 116 C 132 98, 118 88, 100 86 C 82 88, 68 98, 56 116 C 58 92, 72 72, 100 70 Z';

  function limb(parent, w, ow, kind) {
    const g = el('g', {}, parent);
    const o = el('path', { fill: 'none', stroke: C.ink, 'stroke-width': w + 2 * ow, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    const f = el('path', { fill: 'none', stroke: C.om, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    let hoof;
    if (kind === 'arm') {
      hoof = el('g', {}, g);
      el('ellipse', { cx: 0, cy: 0, rx: 11.5, ry: 10.5, fill: C.hoof }, hoof);
      el('path', { d: 'M 9 0 L 3 0', stroke: C.ink2, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, hoof);
    } else {
      hoof = el('rect', { x: -15, y: -3, width: 30, height: 16, rx: 7, fill: C.hoof });
      g.appendChild(hoof);
    }
    return { g, o, f, hoof, w };
  }

  function make(parent, s, opt = {}) {
    const lw = opt.lw || 6.5;
    const ow = lw / s;
    const D = { s, ow, L: opt.arm || [36, 34], LL: [19, 19] };
    D.root = el('g', {}, parent);
    D.sq = el('g', {}, D.root);
    D.ln = el('g', {}, D.sq);
    const g = D.ln;
    D.propBehind = el('g', {}, g);
    D.legs = [limb(g, 17, ow, 'leg'), limb(g, 17, ow, 'leg')];
    // tail tuft (shows only when it peeks out on a lean)
    D.body = el('g', {}, g);
    el('path', { d: BODY_D, fill: C.om, stroke: C.ink, 'stroke-width': ow, 'stroke-linejoin': 'round' }, D.body);
    el('path', { d: BELLY_D, fill: C.crl }, D.body);
    el('circle', { cx: -38, cy: -80, r: 2.8, fill: C.cr }, D.body);
    el('circle', { cx: 40, cy: -72, r: 2.8, fill: C.cr }, D.body);
    el('circle', { cx: -35, cy: -62, r: 2.1, fill: C.cr }, D.body);
    D.propBack = el('g', {}, g);
    // head (deer.js geometry, units of its 200x192 viewBox; pivot at the neck)
    D.headPivot = el('g', {}, g);
    const H = el('g', { transform: 'translate(-100 -176)' }, D.headPivot);
    D.antlers = el('g', { fill: 'none', stroke: C.ink, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, H);
    const antler = (p) => {
      el('path', { d: 'M80 74 C 72 54, 64 40, 54 20' }, p);
      el('path', { d: 'M68 48 C 58 45, 48 46, 38 40' }, p);
      el('path', { d: 'M61 35 C 66 25, 68 16, 72 8' }, p);
    };
    D.antL = el('g', {}, D.antlers); antler(D.antL);
    D.antR = el('g', {}, D.antlers); antler(el('g', { transform: 'translate(200,0) scale(-1,1)' }, D.antR));
    const ear = (side) => {
      const isR = side === 'r', cx = isR ? 150 : 50, rot = isR ? 25 : -25;
      const e = el('g', {}, H);
      el('ellipse', { cx, cy: 100, rx: 28, ry: 13, transform: `rotate(${rot} ${cx} 100)`, fill: C.o, stroke: C.ink, 'stroke-width': ow }, e);
      el('ellipse', { cx: isR ? cx - 2 : cx + 2, cy: 100, rx: 16, ry: 6, transform: `rotate(${rot} ${cx} 100)`, fill: C.cr }, e);
      return e;
    };
    D.earL = ear('l'); D.earR = ear('r');
    el('path', { d: HEAD_D, fill: C.o, stroke: C.ink, 'stroke-width': ow }, H);
    el('path', { d: SHADE_D, fill: C.od, opacity: 0.18 }, H);
    const spots = el('g', { fill: C.cr }, H);
    [[90, 84, 3.2], [101, 80, 3.8], [112, 85, 3], [95, 93, 2.2], [107, 94, 2]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r }, spots));
    D.face = el('g', {}, H);
    el('ellipse', { cx: 100, cy: 160, rx: 31, ry: 23, fill: C.cr }, D.face);
    D.cheeks = el('g', { fill: C.od }, D.face);
    el('circle', { cx: 64, cy: 142, r: 8.5 }, D.cheeks); el('circle', { cx: 136, cy: 142, r: 8.5 }, D.cheeks);
    const lw2 = ow * 0.9;
    D.eyes = [78, 122].map((cx) => {
      const g0 = el('g', {}, D.face);
      const open = el('g', {}, g0);
      el('ellipse', { cx, cy: 118, rx: 9.5, ry: 11.5, fill: C.eye }, open);
      el('circle', { cx: cx + 3.5, cy: 113.5, r: 3.4, fill: '#fff' }, open);
      el('circle', { cx: cx - 3, cy: 123, r: 1.6, fill: '#fff', opacity: 0.7 }, open);
      const happy = el('path', { d: `M${cx - 9} 122 Q${cx} 109 ${cx + 9} 122`, fill: 'none', stroke: C.eye, 'stroke-width': lw2, 'stroke-linecap': 'round' }, g0);
      const closed = el('path', { d: `M${cx - 9} 118 Q${cx} 127 ${cx + 9} 118`, fill: 'none', stroke: C.eye, 'stroke-width': lw2, 'stroke-linecap': 'round' }, g0);
      return { g: g0, open, happy, closed, cx };
    });
    D.brows = el('g', { fill: 'none', stroke: C.eye, 'stroke-width': ow * 0.85, 'stroke-linecap': 'round' }, D.face);
    D.browL = el('path', { d: 'M69 100 Q78 95 87 99' }, D.brows);
    D.browR = el('path', { d: 'M113 99 Q122 95 131 100' }, D.brows);
    el('ellipse', { cx: 100, cy: 150, rx: 12, ry: 8.5, fill: C.hoof }, D.face);
    el('ellipse', { cx: 96, cy: 147.5, rx: 3.6, ry: 2.2, fill: '#fff', opacity: 0.55 }, D.face);
    const ml = { fill: 'none', stroke: C.hoof, 'stroke-width': ow * 0.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    D.mouths = {};
    D.mouths.smile = el('path', Object.assign({ d: 'M91 166 Q100 175 109 166' }, ml), D.face);
    D.mouths.flat = el('path', Object.assign({ d: 'M94 170 L106 170' }, ml), D.face);
    D.mouths.wobble = el('path', Object.assign({ d: 'M90 170 Q95 165 100 170 Q105 175 110 170' }, ml), D.face);
    const grin = el('g', {}, D.face);
    el('path', { d: 'M87 163 Q100 165 113 163 Q112 185 100 185 Q88 185 87 163 Z', fill: C.eye, stroke: C.hoof, 'stroke-width': ow * 0.6, 'stroke-linejoin': 'round' }, grin);
    el('ellipse', { cx: 100, cy: 179.5, rx: 7.5, ry: 4.5, fill: C.tongue }, grin);
    D.mouths.grin = grin;
    D.mouths.o = el('ellipse', { cx: 100, cy: 171, rx: 5.5, ry: 7, fill: C.eye }, D.face);
    const yawn = el('g', {}, D.face);
    el('ellipse', { cx: 100, cy: 172, rx: 8.5, ry: 11, fill: C.eye }, yawn);
    el('ellipse', { cx: 100, cy: 178.5, rx: 5.5, ry: 3.6, fill: C.tongue }, yawn);
    D.mouths.yawn = yawn;
    const tng = el('g', {}, D.face);
    el('path', Object.assign({ d: 'M91 166 Q100 175 109 166' }, ml), tng);
    el('path', { d: 'M102 170.5 Q103.5 179.5 108.5 178.5 Q112 177 109 168.5', fill: C.tongue, stroke: C.hoof, 'stroke-width': ow * 0.55, 'stroke-linejoin': 'round' }, tng);
    D.mouths.tongue = tng;
    D.propMid = el('g', {}, g);
    D.arms = [limb(g, 15, ow, 'arm'), limb(g, 15, ow, 'arm')];
    D.propFront = el('g', {}, g);
    return D;
  }

  const DEF = {
    x: 0, y: 0, scale: 1, sx: 1, sy: 1, rot: 0, hr: 0, hx: 0, hy: 0, turn: 0, lx: 0, ly: 0,
    earL: 0, earR: 0, blink: 0, eyeL: 'open', eyeR: 'open', wide: 0, mouth: 'smile', brows: 0, browY: 0, browTilt: 0, blush: 0.35,
    hands: [[-44, -58], [44, -58]], bend: [0, 0], feet: [[-21, -13], [21, -13]], vis: true, armVis: [true, true], legVis: true,
  };
  function pose(D, p0) {
    const p = Object.assign({}, DEF, p0);
    vis(D.root, p.vis);
    if (!p.vis) return p;
    tf(D.root, `translate(${n2(p.x)} ${n2(p.y)}) scale(${n2(D.s * p.scale * 1000) / 1000})`);
    tf(D.sq, `scale(${n2(p.sx * 1000) / 1000} ${n2(p.sy * 1000) / 1000})`);
    tf(D.ln, `rotate(${n2(p.rot)})`);
    tf(D.headPivot, `translate(${n2(p.hx)} ${n2(-140 + p.hy)}) rotate(${n2(p.hr)})`);
    tf(D.earL, `translate(${n2(-p.turn * 4)} 0) rotate(${n2(p.earL)} 68 104)`);
    tf(D.earR, `translate(${n2(-p.turn * 4)} 0) rotate(${n2(-p.earR)} 132 104)`);
    tf(D.antlers, `translate(${n2(-p.turn * 3)} 0)`);
    tf(D.face, `translate(${n2(p.turn * 7)} 0)`);
    D.cheeks.setAttribute('opacity', n2(p.blush));
    const modes = [p.eyeL, p.eyeR];
    D.eyes.forEach((E, i) => {
      const m = modes[i];
      tf(E.g, `translate(${n2(p.lx * 3.6)} ${n2(p.ly * 3)})`);
      vis(E.open, m === 'open'); vis(E.happy, m === 'happy'); vis(E.closed, m === 'closed');
      const ws = 1 + 0.16 * p.wide;
      const b = Math.max(0.06, 1 - p.blink);
      tf(E.open, `translate(${E.cx} 118) scale(${n2(ws * 1000) / 1000} ${n2(ws * b * 1000) / 1000}) translate(${-E.cx} -118)`);
    });
    D.brows.setAttribute('opacity', n2(p.brows));
    tf(D.browL, `translate(0 ${n2(p.browY)}) rotate(${n2(-p.browTilt)} 78 98)`);
    tf(D.browR, `translate(0 ${n2(p.browY)}) rotate(${n2(p.browTilt)} 122 98)`);
    for (const k in D.mouths) vis(D.mouths[k], k === p.mouth);
    // arms
    D.arms.forEach((A, i) => {
      vis(A.g, p.armVis[i]);
      const side = i === 0 ? -1 : 1;
      const [sx, sy] = SH[i];
      const [tx, ty] = p.hands[i];
      const r = ik(sx, sy, tx, ty, D.L[0], D.L[1], side, p.bend[i]);
      const d = `M${n2(sx)} ${n2(sy)} Q${n2(r.ex)} ${n2(r.ey)} ${n2(r.hx)} ${n2(r.hy)}`;
      A.o.setAttribute('d', d); A.f.setAttribute('d', d);
      const ang = Math.atan2(r.hy - r.ey, r.hx - r.ex);
      tf(A.hoof, `translate(${n2(r.hx + Math.cos(ang) * 3)} ${n2(r.hy + Math.sin(ang) * 3)}) rotate(${n2(ang * 180 / Math.PI)})`);
      A.hand = [r.hx, r.hy];
    });
    D.legs.forEach((Lg, i) => {
      vis(Lg.g, p.legVis);
      const side = i === 0 ? -1 : 1;
      const [sx, sy] = HIP[i];
      const [tx, ty] = p.feet[i];
      const r = ik(sx, sy, tx, ty, D.LL[0], D.LL[1], side, 0);
      const d = `M${n2(sx)} ${n2(sy)} Q${n2(r.ex)} ${n2(r.ey)} ${n2(r.hx)} ${n2(r.hy)}`;
      Lg.o.setAttribute('d', d); Lg.f.setAttribute('d', d);
      tf(Lg.hoof, `translate(${n2(r.hx)} ${n2(r.hy)})`);
    });
    return p;
  }
  // local deer point -> parent coordinates for the pose (ignores squash/rot: use for props drawn outside the rig)
  function toParent(D, p, x, y) {
    const s = D.s * (p.scale || 1);
    return [p.x + x * s, p.y + y * s];
  }

  // ---------- props ----------
  const SPARK = 'M0 -10 C 1.2 -2.2, 2.2 -1.2, 10 0 C 2.2 1.2, 1.2 2.2, 0 10 C -1.2 2.2, -2.2 1.2, -10 0 C -2.2 -1.2, -1.2 -2.2, 0 -10 Z';
  function sparkle(parent, x, y, size, color) {
    const g = el('g', { transform: `translate(${x} ${y})` }, parent);
    const s = el('path', { d: SPARK, fill: color }, g);
    return { g, s, x, y, size, set(k, rot = 0) { tf(s, `rotate(${n2(rot)}) scale(${n2(size / 20 * k * 1000) / 1000})`); } };
  }

  // sun disk with the paper "speed stripes" of the emblem, cut flat at cutY
  let uid = 0;
  function sun(parent, cx, cy, r, cutY, opt = {}) {
    const id = 'sunclip' + (++uid);
    const g = el('g', {}, parent);
    const cp = el('clipPath', { id }, g);
    el('rect', { x: cx - r - 20, y: cy - r - 20, width: 2 * r + 40, height: (cutY == null ? cy + r + 20 : cutY) - (cy - r - 20) }, cp);
    const b = el('g', { 'clip-path': `url(#${id})` }, g);
    const disk = el('circle', { cx, cy, r, fill: opt.fill || '#EE8834' }, b);
    const st = opt.stripes === false ? [] : [[0.22, -1.1, -0.55], [0.36, 0.48, 1.1], [0.50, -1.1, -0.3], [0.63, 0.66, 1.1]];
    st.forEach(([fy, a, bb]) => el('rect', { x: cx + a * r, y: cy + fy * r, width: (bb - a) * r, height: Math.max(6, 0.045 * r), rx: 0.022 * r, fill: C.paper }, b));
    if (opt.stroke) el('circle', { cx, cy, r, fill: 'none', stroke: C.ink, 'stroke-width': opt.stroke }, b);
    return { g, disk, cx, cy, r };
  }

  function bulbPath(x, y) { return `M${x} ${y + 30} c-17 0-22 14-22 26 c0 16 12 30 22 30 c10 0 22-14 22-30 c0-12-5-26-22-26z`; }
  function mix(a, b, k) {
    const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join('');
  }
  // string lights: wire across with n bulbs. glowId: id of a radialGradient in the same svg
  function lights(parent, x0, x1, y0, sag, n, glowId, opt = {}) {
    const g = el('g', {}, parent);
    const mid = (x0 + x1) / 2, half = (x1 - x0) / 2;
    const wy = (x) => y0 + sag * (1 - Math.pow((x - mid) / half, 2));
    const pts = [];
    for (let x = x0 - 40; x <= x1 + 40; x += 10) pts.push(`${x},${n2(wy(x))}`);
    const glows = el('g', {}, g);
    el('path', { d: 'M' + pts.join(' L'), fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    const B = [];
    const pad = opt.pad == null ? 0.5 : opt.pad;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + pad) * (x1 - x0) / (n - 1 + 2 * pad), y = wy(x);
      const glow = el('circle', { cx: x, cy: y + 56, r: 105, fill: `url(#${glowId})`, opacity: 0 }, glows);
      const bg = el('g', {}, g);
      el('path', { d: `M${x} ${y} v14`, stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, bg);
      el('rect', { x: x - 11, y: y + 12, width: 22, height: 20, rx: 4, fill: C.ink }, bg);
      const bulb = el('path', { d: bulbPath(x, y), fill: C.paper, stroke: C.ink, 'stroke-width': 5 }, bg);
      el('path', { d: `M${x - 9} ${y + 48} c0-6 3-10 7-11`, stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none', opacity: 0.8 }, bg);
      B.push({ x, y, glow, bulb, bg });
    }
    return {
      g, B, wy,
      set(levels) { B.forEach((b, i) => { const k = typeof levels === 'number' ? levels : levels(i, b); b.bulb.setAttribute('fill', mix(C.paper, C.lit, k)); b.glow.setAttribute('opacity', n2(k)); }); },
    };
  }

  // monobloc plastic chair, front view. origin = centre of the seat front edge
  function chair(parent, color) {
    const g = el('g', {}, parent);
    const st = { stroke: C.ink, 'stroke-width': 5.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
    // legs
    [[-40, 2, -52, 74], [40, 2, 52, 74], [-24, 2, -28, 62], [24, 2, 28, 62]].forEach(([a, b, c, d], i) => {
      el('path', { d: `M${a} ${b} L${c} ${d}`, stroke: C.ink, 'stroke-width': 15, 'stroke-linecap': 'round', fill: 'none' }, g);
      el('path', { d: `M${a} ${b} L${c} ${d}`, stroke: i < 2 ? color : C.burnt, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, g);
    });
    el('path', Object.assign({ d: 'M-38 -16 C-42 -60, -40 -92, -30 -100 C-12 -110, 12 -110, 30 -100 C40 -92, 42 -60, 38 -16 Z', fill: color }, st), g);
    [-16, 0, 16].forEach((x) => el('rect', { x: x - 4, y: -86, width: 8, height: 44, rx: 4, fill: C.paper, stroke: C.ink, 'stroke-width': 3 }, g));
    el('path', Object.assign({ d: 'M-50 -18 L50 -18 L46 6 L-46 6 Z', fill: color }, st), g);
    el('path', { d: 'M-40 -10 L36 -10', stroke: '#fff', 'stroke-width': 3, opacity: 0.45, 'stroke-linecap': 'round' }, g);
    return g;
  }

  function phone(parent) {
    const g = el('g', {}, parent);
    el('rect', { x: -34, y: -62, width: 68, height: 124, rx: 13, fill: C.ink }, g);
    el('rect', { x: -27, y: -50, width: 54, height: 98, rx: 6, fill: C.paper }, g);
    el('rect', { x: -9, y: -58, width: 18, height: 4, rx: 2, fill: C.ink2 }, g);
    const lines = el('g', {}, g);
    [[-20, -40, 30, C.peach], [-4, -26, 22, C.o], [-20, -12, 34, C.peach], [-2, 2, 20, C.o]].forEach(([x, y, w, c]) => el('rect', { x, y, width: w, height: 9, rx: 4.5, fill: c }, lines));
    return { g, lines };
  }

  function shaker(parent) {
    const g = el('g', {}, parent);
    const st = { stroke: C.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' };
    el('path', Object.assign({ d: 'M-23 0 L-30 -78 L30 -78 L23 0 Q0 6 -23 0 Z', fill: '#E9E2D6' }, st), g);
    el('path', { d: 'M-27.5 -52 L27.5 -52 L26.4 -40 L-26.4 -40 Z', fill: C.o }, g);
    el('path', { d: 'M-18 -70 L-14 -10', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9 }, g);
    el('path', Object.assign({ d: 'M-31 -78 L-19 -110 L19 -110 L31 -78 Z', fill: '#D9CFC0' }, st), g);
    el('rect', Object.assign({ x: -11, y: -127, width: 22, height: 17, rx: 6, fill: C.o }, st), g);
    return g;
  }

  // bar towel draped over a shoulder: gingham (a plain white cloth with two stripes read as a can or a bottle).
  // origin = the top of the fold; the front flap hangs down about 60 units, wider than it is thick, with a wavy hem
  function towel(parent) {
    const g = el('g', {}, parent);
    const id = 'towelclip' + (++uid);
    const st = { stroke: C.ink, 'stroke-width': 4.5, 'stroke-linejoin': 'round' };
    // the fold over the shoulder (back half of the cloth)
    el('path', Object.assign({ d: 'M-22 2 C-22 -14, 22 -16, 23 2 Z', fill: '#F6C9A0' }, st), g);
    // front flap
    const FLAP = 'M-23 -2 C-10 -9, 10 -9, 24 -2 L27 52 Q20 58 13 53 Q6 58 -1 53 Q-8 58 -15 53 Q-20 57 -24 53 Z';
    const cp = el('clipPath', { id }, g);
    el('path', { d: FLAP }, cp);
    el('path', { d: FLAP, fill: '#FFF9EF' }, g);
    const pat = el('g', { 'clip-path': `url(#${id})`, fill: C.o, opacity: 0.55 }, g);
    for (let x = -24; x < 30; x += 14) el('rect', { x, y: -12, width: 7, height: 74 }, pat);
    for (let y = -6; y < 60; y += 14) el('rect', { x: -30, y, width: 62, height: 7 }, pat);
    el('path', Object.assign({ d: FLAP, fill: 'none' }, st), g);
    // a soft fold shadow under the shoulder line
    el('path', { d: 'M-20 4 C-8 0, 10 0, 22 4', fill: 'none', stroke: C.ink, 'stroke-width': 2.5, opacity: 0.35, 'stroke-linecap': 'round' }, g);
    return g;
  }

  // neighbour: ink-line bust standing on its base line (origin), height h. style: bun|cap|curly|long|beanie|bald
  function neighbour(parent, x, y, h, style, opt = {}) {
    const g = el('g', { transform: `translate(${x} ${y})` }, parent);
    const r = h * 0.17, hy = -h + r;
    const fill = opt.fill || C.paper;
    const paths = [];
    const st = (extra) => Object.assign({ stroke: C.ink, 'stroke-width': opt.lw || 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1 }, extra);
    const w = h * 0.37;
    const body = el('path', st({ d: `M${-w} 0 C${-w} ${-h * 0.36}, ${-w * 0.72} ${-h * 0.56}, 0 ${-h * 0.575} C${w * 0.72} ${-h * 0.56}, ${w} ${-h * 0.36}, ${w} 0`, fill }), g);
    paths.push(body);
    const hairBack = el('g', {}, g);
    if (style === 'long') paths.push(el('path', st({ d: `M${-r * 1.05} ${hy} C${-r * 1.25} ${hy + r * 1.6}, ${-r * 0.4} ${hy + r * 1.9}, 0 ${hy + r * 1.5} C${r * 0.4} ${hy + r * 1.9}, ${r * 1.25} ${hy + r * 1.6}, ${r * 1.05} ${hy}`, fill: C.ink2 }), hairBack));
    const head = el('circle', st({ cx: 0, cy: hy, r, fill }), g);
    paths.push(head);
    if (style === 'bun') { paths.push(el('circle', st({ cx: 0, cy: hy - r * 1.18, r: r * 0.36, fill: C.ink2 }), g)); paths.push(el('path', st({ d: `M${-r} ${hy - r * 0.05} A${r} ${r} 0 0 1 ${r} ${hy - r * 0.05} Q0 ${hy - r * 0.55} ${-r} ${hy - r * 0.05} Z`, fill: C.ink2 }), g)); }
    if (style === 'cap') { paths.push(el('path', st({ d: `M${-r * 1.02} ${hy - r * 0.15} A${r * 1.02} ${r * 1.02} 0 0 1 ${r * 1.02} ${hy - r * 0.15} Z`, fill: C.o }), g)); paths.push(el('path', st({ d: `M${r * 0.2} ${hy - r * 0.15} L${r * 1.6} ${hy - r * 0.15}`, fill: 'none' }), g)); }
    if (style === 'curly') { for (let i = 0; i < 6; i++) { const a = Math.PI * (1.05 + i * 0.18); paths.push(el('circle', st({ cx: Math.cos(a) * r * 0.92, cy: hy + Math.sin(a) * r * 0.92, r: r * 0.3, fill: C.ink2 }), g)); } }
    if (style === 'long') paths.push(el('path', st({ d: `M${-r} ${hy + r * 0.1} A${r} ${r} 0 0 1 ${r} ${hy + r * 0.1} Q${r * 0.2} ${hy - r * 0.45} ${-r * 0.3} ${hy - r * 0.1} Q${-r * 0.7} ${hy + r * 0.2} ${-r} ${hy + r * 0.1} Z`, fill: C.ink2 }), g));
    if (style === 'beanie') { paths.push(el('path', st({ d: `M${-r * 1.04} ${hy - r * 0.05} A${r * 1.04} ${r * 1.04} 0 0 1 ${r * 1.04} ${hy - r * 0.05} Z`, fill: C.burnt }), g)); paths.push(el('circle', st({ cx: 0, cy: hy - r * 1.12, r: r * 0.22, fill: C.peach }), g)); }
    if (style === 'glasses') { paths.push(el('path', st({ d: `M${-r} ${hy - r * 0.2} A${r} ${r} 0 0 1 ${r} ${hy - r * 0.2} Q0 ${hy - r * 0.5} ${-r} ${hy - r * 0.2} Z`, fill: C.ink }), g)); }
    const face = el('g', {}, g);
    el('circle', { cx: -r * 0.36, cy: hy + r * 0.02, r: Math.max(3.2, r * 0.085), fill: C.ink }, face);
    el('circle', { cx: r * 0.36, cy: hy + r * 0.02, r: Math.max(3.2, r * 0.085), fill: C.ink }, face);
    if (style === 'glasses') { el('circle', { cx: -r * 0.36, cy: hy + r * 0.02, r: r * 0.26, fill: 'none', stroke: C.ink, 'stroke-width': 3.5 }, face); el('circle', { cx: r * 0.36, cy: hy + r * 0.02, r: r * 0.26, fill: 'none', stroke: C.ink, 'stroke-width': 3.5 }, face); }
    el('path', { d: `M${-r * 0.26} ${hy + r * 0.4} Q0 ${hy + r * 0.62} ${r * 0.26} ${hy + r * 0.4}`, fill: 'none', stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, face);
    return { g, paths, face, head, body, r, hy, h, x, y,
      draw(k, kf) { paths.forEach((p) => { p.setAttribute('stroke-dasharray', '1 1'); p.setAttribute('stroke-dashoffset', n2(1 - k)); p.setAttribute('fill-opacity', n2(kf == null ? k : kf)); }); face.setAttribute('opacity', n2(kf == null ? k : kf)); },
    };
  }

  window.RIG = { C, el, tf, vis, ik, make, pose, toParent, sparkle, sun, lights, chair, phone, shaker, towel, neighbour, mix, bulbPath, n2, SPARK };
})();
