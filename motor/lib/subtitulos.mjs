// Los subtítulos de la casa, dibujados encima de cada fotograma: pocas palabras cada vez, arriba; cada palabra
// aparece al decirse (con un desenfoque que se aclara), la que suena en blanco y negrita, las ya dichas en gris, y la
// palabra clave de cada frase dentro de su recuadro azul con dos tiradores, como una selección de texto.
// Las palabras no se mueven al pasar de negrita a gris: cada una tiene su sitio desde que aparece el bloque.
// La letra es Google Sans (la eligió el creador; Figtree no tenía la «í» en negrita). Cada línea lleva 3 o 4
// palabras y nunca una sola (también lo pidió él): mejor partir después de un punto o una coma.
import { createCanvas } from "@napi-rs/canvas";
import { join } from "node:path";
import { RAIZ } from "./comun.mjs";

// (las letras se registran en comun.mjs, al arrancar)

export const ESTILO = {
  letra: "Google Sans",
  tam: 74, linea: 84, izq: 110, ancho: 860, arriba: 318, abajo: 1200, hueco: 19,
  tinta: "#ffffff", dicha: "#7b818a", marca: "#2f7cf6",
  anticipo: 0.08, // la palabra aparece un poco antes de oírse, para que se lea a tiempo
};
const E = ESTILO;

const medidor = createCanvas(10, 10).getContext("2d");
const anchoDe = (texto) => { medidor.font = `700 ${E.tam}px ${E.letra}`; return medidor.measureText(texto).width; };
const cierra = (texto) => /[.?!…:]$/.test(texto) ? 2 : /[,;»]$/.test(texto) ? 1 : 0;

// Parte las palabras de una frase en líneas de 3 o 4 (2 o 5 solo si no hay otra; 1 solo si la frase es de una
// palabra), que quepan a lo ancho y, si puede ser, que acaben en un punto o una coma.
function lineasDe(ws) {
  const n = ws.length, coste = new Array(n + 1).fill(Infinity), corte = new Array(n + 1).fill(0);
  coste[0] = 0;
  const precio = { 1: 60, 2: 8, 3: 0, 4: 0, 5: 5, 6: 14 };
  for (let j = 1; j <= n; j++) for (let k = 1; k <= Math.min(6, j); k++) {
    if (k === 1 && n > 1) continue;
    const linea = ws.slice(j - k, j), ancho = anchoDe(linea.map((w) => w.texto).join(" "));
    let c = coste[j - k] + precio[k] + (ancho > E.ancho ? 30 + (ancho - E.ancho) / 10 : 0);
    if (j < n) c -= 4 * cierra(linea[linea.length - 1].texto);   // mejor partir después de un punto o una coma
    c += 10 * linea.slice(0, -1).filter((w) => cierra(w.texto) === 2).length; // y nunca seguir tras un punto en la misma línea
    if (c < coste[j]) { coste[j] = c; corte[j] = k; }
  }
  const out = [];
  for (let j = n; j > 0; j -= corte[j]) out.unshift(ws.slice(j - corte[j], j));
  return out;
}

// Bloques de una o dos líneas, sin mezclar frases; si una línea acaba una oración, la siguiente empieza bloque.
export function bloques(palabras, duracion) {
  const porFrase = [];
  for (const w of palabras) { const f = porFrase[porFrase.length - 1]; if (!f || f[0].frase !== w.frase) porFrase.push([w]); else f.push(w); }
  const bs = [];
  for (const ws of porFrase) {
    let b = null;
    for (const l of lineasDe(ws)) {
      if (!b || b.lineas.length >= 2) { b = { frase: ws[0].frase, palabras: [], lineas: [] }; bs.push(b); }
      b.lineas.push(l.length); b.palabras.push(...l);
      if (cierra(l[l.length - 1].texto) === 2) b = null;
    }
  }
  bs.forEach((b, i) => {
    b.inicio = Math.max(0, b.palabras[0].inicio - E.anticipo);
    const sig = bs[i + 1];
    b.fin = sig ? Math.min(sig.palabras[0].inicio - E.anticipo, b.palabras[b.palabras.length - 1].fin + 0.6) : duracion;
  });
  return bs;
}

const salir = (u) => 1 - Math.pow(1 - u, 2);                           // power2.out
const rebote = (u) => { const s = 2.5; u -= 1; return u * u * ((s + 1) * u + s) + 1; }; // back.out(2.5)
const tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

// Dónde va cada palabra de un bloque (se calcula una vez por bloque). Si una línea no cabe, el bloque entero se
// hace un poco más pequeño (b.tam).
function colocar(g, b, modo) {
  if (b.sitio) return b.sitio;
  g.font = `700 ${E.tam}px ${E.letra}`;
  const anchos = b.palabras.map((w) => g.measureText(w.texto).width);
  const lineas = [];
  let i0 = 0;
  for (const n of b.lineas) { lineas.push(Array.from({ length: n }, (_, k) => i0 + k)); i0 += n; }
  const total = (l, e) => l.reduce((s, i, k) => s + anchos[i] * e + (k ? E.hueco * e : 0), 0);
  const esc = Math.min(1, ...lineas.map((l) => E.ancho / total(l, 1)));
  b.tam = E.tam * esc;
  const arriba = modo === "abajo" ? E.abajo : E.arriba, sitio = [];
  lineas.forEach((l, j) => {
    let x = E.izq + (E.ancho - total(l, esc)) / 2;
    for (const i of l) { sitio[i] = { x, w: anchos[i] * esc, y: arriba + j * E.linea * esc, tam: b.tam }; x += (anchos[i] + E.hueco) * esc; }
  });
  return (b.sitio = sitio);
}

function redondo(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}

function caja(g, s, u) {
  const sx = 0.6 + 0.4 * rebote(u), al = Math.min(1, u * 1.6);
  const q = s.tam / E.tam, l = s.x - 0.14 * s.tam, r = s.x + s.w + 0.14 * s.tam, top = s.y + 0.02 * s.tam, bot = s.y + E.linea * q + 0.04 * s.tam;
  const cx = (l + r) / 2, w = (r - l) * sx, x0 = cx - w / 2;
  g.save();
  g.globalAlpha = al;
  redondo(g, x0, top, w, bot - top, 10);
  g.fillStyle = "rgba(47,124,246,0.22)"; g.fill();
  redondo(g, x0 + 2, top + 2, w - 4, bot - top - 4, 8);
  g.strokeStyle = E.marca; g.lineWidth = 4; g.stroke();
  for (const [hx, hy] of [[x0 + 2, top + 2], [x0 + w - 2, bot - 2]]) {
    g.beginPath(); g.arc(hx, hy, 9, 0, Math.PI * 2); g.fillStyle = "#ffffff"; g.fill();
    g.beginPath(); g.arc(hx, hy, 6, 0, Math.PI * 2); g.fillStyle = E.marca; g.fill();
  }
  g.restore();
}

export function dibujarSubtitulos(g, t, bs, modo = "arriba") {
  if (modo === "no") return;
  const b = bs.find((x) => t >= x.inicio && t < x.fin);
  if (!b) return;
  const sitio = colocar(g, b, modo);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  g.textBaseline = "middle"; g.textAlign = "left"; // lo que haya dejado puesto el dibujo no cuenta

  b.palabras.forEach((w, i) => {
    const sale = w.inicio - E.anticipo, u = tramo(t, sale, sale + 0.07);
    if (u <= 0) return;
    const s = sitio[i], sig = b.palabras[i + 1], dicha = !w.clave && sig && t >= sig.inicio - E.anticipo;
    if (w.clave) caja(g, s, tramo(t, sale + 0.07, sale + 0.19));
    g.font = `${dicha ? 500 : 700} ${s.tam}px ${E.letra}`;
    const ancho = dicha ? g.measureText(w.texto).width : s.w;
    g.globalAlpha = salir(u);
    g.filter = u < 1 ? `blur(${(8 * (1 - salir(u))).toFixed(2)}px)` : "none";
    g.shadowColor = "rgba(0,0,0,0.55)"; g.shadowBlur = 14; g.shadowOffsetY = 2;
    g.fillStyle = dicha ? E.dicha : E.tinta;
    g.fillText(w.texto, s.x + (s.w - ancho) / 2, s.y + (E.linea * s.tam / E.tam) / 2);
  });
  g.restore();
}
