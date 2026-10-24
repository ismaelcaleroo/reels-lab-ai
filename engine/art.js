// Ilustraciones vectoriales: el cerebro protagonista y una librería de iconos de línea.
// Todo es SVG en línea para que se renderice idéntico en cada frame.

const NS = 'http://www.w3.org/2000/svg';

export function svgEl(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

// ── Cerebro ────────────────────────────────────────────
// Silueta = unión de círculos. Se pinta dos veces: primero más gruesos en color
// contorno y luego en rosa, así el borde queda limpio sin calcular la unión.
const LOBES = [
  [128, 150, 70], [200, 116, 80], [274, 150, 70], [104, 214, 62], [296, 214, 62],
  [160, 244, 72], [242, 244, 72], [200, 190, 86], [200, 258, 64],
];

export const MOUTHS = {
  smile: 'M168 262 Q200 290 232 262 Q200 278 168 262 Z',
  happy: 'M160 254 Q200 318 240 254 Q200 268 160 254 Z',
  worried: 'M170 284 Q200 258 230 284 Q200 272 170 284 Z',
  scared: 'M200 256 C220 256 226 272 226 284 C226 300 215 308 200 308 C185 308 174 300 174 284 C174 272 180 256 200 256 Z',
  smirk: 'M172 272 Q206 284 236 258 Q208 280 172 272 Z',
  flat: 'M174 274 Q200 278 226 274 Q200 282 174 274 Z',
};

// Cejas: [rotación izq, rotación der, desplazamiento y]
export const BROWS = {
  smile: [0, 0, 0], happy: [-6, 6, -8], worried: [16, -16, -4], scared: [22, -22, -16],
  smirk: [-14, 4, 2], flat: [-4, 4, 4], relieved: [-6, 6, -6],
};

export function brainSVG(id = 'brain') {
  const outline = LOBES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 9}"/>`).join('');
  const fill = LOBES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  return `
<svg class="brain" id="${id}" viewBox="0 0 400 400" width="400" height="400" overflow="visible">
  <g class="b-body">
    <ellipse class="b-shadow" cx="200" cy="378" rx="120" ry="14" fill="rgba(0,0,0,.35)"/>
    <g class="b-legs" stroke="var(--outline)" stroke-width="12" stroke-linecap="round" fill="none">
      <path d="M168 300 L162 352"/><path d="M232 300 L238 352"/>
      <path d="M148 356 L170 356" stroke-width="14"/><path d="M230 356 L252 356" stroke-width="14"/>
    </g>
    <g class="b-arm-l" stroke="var(--outline)" stroke-width="12" stroke-linecap="round" fill="none"><path d="M64 222 Q34 236 28 270"/></g>
    <g class="b-arm-r" stroke="var(--outline)" stroke-width="12" stroke-linecap="round" fill="none"><path d="M336 222 Q366 236 372 270"/></g>
    <g fill="var(--outline)">${outline}</g>
    <g fill="var(--brain)">${fill}</g>
    <g fill="none" stroke="var(--brain-dark)" stroke-width="7" stroke-linecap="round">
      <path d="M200 52 Q186 100 204 140"/>
      <path d="M96 168 Q118 140 146 158"/><path d="M304 168 Q282 140 254 158"/>
      <path d="M120 112 Q150 96 168 120"/><path d="M280 112 Q250 96 232 120"/>
      <path d="M86 232 Q104 252 128 240"/><path d="M314 232 Q296 252 272 240"/>
    </g>
    <ellipse cx="146" cy="96" rx="34" ry="18" fill="#fff" opacity=".28" transform="rotate(-24 146 96)"/>
    <ellipse class="b-cheek" cx="128" cy="254" rx="22" ry="13" fill="var(--brain-dark)" opacity=".55"/>
    <ellipse class="b-cheek" cx="272" cy="254" rx="22" ry="13" fill="var(--brain-dark)" opacity=".55"/>
    <g class="b-eyes">
      <g class="b-eye b-eye-l"><ellipse cx="164" cy="204" rx="31" ry="37" fill="#fff" stroke="var(--outline)" stroke-width="7"/>
        <g class="b-pupil"><circle cx="168" cy="210" r="15" fill="var(--outline)"/><circle cx="173" cy="203" r="5" fill="#fff"/></g></g>
      <g class="b-eye b-eye-r"><ellipse cx="236" cy="204" rx="31" ry="37" fill="#fff" stroke="var(--outline)" stroke-width="7"/>
        <g class="b-pupil"><circle cx="240" cy="210" r="15" fill="var(--outline)"/><circle cx="245" cy="203" r="5" fill="#fff"/></g></g>
    </g>
    <g class="b-closed" fill="none" stroke="var(--outline)" stroke-width="8" stroke-linecap="round" opacity="0">
      <path d="M138 210 Q164 186 190 210"/><path d="M210 210 Q236 186 262 210"/>
    </g>
    <rect class="b-brow b-brow-l" x="138" y="150" width="54" height="12" rx="6" fill="var(--outline)"/>
    <rect class="b-brow b-brow-r" x="208" y="150" width="54" height="12" rx="6" fill="var(--outline)"/>
    <path class="b-mouth" d="${MOUTHS.smile}" fill="var(--outline)"/>
    <path class="b-sweat" d="M312 120 C322 138 328 148 328 158 C328 170 318 176 310 176 C300 176 292 168 294 156 C296 146 304 134 312 120 Z" fill="#9fd6ff" stroke="var(--outline)" stroke-width="5" opacity="0"/>
  </g>
</svg>`;
}

/**
 * Añade al timeline los cambios de expresión del cerebro.
 * expr: smile | happy | worried | scared | smirk | flat | relieved
 */
export function brainExpress(tl, root, expr, t, dur = 0.22) {
  const q = (s) => root.querySelectorAll(s);
  const mouthKey = expr === 'relieved' ? 'happy' : expr;
  const [bl, br, by] = BROWS[expr] || BROWS.smile;
  tl.to(q('.b-mouth'), { morphSVG: MOUTHS[mouthKey] || MOUTHS.smile, duration: dur, ease: 'back.out(2)' }, t);
  tl.to(q('.b-brow-l'), { rotation: bl, y: by, svgOrigin: '165 156', duration: dur, ease: 'back.out(2)' }, t);
  tl.to(q('.b-brow-r'), { rotation: br, y: by, svgOrigin: '235 156', duration: dur, ease: 'back.out(2)' }, t);
  const closed = expr === 'relieved';
  tl.to(q('.b-eyes'), { scaleY: closed ? 0.05 : 1, svgOrigin: '200 206', duration: dur * 0.7 }, t);
  tl.to(q('.b-closed'), { opacity: closed ? 1 : 0, duration: dur * 0.5 }, t + (closed ? dur * 0.4 : 0));
  tl.to(q('.b-eye'), { scale: expr === 'scared' ? 1.14 : 1, transformOrigin: '50% 50%', duration: dur }, t);
  tl.to(q('.b-pupil'), { scale: expr === 'scared' ? 0.6 : 1, transformOrigin: '50% 50%', duration: dur }, t);
  tl.to(q('.b-sweat'), { opacity: expr === 'scared' || expr === 'worried' ? 1 : 0, y: 0, duration: dur }, t);
}

/** Respiración, parpadeos y miradas deterministas entre t0 y t1. */
export function brainIdle(tl, root, t0, t1, { bob = 10, look = [] } = {}) {
  const body = root.querySelector('.b-body');
  const span = Math.max(0.5, t1 - t0);
  const beats = Math.max(1, Math.floor(span / 0.9));
  tl.fromTo(body, { y: 0 }, { y: -bob, duration: span / beats, ease: 'sine.inOut', repeat: beats - 1, yoyo: true }, t0);
  tl.fromTo(root.querySelectorAll('.b-arm-l'), { rotation: 0 }, { rotation: 8, svgOrigin: '64 222', duration: span / beats, ease: 'sine.inOut', repeat: beats - 1, yoyo: true }, t0);
  tl.fromTo(root.querySelectorAll('.b-arm-r'), { rotation: 0 }, { rotation: -8, svgOrigin: '336 222', duration: span / beats, ease: 'sine.inOut', repeat: beats - 1, yoyo: true }, t0);
  for (let t = t0 + 1.4; t < t1 - 0.3; t += 2.7) {
    const eyes = root.querySelectorAll('.b-eye');
    tl.to(eyes, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.06 }, t);
    tl.to(eyes, { scaleY: 1, duration: 0.09 }, t + 0.08);
  }
  for (const { t, x = 0, y = 0 } of look) {
    tl.to(root.querySelectorAll('.b-pupil'), { x, y, duration: 0.18, ease: 'power2.out' }, t);
  }
}

// ── Iconos de línea (viewBox 200×200) ──────────────────
// Cada trazo tiene class="d" para poder dibujarlo con DrawSVG.
const I = {
  doc: `<path class="d" d="M56 24 H120 L150 54 V176 H56 Z"/><path class="d" d="M120 24 V54 H150"/>
        <path class="d" d="M76 86 H130"/><path class="d" d="M76 110 H130"/><path class="d" d="M76 134 H108"/>`,
  phone: `<rect class="d" x="60" y="18" width="80" height="164" rx="18"/><path class="d" d="M88 160 H112"/>`,
  warning: `<path class="d" d="M100 24 L180 166 H20 Z" style="fill:var(--hot);stroke:var(--outline)"/>
        <path class="d" d="M100 78 V118" style="stroke:var(--outline);stroke-width:14"/><circle cx="100" cy="142" r="8" fill="var(--outline)"/>`,
  heart: `<path class="d" d="M100 168 C40 126 22 96 30 70 C38 44 74 34 100 64 C126 34 162 44 170 70 C178 96 160 126 100 168 Z" style="fill:var(--hot)"/>`,
  bandage: `<g transform="rotate(-35 100 100)"><rect class="d" x="44" y="80" width="112" height="40" rx="20" style="fill:#f3d2a8;stroke:var(--outline)"/>
        <rect x="84" y="84" width="32" height="32" rx="6" fill="#e6b88a"/></g>`,
  steps: `<path class="d" d="M24 168 H64 V136 H104 V104 H144 V72 H178"/><circle class="d" cx="44" cy="130" r="14" style="fill:var(--accent);stroke:var(--accent)"/>`,
  clock: `<circle class="d" cx="100" cy="104" r="70"/><path class="d" d="M100 62 V104 L130 122"/><path class="d" d="M64 22 L40 42"/><path class="d" d="M136 22 L160 42"/>`,
  pin: `<path class="d" d="M100 178 C70 134 52 108 52 82 C52 54 74 32 100 32 C126 32 148 54 148 82 C148 108 130 134 100 178 Z"/><circle class="d" cx="100" cy="82" r="18"/>`,
  bookmark: `<path class="d bm" d="M56 22 H144 V180 L100 146 L56 180 Z"/>`,
  broom: `<path class="d" d="M140 20 L96 110"/><path class="d" d="M70 104 L122 128 L104 180 C84 178 58 166 42 150 Z" style="fill:#d8a65a"/><path class="d" d="M62 156 L80 132"/><path class="d" d="M84 168 L96 140"/>`,
  check: `<path class="d" d="M40 104 L84 146 L162 56" style="stroke:var(--mint);stroke-width:16"/>`,
  play: `<rect class="d" x="24" y="44" width="152" height="112" rx="26"/><path class="d" d="M88 78 L126 100 L88 122 Z" style="fill:var(--ink)"/>`,
  cookie: `<circle class="d" cx="100" cy="100" r="70" style="fill:#c98a4b;stroke:var(--outline)"/><circle cx="76" cy="78" r="9" fill="#3a2414"/><circle cx="122" cy="88" r="8" fill="#3a2414"/><circle cx="92" cy="128" r="10" fill="#3a2414"/><circle cx="132" cy="128" r="7" fill="#3a2414"/>`,
  chat: `<path class="d" d="M30 44 H170 V136 H88 L54 166 V136 H30 Z"/><path class="d" d="M60 78 H140"/><path class="d" d="M60 104 H116"/>`,
};

export function icon(name, { size = 200, color = 'var(--ink)', width = 9 } = {}) {
  const body = I[name];
  if (!body) throw new Error(`Icono desconocido: ${name}`);
  return svgEl(`<svg class="icon icon-${name}" viewBox="0 0 200 200" width="${size}" height="${size}" overflow="visible"
    style="stroke:${color};fill:none;stroke-width:${width};stroke-linecap:round;stroke-linejoin:round">${body}</svg>`);
}

/** Dibuja los trazos de un icono y rellena al final. */
export function drawIcon(tl, svg, t, dur = 0.6) {
  const paths = svg.querySelectorAll('.d');
  tl.fromTo(paths, { drawSVG: '0%' }, { drawSVG: '100%', duration: dur, ease: 'power2.inOut', stagger: dur / Math.max(2, paths.length) / 1.5 }, t);
}

// ── Silueta de persona ─────────────────────────────────
export function personSVG({ fill = 'var(--accent)', stranger = false } = {}) {
  return svgEl(`
<svg class="person" viewBox="0 0 240 300" width="300" height="375" overflow="visible">
  <g class="p-you">
    <path d="M24 296 C24 220 66 186 120 186 C174 186 216 220 216 296 Z" fill="${fill}" stroke="var(--outline)" stroke-width="8"/>
    <circle cx="120" cy="102" r="66" fill="${fill}" stroke="var(--outline)" stroke-width="8"/>
    <circle cx="98" cy="102" r="8" fill="var(--outline)"/><circle cx="142" cy="102" r="8" fill="var(--outline)"/>
    <path d="M96 132 Q120 150 144 132" fill="none" stroke="var(--outline)" stroke-width="8" stroke-linecap="round"/>
  </g>
  ${stranger ? `
  <g class="p-stranger" opacity="0">
    <path d="M24 296 C24 220 66 186 120 186 C174 186 216 220 216 296 Z" fill="#4a4540" stroke="var(--outline)" stroke-width="8"/>
    <path d="M46 196 C40 100 72 28 120 28 C168 28 200 100 194 196 Z" fill="#3a3632" stroke="var(--outline)" stroke-width="8"/>
    <ellipse cx="120" cy="114" rx="50" ry="62" fill="#151312"/>
    <text x="120" y="140" text-anchor="middle" font-family="Inter Tight" font-weight="900" font-size="84" fill="var(--muted)">?</text>
  </g>` : ''}
</svg>`);
}
