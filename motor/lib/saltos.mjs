// Lo que cambia de un fotograma al siguiente, medido en un mp4: los saltos sueltos (un fotograma que cambia mucho más
// que los de alrededor) y los fotogramas repetidos en pleno movimiento (un tirón). No es una nota: es dónde mirar.
import { execFileSync } from "node:child_process";

export function cambios(mp4, desde = 0, hasta = null) {
  const W = 90, H = 160, N = W * H;
  const args = ["-v", "error", ...(desde ? ["-ss", String(desde)] : []), "-i", mp4, ...(hasta ? ["-t", String(hasta - desde)] : []), "-vf", `scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"];
  const raw = execFileSync("ffmpeg", args, { maxBuffer: 1 << 30 });
  const n = raw.length / N, d = [0];
  for (let k = 1; k < n; k++) { let s = 0; for (let i = 0; i < N; i++) s += Math.abs(raw[k * N + i] - raw[(k - 1) * N + i]); d.push(s / N); }
  return d;
}

// saltos: [{ t, cambio, alrededor }]; repetidos: [t]. cortes: los segundos donde empieza un plano (ahí se espera).
export function saltos(mp4, fps, cortes = []) {
  const d = cambios(mp4), sueltos = [], repetidos = [];
  for (let k = 2; k < d.length - 2; k++) {
    const v = [d[k - 2], d[k - 1], d[k + 1], d[k + 2]].sort((a, b) => a - b), med = (v[1] + v[2]) / 2, t = k / fps;
    if (d[k] > 4 && d[k] > 3 * med + 1) sueltos.push({ t, cambio: d[k], alrededor: med, enCorte: cortes.some((c) => Math.abs(c - t) < 1.5 / fps) });
    if (d[k] < 0.05 && d[k - 1] > 1.5 && d[k + 1] > 1.5) repetidos.push(t);
  }
  return { sueltos, repetidos, porFotograma: d };
}
