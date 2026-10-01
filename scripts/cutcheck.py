# Busca cortes secos en un render: diferencia media entre fotogramas consecutivos
# (escala de grises 0–255, fotogramas reducidos) y picos aislados frente a sus vecinos.
# Uso: python scripts/cutcheck.py "out/check/frames/f*.png" 60
import glob
import sys

import numpy as np
from PIL import Image

files = sorted(glob.glob(sys.argv[1]))
fps = float(sys.argv[2]) if len(sys.argv) > 2 else 60
frames = [np.asarray(Image.open(f).convert("L"), dtype=float) for f in files]
d = np.array([np.abs(frames[i] - frames[i - 1]).mean() for i in range(1, len(frames))])
tc = lambda i: f"{int(i / fps // 60):02d}:{i / fps % 60:04.1f}"

# pico aislado: diferencia de un fotograma frente a la mediana de ±6 vecinos
iso = []
for i in range(len(d)):
    nb = np.concatenate([d[max(0, i - 6) : i], d[i + 1 : i + 7]])
    iso.append(d[i] / (np.median(nb) + 0.5))
iso = np.array(iso)
top = np.argsort(iso)[::-1][:8]
print(f"fotogramas: {len(frames)}  diferencia máx.: {d.max():.2f} en {tc(d.argmax() + 1)}  mediana: {np.median(d):.2f}")
print("picos aislados más altos (un corte seco daría >10×):")
for i in top:
    print(f"  {tc(i + 1)}  dif {d[i]:.2f}  ×{iso[i]:.1f}")
still = 0
best = 0
for v in d:
    still = still + 1 if v < 0.05 else 0
    best = max(best, still)
print(f"tramo más largo sin movimiento apreciable: {best} fotogramas ({best / fps:.2f} s)")
runs = []
run = 0
for i, v in enumerate(d):
    run = run + 1 if v < 0.05 else 0
    if run == 150:
        runs.append(i)
print("tramos quietos de 2,5 s o más que terminan tras:", [tc(i + 1) for i in runs])
print(f"loop: diferencia último -> primer fotograma = {np.abs(frames[-1] - frames[0]).mean():.3f}")
