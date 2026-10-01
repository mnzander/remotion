import React from "react";
import { C } from "../theme";
import { ICON_LETTERS } from "../brandPaths";

/** Icono de aplicación «Dc» (vector, a partir del icono oficial). */
export const AppIcon: React.FC<{
  size: number;
  /** 0..1 visibilidad de las letras (para el morph hacia la ventana). */
  letters?: number;
  fill?: string;
  border?: string;
  style?: React.CSSProperties;
}> = ({ size, letters = 1, fill = C.navy, border, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="10 10 397 397"
    style={{ overflow: "visible", ...style }}
  >
    <rect
      x={10}
      y={10}
      width={397}
      height={397}
      rx={76}
      fill={fill}
      stroke={border}
      strokeWidth={border ? 6 : 0}
    />
    <g opacity={letters}>
      {ICON_LETTERS.letters.map((l, i) => (
        <path key={i} d={l.d} fill={C.teal} fillRule="evenodd" />
      ))}
    </g>
  </svg>
);
