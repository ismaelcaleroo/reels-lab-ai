# Alborna · Módulo 7, Inteligencia artificial

Notas completas, lección a lección, releídas el 24-10-2026. Lo da Edu en Higgsfield (Kling 3.0, Veo 3.1, Nano Banana),
con los prompts escritos por ChatGPT. En Reels Lab AI el dibujo lo hace el kit, no un generador de vídeo; de aquí se
coge cómo pedir con precisión y la medida justa de la IA. Al final de cada lección, cómo se traslada.

## Lección 1 · Prompts que la IA te entienda (6:16)

**La idea:** un prompt es una orden; hoy lo escribe bien ChatGPT si le das la imagen de referencia y le blindas lo que
no quieres que cambie.

- **El método:** arrastrar la imagen de referencia a ChatGPT y pedirle el prompt para una herramienta concreta, con lo
  que tiene que pasar y lo que no. Un chat nuevo para cada prompt, por si luego hay que corregirlo.
- **El ciervo (Kling 3.0):** «haz que este animal salga corriendo; la cámara fija, que no siga al animal; el fondo quede
  solo; no modifiques nada más de la imagen; mantén el encuadre, la composición y el estilo de ilustración». Si no se
  dice, «la cámara hace lo que quiere»: sigue al animal, sube, hace zoom.
- **Él levitando (Veo 3):** «que levite sutilmente; no quiero que se mueva demasiado, solo lo necesario para que parezca
  que está levitando y que hay vida». Hay que medir el grado: «si no hago indicaciones tan específicas, podría empezar a
  hacer locuras»; si se quiere una locura, se describe.
- **El viejo (Nano Banana):** primero se graba el vídeo moviéndose como ese viejo; luego, una captura del primer
  fotograma; el prompt: «conviértelo en un viejo de 90 años manteniendo sus rasgos más representativos» (cejas, mirada,
  nariz, boca), «no modifiques nada más; mantén el encuadre, la composición y la iluminación». Sin eso deforma la cara o
  hace un viejo cualquiera.

**Para Ismael:** al describir cada escena para el kit, decir lo que se mueve, cuánto se mueve y lo que no cambia; nada
se deja a lo que el dibujo «quiera hacer».

## Lección 2 · Animaciones (4:30)

**La idea:** animar una ilustración fija para que tenga vida sutil ahorra horas; la ilustración puede ser tuya o
generada.

- El ciervo, de Pinterest, animado a la primera en Kling 3.0 (unos 4 s, para no gastar créditos; 720 o 1080). Tiene
  algún fallo pequeño, «pero es tan rápido que pasa desapercibido».
- Mejor que sea algo tuyo: tus ilustraciones, o una hecha con Nano Banana. El ejemplo: «un hipopótamo en el agua, que
  parezca sacado de un libro para niños», en 9:16. Luego el prompt: «que el hipopótamo y su mundo tengan vida sutil, la
  toma fija, que respete el encuadre». Todo se mueve; un detalle raro en las orejas se salva usando el vídeo a partir de
  donde está bien.
- La referencia del ciervo (ilustración plana con grano, naranja cálido contra azul frío) está en
  `../../docs/alborna/referencia-ilustracion-ciervo.jpg`.

**Para Ismael:** la escena dibujada nunca está quieta del todo: el mundo respira (agua, hojas, luz) aunque el
protagonista no se mueva; y si algo sale raro, se corta el trozo malo en vez de enseñarlo.

## Lección 3 · Transformar imágenes en locuras (2:46)

**La idea:** con el prompt ya blindado, Veo 3.1 hace la levitación sutil a la primera; si falla, se le dice a ChatGPT
qué salió mal y devuelve un prompt corregido.

- El mismo panel: el fotograma, el prompt pegado, 4 s, 9:16 porque la imagen es vertical.
- Si hubiera fallado: «Veo 3 hizo que saliera volando del cuadro, me sacó del escenario». ChatGPT lo pule para que no
  pase («clásico Veo: le dices levita tantito y te manda al espacio»). Se borra el prompt viejo, se pega el nuevo y se
  genera otra vez.
- Vale para meter cualquier efecto visual en una imagen.

**Para Ismael:** cuando una escena sale mal, decir exactamente qué falló y corregir solo eso.

## Lección 4 · Cómo construir personajes (3:54)

**La idea:** el personaje se hace sobre un vídeo real: el primer fotograma transformado con Nano Banana y pegado encima
con el motion control de Kling, para que conserve la expresión y el movimiento humanos.

- Nano Banana con su referencia y el prompt del viejo. La primera no le encanta («me parezco mucho a mi abuelo»); genera
  otra vez hasta una en la que «si alguien lo ve, podría pensar que soy yo». Lo importante era que se le reconociera.
- **El primer fotograma, no otro:** se exporta como imagen y es ese el que se transforma.
- Kling 3.0 motion control: el vídeo normal hablando a cámara («te voy a contar algo que te ahorrará años») más el
  personaje; el modo de control de escena elige qué fondo conservar. Sale muy bien.
- **Alrededor del 30 % de sus animaciones** se hacían con IA en alguna etapa: era una forma de ir más rápido, siempre
  sobre una idea y un guion suyos.
- En Efectos 2 lo matizan: un personaje hecho entero con IA, hiperreal, «ese no eres tú, está muerto»; la expresión y la
  voz tienen que ser humanas (`8-efectos.md`).

**Para Ismael:** la IA ayuda a hacer, no a pensar: la idea, el guion y la voz son suyos; las caras dibujadas, con la
expresión que pide la frase.
