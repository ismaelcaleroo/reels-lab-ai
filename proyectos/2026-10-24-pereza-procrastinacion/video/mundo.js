// Lo que comparten los planos: el cuarto (armario, escritorio, ventana), la figura, la nube de lo que se siente y la
// cámara. Todo en coordenadas del cuarto visto entero (1080 × 1920); la cámara acerca y mueve ese mundo.
import * as k from "#kit";

export const W = 1080, H = 1920;

// ── La cámara: mira al punto (x, y) del mundo con zoom z ─────────────────────────────
export function camara(g, cam) {
  g.translate(W / 2, H / 2);
  g.scale(cam.z, cam.z);
  g.translate(-cam.x, -cam.y);
}
export const mezCam = (a, b, u) => ({ x: k.mez(a.x, b.x, u), y: k.mez(a.y, b.y, u), z: Math.exp(k.mez(Math.log(a.z), Math.log(b.z), u)) });
// Una ruta de cámara por claves [[t, cam], ...] sin tirones (zoom en escala logarítmica).
export function rutaCam(claves) {
  const fx = k.claves(claves.map(([t, c]) => [t, c.x])), fy = k.claves(claves.map(([t, c]) => [t, c.y]));
  const fz = k.claves(claves.map(([t, c]) => [t, Math.log(c.z)]));
  return (t) => ({ x: fx(t), y: fy(t), z: Math.exp(fz(t)) });
}

// Mezcla dos colores "#rrggbb" y devuelve otro "#rrggbb" (se puede volver a mezclar).
export function mix(a, b, u) {
  const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const x = h(a), y = h(b);
  return "#" + x.map((v, i) => Math.round(k.mez(v, y[i], Math.max(0, Math.min(1, u)))).toString(16).padStart(2, "0")).join("");
}

// ── Colores de la casa ───────────────────────────────────────────────────────────
export const AZUL = "47,124,246";     // el acento de Ismael (el de los subtítulos)
export const ROJO = "255,72,64";      // la emoción que escuece
export const HIELO = "150,215,255";
const PIEL = ["#f3d9c2", "#d9a888", "#9b6a52"];

// ── Texturas, una vez ────────────────────────────────────────────────────────────
const grano = k.ruido(512, 7, 9, 4, "manchas");
const vetas = (() => {
  const l = k.lienzo(512), c = l.getContext("2d");
  const r = k.azar(31);
  c.fillStyle = "#808080"; c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) {
    const y = r() * 512, a = 0.08 + r() * 0.18;
    c.strokeStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.6})`;
    c.lineWidth = 0.6 + r() * 2.4;
    c.beginPath(); c.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 4 + (r() - 0.5) * 2);
    c.stroke();
  }
  return l;
})();

function textura(g, img, x, y, w, h, modo = "multiply", al = 0.35, escala = 1) {
  g.save();
  g.globalCompositeOperation = modo; g.globalAlpha *= al;
  const pat = g.createPattern(img, "repeat");
  g.fillStyle = pat;
  g.translate(x, y); g.scale(escala, escala);
  g.fillRect(0, 0, w / escala, h / escala);
  g.restore();
}

// ── El cuarto ────────────────────────────────────────────────────────────────────
export const ARMARIO = { x: 560, y: 540, w: 400, h: 790 };   // cuerpo del armario
export const MESA = { x: 30, y: 1170, w: 430 };
export const SUELO = 1330;

export function cuarto(g, { lampara = 1, pantalla = 0.6, ventana = 1 } = {}) {
  // pared: degradado y grano
  const pg = g.createLinearGradient(0, -400, 0, SUELO);
  pg.addColorStop(0, "#151a26"); pg.addColorStop(0.6, "#1d2231"); pg.addColorStop(1, "#262a36");
  g.fillStyle = pg; g.fillRect(-1200, -1200, 3500, SUELO + 1200);
  g.save(); g.beginPath(); g.rect(-1200, -1200, 3500, SUELO + 1200); g.clip();
  textura(g, grano, -1200, -1200, 3500, SUELO + 1200, "multiply", 0.25, 2);
  g.restore();
  // zócalo
  g.fillStyle = "#2d2f38"; g.fillRect(-1200, SUELO - 26, 3500, 26);
  // suelo de madera en perspectiva
  const sg = g.createLinearGradient(0, SUELO, 0, 2600);
  sg.addColorStop(0, "#3a2c22"); sg.addColorStop(1, "#1c140f");
  g.fillStyle = sg; g.fillRect(-1200, SUELO, 3500, 1800);
  g.save(); g.beginPath(); g.rect(-1200, SUELO, 3500, 1800); g.clip();
  g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 3;
  for (let i = -14; i <= 22; i++) { g.beginPath(); g.moveTo(540 + i * 40, SUELO); g.lineTo(540 + i * 260, 3000); g.stroke(); }
  textura(g, vetas, -1200, SUELO, 3500, 1800, "overlay", 0.5, 1.5);
  g.restore();
  // ventana con la noche
  ventanaNoche(g, 60, 500, 280, 420, ventana);
  // alfombra gastada
  g.save(); g.globalAlpha *= 0.9;
  const ag = g.createLinearGradient(0, SUELO + 60, 0, SUELO + 420);
  ag.addColorStop(0, "#5b3a3a"); ag.addColorStop(1, "#3e2626");
  g.fillStyle = ag; g.beginPath(); g.moveTo(150, SUELO + 70); g.lineTo(930, SUELO + 70); g.lineTo(1060, SUELO + 420); g.lineTo(40, SUELO + 420); g.closePath(); g.fill();
  g.strokeStyle = "rgba(230,200,160,0.25)"; g.lineWidth = 6; g.stroke();
  g.restore();
  // corcho con pósits y una foto
  g.fillStyle = "#3c2a1c"; k.redondo(g, 372, 600, 170, 230, 6); g.fill();
  g.fillStyle = "#b98a58"; k.redondo(g, 380, 608, 154, 214, 4); g.fill();
  textura(g, grano, 380, 608, 154, 214, "multiply", 0.5, 0.6);
  [[392, 622, "#ffe066", -0.08], [452, 640, "#ff9f8f", 0.06], [400, 700, "#8fe0b0", 0.04], [462, 726, "#ffe066", -0.05]].forEach(([px, py, pc, pa]) => {
    g.save(); g.translate(px + 30, py + 30); g.rotate(pa); g.fillStyle = pc; g.fillRect(-30, -30, 60, 60);
    g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-20, -14, 40, 3); g.fillRect(-20, -4, 30, 3); g.fillRect(-20, 6, 36, 3);
    g.fillStyle = "#d33"; g.beginPath(); g.arc(0, -24, 4, 0, 7); g.fill(); g.restore();
  });
  // papeles arrugados en el suelo
  [[180, SUELO + 140, 22], [250, SUELO + 190, 18], [120, SUELO + 210, 16]].forEach(([px, py, pr], i) => {
    const pg2 = g.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 2, px, py, pr);
    pg2.addColorStop(0, "#f4f1ea"); pg2.addColorStop(1, "#b9b4aa");
    g.fillStyle = pg2; g.beginPath();
    for (let a = 0; a < 7; a += 0.7) { const rr = pr * (0.8 + 0.25 * Math.sin(a * 5 + i)); g.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.8); }
    g.closePath(); g.fill();
  });
  // luz cálida de la lámpara sobre la pared
  if (lampara > 0) {
    const lg = g.createRadialGradient(410, 1040, 10, 410, 1040, 700);
    lg.addColorStop(0, `rgba(255,190,120,${0.35 * lampara})`); lg.addColorStop(1, "rgba(255,190,120,0)");
    g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = lg; g.fillRect(-300, 300, 1400, 1500); g.restore();
  }
  // reflejo frío de la pantalla en la pared
  if (pantalla > 0) {
    const pg2 = g.createRadialGradient(240, 1080, 10, 240, 1080, 520);
    pg2.addColorStop(0, `rgba(${AZUL},${0.28 * pantalla})`); pg2.addColorStop(1, `rgba(${AZUL},0)`);
    g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = pg2; g.fillRect(-300, 500, 1100, 1200); g.restore();
  }
}

function ventanaNoche(g, x, y, w, h, al) {
  g.save();
  const vg = g.createLinearGradient(0, y, 0, y + h);
  vg.addColorStop(0, "#0b1d3f"); vg.addColorStop(1, "#24427a");
  k.redondo(g, x, y, w, h, 10); g.fillStyle = vg; g.fill();
  // luna y edificios
  k.brillo(g, x + w * 0.72, y + h * 0.22, 140, "azul", 0.9 * al);
  g.fillStyle = "#08111f";
  const r = k.azar(5);
  for (let i = 0; i < 7; i++) {
    const bw = 30 + r() * 40, bh = 60 + r() * 150, bx = x + i * (w / 7);
    g.fillRect(bx, y + h - bh, bw, bh);
    g.fillStyle = "rgba(255,214,140,0.7)";
    for (let j = 0; j < 5; j++) if (r() < 0.45) g.fillRect(bx + 6 + (j % 2) * 12, y + h - bh + 12 + j * 22, 6, 9);
    g.fillStyle = "#08111f";
  }
  // marco
  g.strokeStyle = "#3a3f4d"; g.lineWidth = 14; k.redondo(g, x, y, w, h, 10); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
  // luz de luna en el suelo
  g.globalCompositeOperation = "lighter";
  const lg = g.createLinearGradient(x, y, x + 300, SUELO + 300);
  lg.addColorStop(0, `rgba(120,160,255,${0.06 * al})`); lg.addColorStop(1, "rgba(120,160,255,0)");
  g.fillStyle = lg; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w + 380, SUELO + 260); g.lineTo(x + 140, SUELO + 260); g.closePath(); g.fill();
  g.restore();
}

// ── La ropa ──────────────────────────────────────────────────────────────────────
// 12 camisas ordenadas por color (de rojo a violeta, como un arcoíris) y 3 estantes de pilas dobladas.
export const COLORES_ROPA = ["#e8504a", "#f07a3c", "#f2a83a", "#efd04a", "#9cc954", "#4cb880", "#38b3b0", "#3d8fd6", "#3f63c9", "#6b55c4", "#9a59bf", "#c5579e"];
const rr = k.azar(77);
export const DESORDEN = COLORES_ROPA.map(() => ({ x: (rr() - 0.5) * 900, y: (rr() - 0.3) * 700, a: (rr() - 0.5) * 3.5, s: 1.3 + rr() * 0.9, d: rr() * 0.6 }));

export function camisa(g, x, y, col, ang = 0, s = 1, colgada = true) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
  if (colgada) { // percha
    g.strokeStyle = "#b9bcc6"; g.lineWidth = 3; g.beginPath(); g.arc(0, -10, 7, Math.PI, Math.PI * 2.2); g.stroke();
    g.beginPath(); g.moveTo(-20, 8); g.lineTo(0, -3); g.lineTo(20, 8); g.stroke();
  }
  // cuerpo de la camisa (vista de lado, colgada): estrecha y alta
  const cg = g.createLinearGradient(-16, 0, 16, 0);
  cg.addColorStop(0, mix(col, "#000000", 0.35)); cg.addColorStop(0.45, col); cg.addColorStop(1, mix(col, "#000000", 0.25));
  g.fillStyle = cg;
  g.beginPath(); g.moveTo(-20, 6); g.quadraticCurveTo(-27, 120, -22, 250); g.lineTo(22, 250); g.quadraticCurveTo(27, 120, 20, 6); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(-6, 14, 5, 232);
  g.fillStyle = mix(col, "#000000", 0.45); g.beginPath(); g.moveTo(-12, 6); g.lineTo(0, 22); g.lineTo(12, 6); g.closePath(); g.fill();
  g.restore();
}

export function pila(g, x, y, col, n, ancho = 100) {
  for (let i = 0; i < n; i++) {
    const yy = y - i * 22, c = mix(col, i % 2 ? "#ffffff" : "#000000", 0.08);
    k.redondo(g, x - ancho / 2, yy - 20, ancho, 22, 6);
    const pg = g.createLinearGradient(0, yy - 20, 0, yy + 2);
    pg.addColorStop(0, mix(c, "#ffffff", 0.15)); pg.addColorStop(1, mix(c, "#000000", 0.3));
    g.fillStyle = pg; g.fill();
    g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(x - ancho / 2 + 6, yy - 3, ancho - 12, 2);
  }
}

// ── El armario ───────────────────────────────────────────────────────────────────
// abre: 0 cerrado, 1 abierto. orden: 0 revuelto → 1 todo en su sitio (u por prenda). pilas: [0..1] cuánto hay en cada
// estante. brilloFinal: el barrido de luz de «perfecto». rojo: la luz roja escondida al fondo (0..1).
export function armario(g, t, { abre = 1, ordenCamisa = () => 1, pilas = [1, 1, 1], barrido = -1, rojo = 0, aparta = 0, fondo = null } = {}) {
  const { x, y, w, h } = ARMARIO;
  // sombra en el suelo
  g.save(); g.globalAlpha *= 0.55;
  const so = g.createRadialGradient(x + w / 2, y + h + 6, 10, x + w / 2, y + h + 6, w * 0.75);
  so.addColorStop(0, "rgba(0,0,0,0.8)"); so.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = so; g.beginPath(); g.ellipse(x + w / 2, y + h + 6, w * 0.75, 50, 0, 0, 7); g.fill(); g.restore();
  // cuerpo de madera
  const mg = g.createLinearGradient(x, 0, x + w, 0);
  mg.addColorStop(0, "#7c5536"); mg.addColorStop(0.5, "#9a6c45"); mg.addColorStop(1, "#6a4529");
  g.fillStyle = mg; g.fillRect(x - 18, y - 30, w + 36, h + 30);
  g.save(); g.beginPath(); g.rect(x - 18, y - 30, w + 36, h + 30); g.clip();
  textura(g, vetas, x - 18, y - 30, w + 36, h + 30, "overlay", 0.7, 0.9);
  g.restore();
  g.fillStyle = "#5a3a22"; g.fillRect(x - 26, y - 44, w + 52, 22); // cornisa
  g.fillStyle = "rgba(255,220,180,0.18)"; g.fillRect(x - 26, y - 44, w + 52, 4);
  // interior (hueco oscuro)
  const ix = x + 10, iy = y + 10, iw = w - 20, ih = h - 20;
  const ig = g.createLinearGradient(0, iy, 0, iy + ih);
  ig.addColorStop(0, "#1a120c"); ig.addColorStop(1, "#2a1d13");
  g.fillStyle = ig; g.fillRect(ix, iy, iw, ih);
  // la luz roja del fondo (lo que escondes)
  if (rojo > 0.01) {
    const cx = ix + iw * 0.5, cy = iy + 230;
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    k.brillo(g, cx, cy, 520 * (0.8 + 0.2 * rojo), ROJO, 0.75 * rojo);
    k.brillo(g, cx, cy, 160, ROJO, rojo);
    g.restore();
  }
  // lo que hay detrás de la ropa
  if (fondo) { g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip(); fondo(g); g.restore(); }
  // barra y camisas
  g.fillStyle = "#c9ccd4"; g.fillRect(ix + 6, iy + 36, iw - 12, 8);
  const n = COLORES_ROPA.length, paso = (iw - 40) / (n - 1);
  COLORES_ROPA.forEach((col, i) => {
    const u = k.suave(Math.min(1, Math.max(0, ordenCamisa(i))));
    const d = DESORDEN[i];
    // se apartan hacia los lados (para ver lo de atrás)
    const lado = i < n / 2 ? -1 : 1, sep = aparta * lado * (60 + Math.abs(i - (n - 1) / 2) * 6);
    const fx = ix + 20 + i * paso + sep, fy = iy + 42;
    camisa(g, k.mez(fx + d.x, fx, u), k.mez(fy + d.y, fy, u), col, k.mez(d.a, 0, u), k.mez(d.s, 1, u), u > 0.6);
  });
  // estantes con pilas
  const est = [iy + 400, iy + 545, iy + 690];
  est.forEach((ey, j) => {
    g.fillStyle = "#5c3d25"; g.fillRect(ix, ey, iw, 14);
    g.fillStyle = "rgba(255,220,180,0.12)"; g.fillRect(ix, ey, iw, 3);
    const cols = j === 0 ? ["#e8504a", "#efd04a", "#4cb880"] : j === 1 ? ["#3d8fd6", "#6b55c4", "#c5579e"] : ["#d8d2c4", "#5b6170", "#2b3140"];
    cols.forEach((c, q) => {
      const cuantas = Math.floor(5 * Math.max(0, Math.min(1, pilas[j] * 3 - q)) + 1e-6);
      if (cuantas > 0) pila(g, ix + 70 + q * 125, ey, c, cuantas);
    });
  });
  // sombra interior superior (profundidad)
  const sh = g.createLinearGradient(0, iy, 0, iy + 140);
  sh.addColorStop(0, "rgba(0,0,0,0.55)"); sh.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sh; g.fillRect(ix, iy, iw, 140);
  // barrido de luz de «perfecto»
  if (barrido >= 0 && barrido <= 1) {
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    g.globalCompositeOperation = "lighter";
    const by = iy - 200 + barrido * (ih + 400), bg = g.createLinearGradient(0, by - 120, 0, by + 120);
    bg.addColorStop(0, "rgba(255,255,255,0)"); bg.addColorStop(0.5, "rgba(255,248,230,0.45)"); bg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = bg; g.fillRect(ix, by - 120, iw, 240);
    g.restore();
  }
  // puertas: giran hacia fuera (se ven en escorzo)
  puerta(g, x, y, w / 2, h, abre, -1);
  puerta(g, x + w, y, w / 2, h, abre, 1);
}

function puerta(g, bisagra, y, w, h, abre, lado) {
  const a = Math.min(1, abre) * Math.PI * 0.62;          // ángulo
  const ancho = w * Math.cos(a), salida = w * Math.sin(a) * 0.22;
  const xf = bisagra - lado * ancho;                      // borde libre (cerrada: hacia el centro)
  const x0 = bisagra, x1 = lado > 0 ? bisagra - ancho : bisagra + ancho;
  // cerrada: la puerta va de bisagra hacia el centro; abierta: se dobla hacia fuera
  const fuera = abre > 0.5;
  const xa = bisagra, xb = abre < 0.5 ? x1 : bisagra + lado * ancho;
  void xf; void x0;
  const top = y - salida, bot = y + h + salida;
  g.save();
  const dg = g.createLinearGradient(Math.min(xa, xb), 0, Math.max(xa, xb), 0);
  const claro = fuera ? "#b07c50" : "#9a6c45", oscuro = fuera ? "#6f4a2d" : "#7c5536";
  dg.addColorStop(0, lado > 0 ? claro : oscuro); dg.addColorStop(1, lado > 0 ? oscuro : claro);
  g.fillStyle = dg;
  g.beginPath(); g.moveTo(xa, y); g.lineTo(xb, top); g.lineTo(xb, bot); g.lineTo(xa, y + h); g.closePath(); g.fill();
  g.clip();
  textura(g, vetas, Math.min(xa, xb) - 10, top, Math.abs(xb - xa) + 20, bot - top, "overlay", 0.6, 0.9);
  g.restore();
  // panel y tirador
  g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 3;
  const m = (u, v) => [k.mez(xa, xb, u), k.mez(k.mez(y, top, u), k.mez(y + h, bot, u), v)];
  g.beginPath(); const p = [m(0.15, 0.06), m(0.85, 0.06), m(0.85, 0.94), m(0.15, 0.94)];
  g.moveTo(...p[0]); p.slice(1).forEach((q) => g.lineTo(...q)); g.closePath(); g.stroke();
  const tir = m(0.82, 0.5);
  g.fillStyle = "#d8c7a0"; g.beginPath(); g.ellipse(tir[0], tir[1], 6, 18, 0, 0, 7); g.fill();
}

// ── Escritorio y portátil ──────────────────────────────────────────────────────────
// doc: 0 apagado/cerrado → 1 el documento abierto. cursor: parpadeo. lineas: líneas escritas (0 = página en blanco).
export function escritorio(g, t, { doc = 1, latido = 0, lineas = 0, rotulo = "Proyecto final" } = {}) {
  const { x, y, w } = MESA;
  // lámpara
  g.strokeStyle = "#2b2f3a"; g.lineWidth = 10; g.lineCap = "round";
  g.beginPath(); g.moveTo(x + w - 60, y); g.lineTo(x + w - 90, y - 130); g.lineTo(x + w - 30, y - 210); g.stroke();
  g.fillStyle = "#2b2f3a"; g.beginPath(); g.ellipse(x + w - 60, y - 2, 40, 10, 0, 0, 7); g.fill();
  g.save(); g.translate(x + w - 30, y - 210); g.rotate(0.5);
  g.fillStyle = "#3a3f4c"; g.beginPath(); g.moveTo(-40, 0); g.lineTo(40, 0); g.lineTo(26, -50); g.lineTo(-26, -50); g.closePath(); g.fill();
  g.restore();
  k.brillo(g, x + w - 48, y - 178, 260, "naranja", 0.8);
  // tablero
  const tg = g.createLinearGradient(0, y, 0, y + 40);
  tg.addColorStop(0, "#8a6040"); tg.addColorStop(1, "#4d331f");
  g.fillStyle = tg; g.fillRect(x - 20, y, w + 40, 36);
  g.save(); g.beginPath(); g.rect(x - 20, y, w + 40, 36); g.clip(); textura(g, vetas, x - 20, y, w + 40, 36, "overlay", 0.6); g.restore();
  g.fillStyle = "#3a2717"; g.fillRect(x, y + 36, 22, 230); g.fillRect(x + w - 22, y + 36, 22, 230);
  // taza con cerco de café y una planta
  g.fillStyle = "rgba(60,30,10,0.35)"; g.beginPath(); g.ellipse(x + 20, y + 6, 26, 6, 0, 0, 7); g.fill();
  const tz = g.createLinearGradient(x - 4, 0, x + 44, 0); tz.addColorStop(0, "#d9d4cc"); tz.addColorStop(1, "#8f8a84");
  g.fillStyle = tz; k.redondo(g, x - 2, y - 52, 44, 54, 6); g.fill();
  g.strokeStyle = "#a9a49d"; g.lineWidth = 7; g.beginPath(); g.arc(x + 44, y - 26, 12, -1.2, 1.2); g.stroke();
  g.fillStyle = "#5a3a22"; g.beginPath(); g.ellipse(x + 20, y - 50, 20, 5, 0, 0, 7); g.fill();
  g.fillStyle = "#7a5236"; k.redondo(g, x + w - 140, y - 40, 40, 40, 6); g.fill();
  g.strokeStyle = "#4f9a5a"; g.lineWidth = 7; g.lineCap = "round";
  for (const [dx, dy] of [[-20, -60], [6, -78], [22, -52], [-4, -46]]) { g.beginPath(); g.moveTo(x + w - 120, y - 40); g.quadraticCurveTo(x + w - 120 + dx * 0.4, y - 60, x + w - 120 + dx, y - 40 + dy); g.stroke(); }
  // portátil
  const lx = x + 70, lw = 300, lh = 200, ly = y - lh - 8;
  g.fillStyle = "#8d929c"; k.redondo(g, lx - 30, y - 12, lw + 60, 14, 6); g.fill();
  const sg = g.createLinearGradient(lx, ly, lx + lw, ly + lh);
  sg.addColorStop(0, "#5d636e"); sg.addColorStop(1, "#3c414b");
  k.redondo(g, lx - 10, ly - 10, lw + 20, lh + 18, 14); g.fillStyle = sg; g.fill();
  // pantalla
  pantallaDoc(g, lx, ly, lw, lh, t, { doc, lineas, rotulo });
  // luz de la pantalla hacia fuera
  k.brillo(g, lx + lw / 2, ly + lh / 2, 700, AZUL, 0.22 * doc + 0.35 * latido);
}

export function pantallaDoc(g, lx, ly, lw, lh, t, { doc = 1, lineas = 0, rotulo = "" } = {}) {
  g.save();
  k.redondo(g, lx, ly, lw, lh, 6); g.clip();
  g.fillStyle = "#0c1222"; g.fillRect(lx, ly, lw, lh);
  if (doc > 0) {
    g.globalAlpha *= doc;
    g.fillStyle = "#f6f7fb"; g.fillRect(lx + 34, ly + 14, lw - 68, lh);
    g.fillStyle = "#1d2433"; g.font = `700 ${Math.round(lh * 0.09)}px "Google Sans"`;
    g.fillText(rotulo, lx + 50, ly + 44);
    g.fillStyle = "#c9ced9";
    for (let i = 0; i < lineas; i++) g.fillRect(lx + 50, ly + 62 + i * 16, (lw - 110) * (i % 3 === 2 ? 0.6 : 1), 6);
    const cy = ly + 56 + lineas * 16;
    if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = `rgb(${AZUL})`; g.fillRect(lx + 50, cy, 3, 18); }
  }
  g.restore();
}

// ── La figura ───────────────────────────────────────────────────────────────────
// Una persona sencilla, con volumen. o: { x, y (pies), s (escala), mira (-1 izq, 1 der), inclina (rad), brazoI, brazoD
// (ángulo del brazo desde el hombro, rad), encoge (0..1), sentado (0..1), color (camiseta), tiembla }.
export function figura(g, o) {
  const { x, y, s = 1, mira = 1, inclina = 0, brazoI = -0.15, brazoD = 0.15, encoge = 0, sentado = 0, color = "#3d6fd6", tiembla = 0, t = 0, apoya = 0 } = o;
  g.save();
  g.translate(x + tiembla * Math.sin(t * 70) * 4, y); g.scale(s * mira, s);
  // sombra
  g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(0, 0, 90, 16, 0, 0, 7); g.fill();
  const alto = k.mez(360, 250, sentado), cad = -k.mez(200, 120, sentado);
  // piernas
  g.strokeStyle = "#252a36"; g.lineCap = "round"; g.lineWidth = 46;
  if (sentado < 0.5) { g.beginPath(); g.moveTo(-22, cad); g.lineTo(-26, -20); g.moveTo(22, cad); g.lineTo(28, -20); g.stroke(); }
  else { g.beginPath(); g.moveTo(-10, cad); g.lineTo(80, cad + 10); g.lineTo(84, -20); g.stroke(); }
  // tronco
  g.save(); g.translate(0, cad); g.rotate(inclina + encoge * 0.25);
  const tw = 120, th = alto - 150;
  const cg = g.createLinearGradient(-tw / 2, 0, tw / 2, 0);
  cg.addColorStop(0, mix(color, "#000000", 0.35)); cg.addColorStop(0.5, color); cg.addColorStop(1, mix(color, "#000000", 0.2));
  g.fillStyle = cg; k.redondo(g, -tw / 2, -th, tw, th + 20, 46); g.fill();
  // brazos
  const brazo = (lado, ang) => {
    g.save(); g.translate(lado * (tw / 2 - 14), -th + 30); g.rotate(-ang); // ang > 0: el brazo va hacia delante
    g.strokeStyle = mix(color, "#000000", 0.15); g.lineWidth = 34; g.lineCap = "round";
    g.beginPath(); g.moveTo(0, 0); g.lineTo(lado * 6, 150); g.stroke();
    g.fillStyle = PIEL[1]; g.beginPath(); g.arc(lado * 6, 162, 18, 0, 7); g.fill();
    g.restore();
  };
  brazo(-1, brazoI); brazo(1, brazoD);
  // cabeza
  const hy = -th - 70 + encoge * 30 + apoya * 120;
  g.fillStyle = PIEL[1]; g.fillRect(-16, -th - 30 + encoge * 20, 32, 30);
  const hg = g.createRadialGradient(-20, hy - 24, 8, 0, hy, 78);
  hg.addColorStop(0, PIEL[0]); hg.addColorStop(0.7, PIEL[1]); hg.addColorStop(1, PIEL[2]);
  g.fillStyle = hg; g.beginPath(); g.arc(0, hy, 66, 0, 7); g.fill();
  // pelo (sin cara: la postura cuenta lo que siente)
  const pg = g.createLinearGradient(0, hy - 70, 0, hy);
  pg.addColorStop(0, "#3a2b22"); pg.addColorStop(1, "#211812");
  g.fillStyle = pg; g.beginPath(); g.arc(0, hy - 4, 68, Math.PI * 1.05, Math.PI * 1.95); g.quadraticCurveTo(70, hy - 30, 60, hy - 6); g.quadraticCurveTo(0, hy - 34, -60, hy - 6); g.quadraticCurveTo(-70, hy - 30, -66, hy - 24); g.fill();
  // luz de borde (separa la figura del fondo)
  g.strokeStyle = "rgba(255,226,190,0.35)"; g.lineWidth = 5; g.beginPath(); g.arc(0, hy, 64, -0.9, 0.5); g.stroke();
  g.restore();
  g.restore();
}

// Dónde queda la cabeza de una figura (para poner su nube encima).
export function cabeza(o) {
  const { x, y, s = 1, sentado = 0, encoge = 0, apoya = 0 } = o;
  const alto = k.mez(360, 250, sentado), cad = -k.mez(200, 120, sentado), th = alto - 150;
  return { x, y: y + s * (cad - th - 70 + encoge * 30 + apoya * 120) };
}

// ── La nube de lo que se siente ───────────────────────────────────────────────────
// tipo: { gris, rojo (0..1, se tiñe por dentro), hielo (0..1), rayo (0..1 intensidad) }
const BOLAS = [[-70, 10, 52], [-25, -22, 62], [32, -16, 58], [74, 12, 46], [0, 18, 60], [-40, 30, 44], [44, 30, 42]];
const fr = k.azar(91);
const CRISTALES = Array.from({ length: 26 }, () => [(fr() - 0.5) * 220, (fr() - 0.5) * 110, 10 + fr() * 26, fr() * 6.28]);

export function nube(g, x, y, s, t, { rojo = 0, hielo = 0, rayo = 0, al = 1, respira = 1, lluvia = 0, nieve = 0 } = {}) {
  if (al <= 0.01 || s <= 0.01) return;
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= al;
  // lluvia (mal humor) o nieve (ánimo congelado), siempre cayendo
  if (lluvia > 0.01 || nieve > 0.01) {
    for (let i = 0; i < 18; i++) {
      const px = -95 + ((i * 53) % 190), fase = ((i * 0.37) % 1);
      if (lluvia > 0.01) {
        const u = (t * 1.9 + fase) % 1, py = 55 + u * 260;
        g.strokeStyle = `rgba(170,190,215,${0.55 * lluvia * (1 - u)})`; g.lineWidth = 3;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px - 4, py + 24); g.stroke();
      }
      if (nieve > 0.01) {
        const u = (t * 0.45 + fase) % 1, py = 60 + u * 280, dx = Math.sin(t * 2 + i) * 10;
        g.fillStyle = `rgba(235,248,255,${0.85 * nieve * (1 - u)})`;
        g.beginPath(); g.arc(px + dx, py, 4 + (i % 3), 0, 7); g.fill();
      }
    }
  }
  const sopla = hielo > 0.9 ? 0 : respira;
  // sombra suave
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(0, 70, 110, 16, 0, 0, 7); g.fill();
  const base = mix(mix("#7d869a", "#a43a3a", rojo), "#3f9fe0", hielo);
  const alto = mix(mix("#c9d0dd", "#ff8a7a", rojo), "#dff6ff", hielo);
  if (hielo > 0.01) k.brillo(g, 0, 0, 520, HIELO, 0.45 * hielo);
  BOLAS.forEach(([bx, by, br], i) => {
    const r = br * (1 + 0.05 * sopla * Math.sin(t * 2.2 + i * 1.3));
    const gg = g.createRadialGradient(bx - r * 0.35, by - r * 0.45, r * 0.1, bx, by, r);
    gg.addColorStop(0, alto); gg.addColorStop(1, base);
    g.fillStyle = gg; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
  });
  // panza más oscura
  g.fillStyle = `rgba(20,24,34,${0.25 * (1 - hielo)})`; g.beginPath(); g.ellipse(0, 40, 100, 22, 0, 0, 7); g.fill();
  if (rojo > 0.01) k.brillo(g, 0, 10, 300, ROJO, 0.55 * rojo * (0.8 + 0.2 * Math.sin(t * 9)));
  if (rayo > 0.01) {
    g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(255,${rojo > 0.5 ? 140 : 230},${rojo > 0.5 ? 120 : 160},${rayo})`;
    g.lineWidth = 6; g.lineJoin = "round";
    g.beginPath(); g.moveTo(-10, 40); g.lineTo(8, 80); g.lineTo(-6, 86); g.lineTo(14, 130); g.stroke();
    g.restore();
  }
  if (hielo > 0.01) {
    // cristales y escarcha
    g.save(); g.globalAlpha *= hielo;
    for (const [cx, cy, cr, ca] of CRISTALES) {
      g.save(); g.translate(cx, cy); g.rotate(ca);
      g.fillStyle = "rgba(235,250,255,0.7)"; g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, -cr); g.lineTo(cr * 0.5, 0); g.lineTo(0, cr); g.lineTo(-cr * 0.5, 0); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    // carámbanos
    g.fillStyle = "rgba(170,225,255,0.95)";
    for (let i = -4; i <= 4; i++) { const ix = i * 22, ih = 24 + ((i * 37) % 3 + 3) * 8; g.beginPath(); g.moveTo(ix - 9, 52); g.lineTo(ix + 9, 52); g.lineTo(ix, 52 + ih); g.closePath(); g.fill(); }
    k.brillo(g, -40, -20, 200, HIELO, 0.5);
    g.restore();
  }
  g.restore();
}
