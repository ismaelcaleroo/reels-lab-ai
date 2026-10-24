#!/usr/bin/env node
// render.mjs: el vídeo de verdad, con su voz y sus efectos.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { basename, join } from "node:path";
import { Worker } from "node:worker_threads";
import { RAIZ, argumentos, ayuda, carpetaProyecto, escribirWav, fallo, ffmpeg, leerAudio } from "./lib/comun.mjs";
import { SR } from "./lib/mezcla.mjs";
import { abrir } from "./lib/proyecto.mjs";
import { saltos } from "./lib/saltos.mjs";

ayuda(`
node motor/render.mjs <proyecto> [--borrador] [--desde s] [--hasta s] [--apertura nombre] [--salida archivo.mp4] [--hilos N]

Sin nada: el vídeo final, a 60 fps, en salida/<proyecto>/, con su portada (portada.jpg) y el texto del post
(caption.txt, de pie.txt). Al acabar dice los saltos sueltos que encuentre: míralos con ver.mjs.
--borrador: a 30 fps y más rápido, en <proyecto>/revisar/borrador.mp4, para verlo en movimiento.
--desde y --hasta: solo ese tramo (con --borrador, para enseñar el hook: --hasta 10).
--apertura 01-tunel: con --borrador, el hook con la otra apertura (video/aperturas/01-tunel.js en lugar del plano 01),
  en <proyecto>/revisar/borrador-01-tunel.mp4. Solo con la voz: los efectos que haya son los de la otra apertura.
La voz y los efectos se mezclan como en los vídeos que funcionaron (los efectos, por debajo de la voz) y a su volumen.
`);

const VOLUMEN = -21;      // LUFS del vídeo (en estéreo), el de los vídeos aprobados; la voz y los efectos, 1 a 1
const { sueltos, op } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
const apertura = op.apertura ? String(op.apertura) : null;
if (apertura && !op.borrador) fallo("--apertura es para enseñar el hook: úsalo con --borrador.");
const proy = await abrir(dir, { apertura });
const borrador = !!op.borrador, fps = Number(op.fps || (borrador ? 30 : 60));
const desde = Math.max(0, Number(op.desde || 0)), hasta = Math.min(proy.duracion, Number(op.hasta || proy.duracion));
const primero = Math.round(desde * fps), ultimo = Math.round(hasta * fps);
const nombre = basename(dir);
const salida = op.salida ? String(op.salida) : borrador ? join(dir, "revisar", apertura ? `borrador-${apertura}.mp4` : "borrador.mp4") : join(RAIZ, "salida", nombre, `${nombre}.mp4`);
const tmp = join(dir, "revisar", ".render");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
mkdirSync(join(salida, ".."), { recursive: true });

// --- la imagen, en trozos, cada uno en un hilo
const nh = Math.max(1, Math.min(Number(op.hilos || Math.min(8, cpus().length - 1)), Math.ceil((ultimo - primero) / 60)));
const t0 = Date.now(), total = ultimo - primero, hechos = new Array(nh).fill(0);
let avisado = 0;
const trozos = [];
for (let i = 0; i < nh; i++) {
  const a = primero + Math.floor((total * i) / nh), b = primero + Math.floor((total * (i + 1)) / nh), seg = join(tmp, `trozo-${String(i).padStart(2, "0")}.mp4`);
  const w = new Worker(new URL("./lib/hilo.mjs", import.meta.url), { workerData: { dir, primero: a, ultimo: b, fps, salida: seg, calidad: borrador ? "borrador" : "final", apertura } });
  trozos.push({ seg, fin: new Promise((ok, mal) => {
    w.on("message", (m) => {
      hechos[i] = m.hechos;
      const pct = Math.floor((100 * hechos.reduce((x, y) => x + y, 0)) / total);
      if (pct >= avisado + 20) { avisado = pct - (pct % 20); console.log(`  ${avisado} %`); }
      if (m.fin) ok();
    });
    w.on("error", mal);
    w.on("exit", (c) => (c ? mal(new Error(`el hilo ${i} acabó con ${c}`)) : ok()));
  }) });
}
await Promise.all(trozos.map((x) => x.fin));
const lista = join(tmp, "lista.txt");
writeFileSync(lista, trozos.map((x) => `file '${x.seg.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n") + "\n");
const imagen = join(tmp, "imagen.mp4");
ffmpeg(["-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", imagen]);

// --- el sonido: la voz y los efectos, a su volumen
const voz = leerAudio(join(dir, "voz", "voz.wav"), SR), fx = join(dir, "sonidos", "efectos.wav");
const efectos = existsSync(fx) && !apertura ? leerAudio(fx, SR) : null;
const a0 = Math.round(desde * SR), a1 = Math.min(voz.length, Math.round(hasta * SR)), mezcla = new Float32Array(Math.max(0, a1 - a0));
for (let i = 0; i < mezcla.length; i++) mezcla[i] = voz[a0 + i] + (efectos ? efectos[a0 + i] || 0 : 0);
const crudo = join(tmp, "sonido.wav");
escribirWav(crudo, mezcla, SR);
// lo fuerte que suena en estéreo (el mismo sonido a los dos lados, sin bajarlo), en LUFS integrados; ffmpeg lo escribe
// al final de su salida de errores
const ESTEREO = "pan=stereo|c0=c0|c1=c0";
let lufs = VOLUMEN;
const medida = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", crudo, "-af", `${ESTEREO},ebur128`, "-f", "null", "-"], { encoding: "utf8" });
const I = [...String(medida.stderr).matchAll(/I:\s+(-?\d+(\.\d+)?) LUFS/g)].pop();
if (I) lufs = Number(I[1]);
const ganancia = Math.max(-12, Math.min(18, VOLUMEN - lufs));
ffmpeg(["-i", imagen, "-i", crudo, "-filter_complex", `[1:a]${ESTEREO},volume=${ganancia.toFixed(2)}dB,alimiter=limit=0.89:level=false[a]`, "-map", "0:v", "-map", "[a]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", salida]);
rmSync(tmp, { recursive: true, force: true });
const seg = ((Date.now() - t0) / 1000).toFixed(0);
console.log(`${salida} (${(hasta - desde).toFixed(2)} s, ${fps} fps, ${total} fotogramas, ${nh} hilos, ${seg} s)`);

if (!borrador && !op.desde && !op.hasta) {
  const portada = join(salida, "..", "portada.jpg");
  ffmpeg(["-ss", String(Math.min(1, proy.duracion / 2)), "-i", salida, "-frames:v", "1", "-q:v", "2", portada]);
  console.log(portada);
  if (existsSync(join(dir, "pie.txt"))) { copyFileSync(join(dir, "pie.txt"), join(salida, "..", "caption.txt")); console.log(join(salida, "..", "caption.txt")); }
}
// --- los saltos: dónde mirar
if (!borrador) {
  const cortes = proy.planos.slice(1).map((p) => p.desde);
  const s = saltos(salida, fps, cortes);
  const raros = s.sueltos.filter((x) => !x.enCorte);
  if (raros.length) console.log(`Saltos sueltos fuera de los cortes (míralos con ver.mjs; si no son un fogonazo o un choque buscado, arréglalos): ${raros.map((x) => (desde + x.t).toFixed(2)).join(", ")} s`);
  if (s.repetidos.length) console.log(`Fotogramas repetidos en pleno movimiento (un tirón): ${s.repetidos.map((t) => (desde + t).toFixed(2)).join(", ")} s`);
}
