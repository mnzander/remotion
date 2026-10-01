import { loadFont as loadLexend } from "@remotion/google-fonts/Lexend";
import { loadFont as loadStix } from "@remotion/google-fonts/STIXTwoText";
import { Easing, interpolate } from "remotion";

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------
export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_SECONDS = 92;
export const DURATION_FRAMES = DURATION_SECONDS * FPS;

export const sec = (s: number) => Math.round(s * FPS);

// ---------------------------------------------------------------------------
// Tipografía oficial
// ---------------------------------------------------------------------------
export const LEXEND = loadLexend("normal", {
  weights: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

export const STIX = loadStix("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

loadStix("italic", {
  weights: ["400", "500"],
  subsets: ["latin", "latin-ext"],
});

// ---------------------------------------------------------------------------
// Paleta Diamacon
// ---------------------------------------------------------------------------
export const C = {
  navy: "#1b1e3b", // primario
  teal: "#4fd3c3", // secundario / acento
  white: "#ffffff", // secundario
  // Derivados (tintes del primario y del acento, sin colores ajenos a la marca)
  navyDeep: "#10122a",
  navyRaised: "#242850",
  navyLine: "#353a6a",
  tealMid: "#35787f",
  tealSoft: "rgba(79,211,195,0.14)",
  tealGlow: "rgba(79,211,195,0.45)",
  ink: "#1b1e3b",
  inkSoft: "#6b7092",
  uiLine: "#e4e7ef",
  uiSoft: "#eef8f6",
  uiRow: "#f6f8fb",
} as const;

// ---------------------------------------------------------------------------
// Curvas de movimiento (sin rebotes: solidez)
// ---------------------------------------------------------------------------
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1); // entradas
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0); // salidas
export const EASE_IN_OUT = Easing.bezier(0.83, 0, 0.17, 1); // transiciones de objeto
export const EASE_CAM = Easing.bezier(0.65, 0, 0.35, 1); // viajes de cámara: pico de velocidad contenido
export const EASE_SOFT = Easing.bezier(0.45, 0, 0.55, 1); // derivas lentas
export const EASE_SNAP = Easing.bezier(0.34, 1.3, 0.64, 1); // encaje leve

/** Progreso 0..1 entre dos instantes (en segundos) con easing y clamp. */
export const ramp = (
  t: number,
  a: number,
  b: number,
  easing: (x: number) => number = EASE_OUT,
) =>
  interpolate(t, [a, b], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * Asentamiento limpio: cuando una animación está a menos de `eps` de su valor
 * final, lo fija. Evita la cola subpíxel de los easings, que en Chrome hace
 * que el texto salte de píxel en píxel (temblor) antes de quedarse quieto.
 */
export const settled = (p: number, eps = 0.008) =>
  Math.abs(1 - p) < eps ? 1 : p;

/** Interpolación exponencial para zooms de cámara (velocidad perceptual constante). */
export const lerpScale = (a: number, b: number, p: number) =>
  Math.exp(lerp(Math.log(a), Math.log(b), p));

/** Pseudoaleatorio determinista (render reproducible). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
