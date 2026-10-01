import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  C,
  EASE_IN,
  EASE_IN_OUT,
  EASE_SOFT,
  FPS,
  HEIGHT,
  STIX,
  WIDTH,
  lerp,
  lerpScale,
  ramp,
} from "../theme";
import { GEM_BOX_UNITS, GemStrokes } from "../components/Gem";
import { GEM_BOX, Wordmark } from "../components/Lockup";
import { RevealLine } from "../components/Kinetic";
import { V } from "../gem";

// Escena 2 · La regla contable se convierte en el borde superior de la gema,
// que se talla faceta a faceta y forma el logotipo. Sale con un zoom que
// atraviesa la ventana central del símbolo (portal hacia la escena 3).

const G0 = 440; // caja de la gema al nacer (px)
const G0_CENTER = { x: 960, y: 540 };
const S_LOCK = 250; // tamaño visual del símbolo en el logotipo horizontal
const LOCK_LEFT = 341.5;
const LOCK_TOP = 345;
const LOCK_BOX = S_LOCK * GEM_BOX;
const LOCK_CENTER = {
  x: LOCK_LEFT - 0.017 * S_LOCK + LOCK_BOX / 2,
  y: LOCK_TOP - 0.016 * S_LOCK + LOCK_BOX / 2,
};

export const ZOOM_START = 8.1;
export const LOGO_DURATION = 9.6;
const ZOOM_MAX = 60;

const k0 = G0 / GEM_BOX_UNITS;
/** Geometría en pantalla del borde superior al nacer la gema (destino de la regla de la escena 1). */
export const TOP_EDGE_SCREEN = {
  x1: G0_CENTER.x + V.A.x * k0,
  x2: G0_CENTER.x + V.B.x * k0,
  y: G0_CENTER.y + (V.A.y - 1.5) * k0,
  thickness: 11 * k0,
};

// Sin empuje de escala durante la lectura (evita el temblor del texto).
const push = (t: number) => (t >= 0 ? 1 : 1);

/** Estado de la gema (centro y caja en px) en tiempo local de la escena 2. */
export const logoGem = (t: number) => {
  const m = ramp(t, 1.7, 2.55, EASE_IN_OUT);
  let cx = lerp(G0_CENTER.x, LOCK_CENTER.x, m);
  let cy = lerp(G0_CENTER.y, LOCK_CENTER.y, m);
  let box = lerp(G0, LOCK_BOX, m);
  const p = push(t);
  cx = 960 + (cx - 960) * p;
  cy = 540 + (cy - 540) * p;
  box *= p;
  // Zoom a través de la ventana central
  const z = ramp(t, ZOOM_START, LOGO_DURATION, EASE_IN);
  const center = ramp(t, ZOOM_START, LOGO_DURATION - 0.3, EASE_IN_OUT);
  return {
    cx: lerp(cx, 960, center),
    cy: lerp(cy, 540, center),
    box: box * lerpScale(1, ZOOM_MAX, z),
  };
};

export const S2Logo: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const g = logoGem(t);
  const k = g.box / GEM_BOX_UNITS;
  const p = push(t);

  const outline = ramp(t, 0.0, 1.05, EASE_IN_OUT);
  const inner = ramp(t, 0.45, 1.55, EASE_SOFT);
  const glint1 = ramp(t, 1.35, 2.1, (x) => x);
  const glint2 = ramp(t, 5.6, 6.3, (x) => x);
  const glint = glint1 > 0 && glint1 < 1 ? glint1 : glint2;
  // el halo respira despacio mientras se lee: movimiento de luz, no de píxeles
  const breathe = 0.85 + 0.15 * Math.sin(((t - 1.6) / 2.4) * Math.PI * 2);
  const glow =
    ramp(t, 0.9, 1.6) *
    breathe *
    (1 - ramp(t, ZOOM_START - 0.1, ZOOM_START + 0.4, EASE_SOFT));

  return (
    <AbsoluteFill>
      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{
          position: "absolute",
          inset: 0,
          filter:
            glow > 0.01
              ? `drop-shadow(0 0 ${16 * glow}px ${C.tealGlow})`
              : undefined,
          // los trazos se disuelven al pasar por cámara (profundidad de campo)
          opacity:
            1 -
            ramp(t, LOGO_DURATION - 0.38, LOGO_DURATION - 0.04, EASE_IN_OUT),
        }}
      >
        <GemStrokes
          transform={`translate(${g.cx} ${g.cy}) scale(${k})`}
          top={1}
          outline={outline}
          inner={inner}
          glint={glint}
        />
      </svg>

      <AbsoluteFill
        style={{ transform: `scale(${p})`, transformOrigin: "960px 540px" }}
      >
        <Wordmark
          size={S_LOCK}
          t={t}
          at={2.1}
          out={7.8}
          style={{
            position: "absolute",
            left: LOCK_LEFT + 1.178 * S_LOCK,
            top: LOCK_TOP + 0.1675 * S_LOCK,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            width: WIDTH,
            top: 652,
            textAlign: "center",
            fontFamily: STIX,
            fontSize: 62,
            lineHeight: 1.18,
            color: C.white,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <RevealLine t={t} at={2.4} out={7.7} outDur={0.45} exit="down">
            La gestión contable y fiscal de sus clientes
          </RevealLine>
          <RevealLine
            t={t}
            at={2.65}
            out={7.7}
            outDur={0.45}
            exit="down"
            style={{ color: C.teal, fontStyle: "italic", fontWeight: 500 }}
          >
            a otro nivel.
          </RevealLine>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
