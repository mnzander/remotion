import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  C,
  EASE_IN,
  EASE_IN_OUT,
  EASE_OUT,
  EASE_SNAP,
  FPS,
  LEXEND,
  STIX,
  lerp,
  ramp,
  settled,
} from "../theme";
import { SCENES } from "../timeline";
import { backdropPattern, PANEL_H, PANEL_W, SIDE_OFFSET } from "../world";
import { windowPath } from "../gem";
import { GEM_BOX_UNITS } from "../components/Gem";
import { Pattern } from "../components/Pattern";
import { RevealLine } from "../components/Kinetic";
import { AppIcon } from "../components/AppIcon";
import { logoGem } from "./S2Logo";

// Escena 3 · «Un único programa, totalmente integrado, sin módulos
// adicionales». Las áreas del programa flotan como piezas sueltas y un imán
// las funde en el icono Dc, que se despliega en la ventana de la aplicación.

const START = SCENES.unico.start;
const LOGO_OFFSET = SCENES.unico.start - SCENES.logo.start; // tiempo local S2 = t + offset
const PORTAL_END = SCENES.logo.end - SCENES.unico.start;

const TARGET = { x: 1480, y: 540 };
const ICON = 280;
export const MORPH = { start: 8.6, end: SCENES.world.start - START };

const CHIPS = [
  { label: "Entrada de apuntes", x: 1470, y: 190 },
  { label: "Punteo", x: 1290, y: 300 },
  { label: "Importación", x: 1650, y: 300 },
  { label: "Impresos oficiales", x: 1500, y: 410 },
  { label: "Inmovilizado", x: 1320, y: 520 },
  { label: "Informes", x: 1720, y: 525 },
  { label: "Registro Mercantil", x: 1480, y: 630 },
  { label: "Estimaciones", x: 1690, y: 740 },
  { label: "Comunicación con el cliente", x: 1470, y: 850 },
];

// Orden de absorción: de más cerca a más lejos del imán
const ORDER = CHIPS.map((c, i) => ({
  i,
  d: Math.hypot(c.x - TARGET.x, c.y - TARGET.y),
}))
  .sort((a, b) => a.d - b.d)
  .map((o) => o.i);
const MAGNET_AT = 5.2;
const MAGNET_STEP = 0.14;
const MAGNET_DUR = 0.75;
const arrival = (i: number) =>
  MAGNET_AT + ORDER.indexOf(i) * MAGNET_STEP + MAGNET_DUR;

export const S3Unico: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const gt = t + START;

  // Portal: el mundo solo se ve a través de la ventana central de la gema
  let clip: string | undefined;
  if (t < PORTAL_END) {
    const g = logoGem(t + LOGO_OFFSET);
    clip = `path('${windowPath(g.box / GEM_BOX_UNITS, g.cx, g.cy)}')`;
  }

  const pat = backdropPattern(gt);
  const patternFade = 1 - ramp(t, 8.8, MORPH.end, EASE_IN_OUT);

  // Icono: crece a medida que absorbe piezas, luego se despliega en ventana
  const arrived = CHIPS.reduce(
    (acc, _, i) => acc + ramp(t, arrival(i) - 0.1, arrival(i) + 0.25, EASE_OUT),
    0,
  );
  const iconGrow =
    lerp(0.25, 0.9, arrived / CHIPS.length) +
    0.1 * ramp(t, 7.1, 7.6, EASE_SNAP);
  const iconIn = ramp(t, 5.75, 6.05, EASE_OUT);
  const morph = ramp(t, MORPH.start, MORPH.end, EASE_IN_OUT);
  const ring = ramp(t, 7.1, 8.0, EASE_OUT);

  const iconSize = ICON * iconGrow;
  const w = lerp(iconSize, PANEL_W, morph);
  const h = lerp(iconSize, PANEL_H, morph);
  const cx = lerp(TARGET.x, 960 + SIDE_OFFSET, morph);
  const cy = TARGET.y;
  const radius = lerp(iconSize * 0.19, 28, morph);
  const wipe = ramp(t, MORPH.start + 0.55, MORPH.end, EASE_IN_OUT);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: clip }}>
        {/* Teselado de marca, más presente que en el resto del vídeo */}
        <Pattern
          cell={64}
          lineOpacity={0.24}
          fillOpacity={0.17}
          scale={pat.scale}
          offsetX={pat.offsetX}
          offsetY={pat.offsetY}
          vignette
          style={{ opacity: patternFade }}
        />
        {/* Velo lateral para la legibilidad del texto */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(90deg, rgba(27,30,59,0.96) 0%, rgba(27,30,59,0.9) 38%, rgba(27,30,59,0.25) 62%, rgba(27,30,59,0) 75%)`,
            opacity: patternFade,
          }}
        />

        {/* Texto */}
        <div style={{ position: "absolute", left: 160, top: 262 }}>
          <div
            style={{
              fontFamily: LEXEND,
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: C.teal,
            }}
          >
            <RevealLine t={t} at={1.0} out={8.15}>
              Programa de contabilidad para asesorías
            </RevealLine>
          </div>
          <div
            style={{
              marginTop: 26,
              fontFamily: LEXEND,
              fontWeight: 600,
              fontSize: 86,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: C.white,
            }}
          >
            <RevealLine t={t} at={1.15} out={8.2}>
              Un <span style={{ color: C.teal }}>único</span> programa,
            </RevealLine>
            <RevealLine t={t} at={1.35} out={8.26}>
              totalmente integrado.
            </RevealLine>
          </div>
          <div
            style={{
              marginTop: 34,
              fontFamily: STIX,
              fontSize: 54,
              lineHeight: 1.2,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            <RevealLine t={t} at={2.2} out={8.32}>
              Sin módulos adicionales
            </RevealLine>
            <RevealLine t={t} at={2.4} out={8.38}>
              ni complicaciones.
            </RevealLine>
          </div>
        </div>

        {/* Piezas (áreas del programa) */}
        {CHIPS.map((chip, i) => {
          const appear = settled(
            ramp(t, 1.3 + i * 0.07, 1.3 + i * 0.07 + 0.6, EASE_SNAP),
          );
          const start = MAGNET_AT + ORDER.indexOf(i) * MAGNET_STEP;
          const m = ramp(t, start, start + MAGNET_DUR, EASE_IN);
          if (m >= 1 || appear <= 0) return null;
          // quietas mientras se leen; la vida la pone el latido del borde
          const pulse =
            0.5 + 0.5 * Math.sin((t * 0.8 + i * 0.37) * Math.PI * 2);
          const x = lerp(chip.x, TARGET.x, m);
          const y = lerp(chip.y, TARGET.y, m);
          const s = lerp(1, 0.3, m) * lerp(0.7, 1, appear);
          return (
            <div
              key={chip.label}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${s})`,
                opacity:
                  appear *
                  (1 -
                    ramp(
                      t,
                      start + MAGNET_DUR - 0.2,
                      start + MAGNET_DUR,
                      EASE_IN,
                    )),
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 28px 16px 22px",
                borderRadius: 999,
                background: "rgba(36,40,80,0.85)",
                border: `2px solid rgba(79,211,195,${0.4 + 0.35 * pulse})`,
                boxShadow: `0 10px 30px rgba(0,0,0,0.25), 0 0 ${10 + 14 * pulse}px rgba(79,211,195,${0.12 + 0.18 * pulse})`,
                fontFamily: LEXEND,
                fontWeight: 500,
                fontSize: 30,
                color: C.white,
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  transform: "rotate(45deg)",
                  background: C.teal,
                  borderRadius: 2,
                }}
              />
              {chip.label}
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Pulso de encaje */}
      {ring > 0 && ring < 1 ? (
        <div
          style={{
            position: "absolute",
            left: TARGET.x,
            top: TARGET.y,
            width: ICON * lerp(1, 1.9, ring),
            height: ICON * lerp(1, 1.9, ring),
            transform: "translate(-50%, -50%)",
            borderRadius: ICON * 0.3,
            border: `3px solid ${C.teal}`,
            opacity: 1 - ring,
          }}
        />
      ) : null}

      {/* Icono Dc → ventana de la aplicación */}
      {iconIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: cx - w / 2,
            top: cy - h / 2,
            width: w,
            height: h,
            borderRadius: radius,
            background: C.navyRaised,
            border: `${lerp(3, 0, morph)}px solid rgba(79,211,195,${lerp(0.9, 0, morph)})`,
            boxShadow: `0 ${lerp(10, 40, morph)}px ${lerp(40, 90, morph)}px rgba(5,8,25,${lerp(0.35, 0.5, morph)}), 0 0 ${lerp(50, 0, morph)}px rgba(79,211,195,${0.35 * (1 - morph)})`,
            opacity: iconIn,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: `${wipe * 100}%`,
              background: C.white,
              boxShadow:
                wipe > 0 && wipe < 1
                  ? `0 0 40px 10px rgba(79,211,195,0.55)`
                  : undefined,
            }}
          />
          <AppIcon
            size={iconSize * lerp(1, 1.4, morph)}
            letters={1 - ramp(t, MORPH.start, MORPH.start + 0.45, EASE_IN)}
            fill="transparent"
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
