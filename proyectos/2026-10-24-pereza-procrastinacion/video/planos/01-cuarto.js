// Frases 1-4. Él al portátil, tenso; se le van los ojos al armario (luz roja por la rendija). «ganas locas»: se
// levanta, las puertas revientan y la ropa vuela; «colores»: arcoíris; «calcetines»: bolitas perfectas al estante, y
// detrás parpadean dos ojos rojos. «Es otra cosa»: la cámara se mete entre las camisas y al fondo acecha el miedo.
import * as k from "#kit";
import { v } from "#voz";
import { ARMARIO, camara, rutaCam, cuarto, armario, escritorio, COLORES_ROPA } from "../mundo.js";
import { persona, miedo } from "../personajes.js";

export const desde = 0;

const f1 = v.frase(1), f2 = v.frase(2), f3 = v.frase(3), f4 = v.frase(4);
const Timp = f1.t("importante"), Tgan = f1.t("ganas"), Tarm = f1.t("armario");
const T2 = f2.inicio, Tcol = f2.t("colores"), T3 = f3.inicio, Tper = f3.t("pereza"), Tcal = f3.t("calcetines");
const T4 = f4.inicio, Totra = f4.t("otra"), Ttru = f4.t("truco"), Tfin = f4.fin;
const cx = ARMARIO.x + ARMARIO.w / 2;
const n = COLORES_ROPA.length;
const llega = (i) => T2 + 0.15 + (i * (Tcol - T2 - 0.4)) / (n - 1);

export const momentos = {
  rendija: Timp + 0.5, levanta: Tgan - 0.05, portazo: Tgan + 0.05, camisas: COLORES_ROPA.map((_, i) => llega(i) + 0.32),
  bolas: [T3 + 0.7, Tper + 0.9, Tcal + 0.02], ojos: Tcal + 0.45, entra: Totra, acecha: Ttru,
};

const cam = rutaCam([
  [0, { x: 400, y: 930, z: 2.35 }],
  [Timp + 0.4, { x: 420, y: 950, z: 2.15 }],
  [Tgan - 0.05, { x: 470, y: 960, z: 1.95 }],
  [Tgan + 0.55, { x: 720, y: 930, z: 1.45 }],
  [Tarm + 0.3, { x: 700, y: 980, z: 1.3 }],
  [Tcol + 0.1, { x: 770, y: 820, z: 1.75 }],
  [T3 + 0.4, { x: 600, y: 1000, z: 1.95 }],
  [Tcal + 0.5, { x: 620, y: 990, z: 1.95 }],
  [Totra + 0.2, { x: 700, y: 900, z: 2.1 }],
  [Tfin, { x: cx, y: 800, z: 4.0 }],
]);

export function silla(g, gira = 0) {
  g.save(); g.translate(560 + 40 * gira, 0);
  g.fillStyle = "#23272f"; k.redondo(g, -80, 1170, 160, 30, 12); g.fill();
  g.fillStyle = "#2d323c"; k.redondo(g, 30, 960, 40, 220, 14); g.fill();
  g.fillStyle = "#1a1d23"; g.fillRect(-8, 1200, 16, 110);
  g.strokeStyle = "#1a1d23"; g.lineWidth = 10; g.lineCap = "round";
  g.beginPath(); g.moveTo(-70, 1320); g.lineTo(70, 1320); g.moveTo(0, 1310); g.lineTo(0, 1330); g.stroke();
  g.restore();
}

export function dibuja(g, t) {
  g.save();
  camara(g, cam(t));
  cuarto(g, { lampara: 1, pantalla: 0.9 });
  escritorio(g, t, { doc: 1, latido: k.pulso(t, Timp + 0.1, 0.22), lineas: 0 });
  // el armario: una rendija con luz roja, luego revienta
  const rendija = 0.05 * k.suave(k.tramo(t, Timp + 0.3, Timp + 0.9));
  const abre = t < Tgan ? rendija : Math.min(1.08, rendija + k.entra(k.tramo(t, Tgan, Tgan + 0.3)) * 1.08) - 0.08 * k.suave(k.tramo(t, Tgan + 0.3, Tgan + 0.6));
  const ojos = Math.max(k.pulso(t, momentos.ojos, 0.2), 0);
  armario(g, t, {
    abre,
    ordenCamisa: (i) => (t < Tgan ? 1 : t < T2 ? 0 : k.tramo(t, llega(i), llega(i) + 0.32)),
    pilas: [0, 1, 2].map((j) => k.tramo(t, Tarm - 0.6 + j * 0.5, Tarm + j * 0.5)),
    barrido: t > Tcol - 0.05 && t < Tcol + 0.8 ? (t - Tcol + 0.05) / 0.85 : -1,
    rojo: (t < Tgan ? 1 : 0.25) * k.suave(k.tramo(t, Timp + 0.3, Timp + 0.9)) + 0.6 * ojos,
    aparta: k.suave(k.tramo(t, Totra - 0.1, Totra + 0.8)),
    fondo: (gg) => {
      // el miedo, al fondo: primero solo sus ojos; luego entero, acechando
      const ve = k.suave(k.tramo(t, Totra, Totra + 0.7));
      if (ojos > 0.05 && ve < 0.1) {
        for (const ex of [cx - 22, cx + 22]) { gg.fillStyle = `rgba(255,90,80,${ojos})`; gg.beginPath(); gg.ellipse(ex, 780, 9, 11 * (1 - k.pulso(t, momentos.ojos + 0.15, 0.05)), 0, 0, 7); gg.fill(); }
        k.brillo(gg, cx, 780, 260, "255,80,70", 0.5 * ojos);
      }
      if (ve > 0) miedo(gg, cx, 790, 0.9, t, { expr: "acecha", al: ve, mira: [k.mez(-0.5, 0.6, k.tramo(t, Totra, Ttru)), 0.2] });
    },
  });
  // las camisas que vuelan por delante en el portazo (sensación de que salen hacia la cámara)
  if (t > Tgan && t < T2 + 0.6) {
    const u = k.tramo(t, Tgan, Tgan + 1.6);
    COLORES_ROPA.slice(0, 5).forEach((col, i) => {
      const r = k.azar(40 + i)(), a = (i / 5) * Math.PI * 2 + r;
      const d = 120 + 520 * k.entra(u);
      const x = cx + Math.cos(a) * d, y = 820 + Math.sin(a) * d * 0.6 - 200 * Math.sin(u * Math.PI);
      const vuelve = k.suave(k.tramo(t, T2 - 0.2, T2 + 0.6));
      g.save(); g.globalAlpha *= 1 - vuelve; g.translate(x, y); g.rotate(a + t * 6); g.fillStyle = col;
      k.redondo(g, -60, -40, 120, 80, 14); g.fill(); g.restore();
    });
  }
  // la silla de escritorio
  silla(g, t < Tgan + 0.4 ? 0 : k.suave(k.tramo(t, Tgan, Tgan + 0.5)));
  // él
  const sentado = 1 - k.suave(k.tramo(t, Tgan - 0.05, Tgan + 0.35));
  const giro = t > Timp + 1.0 ? 1 : -1;
  const x = sentado > 0.5 ? 520 : k.mez(520, 470, k.suave(k.tramo(t, Tgan + 0.1, Tgan + 0.6)));
  const ordena = t > Tgan + 0.3 && t < T3;
  const vaiven = ordena ? Math.sin(t * 12) : 0;
  const dobla = t > T3 && t < Tcal + 0.3;
  const dv = dobla ? Math.sin(t * 9) * 0.25 : 0;
  let cara = "tenso", mirada = [0, 0];
  if (t > Timp + 1.0) { cara = "neutral"; mirada = [3, -2]; }
  if (t > Tgan - 0.3) cara = "susto";
  if (t > Tgan + 0.4) cara = "concentrado";
  if (t > Tcol - 0.3) cara = "orgulloso";
  if (dobla && t < Tper - 0.2) cara = "concentrado";
  if (t > Tper - 0.2) cara = "orgulloso";
  if (t > Totra) cara = "neutral";
  const parpadeo = k.pulso(t, 1.6, 0.05) + k.pulso(t, 7.3, 0.05) + k.pulso(t, 13.9, 0.05);
  const P = persona(g, {
    x, y: 1335, s: 1.12, mira: giro, sentado, cara, mirada, parpadeo, t,
    tiembla: t < Timp + 1 ? 0.25 : 0,
    brazoD: dobla ? [1.15 + dv, -1.2] : ordena ? [1.5 + 0.35 * vaiven, -0.4] : sentado > 0.5 ? [1.2, -0.6] : t > Tcol ? [0.4, 0.3] : [0.9, -0.2],
    brazoI: dobla ? [1.05 - dv, -1.1] : ordena ? [1.0 - 0.3 * vaiven, -0.5] : sentado > 0.5 ? [1.1, -0.5] : [0.2, 0.2],
  });
  // los calcetines: una bolita entre las manos que sale volando al estante
  if (dobla || (t > Tcal && t < Tcal + 0.6)) {
    const vuela = k.tramo(t, Tcal - 0.05, Tcal + 0.35);
    const hx = (P.manoI.x + P.manoD.x) / 2, hy = (P.manoI.y + P.manoD.y) / 2;
    const bx = k.mez(hx, 640, k.suave(vuela)), by = k.mez(hy, 1096, k.suave(vuela)) - Math.sin(vuela * Math.PI) * 120;
    if (vuela < 1) { g.fillStyle = "#e8e1d2"; g.beginPath(); g.arc(bx, by, 20, 0, 7); g.fill(); g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 3; g.beginPath(); g.arc(bx, by, 12, 0.5, 2.6); g.stroke(); }
  }
  // bolitas ya hechas en el estante
  const hechas = momentos.bolas.filter((b) => t > b + 0.3).length;
  for (let i = 0; i < hechas; i++) { g.fillStyle = ["#e8e1d2", "#2b3140", "#c5579e"][i]; g.beginPath(); g.arc(612 + i * 34, 1100, 17, 0, 7); g.fill(); }
  g.restore();
  // velo para el subtítulo
  const vg = g.createLinearGradient(0, 250, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.5)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 250, 1080, 310);
}
