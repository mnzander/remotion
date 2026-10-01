import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import QRCode from "qrcode";
import { D, EASE_IN, EASE_IN_OUT, EASE_OUT, EASE_SNAP, FPS, LEXEND, STIX, lerp, ramp, settled } from "../theme";
import { T } from "../timeline";
import { GemStrokes } from "../../diamacon/components/Gem";
import { RevealLine } from "../../diamacon/components/Kinetic";
import { WM_OFFSET_X, WM_OFFSET_Y, Wordmark } from "../components/Brand";
import { CONVERGE_ARRIVE, GEM_K } from "./Users";
import { TRI } from "./Intro";

// Acto 4 · la gema recibe los triángulos de la trama → claim final → llamada a
// la acción con QR → la gema se pliega en el triángulo del fotograma 0.

const CLAIM_GEM = { x: 440, y: 540, k: 330 / 444 };
const S_END = 150;
const END_LEFT = 170;
const END_TOP = 236;
const END_GEM = { x: END_LEFT + S_END / 2, y: END_TOP + S_END / 2, k: S_END / 444 };

const QR_URL = "https://www.comeralia.com";
const QR = QRCode.create(QR_URL, { errorCorrectionLevel: "M" });
const QN = QR.modules.size;
const QR_CARD = 420;
const QR_LEFT = 1330;
const QR_TOP = 236;

const CTA = T.ctaAt; // 92,0
const OUT = T.loopOut; // 99,6
const at = (d: number) => CTA + d;

const gemState = (t: number) => {
  const toClaim = ramp(t, T.claimFinal, T.claimFinal + 0.7, EASE_IN_OUT);
  const toLock = ramp(t, at(0), at(0.9), EASE_IN_OUT);
  const toTri = ramp(t, OUT + 0.2, T.end - 0.2, EASE_IN_OUT);
  let x = lerp(960, CLAIM_GEM.x, toClaim);
  let y = lerp(540, CLAIM_GEM.y, toClaim);
  let k = lerp(GEM_K, CLAIM_GEM.k, toClaim);
  x = lerp(x, END_GEM.x, toLock);
  y = lerp(y, END_GEM.y, toLock);
  k = lerp(k, END_GEM.k, toLock);
  x = lerp(x, 960, toTri);
  y = lerp(y, 540, toTri);
  k = lerp(k, 0.1, toTri);
  return { x, y, k };
};

export const Close: React.FC = () => {
  const t = useCurrentFrame() / FPS + T.converge[0];
  const g = gemState(t);

  // la gema se completa a medida que llegan los triángulos (convergencia)
  const first = CONVERGE_ARRIVE(0);
  const last = CONVERGE_ARRIVE(1);
  const undraw = ramp(t, OUT + 0.25, OUT + 0.85, EASE_IN);
  const outline = ramp(t, first - 0.1, last, EASE_IN_OUT) * (1 - undraw);
  const inner = ramp(t, first + 0.1, last + 0.1, EASE_IN_OUT) * (1 - ramp(t, OUT + 0.15, OUT + 0.7, EASE_IN));
  const glint = [T.claimFinal + 0.4, T.claimFinal + 2.4, T.claimFinal + 4.2, at(3.4), at(6.2)].map((s) => ramp(t, s, s + 0.7, (x) => x)).find((v) => v > 0 && v < 1) ?? -1;
  const tri = ramp(t, T.end - 0.6, T.end - 0.15, EASE_OUT);

  const endOut = (d = 0) => ramp(t, OUT + d, OUT + d + 0.45, EASE_IN);
  const qrIn = settled(ramp(t, at(0.8), at(1.4), EASE_OUT));
  const qrOut = endOut(0.05);
  const bob = Math.sin(((t - at(1.2)) / 1.3) * Math.PI * 2);
  const conectaLine = ramp(t, T.claimFinal + 1.3, T.claimFinal + 1.9, EASE_OUT) * (1 - ramp(t, T.claimFinalOut, T.claimFinalOut + 0.3, EASE_IN));

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <GemStrokes
          transform={`translate(${g.x} ${g.y}) scale(${g.k})`}
          top={outline}
          outline={outline}
          inner={inner}
          color={D.navy}
          glint={glint}
        />
        {/* triángulo final = fotograma 0 del loop */}
        {tri > 0 ? <path d={TRI} fill={D.navy} transform={`translate(960 540) scale(${tri})`} /> : null}
      </svg>

      {/* Claim final (PDF, pág. 5: «Otras características») */}
      <div
        style={{
          position: "absolute",
          left: 760,
          top: 0,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          fontFamily: LEXEND,
          fontWeight: 600,
          fontSize: 80,
          lineHeight: 1.1,
          letterSpacing: "-0.024em",
          color: D.navy,
        }}
      >
        <RevealLine t={t} at={T.claimFinal + 0.25} out={T.claimFinalOut} exit="down">
          Un verdadero software
        </RevealLine>
        <RevealLine t={t} at={T.claimFinal + 0.37} out={T.claimFinalOut + 0.04} exit="down">
          de gestión que{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span
              style={{
                position: "absolute",
                left: -4,
                right: -4,
                bottom: 8,
                height: 20,
                background: D.white,
                transformOrigin: "0 50%",
                transform: `scaleX(${conectaLine})`,
              }}
            />
            <span style={{ position: "relative" }}>conecta</span>
          </span>
        </RevealLine>
        <RevealLine t={t} at={T.claimFinal + 0.49} out={T.claimFinalOut + 0.08} exit="down">
          todas las áreas
        </RevealLine>
        <RevealLine t={t} at={T.claimFinal + 0.61} out={T.claimFinalOut + 0.12} exit="down">
          del negocio.
        </RevealLine>
      </div>

      {/* ---------------- Tarjeta final ---------------- */}
      <Wordmark
        size={S_END}
        t={t}
        at={at(0.5)}
        out={OUT}
        style={{ position: "absolute", left: END_LEFT + S_END * WM_OFFSET_X, top: END_TOP + S_END * WM_OFFSET_Y }}
      />
      <div
        style={{
          position: "absolute",
          left: END_LEFT,
          top: 452,
          height: 3,
          width: 980 * ramp(t, at(0.6), at(1.3), EASE_OUT) * (1 - endOut()),
          background: "rgba(27,30,59,0.35)",
        }}
      />
      <div style={{ position: "absolute", left: END_LEFT, top: 494, display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ fontFamily: LEXEND, fontWeight: 600, fontSize: 100, lineHeight: 1, letterSpacing: "-0.025em", color: D.navy }}>
          <RevealLine t={t} at={at(0.7)} out={OUT} exit="down">
            Pide tu demo aquí
          </RevealLine>
        </div>
        <ArrowDown t={t} bob={bob} show={ramp(t, at(1.2), at(1.6), EASE_SNAP) * (1 - endOut())} />
      </div>
      <div style={{ position: "absolute", left: END_LEFT, top: 636, fontFamily: STIX, fontSize: 52, lineHeight: 1.25, color: D.navy }}>
        <RevealLine t={t} at={at(1.0)} out={OUT + 0.05} exit="down">
          Crece contigo sin restricciones.
        </RevealLine>
      </div>

      {/* Comeralia */}
      <div
        style={{
          position: "absolute",
          left: END_LEFT,
          top: 850,
          display: "flex",
          alignItems: "center",
          gap: 34,
          opacity: ramp(t, at(1.6), at(2.2), EASE_OUT) * (1 - endOut(0.1)),
          transform: `translateY(${(1 - settled(ramp(t, at(1.6), at(2.2), EASE_OUT))) * 16}px)`,
        }}
      >
        <Img src={staticFile("brand/comeralia-navy.png")} style={{ height: 52 }} />
        <div style={{ width: 2, height: 60, background: "rgba(27,30,59,0.35)" }} />
        <div style={{ fontFamily: STIX, fontSize: 36, lineHeight: 1.15, color: D.navy }}>
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
          background: D.white,
          boxShadow: `0 30px 70px rgba(27,30,59,0.22), 0 0 0 ${lerp(0, 12, 0.5 + 0.5 * bob) * qrIn}px rgba(255,255,255,0.35)`,
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
          top: 690,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          color: D.navy,
        }}
      >
        <div style={{ fontFamily: LEXEND, fontWeight: 500, fontSize: 46 }}>
          <RevealLine t={t} at={at(1.4)} out={OUT} exit="down">
            comeralia.com
          </RevealLine>
        </div>
        <div style={{ fontFamily: STIX, fontStyle: "italic", fontSize: 36 }}>
          <RevealLine t={t} at={at(1.55)} out={OUT} exit="down">
            Escanea para saber más
          </RevealLine>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ArrowDown: React.FC<{ bob: number; show: number; t: number }> = ({ bob, show, t }) => {
  // anillo que se expande (luz, no desplazamiento): llama la atención sin mover el texto
  const ring = t < at(1.2) ? 0 : ((t - at(1.2)) / 1.3) % 1;
  return (
    <div style={{ position: "relative", width: 88, height: 88, transform: `scale(${show})`, opacity: show }}>
      <svg width={200} height={200} viewBox="-100 -100 200 200" style={{ position: "absolute", left: -56, top: -56, overflow: "visible" }}>
        <circle r={44 + 40 * ring} fill="none" stroke={D.navy} strokeWidth={3} opacity={(1 - ring) * 0.6} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 44,
          background: D.navy,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 0 ${4 + 3 * bob}px rgba(255,255,255,0.45)`,
        }}
      >
        <svg width={44} height={44} viewBox="0 0 24 24">
          <path d="M12 4v15M5.5 12.5L12 19l6.5-6.5" fill="none" stroke={D.white} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
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
      const p = ramp(t, at(1.1) + d * 0.85, at(1.1) + d * 0.85 + 0.2, EASE_OUT);
      if (p <= 0) continue;
      const s = cell * lerp(0.2, 1, p);
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={(c + quiet) * cell + (cell - s) / 2}
          y={(r + quiet) * cell + (cell - s) / 2}
          width={s + 0.5}
          height={s + 0.5}
          fill={D.navy}
        />,
      );
    }
  }
  return (
    <svg width={QR_CARD} height={QR_CARD} style={{ position: "absolute", inset: 0 }} shapeRendering="crispEdges">
      {rects}
    </svg>
  );
};
