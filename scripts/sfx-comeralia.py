# Efectos de sonido sintetizados (sin música ni voz) para el sistema solar de
# Comeralia, sincronizados con src/comeralia/timeline.ts.
# Uso: python scripts/sfx-comeralia.py  →  public/sfx/comeralia-sistema.wav
import os
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def env(t0, a, d, shape=4.0):
    """Envolvente: ataque lineal `a` s y caída exponencial de ~`d` s."""
    x = t - t0
    e = np.where(x < 0, 0, np.where(x < a, x / max(a, 1e-4), np.exp(-(x - a) * shape / d)))
    return e


def lowpass(x, cutoff):
    # filtro de un polo, aplicado dos veces (12 dB/oct)
    k = np.exp(-2 * np.pi * cutoff / SR)
    for _ in range(2):
        y = np.empty_like(x)
        acc = 0.0
        for i in range(len(x)):
            acc = (1 - k) * x[i] + k * acc
            y[i] = acc
        x = y
    return x


def noise(seconds):
    return rng.standard_normal(int(SR * seconds))


def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    sig = sig[: max(0, N - i0)]
    L[i0 : i0 + len(sig)] += sig * gain * np.sqrt(0.5 * (1 - pan))
    R[i0 : i0 + len(sig)] += sig * gain * np.sqrt(0.5 * (1 + pan))


def tone(freq, t0, dur, gain, a=0.01, harm=0.25, pan=0.0):
    tt = np.arange(int(SR * dur)) / SR
    e = np.where(tt < a, tt / a, np.exp(-(tt - a) * 5.0 / dur))
    s = np.sin(2 * np.pi * freq * tt) + harm * np.sin(2 * np.pi * freq * 2 * tt) * np.exp(-tt * 6)
    add(s * e, t0, gain, pan)


def swell(t0, dur, cutoff, gain, rise=0.6):
    n = noise(dur)
    n = lowpass(n, cutoff)
    tt = np.arange(len(n)) / SR
    e = np.minimum(1, tt / (dur * rise)) * np.minimum(1, (dur - tt) / (dur * (1 - rise) + 1e-3))
    add(n * e / (np.abs(n).max() + 1e-9), t0, gain)


# Tono de sala muy bajo en todo el clip (evita el silencio digital)
room = lowpass(noise(DUR), 180)
room /= np.abs(room).max()
add(room, 0, 0.02)

# 0:00 · aparición: soplo de aire que se abre
swell(0.0, 1.8, 900, 0.22, rise=0.7)
# 0:00,7 · pulso del Sol: golpe grave + brillo
tt = np.arange(int(SR * 1.4)) / SR
add(np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 4.5), 0.7, 0.55)
sh = noise(1.6)
sh = sh - lowpass(sh, 5000)
tsh = np.arange(len(sh)) / SR
add(sh * np.exp(-tsh * 3.0) / np.abs(sh).max(), 0.72, 0.10)
# órbitas que se trazan: barrido suave
swell(1.2, 1.3, 2500, 0.07, rise=0.5)
# 0:01,6–0:02,5 · aparición de los cuatro planetas (notas de un acorde mayor)
for i, (f, tp) in enumerate(zip([523.25, 659.25, 783.99, 1046.5], [1.6, 1.9, 2.2, 2.5])):
    tone(f, tp, 0.9, 0.16, harm=0.3, pan=[-0.4, -0.15, 0.15, 0.4][i])
# 0:06 · inclinación de cámara: soplo lento
swell(6.0, 3.0, 1200, 0.16, rise=0.5)
# 0:10 · convergencia: subida (ruido que se abre + glissando)
dur = 2.55
tt = np.arange(int(SR * dur)) / SR
freq = 180 * (5.0 ** (tt / dur))
phase = 2 * np.pi * np.cumsum(freq) / SR
riser = np.sin(phase) * (tt / dur) ** 2
rn = noise(dur)
rn = rn - lowpass(rn, 800)
riser = riser * 0.6 + rn / np.abs(rn).max() * (tt / dur) ** 2.5 * 0.5
add(riser, 10.0, 0.22)
# absorciones: cuatro destellos ascendentes
for i, (f, tp) in enumerate(zip([783.99, 987.77, 1174.66, 1567.98], [11.2, 11.6, 12.0, 12.4])):
    tone(f, tp, 0.6, 0.15, harm=0.4, pan=[-0.3, 0.3, -0.15, 0.15][i])
# 0:12,5 · fundido a blanco: impacto grave + onda de aire
tt = np.arange(int(SR * 2.0)) / SR
add(np.sin(2 * np.pi * 42 * tt) * np.exp(-tt * 2.2), 12.5, 0.7)
bn = lowpass(noise(2.0), 1500)
add(bn / np.abs(bn).max() * np.exp(-tt * 2.5), 12.5, 0.30)
# 0:13,1 · el símbolo se coloca: soplo corto
swell(13.05, 0.7, 2000, 0.07, rise=0.4)
# 0:13,5 · logotipo: campana limpia
tone(1046.5, 13.5, 1.5, 0.12, a=0.004, harm=0.2)
tone(1567.98, 13.5, 1.4, 0.07, a=0.004, harm=0.1)

mix = np.stack([L, R], 1)
mix *= 10 ** (-3 / 20) / np.abs(mix).max()  # pico a −3 dBFS
fade = int(SR * 0.3)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
os.makedirs("public/sfx", exist_ok=True)
with wave.open("public/sfx/comeralia-sistema.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("ok", mix.shape)
