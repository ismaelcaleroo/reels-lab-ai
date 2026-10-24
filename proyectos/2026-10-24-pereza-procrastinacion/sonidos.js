// Los efectos: cada uno en lo que se mueve, en el fotograma en que se mueve (guia/sonido.md).
// En esta copia faltan aire, aprieta y aviso: los movimientos de cámara van con «sube» suave.
// «late» es el sello del miedo: suena cada vez que aparece.
import { v } from "#voz";
import { momentos as m1 } from "./video/planos/01-cuarto.js";
import { momentos as m2, tictac } from "./video/planos/02-aula.js";
import { momentos as m3 } from "./video/planos/03-pinchazo.js";
import { momentos as m4 } from "./video/planos/04-autopista.js";
import { momentos as m5 } from "./video/planos/05-nombre.js";
import { momentos as m6 } from "./video/planos/06-remate.js";

const e = [];
const pon = (sonido, t, o = {}) => e.push({ sonido, t, ...o });
const f = (n) => v.frase(n);

// ── 1. El cuarto ──
pon("tic", 0.35, { db: -16, lp: 6000, que: "teclea" });
pon("tic", 0.8, { db: -17, lp: 6000, que: "teclea" });
pon("toque", f(1).t("importante") + 0.1, { db: -14, que: "late la página" });
pon("late", m1.rendija, { db: -12, que: "luz roja por la rendija" });
pon("madera", m1.levanta, { db: -14, que: "se levanta de la silla" });
pon("empujon", m1.portazo + 0.1, { db: -7, que: "las puertas revientan" });
pon("sube", m1.portazo + 0.15, { ancla: "empieza", db: -13, vel: 1.1, que: "la ropa sale volando" });
m1.camisas.forEach((t, i) => { if (i % 2 === 0) pon("enganche", t, { db: -16 - (i % 3), vel: 0.9 + (i % 4) * 0.07, que: "una percha" }); });
[0.6, 1.2, 1.8].forEach((d, i) => pon("papel", m1.portazo + d, { db: -16 - i, vel: 1.1 + i * 0.1, que: "cae ropa" }));
pon("clic", f(2).t("colores") + 0.05, { db: -11, que: "arcoíris completo" });
m1.bolas.forEach((t, i) => pon(i === 2 ? "pelota" : "papel", t + 0.3, { db: i === 2 ? -13 : -16, vel: 1.2, que: "una bolita de calcetines" }));
pon("late", m1.ojos, { db: -11, que: "parpadean los ojos rojos" });
pon("sube", m1.entra, { ancla: "empieza", db: -15, vel: 0.55, que: "la cámara entra en el armario" });
pon("late", m1.entra + 0.6, { db: -10, que: "el miedo, acechando" });
pon("late", m1.entra + 2.0, { db: -13, que: "el miedo respira" });
pon("cruje", m1.acecha + 0.05, { db: -16, vel: 1.3, que: "entorna los ojos" });

// ── 2. El aula ──
tictac.forEach((t, i) => pon("tic", t, { db: -20 + Math.min(4, i * 0.25), lp: 7000, vel: 1.1, que: "el segundero" }));
m2.nubes.forEach((t) => pon("sube", t, { ancla: "empieza", db: -15, vel: 0.7, que: "entra una nube" }));
m2.examenes.forEach((t) => pon("papel", t + 0.3, { db: -13, que: "cae el examen" }));
pon("toque", m2.movil, { db: -13, que: "el móvil" });
pon("sube", m2.avion + 0.1, { ancla: "empieza", db: -14, vel: 1.2, que: "el avión de papel" });
pon("madera", m2.siesta + 0.25, { db: -16, que: "la cabeza en el pupitre" });
pon("pitido", m2.alarma, { db: -12, que: "último minuto" });
pon("sube", f(7).t("otros") - 0.05, { ancla: "empieza", db: -17, vel: 0.6, que: "la cámara cruza" });
pon("cruje", m2.congela + 0.05, { db: -12, que: "se congela" });
pon("cristal", m2.congela + 0.35, { db: -11, que: "hielo" });
m2.toques.forEach((t, i) => pon("cristal", t, { db: -12 - i, vel: 1.15 + i * 0.1, que: "toca la nube helada: no cambia" }));
for (let q = 0; q < 3; q++) pon("tic", m2.estudia + 0.1 + q * 0.26, { db: -18, lp: 6000, vel: 0.9 + q * 0.1, que: "escribe" });
pon("sube", f(9).inicio + 0.05, { ancla: "empieza", db: -17, vel: 0.6, que: "vuelve a la izquierda" });
pon("golpe", m2.cae + 0.15, { db: -15, lp: 1400, que: "la nube le cae encima" });
pon("late", m2.asoma + 0.05, { db: -9, que: "asoma el miedo" });

// ── 3. El pinchazo ──
pon("toque", m3.abre, { db: -13, que: "abre el documento" });
pon("empujon", m3.pinchazo, { db: -8, que: "el pinchazo" });
pon("golpe-hondo", m3.pinchazo + 0.04, { db: -13, lp: 1400, que: "le da en el pecho" });
pon("late", m3.asoma, { db: -10, que: "el miedo con la camiseta" });
pon("madera", m3.levanta + 0.1, { db: -15, que: "se levanta" });
pon("desliza", m3.dobla, { db: -14, que: "dobla la camiseta" });
pon("cristal", m3.alivio, { db: -12, vel: 0.85, que: "alivio" });
pon("papel", m3.alivio + 0.8, { db: -15, que: "deja la camiseta doblada" });
pon("sube", f(11).inicio + 0.1, { ancla: "empieza", db: -17, vel: 0.6, que: "vista desde arriba" });

// ── 4. La autopista ──
pon("clic", m4.premio, { db: -10, que: "el premio" });
pon("cristal", m4.premio + 0.05, { db: -14, vel: 1.2, que: "destello dorado" });
m4.pasos.forEach((t, i) => pon("desliza", t + 0.05, { db: -15 - (i % 2), vel: 1 + i * 0.08, que: "otro viaje" }));
pon("metal", m4.autopista + 0.02, { db: -12, que: "asfalto" });
pon("sube", m4.sube, { ancla: "empieza", db: -13, vel: 0.6, que: "la cámara sube: un cerebro" });

// ── 5. El nombre ──
[1.4, 0.85, 0.3].forEach((d) => pon("madera", m5.para - d, { db: -19, vel: 1.4, que: "un paso" }));
pon("clic", m5.para + 0.05, { db: -13, que: "se para en seco" });
pon("desliza", m5.abren, { db: -13, que: "se abren las puertas" });
pon("late", m5.abren + 0.35, { db: -10, que: "el miedo en el estante" });
pon("papel", m5.pega, { db: -11, que: "le pega la etiqueta" });
pon("clic", m5.pega + 0.12, { db: -14, que: "pegada" });
pon("late", m5.pega + 1.4, { db: -13, vel: 1.05, que: "el miedo, asustado" });
pon("late", m5.encoge, { db: -16, vel: 0.8, que: "el miedo, más bajo" });
pon("sube", m5.encoge + 0.1, { ancla: "empieza", db: -16, reves: true, que: "se encoge" });
pon("madera", m5.sienta + 0.2, { db: -16, que: "se sienta" });
pon("toque", m5.abre, { db: -13, que: "abre el documento" });
pon("tic", m5.pinchito, { db: -16, que: "el pinchazo se queda corto" });
for (let q = 0; q < 4; q++) pon("tic", m5.escribe + q * 0.2, { db: -18, lp: 6000, vel: 0.9 + (q % 3) * 0.1, que: "teclea" });

// ── 6. Remate y cierre ──
pon("sube", f(14).inicio + 0.05, { ancla: "empieza", db: -18, vel: 0.5, que: "la cámara se acerca al armario" });
pon("empujon", m6.abre + 0.1, { db: -7, que: "las puertas se abren de golpe" });
pon("late", m6.abre + 0.2, { db: -9, que: "el miedo, doblando" });
pon("pitido", m6.pillado, { db: -14, vel: 1.3, que: "¡pillado!" });
pon("sube", m6.sale, { ancla: "empieza", db: -15, vel: 0.6, que: "la cámara sale" });
pon("enganche", m6.saluda, { db: -17, que: "el miedo saluda" });
pon("clic", m6.brilla + 0.3, { db: -11, que: "impecable" });
for (let q = 0; q < 4; q++) pon("tic", f(15).t("proyecto") + q * 0.22, { db: -19, lp: 6000, que: "sigue tecleando" });

export default e;
