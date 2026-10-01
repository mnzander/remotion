# Busca ángulos/radios de trayectoria para el túnel que minimicen solapes entre
# palabras legibles a lo largo de todo el bucle (misma proyección que TunelPalabras.tsx).
import math, random, json, re
src = open("src/tunel/wordPaths.ts", encoding="utf-8").read()
widths = [float(x) for x in re.findall(r'"width": ([\d.]+)', src)]
N = len(widths); F = 1000; ZF = 5200; ZN = 170; EM = 1.32; CAP = 70; LOOP = 12
W, H = 1920, 1080
def boxes(t, ang, rad, RX, RY):
    out = []
    for i in range(N):
        u = (t / LOOP + (N - 1 - i) / N + 0.06) % 1
        z = ZF - u * (ZF - ZN)
        s = F / z
        a = math.radians(ang[i])
        sx = W/2 + math.cos(a) * RX * rad[i] * s
        sy = H/2 + math.sin(a) * RY * rad[i] * s
        k = EM * s
        w = widths[i] * k; h = CAP * 1.35 * k
        vis = min(1, (ZF - z) / 900) * min(1, (z - ZN) / 190)
        out.append((sx - w/2, sy - h/2, sx + w/2, sy + h/2, vis, z))
    return out
def cost(ang, rad, RX, RY):
    c = 0
    for step in range(96):
        b = boxes(step * LOOP / 96, ang, rad, RX, RY)
        for i in range(N):
            for j in range(i + 1, N):
                A, B = b[i], b[j]
                if A[4] < 0.12 or B[4] < 0.12: continue
                pad = 45
                ox = min(A[2], B[2]) - max(A[0], B[0]) + pad
                oy = min(A[3], B[3]) - max(A[1], B[1]) + pad
                if ox > 0 and oy > 0: c += ox * oy / 1000
        # penaliza el centro vacío: al menos 4 palabras legibles dentro del encuadre
        inside = sum(1 for x in b if x[4] > 0.5 and x[2] > 0 and x[0] < W and x[3] > 0 and x[1] < H and (x[3]-x[1]) > 30)
        c += max(0, 4 - inside) * 40
        # equilibrio: el centro de masas de las palabras visibles cerca del centro del encuadre
        vis = [x for x in b if x[4] > 0.3]
        if vis:
            mx = sum((x[0] + x[2]) / 2 for x in vis) / len(vis)
            my = sum((x[1] + x[3]) / 2 for x in vis) / len(vis)
            c += (abs(mx - W / 2) / (W / 2) + abs(my - H / 2) / (H / 2)) * 25
    # palabras consecutivas por lados opuestos (alternancia de lectura)
    for i in range(N):
        d = math.cos(math.radians(ang[i] - ang[(i + 1) % N]))
        c += max(0, d + 0.3) * 30
    # reparto angular: ningún hueco de más de 80° sin palabra
    srt = sorted(a % 360 for a in ang)
    gaps = [(srt[(i + 1) % N] - srt[i]) % 360 for i in range(N)]
    c += max(0, max(gaps) - 80) * 2
    return c
random.seed(3)
best = None
for it in range(6000):
    if best is None or random.random() < 0.3:
        ang = [random.uniform(0, 360) for _ in range(N)]
        rad = [random.uniform(0.8, 1.1) for _ in range(N)]
        RX = random.uniform(700, 1050); RY = random.uniform(360, 560)
    else:
        ang = [a + random.gauss(0, 12) for a in best[1]]
        rad = [min(1.15, max(0.75, r + random.gauss(0, 0.05))) for r in best[2]]
        RX = best[3] + random.gauss(0, 30); RY = best[4] + random.gauss(0, 20)
    c = cost(ang, rad, RX, RY)
    if best is None or c < best[0]:
        best = (c, ang, rad, RX, RY)
print(json.dumps({"cost": round(best[0], 2), "angles": [round(a % 360, 1) for a in best[1]], "r": [round(r, 3) for r in best[2]], "RX": round(best[3]), "RY": round(best[4])}))
