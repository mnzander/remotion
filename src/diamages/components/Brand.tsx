import React, { useId } from "react";
import { D, EASE_IN, EASE_OUT, ramp } from "../theme";
import { DG_ICON, WORDMARK } from "../brandPaths";
import { Gem } from "../../diamacon/components/Gem";

// Proporciones medidas sobre el logotipo horizontal oficial de Diamages.
const SYMBOL_PX = WORDMARK.symbolPx;
export const WM_OFFSET_X = WORDMARK.wordOffsetX;
export const WM_OFFSET_Y = WORDMARK.wordOffsetY;
export const LOCKUP_WIDTH = WM_OFFSET_X + WORDMARK.width / SYMBOL_PX;
/** Caja SVG de <Gem> respecto al tamaño visual del símbolo (igual que en Diamacon). */
export const GEM_BOX = 1.031;

/** Logotipo tipográfico «Diamages», con entrada/salida letra a letra desde máscara. */
export const Wordmark: React.FC<{
  size: number; // tamaño del símbolo que acompaña
  t: number;
  at: number;
  out?: number;
  stagger?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size, t, at, out, stagger = 0.045, color = D.navy, style }) => {
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
          {/* la máscara llega hasta la línea base; el rasgo descendente de la «g» sale con su letra */}
          <rect x={-10} y={-6} width={WORDMARK.width + 20} height={WORDMARK.height + 12} />
        </clipPath>
      </defs>
      <g clipPath={`url(#wm${id})`}>
        {WORDMARK.letters.map((l, i) => {
          const pIn = ramp(t, at + i * stagger, at + i * stagger + 0.65, EASE_OUT);
          const pOut =
            out === undefined
              ? 0
              : ramp(t, out + (n - 1 - i) * 0.03, out + (n - 1 - i) * 0.03 + 0.4, EASE_IN);
          const y = (1 - pIn) * 170 + pOut * 170;
          if (pIn <= 0 || pOut >= 1) return null;
          return (
            <path
              key={i}
              d={l.d}
              fill={color}
              fillRule="evenodd"
              transform={`translate(${l.ox} ${l.oy + y})`}
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
  color?: string;
  style?: React.CSSProperties;
}> = ({ size, t, wordAt, wordOut, gem, color = D.navy, style }) => (
  <div style={{ position: "relative", width: size * LOCKUP_WIDTH, height: size, ...style }}>
    <Gem
      size={size * GEM_BOX}
      color={color}
      {...gem}
      style={{ position: "absolute", left: -0.017 * size, top: -0.016 * size }}
    />
    <Wordmark
      size={size}
      t={t}
      at={wordAt}
      out={wordOut}
      color={color}
      style={{ position: "absolute", left: size * WM_OFFSET_X, top: size * WM_OFFSET_Y }}
    />
  </div>
);

/** Icono de aplicación «DG» (vector, a partir del icono oficial). */
export const DgIcon: React.FC<{
  size: number;
  letters?: number;
  fill?: string;
  ink?: string;
  style?: React.CSSProperties;
}> = ({ size, letters = 1, fill = D.teal, ink = D.navy, style }) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${DG_ICON.size} ${DG_ICON.size}`}
    style={{ overflow: "visible", display: "block", flexShrink: 0, ...style }}
  >
    <rect width={DG_ICON.size} height={DG_ICON.size} rx={DG_ICON.radius} fill={fill} />
    <g opacity={letters}>
      {DG_ICON.letters.map((l, i) => (
        <path key={i} d={l.d} fill={ink} fillRule="evenodd" transform={`translate(${l.ox} ${l.oy})`} />
      ))}
    </g>
  </svg>
);
