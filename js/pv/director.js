// PV director: turns a song's sections / lyrics / beat grid into
//  · blocks — one choreography move per 8-beat phrase, and
//  · shots  — the edit (title card, line-up, close-up, face strips, .pet windows, …).
// Everything is a pure function of time so any frame can be rendered on its own.
import { MOVES, V, E, base, knees, hipsOnLeft } from '../choreo.js';
import { mirrorSpec, blendSpec } from '../rig.js';
import { STORY, MENTION, SIG, songInfo } from './story.js';

const frac = (t) => t - Math.floor(t);
const dip = (t) => 0.5 + 0.5 * Math.cos(2 * Math.PI * t);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// idol poses after the MV's line-up: salute, finger under the chin (wink), finger to the
// cheek, palm to the cheek — dancer i takes pose i
const IDOL = [
  (t) => { const s = base(0.12 * dip(t)); knees(s, 0.12, 0.16);
    s.dirs.RightArm = V(-0.8, 0.4, 0.35); s.dirs.RightForeArm = V(0.8, 0.55, 0.15); s.dirs.RightHand = V(0.5, 0.8, 0.2);
    s.dirs.LeftArm = V(0.3, -0.6, 0.6); s.dirs.LeftForeArm = V(-0.7, 0.2, 0.6);
    s.head = E(0, 0, -0.14); s.chest = E(0, 0, 0.06); return s; },
  (t) => { const s = base(0.12 * dip(t)); knees(s, 0.15, 0.12);
    s.dirs.RightArm = V(-0.25, -0.8, 0.45); s.dirs.RightForeArm = V(0.45, 0.85, 0.25); s.dirs.RightHand = V(0.6, 0.5, 0.3);
    hipsOnLeft(s); s.hips = E(0, 0, 0.06); s.head = E(0.05, 0, 0.16); return s; },
  (t) => { const s = base(0.12 * dip(t)); knees(s, 0.1, 0.14);
    s.dirs.LeftArm = V(0.25, -0.75, 0.55); s.dirs.LeftForeArm = V(-0.35, 0.9, 0.2); s.dirs.LeftHand = V(-0.2, 0.95, 0.1);
    s.dirs.RightArm = V(-0.35, -0.6, 0.55); s.dirs.RightForeArm = V(0.75, 0.15, 0.6);
    s.head = E(0, 0, -0.18); s.chest = E(0, 0, 0.08); return s; },
  (t) => { const s = base(0.12 * dip(t)); knees(s, 0.1, 0.12);
    s.dirs.LeftArm = V(0.3, -0.75, 0.5); s.dirs.LeftForeArm = V(-0.25, 0.95, 0.15); s.dirs.LeftHand = V(-0.6, 0.6, 0.2);
    s.dirs.RightArm = V(-0.85, -0.45, 0.2); s.dirs.RightForeArm = V(-0.9, -0.3, 0.3);
    s.head = E(0, 0, 0.16); s.chest = E(0, 0, -0.05); return s; },
];
// goodbye wave for the last bars
MOVES.byebye = (t) => {
  const s = base(0.2 * dip(t)), w = Math.sin(Math.PI * t);
  s.dirs.RightArm = V(-0.7, 0.55, 0.2); s.dirs.RightForeArm = V(-0.35 + 0.45 * w, 1, 0.1);
  s.dirs.LeftArm = V(0.7, 0.55, 0.2); s.dirs.LeftForeArm = V(0.35 + 0.45 * w, 1, 0.1);
  s.head = E(0, 0, 0.1 * w); return s;
};

const POOL = {
  intro: ['bounce', 'step'],
  verse: ['bounce', 'step', 'roll', 'clap', 'wave', 'bounce', 'point', 'step'],
  chorus: ['pump', 'clap', 'jump', 'heart', 'wave', 'spin', 'kick', 'flame'],
  hook: ['pump', 'clap', 'point', 'jump'],
  break: ['solo', 'solo'],
};
const KIND_LABEL = { intro: 'INTRO', verse: 'VERSE', chorus: 'CHORUS', hook: 'HOOK', break: 'INTERLUDE', outro: 'OUTRO' };

// YouTube songs have no analysis: 8-bar intro, then 16-bar verse / chorus pairs, with the
// MV's shouted lines as the "lyrics" (the same calls the 3D stage flashes)
const CALLS = ['爆ぜろリアル！', '弾けろシナプス！', 'Vanishment this World!', 'Dark Flame Master!', 'INSIDE IDENTITY'];
function synthSong(info, dur) {
  const bar = 4 * 60 / info.bpm, sections = [], lines = [];
  let t = info.beat0 + 8 * bar, k = 0;
  while (t + 16 * bar <= dur - 4 * bar || !sections.length) {
    const kind = k % 2 ? 'chorus' : 'verse';
    sections.push({ kind, start: t, end: Math.min(dur - 1, t + 16 * bar) });
    for (const at of kind === 'chorus' ? [0, 8] : [4]) {
      lines.push({ t: t + at * bar, d: 2.4, text: CALLS[lines.length % CALLS.length], sec: sections.length - 1, kind });
    }
    t += 16 * bar; k++;
  }
  return { ...info, dur, sections, lines };
}

export function buildPlan(id, { dur: ytDur } = {}) {
  const info = songInfo(id), story = STORY[id];
  const song = info.yt ? synthSong(info, ytDur || info.dur) : info;
  const spb = 60 / song.bpm, beat0 = song.beat0, dur = song.dur;
  const beatAt = (t) => (t - beat0) / spb, timeAt = (b) => beat0 + b * spb;

  // loudness envelope, normalised to its 95th percentile
  const raw = song.rms ? Uint8Array.from(atob(song.rms), (ch) => ch.charCodeAt(0)) : null;
  const p95 = raw ? [...raw].sort((a, b) => a - b)[Math.floor(raw.length * 0.95)] || 255 : 1;
  const energy = raw
    ? (t) => Math.min(1.2, (raw[Math.max(0, Math.min(raw.length - 1, Math.floor(t * song.rmsFps)))] || 0) / p95)
    : () => 0.85;

  // ---- segments: intro, sections (small gaps absorbed), breaks, outro ----
  const segs = [];
  const secs = song.sections;
  segs.push({ start: 0, end: secs[0].start, kind: 'intro' });
  secs.forEach((s, i) => {
    const next = secs[i + 1];
    const gap = next ? next.start - s.end : 0;
    segs.push({ start: s.start, end: next && gap < 3 ? next.start : s.end, kind: s.kind === 'chorus' || s.kind === 'hook' ? s.kind : 'verse', sec: i });
    if (next && gap >= 3) segs.push({ start: s.end, end: next.start, kind: 'break' });
  });
  segs.push({ start: secs[secs.length - 1].end, end: dur, kind: 'outro' });
  const segs2 = segs.filter((s) => s.end - s.start > 0.05);
  const segAt = (t) => segs2.find((s) => t >= s.start && t < s.end) || segs2[segs2.length - 1];

  // ---- choreography: one move per 8-beat block ----
  const nBlocks = Math.ceil(beatAt(dur) / 8) + 1;
  const blocks = [];
  const count = {};
  for (let n = 0; n < nBlocks; n++) {
    const t = timeAt(n * 8 + 1);
    const sg = segAt(Math.max(0, t));
    let kind = sg.kind;
    const j = (count[kind] = (count[kind] || 0) + 1) - 1;
    let move;
    if (kind === 'intro') move = j === 0 && t < 4 ? 'idol' : POOL.intro[j % 2];
    else if (kind === 'outro') move = timeAt(n * 8 + 8) >= dur - 1 || dur - t < 8 ? 'idol' : j % 2 ? 'byebye' : 'heart';
    else {
      const pool = [...POOL[kind]];
      if (kind !== 'break') story.extra.forEach((m, k) => pool.splice(2 + k * 3, 0, m));
      move = pool[(j + (sg.sec || 0) * 3) % pool.length];
    }
    blocks.push({ move, kind, mirrorOdd: j % 2 === 1 && move !== 'idol', stagger: kind === 'chorus' && j % 4 === 3 ? 0.35 : 0 });
  }

  // ---- lyrics ----
  const lines = song.lines;
  const lineAt = (t) => { let cur = null; for (const l of lines) { if (l.t <= t + 0.05) cur = l; else break; } return cur && t < cur.t + Math.max(cur.d, 1.2) + 0.6 ? cur : null; };
  const mention = (text) => { for (const [w, k] of MENTION) if (text.includes(w) && story.cast.includes(k)) return k; return null; };

  // ---- the edit ----
  const shots = [];
  const cuts = {};
  let rot = 0;
  const focusFor = (a, b) => {
    for (const l of lines) if (l.t < b && l.t + l.d > a) { const k = mention(l.text); if (k) return k; }
    return story.cast[(rot++) % story.cast.length];
  };
  const CYCLE = {
    verse: [['lineup', 8], ['bust', 8], ['windows', 8], ['lineup', 8], ['duo', 8], ['lyric', 8], ['bust', 8], ['lineupLow', 8]],
    chorus: [['strips', 4], ['lineup', 4], ['bust', 4], ['lineupLow', 4], ['lyric', 4], ['duo', 4], ['lineup', 4], ['bust', 4]],
    hook: [['strips', 4], ['lineupLow', 4], ['bust', 4], ['lyric', 4]],
    break: [['solo', 8], ['windows', 8]],
    intro: [['lineup', 8]],
  };
  for (const sg of segs2) {
    let t = sg.start;
    if (sg.kind === 'intro') {
      const tEnd = Math.min(sg.end, Math.max(6, Math.min(12, sg.end)));
      shots.push({ start: 0, end: tEnd, type: 'title', kind: 'intro' });
      t = tEnd;
    }
    if (sg.kind === 'outro') {
      const endT = Math.max(sg.start, dur - 7);
      if (endT - sg.start > 1.5) shots.push({ start: sg.start, end: endT, type: 'lineup', kind: 'outro' });
      shots.push({ start: endT, end: dur + 1, type: 'end', kind: 'outro' });
      continue;
    }
    const cyc = CYCLE[sg.kind];
    // the cycle carries on across sections of the same kind, so every shot type comes round
    const ck = sg.kind === 'chorus' || sg.kind === 'hook' ? 'chorus' : sg.kind;
    let k = 0;
    if (cuts[ck] && cyc.length > 2) cuts[ck] = Math.ceil(cuts[ck] / 4) * 4; // a chorus opens on the strips
    while (sg.end - t > 0.3) {
      const [type, beats] = cyc[((cuts[ck] || 0) + k) % cyc.length];
      // cut on the beat grid
      let e = timeAt(Math.round(beatAt(t) + beats));
      if (e <= t + 1) e = timeAt(Math.round(beatAt(t) + beats * 2));
      if (sg.end - e < 1.4) e = sg.end;
      const shot = { start: t, end: Math.min(e, sg.end), type, kind: sg.kind, sec: sg.sec, n: k };
      if (type === 'bust' || type === 'duo') shot.focus = focusFor(shot.start, shot.end);
      shots.push(shot);
      t = shot.end; k++;
    }
    cuts[ck] = (cuts[ck] || 0) + k;
  }

  return {
    id, song, story, spb, beat0, dur, beatAt, timeAt, energy, lineAt, segAt, blocks, shots,
    kindLabel: (t) => KIND_LABEL[segAt(t).kind],
    shotAt: (t) => shots.find((s) => t >= s.start && t < s.end) || shots[shots.length - 1],
  };
}

function evalBlock(blk, t, i, key) {
  const st = Math.max(0, t - (blk.stagger || 0) * i);
  let s;
  if (blk.move === 'idol') s = IDOL[i % IDOL.length](st);
  else if (blk.move === 'solo') s = MOVES[SIG[key] || 'bounce'](Math.min(st, 7.999));
  else s = MOVES[blk.move](Math.min(st, 7.999));
  if (blk.mirrorOdd && i % 2 === 1) mirrorSpec(s);
  if (blk.move === 'solo' && key === 'baibai') mirrorSpec(s);
  return s;
}

// pose of dancer i (stage slot) playing character `key` at beat `beat`
export function danceSpec(plan, beat, i, key) {
  const b = Math.max(0, beat);
  const n = Math.min(plan.blocks.length - 1, Math.floor(b / 8));
  const t = b - n * 8;
  const cur = evalBlock(plan.blocks[n], t, i, key);
  const w = smooth(0, 0.7, t - (plan.blocks[n].stagger || 0) * i);
  if (w >= 1 || n === 0) return cur;
  const prev = evalBlock(plan.blocks[n - 1], 7.999, i, key);
  return blendSpec(prev, prev, cur, w);
}

export const idolSpec = (i, beat) => IDOL[i % IDOL.length](beat);

