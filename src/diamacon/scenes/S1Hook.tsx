import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  C,
  EASE_IN_OUT,
  EASE_OUT,
  FPS,
  LEXEND,
  STIX,
  lerp,
  ramp,
} from "../theme";
import { RevealLine } from "../components/Kinetic";
import { TOP_EDGE_SCREEN } from "./S2Logo";

// Escena 1 · Gancho: las tres tareas clave del despacho (PDF, pág. 3) se
// escriben como renglones de un libro contable y convergen en uno solo.

const X0 = 170;
const RULE_W = 1580;
const ROWS = [
  { top: 176, text: "Contabilidad", at: 0.55 },
  { top: 326, text: "Impuestos", at: 1.75 },
  { top: 476, text: "Cumplimiento normativo", at: 2.95 },
];
const RULE_OFFSET = 150; // distancia del renglón a la parte superior del texto
const PHRASE_TOP = 700;
const MERGED_RULE_Y = PHRASE_TOP + 124;
const MERGE_END = 5.75 + 0.14; // la última regla termina de caer
const CENTER_OFFSET = 139;

export const HOOK_END = 8.6;

export const S1Hook: React.FC = () => {
  const t = useCurrentFrame() / FPS;

  // Sin empujes lentos de escala: Chrome encaja el texto al píxel y temblaría.
  // El movimiento lo ponen las entradas, las reglas y la subida del bloque.
  const push = 1;
  const dim = ramp(t, 4.9, 5.6, EASE_IN_OUT);
  const merge = ramp(t, 4.8, MERGE_END, EASE_IN_OUT);
  // Los renglones nacen centrados y suben para dejar sitio a la frase
  const lift = CENTER_OFFSET * (1 - ramp(t, 4.55, 5.6, EASE_IN_OUT));

  // Punto inicial (continuidad con el último fotograma del loop)
  const dotTravel = ramp(t, 0.1, 0.6, EASE_IN_OUT);
  const dotX = lerp(960, X0, dotTravel);
  const dotY = lerp(540, ROWS[0].top + RULE_OFFSET + CENTER_OFFSET, dotTravel);

  // La regla fusionada se convierte en el borde superior de la gema (match cut)
  const toGem = ramp(t, 7.85, HOOK_END, EASE_IN_OUT);
  const gemTop = TOP_EDGE_SCREEN;

  const rules = ROWS.map((row, i) => {
    const grow = ramp(
      t,
      row.at - 0.3 + (i === 0 ? 0.25 : 0),
      row.at + 0.35,
      EASE_OUT,
    );
    const y = lerp(
      row.top + RULE_OFFSET + Math.round(lift),
      MERGED_RULE_Y,
      ramp(t, 4.8 + i * 0.07, 5.75 + i * 0.07, EASE_IN_OUT),
    );
    return { y, grow };
  });

  const x1 = lerp(X0, gemTop.x1, toGem);
  const x2 = lerp(X0 + RULE_W, gemTop.x2, toGem);
  const ruleY = lerp(MERGED_RULE_Y, gemTop.y, toGem);
  const thick = lerp(3, gemTop.thickness, toGem);

  return (
    <AbsoluteFill>
      {/* Punto de arranque */}
      {t < 0.62 ? (
        <div
          style={{
            position: "absolute",
            left: dotX - 7,
            top: dotY - 7,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: C.teal,
            boxShadow: `0 0 24px ${C.tealGlow}`,
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: `${X0}px 540px`,
        }}
      >
        {/* Renglones (se ocultan cuando ya se han fusionado) */}
        {merge < 1
          ? rules.map((r, i) =>
              r.grow > 0 ? (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: X0,
                    top: r.y - 1.5,
                    width: RULE_W * r.grow,
                    height: 3,
                    background: C.teal,
                    opacity: i === 0 ? 1 : lerp(1, 0.85, merge),
                  }}
                />
              ) : null,
            )
          : null}

        {ROWS.map((row, i) => (
          <div
            key={row.text}
            style={{
              position: "absolute",
              left: X0 - 6,
              top: Math.round(row.top + lift - 24 * dim),
              opacity: lerp(1, 0.34, dim),
              fontFamily: LEXEND,
              fontWeight: 600,
              fontSize: 124,
              lineHeight: 1,
              letterSpacing: "-0.025em",
              color: C.white,
            }}
          >
            <RevealLine
              t={t}
              at={row.at}
              out={7.72 + i * 0.05}
              outDur={0.45}
              exit="down"
            >
              {row.text}
              <span style={{ color: C.teal }}>.</span>
            </RevealLine>
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            left: X0,
            top: PHRASE_TOP,
            fontFamily: STIX,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 92,
            lineHeight: 1,
            color: C.teal,
          }}
        >
          <RevealLine
            t={t}
            at={5.15}
            dur={0.75}
            out={7.72}
            outDur={0.45}
            exit="down"
          >
            En una sola plataforma.
          </RevealLine>
        </div>
      </AbsoluteFill>

      {/* Regla fusionada → borde superior de la gema (fuera del empuje para aterrizar exacto) */}
      {merge >= 1 && t < HOOK_END ? (
        <MergedRule
          x1={x1}
          x2={x2}
          y={ruleY}
          thick={thick}
          push={lerp(push, 1, toGem)}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const MergedRule: React.FC<{
  x1: number;
  x2: number;
  y: number;
  thick: number;
  push: number;
}> = ({ x1, x2, y, thick, push }) => {
  // Deshace el empuje en la posición de partida para no saltar al separar capas
  const px = (x: number) => X0 + (x - X0) * push;
  const py = (v: number) => 540 + (v - 540) * push;
  const a = px(x1);
  const b = px(x2);
  return (
    <div
      style={{
        position: "absolute",
        left: a,
        top: py(y) - thick / 2,
        width: b - a,
        height: thick,
        borderRadius: thick / 2,
        background: C.teal,
      }}
    />
  );
};
