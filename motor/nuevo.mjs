#!/usr/bin/env node
// nuevo.mjs: crea la carpeta de un vídeo nuevo, con lo mínimo para empezar.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, argumentos, ayuda, escribirJson, fallo } from "./lib/comun.mjs";

ayuda(`
node motor/nuevo.mjs "<la idea>" [--slug nombre-corto]

Crea proyectos/<fecha>-<nombre>/ y dice su ruta:
  idea.md             la idea, lo que cuenta en una frase y los datos con su fuente (lo escribes tú)
  guion.json          las frases (las escribes tú; mira METODO.md, paso 2)
  plan.md             frase a frase, lo que se ve (lo escribes tú; paso 4)
  video/mundo.js      lo que comparten los planos (el mismo objeto, el mismo cielo, la misma cámara)
  video/planos/       un archivo por plano; empieza por 01-hook.js
  sonidos.js          los efectos (si el vídeo los lleva)
  notas.md            lo que se hizo y por qué
`);

const { sueltos, op } = argumentos();
const idea = sueltos.join(" ").trim();
if (!idea) fallo('Falta la idea: node motor/nuevo.mjs "por qué el cielo es azul"');
const slug = String(op.slug || idea).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "video";
const hoy = new Date().toISOString().slice(0, 10), dir = join(RAIZ, "proyectos", `${hoy}-${slug}`);
if (existsSync(dir)) fallo(`Ya existe ${dir}. Si es otro vídeo, dale otro --slug.`);
mkdirSync(join(dir, "video", "planos"), { recursive: true });

writeFileSync(join(dir, "idea.md"), `# ${idea}

Pedido el ${hoy}.

## Lo que cuenta, en una frase

## Los datos, cada uno con su fuente

`);
escribirJson(join(dir, "guion.json"), {
  titulo: idea, idioma: "es", subtitulos: "arriba",
  frases: [
    { texto: "", clave: "", hook: true },
    { texto: "", clave: "" },
  ],
});
writeFileSync(join(dir, "plan.md"), `# Plan: ${idea}

## Los sitios

## Frase a frase

| # | Frase (y su palabra clave) | Lo que se ve, de su primera palabra a la última | En qué palabra pasa lo fuerte | Cámara | Cómo se pasa a la siguiente |
|---|---|---|---|---|---|
`);
writeFileSync(join(dir, "video", "mundo.js"), `// Lo que comparten los planos de este vídeo: el mismo objeto, el mismo cielo, la misma cámara. Si algo sale en más
// de un plano, se hace aquí una vez, para que sea siempre la misma cosa, del mismo tamaño.
import * as k from "#kit";
import { v } from "#voz";
`);
writeFileSync(join(dir, "video", "planos", "01-hook.js"), `// «(la primera frase)»
// Lo que se ve, frase a frase, de la primera palabra a la última (lo mismo que dice plan.md).
import * as k from "#kit";
import { v } from "#voz";

export const desde = 0; // el primer plano empieza en 0; los demás, en la palabra que trae lo nuevo ("palabra" o "palabra#2")

export function dibuja(g, t) {
  // t: el segundo del vídeo. Todo se calcula desde t (nada se guarda de un fotograma al siguiente).
  // v.t("palabra"): cuándo se dice esa palabra.
  g.fillStyle = "#03050a"; g.fillRect(0, 0, 1080, 1920);
}
`);
writeFileSync(join(dir, "sonidos.js"), `// Los efectos: cada uno en lo que se mueve, en el fotograma en que se mueve (mira guia/sonido.md).
import { v } from "#voz";

const e = [];
const pon = (sonido, t, o = {}) => e.push({ sonido, t, ...o });

export default e;
`);
writeFileSync(join(dir, "notas.md"), `# ${idea}\n\nPedido el ${hoy}.\n`);
console.log(dir);
