#!/usr/bin/env node
// ver.mjs: enseña cualquier momento del vídeo en segundos, sin renderizarlo.
import { join } from "node:path";
import { argumentos, ayuda, carpetaProyecto, fallo } from "./lib/comun.mjs";
import { preparar } from "./lib/cuadro.mjs";
import { guardar, hoja, reparto } from "./lib/hojas.mjs";
import { abrir } from "./lib/proyecto.mjs";

ayuda(`
node motor/ver.mjs <proyecto> <qué> [--fps N] [--ancho px] [--sin-subtitulos] [--apertura nombre]

Hace una hoja de fotogramas (un .jpg en <proyecto>/revisar/) y dice dónde está. Míralo siempre: es como se ve.
  <segundo>            un fotograma grande, por ejemplo 12.4
  <a>-<b>              de a a b segundos, a --fps (10 si no dices nada), por ejemplo 9-11.5
  palabra <p>[#n]      de 0,5 s antes a 0,8 s después de esa palabra, a 30 fps (sodio, sol#2)
  frase <n>            la frase n, de su primera palabra a la última, en 8 fotogramas
  frases               todas las frases, una fila cada una (de su primera palabra a la última)
  corte <n>            el cambio de plano n: 0,6 s antes y 0,4 s después, a 30 fps
  planos               el principio, el medio y el final de cada plano
--apertura 01-tunel: lo mismo, con esa otra apertura del hook (video/aperturas/01-tunel.js en lugar del plano 01).
`);

const { sueltos, op } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
const que = sueltos.slice(1);
if (!que.length) fallo("Falta qué ver: un segundo, un tramo (9-11.5), palabra <p>, frase <n>, frases, corte <n> o planos.");
const apertura = op.apertura ? String(op.apertura) : null;
const proy = await abrir(dir, { apertura }), est = preparar(proy), v = proy.v;
const subtitulos = !op["sin-subtitulos"], ancho = Number(op.ancho || 0);
const sale = (c, nombre) => console.log(guardar(c, join(dir, "revisar", apertura ? `${apertura}-${nombre}` : nombre)));

if (que[0] === "palabra") {
  const w = v.palabra(que[1]), fps = Number(op.fps || 30);
  const ts = []; for (let t = w.inicio - 0.5; t <= w.inicio + 0.8 + 1e-6; t += 1 / fps) ts.push(t);
  sale(hoja(proy, est, ts, { ancho: ancho || 150, columnas: 10, subtitulos, titulo: `«${w.texto}» en ${w.inicio.toFixed(2)} s, a ${fps} fps` }), `palabra-${que[1].replace(/[^a-z0-9#]/gi, "")}.jpg`);
} else if (que[0] === "frase") {
  const f = v.frase(Number(que[1])), a = f.palabras[0].inicio, b = f.palabras[f.palabras.length - 1].fin;
  sale(hoja(proy, est, reparto(a, b, Number(op.n || 8)), { ancho: ancho || 200, columnas: 8, subtitulos, titulo: `Frase ${f.n}: «${f.texto}»` }), `frase-${f.n}.jpg`);
} else if (que[0] === "frases") {
  const ts = [];
  for (const f of v.frases) reparto(f.palabras[0].inicio, f.palabras[f.palabras.length - 1].fin, 6).forEach((t, i) => ts.push(i ? t : { t, marca: `${f.n}: ${t.toFixed(2)}` }));
  sale(hoja(proy, est, ts, { ancho: ancho || 150, columnas: 6, subtitulos, titulo: "Cada frase, de su primera palabra a la última" }), "frases.jpg");
} else if (que[0] === "corte") {
  const n = Number(que[1]), p = proy.planos[n];
  if (!p || n < 1) fallo(`No hay corte ${que[1]}: hay ${proy.planos.length - 1} (del 1 al ${proy.planos.length - 1}).`);
  const fps = Number(op.fps || 30), ts = [];
  for (let t = p.desde - 0.6; t < p.desde + 0.4; t += 1 / fps) ts.push(Math.abs(t - p.desde) < 0.5 / fps ? { t, marca: `${t.toFixed(2)} ${p.entrada}` } : t);
  sale(hoja(proy, est, ts, { ancho: ancho || 150, columnas: 10, subtitulos, titulo: `Corte ${n}: de ${proy.planos[n - 1].id} a ${p.id} (${p.entrada}) en ${p.desde.toFixed(2)} s` }), `corte-${n}.jpg`);
} else if (que[0] === "planos") {
  const ts = [];
  for (const p of proy.planos) reparto(p.desde + 0.02, p.hasta - 0.02, 4).forEach((t, i) => ts.push(i ? t : { t, marca: p.id.slice(0, 14) }));
  sale(hoja(proy, est, ts, { ancho: ancho || 150, columnas: 8, subtitulos, titulo: "Cada plano: principio, medio y final" }), "planos.jpg");
} else if (/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(que[0])) {
  const [a, b] = que[0].split("-").map(Number), fps = Number(op.fps || 10), ts = [];
  for (let t = a; t <= b + 1e-6; t += 1 / fps) ts.push(t);
  if (ts.length > 120) fallo(`Son ${ts.length} fotogramas: pide menos tiempo o menos fps (como mucho 120).`);
  sale(hoja(proy, est, ts, { ancho: ancho || 150, columnas: 10, subtitulos, titulo: `De ${a} a ${b} s, a ${fps} fps` }), `tramo-${a}-${b}.jpg`);
} else if (/^\d+(\.\d+)?$/.test(que[0])) {
  const t = Number(que[0]);
  sale(hoja(proy, est, [t], { ancho: ancho || 540, columnas: 1, subtitulos }), `en-${t}.jpg`);
} else fallo(`No sé ver «${que.join(" ")}». Mira node motor/ver.mjs --ayuda`);
