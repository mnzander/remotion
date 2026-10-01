import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "./theme";
import { Lockup } from "./components/Lockup";
import { AppIcon } from "./components/AppIcon";

// Composición de control: compara el logotipo reconstruido con el original.
const S = 191;

export const BrandTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.navy }}>
    <Img
      src={staticFile("brand/ref-diamacon-lockup.png")}
      style={{ position: "absolute", left: 100, top: 0 }}
    />
    <div style={{ position: "absolute", left: 187, top: 380 + 90 }}>
      <Lockup size={S} t={10} wordAt={0} />
    </div>
    <Img
      src={staticFile("brand/ref-diamacon-lockup.png")}
      style={{ position: "absolute", left: 100, top: 760 }}
    />
    <div
      style={{
        position: "absolute",
        left: 187,
        top: 760 + 90,
        mixBlendMode: "difference",
      }}
    >
      <Lockup size={S} t={10} wordAt={0} />
    </div>
    <Img
      src={staticFile("brand/ref-diamacon-icon.png")}
      style={{ position: "absolute", left: 1400, top: 40, width: 417 }}
    />
    <AppIcon
      size={397}
      style={{ position: "absolute", left: 1410, top: 520 }}
    />
  </AbsoluteFill>
);
