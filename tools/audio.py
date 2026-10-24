#!/usr/bin/env python3
"""Diseño sonoro de un reel: efectos sincronizados, música generada y mezcla final.

Uso:  python tools/audio.py reels/<id>

Entradas (en build/):  voice.wav, timing.json, cues.json (los escribe el render)
Salida:                build/mix.wav  (48 kHz, estéreo)

Todo se sintetiza aquí (sin samples externos), así que no hay problemas de
licencias y el resultado es reproducible.
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
rng = np.random.default_rng(7)


# ── utilidades ───────────────────────────────────────────
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_exp(dur, decay):
    return np.exp(-t_axis(dur) / decay)


def sweep(f0, f1, dur, kind="exp"):
    """Seno con barrido de frecuencia (fase integrada)."""
    t = t_axis(dur)
    if kind == "exp":
        f = f0 * (f1 / f0) ** (t / dur)
    else:
        f = f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lowpass(x, fc, order=2):
    sos = signal.butter(order, fc, btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def highpass(x, fc, order=2):
    sos = signal.butter(order, fc, btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def moving_lowpass(x, f_start, f_end):
    """Filtro paso bajo de un polo con corte variable en el tiempo."""
    n = len(x)
    fc = f_start * (f_end / f_start) ** (np.arange(n) / max(1, n - 1))
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def fade(x, fin=0.003, fout=0.01):
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def stereo(x, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], axis=1)


def reverb_ir(dur=1.6, decay=0.45, seed=3):
    g = np.random.default_rng(seed)
    t = t_axis(dur)
    ir = np.stack([g.standard_normal(len(t)), g.standard_normal(len(t))], 1) * np.exp(-t / decay)[:, None]
    ir[:, 0] = lowpass(ir[:, 0], 6000)
    ir[:, 1] = lowpass(ir[:, 1], 6000)
    return ir / np.sqrt(np.sum(ir ** 2, axis=0))


def convolve_st(x, ir):
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)


# ── efectos ──────────────────────────────────────────────
def sfx_whoosh():
    d = 0.42
    n = noise(d)
    t = t_axis(d)
    env = np.where(t < d * 0.7, (t / (d * 0.7)) ** 2, np.exp(-(t - d * 0.7) / 0.04))
    x = moving_lowpass(n, 400, 5500) * env
    x = highpass(x, 180)
    s = stereo(norm(x), 0)
    pan = np.linspace(-0.7, 0.7, len(x))
    s[:, 0] *= np.cos((pan + 1) * np.pi / 4) * 1.414
    s[:, 1] *= np.sin((pan + 1) * np.pi / 4) * 1.414
    return s * 0.55


def sfx_pop():
    d = 0.11
    x = sweep(950, 260, d) * env_exp(d, 0.03)
    x[:60] += np.linspace(0.6, 0, 60)
    return stereo(fade(norm(x)) * 0.5)


def sfx_tick():
    d = 0.03
    x = bandpass(noise(d), 2500, 6000) * env_exp(d, 0.005)
    return stereo(fade(norm(x)) * 0.3)


def sfx_hit():
    d = 0.9
    body = sweep(85, 36, d) * env_exp(d, 0.28)
    click = lowpass(noise(0.05), 3000) * env_exp(0.05, 0.012)
    x = body
    x[: len(click)] += click * 0.7
    x = np.tanh(x * 1.6)
    return stereo(fade(norm(x)) * 0.75)


def sfx_thud():
    d = 0.35
    x = sweep(110, 50, d) * env_exp(d, 0.08)
    x[:2400] += lowpass(noise(0.05), 900) * env_exp(0.05, 0.015) * 0.8
    return stereo(fade(norm(np.tanh(x * 1.4))) * 0.6)


def sfx_riser():
    d = 1.4
    t = t_axis(d)
    env = (t / d) ** 2.2
    x = moving_lowpass(noise(d), 300, 9000) * 0.6 + sweep(220, 1400, d) * 0.25
    x = x * env
    x[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return stereo(norm(x) * 0.42)


def sfx_alarm():
    seg = 0.11
    parts = []
    for k in range(4):
        f = 880 if k % 2 == 0 else 660
        tt = t_axis(seg)
        sq = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * tt) * 0.5
        parts.append(fade(lowpass(sq, 3500), 0.004, 0.02))
    x = np.concatenate(parts)
    return stereo(norm(x) * 0.28)


def sfx_ding():
    d = 0.9
    t = t_axis(d)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / dec)
            for f, a, dec in [(1568, 1, 0.35), (2352, 0.45, 0.22), (3136, 0.25, 0.12), (784, 0.2, 0.4)])
    return stereo(fade(norm(x), 0.002, 0.05) * 0.4)


def sfx_check():
    a = sweep(1400, 1500, 0.05) * env_exp(0.05, 0.015)
    b = sweep(2100, 2200, 0.08) * env_exp(0.08, 0.02)
    x = np.concatenate([a, np.zeros(int(0.03 * SR)), b])
    return stereo(fade(norm(x)) * 0.32)


def sfx_swipe():
    d = 0.2
    x = moving_lowpass(noise(d), 1500, 12000)
    x = highpass(x, 900) * np.sin(np.pi * t_axis(d) / d) ** 2
    return stereo(norm(x) * 0.35, 0.2)


def sfx_glitch():
    d = 0.26
    x = noise(d)
    chop = (np.floor(t_axis(d) * 38) % 2 == 0).astype(float)
    crushed = np.round(sweep(300, 120, d, "lin") * 4) / 4
    x = (x * 0.4 + crushed) * chop * env_exp(d, 0.12)
    return stereo(fade(norm(bandpass(x, 200, 7000))) * 0.32)


def sfx_bubble():
    d = 0.16
    t = t_axis(d)
    x = sweep(280, 900, d) * np.sin(np.pi * t / d) * (1 + 0.3 * np.sin(2 * np.pi * 40 * t))
    return stereo(fade(norm(x)) * 0.4)


def sfx_shrink():
    d = 0.5
    t = t_axis(d)
    x = sweep(900, 160, d) * (1 + 0.4 * np.sin(2 * np.pi * 18 * t)) * env_exp(d, 0.25)
    return stereo(fade(norm(x)) * 0.35)


def sfx_shimmer():
    d = 1.2
    t = t_axis(d)
    x = np.zeros(len(t))
    for k, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
        o = int(k * 0.06 * SR)
        tt = t[: len(t) - o]
        x[o:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.35) * 0.5
    return stereo(fade(norm(x), 0.002, 0.1) * 0.3)


def sfx_type():
    out = np.zeros(int(1.3 * SR))
    t = 0.0
    g = np.random.default_rng(11)
    while t < 1.2:
        c = bandpass(g.standard_normal(int(0.02 * SR)), 1800, 6000) * env_exp(0.02, 0.004)
        i = int(t * SR)
        out[i:i + len(c)] += c * g.uniform(0.6, 1.0)
        t += g.uniform(0.055, 0.12)
    return stereo(norm(out) * 0.22)


SFX = {k[4:]: v for k, v in globals().items() if k.startswith("sfx_")}


# ── música generada ──────────────────────────────────────
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def chord_notes(name):
    """'Am' → [57, 60, 64] (A3 C4 E4)."""
    minor = name.endswith("m")
    root = NOTE[name[:-1] if minor else name]
    base = 45 + ((root - 9) % 12)  # raíz entre A2 y G#3
    third = 3 if minor else 4
    return [base + 12, base + 12 + third, base + 12 + 7, base + 24]


def saw_additive(f, dur, harmonics):
    t = t_axis(dur)
    x = np.zeros(len(t))
    for n in range(1, harmonics + 1):
        if f * n > 16000:
            break
        x += np.sin(2 * np.pi * f * n * t) / n
    return x


def adsr(n, a=0.3, r=0.5):
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def music(duration, bpm=92, sections=(0.0, 4.0, 1e9), progression=("Am", "F", "C", "G"), preset="tension"):
    """sections = (inicio_main, inicio_lift, ...) en segundos."""
    beat = 60.0 / bpm
    bar = beat * 4
    n = int((duration + 2) * SR)
    pad = np.zeros((n, 2))
    drums = np.zeros((n, 2))
    arp = np.zeros((n, 2))
    bass = np.zeros((n, 2))
    main_t, lift_t = sections[1], sections[2]

    def add(buf, x, t, pan=0.0, g=1.0):
        i = int(t * SR)
        if i >= n:
            return
        x = x[: n - i]
        buf[i:i + len(x)] += stereo(x, pan) * g

    kick = np.tanh(sweep(120, 42, 0.32) * env_exp(0.32, 0.09) * 1.8)
    hat = highpass(noise(0.05), 7000) * env_exp(0.05, 0.012)
    clap = bandpass(noise(0.16), 900, 3500) * env_exp(0.16, 0.045)

    t = 0.0
    bar_i = 0
    while t < duration + bar:
        ch = progression[bar_i % len(progression)]
        notes = chord_notes(ch)
        section = "intro" if t < main_t else ("lift" if t >= lift_t else "main")
        harm = {"intro": 5, "main": 8, "lift": 14}[section]
        # Pad: sierra aditiva desafinada
        for k, m in enumerate(notes):
            for det, pan in ((-0.07, -0.6), (0.07, 0.6)):
                f = hz(m) * 2 ** (det / 12)
                x = saw_additive(f, bar + 0.6, harm) * adsr(int((bar + 0.6) * SR), 0.35, 0.6)
                add(pad, x, t, pan, 0.05)
        # Bajo
        if section != "intro":
            for b in range(4):
                if section == "main" and b % 2:
                    continue
                d = beat * (1 if section == "lift" else 2) * 0.9
                x = np.sin(2 * np.pi * hz(notes[0] - 24) * t_axis(d)) * adsr(int(d * SR), 0.01, 0.15)
                add(bass, np.tanh(x * 1.5), t + b * beat, 0, 0.22)
        # Batería
        if section != "intro":
            for b in range(4):
                tb = t + b * beat
                if section == "lift" or b in (0, 2):
                    add(drums, kick, tb, 0, 0.55)
                if section == "lift" and b in (1, 3):
                    add(drums, clap, tb, 0.1, 0.25)
                for h in (0.5,) if section == "main" else (0.25, 0.5, 0.75):
                    add(drums, hat, tb + h * beat, 0.3, 0.12)
        # Arpegio
        if section != "intro":
            step = beat / (2 if section == "lift" else 1)
            seq = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12]
            k = 0
            tt = t
            while tt < t + bar - 1e-6:
                m = seq[k % len(seq)]
                d = 0.35
                x = (np.sin(2 * np.pi * hz(m) * t_axis(d)) + 0.3 * np.sin(4 * np.pi * hz(m) * t_axis(d))) * env_exp(d, 0.12)
                add(arp, fade(x), tt, 0.4 if k % 2 else -0.4, 0.07 if section == "lift" else 0.045)
                tt += step
                k += 1
        t += bar
        bar_i += 1

    ir = reverb_ir(2.2, 0.6)
    wet = convolve_st(pad + arp, ir) * 0.35
    mix = pad + arp + wet + drums + bass
    mix = lowpass(mix.T, 9000).T
    mix = mix[: int(duration * SR)]
    # Fade in/out
    fi, fo = int(0.8 * SR), int(1.6 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return norm(mix, 0.9)


# ── voz ──────────────────────────────────────────────────
def process_voice(v):
    v = highpass(v, 75)
    # Compresión suave por envolvente
    e = np.abs(v)
    e = signal.lfilter([1 - np.exp(-1 / (0.01 * SR))], [1, -np.exp(-1 / (0.01 * SR))], e)
    thr = np.percentile(e[e > 1e-4], 85) if np.any(e > 1e-4) else 0.1
    gain = np.where(e > thr, (thr / np.maximum(e, 1e-9)) ** 0.5, 1.0)
    v = v * gain
    # Un toque de presencia (2.5–5 kHz)
    v = v + bandpass(v, 2500, 5000) * 0.25
    return norm(v, 0.9)


def duck_curve(voice_mono, depth=0.55):
    e = np.abs(voice_mono)
    a_att, a_rel = np.exp(-1 / (0.01 * SR)), np.exp(-1 / (0.25 * SR))
    out = np.empty_like(e)
    acc = 0.0
    # Envolvente con ataque/relajación distintos (decimado para ir rápido)
    step = 48
    small = e[::step]
    res = np.empty_like(small)
    att, rel = a_att ** step, a_rel ** step
    for i, x in enumerate(small):
        acc = (1 - att) * x + att * acc if x > acc else (1 - rel) * x + rel * acc
        res[i] = acc
    out = np.repeat(res, step)[: len(e)]
    ref = np.percentile(res[res > 1e-4], 70) if np.any(res > 1e-4) else 1
    return 1 - depth * np.clip(out / ref, 0, 1)


def main(reel_dir):
    reel_dir = Path(reel_dir)
    spec = json.loads((reel_dir / "reel.json").read_text())
    build = reel_dir / "build"
    timing = json.loads((build / "timing.json").read_text())
    cues = json.loads((build / "cues.json").read_text()) if (build / "cues.json").exists() else []
    duration = timing["duration"]
    n = int(duration * SR)

    v, vsr = sf.read(build / "voice.wav", dtype="float64")
    if v.ndim > 1:
        v = v.mean(1)
    v = signal.resample_poly(v, SR, vsr)[:n]
    v = np.pad(v, (0, n - len(v)))
    v = process_voice(v)

    # Efectos
    fx = np.zeros((n, 2))
    cache = {}
    last = {}
    for c in cues:
        name = c["name"]
        if name not in SFX:
            print(f"  (efecto desconocido: {name})")
            continue
        # Evita amontonar el mismo efecto
        if c["t"] - last.get(name, -9) < 0.12:
            continue
        last[name] = c["t"]
        x = cache.setdefault(name, SFX[name]())
        i = int(c["t"] * SR)
        if i >= n:
            continue
        x = x[: n - i]
        fx[i:i + len(x)] += x * c.get("gain", 1)
    fx = fx + convolve_st(fx, reverb_ir(0.9, 0.25)) * 0.12
    mspec = spec.get("music", {})
    fx_gain = mspec.get("sfx", 0.55)

    # Música
    mus = np.zeros((n, 2))
    if mspec.get("preset", "tension") != "none":
        starts = [s["start"] for s in timing["scenes"]]
        main_t = starts[1] - 0.1 if len(starts) > 1 else 0
        lift_i = mspec.get("lift")
        lift_t = starts[lift_i] - 0.1 if lift_i is not None and lift_i < len(starts) else 1e9
        prog = tuple(mspec.get("progression", ["Am", "F", "C", "G"]))
        mus = music(duration, mspec.get("bpm", 92), (0.0, main_t, lift_t), prog)
        mus = mus * duck_curve(v)[:, None] * mspec.get("volume", 0.16)

    mix = stereo(v * 0.82) + fx * fx_gain + mus
    peak = np.max(np.abs(mix))
    if peak > 0.98:
        mix *= 0.98 / peak
    sf.write(build / "mix.wav", mix.astype(np.float32), SR, subtype="FLOAT")
    print(f"Mezcla → {build / 'mix.wav'}  ({len(cues)} efectos, {duration:.1f}s)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
