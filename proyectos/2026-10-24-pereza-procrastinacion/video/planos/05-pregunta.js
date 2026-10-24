// Frases 12-13. «Así que la próxima vez no te preguntes qué te falta para ponerte. Pregúntate qué estás intentando no
// sentir. Envíaselo a ese amigo que tiene el armario impecable y el proyecto sin empezar.»
// El cuarto otra vez, él ordenando. La cámara entra en el armario; en «Pregúntate» las camisas se apartan y aparece lo
// rojo del principio: una nube pequeña escondida al fondo. Luego la cámara sale: el armario impecable y, en el
// escritorio, la página en blanco con el cursor.
import * as k from "#kit";
import { v } from "#voz";
import { ARMARIO, camara, rutaCam, cuarto, armario, escritorio, figura, nube } from "../mundo.js";

export const desde = (v) => v.frase(12).inicio - 0.04;

const f12 = v.frase(12), f13 = v.frase(13);
const T0 = f12.inicio, Tpreg = f12.t("pregúntate"), Tsen = f12.t("sentir"), Tenv = f13.inicio;
const Timp = f13.t("impecable"), Tpro = f13.t("proyecto"), Temp = f13.t("empezar"), Tfin = v.duracion;
export const apartan = Tpreg, brilla = Timp - 0.1;
const cx = ARMARIO.x + ARMARIO.w / 2;

const cam = rutaCam([
  [T0, { x: 545, y: 1000, z: 1.16 }],
  [Tpreg - 0.1, { x: cx, y: 830, z: 2.1 }],
  [Tsen + 0.35, { x: cx, y: 790, z: 3.5 }],
  [Tenv + 0.2, { x: cx, y: 790, z: 3.55 }],
  [Timp + 0.2, { x: 545, y: 1000, z: 1.16 }],
  [Tpro - 0.05, { x: 540, y: 1005, z: 1.17 }],
  [Temp + 0.35, { x: 290, y: 1060, z: 1.75 }],
  [Tfin, { x: 285, y: 1060, z: 1.78 }],
]);

export function dibuja(g, t) {
  g.save();
  camara(g, cam(t));
  cuarto(g, { lampara: 1, pantalla: 0.6 });
  escritorio(g, t, { doc: 1, latido: k.pulso(t, Tpro + 0.1, 0.25) + 0.6 * k.pulso(t, Temp + 0.15, 0.25), lineas: 0 });
  const aparta = k.suave(k.tramo(t, Tpreg - 0.05, Tpreg + 0.6)) * (1 - k.suave(k.tramo(t, Tenv + 0.3, Tenv + 1.0)));
  const ve = k.suave(k.tramo(t, Tpreg + 0.2, Tsen + 0.1));
  armario(g, t, {
    abre: 1, aparta,
    barrido: t > brilla && t < brilla + 0.9 ? (t - brilla) / 0.9 : -1,
    rojo: 0.35 * ve,
    fondo: (gg) => nube(gg, cx, 800 + 6 * Math.sin(t * 2.4), 0.62 * (0.9 + 0.1 * ve), t, { rojo: 1, al: 0.35 + 0.65 * ve, rayo: k.pulso(t, Tsen + 0.08, 0.12) }),
  });
  // él, otra vez ordenando
  // él, otra vez ordenando; cuando la cámara entra en el armario, se para y baja los brazos
  const para = k.suave(k.tramo(t, Tpreg - 0.9, Tpreg - 0.3)) * (1 - k.suave(k.tramo(t, Timp - 0.4, Timp + 0.2)));
  const vaiven = Math.sin(t * 9) * (1 - para);
  figura(g, { x: 470, y: 1430, s: 1.15, mira: 1, t, brazoD: k.mez(1.2 + 0.4 * vaiven, 0.15, para), brazoI: k.mez(0.5 - 0.4 * vaiven, -0.15, para), inclina: 0.05 * Math.sin(t * 4.5) * (1 - para), color: "#3a6fd8" });
  g.restore();
  const vg = g.createLinearGradient(0, 260, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.45)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 260, 1080, 300);
}
