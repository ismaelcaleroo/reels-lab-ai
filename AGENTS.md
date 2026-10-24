# Reels explicativos

Esta carpeta hace reels explicativos dibujados, en el ordenador de quien la abre, con la IA que la está leyendo. Le
das una idea («hazme un vídeo de por qué el cielo es azul») y sale el vídeo, listo para publicar. Nada se publica solo.

El nivel es el de los ejemplos: `ejemplo/estrella-verde/estrella-verde.mp4` y `ejemplo/alcohol/alcohol.mp4`.

## Al abrir la carpeta

- **«Configúrame», «set me up» o es la primera vez:**
  1. `node motor/doctor.mjs`, e instala tú lo que falte (`npm install` en esta carpeta, ffmpeg, Node).
  2. Si no hay clave de voz, `node motor/clave.mjs`, que abre una página para pegarla.
  3. Si no existe `preferencias.md`, pregunta en un solo mensaje: en qué idioma y para quién son sus vídeos, cómo quiere
     cerrarlos (por ejemplo «Envíaselo a ese amigo que...») y si quiere efectos de sonido. Guárdalo en `preferencias.md`
     con sus palabras.
  4. Dile en una línea que ya puede pedir un vídeo.
- **Cualquier petición de vídeo, reel, guion o ideas para vídeos:** lee `METODO.md` entero y síguelo paso a paso. Lee
  las guías que dice (`guia/`) antes de empezar.
- **«Doctor» o algo se rompe:** `node motor/doctor.mjs` y arregla lo que diga.

## La carpeta

```
METODO.md        cómo se hace un vídeo, paso a paso (léelo entero antes de cada vídeo)
guia/            el guion, el dibujo y el sonido; muestras.jpg, lo que ya sabe dibujar el kit
motor/           las herramientas (cada una dice cómo se usa con --ayuda) y el kit de dibujo (motor/kit/)
sonidos/         los efectos aprobados (sonidos/LEEME.md)
letra/           las letras de los subtítulos (Google Sans; Figtree de respaldo)
negocio/         su marca, su voz, sus historias, sus referentes y sus transcripciones (lo lista preferencias.md)
ejemplo/         dos vídeos hechos con este método, enteros: para ver el nivel y cómo se construyen
proyectos/       un vídeo por carpeta
salida/          los vídeos terminados, con su portada y el texto del post
preferencias.md  lo que vale para todos sus vídeos, con sus palabras
.env.local       la clave de la voz; nunca se enseña ni se comparte
```

## Reglas

- Nunca pidas una clave en el chat: `node motor/clave.mjs`.
- **Nunca le pidas al creador que ejecute un comando:** tienes una terminal en su ordenador.
  - Instalar Node, ffmpeg o lo de `npm install` es trabajo tuyo.
  - Lo único suyo es escribir una contraseña o dar un permiso que el sistema no deja dar a nadie más.
  - Si algo falla por la máquina, arréglalo sin bajar la calidad y apúntalo en `maquina.md`.
- Sin subagentes ni agentes en paralelo, salvo que el creador diga que sí cuando se lo preguntes.
- Nunca publiques ni envíes nada en su nombre.
- Cada vídeo sale de esta carpeta. Para ver el nivel y cómo se construye, usa `ejemplo/`. No copies otros proyectos
  de `proyectos/` salvo que el creador te pida cambiar uno de ellos.
- Tus scripts de prueba van en tu carpeta temporal, no aquí: `motor/`, `guia/` y `ejemplo/` no se tocan al hacer un
  vídeo.
- Lo que el creador quiere para todos sus vídeos («a partir de ahora», «nunca quiero») va a `preferencias.md`, con sus
  palabras. Tus conclusiones no son preferencias suyas. No guardes en tu memoria cómo se hacen los vídeos: está aquí.
- Corto y claro en todo lo que le escribas. Una frase donde iban dos.
- Lo de dentro es tuyo: no le cuentes qué herramientas usas, qué mides ni cómo se revisa. Enséñale el guion y el vídeo,
  y pregúntale solo lo que solo él puede decidir.
- Un vídeo por conversación: el siguiente, en una conversación nueva.
