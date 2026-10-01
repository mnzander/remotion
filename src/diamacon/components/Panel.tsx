import React from "react";
import { C, LEXEND } from "../theme";
import { PANEL_H, PANEL_W } from "../world";
import { AppIcon } from "./AppIcon";

/** Ventana de la aplicación (abstracción de la interfaz de Diamacon). */
export const Panel: React.FC<{
  title: string;
  tag?: React.ReactNode;
  contentOpacity?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, tag, contentOpacity = 1, children, style }) => (
  <div
    style={{
      width: PANEL_W,
      height: PANEL_H,
      borderRadius: 28,
      background: C.white,
      boxShadow: "0 40px 90px rgba(5,8,25,0.5)",
      overflow: "hidden",
      fontFamily: LEXEND,
      color: C.ink,
      ...style,
    }}
  >
    <div
      style={{
        opacity: contentOpacity,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 76,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 30px",
          borderBottom: `1.5px solid ${C.uiLine}`,
          background: "#fbfcfe",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <AppIcon size={38} />
          <div
            style={{ fontWeight: 600, fontSize: 26, letterSpacing: "-0.01em" }}
          >
            {title}
          </div>
        </div>
        {tag ? <Tag>{tag}</Tag> : null}
      </div>
      <div style={{ flex: 1, padding: "24px 32px 28px", position: "relative" }}>
        {children}
      </div>
    </div>
  </div>
);

export const Tag: React.FC<{
  children: React.ReactNode;
  strong?: boolean;
  style?: React.CSSProperties;
}> = ({ children, strong, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 16px",
      borderRadius: 999,
      background: strong ? C.teal : C.uiSoft,
      color: C.ink,
      fontWeight: 500,
      fontSize: 19,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Check: React.FC<{
  size?: number;
  color?: string;
  progress?: number;
  width?: number;
}> = ({ size = 22, color = C.teal, progress = 1, width = 3 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block", flexShrink: 0 }}
  >
    <path
      d="M4.5 12.5l4.8 4.8L19.5 7"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 2"
      strokeDashoffset={1 - progress}
    />
  </svg>
);

export const CheckCircle: React.FC<{ size?: number; progress?: number }> = ({
  size = 30,
  progress = 1,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: C.teal,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${0.6 + 0.4 * Math.min(1, progress * 1.5)})`,
      opacity: progress > 0 ? 1 : 0,
    }}
  >
    <Check size={size * 0.72} color={C.navy} progress={progress} width={3.2} />
  </div>
);

/** Línea de "texto" abstracta para contenidos secundarios. */
export const Bar: React.FC<{
  w: number;
  h?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ w, h = 12, color = C.uiLine, style }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: h / 2,
      background: color,
      ...style,
    }}
  />
);
