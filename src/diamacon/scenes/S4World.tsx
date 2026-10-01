import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  C,
  EASE_CAM,
  EASE_IN,
  EASE_IN_OUT,
  EASE_OUT,
  EASE_SNAP,
  EASE_SOFT,
  FPS,
  LEXEND,
  STIX,
  lerp,
  ramp,
  settled,
} from "../theme";
import { STOPS, WORLD } from "../timeline";
import {
  CELL_X,
  CELL_Y,
  PANEL_H,
  PANEL_W,
  panelCenter,
  restPoint,
  toScreen,
  worldCamera,
} from "../world";
import { Panel } from "../components/Panel";
import { RevealLine } from "../components/Kinetic";
import {
  V1Apuntes,
  V2Punteo,
  V3Importacion,
  V4Impresos,
  V5Comunicacion,
  V6Informes,
} from "../components/Vignettes";
import { CLOSE_GEM } from "./S6Close";

// Escena 4 · Plano secuencia por la aplicación (6 paradas, textos del PDF)
// Escena 5 · «Sin límite»: la cámara se aleja y el mundo se revela infinito;
// todas las ventanas convergen en la gema del cierre.

type StopCopy = {
  eyebrow: string;
  head: string[];
  sub?: string;
  extra?: string;
  chips?: string[];
  title: string;
  tag: React.ReactNode;
  View: React.FC<{ t: number }>;
};

const COPY: StopCopy[] = [
  {
    eyebrow: "01 · Contabilidad",
    head: ["Entrada de", "apuntes", "ultrarrápida"],
    sub: "Sin necesidad de usar el ratón.",
    extra: "Manejo intuitivo, incluso sin conocimientos contables previos.",
    title: "Entrada de apuntes",
    tag: "Diamacon",
    View: V1Apuntes,
  },
  {
    eyebrow: "02 · Conciliación",
    head: ["Punteo", "inteligente"],
    sub: "Automático, manual o asistido.",
    title: "Punteo de cuentas",
    tag: "Mayor",
    View: V2Punteo,
  },
  {
    eyebrow: "03 · Importación",
    head: ["Importación", "directa"],
    sub: "Extractos bancarios (Norma CSB43), hojas Excel y otros formatos.",
    title: "Importación",
    tag: "Contabilización directa",
    View: V3Importacion,
  },
  {
    eyebrow: "04 · Impresos oficiales",
    head: ["Impuestos en", "todas las", "Haciendas"],
    chips: ["AEAT", "Araba", "Gipuzkoa", "Bizkaia", "Navarra"],
    title: "Impresos oficiales",
    tag: "Declaraciones",
    View: V4Impresos,
  },
  {
    eyebrow: "05 · Comunicación con el cliente",
    head: ["Comunicación", "fluida", "y directa"],
    sub: "Entre asesor y cliente, totalmente integrada.",
    title: "Comunicación con el cliente",
    tag: (
      <>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: C.teal,
            display: "inline-block",
          }}
        />{" "}
        En línea
      </>
    ),
    View: V5Comunicacion,
  },
  {
    eyebrow: "06 · Informes",
    head: ["Informes", "automáticos"],
    sub: "Estudio económico-financiero y evolución de resultados.",
    title: "Informes",
    tag: "Excel",
    View: V6Informes,
  },
];

// ---------------------------------------------------------------------------
// Hilo conductor entre ventanas (coordenadas de mundo)
// ---------------------------------------------------------------------------
const PORT = 200;
const threadSeg = (i: number) => {
  const a = panelCenter(i);
  const b = panelCenter(i + 1);
  const down = i % 2 === 0;
  const s = { x: a.x + PORT, y: a.y + (down ? PANEL_H / 2 : -PANEL_H / 2) };
  const e = { x: b.x - PORT, y: b.y + (down ? -PANEL_H / 2 : PANEL_H / 2) };
  const k = down ? 220 : -220;
  return {
    s,
    e,
    d: `M ${s.x} ${s.y} C ${s.x} ${s.y + k}, ${e.x} ${e.y - k}, ${e.x} ${e.y}`,
  };
};
const SEGS = STOPS.slice(0, -1).map((_, i) => threadSeg(i));

// ---------------------------------------------------------------------------
// Muro de ventanas "sin límite" (retícula de ajedrez)
// ---------------------------------------------------------------------------
const OV = { x: 4000, y: 450 };
const LATTICE: { x: number; y: number; d: number; stop: boolean }[] = [];
for (let m = -6; m <= 11; m++) {
  for (let n = -7; n <= 8; n++) {
    if ((((m + n) % 2) + 2) % 2 !== 0) continue;
    const x = m * CELL_X;
    const y = n * CELL_Y;
    const stop = m >= 0 && m < STOPS.length && n === m % 2;
    LATTICE.push({ x, y, d: Math.hypot(x - OV.x, (y - OV.y) * 1.6), stop });
  }
}
const D_MAX = Math.max(...LATTICE.map((l) => l.d));

// Sin «monedas»: Diamacon trabaja solo en euros (indicación del cliente).
const COUNTERS = ["empresas", "usuarios", "ejercicios", "puestos en red"];

const lemniscate = (a: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const u = (i / 96) * Math.PI * 2 + Math.PI / 2;
    const den = 1 + Math.sin(u) ** 2;
    pts.push(
      `${((a * Math.cos(u)) / den).toFixed(2)},${((a * Math.sin(u) * Math.cos(u)) / den).toFixed(2)}`,
    );
  }
  return `M ${pts.join(" L ")}`;
};
const INF_PATH = lemniscate(52);

const group = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const S4World: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const cam = worldCamera(t);
  // En reposo el mundo se dibuja en 2D puro: el texto se rasteriza nítido y quieto
  const flat = Math.abs(cam.rx) < 0.01 && Math.abs(cam.ry) < 0.01;
  const worldFade =
    1 -
    ramp(t, WORLD.convergeStart - 0.3, WORLD.convergeStart + 0.15, EASE_SOFT);

  return (
    <AbsoluteFill>
      {/* ---------------- Mundo 3D ---------------- */}
      {worldFade > 0 ? (
        <AbsoluteFill
          style={{ perspective: flat ? undefined : 1700, opacity: worldFade }}
        >
          <AbsoluteFill
            style={{
              transformOrigin: "960px 540px",
              transform: flat
                ? undefined
                : `rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`,
              transformStyle: flat ? undefined : "preserve-3d",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transformOrigin: "0 0",
                transform: `translate(960px, 540px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`,
              }}
            >
              <Thread t={t} />
              {COPY.map((copy, i) => (
                <Stop key={i} i={i} copy={copy} t={t} />
              ))}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}

      {/* ---------------- Muro infinito + convergencia ---------------- */}
      <Wall t={t} />
    </AbsoluteFill>
  );
};

/** Capa de pantalla de «Sin límite» (velo, titular y contadores). Va fuera del
 *  desenfoque de movimiento: sus degradados harían bandas al sumar subfotogramas. */
export const S4Overlay: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return <Limitless t={t} />;
};

const Thread: React.FC<{ t: number }> = ({ t }) => (
  <svg
    width={14000}
    height={4400}
    viewBox="-2000 -1600 14000 4400"
    style={{
      position: "absolute",
      left: -2000,
      top: -1600,
      overflow: "visible",
    }}
  >
    <defs>
      <filter id="threadGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" />
      </filter>
    </defs>
    {SEGS.map((seg, i) => {
      const moveStart = STOPS[i].rest[1];
      const moveEnd = STOPS[i + 1].rest[0];
      const drawn = ramp(t, moveStart - 1.2, moveStart + 0.2, EASE_IN_OUT);
      const p = ramp(t, moveStart, moveEnd, EASE_CAM);
      const L = 0.16;
      return (
        <g key={i}>
          <path
            d={seg.d}
            fill="none"
            stroke={C.teal}
            strokeOpacity={0.35}
            strokeWidth={4}
            pathLength={1}
            strokeDasharray="1 2"
            strokeDashoffset={1 - drawn}
          />
          {p > 0 && p < 1 ? (
            <>
              <path
                d={seg.d}
                fill="none"
                stroke={C.teal}
                strokeWidth={16}
                pathLength={1}
                strokeDasharray={`${L} 3`}
                strokeDashoffset={L - p * (1 + L)}
                filter="url(#threadGlow)"
              />
              <path
                d={seg.d}
                fill="none"
                stroke={C.white}
                strokeWidth={5}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={`${L} 3`}
                strokeDashoffset={L - p * (1 + L)}
              />
            </>
          ) : null}
          {[seg.s, seg.e].map((pt, j) => (
            <rect
              key={j}
              x={pt.x - 9}
              y={pt.y - 9}
              width={18}
              height={18}
              rx={3}
              fill={C.teal}
              opacity={j === 0 ? drawn : ramp(t, moveEnd - 0.3, moveEnd)}
              transform={`rotate(45 ${pt.x} ${pt.y})`}
            />
          ))}
        </g>
      );
    })}
  </svg>
);

const Stop: React.FC<{ i: number; copy: StopCopy; t: number }> = ({
  i,
  copy,
  t,
}) => {
  const [arrive] = STOPS[i].rest;
  const local = t - arrive;
  const base = i === 0 ? 0.15 : arrive - 0.2;
  const p = panelCenter(i);
  const w = restPoint(i);
  const even = i % 2 === 0;
  const textLeft = even ? w.x - 960 + 150 : w.x - 960 + 1140;
  const contentOpacity = i === 0 ? ramp(t, 0, 0.4) : 1;
  const View = copy.View;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: p.x - PANEL_W / 2,
          top: p.y - PANEL_H / 2,
        }}
      >
        <Panel
          title={copy.title}
          tag={copy.tag}
          contentOpacity={contentOpacity}
        >
          <View t={local} />
        </Panel>
      </div>
      <div
        style={{
          position: "absolute",
          left: textLeft,
          top: w.y - 540,
          width: 660,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: LEXEND,
            fontWeight: 500,
            fontSize: 25,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.teal,
          }}
        >
          <RevealLine t={t} at={base}>
            {copy.eyebrow}
          </RevealLine>
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: LEXEND,
            fontWeight: 600,
            fontSize: 80,
            lineHeight: 1.06,
            letterSpacing: "-0.022em",
            color: C.white,
          }}
        >
          {copy.head.map((line, j) => (
            <RevealLine key={j} t={t} at={base + 0.1 + j * 0.12}>
              {line}
              {j === copy.head.length - 1 ? (
                <span style={{ color: C.teal }}>.</span>
              ) : null}
            </RevealLine>
          ))}
        </div>
        {copy.sub ? (
          <div
            style={{
              marginTop: 30,
              fontFamily: STIX,
              fontSize: 46,
              lineHeight: 1.22,
              color: "rgba(255,255,255,0.9)",
              whiteSpace: "normal",
            }}
          >
            <FadeUp t={t} at={base + 0.5}>
              {copy.sub}
            </FadeUp>
          </div>
        ) : null}
        {copy.chips ? (
          <div
            style={{
              marginTop: 34,
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              maxWidth: 620,
            }}
          >
            {copy.chips.map((c, j) => {
              const a = settled(
                ramp(
                  t,
                  base + 0.55 + j * 0.1,
                  base + 0.95 + j * 0.1,
                  EASE_SNAP,
                ),
              );
              return (
                <div
                  key={c}
                  style={{
                    padding: "12px 26px",
                    borderRadius: 999,
                    border: `2px solid ${C.teal}`,
                    fontFamily: LEXEND,
                    fontWeight: 500,
                    fontSize: 34,
                    color: C.white,
                    opacity: a,
                    transform: `translateY(${(1 - a) * 16}px) scale(${lerp(0.85, 1, a)})`,
                  }}
                >
                  {c}
                </div>
              );
            })}
          </div>
        ) : null}
        {copy.extra ? (
          <div
            style={{
              marginTop: 30,
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <FadeUp t={t} at={base + 0.85}>
              <div
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    background: C.teal,
                    flexShrink: 0,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width={24} height={24} viewBox="0 0 24 24">
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      fill="none"
                      stroke={C.navy}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div
                  style={{
                    fontFamily: LEXEND,
                    fontWeight: 400,
                    fontSize: 32,
                    lineHeight: 1.3,
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {copy.extra}
                </div>
              </div>
            </FadeUp>
          </div>
        ) : null}
      </div>
    </>
  );
};

const FadeUp: React.FC<{
  t: number;
  at: number;
  children: React.ReactNode;
}> = ({ t, at, children }) => {
  const p = settled(ramp(t, at, at + 0.7, EASE_OUT));
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}>
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
const Wall: React.FC<{ t: number }> = ({ t }) => {
  if (t < WORLD.overviewEnd - 0.4) return null;
  const cam = worldCamera(t);
  const conv0 = WORLD.convergeStart;
  return (
    <AbsoluteFill>
      {LATTICE.map((cell, j) => {
        const r = cell.d / D_MAX;
        const appear = cell.stop
          ? ramp(t, conv0 - 0.3, conv0 + 0.15, EASE_SOFT)
          : ramp(
              t,
              WORLD.overviewEnd - 0.35 + r * 1.6,
              WORLD.overviewEnd + 0.2 + r * 1.6,
              EASE_OUT,
            );
        if (appear <= 0) return null;
        const sp = toScreen(cam, cell.x, cell.y);
        const delay = Math.min(
          0.75,
          (Math.hypot(sp.x - CLOSE_GEM.x, sp.y - CLOSE_GEM.y) / 2200) * 0.75,
        );
        const q = ramp(t, conv0 + delay, conv0 + delay + 0.8, EASE_IN);
        if (q >= 1) return null;
        const x = lerp(sp.x, CLOSE_GEM.x, q);
        const y = lerp(sp.y, CLOSE_GEM.y, q);
        const s = cam.s * lerp(lerp(0.7, 1, appear), 0.04, q);
        if (x < -300 || x > 2220 || y < -300 || y > 1380) return null;
        return (
          <div
            key={j}
            style={{
              position: "absolute",
              left: x - PANEL_W / 2,
              top: y - PANEL_H / 2,
              width: PANEL_W,
              height: PANEL_H,
              transform: `scale(${s})`,
              borderRadius: 28,
              background: C.white,
              opacity: appear * (1 - ramp(q, 0.7, 1, EASE_SOFT)) * 0.95,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 76,
                background: "#eef1f6",
                borderBottom: `2px solid ${C.uiLine}`,
              }}
            />
            <div
              style={{
                padding: 40,
                display: "flex",
                flexDirection: "column",
                gap: 28,
              }}
            >
              {[0.9, 0.7, 0.8, 0.55, 0.75].map((w, k) => (
                <div
                  key={k}
                  style={{
                    width: `${w * 100}%`,
                    height: 34,
                    borderRadius: 17,
                    background: k === j % 5 ? C.teal : "#e3e7ef",
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Limitless: React.FC<{ t: number }> = ({ t }) => {
  const t0 = WORLD.limitlessTextIn;
  if (t < t0 - 0.6) return null;
  const scrim =
    ramp(t, t0 - 0.4, t0 + 0.4, EASE_OUT) *
    (1 -
      ramp(t, WORLD.convergeStart - 0.2, WORLD.convergeStart + 0.6, EASE_SOFT));
  const out = ramp(
    t,
    WORLD.convergeStart - 0.3,
    WORLD.convergeStart + 0.2,
    EASE_IN,
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 62% 58% at 50% 50%, rgba(27,30,59,0.97) 0%, rgba(27,30,59,0.9) 55%, rgba(27,30,59,0.35) 100%)`,
          opacity: scrim,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - out,
          transform: `scale(${lerp(1, 0.9, out)})`,
        }}
      >
        <div
          style={{
            fontFamily: LEXEND,
            fontWeight: 600,
            fontSize: 180,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: C.white,
            marginTop: -140,
          }}
        >
          <RevealLine t={t} at={t0}>
            Sin límite<span style={{ color: C.teal }}>.</span>
          </RevealLine>
        </div>
        <div style={{ display: "flex", marginTop: 70 }}>
          {COUNTERS.map((label, i) => {
            const a = t0 + 0.35 + i * 0.08;
            const appear = settled(ramp(t, a, a + 0.5, EASE_OUT));
            const flip = t0 + 2.2 + i * 0.16;
            const count = Math.floor(lerp(1, 9999, ramp(t, a, flip, EASE_IN)));
            const roll = ramp(t, flip, flip + 0.3, EASE_IN);
            const inf = ramp(t, flip + 0.1, flip + 0.75, EASE_IN_OUT);
            return (
              <div
                key={label}
                style={{
                  width: 318,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  opacity: appear,
                  transform: `translateY(${(1 - appear) * 30}px)`,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: 100,
                    width: 300,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: LEXEND,
                      fontWeight: 600,
                      fontSize: 76,
                      color: C.teal,
                      fontVariantNumeric: "tabular-nums",
                      transform: `translateY(${-roll * 100}%)`,
                    }}
                  >
                    {group(count)}
                  </div>
                  {inf > 0 ? (
                    <svg
                      width={300}
                      height={100}
                      viewBox="-150 -50 300 100"
                      style={{ position: "absolute", inset: 0 }}
                    >
                      <path
                        d={INF_PATH}
                        fill="none"
                        stroke={C.teal}
                        strokeWidth={11}
                        strokeLinecap="round"
                        pathLength={1}
                        strokeDasharray="1 2"
                        strokeDashoffset={1 - inf}
                        transform="scale(1.35)"
                      />
                    </svg>
                  ) : null}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: LEXEND,
                    fontWeight: 400,
                    fontSize: 38,
                    color: C.white,
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
