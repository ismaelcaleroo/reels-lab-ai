# Por qué te da por ordenar el armario cuando tienes algo importante

Pedido el 2026-10-24 («la pereza y la procrastinación»).

- **Idea:** no es pereza; tu cerebro huye de cómo le hace sentir la tarea, y el alivio le enseña a repetirlo. Un solo
  experimento (Tice, Bratslavsky y Baumeister, 2001: el ánimo «congelado»). Fuentes en `idea.md`.
- **Símbolo:** el armario (vuelve en el gancho, en «tú igual», en la pregunta final y en el cierre). La emoción es
  siempre la misma nube: gris, roja o de hielo.
- **Voz:** el entorno en la nube no llega a api.elevenlabs.io, así que los planos se dibujaron y revisaron con una voz
  PROVISIONAL local (Kokoro), con el mismo formato de `voz/tiempos.json` (marcada `"provisional": true`). No hay
  `voz/toma.json`: `node motor/voz.mjs proyectos/2026-10-24-pereza-procrastinacion` pide la voz de Ismael y lo
  sustituye todo. Como los planos y los efectos van atados a palabras (`v.t`), se reajustan solos. Después:
  `node motor/sonido.mjs ...` y `node motor/render.mjs ...`. Mirar los cortes de nuevo con `ver.mjs ... planos`.
- **Lo que se arregló al revisar:** el fotograma 0 arranca ya con las puertas reventando; el plano general del cuarto
  se acercó (se veía pequeño); en el aula, figuras más grandes, pupitres en primer plano para dar profundidad, lluvia
  bajo las nubes de mal humor y nieve bajo las congeladas (había 3-4 s casi quietos); el reloj se bajó para no quedar
  debajo del subtítulo; el alivio pasó a una luz azul fuerte (antes no se notaba); en «hicieran lo que hicieran» uno
  toca su nube helada y no cambia.
- **Sonido:** solo los de `sonidos/`. Faltan `aire`, `aprieta` y `aviso` en esta copia: los movimientos de cámara van
  con `sube` suave. El tictac del reloj sube de nivel durante el aula (tensión).
- El nivel del borrador (-21 LUFS) es el de la voz provisional; con la de ElevenLabs la mezcla queda como en los
  vídeos aprobados.
