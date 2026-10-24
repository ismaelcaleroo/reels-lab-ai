// Reels Lab — runtime del navegador.
// Construye un único timeline de GSAP (pausado) a partir de reel.json + build/timing.json.
// El render lo controla desde fuera con window.__reel.seek(t), frame a frame, así que todo
// es determinista: nada depende del reloj real.
import { SCENES, CAPTION_DEFAULTS } from './scenes.js';

gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin, TextPlugin, CustomEase);

const params = new URLSearchParams(location.search);
const REEL = (params.get('reel') || '').replace(/^\/+|\/+$/g, '');
const RENDER = params.has('render');
document.body.classList.add(RENDER ? 'render' : 'preview');

const MOODS = {
  neutral: ['#2a2418', '#14202b'],
  dark: ['#171513', '#101112'],
  danger: ['#4a1510', '#2c0c0a'],
  calm: ['#0f2a40', '#0f2a26'],
  gold: ['#41320c', '#1f1a0a'],
  relief: ['#123326', '#1d2a18'],
  mystery: ['#25163d', '#0f1630'],
};

const $ = (s, r = document) => r.querySelector(s);
export const clean = (w) => w.toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9']/g, '');

async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
  return r.json();
}

function div(cls, html = '') {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  if (html) d.innerHTML = html;
  return d;
}

/** Ajusta el tamaño de fuente de cada .line para que no supere maxWidth. */
export function fitLines(container, base, maxWidth) {
  for (const line of container.querySelectorAll('.line, .fit')) {
    const size = parseFloat(line.dataset.size || base);
    line.style.fontSize = size + 'px';
    const w = line.scrollWidth;
    if (w > maxWidth) line.style.fontSize = Math.floor(size * maxWidth / w) + 'px';
  }
}

async function boot() {
  if (!REEL) throw new Error('Falta ?reel=reels/<id>');
  const [spec, timing] = await Promise.all([
    getJSON(`/${REEL}/reel.json`),
    getJSON(`/${REEL}/build/timing.json`),
  ]);
  const fps = spec.fps || 30;
  const duration = timing.duration;
  const stage = $('#stage');
  const world = $('#world');
  const warnings = [];
  const cues = [];

  // Tema: cualquier variable CSS se puede sobreescribir desde reel.json → theme
  for (const [k, v] of Object.entries(spec.theme || {})) {
    document.documentElement.style.setProperty(`--${k}`, v);
  }
  if (spec.brand?.handle) $('.handle').textContent = spec.brand.handle;

  await Promise.all([
    '900 100px "Inter Tight"', '800 100px "Inter Tight"', '700 100px "Inter Tight"',
    'italic 900 100px "Inter Tight"', 'italic 400 100px "Instrument Serif"', '400 100px "Instrument Serif"',
    '700 40px "JetBrains Mono"', '500 40px "JetBrains Mono"',
  ].map((f) => document.fonts.load(f)));
  await document.fonts.ready;

  const tl = gsap.timeline({ paused: true });
  const cue = (name, t, gain = 1) => { if (t >= 0 && t < duration) cues.push({ name, t: +t.toFixed(3), gain }); };

  // ── Ventanas de cada escena ──────────────────────────
  const T = timing.scenes;
  const bounds = T.map((s, i) => (i === 0 ? 0 : Math.max(0, s.start - 0.07)));
  bounds.push(duration);

  // ── Cámara y efectos globales ────────────────────────
  const camera = {
    punch(t, amt = 0.06) {
      tl.fromTo(world, { scale: 1 }, { scale: 1 + amt, duration: 0.07, ease: 'power2.out', immediateRender: false }, t);
      tl.to(world, { scale: 1, duration: 0.45, ease: 'power3.out' }, t + 0.07);
    },
    shake(t, amt = 14, dur = 0.35) {
      const n = 7;
      for (let k = 0; k < n; k++) {
        const f = 1 - k / n;
        tl.to(world, { x: (k % 2 ? -1 : 1) * amt * f, y: ((k * 7) % 3 - 1) * amt * 0.5 * f, duration: dur / n, ease: 'sine.inOut' }, t + (k * dur) / n);
      }
      tl.to(world, { x: 0, y: 0, duration: 0.06 }, t + dur);
    },
    flash(t, amt = 0.55) {
      tl.fromTo('#flash', { opacity: amt }, { opacity: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, t);
    },
    mood(name, t, dur = 0.6) {
      const m = MOODS[name] || MOODS.neutral;
      tl.to(document.documentElement, { '--aura': m[0], '--aura-2': m[1], duration: dur, ease: 'sine.inOut' }, t);
    },
  };
  gsap.set(document.documentElement, { '--aura': MOODS.neutral[0], '--aura-2': MOODS.neutral[1] });

  // Fondo vivo: deriva lenta de las auras y de la retícula
  tl.fromTo('#bg .aura', { x: -60, y: 0 }, { x: 80, y: 60, duration, ease: 'sine.inOut' }, 0);
  tl.fromTo('#bg .aura.a2', { x: 60, y: 0 }, { x: -90, y: -50, duration, ease: 'sine.inOut' }, 0);
  tl.fromTo('#bg .dots', { backgroundPosition: '0px 0px' }, { backgroundPosition: `0px ${-Math.round(duration * 14)}px`, duration, ease: 'none' }, 0);
  if (spec.brand?.progress) {
    $('#hud').append(div('progress'));
    tl.fromTo('.progress', { scaleX: 0 }, { scaleX: 1, duration, ease: 'none' }, 0);
  }

  // ── Escenas ──────────────────────────────────────────
  const captionPlan = [];
  spec.scenes.forEach((sc, i) => {
    const type = sc.type || 'statement';
    const impl = SCENES[type];
    if (!impl) throw new Error(`Escena ${i}: tipo desconocido "${type}"`);
    const el = div(`scene scene-${type}`);
    const inner = div('layer inner');
    el.append(inner);
    world.append(el);
    const s = T[i] || { start: bounds[i], end: bounds[i + 1], words: [] };
    const words = s.words || [];

    // Busca una palabra hablada: "lazy", "caring#2" (2ª aparición), con edge start|end
    const at = (ref, { edge = 'start', fallback } = {}) => {
      if (typeof ref === 'number') return s.start + ref;
      if (!ref) return fallback ?? s.start;
      const [w, nth] = String(ref).split('#');
      const target = clean(w);
      let n = parseInt(nth || '1', 10);
      for (const wd of words) {
        if (wd.clean === target && --n === 0) return edge === 'end' ? wd.end : wd.start;
      }
      warnings.push(`Escena ${i}: no encuentro la palabra "${ref}" en la locución`);
      return fallback ?? s.start;
    };
    // Emparejador secuencial para texto en pantalla sincronizado con la voz
    const matcher = () => {
      let cursor = 0;
      return (target) => {
        for (let k = cursor; k < words.length; k++) {
          if (words[k].clean === target) { cursor = k + 1; return words[k]; }
        }
        return null;
      };
    };

    const ctx = {
      tl, spec, sc, i, el, inner, words, at, matcher, cue, camera, div, fitLines,
      t0: bounds[i], t1: bounds[i + 1], vs: s.start, ve: s.end, fps,
      warn: (m) => warnings.push(`Escena ${i}: ${m}`),
    };

    // Visibilidad + transiciones
    if (i === 0) gsap.set(el, { visibility: 'visible' });
    else tl.set(el, { visibility: 'visible' }, ctx.t0);
    if (i < spec.scenes.length - 1) tl.set(el, { visibility: 'hidden' }, ctx.t1 + 0.26);
    transitionIn(ctx, sc.transition || (i === 0 ? 'intro' : DEFAULT_TRANSITIONS[i % DEFAULT_TRANSITIONS.length]));
    if (i < spec.scenes.length - 1) {
      const nextT = spec.scenes[i + 1].transition || DEFAULT_TRANSITIONS[(i + 1) % DEFAULT_TRANSITIONS.length];
      transitionOut(ctx, nextT);
    }
    // Empuje lento de cámara dentro de la escena
    tl.fromTo(inner, { scale: 1 }, { scale: 1.04, duration: ctx.t1 - ctx.t0 + 0.3, ease: 'none' }, ctx.t0);

    if (sc.mood) camera.mood(sc.mood, ctx.t0);
    for (const m of sc.moods || []) camera.mood(m.mood, at(m.at));
    for (const p of sc.punch || []) { const t = at(p); camera.punch(t); cue('hit', t, 0.8); }
    for (const p of sc.shake || []) { const t = at(p); camera.shake(t); }
    for (const p of sc.flash || []) { const t = at(p); camera.flash(t); }
    if (sc.riser) cue('riser', Math.max(0, ctx.vs - 1.4), 0.7);
    if (sc.source) showSource(ctx, sc.source);

    impl(ctx);

    const capMode = sc.captions ?? CAPTION_DEFAULTS[type] ?? true;
    if (capMode) {
      const from = typeof capMode === 'object' && capMode.from ? at(capMode.from) - 0.001 : -1;
      captionPlan.push({ words: words.filter((w) => w.start >= from), end: ctx.t1, emphasis: (sc.emphasis || []).map(clean) });
    }
  });

  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
  buildCaptions(tl, captionPlan, accent, ink);

  // ── Grano de película (determinista) ─────────────────
  const grain = $('#grain');
  const g = grain.getContext('2d');
  grain.width = 540; grain.height = 960;
  const noise = [];
  let seed = 1337;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let f = 0; f < 6; f++) {
    const img = g.createImageData(540, 960);
    for (let p = 0; p < img.data.length; p += 4) {
      const v = (rnd() * 255) | 0;
      img.data[p] = img.data[p + 1] = img.data[p + 2] = v; img.data[p + 3] = 255;
    }
    noise.push(img);
  }
  let lastGrain = -1;
  const drawGrain = (t) => {
    const idx = Math.floor((t * fps) / 2) % noise.length;
    if (idx !== lastGrain) { g.putImageData(noise[idx], 0, 0); lastGrain = idx; }
  };

  const seek = (t) => {
    tl.time(Math.min(Math.max(0, t), duration), false);
    drawGrain(t);
  };
  seek(0);

  window.__reel = { duration, fps, cues: cues.sort((a, b) => a.t - b.t), warnings, seek, width: 1080, height: 1920 };
  if (warnings.length) console.warn(warnings.join('\n'));
  if (!RENDER) setupPreview(spec, duration, seek);
  document.body.dataset.ready = '1';
}

// ── Transiciones ───────────────────────────────────────
const DEFAULT_TRANSITIONS = ['whip', 'zoom', 'slide', 'whip', 'zoom'];

function transitionIn(ctx, kind) {
  const { tl, el, t0, cue, camera } = ctx;
  const b = t0;
  switch (kind) {
    case 'intro':
      tl.fromTo(el, { scale: 1.12, opacity: 0, filter: 'blur(16px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.45, ease: 'expo.out' }, b);
      break;
    case 'whip':
      tl.fromTo(el, { y: 320, filter: 'blur(18px)', opacity: 0 }, { y: 0, filter: 'blur(0px)', opacity: 1, duration: 0.26, ease: 'expo.out', immediateRender: false }, b);
      break;
    case 'zoom':
      tl.fromTo(el, { scale: 0.7, opacity: 0, filter: 'blur(12px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.3, ease: 'expo.out', immediateRender: false }, b);
      break;
    case 'slide':
      tl.fromTo(el, { x: 1080 }, { x: 0, duration: 0.34, ease: 'expo.out', immediateRender: false }, b);
      break;
    case 'flash':
      camera.flash(b, 0.7); cue('hit', b, 0.9);
      tl.fromTo(el, { scale: 1.06 }, { scale: 1, duration: 0.35, ease: 'power3.out', immediateRender: false }, b);
      break;
    case 'cut':
    default:
      tl.fromTo(el, { scale: 1.05 }, { scale: 1, duration: 0.3, ease: 'power3.out', immediateRender: false }, b);
      cue('tick', b, 0.6);
  }
}

function transitionOut(ctx, nextKind) {
  const { tl, el, t1, cue } = ctx;
  const b = t1;
  switch (nextKind) {
    case 'whip':
      tl.to(el, { y: -300, filter: 'blur(18px)', opacity: 0, duration: 0.16, ease: 'power2.in' }, b - 0.16);
      cue('whoosh', b - 0.2, 0.8);
      break;
    case 'zoom':
      tl.to(el, { scale: 1.45, opacity: 0, filter: 'blur(12px)', duration: 0.17, ease: 'power2.in' }, b - 0.17);
      cue('whoosh', b - 0.2, 0.75);
      break;
    case 'slide':
      tl.to(el, { x: -1080, duration: 0.2, ease: 'power3.in' }, b - 0.2);
      cue('whoosh', b - 0.22, 0.75);
      break;
    default:
      tl.to(el, { opacity: 0, duration: 0.01 }, b);
  }
}

// ── Fuente científica en pantalla ──────────────────────
function showSource(ctx, text) {
  const { tl, div, vs, t1 } = ctx;
  const pill = div('source', `<b>SOURCE</b>${text}`);
  document.querySelector('#hud').append(pill);
  tl.fromTo(pill, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, vs + 0.15);
  tl.to(pill, { autoAlpha: 0, duration: 0.15 }, t1 - 0.15);
}

// ── Subtítulos palabra a palabra ───────────────────────
function buildCaptions(tl, plan, accent, ink) {
  const host = document.querySelector('#captions');
  for (const { words, end, emphasis } of plan) {
    const phrases = [];
    let cur = [];
    for (const w of words) {
      cur.push(w);
      const chars = cur.reduce((n, x) => n + x.text.length + 1, 0);
      if (cur.length >= 3 || chars > 17 || /[.,!?:;…]$/.test(w.text)) { phrases.push(cur); cur = []; }
    }
    if (cur.length) phrases.push(cur);
    phrases.forEach((ph, k) => {
      const el = document.createElement('div');
      el.className = 'cap';
      ph.forEach((w) => {
        const s = document.createElement('span');
        s.className = 'cw' + (emphasis.includes(w.clean) ? ' em' : '');
        s.textContent = w.text.replace(/[,;:]$/, '');
        el.append(s);
      });
      host.append(el);
      const tIn = ph[0].start - 0.03;
      const next = phrases[k + 1];
      const tOut = Math.min(next ? next[0].start - 0.03 : ph[ph.length - 1].end + 0.35, end - 0.02);
      tl.set(el, { visibility: 'visible' }, tIn);
      tl.fromTo(el, { scale: 0.92, y: 18 }, { scale: 1, y: 0, duration: 0.14, ease: 'back.out(2)', immediateRender: false }, tIn);
      [...el.children].forEach((s, j) => {
        const w = ph[j];
        tl.fromTo(s, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out', immediateRender: false }, Math.max(tIn, w.start - 0.03));
        if (!s.classList.contains('em')) {
          tl.to(s, { color: accent, scale: 1.08, duration: 0.06 }, w.start - 0.02);
          tl.to(s, { color: ink, scale: 1, duration: 0.1 }, Math.max(w.end, w.start + 0.12));
        }
      });
      tl.set(el, { visibility: 'hidden' }, tOut);
    });
  }
  // Estado inicial: palabras ocultas hasta su momento
  gsap.set('.cap .cw', { opacity: 0 });
}

// ── Preview interactivo (solo en navegador, no en render) ──
async function setupPreview(spec, duration, seek) {
  const stage = document.querySelector('#stage');
  const fit = () => {
    const s = Math.min((innerHeight - 90) / 1920, (innerWidth - 40) / 1080);
    stage.style.transform = `scale(${s})`;
  };
  fit(); addEventListener('resize', fit);
  const mix = await fetch(`/${REEL}/build/mix.wav`, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
  const audio = new Audio(`/${REEL}/build/${mix ? 'mix' : 'voice'}.wav`);
  const c = document.querySelector('#controls');
  c.innerHTML = `<button id="pp">▶ Play</button><input type="range" min="0" max="${duration}" step="0.001" value="0"><span class="t">0.00 / ${duration.toFixed(2)}</span>`;
  const btn = c.querySelector('#pp'), range = c.querySelector('input'), label = c.querySelector('.t');
  const show = (t) => { seek(t); range.value = t; label.textContent = `${t.toFixed(2)} / ${duration.toFixed(2)}`; };
  btn.onclick = () => (audio.paused ? audio.play() : audio.pause());
  audio.onplay = () => (btn.textContent = '❚❚ Pause');
  audio.onpause = () => (btn.textContent = '▶ Play');
  range.oninput = () => { audio.currentTime = +range.value; show(+range.value); };
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); btn.click(); } });
  const loop = () => { if (!audio.paused) show(audio.currentTime); requestAnimationFrame(loop); };
  loop();
  const t = parseFloat(params.get('t'));
  if (!Number.isNaN(t)) { audio.currentTime = t; show(t); }
}

boot().catch((e) => {
  console.error(e);
  window.__reelError = String(e && e.stack || e);
  document.body.dataset.ready = 'error';
});
