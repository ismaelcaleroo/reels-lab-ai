#!/usr/bin/env python3
"""Genera la voz en off de un reel con Kokoro (TTS local) y los tiempos de cada palabra.

Uso:  python tools/voice.py reels/<id>

Lee  reels/<id>/reel.json  y escribe en  reels/<id>/build/:
  voice.wav     voz completa (24 kHz, mono)
  timing.json   inicio/fin de cada escena y de cada palabra (segundos)

Cada escena se sintetiza por separado y se cachea por hash, así que cambiar una
frase solo regenera esa escena.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "models" / "kokoro-v1.0-timed.onnx"
VOICES = ROOT / "models" / "voices-v1.0.bin"
SR = 24000

LEAD_IN = 0.30      # silencio antes de la primera palabra
DEFAULT_GAP = 0.16  # silencio entre escenas (deja sitio a la transición)
SENTENCE_PAUSE = 0.06  # pausa extra tras . ! ? (el modelo ya hace la suya)
CLAUSE_PAUSE = 0.0     # pausa extra tras , ; :
TAIL = 1.20         # silencio final (el CTA respira)

PUNCT = set(".,!?;:…—–-\"'“”‘’()")


def clean(word: str) -> str:
    """Forma normalizada de una palabra para emparejarla con la escena."""
    return re.sub(r"[^a-z0-9']", "", word.lower().replace("’", "'"))


def load_kokoro():
    if not MODEL.exists():
        sys.exit("Falta models/kokoro-v1.0-timed.onnx. Ejecuta: npm run setup")
    from kokoro_onnx import Kokoro
    return Kokoro(str(MODEL), str(VOICES))


def voice_style(k, spec):
    """Una voz ('am_michael') o una mezcla ({'am_michael': 0.7, 'am_puck': 0.3})."""
    if isinstance(spec, str):
        return k.get_voice_style(spec)
    total = sum(spec.values())
    return sum(k.get_voice_style(n) * (w / total) for n, w in spec.items())


def phoneme_words(timings):
    """Agrupa los fonemas en palabras (separadas por espacio) con su intervalo."""
    words, cur = [], []
    for t in timings:
        if t.phoneme == " ":
            if cur:
                words.append(cur)
            cur = []
        else:
            cur.append(t)
    if cur:
        words.append(cur)
    out = []
    for w in words:
        sounding = [t for t in w if t.phoneme not in PUNCT] or w
        out.append({"start": sounding[0].start, "end": sounding[-1].end,
                    "n": len(sounding)})
    return out


def text_tokens(say: str):
    """Palabras visibles; la puntuación suelta se pega a la palabra anterior."""
    toks = []
    for raw in say.split():
        if not any(c.isalnum() for c in raw) and toks:
            toks[-1] += raw
        else:
            toks.append(raw)
    return toks


def align(k, lang, say, timings):
    """Asigna a cada palabra del texto su intervalo de audio."""
    toks = text_tokens(say)
    pw = phoneme_words(timings)
    # Cuántas palabras fonéticas produce cada palabra del texto
    counts = []
    for tok in toks:
        ph = k.tokenizer.phonemize(tok, lang) if clean(tok) else ""
        counts.append(max(1, len(ph.split())) if ph else 0)

    words = []
    if sum(counts) == len(pw):
        i = 0
        for tok, c in zip(toks, counts):
            if c == 0:
                prev = words[-1]["end"] if words else (pw[0]["start"] if pw else 0)
                words.append({"text": tok, "start": prev, "end": prev})
                continue
            seg = pw[i:i + c]
            words.append({"text": tok, "start": seg[0]["start"], "end": seg[-1]["end"]})
            i += c
    else:
        # Reparto proporcional por longitud fonética (robusto ante desajustes)
        sounding = [t for t in timings if t.phoneme != " " and t.phoneme not in PUNCT]
        lens = []
        for tok in toks:
            ph = k.tokenizer.phonemize(tok, lang) if clean(tok) else ""
            lens.append(len([c for c in ph if c != " " and c not in PUNCT]))
        total = max(1, sum(lens))
        acc = 0
        for tok, ln in zip(toks, lens):
            a = int(round(acc / total * (len(sounding) - 1)))
            acc += ln
            b = int(round(acc / total * (len(sounding) - 1)))
            words.append({"text": tok, "start": sounding[a].start,
                          "end": sounding[max(a, b)].end})
    for w in words:
        w["clean"] = clean(w["text"])
    return words


def synth_scene(k, cache: Path, voice, speed, lang, say):
    key = hashlib.sha1(json.dumps([voice, speed, lang, say, SENTENCE_PAUSE, CLAUSE_PAUSE]).encode()).hexdigest()[:16]
    wav, meta = cache / f"{key}.wav", cache / f"{key}.json"
    if wav.exists() and meta.exists():
        audio, _ = sf.read(wav, dtype="float32")
        return audio, json.loads(meta.read_text())
    audio, sr, timings = k.create_timed(say, voice_style(k, voice), speed, lang,
                                        sentence_pause=SENTENCE_PAUSE, clause_pause=CLAUSE_PAUSE)
    assert sr == SR
    words = align(k, lang, say, timings)
    sf.write(wav, audio, SR)
    meta.write_text(json.dumps(words))
    return audio, words


def main(reel_dir: str):
    reel_dir = Path(reel_dir)
    spec = json.loads((reel_dir / "reel.json").read_text())
    v = spec.get("voice", {})
    voice, speed, lang = v.get("name", "am_michael"), v.get("speed", 1.0), v.get("lang", "en-us")
    build = reel_dir / "build"
    cache = build / "voice-cache"
    cache.mkdir(parents=True, exist_ok=True)

    k = load_kokoro()
    parts = [np.zeros(int(LEAD_IN * SR), dtype=np.float32)]
    t = LEAD_IN
    scenes = []
    for i, sc in enumerate(spec["scenes"]):
        say = sc.get("say", "").strip()
        gap = sc.get("pause", DEFAULT_GAP)
        if not say:  # escena muda (solo visual)
            dur = sc.get("duration", 1.0)
            parts.append(np.zeros(int(dur * SR), dtype=np.float32))
            scenes.append({"index": i, "start": t, "end": t + dur, "words": []})
            t += dur
            continue
        audio, words = synth_scene(k, cache, voice, speed, lang, say)
        dur = len(audio) / SR
        scenes.append({
            "index": i, "start": round(t, 4), "end": round(t + dur, 4),
            "words": [{**w, "start": round(t + w["start"], 4), "end": round(t + w["end"], 4)}
                      for w in words],
        })
        parts.append(audio.astype(np.float32))
        parts.append(np.zeros(int(gap * SR), dtype=np.float32))
        t += dur + int(gap * SR) / SR
        print(f"  [{i:02d}] {dur:5.2f}s  {say[:70]}")
    parts.append(np.zeros(int(TAIL * SR), dtype=np.float32))
    full = np.concatenate(parts)
    sf.write(build / "voice.wav", full, SR)
    total = len(full) / SR
    (build / "timing.json").write_text(json.dumps(
        {"sampleRate": SR, "duration": round(total, 4), "scenes": scenes}, indent=1))
    print(f"Voz: {total:.2f}s → {build / 'voice.wav'}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
