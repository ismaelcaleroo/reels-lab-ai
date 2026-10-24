// Frases 12-13. «Así que la próxima vez que te pilles delante del armario, ponle nombre: "esto es miedo a que salga
// mal". Nombrarlo le baja el volumen. Y con el volumen bajo, el documento ya no pincha tanto.»
// Va al armario y se pilla con la mano en la puerta. Las puertas se abren solas: el miedo en el estante. Le pega una
// etiqueta; el miedo se encoge y se apaga. Él se sienta, abre el documento: el pinchazo se queda corto y escribe.
import * as k from "#kit";
import { v } from "#voz";
import { ARMARIO, camara, rutaCam, cuarto, armario, escritorio, ROJO } from "../mundo.js";
import { persona, miedo } from "../personajes.js";
import { silla } from "./01-cuarto.js";

export const desde = (v) => v.frase(12).inicio - 0.04;

const f12 = v.frase(12), f13 = v.frase(13);
const T0 = f12.inicio, Tarm = f12.t("armario"), Tpon = f12.t("ponle"), Tnom = f12.t("nombre"), Tmie = f12.t("miedo"), Tmal = f12.t("mal");
const T13 = f13.inicio, Tvol = f13.t("volumen"), Tvol2 = f13.t("volumen", 2), Tdoc = f13.t("documento"), Tpin = f13.t("pincha"), Tfin = f13.fin;
const cx = ARMARIO.x + ARMARIO.w / 2;
export const momentos = { para: Tarm, abren: Tarm + 0.3, pega: Tnom + 0.25, encoge: T13 + 0.1, sienta: Tvol2 - 0.3, abre: Tdoc, pinchito: Tpin, escribe: Tpin + 0.4 };

const cam = rutaCam([
  [T0, { x: 560, y: 980, z: 1.3 }],
  [Tarm, { x: 620, y: 930, z: 1.55 }],
  [Tnom + 0.2, { x: 690, y: 930, z: 1.85 }],
  [Tmie, { x: cx - 20, y: 960, z: 2.6 }],
  [T13 + 0.6, { x: cx - 20, y: 960, z: 2.6 }],
  [Tvol2 + 0.3, { x: 470, y: 960, z: 1.7 }],
  [Tfin, { x: 420, y: 960, z: 1.9 }],
]);

export function dibuja(g, t) {
  g.save();
  camara(g, cam(t));
  const abreDoc = k.suave(k.tramo(t, Tdoc - 0.15, Tdoc + 0.2));
  cuarto(g, { lampara: 1, pantalla: 0.4 + 0.6 * abreDoc });
  const lineas = Math.min(5, Math.floor(Math.max(0, t - (Tpin + 0.4)) * 5));
  escritorio(g, t, { doc: abreDoc, lineas });
  const abre = 0.75 * k.suave(k.tramo(t, Tarm + 0.25, Tarm + 0.7));
  armario(g, t, { abre, pilas: [1, 1, 1] });
  // el miedo en el estante del medio
  const ve = k.suave(k.tramo(t, Tarm + 0.35, Tarm + 0.8));
  const encoge = k.suave(k.tramo(t, T13 + 0.05, Tvol + 0.3));
  const etiq = k.tramo(t, Tnom + 0.2, Tnom + 0.6);
  let expr = "acecha";
  if (t > Tnom + 0.2) expr = "asustado";
  if (t > T13) expr = "pequeno";
  miedo(g, cx, 900 + 40 * encoge, k.mez(0.95, 0.45, encoge), t, { expr, al: ve, etiqueta: etiq, brillo: k.mez(1, 0.18, encoge), mira: [-0.7, 0.2] });
  silla(g, -0.6 + 0.6 * k.suave(k.tramo(t, Tvol2 - 0.6, Tvol2 - 0.2)));
  // él
  const sienta = k.suave(k.tramo(t, Tvol2 - 0.35, Tvol2 + 0.15));
  const llega = k.suave(k.tramo(t, T0, Tarm - 0.2));
  const x = sienta > 0.5 ? 520 : k.mez(400, 470, llega);
  let cara = "neutral";
  if (t > Tarm - 0.1) cara = "pillado";
  if (t > Tpon) cara = "concentrado";
  if (t > T13) cara = "alivio";
  if (t > Tvol2) cara = "concentrado";
  const levanta = k.suave(k.tramo(t, Tpon - 0.1, Tnom + 0.1)) * (1 - k.suave(k.tramo(t, Tnom + 0.4, Tnom + 0.8)));
  const tecla = sienta > 0.5 && t > Tpin + 0.3 ? Math.sin(t * 18) * 0.08 : 0;
  const P = persona(g, {
    x, y: 1335, s: 1.12, mira: sienta > 0.5 ? -1 : 1, sentado: sienta, cara, t, parpadeo: k.pulso(t, 54.1, 0.05) + k.pulso(t, 59.6, 0.05),
    mirada: sienta > 0.5 ? [0, 2] : [2, -2],
    brazoD: sienta > 0.5 ? [1.2 + tecla, -0.6] : t < Tarm + 0.3 ? [k.mez(0.1, 1.4, llega), -0.2] : [k.mez(0.9, 1.9, levanta), -0.3],
    brazoI: sienta > 0.5 ? [1.1 - tecla, -0.5] : [0.1, 0.15],
  });
  // la etiqueta en su mano, antes de pegarla
  if (levanta > 0.1 && etiq < 0.05) {
    g.save(); g.translate(P.manoD.x + 10, P.manoD.y - 20); g.rotate(-0.2);
    g.fillStyle = "#fbf6e4"; k.redondo(g, -50, -16, 100, 32, 5); g.fill(); g.restore();
  }
  // el pinchazo, ahora corto: sale de la pantalla y se apaga a medio camino
  const sp = k.tramo(t, Tpin - 0.15, Tpin + 0.15), ap = 1 - k.tramo(t, Tpin + 0.15, Tpin + 0.5);
  if (sp > 0 && ap > 0) {
    const x0 = 250, y0 = 1060, x1 = k.mez(x0, 330, sp), y1 = y0 - 10 * sp;
    g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(${ROJO},${0.8 * ap})`; g.lineWidth = 9; g.lineCap = "round";
    g.beginPath(); g.moveTo(x0, y0); g.lineTo((x0 + x1) / 2, y0 - 14); g.lineTo(x1, y1); g.stroke(); g.restore();
    k.brillo(g, x1, y1, 120, ROJO, 0.6 * ap);
  }
  g.restore();
  const vg = g.createLinearGradient(0, 250, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.5)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 250, 1080, 310);
}
