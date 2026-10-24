// Frases 4-8. El experimento (Tice, Bratslavsky y Baumeister, 2001), en un aula.
// «mal humor»: a los seis les sale una nube gris y se encogen. «test»: cae un examen en cada pupitre. «en vez de
// prepararlo»: la cámara va a los tres de la izquierda, que se ponen con el móvil, un avión de papel y a dormir; el reloj
// corre hasta el último minuto. «Pero a otros»: la cámara cruza a los de la derecha; su nube se congela. «estudiar»:
// se enderezan y escriben. «Porque no huían del test»: de vuelta a uno de la izquierda; el examen se apaga y su nube se
// tiñe de rojo.
import * as k from "#kit";
import { v } from "#voz";
import { camara, rutaCam, figura, cabeza, nube, mix, AZUL, ROJO, HIELO } from "../mundo.js";

export const desde = "en";

const f4 = v.frase(4), f5 = v.frase(5), f6 = v.frase(6), f7 = v.frase(7), f8 = v.frase(8);
const T0 = f4.inicio, Thum = f4.t("humor"), Ttest = f4.t("test");
const Tvez = f5.t("vez"), Tcual = f5.t("cualquier"), Thasta = f5.t("hasta"), Tmin = f5.t("minuto");
const Totros = f6.t("otros"), Tcong = f6.t("congelado"), Tmej = f6.t("mejorar"), Thic1 = f6.t("hicieran"), Thic2 = f6.t("hicieran", 2);
const Testu = f7.t("estudiar"), Tsi = f7.t("sí");
const Tporq = f8.inicio, Ttest2 = f8.t("test"), Tsent = f8.t("sentían"), Tfin = f8.fin;

// seis estudiantes: tres a la izquierda (su ánimo puede cambiar) y tres a la derecha (congelado)
const SUELO = 1540, MESA_Y = 1330;
const ALUMNOS = [-90, 160, 410, 670, 920, 1170].map((x, i) => ({ x, i, izq: i < 3, color: ["#d9644c", "#4c9a74", "#c99a3c", "#5a78c9", "#a85aa8", "#3fa3a3"][i] }));
export const caenNubes = ALUMNOS.map((a) => Thum + 0.05 + a.i * 0.07);
export const caenExamenes = ALUMNOS.map((a) => Ttest + 0.05 + a.i * 0.06);
export const avion = Tcual + 0.25;
// el tictac del segundero (fuera de «hasta... minuto», donde corre)
export const tictac = [];
for (let q = Math.ceil(T0) ; q < Tsent; q++) { const tt = T0 + (q - Math.ceil(T0)) + 1; if (tt < Tsent - 0.2 && (tt < Thasta - 0.3 || tt > Tmin + 0.4)) tictac.push(tt); }
export const golpecitos = [Thic1 + 0.1, Thic2 + 0.1];
export const hielo = ALUMNOS.filter((a) => !a.izq).map((a, j) => Tcong + j * 0.12);

const cam = rutaCam([
  [T0, { x: 540, y: 1110, z: 1.0 }],
  [Tvez - 0.1, { x: 540, y: 1100, z: 1.1 }],
  [Tvez + 0.7, { x: 170, y: 1070, z: 1.18 }],
  [Totros - 0.1, { x: 170, y: 1070, z: 1.2 }],
  [Totros + 0.75, { x: 915, y: 1070, z: 1.2 }],
  [Tporq - 0.05, { x: 915, y: 1070, z: 1.22 }],
  [Ttest2 + 0.1, { x: 60, y: 1120, z: 1.5 }],
  [Tsent + 0.35, { x: -90, y: 1030, z: 2.3 }],
]);

// el reloj: de las 10:00 a las 10:59 entre «hasta» y «minuto»
function reloj(g, x, y, r, t) {
  const corre = k.suave(k.tramo(t, Thasta - 0.2, Tmin + 0.1));
  const minutos = 5 + 54 * corre, rojo = k.tramo(t, Tmin - 0.1, Tmin + 0.15);
  g.save();
  g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.arc(x + 8, y + 10, r + 10, 0, 7); g.fill();
  g.fillStyle = "#e9e6df"; g.beginPath(); g.arc(x, y, r + 10, 0, 7); g.fill();
  const cara = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 5, x, y, r);
  cara.addColorStop(0, "#ffffff"); cara.addColorStop(1, mix("#e8e6e0", "#ffb3a8", rojo));
  g.fillStyle = cara; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = "#2a2d36"; g.lineCap = "round";
  for (let h = 0; h < 12; h++) { const a = (h / 12) * Math.PI * 2; g.lineWidth = h % 3 === 0 ? 7 : 4; g.beginPath(); g.moveTo(x + Math.sin(a) * r * 0.78, y - Math.cos(a) * r * 0.78); g.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); g.stroke(); }
  const am = (minutos / 60) * Math.PI * 2, ah = ((10 + minutos / 60) / 12) * Math.PI * 2;
  g.lineWidth = 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(ah) * r * 0.5, y - Math.cos(ah) * r * 0.5); g.stroke();
  g.strokeStyle = rojo > 0 ? `rgb(${ROJO})` : "#2a2d36"; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(am) * r * 0.8, y - Math.cos(am) * r * 0.8); g.stroke();
  // segundero: salta cada segundo (y corre en «hasta... minuto»)
  const as = (Math.floor(t - T0) / 60) * Math.PI * 2 + corre * Math.PI * 8;
  g.strokeStyle = `rgb(${ROJO})`; g.lineWidth = 3; g.beginPath(); g.moveTo(x - Math.sin(as) * 18, y + Math.cos(as) * 18); g.lineTo(x + Math.sin(as) * r * 0.86, y - Math.cos(as) * r * 0.86); g.stroke();
  g.fillStyle = "#2a2d36"; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
  g.restore();
  if (rojo > 0) k.brillo(g, x, y, r * 4, ROJO, 0.45 * rojo * (0.7 + 0.3 * Math.sin(t * 14)));
}

function aula(g) {
  const pg = g.createLinearGradient(0, 0, 0, SUELO);
  pg.addColorStop(0, "#1b2729"); pg.addColorStop(1, "#2a3a3b");
  g.fillStyle = pg; g.fillRect(-900, -600, 2900, SUELO + 600);
  // pizarra
  g.fillStyle = "#5a4632"; k.redondo(g, -40, 540, 1160, 430, 12); g.fill();
  const pz = g.createLinearGradient(0, 560, 0, 950);
  pz.addColorStop(0, "#21402f"); pz.addColorStop(1, "#16301f");
  g.fillStyle = pz; k.redondo(g, -22, 558, 1124, 394, 8); g.fill();
  g.save(); g.globalAlpha = 0.18; g.strokeStyle = "#e9f2e6"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(60, 650); g.bezierCurveTo(200, 610, 320, 700, 460, 640); g.moveTo(80, 760); g.lineTo(520, 760); g.moveTo(640, 640); g.lineTo(980, 700); g.stroke();
  g.restore();
  // luz de los fluorescentes
  for (const lx of [-300, 540, 1380]) { const lg = g.createRadialGradient(lx, 100, 10, lx, 100, 900); lg.addColorStop(0, "rgba(220,240,255,0.16)"); lg.addColorStop(1, "rgba(220,240,255,0)"); g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = lg; g.fillRect(lx - 900, -600, 1800, 1800); g.restore(); }
  // suelo
  const sg = g.createLinearGradient(0, SUELO - 200, 0, 2400);
  sg.addColorStop(0, "#3b4446"); sg.addColorStop(1, "#1d2324");
  g.fillStyle = sg; g.fillRect(-900, SUELO - 200, 2900, 1200);
  g.fillStyle = "#222b2c"; g.fillRect(-900, SUELO - 214, 2900, 16);
}

function pupitre(g, x, papel, brillaPapel, apagado) {
  // tablero
  const tg = g.createLinearGradient(0, MESA_Y - 30, 0, MESA_Y + 10);
  tg.addColorStop(0, "#c39a6b"); tg.addColorStop(1, "#8a6644");
  g.fillStyle = tg; g.beginPath(); g.moveTo(x - 130, MESA_Y - 26); g.lineTo(x + 130, MESA_Y - 26); g.lineTo(x + 150, MESA_Y + 8); g.lineTo(x - 150, MESA_Y + 8); g.closePath(); g.fill();
  // examen
  if (papel > 0) {
    const caida = (1 - k.entra(papel)) * -260;
    g.save(); g.translate(x - 10, MESA_Y - 14 + caida); g.rotate(0.08 - 0.3 * (1 - papel));
    g.fillStyle = mix(mix("#ffffff", "#7d8590", apagado), "#fff4d6", brillaPapel);
    g.beginPath(); g.moveTo(-60, -10); g.lineTo(60, -10); g.lineTo(66, 10); g.lineTo(-66, 10); g.closePath(); g.fill();
    g.restore();
    if (brillaPapel > 0) k.brillo(g, x - 10, MESA_Y - 14, 260, "amarilla", 0.45 * brillaPapel);
  }
  // frente del pupitre (tapa las piernas)
  const fg = g.createLinearGradient(x - 150, 0, x + 150, 0);
  fg.addColorStop(0, "#56606a"); fg.addColorStop(0.5, "#6b7681"); fg.addColorStop(1, "#4a535c");
  g.fillStyle = fg; g.fillRect(x - 142, MESA_Y + 8, 284, 150);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x - 142, MESA_Y + 8, 284, 10);
  g.fillStyle = "#30363c"; g.fillRect(x - 136, MESA_Y + 158, 16, 60); g.fillRect(x + 120, MESA_Y + 158, 16, 60);
}

export function dibuja(g, t) {
  g.save();
  camara(g, cam(Math.min(t, Tsent + 0.35)));
  aula(g);
  reloj(g, 300, 800, 105, t);
  for (const a of ALUMNOS) {
    const nubeU = k.tramo(t, caenNubes[a.i], caenNubes[a.i] + 0.45);
    const mal = k.suave(k.tramo(t, Thum, Thum + 0.6));
    const papel = k.tramo(t, caenExamenes[a.i], caenExamenes[a.i] + 0.35);
    // qué hace cada uno
    let o = { x: a.x, y: MESA_Y + 30, s: 0.95, sentado: 1, color: a.color, t, encoge: 0.7 * mal, brazoI: -0.2, brazoD: 0.2 };
    let estudia = 0;
    if (a.izq) {
      const u = k.suave(k.tramo(t, Tcual - 0.3 + a.i * 0.25, Tcual + 0.2 + a.i * 0.25));
      if (a.i === 0) o = { ...o, brazoD: k.mez(0.2, 0.9, u), brazoI: k.mez(-0.2, -0.35, u) };         // el móvil
      if (a.i === 1) o = { ...o, brazoD: k.mez(0.2, 2.6 - 1.2 * k.pulso(t, avion, 0.12), u) };          // lanza el avión
      if (a.i === 2) o = { ...o, apoya: u, encoge: k.mez(o.encoge, 1, u) };                              // a dormir
      // y en «sentían», el de la izquierda del todo se encoge más
      if (a.i === 0) o.encoge = Math.min(1, o.encoge + 0.3 * k.suave(k.tramo(t, Tsent - 0.3, Tsent + 0.2)));
    } else {
      estudia = k.suave(k.tramo(t, Tsi, Testu + 0.1));
      const escribe = estudia * Math.sin(t * 16) * 0.08;
      o = { ...o, encoge: k.mez(o.encoge, 0, estudia), brazoD: k.mez(o.brazoD, -0.55 + escribe, estudia), brazoI: k.mez(o.brazoI, 0.55, estudia) };
      if (a.i === 4) { const sube = Math.max(k.suave(k.tramo(t, Thic1 - 0.25, Thic1 + 0.05)) * (1 - k.suave(k.tramo(t, Thic1 + 0.3, Thic1 + 0.55))), k.suave(k.tramo(t, Thic2 - 0.25, Thic2 + 0.05)) * (1 - k.suave(k.tramo(t, Thic2 + 0.35, Thic2 + 0.7)))); o.brazoD = k.mez(o.brazoD, 2.75, sube); }
    }
    figura(g, o);
    // el móvil y su luz
    if (a.i === 0) {
      const u = k.suave(k.tramo(t, Tcual - 0.3, Tcual + 0.2));
      if (u > 0) {
        const c = cabeza(o);
        g.save(); g.globalAlpha *= u; g.fillStyle = "#14161c"; k.redondo(g, a.x + 36, c.y + 120, 54, 92, 10); g.fill();
        g.fillStyle = `rgb(${AZUL})`; k.redondo(g, a.x + 41, c.y + 126, 44, 78, 6); g.fill(); g.restore();
        k.brillo(g, a.x + 60, c.y + 120, 360, AZUL, 0.65 * u);
      }
    }
    pupitre(g, a.x, papel, a.izq ? 0 : estudia, a.izq ? k.suave(k.tramo(t, Ttest2 - 0.2, Ttest2 + 0.3)) : 0);
    // el lápiz de los que estudian
    if (!a.izq && estudia > 0) {
      const lx = a.x + 30 + Math.sin(t * 9 + a.i) * 18;
      g.save(); g.globalAlpha *= estudia; g.strokeStyle = "#f2c94c"; g.lineWidth = 10; g.lineCap = "round";
      g.beginPath(); g.moveTo(lx, MESA_Y - 20); g.lineTo(lx + 26, MESA_Y - 70); g.stroke(); g.restore();
    }
    // la nube
    const c = cabeza(o);
    const congela = a.izq ? 0 : k.suave(k.tramo(t, hielo[a.i - 3], hielo[a.i - 3] + 0.5));
    const enrojece = a.i === 0 ? k.suave(k.tramo(t, Tsent - 0.5, Tsent + 0.1)) : 0;
    const ruge = a.i === 0 ? k.pulso(t, Tsent + 0.05, 0.12) : 0;
    const llueve = k.suave(k.tramo(t, Thum + 0.6, Thum + 1.4)) * (1 - congela);
    const toca = a.i === 4 ? Math.max(k.pulso(t, Thic1 + 0.1, 0.12), k.pulso(t, Thic2 + 0.1, 0.12)) : 0;
    nube(g, c.x, c.y - 165 - 10 * Math.sin(t * 1.7 + a.i) * (1 - congela), 0.95 * k.entra(nubeU), t, { hielo: congela, rojo: enrojece, rayo: ruge, al: Math.min(1, nubeU * 3), lluvia: llueve, nieve: congela });
    if (toca > 0.05) k.brillo(g, c.x + 40, c.y - 120, 220, HIELO, 0.8 * toca);
  }
  // primer plano: pupitres vacíos, más cerca y en sombra (profundidad)
  for (const x of [-250, 160, 570, 980, 1390]) {
    g.save(); g.translate(x, 1810); g.scale(1.55, 1.55);
    g.fillStyle = "#6a4c32"; g.beginPath(); g.moveTo(-130, -26); g.lineTo(130, -26); g.lineTo(150, 8); g.lineTo(-150, 8); g.closePath(); g.fill();
    g.fillStyle = "#2c333b"; g.fillRect(-142, 8, 284, 170);
    g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(-130, -26, 260, 4);
    g.restore();
  }
  // el avión de papel
  const ua = k.tramo(t, avion, avion + 1.3);
  if (ua > 0 && ua < 1) {
    const ax = k.mez(170, 1100, ua), ay = 1100 - Math.sin(ua * Math.PI) * 380;
    g.save(); g.translate(ax, ay); g.rotate(-0.25 + ua * 0.5);
    g.fillStyle = "#f4f4f0"; g.beginPath(); g.moveTo(60, 0); g.lineTo(-40, -22); g.lineTo(-20, 0); g.lineTo(-40, 24); g.closePath(); g.fill();
    g.fillStyle = "#c9ccd2"; g.beginPath(); g.moveTo(60, 0); g.lineTo(-20, 0); g.lineTo(-40, 24); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();
  const vg = g.createLinearGradient(0, 260, 0, 560);
  vg.addColorStop(0, "rgba(0,0,0,0.45)"); vg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vg; g.fillRect(0, 260, 1080, 300);
}
