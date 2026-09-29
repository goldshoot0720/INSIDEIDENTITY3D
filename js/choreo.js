// Procedural choreography: each move maps a local beat time (0..8) to a pose spec.
import * as THREE from 'three';
import { makeSpec, blendSpec, mirrorSpec } from './rig.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
const E = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'YXZ'));
const frac = (t) => t - Math.floor(t);
const dip = (t) => 0.5 + 0.5 * Math.cos(2 * Math.PI * t); // 1 on the beat
const hit = (t) => Math.exp(-6 * frac(t)); // sharp accent on the beat
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function base(k = 0) {
  const s = makeSpec();
  s.dirs.LeftArm = V(0.2, -1, 0.05); s.dirs.LeftForeArm = V(0.1, -1, 0.2);
  s.dirs.RightArm = V(-0.2, -1, 0.05); s.dirs.RightForeArm = V(-0.1, -1, 0.2);
  knees(s, k);
  return s;
}

// k: knee bend 0..1, w: stance width
function knees(s, k, w = 0.07) {
  s.dirs.LeftUpLeg = V(w, -1, 0.55 * k); s.dirs.LeftLeg = V(w * 0.4, -1, -0.55 * k);
  s.dirs.RightUpLeg = V(-w, -1, 0.55 * k); s.dirs.RightLeg = V(-w * 0.4, -1, -0.55 * k);
  return s;
}

const hipsOnLeft = (s) => { s.dirs.LeftArm = V(0.75, -0.5, -0.3); s.dirs.LeftForeArm = V(-0.6, -0.55, 0.35); };

export const MOVES = {
  bounce(t) {
    const s = base(0.45 * dip(t));
    const sw = Math.sin(Math.PI * t);
    s.dirs.LeftArm = V(0.3, -1, 0.45 * sw); s.dirs.LeftForeArm = V(0.15, -0.6, 0.5 + 0.3 * sw);
    s.dirs.RightArm = V(-0.3, -1, -0.45 * sw); s.dirs.RightForeArm = V(-0.15, -0.6, 0.5 - 0.3 * sw);
    s.chest = E(0, 0.15 * sw, 0); s.hips = E(0, -0.06 * sw, 0);
    s.head = E(0.12 * dip(t), 0.1 * sw, 0);
    return s;
  },
  pump(t) {
    const a = hit(t);
    const s = base(0.4 * dip(t));
    s.dirs.RightArm = V(-0.3, 0.35 + 0.6 * a, 0.6); s.dirs.RightForeArm = V(-0.1, 1, 0.25 - 0.2 * a);
    hipsOnLeft(s);
    s.chest = E(-0.08 * a, -0.15, 0.05); s.head = E(-0.15 * a + 0.05, -0.1, 0);
    return s;
  },
  clap(t) {
    const o = 1 - hit(t);
    const high = Math.floor(t / 4) % 2 === 1; // second half claps overhead
    const s = base(0.35 * dip(t));
    if (high) {
      s.dirs.LeftArm = V(0.3 + 0.35 * o, 0.9, 0.2); s.dirs.LeftForeArm = V(-0.35 + 0.6 * o, 1, 0.1);
      s.dirs.RightArm = V(-0.3 - 0.35 * o, 0.9, 0.2); s.dirs.RightForeArm = V(0.35 - 0.6 * o, 1, 0.1);
      s.head = E(-0.2, 0, 0);
    } else {
      s.dirs.LeftArm = V(0.3 + 0.3 * o, -0.35, 0.85); s.dirs.LeftForeArm = V(-0.55 + 0.8 * o, 0.1, 0.8);
      s.dirs.RightArm = V(-0.3 - 0.3 * o, -0.35, 0.85); s.dirs.RightForeArm = V(0.55 - 0.8 * o, 0.1, 0.8);
      s.head = E(0.1 * dip(t), 0, 0);
    }
    return s;
  },
  wave(t) {
    const sw = Math.sin((Math.PI * t) / 2);
    const s = base(0.3 * dip(t));
    s.dirs.LeftArm = V(0.45 + 0.35 * sw, 0.85, 0.1); s.dirs.LeftForeArm = V(0.3 + 0.7 * sw, 0.9, 0.05);
    s.dirs.RightArm = V(-0.45 + 0.35 * sw, 0.85, 0.1); s.dirs.RightForeArm = V(-0.3 + 0.7 * sw, 0.9, 0.05);
    s.chest = E(0, 0, -0.18 * sw); s.hips = E(0, 0, 0.08 * sw); s.head = E(-0.1, 0, -0.12 * sw);
    return s;
  },
  point(t) {
    const a = hit(t), left = Math.floor(t / 4) % 2 === 1;
    const s = base(0.3 * dip(t));
    knees(s, 0.35 * dip(t), 0.22);
    s.dirs.RightArm = V(-0.2, 0.2 + 0.15 * a, 1); s.dirs.RightForeArm = V(-0.1, 0.25 + 0.1 * a, 1);
    hipsOnLeft(s);
    s.chest = E(0.05 * a, 0.3, 0); s.hips = E(0, 0.12, 0); s.head = E(0, 0.15, 0);
    return left ? mirrorSpec(s) : s;
  },
  vanish(t) {
    // "Vanishment this World!" — hand over the eye, other arm flung out
    const tr = 0.04 * hit(t);
    const s = base(0);
    knees(s, 0.15, 0.3);
    s.dirs.RightArm = V(-0.35, -0.1 + tr, 0.93); s.dirs.RightForeArm = V(0.6, 0.65, -0.35);
    s.dirs.RightHand = V(0.35, 0.9, -0.1);
    s.dirs.LeftArm = V(0.85, 0.35 + tr, 0.4); s.dirs.LeftForeArm = V(0.85, 0.42, 0.3); s.dirs.LeftHand = V(0.8, 0.5, 0.3);
    s.hips = E(0, 0.18, 0); s.chest = E(-0.12, 0.3, 0.05); s.head = E(0.05, -0.1, 0.18 + tr);
    return s;
  },
  cross(t) {
    const open = smooth(3.6, 4.2, t) * (1 - smooth(7.4, 8, t));
    const a = mixSpec(crossClosed(t), crossOpen(t), open);
    return a;
  },
  jump(t) {
    const ph = t % 2;
    const air = ph > 0.5 && ph < 1.5 ? Math.sin(Math.PI * (ph - 0.5)) : 0;
    const crouch = ph <= 0.5 ? Math.sin(Math.PI * ph) : ph >= 1.5 ? Math.sin(Math.PI * (ph - 1.5)) : 0;
    const s = base(0.6 * crouch + 0.5 * air);
    s.rootY = 0.38 * air;
    s.dirs.LeftArm = V(0.5, -0.8 + 1.8 * air, 0.3); s.dirs.LeftForeArm = V(0.4, -0.6 + 1.7 * air, 0.3);
    s.dirs.RightArm = V(-0.5, -0.8 + 1.8 * air, 0.3); s.dirs.RightForeArm = V(-0.4, -0.6 + 1.7 * air, 0.3);
    s.chest = E(0.25 * crouch - 0.1 * air, 0, 0); s.head = E(-0.25 * air, 0, 0);
    return s;
  },
  step(t) {
    const sw = Math.sin((Math.PI * t) / 2);
    const s = base(0);
    const kl = Math.max(0, sw), kr = Math.max(0, -sw);
    s.dirs.LeftUpLeg = V(0.1 + 0.3 * kl, -1, 0.3 * kr); s.dirs.LeftLeg = V(0.05, -1, -0.4 * kr);
    s.dirs.RightUpLeg = V(-0.1 - 0.3 * kr, -1, 0.3 * kl); s.dirs.RightLeg = V(-0.05, -1, -0.4 * kl);
    s.rootX = 0.25 * sw;
    s.dirs.LeftArm = V(0.5, -0.7, 0.4 * -sw); s.dirs.LeftForeArm = V(0.1, 0.3, 1);
    s.dirs.RightArm = V(-0.5, -0.7, 0.4 * sw); s.dirs.RightForeArm = V(-0.1, 0.3, 1);
    s.chest = E(0, 0.2 * sw, 0.08 * sw); s.head = E(0.08 * dip(t), -0.1 * sw, 0.1 * sw);
    return s;
  },
  spin(t) {
    const sp = smooth(0, 2, t);
    const s = base(0.3 * Math.sin(Math.PI * sp));
    s.rootYaw = sp * Math.PI * 2;
    const up = smooth(2, 2.6, t);
    s.dirs.LeftArm = V(1, 0.1 + 0.9 * up, 0.1); s.dirs.LeftForeArm = V(0.8, 0.2 + 1.2 * up, 0.1);
    s.dirs.RightArm = V(-1, 0.1 + 0.9 * up, 0.1); s.dirs.RightForeArm = V(-0.8, 0.2 + 1.2 * up, 0.1);
    s.head = E(-0.15 * up, 0, 0);
    if (t > 4) { const b = MOVES.heart(t); return mixSpec(s, b, smooth(4, 4.6, t)); }
    return s;
  },
  heart(t) {
    const sw = Math.sin((Math.PI * t) / 2);
    const s = base(0.25 * dip(t));
    s.dirs.LeftArm = V(0.55, 0.8, 0.25); s.dirs.LeftForeArm = V(-0.65, 0.75, 0.15); s.dirs.LeftHand = V(-0.8, 0.2, 0.1);
    s.dirs.RightArm = V(-0.55, 0.8, 0.25); s.dirs.RightForeArm = V(0.65, 0.75, 0.15); s.dirs.RightHand = V(0.8, 0.2, 0.1);
    s.chest = E(0, 0, 0.12 * sw); s.head = E(0, 0, 0.22 * sw);
    return s;
  },
};

function crossClosed(t) {
  const s = base(0.2 * hit(t));
  knees(s, 0.2, 0.25);
  s.dirs.LeftArm = V(0.35, 0.05, 0.93); s.dirs.LeftForeArm = V(-0.75, 0.62, 0.18);
  s.dirs.RightArm = V(-0.35, 0.05, 0.93); s.dirs.RightForeArm = V(0.75, 0.62, 0.05);
  s.chest = E(0.15, 0, 0); s.head = E(0.3, 0, 0);
  return s;
}
function crossOpen(t) {
  const s = base(0.1);
  knees(s, 0.1, 0.3);
  s.dirs.LeftArm = V(0.9, -0.25 + 0.1 * hit(t), 0.25); s.dirs.LeftForeArm = V(0.9, -0.2, 0.3);
  s.dirs.RightArm = V(-0.9, -0.25 + 0.1 * hit(t), 0.25); s.dirs.RightForeArm = V(-0.9, -0.2, 0.3);
  s.chest = E(-0.18, 0, 0); s.head = E(-0.25, 0, 0);
  return s;
}
function mixSpec(a, b, w) { return blendSpec(makeSpec(), a, b, w); }

// Timeline of 8-beat sections. mirrorOdd: characters 1 & 3 do the mirror image.
// stagger: beats of canon delay per character.
export const TIMELINE = [
  { move: 'bounce' }, { move: 'bounce', mirrorOdd: true },
  { move: 'pump', mirrorOdd: true, call: '爆ぜろリアル！' }, { move: 'clap' },
  { move: 'point', mirrorOdd: true, call: '弾けろシナプス！' }, { move: 'cross', stagger: 0.25 },
  { move: 'vanish', mirrorOdd: true, call: 'Vanishment this World!' }, { move: 'wave', stagger: 0.5 },
  { move: 'step', mirrorOdd: true }, { move: 'jump', stagger: 0.5 },
  { move: 'spin', stagger: 0.5 }, { move: 'heart', mirrorOdd: true },
  { move: 'pump' }, { move: 'wave' },
  { move: 'cross' }, { move: 'vanish', call: 'INSIDE IDENTITY' },
];

export const MOVE_LABEL = {
  bounce: '律動', pump: '揮拳', clap: '拍手', point: '指向', vanish: '邪王真眼',
  cross: '交叉封印', wave: '揮舞', step: '側步', jump: '跳躍', spin: '轉圈', heart: '比心',
};

function evalSection(sec, t, i) {
  const st = Math.max(0, t - (sec.stagger || 0) * i);
  const s = MOVES[sec.move](Math.min(st, 7.999));
  if (sec.mirrorOdd && i % 2 === 1) mirrorSpec(s);
  return s;
}

// beat: global beat count, i: character index
export function choreoSpec(beat, i) {
  const n = TIMELINE.length;
  const b = Math.max(0, beat);
  const idx = Math.floor(b / 8) % n;
  const t = b % 8;
  const sec = TIMELINE[idx];
  const cur = evalSection(sec, t, i);
  const w = smooth(0, 0.6, t - (sec.stagger || 0) * i);
  if (w >= 1 || b < 8) return cur;
  const prev = evalSection(TIMELINE[(idx - 1 + n) % n], 7.999, i);
  return blendSpec(prev, prev, cur, w);
}

export function sectionAt(beat) {
  const idx = Math.floor(Math.max(0, beat) / 8) % TIMELINE.length;
  return { idx, ...TIMELINE[idx] };
}

export const idleSpec = (time) => MOVES.bounce(time * 0.9);
