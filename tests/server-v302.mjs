import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = normalize(new URL('..', import.meta.url).pathname);
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.m3u8':'application/vnd.apple.mpegurl',
  '.m4s':'video/iso.segment', '.mp4':'video/mp4', '.avif':'image/avif', '.webp':'image/webp', '.jpg':'image/jpeg',
  '.png':'image/png', '.svg':'image/svg+xml', '.vtt':'text/vtt'
};

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (pathname === '/') pathname = '/index.html';
  const file = normalize(join(root, pathname.replace(/^\/+/, '')));
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404).end('Introuvable'); return; }
  const st = statSync(file);
  if (!st.isFile()) { res.writeHead(404).end('Introuvable'); return; }
  const type = mime[extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');
  if (range) {
    const m = /^bytes=(\d+)-(\d*)$/i.exec(range);
    if (!m) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }).end(); return; }
    const start = Number(m[1]);
    const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
    if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }).end(); return; }
    res.writeHead(206, { 'Content-Type': type, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${st.size}` });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size });
  createReadStream(file).pipe(res);
}).listen(port, '0.0.0.0', () => console.log(`STI v302 test server http://0.0.0.0:${port}`));
