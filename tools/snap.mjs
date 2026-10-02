#!/usr/bin/env node
// Dev helper: load a page in headless Chrome and save the JPEG it POSTs to /__snap.
// Pages post their canvas when opened with ?snap (see sheet.html / pv.html).
// Usage: node tools/snap.mjs "pv.html?song=0&t=30" out.jpg
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { serveFile } from './serve.mjs';

const [page, out = 'snap.jpg'] = process.argv.slice(2);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let chrome;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__snap') {
    const parts = [];
    req.on('data', (d) => parts.push(d));
    req.on('end', () => {
      res.writeHead(204).end();
      const body = Buffer.concat(parts);
      if (url.searchParams.get('error')) console.error('page error:', body.toString());
      else { fs.writeFileSync(out, body); console.log('saved', out, body.length); }
      chrome.kill(); server.close();
    });
    return;
  }
  if (!serveFile(req, res, url.pathname)) res.writeHead(404).end();
});
server.listen(0, '127.0.0.1', () => {
  const sep = page.includes('?') ? '&' : '?';
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
  chrome = spawn(CHROME, ['--headless=new', `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--window-size=1920,1080',
    '--autoplay-policy=no-user-gesture-required', '--mute-audio', `http://127.0.0.1:${server.address().port}/${page}${sep}snap=1`], { stdio: 'ignore' });
  setTimeout(() => { console.error('timeout'); chrome.kill(); process.exit(1); }, 60000).unref();
});
