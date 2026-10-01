import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Easing } from "remotion";
import { D, EASE_IN, EASE_IN_OUT, EASE_OUT, FPS, LEXEND, STIX, lerp, ramp } from "../theme";
import { T } from "../timeline";
import { C0, D0, GEM_CENTER_SIZE } from "../world";
import { LINE_W } from "../trama";
import { Trama, revealFlips } from "../components/Trama";
import { GemStrokes } from "../../diamacon/components/Gem";
import { BRANCH_LEFT, BRANCH_RIGHT, GEM_STROKE, INNER, Seg, TOP_EDGE, WINDOW, reverse, segPath, segPoint, subSeg } from "../../diamacon/gem";
import { RevealLine } from "../../diamacon/components/Kinetic";
import { LOCKUP_WIDTH, WM_OFFSET_X, WM_OFFSET_Y, Wordmark } from "../components/Brand";

// Acto 1 · La trama de Diamages se despliega desde el centro y sostiene el gancho
// («Software de gestión y de facturación para despachos.»). Después se repliega
// en el rombo central, del que se dibuja la gema; logotipo + claim; y la gema
// vuelve a abrirse en trama para entrar en el programa.

export const TRI = "M-14 -28L14 0L-14 28Z"; // triángulo del fotograma 0 (= último)

const GK = GEM_CENTER_SIZE / 444; // escala del símbolo centrado
const START = { x: D0.x, y: D0.y, s: C0 }; // cámara: el rombo D0 queda en el centro

// Logotipo horizontal centrado
const SL = 190;
const LOCK_W = SL * LOCKUP_WIDTH;
const LOCK_LEFT = Math.round((1920 - LOCK_W) / 2);
const LOCK_TOP = 318;
const LOCK_GEM = { x: LOCK_LEFT + SL / 2, y: LOCK_TOP + SL / 2 };

const REVEAL_MAX = 1500; // radio que cubre toda la pantalla (esquinas a ~1102 px)
const BAND = 280;

type P = { x: number; y: number };
const mix = (a: P, b: P, p: number): P => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

/** Ventana central de la gema con curvatura 0 (rombo recto) … 1 (arcos del símbolo). */
const windowPath = (curve: number, cx: number, cy: number, k: number) => {
  let d = "";
  WINDOW.forEach((s, i) => {
    const a = segPoint(s, 0);
    const b = segPoint(s, 1);
    const m = segPoint(s, 0.5);
    const ctrl = { x: 2 * m.x - (a.x + b.x) / 2, y: 2 * m.y - (a.y + b.y) / 2 };
    const c = mix({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, ctrl, curve);
    if (i === 0) d += `M${(cx + a.x * k).toFixed(2)} ${(cy + a.y * k).toFixed(2)}`;
    d += `Q${(cx + c.x * k).toFixed(2)} ${(cy + c.y * k).toFixed(2)} ${(cx + b.x * k).toFixed(2)} ${(cy + b.y * k).toFixed(2)}`;
  });
  return d + "Z";
};

const hexMix = (a: string, b: string, p: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, p));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

// Despliegue de la trama: arranque decidido y llegada suave
const EASE_WAVE = Easing.bezier(0.3, 0, 0.25, 1);

// Facetas interiores: cada trazo parte de su extremo más cercano al centro
const INNER_RADIAL = (() => {
  const segs: Seg[] = INNER.map((s) => {
    const a = segPoint(s, 0);
    const b = segPoint(s, 1);
    return Math.hypot(a.x, a.y) <= Math.hypot(b.x, b.y) ? s : reverse(s);
  });
  return segs.map((s) => segPath(s));
})();

// Contorno: dos ramas continuas desde el centro del borde superior hasta el inferior
const branchPath = (segs: Seg[]) => segs.map((s, i) => segPath(s, 1, 0, 0, i === 0)).join(" ");
const OUTLINE_BRANCHES = [
  branchPath([reverse(subSeg(TOP_EDGE, 0, 0.5)), ...BRANCH_LEFT]),
  branchPath([subSeg(TOP_EDGE, 0.5, 1), ...BRANCH_RIGHT]),
];

const Stroke: React.FC<{ d: string; q: number }> = ({ d, q }) =>
  q <= 0.002 ? null : (
    <path
      d={d}
      fill="none"
      stroke={D.navy}
      strokeWidth={GEM_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 2"
      strokeDashoffset={1 - q}
    />
  );

/**
 * Gema que se dibuja (p: 0 → 1) o se recoge (1 → 0) desde el rombo central:
 * primero las facetas, en abanico desde el centro, y después el contorno
 * como dos trazos continuos que se cierran abajo.
 */
const GemRadial: React.FC<{ p: number; x: number; y: number; k: number }> = ({ p, x, y, k }) => {
  const inner = EASE_IN_OUT(Math.max(0, Math.min(1, p / 0.62)));
  const outline = EASE_IN_OUT(Math.max(0, Math.min(1, (p - 0.38) / 0.62)));
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {INNER_RADIAL.map((d, i) => (
        <Stroke key={i} d={d} q={inner} />
      ))}
      {OUTLINE_BRANCHES.map((d, i) => (
        <Stroke key={`o${i}`} d={d} q={outline} />
      ))}
    </g>
  );
};

export const Intro: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t > T.tramaIn[1] + 0.25) return null;

  // --- Trama que se despliega / repliega -------------------------------------
  const rIn = lerp(-BAND, REVEAL_MAX, ramp(t, T.revealIn[0], T.revealIn[1], EASE_WAVE));
  const rOut = lerp(REVEAL_MAX, -BAND, ramp(t, T.revealOut[0], T.revealOut[1], EASE_IN_OUT));
  const rBack = lerp(-BAND, REVEAL_MAX, ramp(t, T.tramaIn[0], T.tramaIn[1], EASE_WAVE));
  const r = t < T.revealOut[0] ? rIn : t < T.tramaIn[0] ? rOut : rBack;
  // a partir del pull-back la trama la dibuja el mundo (misma cámara): aquí se retira
  const tramaOn = r > -BAND + 1 && t < T.pullBack[0];
  const veil =
    ramp(t, T.hookLine1 - 0.4, T.hookLine1 + 0.3, EASE_OUT) * (1 - ramp(t, T.hookOut, T.hookOut + 0.5, EASE_IN));
  const sweep = T.sweeps.map((s) => ramp(t, s, s + 1.4, (x) => x)).find((v) => v > 0 && v < 1) ?? -1;

  // Triángulo del fotograma 0: dispara el despliegue
  const triOut = ramp(t, T.revealIn[0], T.revealIn[0] + 0.45, EASE_IN);

  // --- Rombo central → gema ---------------------------------------------------
  const winIn = ramp(t, T.revealOut[0] - 0.1, T.revealOut[0] + 0.1);
  const toGem = ramp(t, T.revealOut[1] - 0.25, T.gemDraw[0] + 0.2, EASE_IN_OUT); // blanco fino → navy del símbolo
  const draw = ramp(t, T.gemDraw[0], T.gemDraw[1], (x) => x);
  const toLock = ramp(t, T.toLock[0], T.toLock[1], EASE_IN_OUT);
  const back = ramp(t, T.toCenter[0], T.toCenter[1], EASE_IN_OUT);
  const center = mix(mix({ x: 960, y: 540 }, LOCK_GEM, toLock), { x: 960, y: 540 }, back);
  const k = lerp(lerp(GK, SL / 444, toLock), GK, back);
  const retract = ramp(t, T.facetsOut[0], T.facetsOut[1], (x) => x);
  const straight = ramp(t, T.straighten[0], T.straighten[1], EASE_IN_OUT);
  const curve = t < T.toCenter[0] ? toGem : 1 - straight;
  const winColor = t < T.toCenter[0] ? hexMix(D.white, D.navy, toGem) : hexMix(D.navy, D.white, straight);
  const winWidth =
    t < T.toCenter[0] ? lerp(LINE_W * C0, GEM_STROKE * k, toGem) : lerp(GEM_STROKE * k, LINE_W * C0, straight);
  // el rombo blanco se funde con la trama ya desplegada
  const winOut = ramp(t, T.tramaIn[0] + 0.55, T.tramaIn[0] + 0.85);
  const gemP = t < T.toCenter[0] ? draw : 1 - retract;
  const glint =
    [T.gemGlint1, T.gemGlint2].map((s) => ramp(t, s, s + 0.7, (x) => x)).find((v) => v > 0 && v < 1) ?? -1;
  const claimUnder = ramp(t, T.claimAt + 0.8, T.claimAt + 1.4, EASE_OUT) * (1 - ramp(t, T.claimOut, T.claimOut + 0.35, EASE_IN));
  const hookUnder = ramp(t, T.hookSub + 0.5, T.hookSub + 1.1, EASE_OUT) * (1 - ramp(t, T.hookOut, T.hookOut + 0.35, EASE_IN));

  return (
    <AbsoluteFill>
      {tramaOn ? (
        <Trama
          cam={START}
          reveal={r}
          flips={revealFlips(START, r, BAND)}
          sweep={sweep}
          veils={veil > 0 ? [{ axis: "y", a0: 300, a1: 790, amount: 0.8 * veil }] : []}
        />
      ) : null}

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {triOut < 1 ? (
          <path d={TRI} fill={D.navy} opacity={1 - triOut} transform={`translate(960 540) scale(${1 + triOut * 1.6})`} />
        ) : null}
        {winIn > 0 && winOut < 1 ? (
          <g opacity={1 - winOut}>
            {gemP > 0 ? (
              gemP >= 1 && glint > 0 ? (
                <GemStrokes transform={`translate(${center.x} ${center.y}) scale(${k})`} color={D.navy} glint={glint} />
              ) : (
                <GemRadial p={gemP} x={center.x} y={center.y} k={k} />
              )
            ) : null}
            <path
              d={windowPath(curve, center.x, center.y, k)}
              fill="none"
              stroke={winColor}
              strokeWidth={winWidth}
              strokeLinejoin="round"
              opacity={winIn}
            />
          </g>
        ) : null}
      </svg>

      {/* Gancho, centrado sobre la franja serena de la trama */}
      {t < T.hookOut + 0.8 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", color: D.navy }}>
          <div style={{ fontFamily: LEXEND, fontWeight: 600, fontSize: 124, lineHeight: 1.1, letterSpacing: "-0.03em", textAlign: "center" }}>
            <RevealLine t={t} at={T.hookLine1} out={T.hookOut} exit="down">
              Software de gestión
            </RevealLine>
            <RevealLine t={t} at={T.hookLine2} out={T.hookOut + 0.05} exit="down">
              y de facturación
            </RevealLine>
          </div>
          <div style={{ marginTop: 10, position: "relative", fontFamily: STIX, fontStyle: "italic", fontWeight: 500, fontSize: 112, lineHeight: 1.1 }}>
            <div
              style={{
                position: "absolute",
                left: -6,
                right: -10,
                bottom: 20,
                height: 24,
                background: D.white,
                transformOrigin: "0 50%",
                transform: `scaleX(${hookUnder})`,
              }}
            />
            <div style={{ position: "relative" }}>
              <RevealLine t={t} at={T.hookSub} out={T.hookOut + 0.1} exit="down">
                para despachos.
              </RevealLine>
            </div>
          </div>
        </div>
      ) : null}

      {/* logotipo y claim */}
      {t > T.wordAt - 0.1 && t < T.claimOut + 0.8 ? (
        <>
          <Wordmark
            size={SL}
            t={t}
            at={T.wordAt}
            out={T.claimOut}
            style={{ position: "absolute", left: LOCK_LEFT + SL * WM_OFFSET_X, top: LOCK_TOP + SL * WM_OFFSET_Y }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 612,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily: STIX,
              fontSize: 60,
              lineHeight: 1.22,
              color: D.navy,
            }}
          >
            <RevealLine t={t} at={T.claimAt} out={T.claimOut} exit="down">
              Facturación y control de la gestión,
            </RevealLine>
            <div style={{ position: "relative", fontStyle: "italic", fontWeight: 500 }}>
              <div
                style={{
                  position: "absolute",
                  left: -6,
                  right: -6,
                  bottom: 10,
                  height: 16,
                  background: D.white,
                  transformOrigin: "0 50%",
                  transform: `scaleX(${claimUnder})`,
                }}
              />
              <div style={{ position: "relative" }}>
                <RevealLine t={t} at={T.claimAt + 0.14} out={T.claimOut + 0.05} exit="down">
                  más rápido y sencillo.
                </RevealLine>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
