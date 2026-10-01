import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { D, EASE_IN, EASE_OUT, FPS, ramp, sec, settled } from "./theme";
import { STOPS, T } from "./timeline";
import { cameraMoving } from "./world";
import { Lockup } from "./components/Brand";
import { Intro } from "./scenes/Intro";
import { WorldScene } from "./scenes/World";
import { DiamaconOverlay, GiroOverlay } from "./scenes/Overviews";
import { UsersOverlay } from "./scenes/Users";
import { Close } from "./scenes/Close";

// Diamages · Accountex — loop de stand, 1920×1080, 60 fps, 101 s, sin audio.
// Protagonistas: la gestión del despacho (01–03) y la facturación (04–06),
// unidas por el enlace tarea → factura; Diamacon aparece como conexión final.
// Cada escena se solapa con la siguiente: nunca hay corte seco.

const span = (a: number, b: number) => ({ from: sec(a), durationInFrames: sec(b) - sec(a) });

const BLUR_SAMPLES = 6;

/** Desenfoque de movimiento de cámara (obturador 180°) solo mientras la cámara va rápida. */
const WorldBlur: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useCurrentFrame() / FPS + T.worldStart;
  return (
    <CameraMotionBlur shutterAngle={180} samples={cameraMoving(t) ? BLUR_SAMPLES : 1}>
      {children}
    </CameraMotionBlur>
  );
};

/** Firma persistente durante el recorrido por el programa. */
const BrandBug: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const inT = STOPS.g1[0] + 0.6;
  const outT = STOPS.users[0] - 0.8;
  const o = settled(ramp(t, inT, inT + 0.6, EASE_OUT)) * (1 - ramp(t, outT, outT + 0.5, EASE_IN));
  if (o <= 0) return null;
  return (
    <Lockup
      size={44}
      t={100}
      wordAt={0}
      style={{ position: "absolute", left: 60, top: 46, opacity: o, transform: `translateY(${(1 - o) * -12}px)` }}
    />
  );
};

export const DiamagesAccountex: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: D.teal }}>
    <Sequence {...span(T.worldStart, T.worldEnd)} name="Mundo · trama y plano secuencia">
      <WorldBlur>
        <WorldScene />
      </WorldBlur>
      <GiroOverlay />
      <DiamaconOverlay />
      <UsersOverlay />
    </Sequence>
    <Sequence {...span(0, T.tramaIn[1] + 0.3)} name="Gancho · gema · claim">
      <Intro />
    </Sequence>
    <Sequence {...span(T.converge[0], T.end)} name="Convergencia · claim · CTA">
      <Close />
    </Sequence>
    <BrandBug />
  </AbsoluteFill>
);
