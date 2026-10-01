import React, { useId } from "react";
import { C } from "../theme";
import {
  BRANCH_LEFT,
  BRANCH_RIGHT,
  GEM_STROKE,
  GEM_VIEW,
  INNER,
  Seg,
  TOP_EDGE,
  segLength,
  segPath,
} from "../gem";

type Props = {
  size: number;
  /** Trazo del borde superior (el que hereda la línea del plano anterior). */
  top?: number;
  /** Contorno: dos ramas que bajan desde el borde superior y se cierran abajo. */
  outline?: number;
  /** Facetas interiores, escalonadas. */
  inner?: number;
  color?: string;
  strokeScale?: number;
  /** Posición 0..1 del destello diagonal; fuera de rango = sin destello. */
  glint?: number;
  glow?: number;
  style?: React.CSSProperties;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const branchProgress = (segs: Seg[], p: number) => {
  const lens = segs.map(segLength);
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  return lens.map((len) => {
    const local = clamp01((p * total - acc) / len);
    acc += len;
    return local;
  });
};

const innerProgress = (p: number) => {
  const n = INNER.length;
  const dur = 0.42;
  return INNER.map((_, i) => clamp01((p - (i * (1 - dur)) / (n - 1)) / dur));
};

const Stroke: React.FC<{
  seg: Seg;
  progress: number;
  stroke: string;
  width: number;
}> = ({ seg, progress, stroke, width }) => {
  if (progress <= 0.002) return null;
  return (
    <path
      d={segPath(seg)}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray="1 2"
      strokeDashoffset={1 - progress}
    />
  );
};

type StrokeProps = Omit<Props, "size" | "style">;

/** Trazos de la gema como <g> (para incrustar en un SVG a pantalla completa). */
export const GemStrokes: React.FC<StrokeProps & { transform?: string }> = ({
  top = 1,
  outline = 1,
  inner = 1,
  color = C.teal,
  strokeScale = 1,
  glint = -1,
  transform,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const width = GEM_STROKE * strokeScale;
  const left = branchProgress(BRANCH_LEFT, outline);
  const right = branchProgress(BRANCH_RIGHT, outline);
  const inn = innerProgress(inner);

  const items: { seg: Seg; progress: number }[] = [
    { seg: TOP_EDGE, progress: top },
    ...BRANCH_LEFT.map((seg, i) => ({ seg, progress: left[i] })),
    ...BRANCH_RIGHT.map((seg, i) => ({ seg, progress: right[i] })),
    ...INNER.map((seg, i) => ({ seg, progress: inn[i] })),
  ];

  const showGlint = glint > 0 && glint < 1;
  const gx = -340 + glint * 680;

  return (
    <g transform={transform}>
      {showGlint ? (
        <defs>
          <linearGradient
            id={`glint${id}`}
            gradientUnits="userSpaceOnUse"
            x1={gx - 100}
            y1={-36}
            x2={gx + 100}
            y2={36}
          >
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.95} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
      ) : null}
      {items.map(({ seg, progress }, i) => (
        <Stroke
          key={i}
          seg={seg}
          progress={progress}
          stroke={color}
          width={width}
        />
      ))}
      {showGlint
        ? items.map(({ seg, progress }, i) => (
            <Stroke
              key={`g${i}`}
              seg={seg}
              progress={progress}
              stroke={`url(#glint${id})`}
              width={width * 1.05}
            />
          ))
        : null}
    </g>
  );
};

/** Gema en su propia caja SVG de `size` px. */
export const Gem: React.FC<Props> = ({ size, glow = 0, style, ...rest }) => {
  const half = GEM_VIEW / 2 + 6;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
      style={{
        overflow: "visible",
        filter:
          glow > 0
            ? `drop-shadow(0 0 ${14 * glow}px ${C.tealGlow})`
            : undefined,
        ...style,
      }}
    >
      <GemStrokes {...rest} />
    </svg>
  );
};

/** Caja SVG de <Gem>: unidades del viewBox por lado. */
export const GEM_BOX_UNITS = GEM_VIEW + 12;
