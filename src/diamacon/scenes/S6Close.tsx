import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import QRCode from "qrcode";
import {
  C,
  EASE_IN,
  EASE_IN_OUT,
  EASE_OUT,
  EASE_SNAP,
  EASE_SOFT,
  FPS,
  HEIGHT,
  LEXEND,
  STIX,
  WIDTH,
  lerp,
  ramp,
  settled,
} from "../theme";
import { GEM_BOX_UNITS, GemStrokes } from "../components/Gem";
import { GEM_BOX, Wordmark } from "../components/Lockup";
import { RevealLine } from "../components/Kinetic";

// Escena 6 · Cierre: todo converge en la gema → claim del PDF → llamada a la
// acción con QR → retorno al punto inicial para que el loop sea invisible.

export const CLOSE_GEM = { x: 420, y: 540, box: 330 };

const S_END = 150;
const END_LEFT = 170;
const END_TOP = 250;
const END_BOX = S_END * GEM_BOX;
const END_CENTER = {
  x: END_LEFT - 0.017 * S_END + END_BOX / 2,
  y: END_TOP - 0.016 * S_END + END_BOX / 2,
};

const QR_URL = "https://www.comeralia.com";
const QR = QRCode.create(QR_URL, { errorCorrectionLevel: "M" });
const QN = QR.modules.size;
const QR_CARD = 420;
const QR_LEFT = 1330;
const QR_TOP = 250;

const OUT = 13.3; // salida hacia el loop
export const CLOSE_DURATION = 14.6;

const gemState = (t: number) => {
  const toLock = ramp(t, 5.55, 6.45, EASE_IN_OUT);
  const toDot = ramp(t, OUT + 0.2, CLOSE_DURATION - 0.1, EASE_IN_OUT);
  let x = lerp(CLOSE_GEM.x, END_CENTER.x, toLock);
  let y = lerp(CLOSE_GEM.y, END_CENTER.y, toLock);
  let box = lerp(CLOSE_GEM.box, END_BOX, toLock);
  x = lerp(x, 960, toDot);
  y = lerp(y, 540, toDot);
  box = lerp(box, 40, toDot);
  return { x, y, box };
};

export const S6Close: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const g = gemState(t);
  const k = g.box / GEM_BOX_UNITS;

  const undraw = ramp(t, OUT + 0.25, OUT + 0.9, EASE_IN);
  const top = ramp(t, 0.0, 0.4, EASE_OUT) * (1 - undraw);
  const outline = ramp(t, 0.1, 1.0, EASE_IN_OUT) * (1 - undraw);
  const inner =
    ramp(t, 0.45, 1.35, EASE_SOFT) *
    (1 - ramp(t, OUT + 0.1, OUT + 0.6, EASE_IN));
  const glintA = ramp(t, 1.4, 2.1, (x) => x);
  const glintB = ramp(t, 9.2, 9.9, (x) => x);
  const glintC = ramp(t, 11.8, 12.5, (x) => x);
  const glint = [glintA, glintB, glintC].find((v) => v > 0 && v < 1) ?? -1;
  const glow = ramp(t, 0.6, 1.4) * (1 - undraw);
  const dot = ramp(t, CLOSE_DURATION - 0.45, CLOSE_DURATION - 0.1, EASE_OUT);

  const endOut = (d = 0) => ramp(t, OUT + d, OUT + d + 0.45, EASE_IN);
  const qrIn = settled(ramp(t, 6.4, 7.0, EASE_OUT));
  const qrOut = endOut(0.05);
  const bob = Math.sin(((t - 6.8) / 1.3) * Math.PI * 2);

  return (
    <AbsoluteFill>
      {/* Gema */}
      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{
          position: "absolute",
          inset: 0,
          filter:
            glow > 0.01
              ? `drop-shadow(0 0 ${14 * glow}px ${C.tealGlow})`
              : undefined,
        }}
      >
        <GemStrokes
          transform={`translate(${g.x} ${g.y}) scale(${k})`}
          top={top}
          outline={outline}
          inner={inner}
          glint={glint}
        />
      </svg>

      {/* Punto final = primer fotograma del loop */}
      {dot > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 953,
            top: 533,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: C.teal,
            boxShadow: `0 0 24px ${C.tealGlow}`,
            transform: `scale(${dot})`,
          }}
        />
      ) : null}

      {/* Claim final (PDF, pág. 3) */}
      <div
        style={{
          position: "absolute",
          left: 660,
          top: 372,
          fontFamily: LEXEND,
          fontWeight: 600,
          fontSize: 92,
          lineHeight: 1.12,
          letterSpacing: "-0.022em",
          color: C.white,
        }}
      >
        <RevealLine t={t} at={0.8} out={5.45}>
          Impulsa la <span style={{ color: C.teal }}>eficiencia</span>
        </RevealLine>
        <RevealLine t={t} at={0.95} out={5.51}>
          y el <span style={{ color: C.teal }}>control</span>
        </RevealLine>
        <RevealLine t={t} at={1.1} out={5.57}>
          de tu despacho.
        </RevealLine>
      </div>

      {/* ---------------- Tarjeta final ---------------- */}
      <Wordmark
        size={S_END}
        t={t}
        at={6.1}
        out={OUT}
        style={{
          position: "absolute",
          left: END_LEFT + 1.178 * S_END,
          top: END_TOP + 0.1675 * S_END,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: END_LEFT,
          top: 468,
          height: 2,
          width: 900 * ramp(t, 6.2, 6.9, EASE_OUT) * (1 - endOut()),
          background: "rgba(79,211,195,0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: END_LEFT,
          top: 506,
          display: "flex",
          alignItems: "center",
          gap: 30,
        }}
      >
        <div
          style={{
            fontFamily: LEXEND,
            fontWeight: 600,
            fontSize: 100,
            lineHeight: 1,
            letterSpacing: "-0.025em",
            color: C.white,
          }}
        >
          <RevealLine t={t} at={6.3} out={OUT} exit="down">
            Pide tu demo <span style={{ color: C.teal }}>aquí</span>
          </RevealLine>
        </div>
        <ArrowDown
          t={t}
          bob={bob}
          show={ramp(t, 6.8, 7.2, EASE_SNAP) * (1 - endOut())}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: END_LEFT,
          top: 650,
          fontFamily: STIX,
          fontSize: 46,
          lineHeight: 1.25,
          color: "rgba(255,255,255,0.9)",
        }}
      >
        <RevealLine t={t} at={6.6} out={OUT + 0.05} exit="down">
          Un único programa, integrado y sin módulos adicionales.
        </RevealLine>
      </div>

      {/* Comeralia */}
      <div
        style={{
          position: "absolute",
          left: END_LEFT,
          top: 860,
          display: "flex",
          alignItems: "center",
          gap: 34,
          opacity: ramp(t, 7.2, 7.8, EASE_OUT) * (1 - endOut(0.1)),
          transform: `translateY(${(1 - settled(ramp(t, 7.2, 7.8, EASE_OUT))) * 16}px)`,
        }}
      >
        <Img
          src={staticFile("brand/comeralia-white.png")}
          style={{ height: 52 }}
        />
        <div
          style={{ width: 2, height: 60, background: "rgba(255,255,255,0.35)" }}
        />
        <div
          style={{
            fontFamily: STIX,
            fontSize: 36,
            lineHeight: 1.15,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Software de gestión
          <br />
          para profesionales.
        </div>
      </div>

      {/* QR */}
      <div
        style={{
          position: "absolute",
          left: QR_LEFT,
          top: QR_TOP,
          width: QR_CARD,
          height: QR_CARD,
          borderRadius: 36,
          background: C.white,
          boxShadow: `0 30px 80px rgba(5,8,25,0.45), 0 0 0 ${lerp(0, 10, 0.5 + 0.5 * bob) * qrIn}px rgba(79,211,195,0.12)`,
          opacity: qrIn * (1 - qrOut),
          transform: `translateY(${(1 - qrIn) * 30}px) scale(${lerp(0.92, 1, qrIn) * (1 - qrOut)})`,
        }}
      >
        <QrModules t={t} />
      </div>
      <div
        style={{
          position: "absolute",
          left: QR_LEFT,
          width: QR_CARD,
          top: 704,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: LEXEND,
            fontWeight: 500,
            fontSize: 46,
            color: C.white,
          }}
        >
          <RevealLine t={t} at={7.0} out={OUT} exit="down">
            comeralia.com
          </RevealLine>
        </div>
        <div
          style={{
            fontFamily: STIX,
            fontStyle: "italic",
            fontSize: 36,
            color: C.teal,
          }}
        >
          <RevealLine t={t} at={7.15} out={OUT} exit="down">
            Escanea para saber más
          </RevealLine>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ArrowDown: React.FC<{ bob: number; show: number; t: number }> = ({
  bob,
  show,
  t,
}) => {
  // anillo que se expande hacia fuera (luz, no desplazamiento): llama la atención sin temblar
  const ring = t < 6.8 ? 0 : ((t - 6.8) / 1.3) % 1;
  return (
    <div
      style={{
        position: "relative",
        width: 88,
        height: 88,
        transform: `scale(${show})`,
        opacity: show,
      }}
    >
      <svg
        width={200}
        height={200}
        viewBox="-100 -100 200 200"
        style={{
          position: "absolute",
          left: -56,
          top: -56,
          overflow: "visible",
        }}
      >
        <circle
          r={44 + 40 * ring}
          fill="none"
          stroke={C.teal}
          strokeWidth={3}
          opacity={(1 - ring) * 0.8}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 44,
          background: C.teal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 ${24 + 12 * bob}px ${C.tealGlow}`,
        }}
      >
        <svg width={44} height={44} viewBox="0 0 24 24">
          <path
            d="M12 4v15M5.5 12.5L12 19l6.5-6.5"
            fill="none"
            stroke={C.navy}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

const QrModules: React.FC<{ t: number }> = ({ t }) => {
  const quiet = 3;
  const cell = QR_CARD / (QN + quiet * 2);
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < QN; r++) {
    for (let c = 0; c < QN; c++) {
      if (!QR.modules.get(r, c)) continue;
      const d = (r + c) / (2 * QN);
      const p = ramp(t, 6.7 + d * 0.85, 6.7 + d * 0.85 + 0.2, EASE_OUT);
      if (p <= 0) continue;
      const s = cell * lerp(0.2, 1, p);
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={(c + quiet) * cell + (cell - s) / 2}
          y={(r + quiet) * cell + (cell - s) / 2}
          width={s + 0.5}
          height={s + 0.5}
          fill={C.navy}
        />,
      );
    }
  }
  return (
    <svg
      width={QR_CARD}
      height={QR_CARD}
      style={{ position: "absolute", inset: 0 }}
      shapeRendering="crispEdges"
    >
      {rects}
    </svg>
  );
};
