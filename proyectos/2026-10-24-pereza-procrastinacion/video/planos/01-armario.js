// Frases 1-3. «¿Por qué justo cuando tienes que ponerte con algo importante, te da por ordenar el armario? Eso no es
// pereza: un vago no ordena nada. Entonces, ¿de qué estás huyendo?»
// Fotograma 0: las puertas revientan y la ropa vuela; vuelve sola, ordenada por colores, mientras la cámara se aleja y
// enseña el portátil con el documento, ignorado. «nada»: el armario, perfecto. Luego la cámara se mete entre las
// camisas y al fondo late una luz roja.
import * as k from "#kit";
import { v } from "#voz";
import { ARMARIO, camara, rutaCam, cuarto, armario, escritorio, figura, COLORES_ROPA } from "../mundo.js";

export const desde = 0;

const f1 = v.frase(1), f2 = v.frase(2), f3 = v.frase(3);
const Timp = f1.t("importante"), Tarm = f1.t("armario"), Tper = f2.t("pereza"), Tnada = f2.t("nada"), Tent = f3.t("entonces"), Thuy = f3.t("huyendo");
const n = COLORES_ROPA.length;
// cada camisa vuelve a su sitio, una detrás de otra, hasta «armario»
const llega = (i) => 0.25 + (i * (Tarm - 0.9)) / (n - 1);
export const camisas = COLORES_ROPA.map((_, i) => llega(i) + 0.42);   // cuándo se cuelga cada una (para el sonido)
export const pilas = [0, 1, 2].map((j) => Timp - 0.2 + j * ((Tarm - Timp + 0.2) / 3));
export const portazo = 0.12, brilla = Tnada - 0.15, jarra = Tarm + 0.3, acerca = Tper;

const cam = rutaCam([
  [0, { x: 770, y: 860, z: 1.7 }],
  [Timp + 0.4, { x: 540, y: 1000, z: 1.15 }],
  [Tarm + 0.25, { x: 545, y: 1000, z: 1.16 }],
  [Tper + 0.2, { x: 650, y: 790, z: 2.15 }],
  [Tnada + 0.1, { x: 870, y: 800, z: 2.15 }],
  [Tent, { x: 760, y: 820, z: 2.3 }],
  [Thuy + 0.45, { x: ARMARIO.x + ARMARIO.w / 2, y: 760, z: 3.4 }],
]);

export function dibuja(g, t) {
  g.save();
  camara(g, cam(Math.min(t, Thuy + 0.45)));
  cuarto(g, { lampara: 1, pantalla: 0.6 });
  const late = k.pulso(t, Timp + 0.12, 0.22);
  escritorio(g, t, { doc: 1, latido: late });
  const abre = Math.min(1.08, k.entra(k.tramo(t, -0.18, 0.3)) * 1.08) - 0.08 * k.suave(k.tramo(t, 0.3, 0.6));
  armario(g, t, {
    abre,
    ordenCamisa: (i) => k.tramo(t, llega(i), llega(i) + 0.42),
    pilas: pilas.map((p) => k.tramo(t, p, p + 0.55)),
    barrido: t > brilla && t < brilla + 0.9 ? (t - brilla) / 0.9 : -1,
    rojo: k.suave(k.tramo(t, Tent + 0.2, Thuy)) * (0.75 + 0.25 * Math.sin(t * 7)) + 0.6 * k.pulso(t, Thuy + 0.05, 0.18),
    aparta: k.suave(k.tramo(t, Tent + 0.1, Thuy)),
  });
  // la figura, de espaldas al portátil, ordenando a toda prisa; al acabar, brazos en jarra
  const ordenando = t < Tarm + 0.2;
  const vaiven = ordenando ? Math.sin(t * 11) : 0;
  const jarra = k.suave(k.tramo(t, Tarm + 0.2, Tarm + 0.6));
  figura(g, {
    x: 470, y: 1430, s: 1.15, mira: 1, t,
    brazoD: k.mez(1.25 + 0.45 * vaiven, 0.45, jarra), brazoI: k.mez(0.6 - 0.5 * vaiven, -0.45, jarra),
    inclina: ordenando ? 0.06 * Math.sin(t * 5.5) : 0, color: "#3a6fd8",
  });
  g.restore();
  // velo oscuro arriba para que el subtítulo se lea siempre
  const vg = g.createLinearGradient(0, 260, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.45)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 260, 1080, 300);
}
