import React from "react";
import { EASE_IN, EASE_OUT, ramp } from "../theme";

type RevealProps = {
  /** Tiempo actual (s) en la escala de la escena. */
  t: number;
  /** Instante de entrada (s). */
  at: number;
  /** Instante de salida (s); si se omite, el texto permanece. */
  out?: number;
  dur?: number;
  outDur?: number;
  /** Dirección de salida: "up" (sigue subiendo) o "down" (vuelve a su máscara). */
  exit?: "up" | "down";
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Línea que emerge desde una máscara inferior (tipografía cinética).
 * La máscara se amplía por abajo para no cortar descendentes.
 */
export const RevealLine: React.FC<RevealProps> = ({
  t,
  at,
  out,
  dur = 0.7,
  outDur = 0.5,
  exit = "up",
  style,
  children,
}) => {
  const pIn = ramp(t, at, at + dur, EASE_OUT);
  const pOut = out === undefined ? 0 : ramp(t, out, out + outDur, EASE_IN);
  // la cola del easing se corta por debajo de ~1 px para que el texto se asiente sin titilar
  const settle = 1 - pIn < 0.006 ? 0 : 1 - pIn;
  const y = settle * 115 + pOut * (exit === "up" ? -115 : 115);
  return (
    <div
      style={{
        overflow: "hidden",
        paddingBottom: "0.16em",
        marginBottom: "-0.16em",
        paddingTop: "0.06em",
        marginTop: "-0.06em",
        ...style,
      }}
    >
      <div
        style={{
          transform: `translateY(${y}%)`,
          opacity: pIn > 0 ? 1 : 0,
          whiteSpace: "pre",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Letras con entrada escalonada (para el logotipo). */
export const Letters: React.FC<{
  text: string;
  t: number;
  at: number;
  stagger?: number;
  dur?: number;
  out?: number;
  outStagger?: number;
  style?: React.CSSProperties;
}> = ({
  text,
  t,
  at,
  stagger = 0.035,
  dur = 0.6,
  out,
  outStagger = 0.025,
  style,
}) => {
  const chars = text.split("");
  return (
    <div
      style={{
        display: "flex",
        overflow: "hidden",
        paddingBottom: "0.2em",
        marginBottom: "-0.2em",
        paddingTop: "0.1em",
        marginTop: "-0.1em",
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const pIn = ramp(t, at + i * stagger, at + i * stagger + dur, EASE_OUT);
        const o =
          out === undefined
            ? 0
            : ramp(
                t,
                out + (chars.length - 1 - i) * outStagger,
                out + (chars.length - 1 - i) * outStagger + 0.4,
                EASE_IN,
              );
        const y = (1 - pIn) * 110 + o * 110;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${y}%)`,
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Punto final de frase en color de acento. */
export const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span style={{ color }}>.</span>
);
