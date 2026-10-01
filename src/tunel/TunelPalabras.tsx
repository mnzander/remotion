import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CAP_HEIGHT, WORD_PATHS } from "./wordPaths";

// Túnel de texto: la cámara avanza sin parar (dolly-in) y las palabras vienen
// desde el fondo y pasan por delante, una sola vez cada una y en orden. Cuando
// sale la última («Orden») el túnel queda vacío y el clip termina.
//
// Las palabras son contornos vectoriales de Lexend Bold (no texto HTML):
// escalan de forma continua sin el encaje al píxel que hace temblar el texto.

export const DURATION = 6.6; // s
const TRAVEL = 4; // s que tarda una palabra en cruzar el túnel entero
const FIRST_PASS = 1.8; // s: «Control» llega a cámara
const LAST_PASS = 6.4; // s: «Orden» llega a cámara (sale del encuadre ~0,2 s antes)
const FADE_IN = 0.3; // s: entrada suave del primer fotograma
const LOOP = 12; // periodo del fondo, la cámara y las partículas (movimiento ambiental)
const NAVY = "#1b1e3b";
const TEAL = "#4fd3c3";

const F = 1000; // distancia focal (px)
const Z_FAR = 5200;
const Z_NEAR = 170;
const WORLD_EM = 132; // tamaño de la palabra a z = F, en px
const TAU = Math.PI * 2;

// Orden de paso (el de la referencia). Trayectorias calculadas con
// scripts/tunnel-layout.py: separación mínima de 26 px entre palabras en todo
// el bucle, encuadre equilibrado y palabras consecutivas por lados opuestos.
const LAYOUT: { angle: number; r: number }[] = [
  { angle: 61.0, r: 0.967 }, // Control
  { angle: 179.1, r: 1.098 }, // Organización
  { angle: 353.4, r: 0.883 }, // Seguridad
  { angle: 127.4, r: 1.059 }, // Facturación
  { angle: 309.3, r: 1.126 }, // Gestión
  { angle: 239.8, r: 1.049 }, // Planificación
  { angle: 135.7, r: 0.916 }, // Coordinación
  { angle: 310.7, r: 0.842 }, // Orden
];
const RX = 741;
const RY = 500;

const frac = (x: number) => x - Math.floor(x);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

const rand = (seed: number) => {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Profundidad a lo largo del ciclo: velocidad de cámara constante. */
const depth = (u: number) => Z_FAR - u * (Z_FAR - Z_NEAR);

const camera = (t: number) => {
  const p = (t / LOOP) * TAU;
  return {
    x: 46 * Math.sin(p),
    y: 28 * Math.sin(2 * p + 1),
    roll: 1.4 * Math.sin(p + 0.6),
  };
};

const PARTICLES = Array.from({ length: 42 }, (_, i) => {
  const a = rand(i + 1) * TAU;
  const r = 0.35 + rand(i + 50) * 1.25;
  return {
    x: Math.cos(a) * RX * r * 1.1,
    y: Math.sin(a) * RY * r * 1.2,
    phase: rand(i + 99),
    size: 2.5 + rand(i + 7) * 4,
  };
});

// ---------------------------------------------------------------------------
// Capa de palabras y partículas en un instante t (segundos, periódico)
// ---------------------------------------------------------------------------
const Scene: React.FC<{ t: number; width: number; height: number; showWords?: boolean }> = ({
  t,
  width,
  height,
  showWords = true,
}) => {
  const cam = camera(t);
  const cx = width / 2;
  const cy = height / 2;
  const n = WORD_PATHS.length;

  const words = WORD_PATHS.map((w, i) => {
    // una sola pasada: u = 0 al nacer en el fondo, u = 1 al llegar a cámara
    const pass = FIRST_PASS + (i * (LAST_PASS - FIRST_PASS)) / (n - 1);
    const u = (t - (pass - TRAVEL)) / TRAVEL;
    const z = depth(u);
    const L = LAYOUT[i];
    const ang = (L.angle * Math.PI) / 180;
    const X = Math.cos(ang) * RX * L.r;
    const Y = Math.sin(ang) * RY * L.r;
    const s = F / z;
    const sx = cx + (X - cam.x) * s;
    const sy = cy + (Y - cam.y) * s;
    const k = (WORLD_EM / 100) * s;
    // niebla al nacer y desvanecido al pasar junto a cámara
    const fog = smooth(clamp01((Z_FAR - z) / 900));
    const near = u > 1 ? 0 : smooth(clamp01((z - Z_NEAR) / 190));
    const born = u < 0 ? 0 : 1;
    // profundidad de campo: suave en lo muy lejano y en lo muy cercano
    const blur = Math.max(0, ((z - 3600) / 1600) * 1.4) + Math.max(0, ((720 - z) / 550) * 7);
    const intro = smooth(clamp01(t / FADE_IN));
    return { w, z, sx, sy, k, opacity: fog * near * born * intro, blur };
  }).sort((a, b) => b.z - a.z);

  const dots = PARTICLES.map((p) => {
    const z = depth(frac((6 * t) / LOOP + p.phase));
    const s = F / z;
    return {
      x: cx + (p.x - cam.x) * s,
      y: cy + (p.y - cam.y) * s,
      r: p.size * s * 0.9,
      o: 0.5 * smooth(clamp01((Z_FAR - z) / 900)) * smooth(clamp01((z - Z_NEAR) / 200)),
    };
  });

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, transform: `rotate(${cam.roll}deg)`, transformOrigin: "50% 50%" }}
    >
      {dots.map((d, i) =>
        d.o > 0.005 ? <circle key={`p${i}`} cx={d.x} cy={d.y} r={d.r} fill="#ffffff" opacity={d.o} /> : null,
      )}
      {words.map(({ w, sx, sy, k, opacity, blur }) =>
        showWords && opacity > 0.003 ? (
          <g
            key={w.text}
            opacity={opacity}
            style={{ filter: blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : undefined }}
          >
            <path
              d={w.d}
              fill={NAVY}
              transform={`translate(${sx} ${sy}) scale(${k}) translate(${-(w.x1 + w.width / 2)} ${CAP_HEIGHT / 2})`}
            />
          </g>
        ) : null,
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Fondo dinámico: manchas de luz sobre #4fd3c3 que se mueven en bucle
// ---------------------------------------------------------------------------
const Background: React.FC<{ t: number }> = ({ t }) => {
  const p = (t / LOOP) * TAU;
  const b = (fx: number, fy: number, ax: number, ay: number, bx: number, by: number, ph: number) =>
    `${(bx + ax * Math.sin(fx * p + ph)).toFixed(2)}% ${(by + ay * Math.cos(fy * p + ph)).toFixed(2)}%`;
  const glow = 0.22 + 0.06 * Math.sin(2 * p);
  return (
    <AbsoluteFill style={{ backgroundColor: TEAL }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 55% 60% at ${b(1, 1, 14, 10, 68, 30, 0)}, rgba(138,255,216,0.95) 0%, rgba(138,255,216,0) 70%)`,
            `radial-gradient(ellipse 50% 55% at ${b(1, 2, 12, 12, 28, 72, 2.1)}, rgba(128,250,214,0.8) 0%, rgba(128,250,214,0) 70%)`,
            `radial-gradient(ellipse 45% 50% at ${b(2, 1, 10, 14, 12, 22, 4.2)}, rgba(38,200,210,0.85) 0%, rgba(38,200,210,0) 70%)`,
            `radial-gradient(ellipse 50% 45% at ${b(1, 1, 12, 10, 92, 88, 1.3)}, rgba(34,196,208,0.9) 0%, rgba(34,196,208,0) 70%)`,
          ].join(", "),
        }}
      />
      {/* luz en el punto de fuga: da profundidad al túnel */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(235,255,250,${glow.toFixed(3)}) 0%, rgba(235,255,250,0) 38%)`,
        }}
      />
      {/* viñeta suave */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 85% 85% at 50% 50%, rgba(20,120,130,0) 55%, rgba(20,120,130,0.22) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Grano muy fino y estático: evita las bandas de los degradados al comprimir. */
const Grain: React.FC = () => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay" }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

const BLUR_SAMPLES = 10; // más muestras: a esta velocidad el desenfoque debe ser continuo
const SHUTTER = 0.5; // 180°

export const TunelPalabras: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const dt = SHUTTER / fps;
  return (
    <AbsoluteFill>
      <Background t={t} />
      {/* desenfoque de movimiento propio: muestras periódicas, así el bucle no se rompe */}
      <AbsoluteFill style={{ isolation: "isolate" }}>
        {Array.from({ length: BLUR_SAMPLES }, (_, j) => (
          <AbsoluteFill
            key={j}
            style={{ mixBlendMode: "plus-lighter", filter: `opacity(${1 / BLUR_SAMPLES})` }}
          >
            <Scene t={t - (dt * j) / (BLUR_SAMPLES - 1)} width={width} height={height} />
          </AbsoluteFill>
        ))}
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};

/**
 * Solo el fondo del túnel, para continuar después de la animación.
 * Arranca en el instante exacto en que termina TunelPalabras (DURATION), así
 * que empalma sin salto; y como todo su movimiento es periódico en LOOP
 * segundos, un clip de LOOP segundos se repite en bucle sin costura.
 */
export const TunelFondo: React.FC<{ particulas: boolean }> = ({ particulas }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = DURATION + frame / fps;
  const dt = SHUTTER / fps;
  return (
    <AbsoluteFill>
      <Background t={t} />
      {particulas ? (
        <AbsoluteFill style={{ isolation: "isolate" }}>
          {Array.from({ length: BLUR_SAMPLES }, (_, j) => (
            <AbsoluteFill
              key={j}
              style={{ mixBlendMode: "plus-lighter", filter: `opacity(${1 / BLUR_SAMPLES})` }}
            >
              <Scene t={t - (dt * j) / (BLUR_SAMPLES - 1)} width={width} height={height} showWords={false} />
            </AbsoluteFill>
          ))}
        </AbsoluteFill>
      ) : null}
      <Grain />
    </AbsoluteFill>
  );
};

export const FONDO_LOOP = LOOP;
