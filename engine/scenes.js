// Librería de escenas. Cada escena recibe ctx (ver runtime.js) y añade sus
// animaciones al timeline en tiempo absoluto, sincronizadas con las palabras de la voz.
import { brainSVG, brainExpress, brainIdle, icon, drawIcon, personSVG, svgEl } from './art.js';

const cleanW = (w) => w.toLowerCase().replace(/’/g, "'").replace(/[^\p{L}\p{N}']/gu, '');

// ¿Qué escenas llevan subtítulos por defecto? (las que ya muestran el texto no)
export const CAPTION_DEFAULTS = {
  statement: false, step: false, versus: false, cta: false, loop: false,
  todo: true, mascot: true, phone: true, selves: true,
};

// ── Texto con marcado ──────────────────────────────────
// *texto*  serif itálica en color acento     ^texto^  rojo
// ~texto~  se puede tachar (fx strike)       _texto_  subrayador amarillo
// [[texto]] azul
const TOKEN = /(\*[^*]+\*|~[^~]+~|\^[^^]+\^|_[^_]+_|\[\[[^\]]+\]\]|\S+)/g;
function parseLine(line) {
  const out = [];
  for (const m of line.match(TOKEN) || []) {
    let cls = '', body = m;
    if (/^\*.*\*$/.test(m)) { cls = 'accent'; body = m.slice(1, -1); }
    else if (/^~.*~$/.test(m)) { cls = 'strikable'; body = m.slice(1, -1); }
    else if (/^\^.*\^$/.test(m)) { cls = 'hot'; body = m.slice(1, -1); }
    else if (/^_.*_$/.test(m)) { cls = 'mark'; body = m.slice(1, -1); }
    else if (/^\[\[.*\]\]$/.test(m)) { cls = 'cool'; body = m.slice(2, -2); }
    for (const w of body.split(/\s+/)) out.push({ text: w, cls });
  }
  return out;
}

/**
 * Bloque de texto cinético: cada palabra aparece cuando la voz la dice.
 * Devuelve {box, words:[{el, clean, t}]} para que otras escenas lo reutilicen.
 */
function kinetic(ctx, lines, { size = 150, maxWidth = 940, top = 130, height = 1280, kicker, align = 'center', revealStyle = 'slam' } = {}) {
  const { tl, inner, div, cue, camera, vs, t0 } = ctx;
  const box = div('statement');
  box.style.top = top + 'px';
  box.style.height = height + 'px';
  if (align === 'left') { box.style.alignItems = 'flex-start'; box.style.textAlign = 'left'; }
  let kick;
  if (kicker) { kick = div('kicker', kicker); box.append(kick); }
  const words = [];
  for (const line of lines) {
    const lineEl = div('line');
    if (typeof line === 'object' && line.size) lineEl.dataset.size = line.size;
    for (const tok of parseLine(typeof line === 'object' ? line.text : line)) {
      const s = document.createElement('span');
      s.className = 'w' + (tok.cls ? ' ' + tok.cls : '');
      s.textContent = tok.text;
      if (tok.cls === 'strikable') s.append(div('strike'));
      lineEl.append(s);
      words.push({ el: s, clean: cleanW(tok.text), cls: tok.cls });
    }
    box.append(lineEl);
  }
  inner.append(box);
  ctx.fitLines(box, size, maxWidth);

  const next = ctx.matcher();
  let last = vs - 0.08;
  if (kick) tl.fromTo(kick, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, Math.max(t0, vs - 0.15));
  for (const w of words) {
    const hit = w.clean ? next(w.clean) : null;
    const t = hit ? hit.start - 0.035 : last + 0.09;
    w.t = t; w.end = hit ? hit.end : t + 0.2;
    last = t;
    if (w.cls === 'accent') {
      tl.fromTo(w.el, { autoAlpha: 0, scale: 0.3, rotation: -8, y: 30 }, { autoAlpha: 1, scale: 1, rotation: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.6)' }, t);
      cue('pop', t, 0.75);
      camera.punch(t, 0.025);
    } else if (w.cls === 'mark') {
      tl.fromTo(w.el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power3.out' }, t);
      tl.fromTo(w.el, { '--mark': 0 }, { '--mark': 1, duration: 0.25, ease: 'power2.out' }, t + 0.05);
      cue('swipe', t, 0.5);
    } else if (revealStyle === 'rise') {
      tl.fromTo(w.el, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'expo.out' }, t);
    } else {
      tl.fromTo(w.el, { autoAlpha: 0, y: 46, scale: 1.35, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.24, ease: 'back.out(1.7)' }, t);
      cue('tick', t, 0.22);
    }
  }
  return { box, words };
}

/** Efectos sobre palabras ya mostradas: strike, shrink, shake, glow, grow. */
function applyFx(ctx, words, fx = []) {
  const { tl, at, cue, camera } = ctx;
  for (const f of fx) {
    const t = at(f.at, { edge: f.edge || 'start' });
    const targets = words.filter((w) => [].concat(f.target).map(cleanW).includes(w.clean)).map((w) => w.el);
    if (!targets.length) { ctx.warn(`fx: no hay palabra "${f.target}" en pantalla`); continue; }
    switch (f.do) {
      case 'strike':
        tl.to(targets.map((e) => e.querySelector('.strike')).filter(Boolean), { scaleX: 1, duration: 0.2, ease: 'power3.out' }, t);
        tl.to(targets, { opacity: 0.4, duration: 0.25 }, t + 0.05);
        cue('swipe', t, 0.9);
        break;
      case 'shrink':
        tl.to(targets, { scale: 0.42, opacity: 0.8, duration: 0.55, ease: 'power3.inOut' }, t);
        cue('shrink', t, 0.8);
        break;
      case 'grow':
        tl.to(targets, { scale: 1.25, duration: 0.4, ease: 'back.out(2)' }, t);
        cue('pop', t, 0.7);
        break;
      case 'shake':
        tl.to(targets, { keyframes: { x: [0, -16, 14, -10, 8, -4, 0] }, duration: 0.4 }, t);
        cue('glitch', t, 0.5);
        break;
      case 'glow':
        tl.to(targets, { textShadow: '0 0 40px rgba(255,210,63,.85)', color: '#ffd23f', duration: 0.3 }, t);
        break;
      case 'punch':
        camera.punch(t, 0.06);
        cue('hit', t, 0.8);
        break;
      default:
        ctx.warn(`fx desconocido: ${f.do}`);
    }
  }
}

function pop(tl, el, t, { from = 0.4, ease = 'back.out(2.2)', dur = 0.38, y = 0 } = {}) {
  tl.fromTo(el, { autoAlpha: 0, scale: from, y }, { autoAlpha: 1, scale: 1, y: 0, duration: dur, ease }, t);
}

function place(el, x, y, center) {
  el.style.position = 'absolute';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  if (center) gsap.set(el, { xPercent: -50, yPercent: center === 'x' ? 0 : -50 });
  return el;
}

// ═══════════════════════════════════════════════════════
export const SCENES = {
  /** Frase gigante sincronizada con la voz. lines: ["YOU'RE NOT", "~LAZY~"] */
  statement(ctx) {
    const { sc } = ctx;
    const k = kinetic(ctx, sc.lines, { size: sc.size || 150, kicker: sc.kicker, revealStyle: sc.reveal });
    applyFx(ctx, k.words, sc.fx);
  },

  /** Lista de tareas con la tarea importante ignorada. */
  todo(ctx) {
    const { tl, sc, inner, div, at, cue, t0, vs } = ctx;
    const card = div('card todo');
    card.innerHTML = `<h3>${sc.title || 'TO-DO · TODAY'}</h3>`;
    inner.append(card);
    tl.fromTo(card, { autoAlpha: 0, y: 140, rotation: -3 }, { autoAlpha: 1, y: 0, rotation: -1.5, duration: 0.55, ease: 'expo.out' }, t0 + 0.02);
    sc.items.forEach((it, k) => {
      const row = div('item' + (it.main ? ' main' : ''));
      row.innerHTML = `<div class="box"></div><div class="txt">${it.text}</div>`;
      card.append(row);
      const t = it.at ? at(it.at) : vs + 0.1 + k * 0.12;
      tl.fromTo(row, { autoAlpha: 0, x: -50 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out' }, t - 0.05);
      if (it.done) {
        const box = row.querySelector('.box');
        const chk = icon('check', { size: 84 });
        box.append(chk);
        const tc = t + 0.18;
        tl.to(box, { borderColor: '#4be3a5', duration: 0.1 }, tc);
        drawIcon(tl, chk, tc, 0.22);
        tl.to(row.querySelector('.txt'), { color: '#8f887d', duration: 0.2 }, tc + 0.1);
        cue('check', tc, 0.85);
      }
      if (it.tag) {
        const tag = div('tag', it.tag);
        row.append(tag);
        const tt = at(it.tagAt);
        pop(tl, tag, tt);
        tl.to(row, { keyframes: { x: [0, -14, 12, -8, 6, 0] }, duration: 0.4 }, tt);
        cue('glitch', tt, 0.6);
      }
    });
  },

  /** El cerebro protagonista con expresiones, chips y alarma. */
  mascot(ctx) {
    const { tl, sc, inner, div, at, cue, camera, t0, t1, vs } = ctx;
    const size = sc.size || 600;
    const wrap = div('layer');
    const svg = svgEl(brainSVG());
    svg.setAttribute('width', size); svg.setAttribute('height', size);
    place(svg, 540 - size / 2, (sc.y || 700) - size / 2);
    wrap.append(svg);
    inner.append(wrap);
    tl.fromTo(svg, { scale: 0.2, autoAlpha: 0, rotation: -12 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1,0.55)' }, t0 + 0.02);
    cue('bubble', t0 + 0.04, 0.8);
    brainExpress(tl, svg, sc.expr || 'smile', t0, 0.01);
    brainIdle(tl, svg, t0, t1, { look: (sc.look || []).map((l) => ({ ...l, t: at(l.at) })) });

    for (const m of sc.moments || []) {
      const t = at(m.at);
      if (m.expr) brainExpress(tl, svg, m.expr, t);
      if (m.shake) { tl.to(svg, { keyframes: { x: [0, -18, 16, -12, 10, -6, 0] }, duration: 0.45 }, t); }
      if (m.mood) camera.mood(m.mood, t);
    }
    (sc.chips || []).forEach((c, k) => {
      const chip = div('chip' + (c.style ? ' ' + c.style : ''), c.text);
      place(chip, c.x, c.y, true);
      wrap.append(chip);
      const t = c.at ? at(c.at) : vs + k * 0.3;
      tl.fromTo(chip, { autoAlpha: 0, scale: 0.3, rotation: c.rot ? c.rot * 3 : 0 }, { autoAlpha: 1, scale: 1, rotation: c.rot || 0, duration: 0.45, ease: 'back.out(2.4)' }, t);
      tl.fromTo(chip, { y: 0 }, { y: -10, duration: 1.1, ease: 'sine.inOut', repeat: 3, yoyo: true }, t + 0.45);
      cue('pop', t, 0.7);
    });
    if (sc.alert) {
      const t = at(sc.alert.at);
      const box = div('layer');
      const warn = icon('warning', { size: 190, color: 'var(--outline)', width: 10 });
      place(warn, 445, 222);
      const chip = div('chip hot', sc.alert.text || 'THREAT');
      chip.style.fontSize = '74px';
      chip.style.padding = '18px 50px';
      place(chip, 540, 490, true);
      box.append(warn, chip);
      wrap.append(box);
      tl.fromTo(warn, { autoAlpha: 0, scale: 0.2, rotation: -25, transformOrigin: '50% 70%' }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(3)' }, t);
      tl.fromTo(chip, { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'expo.out' }, t + 0.06);
      tl.fromTo(warn, { rotation: 0 }, { rotation: 6, duration: 0.12, repeat: 7, yoyo: true, ease: 'sine.inOut' }, t + 0.45);
      camera.mood('danger', t, 0.25);
      camera.shake(t, 18, 0.45);
      camera.flash(t, 0.25);
      cue('alarm', t, 0.75);
      cue('hit', t, 0.9);
    }
  },

  /** Pantalla de bloqueo con notificaciones que llegan con la voz. */
  phone(ctx) {
    const { tl, sc, inner, div, at, cue, t0, vs, t1 } = ctx;
    const ph = div('phone', `<div class="notch"></div><div class="screen"><div class="clock">${sc.clock || '11:47'}</div><div class="date">${sc.date || 'Report due · tomorrow'}</div></div>`);
    inner.append(ph);
    const screen = ph.querySelector('.screen');
    tl.fromTo(ph, { autoAlpha: 0, y: 260, rotation: 6 }, { autoAlpha: 1, y: 0, rotation: -2, duration: 0.6, ease: 'expo.out' }, t0 + 0.02);
    tl.to(ph, { rotation: 2, duration: (t1 - t0) / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, t0 + 0.6);
    (sc.notifs || []).forEach((n, k) => {
      const card = div('notif', `<div class="ic" style="background:${n.color || '#ff5b4a'}"></div><div class="tx">${n.title}<small>${n.text || ''}</small></div>`);
      card.querySelector('.ic').append(icon(n.icon || 'chat', { size: 48, color: '#fff', width: 14 }));
      card.style.top = 350 + k * 146 + 'px';
      screen.append(card);
      const t = n.at ? at(n.at) : vs + 0.3 + k * 0.5;
      tl.fromTo(card, { autoAlpha: 0, y: -60, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, t);
      tl.to(ph, { keyframes: { x: [0, -10, 9, -6, 4, 0] }, duration: 0.3 }, t);
      cue('ding', t, 0.75);
    });
    if (sc.mascot) {
      const size = 360;
      const svg = svgEl(brainSVG('mini'));
      svg.setAttribute('width', size); svg.setAttribute('height', size);
      place(svg, 700, 900);
      inner.append(svg);
      const t = at(sc.mascot.at);
      brainExpress(tl, svg, 'worried', t0, 0.01);
      tl.fromTo(svg, { autoAlpha: 0, x: 300, rotation: 30 }, { autoAlpha: 1, x: 0, rotation: -8, duration: 0.5, ease: 'back.out(1.6)' }, vs + 0.2);
      brainIdle(tl, svg, vs, t1);
      brainExpress(tl, svg, sc.mascot.expr || 'relieved', t);
      cue('bubble', t, 0.6);
    }
  },

  /** Bucle circular: nodos que se encienden con cada palabra. */
  loop(ctx) {
    const { tl, sc, inner, div, at, cue, camera, t0, vs } = ctx;
    const cx = 540, cy = sc.y || 800, r = sc.radius || 340;
    const n = sc.nodes.length;
    const angle = (k) => (-90 + (360 / n) * k) * Math.PI / 180;
    const pos = (k, rr = r) => [cx + rr * Math.cos(angle(k)), cy + rr * Math.sin(angle(k))];
    const svg = svgEl(`<svg class="layer" viewBox="0 0 1080 1920" width="1080" height="1920" overflow="visible"></svg>`);
    inner.append(svg);
    const ring = svgEl(`<svg><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3a3631" stroke-width="5" stroke-dasharray="4 18" stroke-linecap="round"/></svg>`).firstElementChild;
    svg.append(ring);
    tl.fromTo(ring, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' }, t0 + 0.05);

    const center = div('statement', `<div class="line accent-center" style="font-family:var(--serif);font-style:italic;font-weight:400;text-transform:none;color:var(--accent);font-size:${sc.centerSize || 130}px;letter-spacing:-.01em">${sc.center || 'the loop'}</div>`);
    center.style.top = (cy - 620) + 'px';
    inner.append(center);
    const centerLine = center.firstElementChild;

    const nodes = sc.nodes.map((nd, k) => {
      const [x, y] = pos(k);
      const el = div('node', nd.text);
      place(el, x, y, true);
      inner.append(el);
      return { el, nd, t: at(nd.at) };
    });
    // Aparecen todos atenuados al entrar y se encienden con su palabra
    nodes.forEach(({ el }, k) => pop(tl, el, t0 + 0.1 + k * 0.05, { from: 0.6, dur: 0.3 }));
    nodes.forEach(({ el, nd, t }, k) => {
      const color = nd.color || '#ffd23f';
      tl.to(el, { borderColor: color, color: nd.color === '#ff5b4a' ? '#ff5b4a' : '#f5f0e8', backgroundColor: '#262320', duration: 0.12 }, t);
      tl.fromTo(el, { scale: 1.3 }, { scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, t);
      cue('pop', t, 0.65);
      // Flecha hacia el siguiente nodo
      const a1 = angle(k) + 0.23, a2 = angle(k + 1) - 0.23;
      const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      const p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
      const arc = svgEl(`<svg><path d="M${p1[0]} ${p1[1]} A ${r} ${r} 0 0 1 ${p2[0]} ${p2[1]}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/></svg>`).firstElementChild;
      const tang = (a2 * 180) / Math.PI + 90;
      const head = svgEl(`<svg><path d="M-18 -14 L8 0 L-18 14" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" transform="translate(${p2[0]} ${p2[1]}) rotate(${tang})"/></svg>`).firstElementChild;
      svg.append(arc, head);
      const tn = k + 1 < nodes.length ? nodes[k + 1].t : (sc.closeAt ? at(sc.closeAt) : t + 0.5);
      const dur = Math.min(0.45, Math.max(0.15, tn - t - 0.05));
      tl.fromTo(arc, { drawSVG: '0%' }, { drawSVG: '100%', duration: dur, ease: 'power2.inOut' }, t + 0.05);
      tl.fromTo(head, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, t + 0.05 + dur);
    });
    tl.fromTo(centerLine, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, vs + 0.1);
    if (sc.closeAt) {
      const t = at(sc.closeAt);
      const first = nodes[0].el;
      tl.to(first, { scale: 1.45, borderColor: '#ff5b4a', color: '#ff5b4a', duration: 0.35, ease: 'back.out(2)' }, t);
      tl.to(centerLine, { scale: 1.35, color: '#ff5b4a', duration: 0.1 }, t);
      tl.to(centerLine, { scale: 1, color: '#ffd23f', duration: 0.45, ease: 'back.out(2)' }, t + 0.1);
      camera.shake(t, 10, 0.3);
      camera.mood('danger', t, 0.4);
      cue('hit', t, 0.85);
    }
  },

  /** Tú vs tu yo futuro (que el cerebro trata como a un extraño). */
  selves(ctx) {
    const { tl, sc, inner, div, at, cue, camera, t0, vs } = ctx;
    const you = div('figure');
    you.append(personSVG({ fill: '#ffd23f' }));
    you.append(div('name', sc.left || 'YOU'));
    place(you, 290, 600, 'x');
    const fut = div('figure');
    fut.append(personSVG({ fill: '#63b3ff', stranger: true }));
    const nameA = div('name', sc.right || 'FUTURE YOU');
    const nameB = div('name', sc.rightAfter || 'A STRANGER?');
    nameB.style.position = 'absolute'; nameB.style.left = '50%'; nameB.style.top = '375px'; nameB.style.transform = 'translateX(-50%)'; nameB.style.color = 'var(--muted)';
    fut.append(nameA, nameB);
    place(fut, 790, 600, 'x');
    const arrow = svgEl(`<svg class="layer" viewBox="0 0 1080 1920" width="1080" height="1920"><path class="ar" d="M420 800 Q540 750 660 800" fill="none" stroke="#8f887d" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16"/><path class="ah" d="M640 780 L664 802 L636 816" fill="none" stroke="#8f887d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    const tlabel = div('kicker', sc.timeLabel || 'TIME →');
    place(tlabel, 470, 680);
    inner.append(arrow, you, fut, tlabel);
    pop(tl, you, t0 + 0.05, { y: 60 });
    cue('pop', t0 + 0.05, 0.5);
    const tf = at(sc.futureAt || 'future');
    pop(tl, fut, tf, { y: 60 });
    tl.fromTo(arrow.querySelector('.ar'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4 }, tf - 0.1);
    tl.fromTo([arrow.querySelector('.ah'), tlabel], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, tf + 0.25);
    gsap.set(nameB, { autoAlpha: 0 });
    cue('pop', tf, 0.6);

    const ts = at(sc.strangerAt || 'stranger');
    const pYou = fut.querySelector('.p-you'), pStr = fut.querySelector('.p-stranger');
    tl.to(pYou, { opacity: 0, duration: 0.12 }, ts);
    tl.to(pStr, { opacity: 1, duration: 0.12 }, ts);
    tl.to(fut, { keyframes: { x: [0, -20, 18, -12, 14, -6, 0], skewX: [0, 8, -6, 4, 0, 0, 0] }, duration: 0.45 }, ts);
    tl.to(nameA, { autoAlpha: 0, duration: 0.1 }, ts);
    tl.to(nameB, { autoAlpha: 1, duration: 0.1 }, ts + 0.05);
    camera.mood('mystery', ts, 0.4);
    cue('glitch', ts, 0.9);

    if (sc.dumpAt) {
      const td = at(sc.dumpAt);
      const box = div('box-work', sc.box || 'WORK');
      place(box, 205, 470);
      inner.append(box);
      pop(tl, box, td - 0.35, { y: -40 });
      tl.to(box, { x: 500, y: -60, rotation: 12, duration: 0.28, ease: 'power2.in' }, td + 0.05);
      tl.to(box, { y: 360, rotation: -4, duration: 0.3, ease: 'bounce.out' }, td + 0.33);
      tl.to(fut, { scaleY: 0.92, transformOrigin: '50% 100%', duration: 0.08, yoyo: true, repeat: 1 }, td + 0.4);
      cue('whoosh', td, 0.6);
      cue('thud', td + 0.4, 0.9);
    }
    void vs;
  },

  /** Consejo numerado: número gigante, título cinético e icono o cita. */
  step(ctx) {
    const { tl, sc, inner, div, at, cue, t0, vs } = ctx;
    const num = div('step-num', String(sc.num));
    inner.append(num);
    tl.fromTo(num, { autoAlpha: 0, scale: 1.4, y: 80 }, { autoAlpha: 0.13, scale: 1, y: 0, duration: 0.6, ease: 'expo.out' }, t0 + 0.02);
    const k = kinetic(ctx, sc.lines, { size: sc.size || 118, top: 290, height: 640, kicker: sc.kicker || `${ctx.spec.labels?.step || 'STEP'} ${sc.num}` });
    applyFx(ctx, k.words, sc.fx);
    if (sc.icon) {
      const ic = icon(sc.icon, { size: sc.iconSize || 300, color: 'var(--ink)', width: 9 });
      place(ic, 540 - (sc.iconSize || 300) / 2, 990);
      inner.append(ic);
      const t = sc.iconAt ? at(sc.iconAt) : vs + 0.4;
      tl.fromTo(ic, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, t);
      drawIcon(tl, ic, t, 0.55);
      tl.to(ic, { y: -12, duration: 0.9, yoyo: true, repeat: 4, ease: 'sine.inOut' }, t + 0.6);
      cue('swipe', t, 0.45);
    }
    if (sc.quote) {
      const q = div('quote');
      q.style.top = (sc.quote.top || 1010) + 'px';
      const txt = document.createElement('span');
      const cur = div('cursor');
      cur.style.display = 'inline-block';
      q.append(txt, cur);
      inner.append(q);
      const t = at(sc.quote.at);
      const tEnd = sc.quote.endAt ? at(sc.quote.endAt, { edge: 'end' }) : t + 1.6;
      tl.fromTo(q, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out' }, t - 0.2);
      tl.fromTo(txt, { text: '' }, { text: sc.quote.text, duration: Math.max(0.6, tEnd - t), ease: 'none' }, t);
      tl.to(cur, { opacity: 0, duration: 0.01, repeat: 12, yoyo: true, repeatDelay: 0.25 }, tEnd);
      cue('type', t, 0.55);
    }
    if (sc.stat) {
      const s = div('quote');
      s.style.top = (sc.stat.top || 1010) + 'px';
      s.style.fontFamily = 'var(--display)';
      s.style.fontWeight = '800';
      s.style.fontSize = '50px';
      s.innerHTML = `<span style="color:var(--mint);font-weight:900">${sc.stat.big}</span> ${sc.stat.text}`;
      inner.append(s);
      const t = at(sc.stat.at);
      tl.fromTo(s, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(1.6)' }, t);
      cue('shimmer', t, 0.6);
    }
  },

  /** Dos conceptos enfrentados en tarjetas. */
  versus(ctx) {
    const { tl, sc, inner, div, at, cue, camera, t0 } = ctx;
    const mk = (side, top) => {
      const c = div('card vs-card', `<div class="k">${side.k || ''}</div><div class="t fit" data-size="92">${side.title}</div><div class="d">${side.desc}</div>`);
      c.style.top = top + 'px';
      if (side.color) c.style.borderColor = side.color;
      inner.append(c);
      ctx.fitLines(c, 92, 790);
      return c;
    };
    const a = mk(sc.a, 360), b = mk(sc.b, 860);
    const badge = div('vs-badge', 'VS');
    badge.style.top = '750px';
    inner.append(badge);
    const ta = at(sc.a.at), tb = at(sc.b.at);
    tl.fromTo(a, { autoAlpha: 0, x: -200, rotation: -4 }, { autoAlpha: 1, x: 0, rotation: -1.5, duration: 0.45, ease: 'expo.out' }, ta - 0.05);
    tl.fromTo(a.querySelector('.d'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, at(sc.a.descAt));
    tl.fromTo(b, { autoAlpha: 0, x: 200, rotation: 4 }, { autoAlpha: 1, x: 0, rotation: 1.5, duration: 0.45, ease: 'expo.out' }, tb - 0.05);
    tl.fromTo(b.querySelector('.d'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, at(sc.b.descAt));
    pop(tl, badge, tb - 0.1, { from: 0.1, ease: 'back.out(3)' });
    cue('whoosh', ta - 0.12, 0.5); cue('whoosh', tb - 0.12, 0.5); cue('pop', tb - 0.1, 0.6);
    if (sc.highlightAt) {
      const t = at(sc.highlightAt);
      tl.to(b, { borderColor: '#ffd23f', scale: 1.04, duration: 0.3, ease: 'back.out(2)' }, t);
      tl.to(a, { opacity: 0.45, scale: 0.96, duration: 0.3 }, t);
      camera.punch(t, 0.03);
      cue('shimmer', t, 0.6);
    }
    void t0;
  },

  /** Cierre: guardar / seguir. */
  cta(ctx) {
    const { tl, sc, inner, div, at, cue, camera, t0, ve } = ctx;
    const bm = icon('bookmark', { size: 260, color: 'var(--ink)', width: 12 });
    place(bm, 410, 300);
    inner.append(bm);
    const tSave = at(sc.saveAt || 'save');
    tl.fromTo(bm, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, t0 + 0.02);
    drawIcon(tl, bm, t0 + 0.05, 0.4);
    tl.to(bm.querySelector('.bm'), { fill: '#ffd23f', stroke: '#ffd23f', duration: 0.15 }, tSave);
    tl.fromTo(bm, { scale: 1.35 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.5)' }, tSave);
    camera.punch(tSave, 0.04);
    cue('shimmer', tSave, 0.8);
    const k = kinetic(ctx, sc.lines, { size: sc.size || 140, top: 560, height: 600, revealStyle: 'rise' });
    applyFx(ctx, k.words, sc.fx);
    if (sc.icon) {
      const ic = icon(sc.icon, { size: 200, color: 'var(--ink)', width: 9 });
      place(ic, 440, 1130);
      inner.append(ic);
      const t = at(sc.iconAt);
      tl.fromTo(ic, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, t);
      tl.to(ic, { rotation: 18, transformOrigin: '70% 10%', duration: 0.14, repeat: 7, yoyo: true, ease: 'sine.inOut' }, t + 0.3);
      cue('swipe', t + 0.3, 0.5);
    }
    if (sc.follow) {
      const f = div('kicker', sc.follow);
      Object.assign(f.style, { position: 'absolute', left: 0, right: 0, top: '1420px', textAlign: 'center', color: 'var(--ink)', fontSize: '36px' });
      inner.append(f);
      tl.fromTo(f, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35 }, ve + 0.05);
    }
  },
};
