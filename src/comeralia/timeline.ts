import { Easing } from "remotion";

// Sistema solar de Comeralia · 15 s, 16:9, 30 fps (render 4K con --scale=2).
// Un único plano continuo: aparición → sistema 2D → cámara orbital 3D →
// convergencia en el Sol → cierre de marca sobre blanco.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 15;
export const FRAMES = DURATION * FPS;

export const T = {
  // 0:00–0:03 · aparición
  starsFar: [0.0, 0.9] as const,
  starsMid: [0.3, 1.2] as const,
  starsNear: [0.6, 1.5] as const,
  sunIn: [0.5, 1.3] as const,
  wave1: [0.7, 1.9] as const,
  orbitsDraw: [1.1, 2.3] as const,
  planetsIn: [1.6, 1.9, 2.2, 2.5] as const, // de dentro a fuera
  // 0:06–0:10 · transición a 3D orbital
  tilt: [6.0, 8.6] as const,
  sphere: [6.2, 8.4] as const,
  arc: [6.4, 12.6] as const,
  // 0:10–0:13 · convergencia
  converge: 10.0,
  orbitsOut: [10.0, 10.9] as const,
  absorb: [11.2, 11.6, 12.0, 12.4] as const,
  whiteOut: [12.5, 13.05] as const,
  // 0:13–0:15 · cierre de marca
  symbolToLogo: [13.1, 13.6] as const,
  wordmark: [13.45, 13.95] as const,
} as const;

export const EASE_IO = Easing.bezier(0.45, 0, 0.55, 1);
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.55, 0, 0.9, 0.45);
export const EASE_BACK = Easing.bezier(0.34, 1.45, 0.64, 1); // escala elástica suave

export const ramp = (t: number, a: number, b: number, e: (x: number) => number = (x) => x) =>
  e(Math.max(0, Math.min(1, (t - a) / (b - a))));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Pseudoaleatorio determinista (render reproducible). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Paleta: espacio, blanco y el turquesa de marca como único acento
export const K = {
  space: "#05070F",
  spaceCenter: "#0B1224",
  white: "#FFFFFF",
  teal: "#4FD3C4",
  navy: "#1D1F3D",
};
