import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE_IN, EASE_OUT, FPS, ramp, settled } from "../theme";
import { SCENES } from "../timeline";
import { Lockup } from "./Lockup";

/** Firma persistente: quien mire la pantalla en cualquier momento sabe qué marca es. */
export const BrandBug: React.FC = () => {
  const gt = useCurrentFrame() / FPS;
  const inT = SCENES.unico.start + 1.6;
  const outT = SCENES.close.start - 0.9;
  const o =
    settled(ramp(gt, inT, inT + 0.6, EASE_OUT)) *
    (1 - ramp(gt, outT, outT + 0.5, EASE_IN));
  if (o <= 0) return null;
  return (
    <Lockup
      size={46}
      t={100}
      wordAt={0}
      style={{
        position: "absolute",
        left: 64,
        top: 48,
        opacity: 0.95 * o,
        transform: `translateY(${(1 - o) * -12}px)`,
      }}
    />
  );
};
