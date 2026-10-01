import { EASE_CAM, EASE_IN_OUT, EASE_OUT, lerp, lerpScale, ramp } from "./theme";
import { STOPS, T } from "./timeline";
import { darkDiamondNear } from "./trama";

// Mundo del plano secuencia: la trama de Diamages es el lienzo. Cada parada es
// una ventana de la aplicación alineada a la retícula (8 × 6 casillas).

export const PANEL_W = 960;
export const PANEL_H = 720;
export const SIDE = 380; // desplazamiento de cámara respecto al centro del panel

export type PanelId = "g1" | "g2" | "g3" | "f4" | "f5" | "f6";

/** Centro del panel en el mundo y lado en que queda en pantalla. */
export const PANELS: Record<PanelId, { x: number; y: number; side: "left" | "right" }> = {
  g1: { x: 0, y: 0, side: "left" },
  g2: { x: 2400, y: 960, side: "right" },
  g3: { x: 4800, y: 0, side: "left" },
  f4: { x: 7200, y: 960, side: "right" },
  f5: { x: 9600, y: 0, side: "left" },
  f6: { x: 12000, y: 960, side: "right" },
};

export const HITOS = {
  remesa: { x: 13560, y: 480 },
  diamacon: { x: 14640, y: 480 },
};

export type Cam = { x: number; y: number; s: number; rx: number; ry: number };
type Pose = { x: number; y: number; s: number };

export const restPose = (id: PanelId): Pose => {
  const p = PANELS[id];
  return { x: p.x + (p.side === "left" ? SIDE : -SIDE), y: p.y, s: 1 };
};

// Rombo oscuro de la trama que coincide con la ventana central de la gema
export const D0 = darkDiamondNear(-1100, 300);
/** Escala a la que el rombo (2S de diagonal) mide lo mismo que la ventana de la gema. */
export const GEM_CENTER_SIZE = 420;
export const WINDOW_DIAG = 2 * 146.25 * (GEM_CENTER_SIZE / 444);
export const C0 = WINDOW_DIAG / 240;

const GIRO: Pose = { x: 3600, y: 15, s: 0.215 };
const DIAMACON: Pose = { x: 10810, y: 15, s: 0.215 };
const FAR: Pose = { x: 10810, y: 15, s: 0.075 };

type Key =
  | { kind: "hold"; t0: number; t1: number; pose: Pose }
  | { kind: "move"; t0: number; t1: number; a: Pose; b: Pose; dip: number; tilt: number; ease?: (x: number) => number };

const pose = (x: number, y: number, s: number): Pose => ({ x, y, s });
const G1 = restPose("g1");
const G2 = restPose("g2");
const G3 = restPose("g3");
const F4 = restPose("f4");
const F5 = restPose("f5");
const F6 = restPose("f6");
const START = pose(D0.x, D0.y, C0);
const WIDE = pose(D0.x + 300, D0.y - 60, 0.5);

const KEYS: Key[] = [
  { kind: "hold", t0: -1, t1: T.pullBack[0], pose: START },
  { kind: "move", t0: T.pullBack[0], t1: T.pullBack[1], a: START, b: WIDE, dip: 0, tilt: 0, ease: EASE_IN_OUT },
  { kind: "move", t0: T.flyToFirst[0], t1: T.flyToFirst[1], a: WIDE, b: G1, dip: 0, tilt: 0.6 },
  { kind: "hold", t0: STOPS.g1[0], t1: STOPS.g1[1], pose: G1 },
  { kind: "move", t0: STOPS.g1[1], t1: STOPS.g2[0], a: G1, b: G2, dip: 0.35, tilt: 1 },
  { kind: "hold", t0: STOPS.g2[0], t1: STOPS.g2[1], pose: G2 },
  { kind: "move", t0: STOPS.g2[1], t1: STOPS.g3[0], a: G2, b: G3, dip: 0.35, tilt: 1 },
  { kind: "hold", t0: STOPS.g3[0], t1: STOPS.g3[1], pose: G3 },
  { kind: "move", t0: STOPS.g3[1], t1: STOPS.giro[0], a: G3, b: GIRO, dip: 0, tilt: 0.5 },
  { kind: "hold", t0: STOPS.giro[0], t1: STOPS.giro[1], pose: GIRO },
  { kind: "move", t0: STOPS.giro[1], t1: STOPS.f4[0], a: GIRO, b: F4, dip: 0, tilt: 0.5 },
  { kind: "hold", t0: STOPS.f4[0], t1: STOPS.f4[1], pose: F4 },
  { kind: "move", t0: STOPS.f4[1], t1: STOPS.f5[0], a: F4, b: F5, dip: 0.35, tilt: 1 },
  { kind: "hold", t0: STOPS.f5[0], t1: STOPS.f5[1], pose: F5 },
  { kind: "move", t0: STOPS.f5[1], t1: STOPS.f6[0], a: F5, b: F6, dip: 0.35, tilt: 1 },
  { kind: "hold", t0: STOPS.f6[0], t1: STOPS.f6[1], pose: F6 },
  { kind: "move", t0: STOPS.f6[1], t1: STOPS.diamacon[0], a: F6, b: DIAMACON, dip: 0, tilt: 0.5 },
  { kind: "hold", t0: STOPS.diamacon[0], t1: STOPS.diamacon[1], pose: DIAMACON },
  { kind: "move", t0: STOPS.diamacon[1], t1: STOPS.users[0], a: DIAMACON, b: FAR, dip: 0, tilt: 0, ease: EASE_OUT },
  { kind: "hold", t0: STOPS.users[0], t1: 999, pose: FAR },
];

/** Cámara del mundo (tiempo global). En reposo queda clavada en píxeles enteros. */
export const camera = (t: number): Cam => {
  for (const k of KEYS) {
    if (t < k.t0 || t > k.t1) continue;
    if (k.kind === "hold") return { ...k.pose, rx: 0, ry: 0 };
    const p = ramp(t, k.t0, k.t1, k.ease ?? EASE_CAM);
    const bell = Math.sin(Math.PI * p);
    const dx = k.b.x - k.a.x;
    const dy = k.b.y - k.a.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
      x: lerp(k.a.x, k.b.x, p),
      y: lerp(k.a.y, k.b.y, p),
      s: lerpScale(k.a.s, k.b.s, p) * (1 - k.dip * bell),
      rx: (dy / len) * 7 * bell * k.tilt,
      ry: -(dx / len) * 10 * bell * k.tilt,
    };
  }
  return { ...FAR, rx: 0, ry: 0 };
};

/** ¿La cámara va rápida? (activa el desenfoque de movimiento) */
export const cameraMoving = (t: number) =>
  KEYS.some((k) => k.kind === "move" && t > k.t0 + 0.05 && t < k.t1 - 0.05);

export const toScreen = (cam: Cam, x: number, y: number) => ({
  x: 960 + (x - cam.x) * cam.s,
  y: 540 + (y - cam.y) * cam.s,
});

/** Instante de llegada a cada panel (para que sus teselas se volteen al aproximarse). */
export const PANEL_ARRIVE: Record<PanelId, number> = {
  g1: STOPS.g1[0],
  g2: STOPS.g2[0],
  g3: STOPS.g3[0],
  f4: STOPS.giro[0] + 0.3, // la factura vacía aparece en la vista general
  f5: STOPS.f5[0],
  f6: STOPS.f6[0],
};

/** Progreso de la mitad de tesela que se voltea para formar el panel (0..1). */
export const panelFlip = (id: PanelId, c: number, r: number, t: number) => {
  const p = PANELS[id];
  const arrive = PANEL_ARRIVE[id];
  const start = arrive - 1.0;
  // la ola nace en la esquina del panel más próxima al origen del movimiento
  const ox = p.x + (p.side === "left" ? -480 : 480);
  const oy = p.y - 360;
  const d = Math.hypot((c + 0.5) * 120 - ox, (r + 0.5) * 120 - oy) / 1200;
  return ramp(t, start + d * 0.45, start + d * 0.45 + 0.4, EASE_IN_OUT);
};

/** Opacidad del panel HTML que sustituye a las teselas blancas. */
export const panelShow = (id: PanelId, t: number) => {
  const arrive = PANEL_ARRIVE[id];
  return ramp(t, arrive - 0.2, arrive + 0.05, EASE_OUT);
};
