// Frases 5-9. El experimento con dos estudiantes grandes. Mal humor: nube y lluvia. Examen. El de la izquierda: móvil,
// avión de papel, siesta; el reloj se pone rojo. El de la derecha: la nube se congela; la toca dos veces y no cambia; se
// pone a estudiar. Vuelta al de la izquierda: el examen se apaga, la nube le cae encima y dentro asoma el miedo.
import * as k from "#kit";
import { v } from "#voz";
import { camara, rutaCam, nube, mix, AZUL, ROJO, HIELO } from "../mundo.js";
import { persona, miedo } from "../personajes.js";

export const desde = (v) => v.frase(5).inicio - 0.04;

const f5 = v.frase(5), f6 = v.frase(6), f7 = v.frase(7), f8 = v.frase(8), f9 = v.frase(9);
const T0 = f5.inicio, Thum = f5.t("humor"), Texa = f5.t("examen");
const Tqhic = f6.t("hicieron"), Tcual = f6.t("cualquier"), Tprep = f6.t("prepararlo"), Thasta = f6.t("hasta"), Tmin = f6.t("minuto");
const Totros = f7.t("otros"), Tcong = f7.t("congelado"), Th1 = f7.t("hicieran"), Th2 = f7.t("hicieran", 2), Tmej = f7.t("mejorar");
const T8 = f8.inicio, Test = f8.t("estudiar");
const T9 = f9.inicio, Texa2 = f9.t("examen"), Thui2 = f9.t("huían", 2), Tsen = f9.t("sentían"), Tfin = f9.fin;

const A = { x: 330, color: "#d9644c" }, B = { x: 770, color: "#4c9a74" };
const MESA = 1340;
export const momentos = {
  nubes: [Thum + 0.05, Thum + 0.2], examenes: [Texa + 0.05, Texa + 0.2], mira: Tqhic,
  movil: Tcual, avion: Tprep, siesta: Thasta, alarma: Tmin + 0.05, congela: Tcong, toques: [Th1 + 0.1, Th2 + 0.1],
  estudia: Test, apaga: Texa2, cae: Thui2, asoma: Tsen,
};

const cam = rutaCam([
  [T0, { x: 550, y: 940, z: 1.12 }],
  [Tqhic + 0.3, { x: 550, y: 935, z: 1.16 }],
  [Tcual + 0.25, { x: 330, y: 930, z: 1.3 }],
  [Totros - 0.1, { x: 330, y: 930, z: 1.32 }],
  [Totros + 0.7, { x: 770, y: 930, z: 1.3 }],
  [T9 - 0.05, { x: 770, y: 930, z: 1.33 }],
  [Texa2 + 0.2, { x: 330, y: 920, z: 1.5 }],
  [Tsen + 0.4, { x: 320, y: 860, z: 2.4 }],
]);

function reloj(g, x, y, r, t) {
  const corre = k.suave(k.tramo(t, Thasta - 0.3, Tmin + 0.05)), rojo = k.tramo(t, Tmin - 0.1, Tmin + 0.15);
  const minutos = 5 + 54 * corre;
  g.save();
  g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.arc(x + 8, y + 10, r + 12, 0, 7); g.fill();
  g.fillStyle = "#e9e6df"; g.beginPath(); g.arc(x, y, r + 12, 0, 7); g.fill();
  const cara = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 5, x, y, r);
  cara.addColorStop(0, "#ffffff"); cara.addColorStop(1, mix("#e8e6e0", "#ffb3a8", rojo));
  g.fillStyle = cara; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = "#2a2d36"; g.lineCap = "round";
  for (let h = 0; h < 12; h++) { const a = (h / 12) * Math.PI * 2; g.lineWidth = h % 3 === 0 ? 7 : 4; g.beginPath(); g.moveTo(x + Math.sin(a) * r * 0.78, y - Math.cos(a) * r * 0.78); g.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); g.stroke(); }
  const am = (minutos / 60) * Math.PI * 2, ah = ((10 + minutos / 60) / 12) * Math.PI * 2, as = (Math.floor(t - T0) / 60) * Math.PI * 2 + corre * Math.PI * 8;
  g.lineWidth = 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(ah) * r * 0.5, y - Math.cos(ah) * r * 0.5); g.stroke();
  g.strokeStyle = rojo > 0 ? `rgb(${ROJO})` : "#2a2d36"; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(am) * r * 0.8, y - Math.cos(am) * r * 0.8); g.stroke();
  g.strokeStyle = `rgb(${ROJO})`; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(as) * r * 0.86, y - Math.cos(as) * r * 0.86); g.stroke();
  g.fillStyle = "#2a2d36"; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
  g.restore();
  if (rojo > 0) k.brillo(g, x, y, r * 4, ROJO, 0.45 * rojo * (0.7 + 0.3 * Math.sin(t * 14)));
}
export const tictac = [];
for (let q = Math.ceil(T0) + 1; q < Tsen; q++) if (q < Thasta - 0.3 || q > Tmin + 0.4) tictac.push(q);

function aula(g) {
  const pg = g.createLinearGradient(0, 0, 0, 1500);
  pg.addColorStop(0, "#1b2729"); pg.addColorStop(1, "#2c3c3d");
  g.fillStyle = pg; g.fillRect(-900, -600, 2900, 2100);
  // pizarra con tiza vieja
  g.fillStyle = "#5a4632"; k.redondo(g, 40, 560, 1000, 360, 12); g.fill();
  const pz = g.createLinearGradient(0, 580, 0, 900);
  pz.addColorStop(0, "#22412f"); pz.addColorStop(1, "#16301f");
  g.fillStyle = pz; k.redondo(g, 58, 578, 964, 324, 8); g.fill();
  g.save(); g.globalAlpha = 0.16; g.strokeStyle = "#e9f2e6"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(120, 660); g.bezierCurveTo(240, 620, 330, 700, 450, 650); g.moveTo(120, 780); g.lineTo(380, 780); g.moveTo(700, 820); g.lineTo(960, 760); g.stroke();
  g.restore();
  for (const lx of [-300, 540, 1380]) { const lg = g.createRadialGradient(lx, 80, 10, lx, 80, 900); lg.addColorStop(0, "rgba(220,240,255,0.15)"); lg.addColorStop(1, "rgba(220,240,255,0)"); g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = lg; g.fillRect(lx - 900, -600, 1800, 1800); g.restore(); }
  const sg = g.createLinearGradient(0, 1300, 0, 2400);
  sg.addColorStop(0, "#3b4446"); sg.addColorStop(1, "#1d2324");
  g.fillStyle = sg; g.fillRect(-900, 1300, 2900, 1200);
  g.fillStyle = "#222b2c"; g.fillRect(-900, 1290, 2900, 14);
}

function pupitre(g, x, papel, apagado, luz) {
  const tg = g.createLinearGradient(0, MESA - 30, 0, MESA + 10);
  tg.addColorStop(0, "#c39a6b"); tg.addColorStop(1, "#8a6644");
  g.fillStyle = tg; g.beginPath(); g.moveTo(x - 170, MESA - 28); g.lineTo(x + 170, MESA - 28); g.lineTo(x + 190, MESA + 8); g.lineTo(x - 190, MESA + 8); g.closePath(); g.fill();
  // rayones del pupitre
  g.strokeStyle = "rgba(60,30,10,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 120, MESA - 18); g.lineTo(x - 70, MESA - 12); g.moveTo(x + 90, MESA - 20); g.lineTo(x + 130, MESA - 8); g.stroke();
  if (papel > 0) {
    const caida = (1 - k.entra(papel)) * -300;
    g.save(); g.translate(x + 10, MESA - 16 + caida); g.rotate(0.06 - 0.3 * (1 - papel));
    g.fillStyle = mix(mix("#ffffff", "#6d7580", apagado), "#fff4d6", luz);
    g.beginPath(); g.moveTo(-74, -12); g.lineTo(74, -12); g.lineTo(80, 12); g.lineTo(-80, 12); g.closePath(); g.fill();
    g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(-56, -6, 60, 3); g.fillRect(-56, 2, 90, 3);
    g.restore();
    if (luz > 0) k.brillo(g, x + 10, MESA - 16, 320, "amarilla", 0.5 * luz);
  }
  const fg = g.createLinearGradient(x - 180, 0, x + 180, 0);
  fg.addColorStop(0, "#56606a"); fg.addColorStop(0.5, "#6b7681"); fg.addColorStop(1, "#4a535c");
  g.fillStyle = fg; g.fillRect(x - 182, MESA + 8, 364, 170);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x - 182, MESA + 8, 364, 10);
  g.fillStyle = "#30363c"; g.fillRect(x - 176, MESA + 178, 18, 70); g.fillRect(x + 158, MESA + 178, 18, 70);
}

export function dibuja(g, t) {
  g.save();
  camara(g, cam(Math.min(t, Tsen + 0.4)));
  aula(g);
  reloj(g, 70, 700, 85, t);
  const mal = k.suave(k.tramo(t, Thum, Thum + 0.6));
  const parp = (s) => k.pulso(t, s, 0.05);
  // ── A (su ánimo puede cambiar)
  const uMov = k.tramo(t, Tcual - 0.2, Tprep - 0.2), uAvi = k.tramo(t, Tprep - 0.2, Thasta - 0.15), uSie = k.tramo(t, Thasta - 0.15, T9 + 0.4);
  const fase = t < Tcual - 0.2 ? 0 : t < Tprep - 0.2 ? 1 : t < Thasta - 0.15 ? 2 : 3;
  let oA = { x: A.x, y: MESA + 40, s: 1.0, sentado: 1, mira: 1, color: A.color, t, cara: mal > 0.5 ? "triste" : "neutral", encoge: 0.5 * mal, parpadeo: parp(19.5) + parp(24.2) };
  if (t > Tqhic - 0.1 && t < Tcual - 0.2) oA.mirada = [4, 4];
  if (fase === 1) oA = { ...oA, cara: "neutral", mirada: [0, 5], brazoD: [1.0, -1.2], brazoI: [0.9, -1.1] };
  if (fase === 2) oA = { ...oA, cara: "orgulloso", brazoD: [k.mez(1.0, 2.9, k.suave(k.tramo(t, Tprep - 0.2, Tprep + 0.2))), -0.2], brazoI: [0.3, 0.2] };
  if (fase === 3) oA = { ...oA, cara: "triste", parpadeo: t < T9 ? 1 : 0, encoge: t < T9 ? 1 : 0.8, inclina: t < T9 ? 0.35 : 0.1, brazoD: [0.8, -1.4], brazoI: [0.8, -1.4] };
  if (t > Tsen - 0.4) oA.cara = "agobio";
  const PA = persona(g, oA);
  if (fase === 1) { const m = PA.manoD; g.fillStyle = "#14161c"; k.redondo(g, m.x - 20, m.y - 70, 46, 82, 9); g.fill(); g.fillStyle = `rgb(${AZUL})`; k.redondo(g, m.x - 16, m.y - 64, 38, 68, 6); g.fill(); k.brillo(g, m.x, m.y - 40, 380, AZUL, 0.7); }
  const apagado = k.suave(k.tramo(t, Texa2 - 0.2, Texa2 + 0.4));
  pupitre(g, A.x, k.tramo(t, momentos.examenes[0], momentos.examenes[0] + 0.35), apagado, 0);
  // ── B (le congelan el ánimo)
  const congela = k.suave(k.tramo(t, Tcong - 0.1, Tcong + 0.5));
  const estudia = k.suave(k.tramo(t, T8 + 0.1, Test + 0.1));
  const toca = Math.max(k.suave(k.tramo(t, Th1 - 0.3, Th1 + 0.05)) * (1 - k.suave(k.tramo(t, Th1 + 0.3, Th1 + 0.55))), k.suave(k.tramo(t, Th2 - 0.3, Th2 + 0.05)) * (1 - k.suave(k.tramo(t, Th2 + 0.35, Th2 + 0.7))));
  const escribe = estudia * Math.sin(t * 15) * 0.12;
  let caraB = mal > 0.5 ? "triste" : "neutral";
  if (t > Tcong) caraB = "susto";
  if (t > Th1 - 0.3) caraB = "tenso";
  if (t > Tmej - 0.1) caraB = "neutral";
  if (estudia > 0.3) caraB = "concentrado";
  const oB = {
    x: B.x, y: MESA + 40, s: 1.0, sentado: 1, mira: -1, color: B.color, t, cara: caraB, parpadeo: parp(21.1) + parp(28.0),
    encoge: k.mez(0.5 * mal, 0, estudia), mirada: toca > 0.2 ? [2, -8] : t > Tqhic - 0.1 && t < Tcual ? [4, 4] : [0, 0],
    brazoD: estudia > 0 ? [k.mez(0.1, 1.15 + escribe, estudia), k.mez(0.15, -1.2, estudia)] : [k.mez(0.1, 2.8, toca), k.mez(0.15, -0.3, toca)],
    brazoI: estudia > 0 ? [k.mez(-0.1, 0.9, estudia), k.mez(0.15, -1.0, estudia)] : [-0.1, 0.15],
  };
  persona(g, oB);
  pupitre(g, B.x, k.tramo(t, momentos.examenes[1], momentos.examenes[1] + 0.35), 0, estudia);
  if (estudia > 0) { const lx = B.x - 30 + Math.sin(t * 9) * 16; g.save(); g.globalAlpha *= estudia; g.strokeStyle = "#f2c94c"; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.moveTo(lx, MESA - 22); g.lineTo(lx - 24, MESA - 76); g.stroke(); g.restore(); }
  // ── las nubes
  const cabA = { x: A.x + 10, y: 860 + 40 * oA.encoge }, cabB = { x: B.x - 10, y: 860 + 40 * oB.encoge };
  const nA = k.tramo(t, momentos.nubes[0], momentos.nubes[0] + 0.5), nB = k.tramo(t, momentos.nubes[1], momentos.nubes[1] + 0.5);
  const cae = k.suave(k.tramo(t, Thui2 - 0.2, Tsen + 0.2));
  const enrojece = k.suave(k.tramo(t, Tsen - 0.4, Tsen + 0.2));
  const xA = k.mez(cabA.x - 400, cabA.x, k.entra(nA)), xB = k.mez(cabB.x + 400, cabB.x, k.entra(nB));
  nube(g, xA, cabA.y - 200 + 90 * cae + 8 * Math.sin(t * 1.7), 1.15 * (1 + 0.15 * cae), t, { al: Math.min(1, nA * 2), lluvia: k.suave(k.tramo(t, Thum + 0.6, Thum + 1.3)) * (1 + cae), rojo: 0.5 * enrojece, rayo: k.pulso(t, Tsen + 0.05, 0.12) });
  if (enrojece > 0.05) miedo(g, xA + 18, cabA.y - 205 + 90 * cae, 0.42, t, { expr: "acecha", al: enrojece, brillo: 0.6, mira: [-0.6, 0.6] });
  const sacude = toca > 0.6 ? Math.sin(t * 40) * 2 : 0;
  nube(g, xB + sacude, cabB.y - 200 + 8 * Math.sin(t * 1.9) * (1 - congela), 1.15, t, { al: Math.min(1, nB * 2), hielo: congela, lluvia: k.suave(k.tramo(t, Thum + 0.6, Thum + 1.3)) * (1 - congela), nieve: congela });
  if (toca > 0.6) k.brillo(g, xB - 20, cabB.y - 150, 260, HIELO, 0.9 * (toca - 0.6) * 2.5);
  // el avión de papel
  const ua = k.tramo(t, Tprep, Tprep + 1.3);
  if (ua > 0 && ua < 1) {
    const ax = k.mez(A.x + 60, A.x + 900, ua), ay = 900 - Math.sin(ua * Math.PI) * 420;
    g.save(); g.translate(ax, ay); g.rotate(-0.3 + ua * 0.6);
    g.fillStyle = "#f4f4f0"; g.beginPath(); g.moveTo(70, 0); g.lineTo(-46, -26); g.lineTo(-22, 0); g.lineTo(-46, 28); g.closePath(); g.fill();
    g.fillStyle = "#c9ccd2"; g.beginPath(); g.moveTo(70, 0); g.lineTo(-22, 0); g.lineTo(-46, 28); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();
  const vg = g.createLinearGradient(0, 250, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.5)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 250, 1080, 310);
}
