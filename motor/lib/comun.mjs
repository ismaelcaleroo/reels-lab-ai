// Lo que comparten las herramientas: la carpeta, los argumentos, los errores, ffmpeg y las claves.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Las letras, lo primero de todo y en cada hilo: si algo dibuja antes de registrarlas, el render no las encuentra y
// pone otra (sin «í» y con otras medidas: subtítulos con cuadrados y palabras pegadas).
import { GlobalFonts } from "@napi-rs/canvas";
for (const [familia, archivo] of [["Figtree", "Figtree"], ["Google Sans", "GoogleSans"]])
  for (const p of ["Medium", "Bold", "ExtraBold"]) GlobalFonts.registerFromPath(join(RAIZ, "letra", `${archivo}-${p}.ttf`), familia);
export const ANCHO = 1080, ALTO = 1920;

export function fallo(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// node motor/x.mjs <proyecto> [resto] [--clave valor] [--bandera]
export function argumentos() {
  const a = process.argv.slice(2), sueltos = [], op = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith("--")) {
      const k = a[i].slice(2);
      if (i + 1 < a.length && !a[i + 1].startsWith("--")) op[k] = a[++i];
      else op[k] = true;
    } else sueltos.push(a[i]);
  }
  return { sueltos, op };
}

export function ayuda(texto) {
  if (process.argv.includes("--ayuda") || process.argv.includes("--help")) { console.log(texto.trim()); process.exit(0); }
}

// El proyecto: una ruta, o el nombre de una carpeta de proyectos/ (o el principio de su nombre).
export function carpetaProyecto(nombre) {
  if (!nombre) fallo("Falta el proyecto: la carpeta del vídeo, por ejemplo proyectos/2026-10-20-cielo-azul");
  for (const c of [resolve(nombre), join(RAIZ, "proyectos", nombre), join(RAIZ, nombre)]) if (existsSync(join(c, "guion.json"))) return c;
  fallo(`No encuentro el proyecto «${nombre}» (una carpeta con guion.json).`);
}

export const leerJson = (f) => JSON.parse(readFileSync(f, "utf8"));
export const escribirJson = (f, d) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(d, null, 2) + "\n"); };
export const r3 = (x) => Math.round(x * 1000) / 1000;

export function ffmpeg(args, opciones = {}) {
  try {
    return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { maxBuffer: 1 << 30, ...opciones });
  } catch (e) {
    fallo(`ffmpeg falló: ${String(e.stderr || e.message).slice(-600)}`);
  }
}

export function duracion(archivo) {
  const s = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", archivo]).toString();
  return Number(s.trim());
}

// Audio a muestras: mono, float, a la frecuencia pedida.
export function leerAudio(archivo, sr = 48000) {
  const b = execFileSync("ffmpeg", ["-v", "error", "-i", archivo, "-f", "f32le", "-ac", "1", "-ar", String(sr), "-"], { maxBuffer: 1 << 30 });
  const ab = new ArrayBuffer(b.length);
  new Uint8Array(ab).set(b);
  return new Float32Array(ab);
}

// Un wav mono de 16 bits. (Mono a propósito: al leer un estéreo con L = R como mono, ffmpeg le suma 3 dB.)
export function escribirWav(ruta, mono, sr = 48000) {
  const n = mono.length, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mono[i])) * 32767), 44 + i * 2);
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, buf);
}

// Las claves viven en .env.local (las escribe motor/clave.mjs). Nunca se enseñan ni se copian a ningún sitio.
export function cargarClaves() {
  const f = join(RAIZ, ".env.local");
  if (!existsSync(f)) return;
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// Un proceso de ffmpeg al que se le van pasando fotogramas (RGBA, 1080 × 1920) y que escribe un mp4.
export function codificador(salida, fps, calidad = "final") {
  const crf = calidad === "final" ? "16" : "23", preset = calidad === "final" ? "medium" : "veryfast";
  const p = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${ANCHO}x${ALTO}`, "-r", String(fps), "-i", "-",
    "-c:v", "libx264", "-preset", preset, "-crf", crf, "-pix_fmt", "yuv420p", "-g", String(fps * 2), "-movflags", "+faststart", salida], { stdio: ["pipe", "ignore", "pipe"] });
  let err = "";
  p.stderr.on("data", (d) => (err += d));
  const fin = new Promise((ok, mal) => p.on("close", (c) => (c === 0 ? ok() : mal(new Error("ffmpeg: " + err.slice(-500))))));
  return {
    async escribe(buf) { if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once("drain", r)); },
    async cierra() { p.stdin.end(); await fin; },
  };
}
