// Tema de Diamages: reutiliza el formato, las fuentes y las curvas de la pieza
// de Diamacon (misma familia) y cambia la paleta: aquí manda el teal.
export {
  FPS,
  WIDTH,
  HEIGHT,
  sec,
  LEXEND,
  STIX,
  EASE_OUT,
  EASE_IN,
  EASE_IN_OUT,
  EASE_CAM,
  EASE_SOFT,
  EASE_SNAP,
  ramp,
  lerp,
  settled,
  lerpScale,
  rand,
} from "../diamacon/theme";

export const DURATION_SECONDS = 118.2;
export const DURATION_FRAMES = Math.round(DURATION_SECONDS * 60);

// ---------------------------------------------------------------------------
// Paleta Diamages
// ---------------------------------------------------------------------------
export const D = {
  teal: "#4fd3c3", // principal
  navy: "#1b1e3b", // texto, gema, iconos
  white: "#ffffff",
  // Derivados de la guía (trama y banda superior)
  tealLight: "#7bdbd0", // celdas claras de la trama
  tealPale: "#c8f1ea", // banda de la guía, fondos de interfaz
  tealDeep: "#167a6f", // solo estados de éxito
  tealHole: "#3fc2b2", // hueco que deja una tesela al voltearse
  ink: "#1b1e3b",
  ink2: "#4b5177",
  inkSoft: "#737897",
  uiLine: "#e4e7ef",
  uiSoft: "#eaf8f5",
  uiRow: "#f6f8fb",
  shadow: "rgba(27,30,59,0.22)",
} as const;
