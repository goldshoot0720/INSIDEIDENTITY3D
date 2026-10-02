// 2D anime cast for the PVs, redrawn after the INSIDE IDENTITY MV look: shared school
// uniform (dark blazer, plaid skirt with a white frill), cel shading and dark line art.
// A character is drawn from the same pose specs the 3D choreography produces
// (js/choreo.js), projected onto the screen plane.
//
// Character-local units: feet on y = 0, up is −y, ≈ 680 units tall; +x = screen right
// (the character's left while facing the audience). Head-local units: head centre at 0,
// crown ≈ −62, chin ≈ +56.
import * as THREE from 'three';

const LINE = '#2a1626';
const SKIN = '#ffe9df', SKIN_SH = '#f5c6b8', BLUSH = 'rgba(255,120,140,0.42)';
const BLAZER = { base: '#2d2744', shade: '#1b1730', hi: '#3f3860' };
const SHIRT = '#fbf8fc', SHIRT_SH = '#d8d0e4';
const PLAID = { base: '#a3243a', dark: '#5c0f22', line: '#e0566a', frill: '#ffffff' };

// ---------- roster ----------
// key ↔ the 3D roster in js/main.js; colours follow the cast sheet in the Effects repo
export const CAST = {
  whale: {
    name: 'Dpskmusume', zh: '鯨魚娘', color: '#3f6fe0', body: 'girl',
    hair: { style: 'long', base: '#2f3f9a', shade: '#1c2766', tip: '#6fb6ec', hi: '#7f9cf0', ahoge: true },
    eye: '#2f86e8', ears: 'fin', earCol: '#3348a8', earEdge: '#9cc8f4',
    band: true, clip: '#4fb0ff', bow: '#2b3c96',
    skirt: { base: '#26306a', dark: '#141a40', line: '#7fa0e8', frill: '#ffffff' },
    socks: 'frill', sockCol: '#ffffff', shoe: '#28367e', tail: 'whale', tailCol: '#2f3f9a', tailBelly: '#c8dcf8',
  },
  gugu: {
    name: 'Gugugaga', zh: '咕咕嘎嘎', color: '#ffd23f', body: 'girl',
    hair: { style: 'bob', base: '#3a2a24', shade: '#221612', hi: '#6a5248' },
    eye: '#7e8494', hood: 'penguin', bow: '#ffcb2e',
    socks: 'knee', sockCol: '#1d1c22', sockStripe: '#f4f2f0', shoe: '#1d1c22', shoeSole: '#ffc21c',
  },
  ya: {
    name: '牙妹 Yamei', zh: '牙妹', color: '#ff3a4a', body: 'girl',
    hair: { style: 'twin', base: '#c23a2e', shade: '#86201a', hi: '#f07a62', ribbon: '#1b1418' },
    eye: '#d8782c', ears: 'cat', earCol: '#c23a2e', earIn: '#f6d6c4', fang: true, bow: '#e0283a',
    skirt: { base: '#1e1a22', dark: '#0e0c12', line: '#d02a34', frill: '#ffffff' },
    socks: 'thigh', sockCol: '#1a1620', shoe: '#4a3022',
  },
  yu: {
    name: '魚妹 Yumei', zh: '魚妹', color: '#c77dff', body: 'girl',
    hair: { style: 'long', base: '#4a332c', shade: '#2a1a16', tip: '#5c4036', hi: '#86665a' },
    eye: '#3a7ee0', bow: '#2a3a6e', ribbonTie: true,
    skirt: { base: '#26305a', dark: '#141a38', line: '#5a6ca8', frill: '#ffffff' },
    socks: 'knee', sockCol: '#222a4e', shoe: '#4a3022',
  },
  feng: {
    name: '鋒兄 Fengbro', zh: '鋒兄', color: '#ff8a3d', body: 'boy',
    hair: { style: 'short', base: '#1d1820', shade: '#0c0a10', hi: '#4a4252' },
    eye: '#5a3a26', glasses: '#2a2630', beard: true, tie: '#c9a978', tieStripe: '#8a6f45',
    pants: '#2a2840', shoe: '#f2f2f4',
  },
  tu: {
    name: '小塗 Tu', zh: '小塗', color: '#4dff9a', body: 'boy',
    hair: { style: 'short2', base: '#18141c', shade: '#08060c', hi: '#463e50' },
    eye: '#4a3020', grin: true, tie: '#8a8a92', tieStripe: '#5e5e66',
    pants: '#2a2840', shoe: '#f2f2f4',
  },
  bubu: {
    name: 'Miabubu', zh: '喵布布', color: '#ff7ad9', body: 'girl',
    hair: { style: 'calico', base: '#f6f0e8', shade: '#d6cabc', hi: '#ffffff', patch: '#e88a3a', patch2: '#2c242a' },
    eye: '#5cbc3a', slit: true, ears: 'cat', earCol: '#e88a3a', earCol2: '#2c242a', earIn: '#ffb8cc',
    hoodie: '#efe4d4', bow: '#e88a3a', paws: true,
    socks: 'knee', sockCol: '#f4f2f0', shoe: '#f0f0f2', shoeSole: '#2a2a30',
    tail: 'cat', tailCol: '#e88a3a', tailBand: '#2c242a', tailTip: '#f6f0e8',
  },
  baibai: {
    name: 'Miabyby', zh: '喵白白', color: '#7a9bff', body: 'girl',
    hair: { style: 'calico', base: '#f8f6f4', shade: '#d8d4d0', hi: '#ffffff', patch: '#4a4a52' },
    eye: '#b4c23a', slit: true, ears: 'cat', earCol: '#f8f6f4', earCol2: '#4a4a52', earIn: '#ffc4d2',
    hoodie: '#f2ece2', bow: '#8a8a96', paws: true,
    socks: 'knee', sockCol: '#f4f2f0', shoe: '#f0f0f2', shoeSole: '#2a2a30',
    tail: 'cat', tailCol: '#f8f6f4', tailBand: '#d8d4d0', tailTip: '#6a6a72',
  },
};
export const CAST_KEYS = Object.keys(CAST);

const BODY = {
  girl: { hipY: 318, hipW: 29, waistY: 374, waistW: 38, shY: 482, shW: 46, neckY: 500, headY: 582, thigh: 150, shin: 146,
    ua: 104, fa: 96, leg: [26, 18, 12], arm: [13, 11, 9], hem: 88, scale: 1, head: 1.28 },
  boy: { hipY: 336, hipW: 33, waistY: 394, waistW: 46, shY: 506, shW: 56, neckY: 526, headY: 604, thigh: 160, shin: 154,
    ua: 114, fa: 104, leg: [29, 22, 17], arm: [16, 13, 11], hem: 0, scale: 1.04, head: 1.24 },
};
const ANKLE_H = 26;
const K = 420; // metres (rootX / rootY) → local units

// ---------- small vector helpers ----------
const P = (x, y) => ({ x, y });
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const mul = (a, s) => P(a.x * s, a.y * s);
const lerpP = (a, b, t) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const len = (a) => Math.hypot(a.x, a.y);
const rot = (v, r) => P(v.x * Math.cos(r) - v.y * Math.sin(r), v.x * Math.sin(r) + v.y * Math.cos(r));
const perp = (v) => { const l = len(v) || 1; return P(-v.y / l, v.x / l); };
const proj = (d, fallback) => (d ? P(d.x, -d.y) : fallback);
const eul = new THREE.Euler();
const angles = (q) => { eul.setFromQuaternion(q, 'YXZ'); return { yaw: eul.y, pitch: eul.x, roll: eul.z }; };

// ---------- pose → 2D skeleton ----------
export function solve(spec, key) {
  const c = CAST[key], B = BODY[c.body];
  const H = angles(spec.hips), C = angles(spec.chest), Hd = angles(spec.head);
  const rp = -H.roll * 0.9, rc = rp - C.roll * 0.9, rh = rc - Hd.roll * 0.9;
  const pelvis = P(spec.rootX * K, -B.hipY);
  const waist = add(pelvis, rot(P(0, -(B.waistY - B.hipY)), rp));
  const shc = add(waist, rot(P(0, -(B.shY - B.waistY)), rc));
  const neck = add(shc, rot(P(0, -(B.neckY - B.shY)), rc));
  const head = add(neck, rot(P(0, -(B.headY - B.neckY)), rh));
  const s = { key, c, B, rp, rc, rh, pelvis, waist, shc, neck, head,
    yaw: spec.rootYaw + (H.yaw + C.yaw) * 0.5, turn: Math.sin(Hd.yaw + C.yaw * 0.6), nod: Math.sin(Hd.pitch + C.pitch * 0.5) };
  for (const [side, m] of [['Left', 1], ['Right', -1]]) {
    const d = spec.dirs, k = side[0];
    const sh = add(shc, rot(P((B.shW - 4) * m, 6), rc));
    const ua = d[`${side}Arm`], fa = d[`${side}ForeArm`];
    const el = add(sh, mul(proj(ua, P(0.2 * m, 1)), B.ua));
    const wr = add(el, mul(proj(fa, P(0.1 * m, 1)), B.fa));
    const hd = d[`${side}Hand`] || fa;
    const hip = add(pelvis, rot(P(B.hipW * m, 0), rp));
    const kn = add(hip, mul(proj(d[`${side}UpLeg`], P(0.05 * m, 1)), B.thigh));
    const an = add(kn, mul(proj(d[`${side}Leg`], P(0.02 * m, 1)), B.shin));
    s[k] = { m, sh, el, wr, hand: proj(hd, P(0, 1)), hip, kn, an,
      armZ: ((ua?.z || 0) + (fa?.z || 0)) / 2, armBack: (ua?.z || 0) < -0.2 && (fa?.z || 0) < 0.1 };
  }
  // plant the lower foot on the floor, then apply the jump lift
  const dy = -ANKLE_H - Math.max(s.L.an.y, s.R.an.y) - spec.rootY * K;
  for (const k of ['pelvis', 'waist', 'shc', 'neck', 'head']) s[k] = add(s[k], P(0, dy));
  for (const k of ['L', 'R']) for (const j of ['sh', 'el', 'wr', 'hip', 'kn', 'an']) s[k][j] = add(s[k][j], P(0, dy));
  return s;
}

// ---------- drawing primitives ----------
let LW = 3; // line width in local units, set per draw from the on-screen scale

function stroke(g, w = 1) { g.lineWidth = LW * w; g.strokeStyle = LINE; g.stroke(); }
function fillStroke(g, fill, w = 1) { g.fillStyle = fill; g.fill(); stroke(g, w); }

// tapered capsule a→b with radii ra, rb
function capsule(g, a, b, ra, rb) {
  const d = sub(b, a), n = perp(d), ang = Math.atan2(d.y, d.x);
  g.beginPath();
  g.moveTo(a.x + n.x * ra, a.y + n.y * ra);
  g.lineTo(b.x + n.x * rb, b.y + n.y * rb);
  g.arc(b.x, b.y, rb, ang + Math.PI / 2, ang - Math.PI / 2, true);
  g.lineTo(a.x - n.x * ra, a.y - n.y * ra);
  g.arc(a.x, a.y, ra, ang - Math.PI / 2, ang + Math.PI / 2, true);
  g.closePath();
}

// joined segments: outline everything first, then fill, so inner joints leave no seams
function limbs(g, segs, fill) {
  g.lineWidth = LW * 2; g.strokeStyle = LINE;
  for (const [a, b, ra, rb] of segs) { capsule(g, a, b, ra, rb); g.stroke(); }
  g.fillStyle = fill;
  for (const [a, b, ra, rb] of segs) { capsule(g, a, b, ra, rb); g.fill(); }
}

function ellipse(g, x, y, rx, ry, r = 0) { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), r, 0, Math.PI * 2); }

// path through points with rounded corners (quadratic midpoints)
function smoothPath(g, pts, closed = true) {
  const n = pts.length;
  const mid = (i) => lerpP(pts[i % n], pts[(i + 1) % n], 0.5);
  g.beginPath();
  if (closed) {
    g.moveTo(mid(n - 1).x, mid(n - 1).y);
    for (let i = 0; i < n; i++) { const m = mid(i); g.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); }
    g.closePath();
  } else {
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n - 1; i++) { const m = mid(i); g.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); }
    g.lineTo(pts[n - 1].x, pts[n - 1].y);
  }
}

// pointed hair strands: a fan of leaf shapes from a root line, each ending at a tip
function strands(g, roots, tips, bend = 0.5) {
  g.beginPath();
  g.moveTo(roots[0].x, roots[0].y);
  for (let i = 0; i < tips.length; i++) {
    const a = roots[i], b = roots[i + 1], t = tips[i];
    g.quadraticCurveTo(lerpP(a, t, bend).x - (t.y - a.y) * 0.08, lerpP(a, t, bend + 0.15).y, t.x, t.y);
    g.quadraticCurveTo(lerpP(b, t, bend).x + (t.y - b.y) * 0.08, lerpP(b, t, bend + 0.15).y, b.x, b.y);
  }
}

// ---------- body parts ----------
function drawLeg(g, s, side) {
  const { c, B } = s, j = s[side];
  const [r0, r1, r2] = B.leg;
  if (c.body === 'boy') {
    limbs(g, [[j.hip, j.kn, r0 + 4, r1 + 4], [j.kn, j.an, r1 + 4, r2 + 6]], c.pants);
    g.beginPath(); g.moveTo(j.kn.x - j.m * 6, j.kn.y - 8); g.lineTo(j.kn.x - j.m * 2, j.kn.y + 10); stroke(g, 0.5);
  } else {
    limbs(g, [[j.hip, j.kn, r0, r1], [j.kn, j.an, r1, r2]], SKIN);
    // shade the inner side of the thigh
    g.save(); capsule(g, j.hip, j.kn, r0, r1); g.clip();
    const n = perp(sub(j.kn, j.hip));
    capsule(g, add(j.hip, mul(n, -r0 * 1.2 * j.m)), add(j.kn, mul(n, -r1 * 1.2 * j.m)), r0 * 0.7, r1 * 0.6);
    g.fillStyle = SKIN_SH; g.fill(); g.restore();
    // socks
    const sock = (from, to, ra, rb) => limbs(g, [[from, to, ra + 1, rb + 1]], c.sockCol);
    if (c.socks === 'thigh') limbs(g, [[lerpP(j.kn, j.hip, 0.55), j.kn, (r0 + r1) / 2 + 1, r1 + 1], [j.kn, j.an, r1 + 1, r2 + 1]], c.sockCol);
    else if (c.socks === 'knee') {
      sock(lerpP(j.an, j.kn, 0.92), j.an, r1 - 1, r2);
      if (c.sockStripe) {
        for (const u of [0.8, 0.72]) {
          const a = lerpP(j.an, j.kn, u), n2 = perp(sub(j.kn, j.an));
          g.beginPath(); g.moveTo(a.x + n2.x * (r1 - 1), a.y + n2.y * (r1 - 1)); g.lineTo(a.x - n2.x * (r1 - 1), a.y - n2.y * (r1 - 1));
          g.lineWidth = LW * 1.6; g.strokeStyle = c.sockStripe; g.stroke();
        }
      }
    } else if (c.socks === 'frill') {
      sock(lerpP(j.an, j.kn, 0.22), j.an, r2 + 1, r2);
      const a = lerpP(j.an, j.kn, 0.22);
      for (let i = -2; i <= 2; i++) { ellipse(g, a.x + i * 5, a.y + 2, 4.5, 4); fillStroke(g, '#ffffff', 0.5); }
    }
  }
  drawShoe(g, s, j);
}

function drawShoe(g, s, j) {
  const { c } = s, x = j.an.x, y = j.an.y + 6;
  const w = c.body === 'boy' ? 22 : 17;
  g.beginPath();
  g.moveTo(x - w, y + ANKLE_H - 6);
  g.quadraticCurveTo(x - w - 2, y - 6, x, y - 8);
  g.quadraticCurveTo(x + w + 2, y - 6, x + w, y + ANKLE_H - 6);
  g.quadraticCurveTo(x, y + ANKLE_H, x - w, y + ANKLE_H - 6);
  fillStroke(g, c.shoe);
  if (c.shoeSole) { g.beginPath(); g.moveTo(x - w, y + ANKLE_H - 9); g.quadraticCurveTo(x, y + ANKLE_H - 2, x + w, y + ANKLE_H - 9); g.lineWidth = LW * 2.2; g.strokeStyle = c.shoeSole; g.stroke(); }
  if (c.shoe === '#f2f2f4' || c.shoe === '#f0f0f2') { g.beginPath(); g.moveTo(x - w * 0.5, y - 2); g.lineTo(x + w * 0.5, y + 4); stroke(g, 0.5); }
  ellipse(g, x - w * 0.35, y + 2, w * 0.25, 3); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
}

function drawSkirt(g, s, t) {
  const { c, B, waist, pelvis, rp } = s;
  const pal = c.skirt || PLAID;
  const sway = Math.sin(t * 2.1) * 3 + s.rp * 30;
  const W = rot(P(-B.waistW - 2, 0), rp), W2 = rot(P(B.waistW + 2, 0), rp);
  const a = add(waist, W), b = add(waist, W2);
  const hemY = pelvis.y + B.hem - (B.hipY - B.waistY) * 0;
  const flare = 92;
  const hl = add(pelvis, rot(P(-flare + sway, B.hem - 4), rp)), hr = add(pelvis, rot(P(flare + sway, B.hem - 4), rp));
  const shape = () => {
    g.beginPath();
    g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
    g.quadraticCurveTo(b.x + 30, (b.y + hr.y) / 2, hr.x, hr.y);
    g.quadraticCurveTo((hl.x + hr.x) / 2, hr.y + 16, hl.x, hl.y);
    g.quadraticCurveTo(a.x - 30, (a.y + hl.y) / 2, a.x, a.y);
    g.closePath();
  };
  // frill peeks out under the hem
  g.beginPath();
  const fl = add(hl, P(-2, 4)), fr = add(hr, P(2, 4));
  const n = 14;
  g.moveTo(fl.x, fl.y - 10);
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = fl.x + (fr.x - fl.x) * u, y = fl.y + (fr.y - fl.y) * u + Math.sin(Math.PI * u) * 16 + 10;
    g.quadraticCurveTo(x - (fr.x - fl.x) / n / 2, y + 7, x, y);
  }
  g.lineTo(fr.x, fr.y - 10); g.closePath();
  fillStroke(g, pal.frill, 0.7);
  shape(); fillStroke(g, pal.base);
  g.save(); shape(); g.clip();
  // plaid: dark bands + thin light lines, skewed along the pleats
  g.globalAlpha = 0.55; g.fillStyle = pal.dark;
  for (let x = -160; x <= 160; x += 34) { g.fillRect(pelvis.x + x + sway * 0.3, a.y - 10, 14, 200); }
  for (let y = 10; y < 200; y += 34) g.fillRect(pelvis.x - 200, a.y + y, 400, 12);
  g.globalAlpha = 0.6; g.fillStyle = pal.line;
  for (let x = -160; x <= 160; x += 34) g.fillRect(pelvis.x + x + 22 + sway * 0.3, a.y - 10, 2.5, 200);
  for (let y = 10; y < 200; y += 34) g.fillRect(pelvis.x - 200, a.y + y + 20, 400, 2.5);
  g.globalAlpha = 1;
  // pleats
  for (let i = -3; i <= 3; i++) {
    const top = lerpP(a, b, 0.5 + i / 8), bot = lerpP(hl, hr, 0.5 + i / 7.2);
    g.beginPath(); g.moveTo(top.x, top.y + 6); g.lineTo(bot.x, bot.y + 10 * Math.cos(i / 3));
    g.lineWidth = LW * 0.6; g.strokeStyle = 'rgba(30,6,16,0.45)'; g.stroke();
  }
  const sh = g.createLinearGradient(0, a.y, 0, hl.y);
  sh.addColorStop(0, 'rgba(20,0,10,0.35)'); sh.addColorStop(0.25, 'rgba(20,0,10,0)');
  g.fillStyle = sh; g.fillRect(pelvis.x - 200, a.y - 5, 400, 200);
  g.restore();
  shape(); stroke(g);
  void hemY;
}

function torsoPath(g, s) {
  const { B, waist, pelvis, shc, rc, rp, c } = s;
  const boy = c.body === 'boy';
  const sl = add(shc, rot(P(-B.shW - 2, 4), rc)), sr = add(shc, rot(P(B.shW + 2, 4), rc));
  const nl = add(shc, rot(P(-16, -14), rc)), nr = add(shc, rot(P(16, -14), rc));
  const wl = add(waist, rot(P(-B.waistW - 2, 0), (rc + rp) / 2)), wr = add(waist, rot(P(B.waistW + 2, 0), (rc + rp) / 2));
  const hemD = boy ? 34 : 4;
  const hl = add(pelvis, rot(P(-B.waistW - 10, hemD - (B.hipY - B.waistY) * 0.0 - 48), rp));
  const hr = add(pelvis, rot(P(B.waistW + 10, hemD - 48), rp));
  g.beginPath();
  g.moveTo(nl.x, nl.y);
  g.quadraticCurveTo(sl.x + 10, sl.y - 12, sl.x, sl.y + 8);
  g.quadraticCurveTo(wl.x - 6, (sl.y + wl.y) / 2, wl.x, wl.y);
  g.lineTo(hl.x, hl.y);
  g.quadraticCurveTo((hl.x + hr.x) / 2, hl.y + 10, hr.x, hr.y);
  g.lineTo(wr.x, wr.y);
  g.quadraticCurveTo(wr.x + 6, (sr.y + wr.y) / 2, sr.x, sr.y + 8);
  g.quadraticCurveTo(sr.x - 10, sr.y - 12, nr.x, nr.y);
  g.closePath();
  return { sl, sr, nl, nr, wl, wr, hl, hr };
}

function drawTorso(g, s) {
  const { c, shc, rc, waist } = s;
  const at = (x, y) => add(shc, rot(P(x, y), rc));
  // hoodie hood behind the neck (cats)
  if (c.hoodie) {
    const a = at(-38, -18), b = at(38, -18), m = at(0, 22);
    g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(at(-46, 16).x, at(-46, 16).y, m.x, m.y);
    g.quadraticCurveTo(at(46, 16).x, at(46, 16).y, b.x, b.y); g.quadraticCurveTo(at(0, -30).x, at(0, -30).y, a.x, a.y);
    fillStroke(g, c.hoodie);
  }
  const T = torsoPath(g, s);
  g.fillStyle = BLAZER.base; g.fill();
  // cel shade along the screen-left side
  g.save(); torsoPath(g, s); g.clip();
  g.fillStyle = BLAZER.shade;
  g.beginPath(); g.moveTo(T.sl.x - 20, T.sl.y); g.lineTo(T.sl.x + 16, T.sl.y + 10); g.quadraticCurveTo(T.wl.x + 14, T.wl.y, T.hl.x + 10, T.hl.y + 30);
  g.lineTo(T.hl.x - 30, T.hl.y + 30); g.closePath(); g.fill();
  // shirt V, lapels, buttons
  const v0l = at(-17, -12), v0r = at(17, -12), vb = at(0, c.body === 'boy' ? 120 : 92);
  g.beginPath(); g.moveTo(v0l.x, v0l.y); g.lineTo(v0r.x, v0r.y); g.lineTo(vb.x, vb.y); g.closePath();
  g.fillStyle = c.hoodie || SHIRT; g.fill(); stroke(g, 0.7);
  g.beginPath(); g.moveTo(vb.x, vb.y); g.lineTo(at(-6, 40).x, at(-6, 40).y); g.lineWidth = LW * 3; g.strokeStyle = SHIRT_SH; g.stroke();
  for (const m of [-1, 1]) {
    const p0 = at(19 * m, -12), p1 = at(32 * m, 22), p2 = at(16 * m, 34), p3 = vb;
    g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.lineTo(p3.x, p3.y);
    g.fillStyle = BLAZER.hi; g.fill(); stroke(g, 0.7);
  }
  for (const y of [c.body === 'boy' ? 134 : 104, c.body === 'boy' ? 164 : 128]) {
    const b = add(waist, rot(P(4, y - (s.B.waistY - s.B.shY) - 4), rc));
    ellipse(g, b.x, b.y, 3.6, 3.6); fillStroke(g, '#b08a3a', 0.4);
  }
  g.restore();
  torsoPath(g, s); stroke(g);
  // collar of the shirt
  for (const m of [-1, 1]) {
    const a = at(5 * m, -14), b = at(20 * m, -10), d = at(10 * m, 6);
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(d.x, d.y); g.closePath(); fillStroke(g, c.hoodie || SHIRT, 0.6);
  }
  // neckwear
  const k = at(0, -4);
  if (c.tie) {
    const t0 = at(0, 2), t1 = at(-7, 50), t2 = at(0, 62), t3 = at(7, 50);
    g.beginPath(); g.moveTo(t0.x, t0.y); g.lineTo(t1.x, t1.y); g.lineTo(t2.x, t2.y); g.lineTo(t3.x, t3.y); g.closePath();
    fillStroke(g, c.tie, 0.7);
    ellipse(g, k.x, k.y + 2, 7, 6); fillStroke(g, c.tie, 0.7);
    g.save(); g.beginPath(); g.moveTo(t0.x, t0.y); g.lineTo(t1.x, t1.y); g.lineTo(t2.x, t2.y); g.lineTo(t3.x, t3.y); g.clip();
    g.strokeStyle = c.tieStripe; g.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const p = at(-12, 10 + i * 10); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + 24, p.y + 12); g.stroke(); }
    g.restore();
  } else if (c.ribbonTie) {
    for (const m of [-1, 1]) {
      const e = at(10 * m, 44);
      g.beginPath(); g.moveTo(k.x, k.y); g.quadraticCurveTo(at(12 * m, 12).x, at(12 * m, 12).y, e.x, e.y); g.lineWidth = LW * 2.4; g.strokeStyle = LINE; g.stroke();
      g.lineWidth = LW * 1.4; g.strokeStyle = c.bow; g.stroke();
    }
    ellipse(g, k.x, k.y, 6, 5); fillStroke(g, c.bow, 0.6);
  } else {
    // big bow
    for (const m of [-1, 1]) {
      const p1 = at(26 * m, -14), p2 = at(26 * m, 12);
      g.beginPath(); g.moveTo(k.x, k.y); g.quadraticCurveTo(p1.x, p1.y - 4, p1.x, p1.y); g.quadraticCurveTo(at(32 * m, 0).x, at(32 * m, 0).y, p2.x, p2.y); g.closePath();
      fillStroke(g, c.bow, 0.8);
      const t1 = at(12 * m, 34), t2 = at(4 * m, 30);
      g.beginPath(); g.moveTo(k.x, k.y); g.lineTo(t1.x, t1.y); g.lineTo(t2.x, t2.y); g.closePath(); fillStroke(g, c.bow, 0.7);
    }
    ellipse(g, k.x, k.y, 6, 6); fillStroke(g, c.bow, 0.7);
  }
}

function drawArm(g, s, side) {
  const { c, B } = s, j = s[side];
  const [r0, r1, r2] = B.arm;
  limbs(g, [[j.sh, j.el, r0 + 2, r1 + 2], [j.el, j.wr, r1 + 2, r2 + 3]], BLAZER.base);
  // elbow crease + cuff
  const n = perp(sub(j.wr, j.el));
  const cu = lerpP(j.el, j.wr, 0.94);
  g.beginPath(); g.moveTo(cu.x + n.x * (r2 + 3), cu.y + n.y * (r2 + 3)); g.lineTo(cu.x - n.x * (r2 + 3), cu.y - n.y * (r2 + 3));
  g.lineWidth = LW * 2.4; g.strokeStyle = c.hoodie || SHIRT; g.stroke();
  // hand
  const h = j.hand, hl = len(h) || 1, dir = P(h.x / hl, h.y / hl);
  const hc = add(j.wr, mul(dir, 12 * Math.max(0.45, hl)));
  const ang = Math.atan2(dir.y, dir.x);
  ellipse(g, hc.x, hc.y, 12 * Math.max(0.6, hl) + 2, 10, ang);
  fillStroke(g, c.paws ? c.hoodie : SKIN, 0.9);
  if (c.paws) { for (const o of [-5, 0, 5]) { const q = add(hc, rot(P(6, o), ang)); ellipse(g, q.x, q.y, 2.4, 2.4); g.fillStyle = '#ff9ab4'; g.fill(); } }
  else { const th = add(hc, rot(P(-2, -9 * j.m), ang)); ellipse(g, th.x, th.y, 6, 4, ang - 0.6 * j.m); fillStroke(g, SKIN, 0.6); }
}

function drawTail(g, s, t) {
  const { c, pelvis } = s;
  if (!c.tail) return;
  const sw = Math.sin(t * 2.4);
  if (c.tail === 'whale') {
    const a = add(pelvis, P(30, -10)), m = add(pelvis, P(80 + 6 * sw, 40)), e = add(pelvis, P(120 + 10 * sw, -20));
    g.beginPath(); g.moveTo(a.x, a.y - 14); g.quadraticCurveTo(m.x, m.y - 30, e.x, e.y); g.lineTo(e.x + 8, e.y + 22);
    g.quadraticCurveTo(m.x, m.y + 14, a.x, a.y + 16); g.closePath(); fillStroke(g, c.tailCol);
    // fluke
    g.beginPath(); g.moveTo(e.x, e.y); g.quadraticCurveTo(e.x + 10, e.y - 46, e.x + 40, e.y - 52);
    g.quadraticCurveTo(e.x + 22, e.y - 16, e.x + 14, e.y + 6); g.quadraticCurveTo(e.x + 50, e.y + 4, e.x + 62, e.y + 26);
    g.quadraticCurveTo(e.x + 20, e.y + 34, e.x + 4, e.y + 20); g.closePath(); fillStroke(g, c.tailCol);
    g.beginPath(); g.moveTo(a.x + 10, a.y + 10); g.quadraticCurveTo(m.x, m.y + 8, e.x + 6, e.y + 16);
    g.lineWidth = LW * 3; g.strokeStyle = c.tailBelly; g.stroke();
  } else {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      pts.push(add(pelvis, P(26 + 70 * u + 22 * Math.sin(u * 3 + t * 2.2) * u, -10 + 20 * u - 150 * u * u + 18 * sw * u)));
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const u = i / 10;
      const col = u > 0.75 ? c.tailTip : Math.floor(u * 6) % 2 ? c.tailBand : c.tailCol;
      capsule(g, pts[i], pts[i + 1], 10 + 2 * Math.sin(u * 3), 10 + 2 * Math.sin((u + 0.1) * 3));
      g.fillStyle = col; g.fill();
    }
    g.save(); g.globalCompositeOperation = 'destination-over';
    g.lineCap = 'round'; g.lineJoin = 'round';
    smoothPath(g, pts, false); g.lineWidth = 24 + LW * 2; g.strokeStyle = LINE; g.stroke();
    g.restore();
  }
}

// ---------- head ----------
function faceShape(g, boy) {
  g.beginPath();
  g.moveTo(-47, -18);
  g.bezierCurveTo(-48, 14, boy ? -42 : -36, 40, 0, boy ? 54 : 56);
  g.bezierCurveTo(boy ? 42 : 36, 40, 48, 14, 47, -18);
  g.bezierCurveTo(46, -64, -46, -64, -47, -18);
  g.closePath();
}

function drawEye(g, c, x, y, m, opts) {
  const boy = c.body === 'boy';
  const rx = boy ? 10 : 12.5, ry = boy ? 12 : 16;
  if (opts.wink && m === opts.wink) {
    g.beginPath(); g.moveTo(x - 13 * m * -1, y + 2); g.quadraticCurveTo(x, y - 9, x + 13 * m * -1, y + 2);
    g.lineCap = 'round'; stroke(g, 1.8);
    g.beginPath(); g.moveTo(x - 11, y + 2); g.lineTo(x - 15, y + 6); stroke(g, 1);
    return;
  }
  const open = opts.blink ? 0.08 : 1;
  if (open < 0.5) {
    g.beginPath(); g.moveTo(x - 13, y + 2); g.quadraticCurveTo(x, y + 6, x + 13, y + 2); g.lineCap = 'round'; stroke(g, 1.6);
    return;
  }
  // white + iris
  ellipse(g, x, y + 1, rx + 3, ry + 1); g.fillStyle = '#ffffff'; g.fill();
  g.save(); ellipse(g, x, y + 1, rx + 3, ry + 1); g.clip();
  const gr = g.createLinearGradient(0, y - ry, 0, y + ry);
  gr.addColorStop(0, shade(c.eye, -0.55)); gr.addColorStop(0.55, c.eye); gr.addColorStop(1, shade(c.eye, 0.45));
  ellipse(g, x + opts.look, y + 2, rx, ry); g.fillStyle = gr; g.fill();
  g.lineWidth = 1.4; g.strokeStyle = shade(c.eye, -0.6); g.stroke();
  if (c.slit) { ellipse(g, x + opts.look, y + 2, 2.6, ry * 0.7); } else ellipse(g, x + opts.look, y + 1, rx * 0.45, ry * 0.5);
  g.fillStyle = shade(c.eye, -0.75); g.fill();
  // lid shadow
  g.fillStyle = 'rgba(60,20,50,0.28)'; g.fillRect(x - 20, y - ry - 4, 40, 7);
  // highlights
  ellipse(g, x + opts.look - rx * 0.35 * m, y - ry * 0.35, rx * 0.36, ry * 0.26, -0.4); g.fillStyle = '#ffffff'; g.fill();
  ellipse(g, x + opts.look + rx * 0.35 * m, y + ry * 0.45, rx * 0.17, rx * 0.17); g.fill();
  g.restore();
  // upper lash line, flicked at the outer corner
  const o = m; // +1: screen-right eye, outer side is +x
  g.beginPath();
  g.moveTo(x - (rx + 3) * o, y - ry * 0.35);
  g.quadraticCurveTo(x - 2 * o, y - ry - 4, x + (rx + 5) * o, y - ry * 0.55);
  g.lineTo(x + (rx + 9) * o, y - ry * 0.25);
  g.lineWidth = boy ? 3.2 : 4.6; g.strokeStyle = LINE; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  // lower lash hint
  g.beginPath(); g.moveTo(x + (rx - 2) * o, y + ry - 1); g.lineTo(x + (rx + 3) * o, y + ry - 6); g.lineWidth = 1.6; g.stroke();
}

function drawMouth(g, c, open, grin) {
  const y = 34;
  if (open < 0.15 && !grin) {
    g.beginPath(); g.moveTo(-7, y); g.quadraticCurveTo(0, y + 5, 7, y); g.lineCap = 'round'; stroke(g, 0.9);
    return;
  }
  const w = (c.body === 'boy' ? 9 : 8) + 4 * open + (grin ? 3 : 0), h = 4 + 12 * Math.max(open, grin ? 0.35 : 0);
  g.beginPath(); g.moveTo(-w, y - 2); g.quadraticCurveTo(0, y + 1, w, y - 2); g.quadraticCurveTo(w * 0.7, y + h, 0, y + h); g.quadraticCurveTo(-w * 0.7, y + h, -w, y - 2);
  g.closePath(); g.fillStyle = '#8a2234'; g.fill();
  g.save(); g.clip(); ellipse(g, 0, y + h + 2, w * 0.7, h * 0.55); g.fillStyle = '#ff8a9a'; g.fill(); g.restore();
  g.beginPath(); g.moveTo(-w, y - 2); g.quadraticCurveTo(0, y + 1, w, y - 2); g.quadraticCurveTo(w * 0.7, y + h, 0, y + h); g.quadraticCurveTo(-w * 0.7, y + h, -w, y - 2);
  stroke(g, 0.8);
  if (c.fang) { g.beginPath(); g.moveTo(-w * 0.55, y - 1); g.lineTo(-w * 0.35, y + 5); g.lineTo(-w * 0.15, y); g.fillStyle = '#ffffff'; g.fill(); stroke(g, 0.4); }
}

function drawEars(g, c, back) {
  if (c.ears === 'cat') {
    for (const m of [-1, 1]) {
      const col = m < 0 || !c.earCol2 ? c.earCol : c.earCol2;
      g.beginPath(); g.moveTo(22 * m, -56); g.quadraticCurveTo(40 * m, -96, 50 * m, -104); g.quadraticCurveTo(58 * m, -74, 52 * m, -40); g.closePath();
      if (back) { fillStroke(g, col); continue; }
      g.beginPath(); g.moveTo(30 * m, -60); g.quadraticCurveTo(42 * m, -86, 48 * m, -92); g.quadraticCurveTo(52 * m, -72, 48 * m, -52); g.closePath();
      g.fillStyle = c.earIn; g.fill();
    }
  } else if (c.ears === 'fin') {
    for (const m of [-1, 1]) {
      g.beginPath(); g.moveTo(44 * m, -18); g.quadraticCurveTo(80 * m, -40, 98 * m, -26); g.quadraticCurveTo(84 * m, -14, 92 * m, 2);
      g.quadraticCurveTo(70 * m, 0, 46 * m, 14); g.closePath(); fillStroke(g, c.earCol);
      g.beginPath(); g.moveTo(56 * m, -10); g.quadraticCurveTo(76 * m, -22, 90 * m, -22); g.lineWidth = 3; g.strokeStyle = c.earEdge; g.stroke();
    }
  }
}

function drawBackHair(g, c, t) {
  const h = c.hair, sw = Math.sin(t * 1.7) * 4;
  if (h.style === 'short' || h.style === 'short2') {
    // fluffy tufted volume behind the fringe
    const tuft = h.style === 'short'
      ? [[-58, 14], [-70, -22], [-62, -30], [-74, -54], [-50, -62], [-50, -86], [-26, -78], [-8, -100], [10, -80], [36, -94], [40, -70], [68, -64], [62, -40], [72, -20], [58, 14]]
      : [[-58, 14], [-72, -14], [-64, -34], [-78, -60], [-48, -70], [-40, -96], [-18, -80], [4, -104], [18, -82], [44, -98], [46, -72], [76, -62], [64, -38], [74, -12], [58, 14]];
    g.beginPath(); g.moveTo(tuft[0][0], tuft[0][1]);
    for (let i = 1; i < tuft.length; i++) {
      const [x, y] = tuft[i], [px, py] = tuft[i - 1];
      g.quadraticCurveTo((px + x) / 2 + (i % 2 ? -4 : 4), (py + y) / 2 + (i % 2 ? 6 : -6), x, y);
    }
    g.closePath(); fillStroke(g, h.base);
  }
  if (h.style === 'long') {
    const tips = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8; tips.push(P(-92 + 184 * u + sw, 250 + 26 * Math.sin(u * 9) - 30 * Math.abs(u - 0.5))); }
    const roots = tips.map((p, i) => P(p.x * 0.97 + 6, 200 - (i % 2) * 6));
    g.beginPath(); g.moveTo(-58, -20);
    g.bezierCurveTo(-90, 40, -96, 150, -92, 200);
    for (let i = 0; i < tips.length; i++) {
      const a = tips[i], b = tips[i + 1] || P(92, 200);
      g.lineTo(a.x, a.y);
      if (tips[i + 1]) g.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 40, b.x, b.y);
    }
    g.bezierCurveTo(96, 150, 90, 40, 58, -20); g.closePath();
    const gr = g.createLinearGradient(0, -20, 0, 260);
    gr.addColorStop(0, h.shade); gr.addColorStop(0.55, h.base); gr.addColorStop(1, h.tip || h.base);
    g.fillStyle = gr; g.fill(); stroke(g);
    void roots;
  } else if (h.style === 'twin') {
    for (const m of [-1, 1]) {
      const s2 = Math.sin(t * 2 + m) * 6;
      const r = P(52 * m, -40);
      g.beginPath(); g.moveTo(r.x, r.y - 14);
      g.bezierCurveTo(110 * m, -40, 120 * m + s2, 60, 96 * m + s2, 190);
      g.lineTo(100 * m + s2, 150); g.lineTo(84 * m + s2, 176); g.lineTo(80 * m + s2, 120);
      g.bezierCurveTo(70 * m, 40, 66 * m, 0, r.x, r.y + 14); g.closePath();
      const gr = g.createLinearGradient(0, -40, 0, 190); gr.addColorStop(0, h.base); gr.addColorStop(1, h.shade);
      g.fillStyle = gr; g.fill(); stroke(g);
      g.beginPath(); g.moveTo(82 * m, -20); g.quadraticCurveTo(100 * m + s2, 50, 92 * m + s2, 140); g.lineWidth = 2.5; g.strokeStyle = h.hi; g.stroke();
    }
    // short hair behind the head
    g.beginPath(); g.moveTo(-56, -10); g.quadraticCurveTo(-64, 50, -40, 80); g.lineTo(40, 80); g.quadraticCurveTo(64, 50, 56, -10); g.closePath(); fillStroke(g, h.shade);
  } else if (h.style === 'bob' || h.style === 'calico') {
    g.beginPath(); g.moveTo(-58, -14); g.bezierCurveTo(-70, 40, -62, 70, -48, 78); g.lineTo(48, 78); g.bezierCurveTo(62, 70, 70, 40, 58, -14); g.closePath();
    fillStroke(g, h.shade);
  }
}

function drawFrontHair(g, c, t) {
  const h = c.hair;
  const skull = () => {
    g.moveTo(-58, 18);
    g.bezierCurveTo(-64, -50, -34, -70, 0, -70);
    g.bezierCurveTo(34, -70, 64, -50, 58, 18);
  };
  const boy = h.style === 'short' || h.style === 'short2';
  // bangs tips from right to left
  const tips = boy
    ? [P(54, 4), P(40, -16), P(26, -10), P(10, -16), P(-6, -8), P(-22, -18), P(-38, -10), P(-54, 2)]
    : [P(56, 40), P(42, -2), P(28, -6), P(13, -2), P(-2, 4), P(-16, -4), P(-30, -8), P(-44, 0), P(-56, 40)];
  g.beginPath(); skull();
  let prev = P(58, 18);
  for (let i = 0; i < tips.length; i++) {
    const tp = tips[i], next = tips[i + 1];
    g.quadraticCurveTo(prev.x - 2, (prev.y + tp.y) / 2 - 6, tp.x, tp.y);
    if (next) {
      const v = P((tp.x + next.x) / 2 + 2, Math.min(tp.y, next.y) - (boy ? 16 : 22));
      g.quadraticCurveTo(tp.x - 2, tp.y - 10, v.x, v.y);
      prev = v;
    }
  }
  g.closePath();
  const gr = g.createLinearGradient(0, -70, 0, 20);
  gr.addColorStop(0, h.base); gr.addColorStop(1, h.shade);
  g.save(); g.fillStyle = gr; g.fill();
  if (h.patch) {
    g.clip();
    ellipse(g, 30, -46, 34, 26, 0.3); g.fillStyle = h.patch; g.fill();
    if (h.patch2) { ellipse(g, -36, -36, 22, 30, -0.4); g.fillStyle = h.patch2; g.fill(); }
  }
  g.restore();
  stroke(g);
  // angel-ring highlight
  g.save();
  g.beginPath(); g.ellipse(0, -30, 44, 16, 0, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 5; g.strokeStyle = h.hi; g.globalAlpha = 0.85; g.lineCap = 'round'; g.stroke();
  g.restore();
  // strand lines
  g.lineWidth = 1.4; g.strokeStyle = h.shade;
  for (const x of [-30, -8, 16, 36]) { g.beginPath(); g.moveTo(x * 0.6, -54); g.quadraticCurveTo(x * 0.9, -30, x, -14); g.stroke(); }
  // side locks
  if (!boy) {
    const long = h.style === 'long', sw = Math.sin(t * 1.9) * 2;
    for (const m of [-1, 1]) {
      g.beginPath(); g.moveTo(50 * m, -26);
      g.bezierCurveTo(62 * m, 20, 58 * m + sw, long ? 90 : 60, 50 * m + sw, long ? 150 : 74);
      g.bezierCurveTo(46 * m, long ? 100 : 54, 42 * m, 30, 40 * m, -10); g.closePath();
      g.fillStyle = h.style === 'calico' && m > 0 && h.patch ? h.patch : h.base; g.fill(); stroke(g, 0.9);
    }
  } else {
    for (const m of [-1, 1]) {
      g.beginPath(); g.moveTo(48 * m, -30); g.quadraticCurveTo(56 * m, 0, 50 * m, 22); g.lineTo(44 * m, 4); g.closePath(); fillStroke(g, h.base, 0.8);
    }
  }
  if (h.ahoge) {
    g.beginPath(); g.moveTo(-4, -68); g.bezierCurveTo(-10, -104, 22, -112, 14, -88); g.bezierCurveTo(10, -100, -2, -96, 4, -68); g.closePath(); fillStroke(g, h.base, 0.8);
  }
}

function drawHood(g, c, front) {
  if (c.hood !== 'penguin') return;
  if (!front) { ellipse(g, 0, -4, 76, 76); fillStroke(g, '#1d1c22'); return; }
  g.beginPath();
  g.moveTo(-74, 30); g.bezierCurveTo(-80, -60, -40, -84, 0, -84); g.bezierCurveTo(40, -84, 80, -60, 74, 30);
  g.quadraticCurveTo(64, 34, 56, 24); g.bezierCurveTo(58, -36, 30, -62, 0, -62); g.bezierCurveTo(-30, -62, -58, -36, -56, 24);
  g.quadraticCurveTo(-64, 34, -74, 30); g.closePath(); fillStroke(g, '#1d1c22');
  for (const m of [-1, 1]) {
    ellipse(g, 24 * m, -70, 12, 9); fillStroke(g, '#ffffff', 0.7);
    ellipse(g, 26 * m, -70, 4.5, 5.5); g.fillStyle = LINE; g.fill();
  }
  g.beginPath(); g.moveTo(-12, -64); g.quadraticCurveTo(0, -70, 12, -64); g.quadraticCurveTo(4, -48, 0, -44); g.quadraticCurveTo(-4, -48, -12, -64); fillStroke(g, '#ffc21c', 0.8);
  // hair clip
  g.save(); g.translate(-30, -40); g.rotate(-0.5); g.fillStyle = '#c8c8d0'; g.fillRect(-10, -3, 20, 6); g.restore();
}

function drawHead(g, s, t, opts) {
  const { c, head, rh } = s;
  const boy = c.body === 'boy';
  g.save();
  g.translate(head.x, head.y);
  g.rotate(rh);
  g.scale(s.B.head, s.B.head);
  const turn = s.turn * 10, nod = s.nod * 8;
  if (opts.back) {
    drawEars(g, c, true);
    drawHood(g, c, false);
    ellipse(g, 0, -6, 62, 66); fillStroke(g, c.hair.base);
    g.restore();
    return;
  }
  if (!opts.skipBack) { drawHood(g, c, false); drawBackHair(g, c, t); }
  drawEars(g, c, true);
  // neck
  g.beginPath(); g.moveTo(-12, 30); g.lineTo(-12, 76); g.lineTo(12, 76); g.lineTo(12, 30); fillStroke(g, SKIN);
  g.fillStyle = SKIN_SH; g.fillRect(-12, 50, 24, 12);
  // face
  g.save(); g.translate(turn * 0.3, 0);
  faceShape(g, boy); fillStroke(g, SKIN);
  g.save(); faceShape(g, boy); g.clip();
  // hair shadow on the forehead
  g.fillStyle = SKIN_SH; g.beginPath(); g.ellipse(0, -18, 60, 18, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  g.restore();
  g.save(); g.translate(turn, nod);
  const ey = boy ? 12 : 14;
  // brows
  g.lineCap = 'round';
  for (const m of [-1, 1]) {
    g.beginPath(); g.moveTo(10 * m, ey - 22 - (boy ? 0 : 1)); g.quadraticCurveTo(22 * m, ey - 27, 34 * m, ey - 22);
    g.lineWidth = boy ? 3.6 : 2; g.strokeStyle = shade(c.hair.base === '#f6f0e8' || c.hair.base === '#f8f6f4' ? '#b8a898' : c.hair.base, -0.2); g.stroke();
  }
  const look = s.turn * 3;
  drawEye(g, c, -22, ey, -1, { ...opts, look });
  drawEye(g, c, 22, ey, 1, { ...opts, look });
  if (!boy || c.grin) { for (const m of [-1, 1]) { ellipse(g, 30 * m, ey + 18, 11, 5.5); g.fillStyle = BLUSH; g.fill(); } }
  // nose
  g.beginPath(); g.moveTo(1, ey + 13); g.lineTo(-1, ey + 16); g.lineWidth = 1.6; g.strokeStyle = '#d89a8c'; g.stroke();
  if (c.beard) {
    g.save(); faceShape(g, true); g.clip();
    g.fillStyle = 'rgba(40,30,40,0.16)'; g.beginPath(); g.ellipse(0, 46, 34, 16, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(0, 28, 14, 3, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  drawMouth(g, c, opts.mouth, c.grin);
  if (c.glasses) {
    g.lineWidth = 2.6; g.strokeStyle = c.glasses;
    for (const m of [-1, 1]) { g.beginPath(); g.roundRect(22 * m - 15, ey - 11, 30, 22, 5); g.stroke(); }
    g.beginPath(); g.moveTo(-7, ey - 4); g.quadraticCurveTo(0, ey - 8, 7, ey - 4); g.stroke();
    g.beginPath(); g.moveTo(-37, ey - 6); g.lineTo(-46, ey - 10); g.moveTo(37, ey - 6); g.lineTo(46, ey - 10); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.22)'; for (const m of [-1, 1]) { g.beginPath(); g.moveTo(22 * m - 10, ey - 8); g.lineTo(22 * m - 2, ey - 8); g.lineTo(22 * m - 10, ey + 6); g.fill(); }
  }
  g.restore();
  g.save(); g.translate(turn * 0.6, 0);
  drawFrontHair(g, c, t);
  drawEars(g, c, false);
  drawHood(g, c, true);
  if (c.band) {
    // white maid headband with a frill
    g.beginPath(); g.ellipse(0, -44, 56, 26, 0, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = 10; g.strokeStyle = LINE; g.stroke(); g.lineWidth = 7; g.strokeStyle = '#ffffff'; g.stroke();
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.1 + 0.8 * i / 8); ellipse(g, Math.cos(a) * 60, -44 + Math.sin(a) * 30, 6, 6); fillStroke(g, '#ffffff', 0.5); }
  }
  if (c.clip) { g.save(); g.translate(40, -30); g.rotate(0.6); ellipse(g, -7, 0, 8, 6); fillStroke(g, c.clip, 0.6); ellipse(g, 7, 0, 8, 6); fillStroke(g, c.clip, 0.6); g.restore(); }
  if (c.hair.ribbon) {
    for (const m of [-1, 1]) {
      g.save(); g.translate(54 * m, -42);
      for (const k of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(18 * k, -12); g.lineTo(18 * k, 10); g.closePath(); fillStroke(g, c.hair.ribbon, 0.6); }
      ellipse(g, 0, 0, 5, 5); fillStroke(g, c.hair.ribbon, 0.5);
      g.restore();
    }
  }
  g.restore();
  g.restore();
}

// ---------- colour util ----------
const _cc = new Map();
function shade(hex, amt) {
  const key = hex + amt;
  if (_cc.has(key)) return _cc.get(key);
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g2 = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g2 *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; g2 += (255 - g2) * amt; b += (255 - b) * amt; }
  const out = `rgb(${r | 0},${g2 | 0},${b | 0})`;
  _cc.set(key, out);
  return out;
}

// ---------- public ----------
// Draw one character. x, y: screen position of the feet; scale: px per local unit.
// opts: { t (seconds, for hair sway / blinks), mouth 0..1, wink: -1|1, blink, shadow }
export function drawCharacter(g, key, spec, x, y, scale, opts = {}) {
  const s = solve(spec, key);
  const t = opts.t || 0;
  const k = scale * s.B.scale;
  const cy = Math.cos(s.yaw), back = cy < 0;
  LW = 2.2 / k + 1.1;
  g.save();
  g.translate(x, y);
  if (opts.shadow !== false) {
    g.save(); g.scale(1, 0.18);
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 120 * k);
    r.addColorStop(0, 'rgba(20,0,6,0.55)'); r.addColorStop(1, 'rgba(20,0,6,0)');
    g.fillStyle = r; g.beginPath(); g.arc(s.pelvis.x * k, 0, 120 * k, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  g.scale(k * Math.max(0.12, Math.abs(cy)), k);
  g.lineJoin = 'round'; g.lineCap = 'round';
  const o = { ...opts, back, mouth: opts.mouth || 0 };
  const arms = ['L', 'R'];
  if (back) {
    drawLeg(g, s, 'L'); drawLeg(g, s, 'R');
    if (s.c.body !== 'boy') drawSkirt(g, s, t);
    drawTorso(g, s);
    arms.forEach((a) => drawArm(g, s, a));
    drawHead(g, s, t, o);
    drawTail(g, s, t);
  } else {
    drawTail(g, s, t);
    // long hair hangs behind the body, so draw the head's back layer first
    g.save(); g.translate(s.head.x, s.head.y); g.rotate(s.rh); g.scale(s.B.head, s.B.head); drawHood(g, s.c, false); drawBackHair(g, s.c, t); g.restore();
    arms.filter((a) => s[a].armBack).forEach((a) => drawArm(g, s, a));
    drawLeg(g, s, 'L'); drawLeg(g, s, 'R');
    if (s.c.body !== 'boy') drawSkirt(g, s, t);
    drawTorso(g, s);
    drawHead(g, s, t, { ...o, skipBack: true });
    arms.filter((a) => !s[a].armBack).forEach((a) => drawArm(g, s, a));
  }
  g.restore();
  return s;
}

// screen position of the head centre for framing close-ups
export function headOf(key, spec, x, y, scale) {
  const s = solve(spec, key), k = scale * s.B.scale;
  return { x: x + s.head.x * k, y: y + s.head.y * k, k };
}
