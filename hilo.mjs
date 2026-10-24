// Un trozo del render, en su propio hilo: dibuja los fotogramas de `primero` a `ultimo` y los guarda en un mp4.
import { parentPort, workerData } from "node:worker_threads";
import { codificador } from "./comun.mjs";
import { dibujar, preparar } from "./cuadro.mjs";
import { abrir } from "./proyecto.mjs";

const { dir, primero, ultimo, fps, salida, calidad, apertura } = workerData;
const proy = await abrir(dir, { apertura }), est = preparar(proy), cod = codificador(salida, fps, calidad);
for (let f = primero; f < ultimo; f++) {
  const lienzo = dibujar(proy, est, f / fps);
  await cod.escribe(Buffer.from(lienzo.data())); // una copia: el lienzo se vuelve a usar en el fotograma siguiente
  if ((f - primero) % 30 === 0) parentPort.postMessage({ hechos: f - primero });
}
await cod.cierra();
parentPort.postMessage({ fin: true, hechos: ultimo - primero });
