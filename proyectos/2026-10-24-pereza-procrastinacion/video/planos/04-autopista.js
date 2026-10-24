// Frase 11. «Y se pone peor: ese alivio es un premio. Cada vez que huyes, tu cerebro pisa el mismo camino, hasta que es
// una autopista.» Desde arriba: la alfombra de hierba entre la mesa y el armario. En «premio», un destello dorado. Va y
// vuelve cada vez más rápido: la hierba se aplasta, se hace camino de tierra y en «autopista» es asfalto con rayas. La
// cámara sube y el cuarto está dentro de un cerebro, con la autopista brillando hacia fuera.
import * as k from "#kit";
import { v } from "#voz";
import { camara, rutaCam, mix, AZUL } from "../mundo.js";

export const desde = (v) => v.frase(11).inicio - 0.04;

const f = v.frase(11);
const T0 = f.inicio, Tpeor = f.t("peor"), Tali = f.t("alivio"), Tpre = f.t("premio"), Thuy = f.t("huyes"), Tpis = f.t("pisa"), Tcam = f.t("camino"), Taut = f.t("autopista"), Tfin = f.fin;

// el camino de la mesa al armario
const P0 = [330, 830], PC = [560, 1240], P1 = [820, 830];
const punto = (u) => {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  return [a * P0[0] + b * PC[0] + c * P1[0], a * P0[1] + b * PC[1] + c * P1[1]];
};
// los viajes: cada vez más rápidos
const VIAJES = [];
{ let t = Thuy - 0.2; const durs = [0.75, 0.6, 0.5, 0.42, 0.36, 0.32, 0.3]; durs.forEach((d, i) => { if (t + d < Taut + 0.1) VIAJES.push({ t0: t, t1: t + d, ida: i % 2 === 0 }); t += d; }); }
export const momentos = { premio: Tpre, pasos: VIAJES.map((v) => v.t0), autopista: Taut, sube: Taut + 0.1 };

const cam = rutaCam([
  [T0, { x: 700, y: 900, z: 1.45 }],
  [Tpre + 0.3, { x: 680, y: 920, z: 1.35 }],
  [Thuy + 0.2, { x: 560, y: 960, z: 1.0 }],
  [Taut, { x: 560, y: 980, z: 0.95 }],
  [Tfin + 0.15, { x: 560, y: 1000, z: 0.34 }],
]);

// texturas una vez
const hierba = (() => {
  const l = k.lienzo(1000, 600), c = l.getContext("2d"), r = k.azar(3);
  c.fillStyle = "#3f7a3a"; c.fillRect(0, 0, 1000, 600);
  for (let i = 0; i < 9000; i++) {
    const x = r() * 1000, y = r() * 600, h = 8 + r() * 14, a = (r() - 0.5) * 0.8;
    c.strokeStyle = `hsl(${100 + r() * 30},${45 + r() * 20}%,${28 + r() * 22}%)`; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * h, y - Math.cos(a) * h); c.stroke();
  }
  return l;
})();
const madera = (() => {
  const l = k.lienzo(1080, 1920), c = l.getContext("2d"), r = k.azar(9);
  for (let y = 0; y < 1920; y += 64) { c.fillStyle = `hsl(25,${32 + r() * 8}%,${24 + r() * 6}%)`; c.fillRect(0, y, 1080, 62); c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(0, y + 62, 1080, 2); }
  return l;
})();

function cerebro(g, al) {
  if (al <= 0.01) return;
  g.save(); g.globalAlpha *= al;
  const cx = 560, cy = 1000;
  const bg = g.createRadialGradient(cx - 400, cy - 600, 100, cx, cy, 2600);
  bg.addColorStop(0, "#ffb3c4"); bg.addColorStop(0.6, "#e47e98"); bg.addColorStop(1, "#9c4560");
  g.fillStyle = bg; g.beginPath(); g.ellipse(cx, cy, 2300, 1850, 0, 0, 7); g.fill();
  // circunvoluciones
  const r = k.azar(17);
  g.strokeStyle = "rgba(140,50,80,0.55)"; g.lineWidth = 34; g.lineCap = "round";
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = 600 + r() * 1500, x = cx + Math.cos(a) * d * 1.2, y = cy + Math.sin(a) * d;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 4; s++) g.quadraticCurveTo(x + (r() - 0.5) * 500, y + (r() - 0.5) * 500, x + (r() - 0.5) * 600, y + (r() - 0.5) * 600);
    g.stroke();
  }
  g.strokeStyle = "rgba(120,40,70,0.8)"; g.lineWidth = 50; g.beginPath(); g.moveTo(cx, cy - 1850); g.bezierCurveTo(cx - 120, cy - 600, cx + 140, cy + 600, cx, cy + 1850); g.stroke();
  // la autopista sale del cuarto y cruza el cerebro, brillando
  g.save(); g.globalCompositeOperation = "lighter";
  for (const [w, a] of [[220, 0.15], [90, 0.45], [26, 0.95]]) {
    g.strokeStyle = `rgba(${AZUL},${a})`; g.lineWidth = w;
    g.beginPath(); g.moveTo(-1500, 300); g.bezierCurveTo(-500, 1400, 1700, 1400, 2600, 400); g.stroke();
  }
  g.restore();
  g.restore();
}

function persona(g, x, y, ang, t, anda) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(6, 8, 62, 46, 0, 0, 7); g.fill();
  const bal = anda ? Math.sin(t * 26) * 22 : 0;
  g.strokeStyle = "#2a5fc4"; g.lineWidth = 22; g.lineCap = "round";
  g.beginPath(); g.moveTo(-6, -40); g.lineTo(-6 + bal, -72); g.moveTo(-6, 40); g.lineTo(-6 - bal, 72); g.stroke();
  const sg = g.createRadialGradient(-10, -10, 4, 0, 0, 60);
  sg.addColorStop(0, "#4a86f0"); sg.addColorStop(1, "#2457b8");
  g.fillStyle = sg; g.beginPath(); g.ellipse(0, 0, 34, 56, 0, 0, 7); g.fill();
  const hg = g.createRadialGradient(-6, -6, 3, 0, 0, 34);
  hg.addColorStop(0, "#4a3527"); hg.addColorStop(1, "#21160f");
  g.fillStyle = hg; g.beginPath(); g.arc(4, 0, 30, 0, 7); g.fill();
  g.restore();
}

export function dibuja(g, t) {
  g.save();
  const C = cam(Math.min(t, Tfin + 0.15));
  camara(g, C);
  g.fillStyle = "#15111a"; g.fillRect(-4000, -4000, 9000, 9000);
  const fuera = k.suave(k.tramo(t, Taut + 0.05, Tfin + 0.1));
  cerebro(g, fuera);
  // el cuarto visto desde arriba
  g.save();
  g.beginPath(); k.redondo(g, 0, 300, 1080, 1300, 40); g.clip();
  g.drawImage(madera, 0, 0);
  // mesa con el portátil
  g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(110, 520, 360, 250);
  g.fillStyle = "#8a6040"; g.fillRect(100, 500, 360, 240);
  g.fillStyle = "#3c414b"; g.fillRect(200, 560, 170, 110); g.fillStyle = "#f6f7fb"; g.fillRect(212, 572, 146, 86);
  k.brillo(g, 285, 615, 380, AZUL, 0.5);
  g.fillStyle = "#23272f"; g.beginPath(); g.arc(320, 790, 46, 0, 7); g.fill();
  // armario
  g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(712, 560, 300, 210);
  g.fillStyle = "#7c5536"; g.fillRect(700, 540, 300, 200);
  g.fillStyle = "#5a3a22"; g.fillRect(700, 540, 300, 18);
  g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 4; g.beginPath(); g.moveTo(850, 560); g.lineTo(850, 740); g.stroke();
  // la alfombra de hierba
  g.drawImage(hierba, 120, 820, 860, 520);
  // el camino: aplastado → tierra → asfalto
  const pisado = Math.min(1, VIAJES.filter((v) => t > v.t1).length / 5 + 0.2 * k.tramo(t, Thuy - 0.2, Thuy + 0.3));
  const asfalto = k.suave(k.tramo(t, Taut - 0.25, Taut + 0.2));
  g.save(); g.lineCap = "round";
  g.strokeStyle = `rgba(110,140,70,${0.6 * Math.min(1, pisado * 3)})`; g.lineWidth = 120 + 40 * pisado;
  g.beginPath(); g.moveTo(...P0); g.quadraticCurveTo(...PC, ...P1); g.stroke();
  g.strokeStyle = `rgba(120,86,52,${pisado})`; g.lineWidth = 60 + 80 * pisado;
  g.beginPath(); g.moveTo(...P0); g.quadraticCurveTo(...PC, ...P1); g.stroke();
  if (asfalto > 0) {
    g.strokeStyle = `rgba(48,50,56,${asfalto})`; g.lineWidth = 170; g.beginPath(); g.moveTo(...P0); g.quadraticCurveTo(...PC, ...P1); g.stroke();
    g.setLineDash([36, 30]); g.lineDashOffset = -t * 160; g.strokeStyle = `rgba(255,236,150,${asfalto})`; g.lineWidth = 8;
    g.beginPath(); g.moveTo(...P0); g.quadraticCurveTo(...PC, ...P1); g.stroke(); g.setLineDash([]);
    g.strokeStyle = `rgba(240,240,240,${0.8 * asfalto})`; g.lineWidth = 6;
    for (const off of [-78, 78]) { g.beginPath(); g.moveTo(P0[0], P0[1] + off * 0.2); g.quadraticCurveTo(PC[0], PC[1] + off, P1[0], P1[1] + off * 0.2); g.stroke(); }
    g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(${AZUL},${0.35 * asfalto})`; g.lineWidth = 230;
    g.beginPath(); g.moveTo(...P0); g.quadraticCurveTo(...PC, ...P1); g.stroke(); g.restore();
  }
  g.restore();
  // él: al principio en el armario; luego va y viene
  let pos = P1, ang = Math.PI, anda = false;
  for (const vj of VIAJES) {
    if (t >= vj.t0 && t <= vj.t1) {
      const u = k.suave((t - vj.t0) / (vj.t1 - vj.t0)), uu = vj.ida ? 1 - u : u;
      pos = punto(uu);
      const p2 = punto(Math.min(1, Math.max(0, uu + (vj.ida ? -0.01 : 0.01))));
      ang = Math.atan2(p2[1] - pos[1], p2[0] - pos[0]); anda = true;
    } else if (t > vj.t1) { pos = vj.ida ? P0 : P1; }
  }
  if (t < Thuy - 0.2) pos = P1;
  persona(g, pos[0], pos[1], ang, t, anda);
  // el premio
  const up = t - Tpre;
  if (up > -0.05 && up < 1.2) { k.fogonazo(g, P1[0], P1[1], up * 1.3, 700, "255,214,110"); k.brillo(g, P1[0], P1[1], 380, "amarilla", Math.max(0, 1 - up)); }
  // borde suave del cuarto (se funde con el cerebro al alejarse)
  g.restore();
  g.save(); g.globalAlpha *= fuera;
  g.strokeStyle = "rgba(230,120,150,0.9)"; g.lineWidth = 40; k.redondo(g, 0, 300, 1080, 1300, 40); g.stroke();
  g.restore();
  g.restore();
  const vg = g.createLinearGradient(0, 250, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.5)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 250, 1080, 310);
}
