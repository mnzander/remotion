import React, { useId } from "react";
import { C, HEIGHT, WIDTH } from "../theme";

/**
 * Teselado de la guía Diamacon (portada del PDF): retícula con diagonales,
 * diamantes navy rodeados de triángulos teal. Se repite con <pattern>, así
 * que su coste no depende del tamaño del mundo.
 */
export const Pattern: React.FC<{
  cell?: number;
  lineOpacity?: number;
  fillOpacity?: number;
  /** Desplazamiento del patrón en px de pantalla (paralaje de cámara). */
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  /** Radio (px) del revelado circular; undefined = sin máscara. */
  revealRadius?: number;
  revealX?: number;
  revealY?: number;
  /** Viñeta que oscurece los bordes para no competir con el texto. */
  vignette?: boolean;
  style?: React.CSSProperties;
}> = ({
  cell = 64,
  lineOpacity = 0.2,
  fillOpacity = 0.18,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  revealRadius,
  revealX = WIDTH / 2,
  revealY = HEIGHT / 2,
  vignette = false,
  style,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = cell;
  const tile = s * 2;
  // triángulos exteriores (fuera del diamante central de cada bloque 2×2)
  const tri = [
    `M0 0 L${s} 0 L${s / 2} ${s / 2} Z`,
    `M0 0 L0 ${s} L${s / 2} ${s / 2} Z`,
    `M${tile} 0 L${s} 0 L${s * 1.5} ${s / 2} Z`,
    `M${tile} 0 L${tile} ${s} L${s * 1.5} ${s / 2} Z`,
    `M0 ${tile} L${s} ${tile} L${s / 2} ${s * 1.5} Z`,
    `M0 ${tile} L0 ${s} L${s / 2} ${s * 1.5} Z`,
    `M${tile} ${tile} L${s} ${tile} L${s * 1.5} ${s * 1.5} Z`,
    `M${tile} ${tile} L${tile} ${s} L${s * 1.5} ${s * 1.5} Z`,
  ];
  const lines = [
    // retícula
    `M0 0 H${tile} M0 ${s} H${tile} M0 0 V${tile} M${s} 0 V${tile}`,
    // diagonales de cada celda
    `M0 0 L${tile} ${tile} M${tile} 0 L0 ${tile}`,
    `M0 ${s} L${s} 0 L${tile} ${s} L${s} ${tile} Z`,
  ].join(" ");
  const tx = ((offsetX % (tile * scale)) + tile * scale) % (tile * scale);
  const ty = ((offsetY % (tile * scale)) + tile * scale) % (tile * scale);
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      style={{ position: "absolute", inset: 0, ...style }}
    >
      <defs>
        <pattern
          id={`pat${id}`}
          width={tile}
          height={tile}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${tx} ${ty}) scale(${scale})`}
        >
          {tri.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={C.teal}
              opacity={fillOpacity * (i % 3 === 0 ? 0.55 : 1)}
            />
          ))}
          <path
            d={`M${s} ${s * 0.5} L${s * 1.5} ${s} L${s} ${s * 1.5} Z`}
            fill={C.teal}
            opacity={fillOpacity * 0.5}
          />
          <path
            d={lines}
            fill="none"
            stroke={C.teal}
            strokeOpacity={lineOpacity}
            strokeWidth={1.2 / scale}
          />
        </pattern>
        {revealRadius !== undefined ? (
          <radialGradient
            id={`rev${id}`}
            gradientUnits="userSpaceOnUse"
            cx={revealX}
            cy={revealY}
            r={Math.max(1, revealRadius)}
          >
            <stop offset="0" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.82" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
        ) : null}
        {revealRadius !== undefined ? (
          <mask id={`mask${id}`}>
            <rect width={WIDTH} height={HEIGHT} fill={`url(#rev${id})`} />
          </mask>
        ) : null}
        {vignette ? (
          <radialGradient id={`vig${id}`} cx="50%" cy="50%" r="75%">
            <stop offset="0.35" stopColor={C.navy} stopOpacity={0} />
            <stop offset="1" stopColor={C.navyDeep} stopOpacity={0.92} />
          </radialGradient>
        ) : null}
      </defs>
      <rect
        width={WIDTH}
        height={HEIGHT}
        fill={`url(#pat${id})`}
        mask={revealRadius !== undefined ? `url(#mask${id})` : undefined}
      />
      {vignette ? (
        <rect width={WIDTH} height={HEIGHT} fill={`url(#vig${id})`} />
      ) : null}
    </svg>
  );
};
