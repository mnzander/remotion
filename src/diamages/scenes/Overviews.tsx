import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { D, EASE_IN, EASE_IN_OUT, EASE_OUT, EASE_SNAP, FPS, LEXEND, STIX, lerp, ramp, settled } from "../theme";
import { STOPS, T } from "../timeline";
import { HITOS, camera, toScreen } from "../world";
import type { Veil } from "../components/Trama";
import { RevealLine } from "../../diamacon/components/Kinetic";
import { AppIcon } from "../../diamacon/components/AppIcon";
import { Check, IcBank, IcCalendar, IcClock, IcFolder } from "../components/UI";
import { TOKEN_ARRIVE } from "../timeline";

// Capas de pantalla de las dos vistas generales: el punto de giro (cada tarea
// viaja hasta la factura) y la conexión con Diamacon. Van fuera del desenfoque.

type Pt = { x: number; y: number };

const polyLen = (pts: Pt[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
const polyAt = (pts: Pt[], u: number): Pt => {
  const total = polyLen(pts);
  let d = u * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d <= seg || i === pts.length - 1) {
      const k = seg ? Math.min(1, d / seg) : 0;
      return { x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k) };
    }
    d -= seg;
  }
  return pts[pts.length - 1];
};
const polyD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");

/** Línea de la trama que se enciende al paso de un objeto (0..p recorrido). */
const LitPath: React.FC<{ pts: Pt[]; p: number; fade?: number }> = ({ pts, p, fade = 1 }) => {
  if (p <= 0 || fade <= 0) return null;
  const d = polyD(pts);
  return (
    <g opacity={fade}>
      <path d={d} fill="none" stroke={D.white} strokeOpacity={0.35} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 2`} />
      <path d={d} fill="none" stroke={D.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 2`} />
    </g>
  );
};

const TopTitle: React.FC<{
  t: number;
  at: number;
  out: number;
  lines: string[];
  sub: string;
  underlineAt: number;
}> = ({ t, at, out, lines, sub, underlineAt }) => {
  const u = ramp(t, underlineAt, underlineAt + 0.6, EASE_OUT) * (1 - ramp(t, out, out + 0.35, EASE_IN));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 84, display: "flex", flexDirection: "column", alignItems: "center", color: D.navy }}>
      <div style={{ fontFamily: LEXEND, fontWeight: 600, fontSize: 64, lineHeight: 1.1, letterSpacing: "-0.02em", textAlign: "center" }}>
        {lines.map((l, i) => (
          <RevealLine key={i} t={t} at={at + i * 0.12} out={out + i * 0.04} exit="down">
            {l}
          </RevealLine>
        ))}
      </div>
      <div style={{ marginTop: 18, fontFamily: STIX, fontStyle: "italic", fontWeight: 500, fontSize: 52, position: "relative" }}>
        <div style={{ position: "absolute", left: -6, right: -6, bottom: 6, height: 16, background: D.white, transformOrigin: "0 50%", transform: `scaleX(${u})` }} />
        <div style={{ position: "relative" }}>
          <RevealLine t={t} at={at + 0.4} out={out + 0.08} exit="down">
            {sub}
          </RevealLine>
        </div>
      </div>
    </div>
  );
};

export const overviewVeils = (t: number): Veil[] => {
  const g = ramp(t, STOPS.giro[0] - 0.6, STOPS.giro[0], EASE_OUT) * (1 - ramp(t, STOPS.giro[1], STOPS.giro[1] + 0.5, EASE_IN));
  const d = ramp(t, STOPS.diamacon[0] - 0.6, STOPS.diamacon[0], EASE_OUT) * (1 - ramp(t, STOPS.diamacon[1], STOPS.diamacon[1] + 0.5, EASE_IN));
  const k = Math.max(g, d);
  return k > 0 ? [{ axis: "y", a0: 70, a1: 360, amount: 0.72 * k }] : [];
};

// ---------------------------------------------------------------------------
// Punto de giro: tiempo, evento y tarea del expediente viajan a la factura
// ---------------------------------------------------------------------------
const TOKEN_PATHS: Pt[][] = [
  [{ x: 240, y: 360 }, { x: 240, y: 480 }, { x: 6840, y: 480 }, { x: 6840, y: 831 }],
  [{ x: 2640, y: 600 }, { x: 2640, y: 480 }, { x: 6960, y: 480 }, { x: 6960, y: 877 }],
  [{ x: 5040, y: 360 }, { x: 5040, y: 480 }, { x: 7080, y: 480 }, { x: 7080, y: 923 }],
];
/** Duración del viaje: misma velocidad media para todas las fichas (px de pantalla/s). */
const travel = (scr: Pt[]) => Math.max(1.3, polyLen(scr) / 560);

const TOKENS = [
  { label: "1 h 45 min", Icon: IcClock },
  { label: "Reunión", Icon: IcCalendar },
  { label: "Auditoría", Icon: IcFolder },
];

export const GiroOverlay: React.FC = () => {
  const t = useCurrentFrame() / FPS + T.worldStart;
  if (t < STOPS.giro[0] - 0.2 || t > STOPS.giro[1] + 1) return null;
  const cam = camera(t);
  const fade = 1 - ramp(t, STOPS.giro[1] - 0.2, STOPS.giro[1] + 0.2, EASE_IN);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {TOKEN_PATHS.map((path, i) => {
          const scr = path.map((q) => toScreen(cam, q.x, q.y));
          const start = TOKEN_ARRIVE[i] - travel(scr);
          const p = ramp(t, start, TOKEN_ARRIVE[i], EASE_IN_OUT);
          return <LitPath key={i} pts={scr} p={p} fade={fade} />;
        })}
      </svg>
      {TOKEN_PATHS.map((path, i) => {
        const scr = path.map((q) => toScreen(cam, q.x, q.y));
        const start = TOKEN_ARRIVE[i] - travel(scr);
        const born = settled(ramp(t, start - 0.5, start, EASE_SNAP));
        const p = ramp(t, start, TOKEN_ARRIVE[i], EASE_IN_OUT);
        const land = ramp(t, TOKEN_ARRIVE[i] - 0.05, TOKEN_ARRIVE[i] + 0.35, EASE_IN);
        if (born <= 0 || land >= 1) return null;
        const pos = polyAt(scr, p);
        const { Icon, label } = TOKENS[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, -50%) scale(${born * (1 - land)})`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 18px 9px 12px",
              borderRadius: 999,
              background: D.navy,
              color: D.white,
              fontFamily: LEXEND,
              fontWeight: 600,
              fontSize: 22,
              whiteSpace: "nowrap",
              boxShadow: "0 10px 24px rgba(27,30,59,0.3)",
            }}
          >
            <Icon size={24} color={D.teal} width={2.2} /> {label}
          </div>
        );
      })}
      <TopTitle
        t={t}
        at={STOPS.giro[0] + 0.3}
        out={STOPS.giro[1] - 0.25}
        lines={["Enlace directo entre cada tarea", "y la facturación."]}
        sub="Para evitar olvidos."
        underlineAt={STOPS.giro[0] + 1.6}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Conexión con Diamacon: facturas → remesa SEPA → contabilizado
// ---------------------------------------------------------------------------
const DOC_PATHS: Pt[][] = [
  [{ x: 7200, y: 600 }, { x: 7200, y: 480 }, { x: HITOS.remesa.x, y: 480 }],
  [{ x: 9600, y: 360 }, { x: 9600, y: 480 }, { x: HITOS.remesa.x, y: 480 }],
  [{ x: 12000, y: 600 }, { x: 12000, y: 480 }, { x: HITOS.remesa.x, y: 480 }],
];
const N_DOCS = 15;
const DOC_T0 = STOPS.diamacon[0] + 0.3;
const docStart = (i: number) => DOC_T0 + i * 0.17;
const DOC_DUR = 1.1;
const PKT_DUR = 0.5;

export const DiamaconOverlay: React.FC = () => {
  const t = useCurrentFrame() / FPS + T.worldStart;
  if (t < STOPS.diamacon[0] - 0.3 || t > STOPS.diamacon[1] + 0.8) return null;
  const cam = camera(t);
  const fade = 1 - ramp(t, STOPS.diamacon[1] - 0.2, STOPS.diamacon[1] + 0.4, EASE_IN);
  const rem = toScreen(cam, HITOS.remesa.x, HITOS.remesa.y);
  const dc = toScreen(cam, HITOS.diamacon.x, HITOS.diamacon.y);
  const remIn = settled(ramp(t, STOPS.diamacon[0] - 0.1, STOPS.diamacon[0] + 0.35, EASE_SNAP));
  const dcIn = settled(ramp(t, STOPS.diamacon[0] + 0.1, STOPS.diamacon[0] + 0.55, EASE_SNAP));
  const received = Array.from({ length: N_DOCS }, (_, i) => docStart(i) + DOC_DUR).filter((a) => a <= t).length;
  const posted = Array.from({ length: N_DOCS }, (_, i) => docStart(i) + DOC_DUR + PKT_DUR + 0.1).filter((a) => a <= t).length;
  const ok = ramp(t, docStart(0) + DOC_DUR + PKT_DUR + 0.1, docStart(0) + DOC_DUR + PKT_DUR + 0.5, EASE_OUT);
  const corridor = [toScreen(cam, 7200, 480), rem, dc];
  const lineIn = ramp(t, STOPS.diamacon[0] - 0.2, STOPS.diamacon[0] + 0.6, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <LitPath pts={corridor} p={lineIn} />
        {DOC_PATHS.map((path, i) => (
          <LitPath key={i} pts={path.slice(0, 2).map((q) => toScreen(cam, q.x, q.y))} p={lineIn} />
        ))}
        {/* paquetes remesa → Diamacon */}
        {Array.from({ length: N_DOCS }, (_, i) => {
          const a = docStart(i) + DOC_DUR;
          const p = ramp(t, a, a + PKT_DUR, EASE_IN_OUT);
          if (p <= 0 || p >= 1) return null;
          const x = lerp(rem.x + 95, dc.x - 60, p);
          return <rect key={i} x={x - 8} y={rem.y - 8} width={16} height={16} rx={3} fill={D.navy} transform={`rotate(45 ${x} ${rem.y})`} />;
        })}
      </svg>
      {/* facturas viajando */}
      {Array.from({ length: N_DOCS }, (_, i) => {
        const path = DOC_PATHS[i % 3].map((q) => toScreen(cam, q.x, q.y));
        const p = ramp(t, docStart(i), docStart(i) + DOC_DUR, EASE_IN_OUT);
        if (p <= 0 || p >= 1) return null;
        const pos = polyAt(path, p);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x - 15,
              top: pos.y - 19,
              width: 30,
              height: 38,
              borderRadius: 5,
              background: D.white,
              boxShadow: "0 4px 10px rgba(27,30,59,0.25)",
              padding: "6px 5px",
              boxSizing: "border-box",
              display: "grid",
              gap: 4,
              alignContent: "start",
            }}
          >
            <div style={{ height: 4, width: 12, borderRadius: 2, background: D.navy }} />
            <div style={{ height: 3, width: 18, borderRadius: 2, background: D.uiLine }} />
            <div style={{ height: 3, width: 16, borderRadius: 2, background: D.uiLine }} />
            <div style={{ height: 4, width: 10, borderRadius: 2, background: D.teal, justifySelf: "end" }} />
          </div>
        );
      })}
      {/* Hito: remesa SEPA */}
      <div
        style={{
          position: "absolute",
          left: rem.x - 100,
          top: rem.y - 62,
          width: 200,
          height: 124,
          borderRadius: 20,
          background: D.white,
          boxShadow: "0 16px 36px rgba(27,30,59,0.22)",
          transform: `scale(${remIn})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontFamily: LEXEND,
          color: D.navy,
        }}
      >
        <IcBank size={34} />
        <div style={{ fontSize: 22, fontWeight: 600 }}>Remesa SEPA</div>
        <div style={{ fontSize: 16, color: D.ink2, fontVariantNumeric: "tabular-nums" }}>XML · {received} recibos</div>
      </div>
      {/* Hito: Diamacon */}
      <div style={{ position: "absolute", left: dc.x - 64, top: dc.y - 64, transform: `scale(${dcIn})` }}>
        <AppIcon size={128} fill={D.navy} />
      </div>
      <div
        style={{
          position: "absolute",
          left: dc.x - 150,
          width: 300,
          top: dc.y + 84,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          fontFamily: LEXEND,
          color: D.navy,
          opacity: dcIn,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 600 }}>Diamacon</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 16px",
            borderRadius: 999,
            background: D.navy,
            color: D.white,
            fontSize: 19,
            fontWeight: 500,
            opacity: ok,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <Check size={18} color={D.teal} progress={ok} /> Contabilizado · {posted}
        </div>
      </div>
      <TopTitle
        t={t}
        at={STOPS.diamacon[0] - 0.4}
        out={STOPS.diamacon[1] - 0.25}
        lines={["Conecta tu trabajo con Diamacon."]}
        sub="Factura, remesa y contabiliza automáticamente."
        underlineAt={99999}
      />
    </AbsoluteFill>
  );
};

