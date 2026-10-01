# Vectoriza el logotipo «Diamages» y el icono DG a partir de los PNG oficiales
# (public/brand/diamages) con potrace. Genera src/diamages/brandPaths.ts.
# Uso: python scripts/vectorize-diamages.py
import json

import numpy as np
import potrace
from PIL import Image

UP = 4  # sobremuestreo antes de umbralizar: bordes más limpios
NAVY = np.array([27, 30, 59], float)


def ink_mask(path, bg):
    im = Image.open(path).convert("RGB")
    im = im.resize((im.width * UP, im.height * UP), Image.BICUBIC)
    a = np.asarray(im, float)
    d_navy = np.linalg.norm(a - NAVY, axis=2)
    d_bg = np.linalg.norm(a - np.array(bg, float), axis=2)
    return d_navy < d_bg


def f(v):
    return f"{v / UP:.2f}"


def trace(mask):
    # potracer rellena las zonas «False»: se invierte la máscara
    bm = potrace.Bitmap(~mask)
    plist = bm.trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.2)
    parts = []
    for curve in plist:
        s = curve.start_point
        d = [f"M{f(s.x)} {f(s.y)}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{f(seg.c.x)} {f(seg.c.y)}L{f(seg.end_point.x)} {f(seg.end_point.y)}")
            else:
                d.append(
                    f"C{f(seg.c1.x)} {f(seg.c1.y)} {f(seg.c2.x)} {f(seg.c2.y)} {f(seg.end_point.x)} {f(seg.end_point.y)}"
                )
        d.append("Z")
        parts.append("".join(d))
    return "".join(parts)


def column_runs(mask, x_from=0):
    cols = mask.any(axis=0)
    runs, start = [], None
    for x in range(x_from, len(cols)):
        if cols[x] and start is None:
            start = x
        if not cols[x] and start is not None:
            runs.append((start, x))
            start = None
    if start is not None:
        runs.append((start, len(cols)))
    return runs


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return xs.min() / UP, ys.min() / UP, (xs.max() + 1) / UP, (ys.max() + 1) / UP


# --- Logotipo horizontal -----------------------------------------------------
lock = ink_mask("public/brand/diamages/ref-lockup.png", (79, 211, 195))
runs = column_runs(lock)
# el primer tramo continuo es el símbolo; el resto, letras
sym = runs[0]
sym_mask = np.zeros_like(lock)
sym_mask[:, sym[0] : sym[1]] = lock[:, sym[0] : sym[1]]
sx0, sy0, sx1, sy1 = bbox(sym_mask)
letters = []
for x0, x1 in runs[1:]:
    m = np.zeros_like(lock)
    m[:, x0:x1] = lock[:, x0:x1]
    if m.sum() < 200:
        continue
    letters.append((x0, x1, m))
# «i»: el punto y el palo son tramos distintos solo si no se solapan; se fusionan tramos muy estrechos
wx0 = min(l[0] for l in letters) / UP
ys = np.nonzero(np.any([l[2] for l in letters], axis=0))[0]
wy0, wy1 = ys.min() / UP, (ys.max() + 1) / UP
out_letters = []
for x0, x1, m in letters:
    # trazar en coordenadas relativas al logotipo tipográfico
    sub = m[int(wy0 * UP) - 8 : int(wy1 * UP) + 8, x0 - 8 : x1 + 8]
    d = trace(sub)
    out_letters.append({"x0": round(x0 / UP - wx0, 2), "x1": round(x1 / UP - wx0, 2), "ox": round((x0 - 8) / UP - wx0, 2), "oy": round(-8 / UP, 2), "d": d})

symbol = sy1 - sy0
lockup = {
    "symbolPx": round(symbol, 2),
    "wordOffsetX": round((wx0 - sx0) / symbol, 4),
    "wordOffsetY": round((wy0 - sy0) / symbol, 4),
    "width": round((ys.size and (letters[-1][1] / UP - wx0)), 2),
    "height": round(wy1 - wy0, 2),
    "letters": out_letters,
}

# --- Icono DG ----------------------------------------------------------------
im = np.asarray(Image.open("public/brand/diamages/ref-icon.png").convert("RGB"), float)
teal = np.linalg.norm(im - np.array([79, 211, 195], float), axis=2) < 60
tx0, ty0, tx1, ty1 = teal.nonzero()[1].min(), teal.nonzero()[0].min(), teal.nonzero()[1].max() + 1, teal.nonzero()[0].max() + 1
side = tx1 - tx0
# radio de esquina: en la fila superior del cuadrado, dónde empieza el teal
row = teal[ty0 + 1]
radius = (np.nonzero(row)[0].min() - tx0)
# estimación robusta: primera columna teal a 1 px del borde → r ≈ distancia hasta tangencia
col_first = [np.nonzero(teal[y])[0].min() - tx0 for y in range(ty0, ty0 + side // 3)]
r_est = next((i for i, c in enumerate(col_first) if c <= 1), side // 5)
icon_ink = ink_mask("public/brand/diamages/ref-icon.png", (79, 211, 195))
# fuera del cuadrado teal el fondo es blanco: limpiar
inside = np.zeros_like(icon_ink)
inside[ty0 * UP : ty1 * UP, tx0 * UP : tx1 * UP] = True
icon_ink &= inside
icon_letters = []
for x0, x1 in column_runs(icon_ink):
    m = np.zeros_like(icon_ink)
    m[:, x0:x1] = icon_ink[:, x0:x1]
    if m.sum() < 400:
        continue
    bx0, by0, bx1, by1 = bbox(m)
    sub = m[int(by0 * UP) - 8 : int(by1 * UP) + 8, x0 - 8 : x1 + 8]
    icon_letters.append({
        "x0": round(bx0 - tx0, 2), "y0": round(by0 - ty0, 2), "x1": round(bx1 - tx0, 2), "y1": round(by1 - ty0, 2),
        "ox": round((x0 - 8) / UP - tx0, 2), "oy": round(by0 - ty0 - 8 / UP, 2), "d": trace(sub),
    })
icon = {"size": int(side), "radius": int(r_est), "letters": icon_letters}

ts = (
    "// Generado por scripts/vectorize-diamages.py (potrace sobre los PNG oficiales).\n"
    "// Logotipo: unidades = píxeles del PNG; cada letra se dibuja desplazada (ox, oy).\n"
    f"export const WORDMARK = {json.dumps(lockup, ensure_ascii=False)} as const;\n\n"
    "// Icono DG: unidades = píxeles del cuadrado teal (size × size).\n"
    f"export const DG_ICON = {json.dumps(icon, ensure_ascii=False)} as const;\n"
)
import os

os.makedirs("src/diamages", exist_ok=True)
open("src/diamages/brandPaths.ts", "w", encoding="utf-8").write(ts)
print("letras", len(out_letters), [(l["x0"], l["x1"]) for l in out_letters])
print("lockup", {k: v for k, v in lockup.items() if k != "letters"})
print("icono", icon["size"], icon["radius"], [(l["x0"], l["y0"], l["x1"], l["y1"]) for l in icon_letters])
