// La pista de efectos: cada sonido en su segundo, a su velocidad, con su nivel puesto frente a la voz que suena a su
// alrededor (como en los reels que funcionaron: lo más fuerte del efecto, 10 ms, queda `db` por debajo de lo más
// fuerte de la voz cerca, 50 ms en ±0,4 s; si ahí no habla nadie, por debajo de su voz típica).
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, fallo, leerAudio } from "./comun.mjs";

export const SR = 48000;
export const CARPETA = join(RAIZ, "sonidos");

// Los sonidos que hay: nombre → archivo.
export function catalogo() {
  const c = {};
  for (const f of readdirSync(CARPETA)) { const m = f.match(/^(.+)\.(mp3|wav)$/); if (m) c[m[1]] = join(CARPETA, f); }
  return c;
}

// lo más fuerte (RMS en ventanas de `ven` muestras) entre dos segundos: su nivel en dB y dónde empieza
function fuerte(a, t0, t1, ven) {
  let mejor = 0, donde = Math.max(0, t0);
  for (let i = Math.max(0, Math.floor(t0 * SR)); i + ven <= Math.min(a.length, Math.floor(t1 * SR)); i += ven / 2) {
    let s = 0;
    for (let j = i; j < i + ven; j++) s += a[j] * a[j];
    const r = Math.sqrt(s / ven);
    if (r > mejor) { mejor = r; donde = i / SR; }
  }
  return { db: 20 * Math.log10(mejor + 1e-9), t: donde };
}

// paso bajo de dos polos: quita los agudos ásperos
function pasoBajo(x, fc) {
  const w = (2 * Math.PI * fc) / SR, cw = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2);
  const b0 = (1 - cw) / 2, b1 = 1 - cw, b2 = (1 - cw) / 2, a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
  }
}

// eventos: [{ t, sonido, db = -10, vel = 1, lp, ancla = "golpe" | "empieza", reves, corta, que }]
//   t       el segundo en que cae lo más fuerte del sonido (su golpe); con ancla "empieza", en el que empieza
//   vel     más de 1, más agudo y corto; menos de 1, más grave y largo
//   lp      quita los agudos por encima de esos Hz (más sordo, más lejos)
//   reves   al revés: crece y se corta (para algo que vuelve atrás o que se absorbe)
//   corta   el segundo en que se apaga del todo (con su plano: si el plano se corta, el sonido también)
export function mezclar(eventos, voz) {
  const sonidos = catalogo(), cache = {}, pista = new Float32Array(voz.length);
  const tipica = fuerte(voz, 0, voz.length / SR, 2400).db - 3;
  const usados = [];
  for (const e0 of [...eventos].sort((a, b) => a.t - b.t)) {
    const e = { db: -10, vel: 1, ancla: "golpe", ...e0 };
    const ruta = sonidos[e.sonido];
    if (!ruta) fallo(`No hay ningún sonido «${e.sonido}» en sonidos/. Hay: ${Object.keys(sonidos).join(", ")}.`);
    const src = cache[ruta] || (cache[ruta] = leerAudio(ruta, SR));
    let n = Math.floor(src.length / e.vel);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = i * e.vel, k = Math.floor(p), f = p - k; x[i] = (src[k] || 0) * (1 - f) + (src[k + 1] || 0) * f; }
    if (e.reves) x.reverse();
    if (e.lp) pasoBajo(x, e.lp);
    const golpe = fuerte(x, 0, n / SR, 480), ancla = e.ancla === "empieza" ? 0 : golpe.t;
    const cerca = fuerte(voz, e.t - 0.4, e.t + 0.4, 2400).db, ref = cerca < -45 ? tipica : cerca;
    const gan = 10 ** ((ref + e.db - golpe.db) / 20), ini = Math.round((e.t - ancla) * SR);
    if (e.corta !== undefined) n = Math.max(0, Math.min(n, Math.round(e.corta * SR) - ini));
    const fundido = e.corta !== undefined ? 0.08 : Math.min(0.04, n / SR / 3);
    for (let i = 0; i < n; i++) {
      const j = ini + i;
      if (j < 0 || j >= pista.length) continue;
      const ti = i / SR, queda = n / SR - ti;
      pista[j] += x[i] * gan * Math.min(1, ti / 0.004) * Math.min(1, queda / fundido);
    }
    usados.push({ ...e, desde: ini / SR, hasta: (ini + n) / SR });
  }
  return { pista, usados };
}

// Los tramos sin ningún efecto que suene (más de `largo` segundos).
export function huecos(pista, largo = 2) {
  const W = 2400, h = [];
  let desde = null;
  for (let i = 0; i + W <= pista.length; i += W) {
    let s = 0;
    for (let j = i; j < i + W; j++) s += pista[j] * pista[j];
    const suena = 10 * Math.log10(s / W + 1e-12) > -48, t = i / SR;
    if (!suena && desde === null) desde = t;
    if (suena && desde !== null) { if (t - desde > largo) h.push([desde, t]); desde = null; }
  }
  return h;
}

export const hayEfectos = (dir) => existsSync(join(dir, "sonidos.js"));
