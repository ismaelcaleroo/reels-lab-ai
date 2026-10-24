// Frases 9-10. «Tú igual: abrir el documento te da un pinchazo de agobio, y ordenar el armario te lo quita en dos
// segundos. Y ese alivio es el premio: le enseña a tu cerebro que huir funciona.»
// Sentado al portátil: se abre el documento, sale un pinchazo rojo que se le clava y le sale la nube roja. Se levanta,
// se gira al armario y la nube se deshace. Le baña la luz azul del alivio. La cámara se aleja: en el suelo, el camino
// del escritorio al armario se marca más y brilla más con cada viaje.
import * as k from "#kit";
import { v } from "#voz";
import { camara, rutaCam, cuarto, armario, escritorio, figura, cabeza, nube, AZUL, ROJO, SUELO } from "../mundo.js";

export const desde = "tú";

const f9 = v.frase(9), f10 = v.frase(10);
const T0 = f9.inicio, Tdoc = f9.t("documento"), Tpin = f9.t("pinchazo"), Tago = f9.t("agobio");
const Tord = f9.t("ordenar"), Tqui = f9.t("quita"), Tseg = f9.t("segundos");
const Tali = f10.t("alivio"), Tpre = f10.t("premio"), Tens = f10.t("enseña"), Tfun = f10.t("funciona"), Tfin = f10.fin;

export const pinchazo = Tpin + 0.05, levanta = Tord, deshace = Tqui;
export const viajes = [0, 1, 2].map((i) => Tens + 0.05 + i * ((Tfun - Tens) / 3));

const cam = rutaCam([
  [T0, { x: 330, y: 1060, z: 1.65 }],
  [Tago + 0.3, { x: 350, y: 1050, z: 1.72 }],
  [Tord + 0.9, { x: 650, y: 1060, z: 1.4 }],
  [Tens - 0.1, { x: 640, y: 1070, z: 1.42 }],
  [Tfun + 0.3, { x: 540, y: 1100, z: 1.08 }],
]);

// el camino en el suelo: del escritorio (x 330) al armario (x 760)
function camino(g, t, fuerza) {
  if (fuerza <= 0.01) return;
  g.save();
  g.globalCompositeOperation = "lighter";
  for (const [w, a] of [[70, 0.12], [34, 0.3], [10, 0.8]]) {
    g.strokeStyle = `rgba(${AZUL},${a * fuerza})`; g.lineWidth = w * (0.5 + 0.5 * fuerza); g.lineCap = "round";
    g.beginPath(); g.moveTo(330, SUELO + 140); g.quadraticCurveTo(540, SUELO + 230, 760, SUELO + 120); g.stroke();
  }
  g.restore();
}

export function dibuja(g, t) {
  g.save();
  camara(g, cam(Math.min(Math.max(t, T0), Tfun + 0.3)));
  const abre = k.suave(k.tramo(t, Tdoc - 0.15, Tdoc + 0.2));
  cuarto(g, { lampara: 1, pantalla: 0.3 + 0.7 * abre });
  // el camino (bajo todo lo demás)
  const fuerza = viajes.reduce((s, tv) => s + 0.33 * k.suave(k.tramo(t, tv + 0.25, tv + 0.5)), 0) + 0.4 * k.pulso(t, Tfun + 0.1, 0.2);
  camino(g, t, Math.min(1.3, fuerza));
  armario(g, t, { abre: 1, pilas: [1, 1, 1] });
  escritorio(g, t, { doc: abre, latido: k.pulso(t, Tdoc + 0.05, 0.2) });
  // la silla
  g.fillStyle = "#2a2e38"; k.redondo(g, 470, 1180, 130, 26, 8); g.fill(); g.fillRect(560, 990, 22, 200); g.fillRect(480, 1206, 16, 120); g.fillRect(570, 1206, 16, 120);
  // la figura: sentada mirando al portátil → de pie mirando al armario
  const pie = k.suave(k.tramo(t, Tord - 0.05, Tord + 0.45));
  const gira = t > Tord + 0.2 ? 1 : -1;
  const pin = k.pulso(t, pinchazo + 0.05, 0.12);
  const agobio = k.suave(k.tramo(t, Tpin, Tago + 0.2)) * (1 - k.suave(k.tramo(t, Tqui - 0.1, Tseg + 0.3)));
  const alivio = k.suave(k.tramo(t, Tali - 0.15, Tali + 0.5)) * (1 - 0.6 * k.suave(k.tramo(t, Tfin - 0.6, Tfin)));
  const o = {
    x: k.mez(520, 600, pie), y: 1330, s: 1.12, sentado: 1 - pie, mira: gira, t,
    encoge: Math.max(0, agobio * 0.8 - alivio), tiembla: agobio * 0.6 + pin,
    inclina: -0.12 * pin,
    brazoD: gira > 0 ? k.mez(0.2, 1.2 + 0.3 * Math.sin(t * 9) * (1 - alivio), pie) : 0.6,
    brazoI: gira > 0 ? k.mez(-0.2, 0.4, pie) : 0.5, color: "#3a6fd8",
  };
  // luz azul del alivio, detrás de la figura
  if (alivio > 0) {
    k.brillo(g, o.x, 1000, 1300, AZUL, 0.95 * alivio);
    k.brillo(g, o.x, 960, 520, "azul", 0.6 * alivio);
    k.fogonazo(g, o.x, 960, (t - Tpre) * 1.2, 900, "150,190,255");
  }
  figura(g, o);
  // el pinchazo: un rayo rojo de la pantalla a la cabeza
  const c = cabeza(o);
  const up = k.tramo(t, pinchazo - 0.1, pinchazo + 0.05), apaga = 1 - k.tramo(t, pinchazo + 0.25, pinchazo + 0.7);
  if (up > 0 && apaga > 0) {
    const x0 = 250, y0 = 1060, x1 = k.mez(x0, c.x - 40, up), y1 = k.mez(y0, c.y + 10, up);
    g.save(); g.globalCompositeOperation = "lighter";
    for (const [w, a] of [[34, 0.25], [12, 0.9]]) {
      g.strokeStyle = `rgba(${ROJO},${a * apaga})`; g.lineWidth = w; g.lineJoin = "miter"; g.lineCap = "round";
      g.beginPath(); g.moveTo(x0, y0);
      const n = 6;
      for (let i = 1; i <= n; i++) { const u = i / n; g.lineTo(k.mez(x0, x1, u), k.mez(y0, y1, u) + (i < n ? (i % 2 ? -26 : 26) : 0)); }
      g.stroke();
    }
    g.restore();
    k.brillo(g, x1, y1, 420, ROJO, 0.9 * apaga * up);
  }
  // la nube roja del agobio, que se deshace hacia arriba
  const sube = k.suave(k.tramo(t, Tqui - 0.1, Tseg + 0.3));
  nube(g, c.x, c.y - 170 - sube * 160, 0.95 * Math.max(0.01, agobio * (1 - 0.4 * sube)), t, { rojo: 1, rayo: k.pulso(t, Tago + 0.05, 0.15), al: agobio });
  // viajes: la figura fantasma del escritorio al armario, una y otra vez
  for (const tv of viajes) {
    const u = k.tramo(t, tv, tv + 0.5);
    if (u > 0 && u < 1) {
      g.save(); g.globalAlpha *= 0.45 * Math.sin(u * Math.PI);
      figura(g, { x: k.mez(330, 740, k.suave(u)), y: 1360, s: 0.95, mira: 1, t, color: "#7fa6ff", brazoD: 0.6 + 0.4 * Math.sin(u * 12), brazoI: -0.4 - 0.4 * Math.sin(u * 12) });
      g.restore();
    }
  }
  g.restore();
  const vg = g.createLinearGradient(0, 260, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.45)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 260, 1080, 300);
}
