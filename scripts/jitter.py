# Mide el temblor: desplazamiento subpíxel de una zona respecto al primer fotograma
# y su desviación frente a un movimiento suave (ajuste cuadrático).
import sys, glob, numpy as np
from PIL import Image
def shift(a, b):
    A = np.fft.fft2(a); B = np.fft.fft2(b); R = A * np.conj(B); R /= np.abs(R) + 1e-9
    r = np.fft.ifft2(R).real; y, x = np.unravel_index(np.argmax(r), r.shape)
    def par(l, c, rr): return (l - rr) / (2 * (l - 2 * c + rr) + 1e-9)
    sx = x + par(r[y, (x - 1) % r.shape[1]], r[y, x], r[y, (x + 1) % r.shape[1]])
    sy = y + par(r[(y - 1) % r.shape[0], x], r[y, x], r[(y + 1) % r.shape[0], x])
    if sx > r.shape[1] / 2: sx -= r.shape[1]
    if sy > r.shape[0] / 2: sy -= r.shape[0]
    return sx, sy
def measure(files, box):
    ims = [np.asarray(Image.open(f).convert("L").crop(box), dtype=float) for f in files]
    s = np.array([shift(im, ims[0]) for im in ims])
    t = np.arange(len(s))
    res = []
    for k in (0, 1):
        fit = np.polyval(np.polyfit(t, s[:, k], 2), t)
        res.append(np.abs(s[:, k] - fit).max())
    return max(res), s
if __name__ == "__main__":
    pattern = sys.argv[1]; boxes = [tuple(map(int, b.split(","))) for b in sys.argv[2:]]
    files = sorted(glob.glob(pattern))
    for b in boxes:
        dev, s = measure(files, b)
        print(f"zona {b}: desviación máx. frente a movimiento suave = {dev:.2f} px")
