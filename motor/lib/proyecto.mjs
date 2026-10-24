// Abre un proyecto para dibujarlo: su guion, su voz (cuándo se dice cada palabra) y sus planos.
//
// Un plano es un archivo de video/planos/ que exporta:
//   desde     cuándo empieza: una palabra ("sodio", "sol#2"), un número de segundos o una función que lo calcula.
//             El primero empieza en 0. Cada plano dura hasta que empieza el siguiente.
//   entrada   cómo se entra en él desde el anterior: "corte" (lo normal: otro sitio), "sigue" (el mismo sitio y la
//             misma cámara: no se ve ningún cambio) o "fundido" (un fundido de 0,3 s).
//   dibuja(g, t)   dibuja el fotograma del segundo t del vídeo (no del plano) en el lienzo g, de 1080 × 1920.
// Los planos se ordenan por cuándo empiezan, no por su nombre.
//
// Una apertura es otra versión de un plano del hook, en video/aperturas/, con el mismo número que el plano al que
// sustituye (aperturas/01-tunel.js en lugar de planos/01-fiesta.js). abrir(dir, { apertura: "01-tunel" }) la usa.
import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { fallo, leerJson } from "./comun.mjs";
import { llenar, v } from "./voz-actual.js";

export const ADELANTO = 0.04; // la imagen nueva llega dos fotogramas antes que su palabra: así se ve cuando se oye

export async function abrir(dir, { apertura = null } = {}) {
  const guion = leerJson(join(dir, "guion.json"));
  const ft = join(dir, "voz", "tiempos.json");
  if (!existsSync(ft)) fallo(`Este proyecto aún no tiene voz: node motor/voz.mjs ${dir}`);
  const tiempos = leerJson(ft);
  llenar(tiempos);
  const carpeta = join(dir, "video", "planos");
  if (!existsSync(carpeta)) fallo(`Este proyecto aún no tiene planos: crea ${carpeta} con un archivo por plano.`);
  let archivos = readdirSync(carpeta).filter((f) => /\.m?js$/.test(f)).sort().map((f) => join(carpeta, f));
  if (apertura) {
    const otra = [".js", ".mjs"].map((x) => join(dir, "video", "aperturas", apertura + x)).find((r) => existsSync(r));
    if (!otra) fallo(`No hay ninguna apertura «${apertura}» en ${join(dir, "video", "aperturas")}.`);
    const num = apertura.match(/^(\d+)-/)?.[1];
    if (!num) fallo(`La apertura «${apertura}» tiene que empezar por el número del plano al que sustituye (01-...).`);
    archivos = archivos.filter((a) => !basename(a).startsWith(num + "-")).concat(otra);
  }
  const planos = [];
  for (const ruta of archivos) {
    const f = basename(ruta);
    let m;
    try { m = await import(pathToFileURL(ruta).href); }
    catch (e) { fallo(`El plano ${f} no se puede cargar:\n${e.stack || e}`); }
    if (typeof m.dibuja !== "function") fallo(`El plano ${f} no exporta dibuja(g, t).`);
    let desde;
    try { desde = cuando(m.desde ?? 0); }
    catch (e) { fallo(`El plano ${f}: ${e.message}`); }
    const entrada = m.entrada || "corte";
    if (!["corte", "sigue", "fundido"].includes(entrada)) fallo(`El plano ${f}: entrada «${entrada}» no existe (corte, sigue o fundido).`);
    planos.push({ id: f.replace(/\.m?js$/, ""), desde, entrada, dibuja: m.dibuja, desdeDicho: m.desde });
  }
  if (!planos.length) fallo(`No hay ningún plano en ${carpeta}.`);
  planos.sort((a, b) => a.desde - b.desde);
  planos[0].desde = 0;
  for (let i = 1; i < planos.length; i++) if (planos[i].desde - planos[i - 1].desde < 0.2)
    fallo(`Los planos ${planos[i - 1].id} y ${planos[i].id} empiezan casi a la vez (${planos[i - 1].desde.toFixed(2)} y ${planos[i].desde.toFixed(2)} s).`);
  planos.forEach((p, i) => (p.hasta = i + 1 < planos.length ? planos[i + 1].desde : v.duracion));
  return { dir, guion, v, planos, duracion: v.duracion };
}

// Una palabra, un número o una función → segundos del vídeo.
function cuando(d) {
  if (typeof d === "number") return d;
  if (typeof d === "function") return d(v);
  if (typeof d === "string") return Math.max(0, v.t(d) - ADELANTO);
  throw new Error(`desde tiene que ser una palabra, un número o una función (es ${typeof d}).`);
}
