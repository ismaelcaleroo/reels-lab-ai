// Los efectos: cada uno en lo que se mueve, en el fotograma en que se mueve (guia/sonido.md).
// (aire, aprieta y aviso no están en sonidos/ de esta copia: los movimientos de cámara van con «sube» suave.)
import { v } from "#voz";
import { camisas, pilas, portazo, brilla as brillaArmario, jarra, acerca } from "./video/planos/01-armario.js";
import { caenNubes, caenExamenes, avion, hielo, tictac, golpecitos } from "./video/planos/02-aula.js";
import { pinchazo, levanta, deshace, viajes } from "./video/planos/03-escritorio.js";
import { llegaNube, empuja } from "./video/planos/04-pereza.js";
import { apartan, brilla as brillaFinal } from "./video/planos/05-pregunta.js";

const e = [];
const pon = (sonido, t, o = {}) => e.push({ sonido, t, ...o });
const f = (n) => v.frase(n);

// ── 1. El armario ──
pon("empujon", portazo, { db: -7, que: "las puertas revientan" });
camisas.forEach((t, i) => pon("enganche", t, { db: i % 2 ? -17 : -15, vel: 0.9 + (i % 3) * 0.08, que: "una percha en la barra" }));
pilas.forEach((t, j) => { pon("papel", t + 0.1, { db: -13, vel: 1.1, que: "cae una pila" }); pon("papel", t + 0.35, { db: -16, vel: 1.25, que: "otra" }); });
pon("late", f(1).t("importante") + 0.1, { db: -14, que: "late el portátil" });
pon("desliza", jarra + 0.1, { db: -17, vel: 1.1, que: "brazos en jarra" });
pon("sube", acerca - 0.6, { ancla: "empieza", db: -15, vel: 0.6, que: "la cámara recorre la ropa" });
pon("enganche", acerca + 0.75, { db: -18, vel: 0.85, que: "las perchas se mecen al pasar" });
pon("sube", acerca + 0.9, { ancla: "empieza", db: -17, vel: 0.5, que: "la cámara sigue por la ropa" });
pon("clic", brillaArmario + 0.3, { db: -11, que: "el armario, perfecto" });
pon("sube", f(3).t("entonces") + 0.1, { ancla: "empieza", db: -16, vel: 0.6, que: "la cámara entra en el armario" });
pon("late", f(3).t("huyendo") + 0.05, { db: -9, que: "late lo rojo" });

// ── 2. El aula ──
tictac.forEach((t, i) => pon("tic", t, { db: -19 + Math.min(4, i * 0.25), lp: 7000, vel: 1.1, que: "el segundero" }));
pon("toque", caenNubes[0], { db: -15, que: "salen las nubes" });
pon("toque", caenNubes[2], { db: -17, vel: 0.9 });
pon("toque", caenNubes[4], { db: -16, vel: 1.1 });
caenExamenes.forEach((t, i) => { if (i % 2 === 0) pon("papel", t + 0.3, { db: -14 - (i % 3), vel: 1.05 + i * 0.03, que: "cae un examen" }); });
pon("sube", f(5).t("vez") - 0.05, { ancla: "empieza", db: -17, vel: 0.6, que: "la cámara va a la izquierda" });
pon("toque", f(5).t("cualquier") - 0.1, { db: -14, que: "el móvil" });
pon("sube", avion, { ancla: "empieza", db: -14, vel: 1.2, que: "el avión de papel" });
const Th = f(5).t("hasta"), Tm = f(5).t("minuto");
for (let q = 0; q < 4; q++) pon("tic", Th - 0.2 + (q * (Tm - Th + 0.3)) / 4, { db: -15, que: "corre el reloj" });
pon("pitido", Tm + 0.05, { db: -12, que: "último minuto" });
pon("sube", f(6).t("otros") - 0.05, { ancla: "empieza", db: -17, vel: 0.6, que: "la cámara va a la derecha" });
pon("cruje", hielo[0] + 0.1, { db: -14, que: "se congela" });
hielo.forEach((t, j) => pon("cristal", t + 0.35, { db: -11 - j * 2, vel: 1 + j * 0.06, que: "hielo" }));
golpecitos.forEach((t, i) => pon("cristal", t, { db: -12 - i, vel: 1.15 + i * 0.1, que: "toca su nube helada: no cambia" }));
pon("desliza", f(7).t("pusieron") + 0.05, { db: -15, que: "se enderezan" });
for (let q = 0; q < 3; q++) pon("tic", f(7).t("estudiar") + 0.1 + q * 0.28, { db: -18, lp: 6000, vel: 0.9 + q * 0.1, que: "escriben" });
pon("sube", f(8).inicio + 0.05, { ancla: "empieza", db: -17, vel: 0.6, que: "vuelve a la izquierda" });
pon("late", f(8).t("sentían") + 0.05, { db: -9, que: "la nube se pone roja" });
pon("golpe-hondo", f(8).t("sentían") + 0.08, { db: -13, lp: 1400, que: "ruge" });

// ── 3. El escritorio ──
pon("toque", f(9).t("documento") - 0.05, { db: -13, que: "se abre el documento" });
pon("empujon", pinchazo + 0.05, { db: -9, que: "el pinchazo" });
pon("late", f(9).t("agobio") + 0.05, { db: -10, que: "la nube roja" });
pon("madera", levanta + 0.1, { db: -15, que: "se levanta de la silla" });
pon("sube", deshace, { ancla: "empieza", db: -12, que: "la nube se deshace" });
pon("cristal", f(10).t("alivio") - 0.05, { db: -11, vel: 0.85, que: "el alivio" });
pon("clic", f(10).t("premio") + 0.02, { db: -11, que: "el premio" });
viajes.forEach((t, i) => pon("desliza", t + 0.2, { db: -15 - i, vel: 1 + i * 0.08, que: "otro viaje al armario" }));
pon("golpe", f(10).t("funciona") + 0.1, { db: -14, que: "el camino brilla" });

// ── 4. La pereza ──
pon("clic", f(11).t("pereza") - 0.02, { db: -14, que: "«pereza»" });
pon("clic", f(11).t("esto") + 0.02, { db: -13, vel: 1.1, que: "se enciende el otro foco" });
pon("late", llegaNube + 0.1, { db: -10, que: "llega la nube roja" });
pon("empujon", empuja + 0.15, { db: -10, que: "le empuja hacia atrás" });
pon("golpe", f(11).t("sentir") + 0.08, { db: -14, que: "temblor" });

// ── 5. La pregunta y el cierre ──
pon("sube", f(12).t("vez"), { ancla: "empieza", db: -17, vel: 0.55, que: "la cámara entra en el armario" });
pon("tic", f(12).t("falta"), { db: -18, lp: 6000, que: "una percha" });
pon("desliza", apartan + 0.05, { db: -12, que: "las camisas se apartan" });
pon("late", f(12).t("sentir") + 0.08, { db: -9, que: "lo rojo, al descubierto" });
pon("sube", f(13).inicio + 0.3, { ancla: "empieza", db: -16, vel: 0.6, que: "la cámara sale" });
pon("enganche", f(13).t("amigo") + 0.2, { db: -17, que: "vuelve a colgar una camisa" });
pon("enganche", f(13).t("tiene") + 0.2, { db: -18, vel: 1.1, que: "otra" });
pon("clic", brillaFinal + 0.3, { db: -11, que: "impecable" });
pon("toque", f(13).t("proyecto") + 0.1, { db: -14, que: "late el portátil" });
pon("clic", f(13).t("empezar") + 0.15, { db: -12, que: "el cursor" });

export default e;
