// Geometría vectorial del símbolo Diamacon/Comeralia, reconstruida y ajustada
// al píxel sobre el logotipo original (IoU 0,85 con trazo de 11 u).
// Sistema de coordenadas centrado en (0,0); el símbolo ocupa ~444 × 444 u.

export type Pt = { x: number; y: number };
const p = (x: number, y: number): Pt => ({ x, y });

const ax = 97;
const ay = 212;
const ix = 213.75;
const iy = 94.75;
const tm = 215.5; // flecha de los bordes superior/inferior
const lm = 215; // flecha del borde izquierdo
const ty = 146.25; // vértice superior/inferior del diamante central
const lx = 145.75; // vértice izquierdo del diamante central
const rx = 145.75; // vértice de la muesca (derecho)
const cxr = 213.75;

export const GEM_VIEW = 444;
export const GEM_STROKE = 11;

export const V = {
  A: p(-ax, -ay),
  B: p(ax, -ay),
  C: p(cxr, -iy),
  R: p(rx, 0),
  E: p(cxr, iy),
  F: p(ax, ay),
  G: p(-ax, ay),
  H: p(-ix, iy),
  I: p(-ix, -iy),
  L: p(-lx, 0),
  T: p(0, -ty),
  Bm: p(0, ty),
  TopM: p(0, -tm),
  BotM: p(0, tm),
  LeftM: p(-lm, 0),
};

type Circle = { cx: number; cy: number; r: number };

const circleFrom3 = (a: Pt, b: Pt, c: Pt): Circle => {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const cx = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
  const cy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
  return { cx, cy, r: Math.hypot(a.x - cx, a.y - cy) };
};

const norm = (x: number) => {
  const t = x % (Math.PI * 2);
  return t < 0 ? t + Math.PI * 2 : t;
};

export type Seg =
  | { kind: "line"; a: Pt; b: Pt }
  | { kind: "arc"; circle: Circle; a0: number; sweep: number };

const line = (a: Pt, b: Pt): Seg => ({ kind: "line", a, b });

/** Arco de circunferencia que pasa por a → m → b. */
const arc = (a: Pt, m: Pt, b: Pt): Seg => {
  const circle = circleFrom3(a, m, b);
  const a1 = Math.atan2(a.y - circle.cy, a.x - circle.cx);
  const a2 = Math.atan2(m.y - circle.cy, m.x - circle.cx);
  const a3 = Math.atan2(b.y - circle.cy, b.x - circle.cx);
  const d13 = norm(a3 - a1);
  const d12 = norm(a2 - a1);
  const sweep = d12 <= d13 ? d13 : d13 - Math.PI * 2;
  return { kind: "arc", circle, a0: a1, sweep };
};

export const segPoint = (s: Seg, t: number): Pt => {
  if (s.kind === "line") {
    return p(s.a.x + (s.b.x - s.a.x) * t, s.a.y + (s.b.y - s.a.y) * t);
  }
  const ang = s.a0 + s.sweep * t;
  return p(
    s.circle.cx + s.circle.r * Math.cos(ang),
    s.circle.cy + s.circle.r * Math.sin(ang),
  );
};

export const segLength = (s: Seg) =>
  s.kind === "line"
    ? Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y)
    : Math.abs(s.sweep) * s.circle.r;

export const reverse = (s: Seg): Seg =>
  s.kind === "line"
    ? { kind: "line", a: s.b, b: s.a }
    : { ...s, a0: s.a0 + s.sweep, sweep: -s.sweep };

/** Sub-tramo t0..t1 de un segmento (para medios bordes y la ventana central). */
export const subSeg = (s: Seg, t0: number, t1: number): Seg =>
  s.kind === "line"
    ? { kind: "line", a: segPoint(s, t0), b: segPoint(s, t1) }
    : { ...s, a0: s.a0 + s.sweep * t0, sweep: s.sweep * (t1 - t0) };

const f = (n: number) => n.toFixed(2);

/** Path SVG de un segmento, con transformación opcional (escala + traslación). */
export const segPath = (
  s: Seg,
  k = 1,
  tx = 0,
  ty2 = 0,
  moveTo = true,
): string => {
  const a = segPoint(s, 0);
  const b = segPoint(s, 1);
  const start = moveTo ? `M ${f(a.x * k + tx)} ${f(a.y * k + ty2)} ` : "";
  if (s.kind === "line")
    return `${start}L ${f(b.x * k + tx)} ${f(b.y * k + ty2)}`;
  const large = Math.abs(s.sweep) > Math.PI ? 1 : 0;
  const sweepFlag = s.sweep > 0 ? 1 : 0;
  const r = s.circle.r * k;
  return `${start}A ${f(r)} ${f(r)} 0 ${large} ${sweepFlag} ${f(b.x * k + tx)} ${f(b.y * k + ty2)}`;
};

const { A, B, C: Cc, R, E, F, G, H, I, L, T, Bm, TopM, BotM, LeftM } = V;

// Contorno --------------------------------------------------------------
export const TOP_EDGE = arc(A, TopM, B);
const bottomFull = arc(G, BotM, F);
const leftFull = arc(I, LeftM, H);

/** Rama izquierda del contorno: A → I → H → G → mitad inferior. */
export const BRANCH_LEFT: Seg[] = [
  line(A, I),
  leftFull,
  line(H, G),
  subSeg(bottomFull, 0, 0.5),
];

/** Rama derecha: B → C → muesca R → E → F → mitad inferior. */
export const BRANCH_RIGHT: Seg[] = [
  line(B, Cc),
  line(Cc, R),
  line(R, E),
  line(E, F),
  reverse(subSeg(bottomFull, 0.5, 1)),
];

// Facetas interiores (orden de dibujo) ----------------------------------------
const d1 = arc(A, T, R);
const d2 = arc(B, T, L);
const d3 = arc(G, Bm, R);
const d4 = arc(F, Bm, L);

export const INNER: Seg[] = [
  arc(I, T, Cc), // arco superior
  arc(H, Bm, E), // arco inferior
  arc(A, L, G), // arco izquierdo
  arc(B, R, F), // arco derecho
  d1,
  d2,
  d4,
  d3,
  line(I, L),
  line(L, H),
];

/** Todos los segmentos del contorno como lista plana. */
export const OUTLINE: Seg[] = [TOP_EDGE, ...BRANCH_LEFT, ...BRANCH_RIGHT];

// Ventana central (diamante T → R → Bm → L) -------------------------------
const tOn = (s: Seg, target: Pt) => {
  // parámetro t del punto más cercano (muestreo), suficiente para vértices exactos
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= 400; i++) {
    const q = segPoint(s, i / 400);
    const d = Math.hypot(q.x - target.x, q.y - target.y);
    if (d < bestD) {
      bestD = d;
      best = i / 400;
    }
  }
  return best;
};

export const WINDOW: Seg[] = [
  subSeg(d1, tOn(d1, T), 1), // T → R
  reverse(subSeg(d3, tOn(d3, Bm), 1)), // R → Bm
  subSeg(d4, tOn(d4, Bm), 1), // Bm → L
  reverse(subSeg(d2, tOn(d2, T), 1)), // L → T
];

/** Path cerrado de la ventana central, escalado y trasladado a coordenadas de pantalla. */
export const windowPath = (k: number, tx: number, ty2: number) =>
  WINDOW.map((s, i) => segPath(s, k, tx, ty2, i === 0)).join(" ") + " Z";
