#!/usr/bin/env node
// doctor.mjs: mira la máquina y dice una línea por cosa: ok, o qué falta. Lo que falta lo instala la IA; lo único del
// creador es pegar su clave en la página de la clave.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statfsSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, cargarClaves } from "./lib/comun.mjs";

const lineas = [];
const ok = (q, t) => lineas.push(`ok    ${q.padEnd(13)} ${t}`);
const mal = (q, t) => lineas.push(`falta ${q.padEnd(13)} ${t}`);
const aviso = (q, t) => lineas.push(`aviso ${q.padEnd(13)} ${t}`);
const win = process.platform === "win32";

const node = Number(process.versions.node.split(".")[0]);
node >= 20 ? ok("node", process.versions.node) : mal("node", `hace falta Node 20 o más (hay ${process.versions.node}): instálalo (${win ? "winget install OpenJS.NodeJS.LTS" : "brew install node"})`);

const ff = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }), fp = spawnSync("ffprobe", ["-version"], { encoding: "utf8" });
ff.status === 0 && fp.status === 0 ? ok("ffmpeg", (ff.stdout.split("\n")[0] || "").slice(0, 60))
  : mal("ffmpeg", `instálalo: ${win ? "winget install Gyan.FFmpeg (y abre una terminal nueva)" : process.platform === "darwin" ? "brew install ffmpeg" : "sudo apt install ffmpeg"}`);

const lienzo = join(RAIZ, "node_modules", "@napi-rs", "canvas");
if (!existsSync(lienzo)) mal("dibujo", "falta lo de dibujar: npm install (en esta carpeta)");
else {
  // la versión que pide package.json (las antiguas no saben sumar luz: "lighter" no hace nada)
  const quiere = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")).dependencies["@napi-rs/canvas"];
  const tiene = JSON.parse(readFileSync(join(lienzo, "package.json"), "utf8")).version;
  tiene === quiere ? ok("dibujo", `@napi-rs/canvas ${tiene}`) : mal("dibujo", `está la versión ${tiene} y hace falta la ${quiere}: npm install (en esta carpeta)`);
}

const letras = ["Medium", "Bold", "ExtraBold"].every((p) => existsSync(join(RAIZ, "letra", `Figtree-${p}.ttf`)) && existsSync(join(RAIZ, "letra", `GoogleSans-${p}.ttf`)));
letras ? ok("letra", "Google Sans") : mal("letra", "faltan las letras de letra/: vuelve a copiar la carpeta entera");

cargarClaves();
process.env.ELEVENLABS_API_KEY ? ok("voz", "clave de ElevenLabs puesta") : mal("voz", "sin clave de ElevenLabs: node motor/clave.mjs abre la página para pegarla (nunca en el chat)");

try { const s = statfsSync(RAIZ), gb = (s.bavail * s.bsize) / 1e9; gb > 2 ? ok("disco", `${gb.toFixed(0)} GB libres`) : mal("disco", `quedan ${gb.toFixed(1)} GB; hacen falta unos 2`); } catch { /* sin dato de disco */ }

const pref = join(RAIZ, "preferencias.md");
existsSync(pref) && readFileSync(pref, "utf8").replace(/^#.*$/gm, "").trim() ? ok("preferencias", "guardadas") : aviso("preferencias", "aún no hay: se preguntan una vez, antes del primer vídeo");

console.log(lineas.join("\n"));
process.exit(lineas.some((l) => l.startsWith("falta")) ? 1 : 0);
