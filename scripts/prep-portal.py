# Recursos de la transición «nóminas → portal → cielo» (public/comeralia-portal).
# - nomina.png: la nómina de la referencia, recortada.
# - fondo-inicio.png: el fondo del primer fotograma (ref-inicio) sin las nóminas,
#   reconstruido por interpolación suave (es un degradado), para empalmar exacto.
# - cielo.png: el fotograma final del cielo, tal cual (sin recomprimir).
# Uso: python scripts/prep-portal.py
import numpy as np
from PIL import Image, ImageFilter

B = "public/comeralia-portal/"


def box(x, r):
    """Desenfoque de caja separable (3 pasadas ≈ gaussiano), con bordes replicados."""
    for _ in range(3):
        for ax in (0, 1):
            pad = [(0, 0)] * x.ndim
            pad[ax] = (r + 1, r)
            xp = np.pad(x, pad, mode="edge")
            c = np.cumsum(xp, axis=ax)
            n = x.shape[ax]
            hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=ax)
            lo = np.take(c, np.arange(0, n), axis=ax)
            x = (hi - lo) / (2 * r + 1)
    return x

doc = Image.open(B + "ref-nomina.png").convert("RGBA")
a = np.asarray(doc)[..., 3]
ys, xs = np.nonzero(a > 8)
doc.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)).save(B + "nomina.png")
print("nomina", xs.max() + 1 - xs.min(), ys.max() + 1 - ys.min())

Image.open(B + "ref-cielo.webp").convert("RGB").save(B + "cielo.png")

ref = Image.open(B + "ref-inicio.webp").convert("RGBA")
r = np.asarray(ref).astype(float)
rgb, al = r[..., :3], r[..., 3]
known = (al > 250) & (rgb.min(2) < 185) & (rgb.max(2) > 70)  # fondo: ni papel claro ni texto oscuro
known_img = Image.fromarray((known * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9))
known = np.asarray(known_img) > 128
w = known.astype(float)
out = rgb.copy()
# relleno por convolución normalizada a varias escalas (de fina a gruesa)
filled = np.zeros_like(rgb)
have = np.zeros(known.shape, bool)
for rad in (12, 24, 48, 96):
    num = np.stack([box(rgb[..., c] * w, rad) for c in range(3)], 2)
    den = box(w, rad)
    ok = (den > 0.15) & ~have & ~known
    filled[ok] = (num[ok] / den[ok, None])
    have |= ok
out[~known] = filled[~known]
res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
# suavizado final solo de lo reconstruido, para que no quede ninguna huella
soft = np.stack([box(np.asarray(res).astype(float)[..., c], 6) for c in range(3)], 2)
m = box((~known).astype(float), 4)[..., None]
final = out * (1 - m) + soft * m
Image.fromarray(np.clip(final, 0, 255).astype(np.uint8)).save(B + "fondo-inicio.png")
print("fondo reconstruido: píxeles rellenados", int((~known).sum()))
