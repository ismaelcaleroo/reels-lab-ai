// Frase 11. «La pereza es no querer hacerlo. Esto es querer hacerlo y no aguantar cómo te hace sentir.»
// Dos focos en la oscuridad. A la izquierda, la pereza: alguien tumbado en el sofá, tranquilo, sin nube, el portátil
// cerrado en el suelo. En «Esto», la cámara cruza a la derecha: alguien que se inclina hacia el portátil abierto
// (quiere) y la nube roja le aprieta desde arriba hasta echarle atrás, temblando.
import * as k from "#kit";
import { v } from "#voz";
import { camara, rutaCam, figura, cabeza, nube, pantallaDoc, mix, AZUL, ROJO } from "../mundo.js";

export const desde = (v) => v.frase(11).inicio - 0.04;

const f = v.frase(11);
const T0 = f.inicio, Tper = f.t("pereza"), Testo = f.t("esto"), Tque2 = f.t("querer", 2), Tagu = f.t("aguantar"), Tsen = f.t("sentir"), Tfin = f.fin;
export const llegaNube = Tque2 + 0.2, empuja = Tagu;

const cam = rutaCam([
  [T0, { x: 300, y: 1150, z: 1.35 }],
  [Testo - 0.15, { x: 310, y: 1150, z: 1.38 }],
  [Testo + 0.55, { x: 790, y: 1130, z: 1.35 }],
  [Tagu, { x: 800, y: 1120, z: 1.42 }],
  [Tsen + 0.4, { x: 540, y: 1150, z: 1.0 }],
]);

function foco(g, x, al, color = "255,236,210") {
  if (al <= 0) return;
  g.save(); g.globalCompositeOperation = "lighter";
  const fg = g.createLinearGradient(0, 300, 0, 1500);
  fg.addColorStop(0, `rgba(${color},${0.02 * al})`); fg.addColorStop(1, `rgba(${color},${0.16 * al})`);
  g.fillStyle = fg; g.beginPath(); g.moveTo(x - 60, 300); g.lineTo(x + 60, 300); g.lineTo(x + 330, 1480); g.lineTo(x - 330, 1480); g.closePath(); g.fill();
  const sg = g.createRadialGradient(x, 1480, 10, x, 1480, 360);
  sg.addColorStop(0, `rgba(${color},${0.3 * al})`); sg.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = sg; g.beginPath(); g.ellipse(x, 1480, 360, 70, 0, 0, 7); g.fill();
  g.restore();
}

function sofa(g) {
  const c1 = "#5f7f74", c2 = "#3c544c";
  const sg = g.createLinearGradient(0, 1180, 0, 1460);
  sg.addColorStop(0, c1); sg.addColorStop(1, c2);
  g.fillStyle = sg;
  k.redondo(g, 70, 1180, 440, 150, 40); g.fill();            // respaldo
  k.redondo(g, 60, 1300, 460, 120, 30); g.fill();            // asiento
  g.fillStyle = mix(c1, "#ffffff", 0.08);
  k.redondo(g, 40, 1230, 90, 190, 40); g.fill();             // brazos
  k.redondo(g, 450, 1230, 90, 190, 40); g.fill();
  g.fillStyle = "#2a2e33"; g.fillRect(90, 1420, 20, 40); g.fillRect(470, 1420, 20, 40);
}

export function dibuja(g, t) {
  g.save();
  camara(g, cam(Math.min(Math.max(t, T0), Tsen + 0.4)));
  g.fillStyle = "#0b0d12"; g.fillRect(-900, -400, 2900, 2900);
  g.fillStyle = "#14171e"; g.fillRect(-900, 1480, 2900, 1200);
  const izq = 1 - 0.55 * k.suave(k.tramo(t, Testo, Testo + 0.5)), der = k.suave(k.tramo(t, Testo - 0.2, Testo + 0.3));
  foco(g, 290, izq);
  foco(g, 810, der, k.mezRgb("255,236,210", ROJO, k.suave(k.tramo(t, Tagu - 0.3, Tagu + 0.3)) * 0.6));
  // ── la pereza: tumbado, tranquilo
  sofa(g);
  g.save(); g.translate(500, 1300); g.rotate(-Math.PI / 2 + 0.06);
  figura(g, { x: 0, y: 0, s: 0.95, mira: 1, t, color: "#c79a4a", brazoD: -0.1 + 0.04 * Math.sin(t * 2), brazoI: 0.15, encoge: 0 });
  g.restore();
  // portátil cerrado en el suelo
  g.fillStyle = "#6c717c"; k.redondo(g, 380, 1465, 170, 16, 5); g.fill();
  if (t > Tper - 0.3) k.etiqueta(g, 205, 1580, "pereza", "220,220,220", k.suave(k.tramo(t, Tper - 0.2, Tper + 0.2)), 46);
  // ── lo otro: quiere y no puede
  g.fillStyle = "#4b3424"; g.fillRect(560, 1250, 240, 26); g.fillRect(575, 1276, 18, 200); g.fillRect(767, 1276, 18, 200);
  g.fillStyle = "#8d929c"; k.redondo(g, 590, 1238, 200, 12, 5); g.fill();
  k.redondo(g, 600, 1100, 180, 130, 8); g.fillStyle = "#3c414b"; g.fill();
  pantallaDoc(g, 606, 1106, 168, 118, t, { doc: 1, lineas: 0, rotulo: "Proyecto" });
  k.brillo(g, 690, 1165, 380, AZUL, 0.35 * der);
  const presion = k.suave(k.tramo(t, Tagu - 0.2, Tsen));
  const quiere = k.suave(k.tramo(t, Testo + 0.2, Tque2 + 0.3));
  const o = {
    x: 920, y: 1480, s: 1.0, mira: -1, t,
    brazoD: k.mez(0.2, 1.4, quiere) - 0.5 * presion, brazoI: -0.3,
    inclina: k.mez(0, -0.18, quiere) + 0.32 * presion, encoge: 0.5 * presion, tiembla: 0.5 * presion, color: "#3a6fd8",
  };
  g.save(); g.globalAlpha *= Math.max(0.15, der); figura(g, o); g.restore();
  const c = cabeza(o);
  const nu = k.suave(k.tramo(t, llegaNube, llegaNube + 0.4));
  nube(g, c.x - 20, c.y - 190 + 70 * presion, 1.05 * nu, t, { rojo: 1, rayo: k.pulso(t, Tagu + 0.05, 0.12) + 0.6 * k.pulso(t, Tsen + 0.05, 0.12), al: nu });
  if (t > Testo - 0.3) k.etiqueta(g, 670, 1580, "procrastinar", "255,170,160", der, 46);
  g.restore();
  const vg = g.createLinearGradient(0, 260, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.45)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 260, 1080, 300);
}
