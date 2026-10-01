import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { D } from "./theme";
import { DgIcon, Lockup } from "./components/Brand";
import { Trama } from "./components/Trama";
import { WORDMARK } from "./brandPaths";

// Composición de control: compara logotipo, icono y trama reconstruidos con los originales.
const S = WORDMARK.symbolPx;

export const DiamagesBrandTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: D.white }}>
    {/* original arriba, reconstrucción abajo y diferencia a la derecha */}
    <Img src={staticFile("brand/diamages/ref-lockup.png")} style={{ position: "absolute", left: 0, top: 0 }} />
    <div style={{ position: "absolute", left: 0, top: 380, width: 1128, height: 364, background: D.teal }}>
      <Lockup size={S} t={10} wordAt={0} style={{ position: "absolute", left: 89, top: 87 }} />
    </div>
    <div style={{ position: "absolute", left: 0, top: 760, width: 1128, height: 364 }}>
      <Img src={staticFile("brand/diamages/ref-lockup.png")} style={{ position: "absolute", left: 0, top: 0 }} />
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "difference" }}>
        <Lockup size={S} t={10} wordAt={0} color="#ffffff" style={{ position: "absolute", left: 89, top: 87 }} />
      </div>
    </div>
    <Img src={staticFile("brand/diamages/ref-icon.png")} style={{ position: "absolute", left: 1180, top: 0, width: 417 }} />
    <DgIcon size={397} style={{ position: "absolute", left: 1190, top: 440 }} />
    <div style={{ position: "absolute", left: 1180, top: 860, width: 700, height: 240, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -1180, top: -860, width: 1920, height: 1200 }}>
        <Trama cam={{ x: 960, y: 540, s: 1 }} />
      </div>
    </div>
  </AbsoluteFill>
);
