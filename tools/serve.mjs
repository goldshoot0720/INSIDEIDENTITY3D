#!/usr/bin/env node
// Static file server for the project (with HTTP Range so the PV audio can be scrubbed).
// Usage: node tools/serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.fbx': 'application/octet-stream', '.svg': 'image/svg+xml',
};

// serve a file under ROOT; returns false when the path is not a file there
export function serveFile(req, res, pathname) {
  const file = path.join(ROOT, decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  const size = fs.statSync(file).size, type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m) {
    const start = m[1] ? +m[1] : size - +m[2], end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size, 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  }
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = +(process.argv[2] || 5173);
  http.createServer((req, res) => {
    if (!serveFile(req, res, new URL(req.url, 'http://x').pathname)) res.writeHead(404).end('not found');
  }).listen(port, () => console.log(`http://localhost:${port}`));
}
