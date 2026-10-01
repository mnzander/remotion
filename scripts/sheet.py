# Hoja de contactos: python scripts/sheet.py salida.png t1_2 t3_8 ...
import sys
from PIL import Image, ImageDraw
out, names = sys.argv[1], sys.argv[2:]
ims = [Image.open(f"out/check/{n}.png").convert("RGB") for n in names]
w, h = ims[0].size
cols = 2
rows = (len(ims) + 1) // 2
sheet = Image.new("RGB", (w * cols + 10, h * rows + 10 * (rows - 1)), (255, 255, 255))
for i, im in enumerate(ims):
    x = (i % cols) * (w + 10); y = (i // cols) * (h + 10)
    sheet.paste(im, (x, y))
    d = ImageDraw.Draw(sheet); d.rectangle([x, y, x + 120, y + 30], fill=(255, 0, 0)); d.text((x + 6, y + 8), names[i], fill=(255, 255, 255))
sheet.save(f"out/check/{out}")
