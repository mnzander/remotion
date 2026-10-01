import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { FPS, sec } from "./theme";
import { SCENES } from "./timeline";
import { worldIsMoving } from "./world";
import { Backdrop } from "./components/Backdrop";
import { BrandBug } from "./components/BrandBug";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo, ZOOM_START } from "./scenes/S2Logo";
import { S3Unico } from "./scenes/S3Unico";
import { S4Overlay, S4World } from "./scenes/S4World";
import { S6Close } from "./scenes/S6Close";

// Diamacon · Accountex — loop de stand, 1920×1080, 92 s, sin audio.
// Cada escena se solapa con la siguiente: las transiciones heredan geometría
// (match cut, portal, morph, plano secuencia, convergencia), nunca hay corte seco.

const scene = (s: { start: number; end: number }) => ({
  from: sec(s.start),
  durationInFrames: sec(s.end) - sec(s.start),
});

const BLUR_SAMPLES = 6;

/** Desenfoque de movimiento de cámara (obturador 180°) solo mientras `active`. */
const Blur: React.FC<{
  active: (t: number) => boolean;
  children: React.ReactNode;
}> = ({ active, children }) => {
  const t = useCurrentFrame() / FPS;
  return (
    <CameraMotionBlur shutterAngle={180} samples={active(t) ? BLUR_SAMPLES : 1}>
      {children}
    </CameraMotionBlur>
  );
};

export const DiamaconAccountex: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <Sequence {...scene(SCENES.hook)} name="1 · Gancho">
      <S1Hook />
    </Sequence>
    <Sequence {...scene(SCENES.logo)} name="2 · Logotipo">
      <Blur active={(t) => t > ZOOM_START + 0.45}>
        <S2Logo />
      </Blur>
    </Sequence>
    <Sequence {...scene(SCENES.unico)} name="3 · Un único programa">
      <S3Unico />
    </Sequence>
    <Sequence
      {...scene(SCENES.world)}
      name="4-5 · Plano secuencia + Sin límite"
    >
      <Blur active={worldIsMoving}>
        <S4World />
      </Blur>
      <S4Overlay />
    </Sequence>
    <Sequence {...scene(SCENES.close)} name="6 · Cierre + CTA">
      <S6Close />
    </Sequence>
    <BrandBug />
  </AbsoluteFill>
);
