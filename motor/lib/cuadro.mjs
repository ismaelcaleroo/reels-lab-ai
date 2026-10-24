// Dibuja el fotograma del segundo t: el plano que toca y, encima, los subtítulos.
import { createCanvas } from "@napi-rs/canvas";
import { ALTO, ANCHO } from "./comun.mjs";
import { bloques, dibujarSubtitulos } from "./subtitulos.mjs";

export const FUNDIDO = 0.3;

export function preparar(proy) {
  const lienzo = createCanvas(ANCHO, ALTO), g = lienzo.getContext("2d");
  const aparte = createCanvas(ANCHO, ALTO);
  const subs = bloques(proy.v.palabras, proy.duracion);
  const modo = proy.guion.subtitulos || "arriba";
  return { lienzo, g, aparte, subs, modo };
}

export function planoEn(proy, t) {
  const ps = proy.planos;
  let i = 0;
  while (i + 1 < ps.length && t >= ps[i + 1].desde) i++;
  return i;
}

function limpiar(g) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.filter = "none";
  g.shadowBlur = 0; g.shadowColor = "rgba(0,0,0,0)"; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
  g.setLineDash([]); g.lineCap = "butt"; g.lineJoin = "miter";
  g.fillStyle = "#000000"; g.fillRect(0, 0, ANCHO, ALTO);
}

function plano(p, g, t) {
  limpiar(g);
  g.save();
  try { p.dibuja(g, t); }
  catch (e) { e.message = `plano ${p.id}, segundo ${t.toFixed(3)}: ${e.message}`; throw e; }
  g.restore();
}

// opciones: { subtitulos: false } para verlo sin ellos.
export function dibujar(proy, est, t, opciones = {}) {
  const i = planoEn(proy, t), p = proy.planos[i];
  plano(p, est.g, t);
  if (p.entrada === "fundido" && i > 0 && t < p.desde + FUNDIDO) {
    const ga = est.aparte.getContext("2d");
    plano(proy.planos[i - 1], ga, t);
    const u = (t - p.desde) / FUNDIDO, k = u * u * (3 - 2 * u);
    // lo de antes encima, apagándose
    est.g.globalAlpha = 1 - k; est.g.drawImage(est.aparte, 0, 0); est.g.globalAlpha = 1;
  }
  if (opciones.subtitulos !== false) dibujarSubtitulos(est.g, t, est.subs, est.modo);
  return est.lienzo;
}
