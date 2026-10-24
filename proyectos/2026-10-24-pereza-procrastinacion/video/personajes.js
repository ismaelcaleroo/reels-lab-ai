// Los dos personajes del vídeo: él (el que mira, 27-32 años, sudadera) y el miedo (una bolita roja que se esconde en
// el armario y es la que dobla la ropa). Los dos con cara: la expresión cuenta lo que siente (Kuleshov).
import * as k from "#kit";

const PIEL = { luz: "#f4d5bd", base: "#e0b293", sombra: "#b07f62" };

// expresiones: [ceja izq, ceja der] (giro), altura de cejas, apertura de ojos, boca
const CARAS = {
  neutral:     { ceja: [-0.05, 0.05], alto: 0, ojo: 1, boca: "recta" },
  tenso:       { ceja: [-0.32, 0.32], alto: 4, ojo: 1.05, boca: "apretada" },
  agobio:      { ceja: [-0.42, 0.42], alto: -2, ojo: 0.9, boca: "mueca" },
  alivio:      { ceja: [0.12, -0.12], alto: -6, ojo: 0, boca: "sonrisa" },
  orgulloso:   { ceja: [0.18, -0.18], alto: -8, ojo: 0.75, boca: "sonrisa" },
  triste:      { ceja: [-0.38, 0.38], alto: -6, ojo: 0.75, boca: "triste" },
  susto:       { ceja: [-0.2, 0.2], alto: -16, ojo: 1.35, boca: "o" },
  concentrado: { ceja: [0.25, -0.25], alto: 6, ojo: 0.8, boca: "recta" },
  pillado:     { ceja: [-0.3, 0.1], alto: -12, ojo: 1.25, boca: "mueca" },
};

function boca(g, tipo, w) {
  g.lineCap = "round"; g.strokeStyle = "#5a2d22"; g.lineWidth = 4.5;
  g.beginPath();
  if (tipo === "sonrisa") { g.moveTo(-w, -2); g.quadraticCurveTo(0, w * 0.9, w, -2); g.stroke(); }
  else if (tipo === "triste") { g.moveTo(-w * 0.8, 6); g.quadraticCurveTo(0, -w * 0.5, w * 0.8, 6); g.stroke(); }
  else if (tipo === "apretada") { g.moveTo(-w * 0.7, 2); g.lineTo(w * 0.7, 0); g.stroke(); }
  else if (tipo === "mueca") { g.moveTo(-w, 4); g.quadraticCurveTo(-w * 0.3, -3, 0, 2); g.quadraticCurveTo(w * 0.4, 7, w, -1); g.stroke(); }
  else if (tipo === "o") { g.fillStyle = "#4a221a"; g.beginPath(); g.ellipse(0, 4, w * 0.35, w * 0.45, 0, 0, 7); g.fill(); }
  else { g.moveTo(-w * 0.6, 2); g.quadraticCurveTo(0, 5, w * 0.6, 2); g.stroke(); }
}

// Un brazo de dos tramos desde el hombro: a1 ángulo del brazo (0 = colgando, >0 hacia delante), a2 doblez del codo.
function brazo(g, x, y, a1, a2, largo, color, mano = true) {
  const L1 = largo * 0.52, L2 = largo * 0.48;
  const ex = x + Math.sin(a1) * L1, ey = y + Math.cos(a1) * L1;
  const hx = ex + Math.sin(a1 + a2) * L2, hy = ey + Math.cos(a1 + a2) * L2;
  g.strokeStyle = color; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = 30;
  g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.08)"; g.lineWidth = 8;
  g.beginPath(); g.moveTo(x - 6, y); g.lineTo(ex - 6, ey); g.stroke();
  if (mano) { g.fillStyle = PIEL.base; g.beginPath(); g.arc(hx, hy, 15, 0, 7); g.fill(); g.fillStyle = "rgba(0,0,0,0.12)"; g.beginPath(); g.arc(hx + 4, hy + 4, 9, 0, 7); g.fill(); }
  return { x: hx, y: hy };
}

/**
 * Él. o = { x, y (pies), s, mira (1 a la derecha, -1 a la izquierda), cara (nombre de CARAS), mirada [dx, dy],
 *   parpadeo (0..1), brazoI/brazoD: [a1, a2], inclina, encoge (0..1), sentado (0..1), tiembla, t, color, pecho (0..1:
 *   se agarra el pecho) }. Devuelve dónde quedan las manos y la cabeza.
 */
export function persona(g, o) {
  const { x, y, s = 1, mira = 1, cara = "neutral", mirada = [0, 0], parpadeo = 0, brazoI = [-0.1, 0.15], brazoD = [0.1, 0.15],
    inclina = 0, encoge = 0, sentado = 0, tiembla = 0, t = 0, color = "#2f6fe0", pecho = 0 } = o;
  const C = CARAS[cara] || CARAS.neutral;
  const out = {};
  g.save();
  g.translate(x + (tiembla ? Math.sin(t * 63) * 3 * tiembla : 0), y);
  g.scale(s * mira, s);
  // sombra en el suelo
  g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(0, 0, 95, 15, 0, 0, 7); g.fill();
  const cad = -k.mez(205, 130, sentado);
  // piernas (vaqueros) y zapatillas
  g.lineCap = "round"; g.lineWidth = 42; g.strokeStyle = "#2c3a55";
  if (sentado < 0.5) {
    g.beginPath(); g.moveTo(-22, cad); g.lineTo(-26, -22); g.moveTo(22, cad); g.lineTo(26, -22); g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.06)"; g.lineWidth = 10; g.beginPath(); g.moveTo(-30, cad + 10); g.lineTo(-33, -30); g.stroke();
    for (const sx of [-26, 26]) { g.fillStyle = "#f2f2f2"; k.redondo(g, sx - 26, -26, 60, 26, 12); g.fill(); g.fillStyle = "#cfd3da"; g.fillRect(sx - 26, -6, 60, 5); }
  } else {
    g.beginPath(); g.moveTo(-14, cad); g.lineTo(78, cad + 8); g.lineTo(82, -22); g.stroke();
    g.fillStyle = "#f2f2f2"; k.redondo(g, 66, -26, 60, 26, 12); g.fill();
  }
  // tronco (sudadera con capucha)
  g.save(); g.translate(0, cad); g.rotate(inclina + encoge * 0.18);
  const th = 215 - encoge * 20, tw = 132;
  const sg = g.createLinearGradient(-tw / 2, 0, tw / 2, 0);
  sg.addColorStop(0, shade(color, -0.35)); sg.addColorStop(0.45, color); sg.addColorStop(1, shade(color, -0.2));
  // capucha detrás del cuello
  g.fillStyle = shade(color, -0.3); g.beginPath(); g.ellipse(0, -th + 6, 54, 26, 0, 0, 7); g.fill();
  g.fillStyle = sg; k.redondo(g, -tw / 2, -th, tw, th + 24, 48); g.fill();
  // bolsillo canguro y cordones
  g.fillStyle = "rgba(0,0,0,0.13)"; k.redondo(g, -42, -78, 84, 44, 14); g.fill();
  g.strokeStyle = "#e8e8e8"; g.lineWidth = 4; g.beginPath(); g.moveTo(-12, -th + 18); g.lineTo(-14, -th + 70); g.moveTo(12, -th + 18); g.lineTo(14, -th + 70); g.stroke();
  // brazos (el de detrás primero)
  const hombro = -th + 34;
  const mangaAtras = shade(color, -0.28), manga = shade(color, -0.1);
  out.manoI = brazo(g, -tw / 2 + 16, hombro, brazoI[0], brazoI[1], 200, mangaAtras);
  // cabeza
  g.save();
  g.translate(0, -th - 62 + encoge * 26);
  g.rotate(-inclina * 0.4);
  g.fillStyle = PIEL.base; g.fillRect(-16, 30, 32, 40);
  const hg = g.createRadialGradient(-22, -22, 8, 0, 0, 82);
  hg.addColorStop(0, PIEL.luz); hg.addColorStop(0.65, PIEL.base); hg.addColorStop(1, PIEL.sombra);
  g.fillStyle = hg; g.beginPath(); g.ellipse(0, 0, 60, 70, 0, 0, 7); g.fill();
  // oreja
  g.fillStyle = PIEL.base; g.beginPath(); g.ellipse(-56, 6, 12, 18, 0, 0, 7); g.fill();
  // barba de tres días
  g.fillStyle = "rgba(60,40,30,0.18)"; g.beginPath(); g.ellipse(6, 36, 46, 30, 0, 0, Math.PI); g.fill();
  // pelo
  const pg = g.createLinearGradient(0, -80, 0, -10);
  pg.addColorStop(0, "#3b2a20"); pg.addColorStop(1, "#22170f");
  g.fillStyle = pg; g.beginPath();
  g.moveTo(-62, -2); g.quadraticCurveTo(-70, -66, -10, -78); g.quadraticCurveTo(48, -86, 64, -34); g.quadraticCurveTo(62, -16, 52, -14);
  g.quadraticCurveTo(30, -40, 2, -34); g.quadraticCurveTo(-30, -30, -44, -12); g.quadraticCurveTo(-52, 4, -62, -2); g.fill();
  // cara (mirando hacia +x, en 3/4)
  const ox = 14;
  const ojo = (cx, i) => {
    const ap = Math.max(0.06, C.ojo * (1 - parpadeo));
    g.save(); g.translate(cx, -4);
    if (C.ojo === 0) { g.strokeStyle = "#2a1a12"; g.lineWidth = 4; g.beginPath(); g.arc(0, 2, 9, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.restore(); return; }
    g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(0, 0, 11, 13 * ap, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(0, 0, 11, 13 * ap, 0, 0, 7); g.clip();
    g.fillStyle = "#2b1d14"; g.beginPath(); g.arc(3 + mirada[0], 1 + mirada[1], 7, 0, 7); g.fill();
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(5 + mirada[0], -2 + mirada[1], 2.4, 0, 7); g.fill();
    g.restore();
    // ceja
    g.strokeStyle = "#2a1a12"; g.lineWidth = 6; g.lineCap = "round";
    g.save(); g.translate(0, -22 - C.alto); g.rotate(C.ceja[i]); g.beginPath(); g.moveTo(-11, 0); g.lineTo(11, 0); g.stroke(); g.restore();
    g.restore();
  };
  ojo(ox - 8, 0); ojo(ox + 28, 1);
  // nariz
  g.strokeStyle = PIEL.sombra; g.lineWidth = 4; g.beginPath(); g.moveTo(ox + 14, 4); g.quadraticCurveTo(ox + 24, 20, ox + 12, 22); g.stroke();
  // boca
  g.save(); g.translate(ox + 12, 40); boca(g, C.boca, 15); g.restore();
  // mejillas cuando sonríe
  if (C.boca === "sonrisa") { g.fillStyle = "rgba(230,110,110,0.25)"; g.beginPath(); g.arc(ox - 14, 22, 9, 0, 7); g.arc(ox + 40, 22, 9, 0, 7); g.fill(); }
  // gota de sudor cuando hay agobio
  if (cara === "agobio" || cara === "tenso") { g.fillStyle = "rgba(160,215,255,0.85)"; g.beginPath(); g.moveTo(-40, -36); g.quadraticCurveTo(-30, -18, -38, -12); g.quadraticCurveTo(-48, -18, -40, -36); g.fill(); }
  g.restore();
  out.cabeza = { x: x, y: y + s * (cad - th - 62 + encoge * 26) };
  // brazo de delante (encima del cuerpo); si se agarra el pecho, va al pecho
  const ad = pecho > 0 ? [k.mez(brazoD[0], 0.45, pecho), k.mez(brazoD[1], -2.9, pecho)] : brazoD;
  out.manoD = brazo(g, tw / 2 - 16, hombro, ad[0], ad[1], 200, manga);
  g.restore();
  g.restore();
  // manos en coordenadas de pantalla (aprox.)
  for (const m of ["manoI", "manoD"]) {
    const p = out[m];
    out[m] = { x: x + s * mira * p.x, y: y + s * (cad + p.y) };
  }
  return out;
}

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  const c = (v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f);
  return `rgb(${c(r)},${c(gg)},${c(b)})`;
}

// ── El miedo ─────────────────────────────────────────────────────────────────────
// Una bolita roja brillante con ojos grandes y bracitos. expr: acecha | pillado | asustado | pequeno.
// etiqueta: 0..1 (la etiqueta «miedo a que salga mal» pegada). dobla: 0..1 (los bracitos doblando una camiseta).
export function miedo(g, x, y, s, t, { expr = "acecha", mira = [0, 0], etiqueta = 0, dobla = 0, al = 1, brillo = 1, saluda = 0 } = {}) {
  if (al <= 0.01 || s <= 0.01) return;
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= al;
  const bote = Math.sin(t * 5.2) * 3;
  // halo
  k.brillo(g, 0, 0, 420, "255,80,70", 0.45 * brillo);
  // pies
  g.fillStyle = "#8f1d1a"; g.beginPath(); g.ellipse(-26, 78, 18, 9, 0, 0, 7); g.ellipse(26, 78, 18, 9, 0, 0, 7); g.fill();
  // cuerpo (judía)
  g.save(); g.translate(0, bote);
  const bg = g.createRadialGradient(-26, -34, 6, 0, 0, 96);
  bg.addColorStop(0, "#ff9a8a"); bg.addColorStop(0.45, "#f0433a"); bg.addColorStop(1, "#a51d1a");
  g.fillStyle = bg; g.beginPath();
  g.moveTo(0, -78); g.bezierCurveTo(64, -80, 82, -10, 70, 34); g.bezierCurveTo(60, 74, -60, 80, -70, 36); g.bezierCurveTo(-84, -10, -60, -76, 0, -78); g.fill();
  g.fillStyle = "rgba(255,255,255,0.45)"; g.beginPath(); g.ellipse(-28, -48, 16, 9, -0.5, 0, 7); g.fill();
  // bracitos
  const ab = dobla > 0 ? Math.sin(t * 22) * 0.5 * dobla : 0, sal = saluda > 0 ? Math.sin(t * 12) * 0.7 * saluda : 0;
  g.strokeStyle = "#b52520"; g.lineWidth = 11; g.lineCap = "round";
  g.beginPath(); g.moveTo(-64, 10); g.lineTo(-96 + 20 * dobla, 30 - 30 * dobla + 20 * ab); g.stroke();
  g.beginPath(); g.moveTo(64, 10); g.lineTo(96 - 20 * dobla, 30 - 30 * dobla - 20 * ab - 60 * saluda + 20 * sal); g.stroke();
  if (dobla > 0.05) { // la camiseta que dobla
    g.save(); g.translate(0, 34 - 8 * Math.abs(ab)); g.rotate(ab * 0.3);
    g.fillStyle = "#3d8fd6"; k.redondo(g, -58 * (0.6 + 0.4 * dobla), -14, 116 * (0.6 + 0.4 * dobla), 26, 6); g.fill();
    g.restore();
  }
  // ojos
  const E = { acecha: [0.55, 0.3, 0], pillado: [1.25, -0.2, 1], asustado: [1.15, -0.45, 0], pequeno: [0.8, -0.4, 0] }[expr] || [1, 0, 0];
  const [ap, ceja, sonrie] = E;
  for (const ex of [-24, 24]) {
    g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(ex, -14, 17, 20 * ap, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(ex, -14, 17, 20 * ap, 0, 0, 7); g.clip();
    g.fillStyle = "#1a0b0a"; g.beginPath(); g.arc(ex + 3 + mira[0] * 6, -12 + mira[1] * 6, 9, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(ex + 6 + mira[0] * 6, -16 + mira[1] * 6, 3, 0, 7); g.fill();
    g.restore();
    g.strokeStyle = "#5e0f0d"; g.lineWidth = 7; g.lineCap = "round";
    g.save(); g.translate(ex, -40 - 6 * ap); g.rotate((ex < 0 ? 1 : -1) * ceja); g.beginPath(); g.moveTo(-13, 0); g.lineTo(13, 0); g.stroke(); g.restore();
  }
  // boca
  g.strokeStyle = "#5e0f0d"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath();
  if (sonrie) { g.moveTo(-22, 22); g.quadraticCurveTo(0, 44, 22, 22); g.stroke(); g.fillStyle = "#fff"; g.fillRect(-12, 24, 24, 6); }
  else if (expr === "acecha") { g.moveTo(-14, 26); g.quadraticCurveTo(8, 34, 20, 20); g.stroke(); }
  else { g.moveTo(-12, 30); g.quadraticCurveTo(0, 22, 12, 30); g.stroke(); }
  // la etiqueta
  if (etiqueta > 0.01) {
    g.save(); g.translate(0, 52); g.rotate(-0.12); g.scale(k.entra(etiqueta), k.entra(etiqueta));
    g.fillStyle = "#fbf6e4"; g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 2;
    k.redondo(g, -128, -22, 256, 44, 6); g.fill(); g.stroke();
    g.fillStyle = "#2b2b2b"; g.font = '700 21px "Google Sans"'; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("miedo a que salga mal", 0, 1);
    g.restore();
  }
  g.restore();
  g.restore();
}
