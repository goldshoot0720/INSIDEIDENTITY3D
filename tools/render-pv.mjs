#!/usr/bin/env node
// Render pv.html frame by frame to MP4: headless Chrome draws each frame and POSTs a JPEG,
// ffmpeg encodes them and muxes the song audio.
// Usage: node tools/render-pv.mjs [s023 s024 …] [--from 秒] [--to 秒] [--out 資料夾] [--jobs 3]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, serveFile } from './serve.mjs';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf('--' + n); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const from = opt('from'), to = opt('to'), outDir = path.resolve(ROOT, opt('out') || 'pv'), jobs = +(opt('jobs') || 3);
const ALL = ['s023', 's024', 's026', 's027', 's028', 's029', 's062', 's101', 's102'];
const songs = args.length ? args : ALL;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(outDir, { recursive: true });
const live = new Map();
const body = (req) => new Promise((ok, no) => { const p = []; req.on('data', (d) => p.push(d)); req.on('end', () => ok(Buffer.concat(p))); req.on('error', no); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/__pv/')) {
    const job = live.get(url.searchParams.get('job')), b = await body(req), action = url.pathname.slice(6);
    if (!job) return res.writeHead(404).end();
    try {
      if (action === 'meta') job.start(JSON.parse(b));
      else if (action === 'frame') await job.frame(b);
      else if (action === 'done') job.finish();
      else if (action === 'error') job.fail(new Error(b.toString()));
      res.writeHead(204).end();
    } catch (e) { res.writeHead(500).end(String(e)); job.fail(e); }
    return;
  }
  if (!serveFile(req, res, url.pathname)) res.writeHead(404).end();
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const PORT = server.address().port;

function run(id) {
  return new Promise((resolve, reject) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pv-chrome-'));
    const q = new URLSearchParams({ song: id, render: 1, job: id });
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    let ff = null, meta = null, n = 0, done = false, t0 = Date.now(), last = 0, out = '';
    const chrome = spawn(CHROME, ['--headless=new', `--user-data-dir=${profile}`, '--no-first-run', '--mute-audio', '--hide-scrollbars',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=1920,1080',
      `http://127.0.0.1:${PORT}/pv.html?${q}`], { stdio: 'ignore' });
    const cleanup = () => { try { chrome.kill(); } catch {} setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 1500); };
    const job = {
      start(m) {
        meta = m;
        out = path.join(outDir, `${m.file} PV${from || to ? ` (${m.from.toFixed(0)}-${m.to.toFixed(0)}s)` : ''}.mp4`);
        const cut = from || to ? ['-ss', String(m.from), '-t', String(m.to - m.from)] : [];
        ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(m.fps), '-c:v', 'mjpeg', '-i', 'pipe:0',
          ...cut, '-i', path.join(ROOT, m.audio), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
          '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
        ff.on('exit', (code) => {
          cleanup();
          if (code === 0 && done) { console.log(`✔ ${path.relative(ROOT, out)}  (${n} 格，${((Date.now() - t0) / 1000).toFixed(0)} 秒)`); resolve(out); }
          else reject(new Error(`ffmpeg 結束碼 ${code}（${m.title}）`));
        });
        console.log(`▶ ${m.title}  ${m.frames} 格`);
      },
      frame(b) {
        n++;
        if (Date.now() - last > 15000) { last = Date.now(); console.log(`  ${meta.title}: ${(n / meta.frames * 100).toFixed(1)}%`); }
        return ff.stdin.write(b) ? null : new Promise((ok) => ff.stdin.once('drain', ok));
      },
      finish() { done = true; ff.stdin.end(); },
      fail(e) { if (done) return; done = true; console.error(`✘ ${id}：${e.message}`); try { ff?.stdin.destroy(); ff?.kill(); } catch {} cleanup(); reject(e); },
    };
    live.set(id, job);
    chrome.on('exit', () => { if (!done) job.fail(new Error('Chrome 提早結束')); });
  });
}

// a few songs at a time
const queue = [...songs], results = [];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  while (queue.length) { const id = queue.shift(); results.push(await run(id).then(() => true, () => false)); }
}));
server.close();
process.exit(results.every(Boolean) ? 0 : 1);
