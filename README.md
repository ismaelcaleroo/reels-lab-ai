# reels-lab-ai

Motor para hacer reels animados (1080×1920) con IA a partir de un guion en JSON.

- **Voz**: Kokoro TTS en local, con el tiempo exacto de cada palabra.
- **Vídeo**: escenas animadas con GSAP (tipografía cinética, personaje cerebro, to-do, móvil, bucle, pasos, versus, CTA) renderizadas frame a frame con Chromium.
- **Sonido**: efectos sincronizados con lo que pasa en pantalla, música generada y mezcla con ducking; master a -14 LUFS.

```bash
npm run setup                              # una vez
npm run reel -- reels/procrastination      # → reels/procrastination/out/procrastination.mp4
npm run render -- reels/procrastination --stills 2,10,30   # fotogramas sueltos para revisar
```

Cada reel vive en `reels/<id>/reel.json` (voz, música y lista de escenas con `say` y su tipo visual).
