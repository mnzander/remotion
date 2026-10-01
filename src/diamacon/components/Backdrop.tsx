import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, DURATION_SECONDS, EASE_SOFT, FPS, ramp } from "../theme";
import { SCENES } from "../timeline";
import { backdropPattern } from "../world";
import { Pattern } from "./Pattern";

/** Fondo global: navy con luz central y teselado de marca (tenue) que sigue a la cámara. */
export const Backdrop: React.FC = () => {
  const gt = useCurrentFrame() / FPS;
  const pat = backdropPattern(gt);
  const on =
    ramp(gt, SCENES.logo.end - 0.1, SCENES.logo.end + 0.6, EASE_SOFT) *
    (1 - ramp(gt, DURATION_SECONDS - 1.6, DURATION_SECONDS - 0.5, EASE_SOFT));
  // la luz de fondo respira muy despacio: el plano nunca está muerto
  const breathe =
    0.5 + 0.5 * Math.sin((gt / (DURATION_SECONDS / 10)) * Math.PI * 2);
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 75% at 50% 48%, rgba(52,58,112,${0.55 + 0.15 * breathe}) 0%, rgba(27,30,59,0) 70%)`,
        }}
      />
      {on > 0 ? (
        <Pattern
          cell={64}
          lineOpacity={0.075}
          fillOpacity={0.04}
          scale={pat.scale}
          offsetX={pat.offsetX}
          offsetY={pat.offsetY}
          vignette
          style={{ opacity: on }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 120% 120% at 50% 50%, rgba(16,18,42,0) 55%, rgba(16,18,42,0.75) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
