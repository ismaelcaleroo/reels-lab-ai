# Reels explicativos · @ismaelsway

Reels verticales dibujados, de la idea al vídeo listo para publicar, hechos por la IA que abre esta carpeta.
Empieza por `EMPIEZA-AQUI.html`; las instrucciones para la IA están en `AGENTS.md` y el método en `METODO.md`.

```
METODO.md        cómo se hace un vídeo, paso a paso
AGENTS.md        las reglas para la IA (CLAUDE.md lo importa)
preferencias.md  lo que vale para todos los vídeos
guia/            guion, dibujo, sonido y muestras.jpg
motor/           herramientas (node motor/<x>.mjs --ayuda); lib/ por dentro y kit/ de dibujo
sonidos/         efectos aprobados (sonidos/LEEME.md)
letra/           letras de los subtítulos
negocio/         marca, avatar, voz, historias, ideas, referentes (notas/) y transcripciones/
ejemplo/         los dos vídeos de referencia (estrella-verde, alcohol)
proyectos/       un vídeo por carpeta
salida/          vídeos terminados (no se versionan)
```

Puesta en marcha: `npm install` y `node motor/doctor.mjs`. La clave de la voz se guarda con `node motor/clave.mjs` en
`.env.local`, que nunca se sube.
