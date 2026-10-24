#!/usr/bin/env node
// Pipeline completo de un reel: voz → vídeo → sonido → MP4 final listo para Instagram.
//
//   node tools/make.mjs reels/<id>            todo
//   node tools/make.mjs reels/<id> --skip-voice   reutiliza la voz ya generada
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PY = existsSync(path.join(ROOT, '.venv/bin/python')) ? path.join(ROOT, '.venv/bin/python') : 'python3';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    if (opts.capture) process.stderr.write(r.stderr || '');
    throw new Error(`${cmd} ${args.join(' ')} → código ${r.status}`);
  }
  return r;
}

async function main() {
  const argv = process.argv.slice(2);
  const reelDir = argv.find((a) => !a.startsWith('--'));
  if (!reelDir) { console.error('Uso: node tools/make.mjs reels/<id> [--skip-voice] [--workers n]'); process.exit(1); }
  const reel = path.relative(ROOT, path.resolve(reelDir));
  const spec = JSON.parse(readFileSync(path.join(ROOT, reel, 'reel.json'), 'utf8'));
  const build = path.join(ROOT, reel, 'build');
  const outDir = path.join(ROOT, reel, 'out');
  mkdirSync(outDir, { recursive: true });
  const wi = argv.indexOf('--workers');

  console.log('① Voz');
  if (!argv.includes('--skip-voice')) run(PY, ['tools/voice.py', reel]);

  console.log('② Vídeo');
  await render(reel, { workers: wi > -1 ? argv[wi + 1] : undefined });

  console.log('③ Sonido');
  run(PY, ['tools/audio.py', reel]);

  console.log('④ Master + export');
  const mix = path.join(build, 'mix.wav');
  const target = { I: -14, TP: -1.0, LRA: 11 };
  const pass1 = run('ffmpeg', ['-hide_banner', '-i', mix, '-af', `loudnorm=I=${target.I}:TP=${target.TP}:LRA=${target.LRA}:print_format=json`, '-f', 'null', '-'], { capture: true });
  const m = JSON.parse(pass1.stderr.slice(pass1.stderr.lastIndexOf('{')));
  const ln = `loudnorm=I=${target.I}:TP=${target.TP}:LRA=${target.LRA}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const out = path.join(outDir, `${spec.id || path.basename(reel)}.mp4`);
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-i', path.join(build, 'video.mp4'), '-i', mix,
    '-filter:a', `${ln},aresample=48000`, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
    '-movflags', '+faststart', '-shortest', out]);
  // Portada: el final del gancho (primera escena)
  const timing = JSON.parse(readFileSync(path.join(build, 'timing.json'), 'utf8'));
  const coverT = Math.max(0.5, timing.scenes[0].end - 0.05);
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(coverT), '-i', path.join(build, 'video.mp4'), '-frames:v', '1', '-q:v', '2', path.join(outDir, 'cover.jpg')]);
  console.log(`\n✔ ${path.relative(ROOT, out)}  (${timing.duration.toFixed(1)}s, ${target.I} LUFS)\n✔ ${path.relative(ROOT, path.join(outDir, 'cover.jpg'))}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
