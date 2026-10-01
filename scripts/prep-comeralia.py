# Prepara los recursos del sistema solar de Comeralia a partir de las referencias
# (public/brand/comeralia/ref-*): recorte de cada disco y capa aparte con su
# monograma (mismos píxeles, solo se separan del fondo del disco).
# Uso: python scripts/prep-comeralia.py
import numpy as np
from PIL import Image

B = "public/brand/comeralia/"
PLANETS = {  # archivo: (nombre, color del disco, color de las letras)
    "ref-6.png": ("diamaweb", (234, 250, 190), (29, 31, 61)),
    "ref-7.png": ("diamalab", (130, 173, 167), (225, 253, 115)),
    "ref-8.png": ("diamages", (79, 211, 196), (29, 31, 61)),
    "ref-9.png": ("diamacon", (29, 31, 61), (79, 211, 196)),
}

def crop_alpha(im, pad=2):
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 8)
    return im.crop((xs.min() - pad, ys.min() - pad, xs.max() + 1 + pad, ys.max() + 1 + pad))

for f, (name, bg, fg) in PLANETS.items():
    im = crop_alpha(Image.open(B + f).convert("RGBA"))
    w, h = im.size
    side = max(w, h)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - w) // 2, (side - h) // 2))
    sq.save(B + f"planet-{name}.png")
    a = np.asarray(sq).astype(float)
    rgb, al = a[..., :3], a[..., 3]
    # medir los colores reales del disco y de las letras (muestras de la propia imagen)
    bgv, fgv = np.array(bg, float), np.array(fg, float)
    d = fgv - bgv
    tt = np.clip(((rgb - bgv) @ d) / (d @ d), 0, 1)
    # núcleo del disco (lejos del borde) para no confundir el antialias del contorno con letras
    yy, xx = np.mgrid[0:side, 0:side]
    r = np.hypot(xx - side / 2, yy - side / 2)
    inner = r < side / 2 - 4
    letters = np.zeros((side, side, 4), np.uint8)
    letters[..., :3] = fgv.astype(np.uint8)
    letters[..., 3] = np.where(inner, np.clip((tt - 0.08) / 0.84, 0, 1) * al, 0).astype(np.uint8)
    Image.fromarray(letters).save(B + f"letters-{name}.png")
    print(name, side, "px")

sym = crop_alpha(Image.open(B + "ref-10.png").convert("RGBA"))
sym.save(B + "symbol.png")
print("symbol", sym.size)
logo = crop_alpha(Image.open(B + "ref-11.webp").convert("RGBA"))
logo.save(B + "logo.png")
a = np.asarray(logo)[..., 3]
cols = np.nonzero(a.max(0) > 8)[0]
gaps = [(cols[i], cols[i + 1]) for i in range(len(cols) - 1) if cols[i + 1] - cols[i] > 20]
print("logo", logo.size, "huecos entre columnas", gaps[:3])
