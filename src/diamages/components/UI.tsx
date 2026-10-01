import React from "react";
import { D, LEXEND } from "../theme";
import { PANEL_H, PANEL_W } from "../world";
import { DgIcon } from "./Brand";

/** Ventana de la aplicación (abstracción de la interfaz de Diamages). */
export const Panel: React.FC<{
  title: string;
  tag?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, tag, children, style }) => (
  <div
    style={{
      width: PANEL_W,
      height: PANEL_H,
      borderRadius: 26,
      background: D.white,
      boxShadow: `0 36px 80px ${D.shadow}`,
      overflow: "hidden",
      fontFamily: LEXEND,
      color: D.ink,
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    <div
      style={{
        height: 80,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
        borderBottom: `1.5px solid ${D.uiLine}`,
        background: "#fbfdfd",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <DgIcon size={42} />
        <div style={{ fontWeight: 600, fontSize: 27, letterSpacing: "-0.01em" }}>{title}</div>
      </div>
      {tag ? <Tag>{tag}</Tag> : null}
    </div>
    <div style={{ flex: 1, padding: "26px 32px 28px", position: "relative" }}>{children}</div>
  </div>
);

export const Tag: React.FC<{
  children: React.ReactNode;
  strong?: boolean;
  dark?: boolean;
  style?: React.CSSProperties;
}> = ({ children, strong, dark, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 16px",
      borderRadius: 999,
      background: dark ? D.navy : strong ? D.teal : D.uiSoft,
      color: dark ? D.white : D.ink,
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
}> = ({ size = 22, color = D.navy, progress = 1, width = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
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

export const CheckCircle: React.FC<{ size?: number; progress?: number }> = ({ size = 30, progress = 1 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: D.teal,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transform: `scale(${0.6 + 0.4 * Math.min(1, progress * 1.5)})`,
      opacity: progress > 0 ? 1 : 0,
    }}
  >
    <Check size={size * 0.72} color={D.navy} progress={progress} width={3.2} />
  </div>
);

/** Línea de «texto» abstracta para contenidos secundarios. */
export const Bar: React.FC<{ w: number; h?: number; color?: string; style?: React.CSSProperties }> = ({
  w,
  h = 12,
  color = D.uiLine,
  style,
}) => <div style={{ width: w, height: h, borderRadius: h / 2, background: color, flexShrink: 0, ...style }} />;

/** Avatar de usuario: iniciales sobre círculo. */
export const Avatar: React.FC<{
  label: string;
  size?: number;
  tone?: 0 | 1 | 2;
  style?: React.CSSProperties;
}> = ({ label, size = 34, tone = 0, style }) => {
  const bg = [D.navy, D.teal, D.tealPale][tone];
  const fg = tone === 0 ? D.white : D.navy;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: bg,
        color: fg,
        fontFamily: LEXEND,
        fontWeight: 600,
        fontSize: size * 0.4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${D.white}`,
        flexShrink: 0,
        ...style,
      }}
    >
      {label}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Iconos de línea (redibujados con el estilo de la guía: trazo redondeado)
// ---------------------------------------------------------------------------
type IconProps = { size?: number; color?: string; width?: number; style?: React.CSSProperties };

const Icon: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 28,
  color = D.navy,
  width = 2,
  style,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const IcClock: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
    <path d="M20.6 3.6v3.6H17" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);
export const IcCalendar: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);
export const IcFolder: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </Icon>
);
export const IcDoc: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M6.5 3.5h7l4 4v13h-11z" />
    <path d="M13.5 3.5v4h4M9 12h6M9 15.5h6" />
  </Icon>
);
export const IcMail: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="M4 7l8 6 8-6" />
  </Icon>
);
export const IcNote: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M4.5 5.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v9l-5 5h-8a2 2 0 0 1-2-2z" />
    <path d="M14.5 19.5v-5h5M8 8.5h8M8 12h5" />
  </Icon>
);
export const IcPhone: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M6.6 3.8l2.6-.3 1.6 4-1.9 1.3a10.5 10.5 0 0 0 6.3 6.3l1.3-1.9 4 1.6-.3 2.6a2 2 0 0 1-2 1.7A15.8 15.8 0 0 1 4.9 5.8a2 2 0 0 1 1.7-2z" />
  </Icon>
);
export const IcUsers: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3" />
    <path d="M15.5 5.2a3.4 3.4 0 0 1 0 6.6M17.5 14.6c1.8.7 3 2.4 3.5 4.9" />
  </Icon>
);
export const IcLock: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
    <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
  </Icon>
);
export const IcUndo: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M9 7.5H15a5 5 0 0 1 0 10H8" />
    <path d="M11.5 4.5L8.5 7.5l3 3" />
  </Icon>
);
export const IcShield: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M12 3.2l7.5 3v5.3c0 4.6-3.1 8-7.5 9.3-4.4-1.3-7.5-4.7-7.5-9.3V6.2z" />
    <rect x="9.2" y="10.8" width="5.6" height="4.6" rx="1" />
    <path d="M10.4 10.8V9.6a1.6 1.6 0 0 1 3.2 0v1.2" />
  </Icon>
);
export const IcBank: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M3.5 9L12 4l8.5 5z" />
    <path d="M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 19.5h17" />
  </Icon>
);
export const IcArrowRight: React.FC<IconProps> = (p) => (
  <Icon {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Icon>
);
