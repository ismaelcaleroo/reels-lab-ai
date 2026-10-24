#!/usr/bin/env node
// voz.mjs: la voz del vídeo, de una sola toma, como habla una persona, y el segundo exacto de cada palabra.
import { createHash } from "node:crypto";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { argumentos, ayuda, cargarClaves, carpetaProyecto, escribirJson, fallo, ffmpeg, leerAudio, leerJson, r3 } from "./lib/comun.mjs";
import { clave } from "./lib/voz-actual.js";

ayuda(`
node motor/voz.mjs <proyecto> [--rehacer]

Lee las frases de guion.json y hace, con ElevenLabs:
  voz/voz.wav        la voz entera, tal cual sale: nunca se corta ni se acortan sus pausas
  voz/tiempos.json   cuándo empieza y acaba cada frase y cada palabra
e imprime cada frase con el segundo de sus palabras, para planear el vídeo con ellas.
Si las frases y los ajustes no han cambiado, no vuelve a pedir la voz (cuesta dinero). --rehacer la pide otra vez.
Ajustes en guion.json, "voz": { "id", "modelo", "estabilidad", "similitud", "estilo", "velocidad" }.
`);

const COLA = 0.8; // silencio al final, para que la última imagen respire
const { sueltos, op } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
const guion = leerJson(join(dir, "guion.json"));
const frases = guion.frases || fallo("guion.json no tiene «frases».");
const V = { id: "851ejYcv2BoNPjrkw93G", modelo: "eleven_v4", estabilidad: 0.35, similitud: 0.7, estilo: 0, velocidad: 1, ...(guion.voz || {}) };
const dichos = frases.map((f) => String(f.dicho || f.texto).trim());
const firma = createHash("sha1").update(JSON.stringify([V, dichos])).digest("hex").slice(0, 12);
const ftoma = join(dir, "voz", "toma.json"), wtoma = join(dir, "voz", "toma.wav");
const palabrasDe = (s) => s.split(/\s+/).filter((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length);

let toma = existsSync(ftoma) && existsSync(wtoma) ? leerJson(ftoma) : null;
if (!toma || toma.firma !== firma || op.rehacer) {
  cargarClaves();
  const KEY = process.env.ELEVENLABS_API_KEY;
  if (!KEY) fallo("No hay clave de ElevenLabs. Ábrele la página para pegarla: node motor/clave.mjs (nunca se la pidas en el chat).");
  const cuerpo = {
    text: dichos.join(" "), model_id: V.modelo,
    voice_settings: { stability: V.estabilidad, similarity_boost: V.similitud, style: V.estilo, speed: V.velocidad, use_speaker_boost: true },
  };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${V.id}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(cuerpo),
  });
  if (!r.ok) fallo(`ElevenLabs dijo ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  const mp3 = join(dir, "voz", "toma.mp3");
  escribirJson(ftoma, { pendiente: true });
  writeFileSync(mp3, Buffer.from(j.audio_base64, "base64"));
  ffmpeg(["-i", mp3, "-ar", "48000", "-ac", "1", wtoma]);
  rmSync(mp3);
  // de letras a palabras
  const a = j.alignment || j.normalized_alignment, ws = [];
  let cur = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) ws.push(cur); cur = null; return; }
    if (!cur) cur = { texto: "", inicio: a.character_start_times_seconds[i] };
    cur.texto += ch; cur.fin = a.character_end_times_seconds[i];
  });
  if (cur) ws.push(cur);
  toma = { firma, proveedor: "elevenlabs", ajustes: V, palabras: ws.filter((w) => w.texto.replace(/[^\p{L}\p{N}]/gu, "").length) };
  escribirJson(ftoma, toma);
}

// La toma, tal cual. Solo se quita el silencio del principio (si de verdad es silencio) y se deja una cola al final.
const audio = leerAudio(wtoma, 48000), SR = 48000;
const ws = toma.palabras;
let quitar = Math.max(0, ws[0].inicio - 0.06);
if (quitar > 0) {
  let pico = 0;
  for (let i = 0; i < Math.floor(quitar * SR); i++) pico = Math.max(pico, Math.abs(audio[i]));
  if (20 * Math.log10(pico + 1e-9) > -45) quitar = 0; // ahí ya suena algo: no se toca
}
const fin = ws[ws.length - 1].fin - quitar, total = r3(Math.max(fin + COLA, audio.length / SR - quitar));
ffmpeg(["-i", wtoma, "-af", `atrim=start=${quitar.toFixed(3)},asetpts=N/SR/TB,apad,atrim=0:${total}`, "-ar", "48000", "-ac", "1", join(dir, "voz", "voz.wav")]);

// Lo que se lee y lo que se dice, palabra a palabra. Las que coinciden se quedan con su segundo de verdad; solo lo que
// se lee distinto de como se dice («IA» dicho «i a», «4.000» dicho «cuatro mil») toma el tramo de lo que se dijo en su
// lugar, repartido por letras. (Repartir la frase entera por letras movía todas sus palabras hasta 0,3 s.)
function alinear(escritas, oidas) {
  const E = escritas.map(clave), O = oidas.map((w) => clave(w.texto)), n = E.length, m = O.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = E[i] === O[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const pares = [];
  for (let i = 0, j = 0; i < n && j < m;) {
    if (E[i] === O[j]) { pares.push([i, j]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  pares.push([n, m]);
  const out = new Array(n);
  let i0 = 0, j0 = 0;
  for (const [i1, j1] of pares) {
    if (i1 > i0) {
      // lo que se lee entre dos palabras que coinciden, en el tramo de lo que se dijo entre ellas
      const a = j1 > j0 ? oidas[j0].inicio : j0 > 0 ? oidas[j0 - 1].fin : oidas[0].inicio, b = j1 > j0 ? oidas[j1 - 1].fin : a;
      const pesos = escritas.slice(i0, i1).map((w) => Math.max(2, w.length + 1)), tot = pesos.reduce((x, y) => x + y, 0);
      let t = a;
      pesos.forEach((p, q) => { const d = ((b - a) * p) / tot; out[i0 + q] = [t, t + d]; t += d; });
    }
    if (i1 < n) out[i1] = [oidas[j1].inicio, oidas[j1].fin];
    i0 = i1 + 1; j0 = j1 + 1;
  }
  return out;
}

// Las palabras de cada frase, por cuántas palabras tiene lo que se dice.
const pal = [], fs = [];
let k = 0;
frases.forEach((f, i) => {
  const dichas = palabrasDe(dichos[i]), escritas = palabrasDe(f.texto), oidas = ws.slice(k, k + dichas.length);
  k += dichas.length;
  if (!oidas.length) fallo(`La frase ${i + 1} no aparece en la voz: rehaz la voz con --rehacer.`);
  const a = oidas[0].inicio - quitar, b = oidas[oidas.length - 1].fin - quitar;
  const tiempos = alinear(escritas, oidas).map(([x, y]) => [x - quitar, y - quitar]);
  escritas.forEach((w, j) => pal.push({ texto: w, inicio: r3(tiempos[j][0]), fin: r3(tiempos[j][1]), frase: i + 1, clave: !!f.clave && clave(w) === clave(f.clave) }));
  fs.push({ n: i + 1, texto: f.texto, clave: f.clave || null, inicio: r3(a), fin: r3(b) });
});
if (k !== ws.length) console.log(`  aviso: la voz tiene ${ws.length} palabras y las frases ${k}; si algo no cuadra, revisa «dicho» en guion.json.`);
for (const f of fs) if (f.clave && !pal.some((w) => w.frase === f.n && w.clave)) console.log(`  aviso: la clave «${f.clave}» no está en la frase ${f.n}.`);
escribirJson(join(dir, "voz", "tiempos.json"), { firma, duracion: total, frases: fs, palabras: pal });

console.log(`voz: ${join(dir, "voz", "voz.wav")} (${total.toFixed(2)} s, ${fs.length} frases, ${pal.length} palabras)`);
for (const f of fs) {
  const ps = pal.filter((w) => w.frase === f.n);
  console.log(`${String(f.n).padStart(2)} ${f.inicio.toFixed(2).padStart(6)}–${f.fin.toFixed(2).padEnd(6)} ${ps.map((w) => `${w.texto}@${w.inicio.toFixed(2)}`).join(" ")}`);
}
// Lo raro, para que lo mires (no se arregla cortando la voz: se cambia la frase y se rehace).
for (let i = 1; i < pal.length; i++) {
  const hueco = pal[i].inicio - pal[i - 1].fin;
  if (hueco > 1.1) console.log(`  aviso: ${hueco.toFixed(1)} s de silencio entre «${pal[i - 1].texto}» y «${pal[i].texto}».`);
}
