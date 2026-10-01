import React, { useId } from "react";
import { D } from "../theme";
import { LINE_W, P2, S, TILE, fillOf, flipMatrix, halfTri } from "../trama";
import type { Cam } from "../world";

export type FlipTri = {
  c: number;
  r: number;
  h: 0 | 1;
  p: number;
  back?: string;
  /** Cara visible antes del giro (por defecto, el color de la trama). */
  front?: string;
  /** Hueco que deja la tesela mientras gira. */
  hole?: string;
};
export type Veil = { axis: "x" | "y"; a0: number; a1: number; amount: number }; // rango en pantalla

const M = 420; // margen para la inclinación 3D de la cámara

const lerpN = (a: number, b: number, p: number) => a + (b - a) * p;

const pts = (tri: [P2, P2, P2]) => tri.map((q) => `${q.x},${q.y}`).join(" ");

/** Oscurece un color #rrggbb multiplicando sus canales (sombreado del volteo). */
export const darken = (hex: string, k: number) => {
  if (k >= 0.999) return hex;
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(v * k);
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
};

/**
 * Trama de marca en espacio de pantalla, alineada a la cámara del mundo.
 * Las mitades que se voltean se dibujan aparte (con el hueco que dejan).
 */
export const Trama: React.FC<{
  cam: Pick<Cam, "x" | "y" | "s">;
  opacity?: number;
  /** Contraste del motivo: 1 = como en la guía. */
  contrast?: number;
  flips?: FlipTri[];
  veils?: Veil[];
  /** Destello que recorre las líneas en diagonal: posición 0..1 (fuera de rango = sin destello). */
  sweep?: number;
  /** Radio (px de pantalla, desde el centro) hasta el que la trama está desplegada; sin valor = toda. */
  reveal?: number;
}> = ({ cam, opacity = 1, contrast = 1, flips = [], veils = [], sweep = -1, reveal }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tx = 960 - cam.x * cam.s;
  const ty = 540 - cam.y * cam.s;
  const world = `matrix(${cam.s} 0 0 ${cam.s} ${tx} ${ty})`;
  // por debajo de ~0,1 las líneas serían de menos de medio píxel: se atenúan
  const lineOpacity = Math.min(1, Math.max(0, (cam.s - 0.05) / 0.15));
  if (opacity <= 0) return null;
  return (
    <svg
      width={1920 + 2 * M}
      height={1080 + 2 * M}
      viewBox={`${-M} ${-M} ${1920 + 2 * M} ${1080 + 2 * M}`}
      style={{ position: "absolute", left: -M, top: -M, opacity }}
    >
      <defs>
        <pattern
          id={`tp${id}`}
          patternUnits="userSpaceOnUse"
          width={TILE.w}
          height={TILE.h}
          patternTransform={world}
        >
          <rect width={TILE.w} height={TILE.h} fill={D.tealLight} />
          <path d={TILE.dark} fill={D.teal} />
          <path
            d={TILE.lines}
            stroke={D.white}
            strokeWidth={LINE_W}
            strokeOpacity={lineOpacity}
            fill="none"
          />
        </pattern>
        <pattern id={`tl${id}`} patternUnits="userSpaceOnUse" width={TILE.w} height={TILE.h} patternTransform={world}>
          <rect width={TILE.w} height={TILE.h} fill={D.white} opacity={0.3} />
          <path d={TILE.lines} stroke={D.white} strokeWidth={LINE_W * 2.4} strokeLinecap="round" fill="none" />
        </pattern>
        {sweep > 0 && sweep < 1 ? (
          <>
            <linearGradient
              id={`tg${id}`}
              gradientUnits="userSpaceOnUse"
              x1={lerpN(-1100, 2600, sweep) - 380}
              y1={0}
              x2={lerpN(-1100, 2600, sweep) + 380}
              y2={380}
            >
              <stop offset="0" stopColor="#000" />
              <stop offset="0.5" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
            <mask id={`tb${id}`} maskUnits="userSpaceOnUse" x={-M} y={-M} width={1920 + 2 * M} height={1080 + 2 * M}>
              <rect x={-M} y={-M} width={1920 + 2 * M} height={1080 + 2 * M} fill={`url(#tg${id})`} />
            </mask>
          </>
        ) : null}
        {reveal !== undefined ? (
          <mask id={`tr${id}`} maskUnits="userSpaceOnUse" x={-M} y={-M} width={1920 + 2 * M} height={1080 + 2 * M}>
            <circle cx={960} cy={540} r={Math.max(0, reveal)} fill="#fff" />
          </mask>
        ) : null}
        {veils.length ? (
          <mask id={`tm${id}`} maskUnits="userSpaceOnUse" x={-M} y={-M} width={1920 + 2 * M} height={1080 + 2 * M}>
            <rect x={-M} y={-M} width={1920 + 2 * M} height={1080 + 2 * M} fill="#fff" />
            {veils.map((v, i) => {
              const g = Math.round(255 * (1 - v.amount));
              const col = `rgb(${g},${g},${g})`;
              const F = 160; // borde difuminado
              const len = v.a1 - v.a0 + 2 * F;
              const horiz = v.axis === "x";
              return (
                <React.Fragment key={i}>
                  <linearGradient
                    id={`tv${id}${i}`}
                    gradientUnits="userSpaceOnUse"
                    x1={horiz ? v.a0 - F : 0}
                    x2={horiz ? v.a1 + F : 0}
                    y1={horiz ? 0 : v.a0 - F}
                    y2={horiz ? 0 : v.a1 + F}
                  >
                    <stop offset="0" stopColor="#fff" />
                    <stop offset={F / len} stopColor={col} />
                    <stop offset={1 - F / len} stopColor={col} />
                    <stop offset="1" stopColor="#fff" />
                  </linearGradient>
                  <rect
                    x={horiz ? v.a0 - F : -M}
                    y={horiz ? -M : v.a0 - F}
                    width={horiz ? len : 1920 + 2 * M}
                    height={horiz ? 1080 + 2 * M : len}
                    fill={`url(#tv${id}${i})`}
                    style={{ mixBlendMode: "darken" }}
                  />
                </React.Fragment>
              );
            })}
          </mask>
        ) : null}
      </defs>
      <rect x={-M} y={-M} width={1920 + 2 * M} height={1080 + 2 * M} fill={D.teal} />
      <g mask={reveal !== undefined ? `url(#tr${id})` : undefined}>
        <rect
          x={-M}
          y={-M}
          width={1920 + 2 * M}
          height={1080 + 2 * M}
          fill={`url(#tp${id})`}
          opacity={contrast}
          mask={veils.length ? `url(#tm${id})` : undefined}
        />
      {sweep > 0 && sweep < 1 && contrast > 0.5 ? (
        <g mask={veils.length ? `url(#tm${id})` : undefined}>
          <rect
            x={-M}
            y={-M}
            width={1920 + 2 * M}
            height={1080 + 2 * M}
            fill={`url(#tl${id})`}
            mask={`url(#tb${id})`}
            opacity={0.85 * Math.min(1, (cam.s - 0.05) / 0.15)}
          />
        </g>
      ) : null}
      </g>
      {flips.length ? (
        <g transform={world}>
          {flips.map(({ c, r, h, p, back = D.white, front: frontColor, hole = D.tealHole }) => {
            if (p <= 0) return null;
            const tri = halfTri(c, r, h);
            const k = Math.cos(Math.PI * Math.min(1, p));
            const front = frontColor ?? (fillOf(c, r, h) ? D.teal : D.tealLight);
            // el lado que se ve: frente mientras k > 0, reverso después; leve sombreado al girar
            const face = k >= 0 ? front : back;
            const shade = 1 - 0.18 * (1 - Math.abs(k));
            return (
              <g key={`${c}.${r}.${h}`}>
                {p < 1 ? <polygon points={pts(tri)} fill={hole} /> : null}
                <polygon
                  points={pts(tri)}
                  fill={darken(face, shade)}
                  transform={p < 1 ? flipMatrix(tri, Math.abs(k) < 0.02 ? 0.02 : Math.abs(k)) : undefined}
                  stroke={p >= 1 ? face : undefined}
                  strokeWidth={p >= 1 ? 1 : undefined}
                />
              </g>
            );
          })}
        </g>
      ) : null}
    </svg>
  );
};

/**
 * Teselas del frente de despliegue: entre `r` y `r + band` (px de pantalla) las
 * mitades giran de teal liso a su color de trama. Fuera del frente no se dibujan
 * (dentro, la trama ya está visible; fuera, el fondo es teal liso).
 */
export const revealFlips = (cam: Pick<Cam, "x" | "y" | "s">, r: number, band = 280): FlipTri[] => {
  const out: FlipTri[] = [];
  const x0 = cam.x + (0 - 960) / cam.s;
  const x1 = cam.x + (1920 - 960) / cam.s;
  const y0 = cam.y + (0 - 540) / cam.s;
  const y1 = cam.y + (1080 - 540) / cam.s;
  for (let row = Math.floor(y0 / S) - 1; row <= Math.ceil(y1 / S); row++) {
    for (let c = Math.floor(x0 / S) - 1; c <= Math.ceil(x1 / S); c++) {
      for (const h of [0, 1] as const) {
        const tri = halfTri(c, row, h);
        const cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
        const cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
        const dist = Math.hypot(960 + (cx - cam.x) * cam.s - 960, 540 + (cy - cam.y) * cam.s - 540);
        const p = (r + band - dist) / band;
        if (p <= 0 || dist < r) continue;
        out.push({
          c,
          r: row,
          h,
          p: Math.min(1, p),
          front: D.teal,
          back: fillOf(c, row, h) ? D.teal : D.tealLight,
          hole: D.teal,
        });
      }
    }
  }
  return out;
};
