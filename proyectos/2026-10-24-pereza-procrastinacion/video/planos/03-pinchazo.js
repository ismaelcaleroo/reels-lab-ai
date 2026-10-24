// Frase 10. «Tú igual: abres el documento, te da un pinchazo en el pecho, y doblar camisetas te lo quita en dos
// segundos.» Él al portátil: se abre la página, un pinchazo rojo le da en el pecho y la página se le viene encima. Desde
// la puerta del armario el miedo le enseña una camiseta. Va, la dobla: alivio.
import * as k from "#kit";
import { v } from "#voz";
import { ARMARIO, camara, rutaCam, cuarto, armario, escritorio, ROJO } from "../mundo.js";
import { persona, miedo } from "../personajes.js";
import { silla } from "./01-cuarto.js";

export const desde = "tú";

const f = v.frase(10);
const T0 = f.inicio, Tabr = f.t("abres"), Tdoc = f.t("documento"), Tpin = f.t("pinchazo"), Tpec = f.t("pecho");
const Tdob = f.t("doblar"), Tcam = f.t("camisetas"), Tqui = f.t("quita"), Tseg = f.t("segundos"), Tfin = f.fin;
const cx = ARMARIO.x + ARMARIO.w / 2;
export const momentos = { abre: Tabr + 0.1, pinchazo: Tpin + 0.05, pagina: Tpin + 0.1, asoma: Tpec + 0.1, levanta: Tdob - 0.1, dobla: Tcam + 0.2, alivio: Tqui };

const cam = rutaCam([
  [T0, { x: 400, y: 960, z: 1.9 }],
  [Tpin, { x: 430, y: 930, z: 2.15 }],
  [Tpec + 0.2, { x: 480, y: 960, z: 1.75 }],
  [Tdob + 0.6, { x: 660, y: 960, z: 1.55 }],
  [Tfin, { x: 650, y: 960, z: 1.6 }],
]);

export function dibuja(g, t) {
  g.save();
  camara(g, cam(t));
  const abre = k.suave(k.tramo(t, Tabr - 0.1, Tdoc + 0.1));
  const duele = k.suave(k.tramo(t, Tpin - 0.05, Tpin + 0.25)) * (1 - k.suave(k.tramo(t, Tqui - 0.2, Tseg + 0.3)));
  cuarto(g, { lampara: 1, pantalla: 0.3 + 0.7 * abre });
  // la pantalla tiñe de rojo el cuarto mientras pincha
  escritorio(g, t, { doc: abre, latido: k.pulso(t, Tdoc, 0.2), lineas: 0 });
  const asoma = k.suave(k.tramo(t, Tpec, Tpec + 0.4)) * (1 - k.suave(k.tramo(t, Tqui, Tqui + 0.4)));
  armario(g, t, {
    abre: Math.max(0.12 * asoma, t > Tdob ? k.suave(k.tramo(t, Tdob, Tdob + 0.4)) : 0),
    pilas: [1, 1, 1],
  });
  // el miedo asoma por la puerta con una camiseta en la mano
  if (asoma > 0.01) {
    miedo(g, ARMARIO.x + 70, 720 + 40 * (1 - asoma), 0.7, t, { expr: "acecha", al: asoma, saluda: 1, mira: [-1, 0.3] });
    g.save(); g.globalAlpha *= asoma; g.translate(ARMARIO.x + 150, 640 + Math.sin(t * 12) * 10); g.rotate(0.4 + Math.sin(t * 12) * 0.15);
    g.fillStyle = "#3d8fd6"; g.beginPath(); g.moveTo(-40, -30); g.lineTo(40, -30); g.lineTo(56, -6); g.lineTo(32, 0); g.lineTo(32, 50); g.lineTo(-32, 50); g.lineTo(-32, 0); g.lineTo(-56, -6); g.closePath(); g.fill();
    g.restore();
  }
  silla(g, k.suave(k.tramo(t, Tdob - 0.1, Tdob + 0.4)));
  // él: sentado al portátil → de pie doblando
  const pie = k.suave(k.tramo(t, Tdob - 0.15, Tdob + 0.35));
  const x = k.mez(520, 470, pie);
  const pecho = k.suave(k.tramo(t, Tpin, Tpin + 0.2)) * (1 - pie);
  let cara = "tenso";
  if (t > Tpin) cara = "agobio";
  if (t > Tdob) cara = "neutral";
  if (t > Tqui - 0.1) cara = "alivio";
  const dob = t > Tcam ? Math.sin(t * 10) * 0.25 : 0;
  persona(g, {
    x, y: 1335, s: 1.12, mira: pie > 0.5 ? 1 : -1, sentado: 1 - pie, cara, t, pecho,
    tiembla: duele * 0.9, encoge: 0.4 * duele, inclina: pie > 0.5 ? 0 : 0.06 * duele,
    brazoD: pie > 0.5 ? [1.15 + dob, -1.1] : [1.2, -0.6], brazoI: pie > 0.5 ? [1.0 - dob, -1.0] : [1.1, -0.5],
    parpadeo: k.pulso(t, 39.1, 0.05),
  });
  // la camiseta que dobla
  if (pie > 0.5 && t > Tcam) {
    const u = k.suave(k.tramo(t, Tcam, Tqui));
    g.fillStyle = "#3d8fd6"; g.save(); g.translate(560, 1010); g.scale(1, k.mez(1, 0.35, u));
    k.redondo(g, -60, -36, 120, 72, 10); g.fill(); g.restore();
  }
  // el pinchazo: un rayo rojo de la pantalla al pecho
  const sube = k.tramo(t, Tpin - 0.12, Tpin + 0.06), apaga = 1 - k.tramo(t, Tpin + 0.3, Tpin + 0.8);
  if (sube > 0 && apaga > 0) {
    const x0 = 250, y0 = 1060, x1 = k.mez(x0, 470, sube), y1 = k.mez(y0, 1050, sube);
    g.save(); g.globalCompositeOperation = "lighter";
    for (const [w, a] of [[44, 0.25], [14, 0.95]]) {
      g.strokeStyle = `rgba(${ROJO},${a * apaga})`; g.lineWidth = w; g.lineJoin = "miter"; g.lineCap = "round";
      g.beginPath(); g.moveTo(x0, y0);
      for (let i = 1; i <= 6; i++) { const u = i / 6; g.lineTo(k.mez(x0, x1, u), k.mez(y0, y1, u) + (i < 6 ? (i % 2 ? -30 : 30) : 0)); }
      g.stroke();
    }
    g.restore();
    k.brillo(g, x1, y1, 520, ROJO, apaga * sube);
    k.fogonazo(g, x1, y1, (t - Tpin) * 1.4, 600, "255,90,70");
  }
  g.restore();
  // tinte rojo de toda la escena mientras duele
  if (duele > 0) { g.save(); g.globalCompositeOperation = "multiply"; g.fillStyle = `rgba(255,${Math.round(255 - 90 * duele)},${Math.round(255 - 100 * duele)},1)`; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  const vg = g.createLinearGradient(0, 250, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.5)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 250, 1080, 310);
}
