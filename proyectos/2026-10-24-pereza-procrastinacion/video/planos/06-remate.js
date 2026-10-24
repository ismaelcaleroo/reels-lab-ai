// Frases 14-15. «Porque la pereza no ordena armarios. El miedo, sí. Envíaselo a ese amigo que tiene el armario impecable
// y el proyecto sin empezar.» El armario cerrado; la cámara se acerca. «sí»: las puertas se abren y el miedo está
// doblando camisetas a toda velocidad: le pillan y mira a cámara. Luego la cámara sale: el armario impecable, el miedo
// saludando y él escribiendo al fondo.
import * as k from "#kit";
import { v } from "#voz";
import { ARMARIO, camara, rutaCam, cuarto, armario, escritorio } from "../mundo.js";
import { persona, miedo } from "../personajes.js";
import { silla } from "./01-cuarto.js";

export const desde = (v) => v.frase(14).inicio - 0.04;

const f14 = v.frase(14), f15 = v.frase(15);
const T0 = f14.inicio, Tarms = f14.t("armarios"), Tmie = f14.t("miedo"), Tsi = f14.t("sí");
const T15 = f15.inicio, Tami = f15.t("amigo"), Timp = f15.t("impecable"), Tpro = f15.t("proyecto"), Tfin = v.duracion;
const cx = ARMARIO.x + ARMARIO.w / 2;
export const momentos = { abre: Tmie - 0.05, pillado: Tsi, sale: T15 + 0.1, brilla: Timp - 0.1, saluda: Tami };

const cam = rutaCam([
  [T0, { x: 720, y: 930, z: 1.35 }],
  [Tmie - 0.1, { x: cx, y: 900, z: 1.9 }],
  [Tsi + 0.3, { x: cx, y: 900, z: 2.9 }],
  [T15 + 0.15, { x: cx, y: 900, z: 2.95 }],
  [Timp + 0.1, { x: 545, y: 1000, z: 1.16 }],
  [Tfin, { x: 540, y: 1005, z: 1.12 }],
]);

export function dibuja(g, t) {
  g.save();
  camara(g, cam(t));
  cuarto(g, { lampara: 1, pantalla: 1 });
  escritorio(g, t, { doc: 1, lineas: 5 + Math.min(3, Math.floor(Math.max(0, t - T0) / 2)) });
  const abre = Math.min(1.08, k.entra(k.tramo(t, Tmie - 0.05, Tmie + 0.25)) * 1.08) - 0.08 * k.suave(k.tramo(t, Tmie + 0.25, Tmie + 0.5));
  const brilla = momentos.brilla;
  armario(g, t, { abre, pilas: [1, 1, 1], barrido: t > brilla && t < brilla + 0.9 ? (t - brilla) / 0.9 : -1 });
  // el miedo, doblando a toda prisa hasta que le pillan
  const doblando = t < Tsi ? 1 : 0;
  const pillado = k.suave(k.tramo(t, Tsi - 0.05, Tsi + 0.15));
  const saluda = k.suave(k.tramo(t, Tami - 0.2, Tami + 0.3));
  miedo(g, cx, 905, 0.8, t, {
    expr: t < Tsi ? "acecha" : "pillado", etiqueta: 1, dobla: doblando, saluda, al: k.tramo(abre, 0.25, 0.6),
    mira: t < Tsi ? [0.3 * Math.sin(t * 9), 0.6] : [k.mez(0, -0.4, saluda), k.mez(0.35, 0.1, saluda)], brillo: k.mez(0.5, 0.8, pillado),
  });
  // la ropa que sale volando de sus manos mientras dobla
  if (t > Tmie && t < Tsi) {
    for (let i = 0; i < 3; i++) {
      const u = ((t - Tmie) * 3 + i / 3) % 1;
      g.save(); g.translate(cx + (i - 1) * 40 + u * (i - 1) * 120, 905 - 160 * Math.sin(u * Math.PI)); g.rotate(u * 6);
      g.fillStyle = ["#e8504a", "#efd04a", "#3d8fd6"][i]; k.redondo(g, -36, -14, 72, 28, 6); g.fill(); g.restore();
    }
  }
  silla(g, -0.6);
  // él, al fondo, escribiendo (no se entera)
  const tecla = Math.sin(t * 18) * 0.08;
  persona(g, { x: 520, y: 1335, s: 1.12, mira: -1, sentado: 1, cara: "concentrado", t, brazoD: [1.2 + tecla, -0.6], brazoI: [1.1 - tecla, -0.5], parpadeo: k.pulso(t, 70.3, 0.05) });
  g.restore();
  const vg = g.createLinearGradient(0, 250, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.5)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 250, 1080, 310);
}
