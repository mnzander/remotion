import React, { useId } from "react";
import { C, EASE_IN, EASE_OUT, ramp } from "../theme";
import { WORDMARK } from "../brandPaths";
import { Gem } from "./Gem";

// Proporciones medidas sobre el logotipo horizontal original (símbolo = 191 px).
const SYMBOL_PX = 191;
const WM_OFFSET_X = (312 - 87) / SYMBOL_PX; // desde el borde izquierdo del símbolo
const WM_OFFSET_Y = (122 - 90) / SYMBOL_PX; // desde el borde superior del símbolo
export const LOCKUP_WIDTH = WM_OFFSET_X + WORDMARK.width / SYMBOL_PX; // en múltiplos del símbolo
/** Caja SVG de <Gem> respecto al tamaño visual del símbolo (el viewBox incluye margen de trazo). */
export const GEM_BOX = 1.031;

/** Logotipo tipográfico oficial, con entrada/salida letra a letra desde máscara. */
export const Wordmark: React.FC<{
  size: number; // tamaño del símbolo que acompaña
  t: number;
  at: number;
  out?: number;
  stagger?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size, t, at, out, stagger = 0.045, color = C.teal, style }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const k = size / SYMBOL_PX;
  const n = WORDMARK.letters.length;
  return (
    <svg
      width={WORDMARK.width * k}
      height={WORDMARK.height * k}
      viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
      style={{ overflow: "visible", ...style }}
    >
      <defs>
        <clipPath id={`wm${id}`}>
          <rect
            x={-10}
            y={-4}
            width={WORDMARK.width + 20}
            height={WORDMARK.height + 4}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#wm${id})`}>
        {WORDMARK.letters.map((l, i) => {
          const pIn = ramp(
            t,
            at + i * stagger,
            at + i * stagger + 0.65,
            EASE_OUT,
          );
          const pOut =
            out === undefined
              ? 0
              : ramp(
                  t,
                  out + (n - 1 - i) * 0.03,
                  out + (n - 1 - i) * 0.03 + 0.4,
                  EASE_IN,
                );
          const y = (1 - pIn) * 140 + pOut * 140;
          if (pIn <= 0) return null;
          return (
            <path
              key={i}
              d={l.d}
              fill={color}
              fillRule="evenodd"
              transform={`translate(0 ${y})`}
            />
          );
        })}
      </g>
    </svg>
  );
};

/** Logotipo horizontal: símbolo (animable) + logotipo tipográfico. */
export const Lockup: React.FC<{
  size: number;
  t: number;
  wordAt: number;
  wordOut?: number;
  gem?: Omit<React.ComponentProps<typeof Gem>, "size">;
  wordColor?: string;
  style?: React.CSSProperties;
}> = ({ size, t, wordAt, wordOut, gem, wordColor, style }) => (
  <div
    style={{
      position: "relative",
      width: size * LOCKUP_WIDTH,
      height: size,
      ...style,
    }}
  >
    <Gem
      size={size * GEM_BOX}
      {...gem}
      style={{ position: "absolute", left: -0.017 * size, top: -0.016 * size }}
    />
    <Wordmark
      size={size}
      t={t}
      at={wordAt}
      out={wordOut}
      color={wordColor}
      style={{
        position: "absolute",
        left: size * WM_OFFSET_X,
        top: size * WM_OFFSET_Y,
      }}
    />
  </div>
);

/** Transición de salida simple para bloques completos. */
export const exitY = (t: number, out: number, dist = 40) =>
  ramp(t, out, out + 0.5, EASE_IN) * -dist;
