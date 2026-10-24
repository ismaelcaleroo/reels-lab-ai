#!/usr/bin/env node
// Renderiza el vídeo (sin audio) de un reel, frame a frame, con Chromium headless.
//
//   node tools/render.mjs reels/<id>                 → build/video.mp4 + build/cues.json
//   node tools/render.mjs reels/<id> --stills 1,4.5  → build/stills/*.png (revisión rápida)
//   node tools/render.mjs reels/<id> --from 10 --to 20 --workers 3
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[k] = v;
    } else out._.push(a);
  }
  return out;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
};

/** Servidor estático mínimo sobre la raíz del repo (solo lectura, solo localhost). */
export function serve(port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file = path.resolve(ROOT, rel || 'engine/index.html');
      if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
      const data = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

async function openPage(browser, base, reel) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/engine/index.html?reel=${encodeURIComponent(reel)}&render`);
  await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 60000 });
  const state = await page.evaluate(() => document.body.dataset.ready);
  if (state !== '1') {
    const err = await page.evaluate(() => window.__reelError);
    throw new Error(`El runtime falló:\n${err}\n${errors.join('\n')}`);
  }
  return page;
}

function ffmpeg(argsList) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argsList], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg salió con código ${c}`)))));
  return { p, done };
}

async function renderChunk(page, { from, to, fps, out, quality }) {
  const { p, done } = ffmpeg([
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(quality), '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-r', String(fps), out,
  ]);
  for (let f = from; f < to; f++) {
    await page.evaluate((t) => window.__reel.seek(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95, animations: 'disabled', caret: 'hide' });
    if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r));
  }
  p.stdin.end();
  await done;
}

export async function render(reelDir, opts = {}) {
  const reel = path.relative(ROOT, path.resolve(reelDir)).split(path.sep).join('/');
  const build = path.join(ROOT, reel, 'build');
  if (!existsSync(path.join(build, 'timing.json'))) throw new Error(`Falta ${reel}/build/timing.json — genera antes la voz (npm run voice)`);
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
  try {
    const first = await openPage(browser, base, reel);
    const info = await first.evaluate(() => ({ duration: window.__reel.duration, fps: window.__reel.fps, cues: window.__reel.cues, warnings: window.__reel.warnings }));
    for (const w of info.warnings) console.warn('⚠', w);
    await writeFile(path.join(build, 'cues.json'), JSON.stringify(info.cues, null, 1));

    if (opts.stills) {
      const dir = path.join(build, 'stills');
      await mkdir(dir, { recursive: true });
      for (const t of String(opts.stills).split(',').map(Number)) {
        await first.evaluate((x) => window.__reel.seek(x), t);
        await first.screenshot({ path: path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`) });
      }
      console.log(`Stills → ${path.relative(ROOT, dir)}`);
      return { info };
    }

    const fps = info.fps;
    const total = Math.ceil(info.duration * fps);
    const from = Math.max(0, Math.floor((opts.from ? +opts.from : 0) * fps));
    const to = Math.min(total, Math.ceil((opts.to ? +opts.to : info.duration) * fps));
    const workers = Math.max(1, Math.min(+opts.workers || Math.max(1, os.cpus().length - 1), 6));
    const per = Math.ceil((to - from) / workers);
    const segDir = path.join(build, 'segments');
    await rm(segDir, { recursive: true, force: true });
    await mkdir(segDir, { recursive: true });
    const pages = [first];
    for (let k = 1; k < workers; k++) pages.push(await openPage(browser, base, reel));

    console.log(`Render ${reel}: ${to - from} frames @${fps}fps con ${workers} workers…`);
    const t0 = Date.now();
    const segs = [];
    await Promise.all(pages.map((page, k) => {
      const a = from + k * per, b = Math.min(to, a + per);
      if (a >= b) return null;
      const out = path.join(segDir, `seg${k}.mp4`);
      segs[k] = out;
      return renderChunk(page, { from: a, to: b, fps, out, quality: opts.crf || 16 });
    }));
    const list = segs.filter(Boolean).map((s) => `file '${s}'`).join('\n');
    await writeFile(path.join(segDir, 'list.txt'), list);
    const out = path.join(build, 'video.mp4');
    await ffmpeg(['-f', 'concat', '-safe', '0', '-i', path.join(segDir, 'list.txt'), '-c', 'copy', out]).done;
    await rm(segDir, { recursive: true, force: true });
    console.log(`Vídeo → ${path.relative(ROOT, out)} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    return { info, out };
  } finally {
    await browser.close();
    server.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = args(process.argv.slice(2));
  if (!a._[0]) { console.error('Uso: node tools/render.mjs reels/<id> [--stills 1,2.5] [--from s --to s] [--workers n]'); process.exit(1); }
  render(a._[0], a).catch((e) => { console.error(e.message || e); process.exit(1); });
}
