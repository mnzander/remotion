import { EASE_CAM, EASE_OUT, lerp, lerpScale, ramp } from "./theme";
import { SCENES, STOPS, WORLD } from "./timeline";

// Mundo del plano secuencia: un lienzo continuo con retícula de ajedrez
// (paso 1600 × 900). Cada funcionalidad es una ventana de la aplicación en
// una casilla; la cámara viaja de una a otra sin cortes.

export const PANEL_W = 900;
export const PANEL_H = 640;
export const CELL_X = 1600;
export const CELL_Y = 900;
export const SIDE_OFFSET = 370; // desplazamiento del panel respecto al centro de pantalla

export const panelCenter = (i: number) => ({
  x: i * CELL_X,
  y: (i % 2) * CELL_Y,
});

/** Punto de mundo que queda en el centro de la pantalla cuando la cámara reposa en la parada i. */
export const restPoint = (i: number) => {
  const p = panelCenter(i);
  return { x: p.x + (i % 2 === 0 ? -SIDE_OFFSET : SIDE_OFFSET), y: p.y };
};

export type Cam = { x: number; y: number; s: number; rx: number; ry: number };

const OVERVIEW = { x: 4000, y: 450, s: 0.2 };
const FAR = { s: 0.105 };

/** Cámara del mundo en tiempo local de la escena "world". */
export const worldCamera = (t: number): Cam => {
  // Reposo / desplazamiento entre paradas
  for (let i = 0; i < STOPS.length; i++) {
    const b = STOPS[i].rest[1];
    const w = restPoint(i);
    if (t <= b || i === STOPS.length - 1) {
      if (t <= b) {
        // en reposo la cámara queda clavada en píxeles enteros: lectura nítida
        return { x: w.x, y: w.y, s: 1, rx: 0, ry: 0 };
      }
      break;
    }
    const next = STOPS[i + 1];
    if (t < next.rest[0]) {
      const p = ramp(t, b, next.rest[0], EASE_CAM);
      const bell = Math.sin(Math.PI * p);
      const w2 = restPoint(i + 1);
      const dx = w2.x - w.x;
      const dy = w2.y - w.y;
      const len = Math.hypot(dx, dy);
      return {
        x: lerp(w.x, w2.x, p),
        y: lerp(w.y, w2.y, p),
        s: 1 - 0.4 * bell,
        rx: (dy / len) * 7 * bell,
        ry: -(dx / len) * 10 * bell,
      };
    }
  }
  // Última parada → vista general → alejamiento "sin límite"
  const last = restPoint(STOPS.length - 1);
  const o = ramp(t, WORLD.overviewStart, WORLD.overviewEnd, EASE_CAM);
  const far = ramp(t, WORLD.overviewEnd, WORLD.end, EASE_OUT);
  const tilt = Math.sin(Math.PI * o);
  const s =
    o < 1 ? lerpScale(1, OVERVIEW.s, o) : lerpScale(OVERVIEW.s, FAR.s, far);
  return {
    x: lerp(last.x, OVERVIEW.x, o) + far * 300,
    y: lerp(last.y, OVERVIEW.y, o) + far * 120,
    s,
    rx: 6 * tilt,
    ry: 4 * tilt,
  };
};

/** ¿La cámara del mundo va rápida? (activa el desenfoque de movimiento) */
export const worldIsMoving = (t: number) => {
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t > STOPS[i].rest[1] && t < STOPS[i + 1].rest[0]) return true;
  }
  return (
    (t > WORLD.overviewStart && t < WORLD.overviewEnd + 0.4) ||
    (t > WORLD.convergeStart + 0.2 && t < WORLD.end)
  );
};

/** Pantalla ← mundo (ignora la inclinación 3D, que es nula en reposo y en la vista lejana). */
export const toScreen = (cam: Cam, x: number, y: number) => ({
  x: 960 + (x - cam.x) * cam.s,
  y: 540 + (y - cam.y) * cam.s,
});

// ---------------------------------------------------------------------------
// Estado del teselado de fondo (tiempo global) — continuo en todo el vídeo.
// ---------------------------------------------------------------------------
const W0 = restPoint(0);
const DRIFT = 10; // px/s antes del mundo

export const backdropPattern = (gt: number) => {
  const unicoStart = SCENES.unico.start;
  const worldStart = SCENES.world.start;
  if (gt < worldStart) {
    const scale = lerp(
      0.5,
      1,
      ramp(gt, unicoStart, unicoStart + 1.6, EASE_OUT),
    );
    const drift = -(gt - unicoStart) * DRIFT;
    return {
      scale,
      offsetX: 960 * (1 - scale) + drift,
      offsetY: 540 * (1 - scale),
    };
  }
  const cam = worldCamera(gt - worldStart);
  const par = 0.55;
  const scale = 1 + (cam.s - 1) * par;
  const base = -(worldStart - unicoStart) * DRIFT;
  return {
    scale,
    offsetX: 960 * (1 - scale) + base - (cam.x - W0.x) * par * cam.s,
    offsetY: 540 * (1 - scale) - (cam.y - W0.y) * par * cam.s,
  };
};
