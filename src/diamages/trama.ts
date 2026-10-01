// Trama de Diamages, medida sobre la imagen oficial (scripts: ver notas).
// Retícula cuadrada con UNA diagonal por casilla, alternando «\» y «/» como un
// tablero de ajedrez. Cada casilla queda partida en dos mitades (triángulos
// rectángulos) oscuras (#4fd3c3) o claras (#7bdbd0). El motivo se repite cada
// 4 × 8 casillas. Las líneas blancas se dibujan en todas las aristas salvo entre
// dos mitades oscuras (así nacen los rombos macizos de la guía).

export const S = 120; // lado de casilla en unidades de mundo
export const TILE_C = 4;
export const TILE_R = 8;
export const LINE_W = 3;

// [mitad superior, mitad inferior]; 1 = oscura. Filas r = 0..7, columnas c = 0..3.
const FILL: [number, number][][] = [
  [[0, 1], [0, 1], [0, 0], [0, 1]],
  [[1, 0], [1, 0], [0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 1], [0, 0]],
  [[1, 0], [0, 0], [0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 1], [0, 1]],
  [[0, 0], [1, 0], [1, 0], [1, 0]],
  [[0, 1], [0, 0], [0, 0], [0, 1]],
  [[0, 0], [1, 0], [1, 0], [0, 0]],
];

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** «/» (de abajo-izquierda a arriba-derecha) si c + r es impar; «\» si es par. */
export const isSlash = (c: number, r: number) => mod(c + r, 2) === 1;

export const fillOf = (c: number, r: number, half: 0 | 1) =>
  FILL[mod(r, TILE_R)][mod(c, TILE_C)][half] === 1;

export type P2 = { x: number; y: number };

/** Triángulo de una mitad: [vértice del ángulo recto, extremo A y B de la hipotenusa]. */
export const halfTri = (c: number, r: number, half: 0 | 1): [P2, P2, P2] => {
  const x0 = c * S;
  const y0 = r * S;
  const TL = { x: x0, y: y0 };
  const TR = { x: x0 + S, y: y0 };
  const BL = { x: x0, y: y0 + S };
  const BR = { x: x0 + S, y: y0 + S };
  if (isSlash(c, r)) return half === 0 ? [TL, BL, TR] : [BR, BL, TR];
  return half === 0 ? [TR, TL, BR] : [BL, TL, BR];
};

/** Mitad que toca un lado de la casilla. */
const sideHalf = (c: number, r: number, side: "N" | "E" | "S" | "W"): 0 | 1 =>
  isSlash(c, r)
    ? side === "N" || side === "W"
      ? 0
      : 1
    : side === "N" || side === "E"
      ? 0
      : 1;

const edgeDrawn = (darkA: boolean, darkB: boolean) => !(darkA && darkB);

const f = (n: number) => +n.toFixed(2);

/** Contenido de la tesela del patrón (unidades de mundo). */
export const TILE = (() => {
  let dark = "";
  let lines = "";
  for (let r = -1; r <= TILE_R; r++) {
    for (let c = -1; c <= TILE_C; c++) {
      const inside = r >= 0 && r < TILE_R && c >= 0 && c < TILE_C;
      if (inside) {
        for (const h of [0, 1] as const) {
          if (!fillOf(c, r, h)) continue;
          const [a, b, d] = halfTri(c, r, h);
          dark += `M${a.x} ${a.y}L${b.x} ${b.y}L${d.x} ${d.y}Z`;
        }
      }
      // diagonal (siempre) y aristas superior e izquierda (una fila/columna extra
      // para que las líneas de los bordes de la tesela no queden a medio grosor)
      const x0 = c * S;
      const y0 = r * S;
      if (isSlash(c, r)) lines += `M${x0} ${y0 + S}L${x0 + S} ${y0}`;
      else lines += `M${x0} ${y0}L${x0 + S} ${y0 + S}`;
      if (edgeDrawn(fillOf(c, r, sideHalf(c, r, "N")), fillOf(c, r - 1, sideHalf(c, r - 1, "S"))))
        lines += `M${x0} ${y0}L${x0 + S} ${y0}`;
      if (edgeDrawn(fillOf(c, r, sideHalf(c, r, "W")), fillOf(c - 1, r, sideHalf(c - 1, r, "E"))))
        lines += `M${x0} ${y0}L${x0} ${y0 + S}`;
    }
  }
  return { w: TILE_C * S, h: TILE_R * S, dark, lines };
})();

/**
 * Vértice centro de un rombo oscuro (4 mitades oscuras alrededor de un vértice
 * sin diagonales) más cercano a un punto de mundo. El rombo mide 2S de diagonal.
 */
export const darkDiamondNear = (x: number, y: number): P2 => {
  let best: P2 = { x: 0, y: 0 };
  let bestD = Infinity;
  const c0 = Math.round(x / S);
  const r0 = Math.round(y / S);
  for (let r = r0 - 12; r <= r0 + 12; r++) {
    for (let c = c0 - 12; c <= c0 + 12; c++) {
      if (mod(c + r, 2) !== 1) continue; // las casillas vecinas no pasan por el vértice
      const ok =
        fillOf(c - 1, r - 1, 1) &&
        fillOf(c, r - 1, 1) &&
        fillOf(c - 1, r, 0) &&
        fillOf(c, r, 0);
      if (!ok) continue;
      const d = Math.hypot(c * S - x, r * S - y);
      if (d < bestD) {
        bestD = d;
        best = { x: c * S, y: r * S };
      }
    }
  }
  return best;
};

/** Mitades de las casillas que cubren un rectángulo alineado a la retícula. */
export const halvesInRect = (x0: number, y0: number, x1: number, y1: number) => {
  const out: { c: number; r: number; h: 0 | 1 }[] = [];
  for (let r = Math.floor(y0 / S); r < Math.ceil(y1 / S); r++) {
    for (let c = Math.floor(x0 / S); c < Math.ceil(x1 / S); c++) {
      out.push({ c, r, h: 0 }, { c, r, h: 1 });
    }
  }
  return out;
};

/** Transformación SVG de una mitad que se voltea sobre su hipotenusa (k = cos del giro). */
export const flipMatrix = (tri: [P2, P2, P2], k: number) => {
  const [, a, b] = tri;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // M = I + (k − 1)·n·nᵀ, aplicada alrededor del punto medio de la hipotenusa
  const m11 = 1 + (k - 1) * nx * nx;
  const m12 = (k - 1) * nx * ny;
  const m22 = 1 + (k - 1) * ny * ny;
  const e = mx - (m11 * mx + m12 * my);
  const g = my - (m12 * mx + m22 * my);
  return `matrix(${f(m11)} ${f(m12)} ${f(m12)} ${f(m22)} ${f(e)} ${f(g)})`;
};
