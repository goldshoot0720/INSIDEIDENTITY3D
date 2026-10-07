// PV player / renderer. Every frame is drawn from time t alone (no per-frame state), so
// the live player, ?snap single frames and tools/render-pv.mjs (frame-by-frame MP4 export)
// all produce the same picture.
import { drawCharacter, headOf, CAST } from './art.js';
import { buildPlan, danceSpec, idolSpec } from './director.js';
import { ORDER, STORY, songInfo } from './story.js';
import { YouTubeSource } from '../youtube.js';

const W = 1920, H = 1080, FPS = 30;
const q = new URLSearchParams(location.search);
const RENDER = q.has('render'), SNAP = q.has('snap'), JOB = q.get('job') || '0';
const cv = document.getElementById('pv');
const g = cv.getContext('2d');
const $ = (id) => document.getElementById(id);

const FONT = {
  title: '"Zen Maru Gothic","Noto Sans TC",sans-serif',
  display: '"Dela Gothic One","Noto Sans TC",sans-serif',
  sub: '"Noto Sans TC",sans-serif',
  mono: '"JetBrains Mono",Menlo,monospace',
};
const POP = ['#ff5fa2', '#3fc8ff', '#ffd23f', '#a07bff', '#4dee9a', '#ff8a3d'];
const INK = '#2a1626';

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, u) => a + (b - a) * u;
const frac = (x) => x - Math.floor(x);
const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
const easeBack = (u) => { u = clamp(u); const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function mix(hex, to, u) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const ch = (sh) => Math.round(lerp((a >> sh) & 255, (b >> sh) & 255, u));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

let plan = null, frame = null, buf = mk(W, H);
let viewScale = 1;
const isCompact = () => matchMedia('(max-width: 820px), (max-height: 500px)').matches;
// Live playback draws in 1920 space and scales the bitmap to the screen. Export stays 1920×1080.
function fitCanvas() {
  if (RENDER || SNAP) return;
  const cssW = cv.clientWidth || innerWidth;
  const target = cssW * Math.min(window.devicePixelRatio || 1, 2);
  const q = Math.min(1, Math.max(0.5, Math.round((target / W) * 8) / 8));
  const bw = Math.round(W * q), bh = Math.round(H * q);
  if (q === viewScale && cv.width === bw && cv.height === bh) return;
  viewScale = q;
  cv.width = bw;
  cv.height = bh;
  buf = mk(bw, bh);
}
function placeChrome() {
  const h = $('ui')?.offsetHeight;
  if (h) document.documentElement.style.setProperty('--ui-h', `${h}px`);
}

// ---------- static layers ----------
// black torn-paper frame around the picture (as in the MV), seeded per song
function tornFrame(seed) {
  const c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = '#050003'; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  const edge = (u, side) => {
    const n = u * 60 + side * 17 + seed;
    return 34 + 16 * hash(Math.floor(n)) + 9 * Math.sin(u * 47 + side) + 6 * hash(Math.floor(n * 7.3));
  };
  x.beginPath();
  const N = 220;
  for (let i = 0; i <= N; i++) { const u = i / N; x.lineTo(u * W, edge(u, 1) + (hash(i + seed) > 0.93 ? 26 * hash(i * 3) : 0)); }
  for (let i = 0; i <= N * 0.6; i++) { const u = i / (N * 0.6); x.lineTo(W - edge(u, 2), u * H); }
  for (let i = N; i >= 0; i--) { const u = i / N; x.lineTo(u * W, H - edge(u, 3) - (hash(i + seed * 2) > 0.94 ? 24 * hash(i * 5) : 0)); }
  for (let i = Math.floor(N * 0.6); i >= 0; i--) { const u = i / (N * 0.6); x.lineTo(edge(u, 4), u * H); }
  x.closePath(); x.fill();
  // ink specks
  x.globalCompositeOperation = 'source-over'; x.fillStyle = '#050003';
  for (let i = 0; i < 70; i++) {
    const side = i % 4, u = hash(i * 9.1 + seed), r = 2 + 6 * hash(i * 3.3);
    const px = side < 2 ? u * W : side === 2 ? 60 + 30 * hash(i) : W - 60 - 30 * hash(i);
    const py = side === 0 ? 58 + 20 * hash(i * 2) : side === 1 ? H - 58 - 20 * hash(i * 2) : u * H;
    x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
  return c;
}

function halftone() {
  const c = mk(24, 24), x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,0.09)';
  x.beginPath(); x.arc(6, 6, 2.2, 0, Math.PI * 2); x.arc(18, 18, 2.2, 0, Math.PI * 2); x.fill();
  return g.createPattern(c, 'repeat');
}
let DOTS = null;

// ---------- shared drawing ----------
function background(t, beat, en, dark = 0) {
  const { pal } = plan.story;
  const acc = Math.exp(-5 * frac(beat));
  const r = g.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.5, 1150);
  r.addColorStop(0, mix(pal.center, '#ffffff', 0.08 * acc * en));
  r.addColorStop(0.55, mix(pal.center, pal.edge, 0.55));
  r.addColorStop(1, pal.edge);
  g.fillStyle = r; g.fillRect(0, 0, W, H);
  // giant scrolling tagline band
  g.save();
  g.translate(W / 2, H * 0.42); g.rotate(-0.12);
  g.font = `900 210px ${FONT.display}`; g.textBaseline = 'middle';
  const txt = `${plan.song.title}　✦　`, tw = g.measureText(txt).width;
  g.globalAlpha = 0.07; g.fillStyle = '#ffffff';
  for (let row = -2; row <= 2; row++) {
    const off = ((t * 60 * (row % 2 ? 1 : -1)) % tw + tw) % tw;
    for (let k = -3; k <= 3; k++) g.fillText(txt, -off + k * tw - W, row * 250);
  }
  g.restore();
  g.save(); g.translate((t * 12) % 24, (t * 6) % 24); g.fillStyle = DOTS; g.fillRect(-24, -24, W + 48, H + 48); g.restore();
  // sparkles
  for (let i = 0; i < 46; i++) {
    const sp = 0.03 + 0.05 * hash(i * 1.7);
    const x = hash(i * 3.1) * W, y = H - frac(hash(i * 5.3) + t * sp) * (H + 80);
    const s = (4 + 10 * hash(i * 7.7)) * (0.7 + 0.5 * acc);
    star(x, y, s, i % 3 ? plan.story.pal.accent : '#ffffff', 0.35 + 0.4 * hash(i));
  }
  // floor glow
  const f = g.createLinearGradient(0, H * 0.72, 0, H);
  f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(10,0,6,0.55)');
  g.fillStyle = f; g.fillRect(0, H * 0.72, W, H * 0.28);
  if (dark) { g.fillStyle = `rgba(6,0,4,${dark})`; g.fillRect(0, 0, W, H); }
}

function star(x, y, s, col, a = 1) {
  g.save(); g.globalAlpha = a; g.fillStyle = col; g.beginPath();
  g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s);
  g.fill(); g.restore();
}

function singing(t, i) {
  const l = plan.lineAt(t);
  if (!l || t > l.t + l.d + 0.15) return 0.05;
  return clamp(plan.energy(t) * (0.35 + 0.65 * Math.abs(Math.sin(t * 10.5 + i * 0.9))));
}
const blink = (t, i) => frac(t * 0.29 + i * 0.37) < 0.022;

function charOpts(t, i, extra = {}) {
  return { t: t + i * 0.7, mouth: singing(t, i), blink: blink(t, i), ...extra };
}

function poseFor(t, beat, i, key, idol) {
  return idol ? idolSpec(i, beat) : danceSpec(plan, beat, i, key);
}

function lineup(t, beat, { scale, feetY, spread, idol = false, cx = W / 2, dim = -1 }) {
  const cast = plan.story.cast;
  cast.forEach((key, i) => {
    const x = cx + (i - (cast.length - 1) / 2) * spread;
    g.save();
    if (dim >= 0 && dim !== i) g.globalAlpha = 0.35;
    drawCharacter(g, key, poseFor(t, beat, i, key, idol), x, feetY + (i % 2 ? 6 : 0), scale,
      charOpts(t, i, { wink: idol && i === 1 ? -1 : 0 }));
    g.restore();
  });
}

function bust(t, beat, key, cx, cy, scale, extra = {}) {
  const i = Math.max(0, plan.story.cast.indexOf(key));
  const spec = danceSpec(plan, beat, i, key);
  const h = headOf(key, spec, 0, 0, scale);
  const bob = Math.sin(beat * Math.PI) * 6;
  drawCharacter(g, key, spec, cx - h.x, cy - h.y + bob, scale, charOpts(t, i, { shadow: false, ...extra }));
}

function fitFont(text, weight, family, max, width) {
  g.font = `${weight} ${max}px ${family}`;
  const w = g.measureText(text).width;
  return w > width ? Math.floor(max * width / w) : max;
}

function outlined(text, x, y, fill, stroke, lw) {
  g.lineJoin = 'round'; g.miterLimit = 2;
  g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(text, x, y);
  g.fillStyle = fill; g.fillText(text, x, y);
}

// cute chunky glyph-by-glyph title (pops in from `t0`)
function popTitle(text, cx, cy, size, t, t0 = 0) {
  g.font = `900 ${size}px ${FONT.title}`; g.textBaseline = 'middle'; g.textAlign = 'center';
  const glyphs = [...text];
  const ws = glyphs.map((ch) => g.measureText(ch).width * 0.98);
  let x = cx - ws.reduce((a, b) => a + b, 0) / 2;
  glyphs.forEach((ch, k) => {
    const u = (t - t0 - k * 0.05) / 0.45;
    if (u <= 0) { x += ws[k]; return; }
    const sc = easeBack(u), gx = x + ws[k] / 2, gy = cy + Math.sin(t * 3 + k * 0.7) * 5;
    g.save(); g.translate(gx, gy); g.rotate(((k % 3) - 1) * 0.05); g.scale(sc, sc);
    if (ch.trim()) {
      g.lineJoin = 'round';
      g.lineWidth = size * 0.22; g.strokeStyle = INK; g.strokeText(ch, size * 0.05, size * 0.07);
      g.fillStyle = INK; g.fillText(ch, size * 0.05, size * 0.07);
      g.lineWidth = size * 0.18; g.strokeStyle = '#ffffff'; g.strokeText(ch, 0, 0);
      const col = POP[k % POP.length];
      const gr = g.createLinearGradient(0, -size / 2, 0, size / 2);
      gr.addColorStop(0, mix(col, '#ffffff', 0.35)); gr.addColorStop(1, col);
      g.fillStyle = gr; g.fillText(ch, 0, 0);
    }
    g.restore();
    x += ws[k];
  });
  g.textAlign = 'left';
}

function pill(text, cx, cy, t, t0, accent) {
  const u = easeOut((t - t0) / 0.5);
  if (u <= 0) return;
  g.save(); g.globalAlpha = u; g.translate(cx, cy + (1 - u) * 20);
  g.font = `900 34px ${FONT.title}`; g.textBaseline = 'middle';
  const tw = g.measureText(text).width + text.length * 6, w = tw + 120, h = 70;
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2);
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.arc(-w / 2 + 40, 0, 17, 0, Math.PI * 2); g.fillStyle = accent; g.fill();
  g.beginPath(); g.arc(-w / 2 + 40, 0, 6, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
  g.fillStyle = INK; g.letterSpacing = '6px'; g.fillText(text, -w / 2 + 76, 2); g.letterSpacing = '0px';
  g.restore();
}

// ---------- shots ----------
const SHOTS = {
  title(t, beat, en, sh) {
    background(t, beat, en);
    lineup(t, beat, { scale: 0.86, feetY: 1000, spread: 360, idol: true });
    const title = plan.song.title, n = [...title].length;
    const lines = n > 9 ? splitTitle(title) : [title];
    // two-line titles shrink so the tagline pill stays clear of the dancers' heads
    const size = Math.min(lines.length > 1 ? 112 : 150, Math.floor(1500 / Math.max(...lines.map((l) => [...l].length))));
    const y0 = lines.length > 1 ? 150 : 200;
    lines.forEach((l, k) => popTitle(l, W / 2, y0 + k * size * 1.08, size, t - sh.start, 0.3 + k * 0.35));
    pill(plan.song.tagline, W / 2, y0 + lines.length * size * 1.08 + 10, t - sh.start, 1.2, plan.story.pal.accent2);
    head(t, sh, 'INSIDE IDENTITY · PV', 0.2);
  },
  lineup(t, beat, en, sh) {
    background(t, beat, en);
    const u = (t - sh.start) / (sh.end - sh.start);
    lineup(t, beat, { scale: lerp(1.0, 1.08, u), feetY: lerp(990, 1010, u), spread: 400 });
  },
  lineupLow(t, beat, en, sh) {
    background(t, beat, en);
    const u = (t - sh.start) / (sh.end - sh.start), dir = sh.n % 2 ? 1 : -1;
    lineup(t, beat, { scale: 1.5, feetY: 1520, spread: 480, cx: W / 2 + dir * lerp(-70, 70, u) });
  },
  bust(t, beat, en, sh) {
    background(t, beat, en);
    const key = sh.focus, c = CAST[key], u = (t - sh.start) / (sh.end - sh.start);
    speedLines(t, c.color);
    bust(t, beat, key, 720, 440 - u * 20, lerp(2.5, 2.7, u));
    nameTag(key, 1500, 140, t - sh.start);
  },
  duo(t, beat, en, sh) {
    background(t, beat, en);
    const cast = plan.story.cast, i = cast.indexOf(sh.focus), other = cast[(i + (i % 2 ? -1 : 1) + cast.length) % cast.length];
    const pair = i < cast.indexOf(other) ? [sh.focus, other] : [other, sh.focus];
    const u = (t - sh.start) / (sh.end - sh.start);
    pair.forEach((key, k) => {
      const j = cast.indexOf(key);
      drawCharacter(g, key, danceSpec(plan, beat, j, key), W / 2 + (k ? 330 : -330), 1450 - u * 30, 1.75, charOpts(t, j));
    });
  },
  strips(t, beat, en, sh) {
    g.fillStyle = '#050003'; g.fillRect(0, 0, W, H);
    const cast = plan.story.cast, n = cast.length, pw = W / n, lt = t - sh.start;
    cast.forEach((key, i) => {
      const u = easeOut((lt - i * 0.09) / 0.35);
      if (u <= 0) return;
      const dy = (1 - u) * (i % 2 ? -H : H) * 0.6;
      g.save();
      g.translate(0, dy);
      tornRect(i * pw + 6, 0, pw - 12, H, i * 13 + plan.seed);
      g.clip();
      const c = CAST[key];
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, mix(c.color, '#000000', 0.55)); gr.addColorStop(1, mix(plan.story.pal.edge, '#000000', 0.2));
      g.fillStyle = gr; g.fillRect(i * pw, 0, pw, H);
      speedLines(t, c.color, i * pw, pw);
      bust(t, beat, key, i * pw + pw / 2 + 10, 470 + Math.sin(lt * 0.8 + i) * 8, 3.3 + lt * 0.04);
      g.restore();
    });
    // white scratches
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const s = sh.n * 7 + k, a = clamp((lt - 0.4 - k * 0.1) / 0.15);
      if (a <= 0) continue;
      const x0 = hash(s) * W * 0.8, y0 = 60 + hash(s + 1) * H * 0.8;
      g.lineWidth = 6 + 8 * hash(s + 2); g.globalAlpha = a;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + 340 * a, y0 - 120 * a); g.stroke();
    }
    g.restore();
  },
  windows(t, beat, en, sh) {
    background(t, beat, en, 0.1);
    const cast = plan.story.cast, lt = t - sh.start;
    const slots = [{ x: 150, y: 150, w: 760, h: 520 }, { x: 1010, y: 120, w: 740, h: 500 }, { x: 560, y: 420, w: 820, h: 560 }];
    slots.forEach((s, k) => {
      const key = cast[(sh.n + k + (sh.focus ? cast.indexOf(sh.focus) : 0)) % cast.length];
      petWindow(t, beat, key, s, lt - k * 0.28);
    });
  },
  lyric(t, beat, en, sh) {
    background(t, beat, en);
    lineup(t, beat, { scale: 0.9, feetY: 1000, spread: 380 });
    g.fillStyle = 'rgba(8,0,6,0.62)'; g.fillRect(0, 0, W, H);
    const l = plan.lineAt(t) || plan.lineAt(sh.start + 0.2);
    if (!l) return;
    const text = l.text, size = fitFont(text, 900, FONT.sub, 160, 1640);
    g.font = `900 ${size}px ${FONT.sub}`; g.textBaseline = 'middle'; g.textAlign = 'left';
    const glyphs = [...text], ws = glyphs.map((ch) => g.measureText(ch).width);
    let x = W / 2 - ws.reduce((a, b) => a + b, 0) / 2;
    const lt = t - l.t, jit = Math.exp(-6 * frac(beat)) * 6;
    glyphs.forEach((ch, k) => {
      const u = easeBack((lt - k * 0.035) / 0.3);
      if (u > 0) {
        const y = H / 2 + (1 - u) * -60;
        g.save(); g.globalAlpha = clamp(u);
        g.globalCompositeOperation = 'screen';
        g.fillStyle = '#ff2a4a'; g.fillText(ch, x + jit, y);
        g.fillStyle = '#3fd7ff'; g.fillText(ch, x - jit, y);
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#ffffff'; g.fillText(ch, x, y);
        g.restore();
      }
      x += ws[k];
    });
    g.font = `500 30px ${FONT.mono}`; g.fillStyle = plan.story.pal.accent; g.letterSpacing = '8px';
    g.textAlign = 'center'; g.fillText(plan.kindLabel(t), W / 2, H / 2 + size * 0.85); g.textAlign = 'left'; g.letterSpacing = '0px';
  },
  solo(t, beat, en, sh) {
    background(t, beat, en, 0.35);
    const cast = plan.story.cast, b0 = plan.beatAt(sh.start);
    const k = Math.floor(Math.max(0, beat - b0) / 2) % cast.length, key = cast[k];
    const cone = g.createRadialGradient(W / 2, 0, 50, W / 2, 600, 900);
    cone.addColorStop(0, 'rgba(255,255,255,0.45)'); cone.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(W / 2 - 120, 0); g.lineTo(W / 2 + 120, 0); g.lineTo(W / 2 + 520, H); g.lineTo(W / 2 - 520, H); g.fill();
    drawCharacter(g, key, danceSpec(plan, beat, k, key), W / 2, 1050, 1.32, charOpts(t, k));
    nameTag(key, 260, 160, ((beat - b0) % 2) * plan.spb, true);
  },
  end(t, beat, en, sh) {
    background(t, beat, en);
    lineup(t, beat, { scale: 0.86, feetY: 1000, spread: 360, idol: true });
    const lt = t - sh.start;
    popTitle('THANK YOU!', W / 2, 190, 150, lt, 0.2);
    pill(`♪ ${plan.song.title}`, W / 2, 340, lt, 0.9, plan.story.pal.accent2);
    const names = plan.story.cast.map((k) => CAST[k].zh).join(' · ');
    g.save(); g.globalAlpha = clamp((lt - 1.4) / 0.5);
    g.font = `700 30px ${FONT.sub}`; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.letterSpacing = '4px';
    g.fillText(`CAST  ${names}`, W / 2, 420); g.restore(); g.letterSpacing = '0px'; g.textAlign = 'left';
    const fade = clamp((t - (plan.dur - 1.4)) / 1.2);
    if (fade > 0) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, W, H); }
  },
};

function splitTitle(title) {
  const ch = [...title];
  const sp = title.indexOf(' ');
  if (sp > 2 && sp < title.length - 2) return [title.slice(0, sp), title.slice(sp + 1)];
  const half = Math.ceil(ch.length / 2);
  return [ch.slice(0, half).join(''), ch.slice(half).join('')];
}

function speedLines(t, col, x0 = 0, w = W) {
  g.save(); g.globalAlpha = 0.16; g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    const y = frac(hash(i * 2.3) + t * (0.2 + 0.3 * hash(i))) * (H + 200) - 100;
    const x = x0 + hash(i * 5.1) * w;
    g.lineWidth = 3 + 10 * hash(i * 7);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 60, y + 260); g.stroke();
  }
  g.restore();
}

function tornRect(x, y, w, h, seed) {
  g.beginPath();
  const N = 40;
  g.moveTo(x, y);
  for (let i = 0; i <= N; i++) { const u = i / N; g.lineTo(x + w + 10 * (hash(seed + i) - 0.5) + 4 * Math.sin(u * 30 + seed), y + u * h); }
  for (let i = N; i >= 0; i--) { const u = i / N; g.lineTo(x + 10 * (hash(seed * 3 + i) - 0.5) + 4 * Math.sin(u * 27 + seed), y + u * h); }
  g.closePath();
}

// big vertical name, MV-style, plus the romanised name and a colour bar
function nameTag(key, x, y, lt, left = false) {
  const c = CAST[key], u = easeOut(lt / 0.4);
  g.save(); g.globalAlpha = clamp(u); g.translate((1 - u) * (left ? -60 : 60), 0);
  const zh = [...c.zh], size = zh.length > 3 ? 150 : 190;
  g.font = `400 ${size}px ${FONT.display}`; g.textAlign = 'center'; g.textBaseline = 'top';
  zh.forEach((ch, k) => {
    g.fillStyle = c.color; g.fillText(ch, x + 8, y + k * size * 1.02 + 8);
    outlined(ch, x, y + k * size * 1.02, '#ffffff', INK, 14);
  });
  g.save(); g.translate(x + (left ? 1 : -1) * size * 0.72, y); g.rotate(Math.PI / 2);
  g.font = `700 34px ${FONT.mono}`; g.textAlign = 'left'; g.letterSpacing = '10px';
  g.fillStyle = '#ffffff'; g.fillText(c.name.replace(/^[^A-Za-z]+/, '').toUpperCase(), 0, 0); g.letterSpacing = '0px';
  g.restore();
  g.fillStyle = c.color; g.fillRect(x - size * 0.5, y + zh.length * size * 1.02 + 20, size, 10);
  g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

// desktop-pet window (title bar + bust)
function petWindow(t, beat, key, s, lt) {
  if (lt <= 0) return;
  const c = CAST[key], u = easeBack(lt / 0.4);
  g.save();
  g.translate(s.x + s.w / 2, s.y + s.h / 2); g.scale(u, u); g.translate(-s.w / 2, -s.h / 2);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(14, 18, s.w, s.h, 26); g.fill();
  g.beginPath(); g.roundRect(0, 0, s.w, s.h, 26); g.fillStyle = mix(c.color, '#ffffff', 0.25); g.fill();
  g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  // content
  g.save(); g.beginPath(); g.roundRect(14, 66, s.w - 28, s.h - 80, 16); g.clip();
  const gr = g.createLinearGradient(0, 66, 0, s.h);
  gr.addColorStop(0, mix(c.color, '#ffffff', 0.82)); gr.addColorStop(1, mix(c.color, '#ffffff', 0.45));
  g.fillStyle = gr; g.fillRect(0, 0, s.w, s.h);
  for (let i = 0; i < 8; i++) star(40 + hash(i + s.x) * (s.w - 80), 90 + hash(i * 3 + s.y) * (s.h - 120), 6 + 8 * hash(i * 5), '#ffffff', 0.9);
  bust(t, beat, key, s.w / 2, s.h * 0.6, s.h / 230);
  g.restore();
  g.beginPath(); g.roundRect(14, 66, s.w - 28, s.h - 80, 16); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  // title bar
  g.font = `900 34px ${FONT.title}`; g.textBaseline = 'middle'; g.fillStyle = INK;
  g.beginPath(); g.arc(40, 34, 15, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.arc(40, 34, 6, 0, Math.PI * 2); g.fillStyle = c.color; g.fill();
  g.fillStyle = INK; g.fillText(`${c.zh}.pet`, 66, 36);
  g.font = `700 18px ${FONT.mono}`; g.letterSpacing = '6px'; g.textAlign = 'right';
  g.fillText(c.name.replace(/^[^A-Za-z]+/, '').toUpperCase(), s.w - 140, 36); g.letterSpacing = '0px'; g.textAlign = 'left';
  for (let k = 0; k < 3; k++) {
    const bx = s.w - 104 + k * 34;
    g.beginPath(); g.arc(bx, 34, 12, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 3; g.stroke();
    g.beginPath();
    if (k === 0) { g.moveTo(bx - 5, 34); g.lineTo(bx + 5, 34); }
    else if (k === 1) g.arc(bx, 34, 4, 0, Math.PI * 2);
    else { g.moveTo(bx - 4, 30); g.lineTo(bx + 4, 38); g.moveTo(bx + 4, 30); g.lineTo(bx - 4, 38); }
    g.lineWidth = 2.5; g.stroke();
  }
  g.restore();
}

function head(t, sh, label, alpha = 1) {
  g.save(); g.globalAlpha = alpha;
  g.font = `700 22px ${FONT.mono}`; g.fillStyle = '#ffffff'; g.letterSpacing = '6px';
  g.fillText(label, 78, 92); g.letterSpacing = '0px';
  g.restore();
}

function hud(t, beat) {
  const sh = plan.shotAt(t);
  if (sh.type === 'title' || sh.type === 'end') return;
  g.save();
  g.font = `900 30px ${FONT.sub}`; g.fillStyle = '#ffffff'; g.globalAlpha = 0.92;
  g.fillText(plan.song.title, 80, 100);
  g.font = `600 20px ${FONT.mono}`; g.letterSpacing = '5px'; g.fillStyle = plan.story.pal.accent;
  const b = Math.max(0, beat);
  g.fillText(`${plan.kindLabel(t)} · BAR ${String(Math.floor(b / 4) + 1).padStart(3, '0')} · ${'●'.repeat(Math.floor(b) % 4 + 1)}${'○'.repeat(3 - Math.floor(b) % 4)}`, 80, 134);
  g.restore(); g.letterSpacing = '0px';
}

function subtitle(t) {
  const sh = plan.shotAt(t);
  if (sh.type === 'lyric' || sh.type === 'title' && t < 3) return;
  const l = plan.lineAt(t);
  if (!l) return;
  const end = l.t + Math.max(l.d, 1.2) + 0.6;
  const a = clamp((t - l.t) / 0.15) * clamp((end - t) / 0.2);
  const size = fitFont(l.text, 700, FONT.sub, 46, 1500);
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${size}px ${FONT.sub}`;
  g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 12;
  outlined(l.text, W / 2, H - 76, '#ffffff', 'rgba(10,0,6,0.85)', 8);
  g.restore();
}

// ---------- frame ----------
function render(t) {
  const beat = plan.beatAt(t), en = plan.energy(t);
  const sh = plan.shotAt(t);
  g.setTransform(viewScale, 0, 0, viewScale, 0, 0);
  g.save();
  // beat punch-in
  const acc = Math.exp(-7 * frac(beat)) * (sh.kind === 'chorus' || sh.kind === 'hook' ? 1 : 0.4);
  const z = 1 + 0.012 * acc * en;
  g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  SHOTS[sh.type](t, beat, en, sh);
  g.restore();
  // cut transition: flash + sliced glitch
  const cu = (t - sh.start) / 0.16;
  if (cu < 1 && sh.start > 0) {
    const bx = buf.getContext('2d');
    bx.setTransform(1, 0, 0, 1, 0, 0);
    bx.drawImage(cv, 0, 0);
    const s = viewScale;
    for (let k = 0; k < 9; k++) {
      const y = Math.floor(hash(k + sh.start) * H), h = 20 + hash(k * 3 + sh.start) * 90;
      g.drawImage(buf, 0, y * s, W * s, h * s, (hash(k * 7 + sh.start) - 0.5) * 140 * (1 - cu), y, W, h);
    }
    g.fillStyle = `rgba(255,255,255,${0.5 * (1 - cu)})`; g.fillRect(0, 0, W, H);
  }
  hud(t, beat);
  subtitle(t);
  g.drawImage(frame, 0, 0);
}

// ---------- loading ----------
async function load(id, dur) {
  plan = buildPlan(id, { dur });
  plan.seed = (ORDER.indexOf(id) - 1) * 31 + 7; // −1: keep the seeds the 9 file songs had before 'ii' was listed first
  frame = tornFrame(plan.seed);
  DOTS ||= halftone();
  const sample = plan.song.title + plan.song.tagline + plan.song.lines.map((l) => l.text).join('') + 'THANK YOU!';
  await Promise.all([
    document.fonts.load(`900 100px ${FONT.title}`, sample), document.fonts.load(`400 100px ${FONT.display}`, sample),
    document.fonts.load(`700 40px ${FONT.sub}`, sample), document.fonts.load(`900 40px ${FONT.sub}`, sample),
    document.fonts.load(`700 20px ${FONT.mono}`, 'A'),
  ]).catch(() => {});
}

// ---------- modes ----------
const songId = () => { const s = q.get('song'); return songInfo(s) ? s : ORDER[+s || 0]; };

async function renderMode() {
  document.body.classList.add('render');
  const id = songId();
  const post = (path, body) => fetch(`/__pv/${path}?job=${JOB}`, { method: 'POST', body });
  try {
    await load(id);
    if (!plan.song.audio) throw new Error(`${plan.song.title} 是 YouTube 串流，無法輸出 MP4`);
    const from = +(q.get('from') || 0), to = Math.min(plan.dur, +(q.get('to') || plan.dur));
    const frames = Math.ceil((to - from) * FPS);
    await post('meta', JSON.stringify({ id, title: plan.song.title, file: `${id} ${plan.song.title}`, audio: plan.song.audio, fps: FPS, frames, from, to, bpm: plan.song.bpm }));
    for (let f = 0; f < frames; f++) {
      render(from + f / FPS);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
      await post('frame', blob);
    }
    await post('done', '');
  } catch (err) {
    await post('error', String(err?.stack || err));
  }
}

async function snapMode() {
  try {
    await load(songId());
    render(+(q.get('t') || 0));
    cv.toBlob((b) => fetch('/__snap', { method: 'POST', body: b }), 'image/jpeg', 0.9);
  } catch (err) { fetch('/__snap?error=1', { method: 'POST', body: String(err?.stack || err) }); }
}

// live player — a local MP3, or the YouTube player as the clock
const audio = new Audio();
audio.preload = 'metadata';
audio.playsInline = true;
let yt = null, current = null, raf = 0, idleTimer = 0;
const coarsePointer = matchMedia('(pointer: coarse)').matches;
const isYT = () => !!plan?.song.yt;
const clock = {
  time: (dt) => (isYT() ? yt?.time(dt) || 0 : audio.currentTime || 0),
  get paused() { return isYT() ? !yt?.playing : audio.paused; },
  play() { if (isYT()) yt?.play(); else audio.play().catch(() => {}); },
  pause() { audio.pause(); yt?.pause(); },
  seek(t) { if (isYT()) yt?.seek(t); else audio.currentTime = t; },
};
function menu(show) {
  $('menu').hidden = !show;
  if (show) { clock.pause(); syncUI(); }
}
async function play(id, autoplay = true) {
  current = id;
  clock.pause();
  $('msg').textContent = '載入中…';
  await load(id);
  history.replaceState(null, '', `?song=${id}`);
  menu(false);
  $('ytBox').hidden = !isYT();
  $('ytBox').classList.remove('show');
  $('ytPeek').hidden = !isYT() || !isCompact();
  $('ytPeek').textContent = '原片';
  if (isYT()) {
    audio.removeAttribute('src');
    yt ||= new YouTubeSource('ytPlayer', {
      onState: (s) => { if (s === 0 && current === id) step(1); syncUI(); },
      onError: (m) => { $('msg').textContent = m; },
    });
    try { await yt.load(plan.song.yt); $('msg').textContent = ''; } catch (err) { $('msg').textContent = err.message; }
    if (autoplay) yt.play();
  } else {
    $('msg').textContent = '';
    audio.src = plan.song.audio;
    audio.currentTime = 0;
    if (autoplay) clock.play();
  }
  syncUI();
  placeChrome();
  fitCanvas();
  cancelAnimationFrame(raf);
  let last = performance.now();
  const loop = (now = performance.now()) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    // the YouTube duration is only known once the video is cued: re-plan to fit it
    const d = isYT() ? yt?.player?.getDuration?.() || 0 : 0;
    if (d > 30 && Math.abs(d - plan.dur) > 1) { const { seed } = plan; plan = buildPlan(current, { dur: d }); plan.seed = seed; }
    const t = clock.time(dt);
    render(clock.paused && t < 0.05 ? 4 : t); // paused at the start: show the title card as a poster
    syncUI();
    raf = requestAnimationFrame(loop);
  };
  loop();
}
function syncUI() {
  if (!plan) return;
  const t = clock.time(0);
  $('play').textContent = clock.paused ? '▶ 播放' : '❚❚ 暫停';
  $('time').textContent = `${fmt(t)} / ${fmt(plan.dur)}`;
  if (document.activeElement !== $('seek')) $('seek').value = String((t / plan.dur) * 1000);
  $('nowTitle').textContent = plan.song.title;
}
function step(d) { const i = (ORDER.indexOf(current) + d + ORDER.length) % ORDER.length; play(ORDER[i]); }

function liveMode() {
  const list = $('list');
  ORDER.forEach((id, n) => {
    const s = songInfo(id), st = STORY[id];
    const b = document.createElement('button');
    b.style.setProperty('--c', st.pal.center); b.style.setProperty('--e', st.pal.edge); b.style.setProperty('--a', st.pal.accent);
    const meta = s.yt ? `YouTube · ${s.bpm} BPM · 預設` : `${fmt(s.dur)} · ${Math.round(s.bpm)} BPM`;
    b.innerHTML = `<small>PV ${String(n).padStart(2, '0')} · ${meta}</small><strong></strong><span></span><em></em>`;
    b.querySelector('strong').textContent = s.title;
    b.querySelector('span').textContent = s.tagline;
    b.querySelector('em').textContent = st.cast.map((k) => CAST[k].zh).join(' · ');
    b.onclick = () => play(id);
    list.appendChild(b);
  });
  $('play').onclick = () => { if (!plan) return; clock.paused ? clock.play() : clock.pause(); syncUI(); };
  $('seek').oninput = (e) => { if (plan) clock.seek((+e.target.value / 1000) * plan.dur); };
  $('prev').onclick = () => step(-1);
  $('next').onclick = () => step(1);
  $('toMenu').onclick = () => menu(true);
  $('full').onclick = () => {
    const el = document.documentElement;
    if (document.fullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };
  $('ytPeek').onclick = () => {
    const on = $('ytBox').classList.toggle('show');
    $('ytPeek').textContent = on ? '隱藏' : '原片';
  };
  audio.onended = () => step(1);
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || !plan) return;
    if (e.code === 'Space') { e.preventDefault(); $('play').click(); }
    else if (e.code === 'ArrowRight') clock.seek(Math.min(plan.dur, clock.time(0) + 5));
    else if (e.code === 'ArrowLeft') clock.seek(Math.max(0, clock.time(0) - 5));
    else if (e.code === 'Escape') menu(true);
    else if (e.key === 'n' || e.key === 'N') step(1);
    else if (e.key === 'p' || e.key === 'P') step(-1);
    else if (e.key === 'f' || e.key === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  });
  const pokeUI = () => { $('ui').classList.remove('idle'); clearTimeout(idleTimer); if (!coarsePointer) idleTimer = setTimeout(() => !clock.paused && $('ui').classList.add('idle'), 2500); };
  addEventListener('mousemove', pokeUI);
  addEventListener('pointerdown', pokeUI);
  if (coarsePointer) cv.addEventListener('click', () => { if ($('menu').hidden && plan) $('play').click(); });
  const refit = () => { placeChrome(); fitCanvas(); };
  addEventListener('resize', refit);
  visualViewport?.addEventListener('resize', refit);
  refit();
  // default song: INSIDE IDENTITY from YouTube, paused on the title card
  const s = q.get('song');
  play(s && songInfo(s) ? s : ORDER[0], false);
}

if (RENDER) renderMode();
else if (SNAP) snapMode();
else liveMode();
