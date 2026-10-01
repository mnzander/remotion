import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  D,
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
import { STOPS, T, TOKEN_ARRIVE } from "../timeline";
import {
  PANELS,
  PANEL_H,
  PANEL_W,
  PanelId,
  camera,
  cameraMoving,
  panelFlip,
  panelShow,
  toScreen,
} from "../world";
import { FlipTri, Trama, Veil } from "../components/Trama";
import { halvesInRect } from "../trama";
import { Panel } from "../components/UI";
import { overviewVeils } from "./Overviews";
import { RevealLine } from "../../diamacon/components/Kinetic";
import {
  INVOICE_LINES,
  VAgenda,
  VExpedientes,
  VFactura,
  VMasiva,
  VTicket,
  VTiempos,
} from "../components/Vignettes";

// Plano secuencia por la trama: seis paradas (gestión del despacho 01–03 y
// facturación 04–06). Las ventanas se ensamblan volteando teselas de la trama.

type StopCopy = {
  eyebrow: string;
  head: string[];
  sub?: string;
  chips?: string[];
  title: string;
  tag?: React.ReactNode;
};

const COPY: Record<PanelId, StopCopy> = {
  g1: {
    eyebrow: "Gestión del despacho · 01",
    head: ["Registro preciso", "de tareas", "y tiempos."],
    sub: "Para cada cliente o servicio.",
    title: "Control de tiempos",
    tag: "Hoy",
  },
  g2: {
    eyebrow: "Gestión del despacho · 02",
    head: ["Agenda", "corporativa", "integrada."],
    sub: "Visible entre usuarios, con notas internas.",
    title: "Agenda corporativa",
    tag: "Equipo",
  },
  g3: {
    eyebrow: "Gestión del despacho · 03",
    head: ["Gestión de", "expedientes."],
    sub: "Con plantillas de tareas, responsables y calendarios.",
    title: "Expedientes",
    tag: "Plantillas",
  },
  f4: {
    eyebrow: "Facturación · 04",
    head: ["Facturación", "que se adapta", "a tu despacho."],
    chips: ["Fijos", "Variables", "Periódicos", "Aleatorios", "Expedientes", "Provisiones de fondos", "Suplidos"],
    title: "Facturación",
  },
  f5: {
    eyebrow: "Facturación · 05",
    head: ["Facturación", "masiva."],
    sub: "Y envío por email sin salir del programa.",
    title: "Facturación masiva",
  },
  f6: {
    eyebrow: "Facturación · 06",
    head: ["Totalmente", "adaptado a", "TicketBAI", "y Verifactu."],
    sub: "E-factura con firma digital y encriptación.",
    title: "TicketBAI / Verifactu",
  },
};

const REST: Record<PanelId, readonly [number, number]> = {
  g1: STOPS.g1,
  g2: STOPS.g2,
  g3: STOPS.g3,
  f4: STOPS.f4,
  f5: STOPS.f5,
  f6: STOPS.f6,
};

const IDS: PanelId[] = ["g1", "g2", "g3", "f4", "f5", "f6"];

// Llegada de las líneas de la factura: 3 desde el punto de giro, 6 en la parada 04
const F4_LINE_AT = (i: number) => STOPS.f4[0] + 1.6 + 0.8 * i;
const INVOICE_ARRIVE = INVOICE_LINES.map((_, i) => (i < 3 ? TOKEN_ARRIVE[i] : F4_LINE_AT(i - 3)));
// Orden de los chips = orden de los tipos en la factura
const CHIP_AT = [F4_LINE_AT(0), F4_LINE_AT(1), F4_LINE_AT(2), F4_LINE_AT(3), F4_LINE_AT(3) + 0.8, F4_LINE_AT(4) + 0.8, F4_LINE_AT(5) + 0.8];
// La línea «Expediente» (ya en la factura) late cuando se enciende su chip
const INVOICE_ARRIVE_F4 = [...INVOICE_ARRIVE];
INVOICE_ARRIVE_F4[4] = CHIP_AT[1];
INVOICE_ARRIVE_F4[5] = CHIP_AT[2];
INVOICE_ARRIVE_F4[6] = CHIP_AT[3];
INVOICE_ARRIVE_F4[7] = CHIP_AT[5];
INVOICE_ARRIVE_F4[8] = CHIP_AT[6];
INVOICE_ARRIVE_F4[3] = CHIP_AT[0];
const TO_FINAL = STOPS.f4[0] + 7.4;

/** Columna de texto de una parada, en coordenadas de mundo. */
const textColumn = (id: PanelId) => {
  const p = PANELS[id];
  const camX = p.x + (p.side === "left" ? 380 : -380);
  const left = p.side === "left" ? camX - 960 + 1140 : camX - 960 + 110;
  return { left, width: 700, top: p.y - 540 };
};

export const worldVeils = (t: number): Veil[] => {
  const cam = camera(t);
  const out: Veil[] = [];
  for (const id of IDS) {
    const [a, b] = REST[id];
    const k = ramp(t, a - 1.0, a - 0.2, EASE_IN_OUT) * (1 - ramp(t, b + 0.1, b + 0.9, EASE_IN_OUT));
    if (k <= 0) continue;
    const col = textColumn(id);
    const x0 = toScreen(cam, col.left - 40, 0).x;
    const x1 = toScreen(cam, col.left + col.width + 20, 0).x;
    out.push({ axis: "x", a0: x0, a1: x1, amount: 0.62 * k });
  }
  return out;
};

/** Destello periódico por las líneas de la trama mientras la cámara reposa: vida sin mover el texto. */
const sweepAt = (t: number) => {
  if (t < STOPS.g1[0] + 1.2 || t > STOPS.users[0] || cameraMoving(t)) return -1;
  return ((t - STOPS.g1[0]) % 2.6) / 1.6;
};

export const WorldScene: React.FC<{ extraVeils?: Veil[] }> = ({ extraVeils = [] }) => {
  const t = useCurrentFrame() / FPS + T.worldStart;
  const cam = camera(t);
  const flat = Math.abs(cam.rx) < 0.01 && Math.abs(cam.ry) < 0.01;

  // Mitades de trama que se voltean para formar cada panel
  const flips: FlipTri[] = [];
  for (const id of IDS) {
    const show = panelShow(id, t);
    if (show >= 1 || t < REST[id][0] - 1.4) continue;
    const p = PANELS[id];
    for (const h of halvesInRect(p.x - PANEL_W / 2, p.y - PANEL_H / 2, p.x + PANEL_W / 2, p.y + PANEL_H / 2)) {
      flips.push({ ...h, p: panelFlip(id, h.c, h.r, t) });
    }
  }

  // La trama ya está desplegada (la despliega el acto 1)
  const tramaContrast = 1;
  // Salida hacia la convergencia
  const worldOut = ramp(t, T.converge[0], T.converge[0] + 0.8, EASE_IN_OUT);
  const panelsOut = ramp(t, STOPS.diamacon[1], STOPS.diamacon[1] + 0.5, EASE_IN);

  return (
    <AbsoluteFill style={{ perspective: flat ? undefined : 1700 }}>
      <AbsoluteFill
        style={{
          transformOrigin: "960px 540px",
          transform: flat ? undefined : `rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`,
          transformStyle: flat ? undefined : "preserve-3d",
        }}
      >
        <Trama
          cam={cam}
          sweep={sweepAt(t)}
          contrast={tramaContrast * (1 - worldOut)}
          flips={flips}
          veils={[...worldVeils(t), ...overviewVeils(t), ...extraVeils]}
        />
        {panelsOut < 1 && t > REST.g1[0] - 1.5 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              transform: `translate(960px, 540px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`,
              opacity: 1 - panelsOut,
            }}
          >
            {IDS.map((id) => (
              <Stop key={id} id={id} t={t} />
            ))}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const View: React.FC<{ id: PanelId; t: number }> = ({ id, t }) => {
  const local = t - REST[id][0];
  switch (id) {
    case "g1":
      return <VTiempos t={local} />;
    case "g2":
      return <VAgenda t={local} />;
    case "g3":
      return <VExpedientes t={local} />;
    case "f4":
      return <VFactura gt={t} arrive={INVOICE_ARRIVE_F4} toFinal={TO_FINAL} />;
    case "f5":
      return <VMasiva t={local} />;
    case "f6":
      return <VTicket t={local} />;
  }
};

const Stop: React.FC<{ id: PanelId; t: number }> = ({ id, t }) => {
  const p = PANELS[id];
  const copy = COPY[id];
  const [arrive, leave] = REST[id];
  const show = panelShow(id, t);
  const base = arrive - 0.2;
  const col = textColumn(id);
  // los textos salen hacia su máscara cuando la cámara arranca
  const out = leave;
  const visibleText = t > base - 0.1 && t < out + 0.8;
  return (
    <>
      {show > 0 ? (
        <div style={{ position: "absolute", left: p.x - PANEL_W / 2, top: p.y - PANEL_H / 2, opacity: show }}>
          <Panel title={copy.title} tag={copy.tag}>
            <View id={id} t={t} />
          </Panel>
        </div>
      ) : null}
      {visibleText ? (
        <div
          style={{
            position: "absolute",
            left: col.left,
            top: col.top,
            width: col.width,
            height: 1080,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: D.navy,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Marker t={t} at={base} out={out} />
            <div
              style={{
                fontFamily: LEXEND,
                fontWeight: 500,
                fontSize: 26,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              <RevealLine t={t} at={base} out={out} exit="down">
                {copy.eyebrow}
              </RevealLine>
            </div>
          </div>
          <div
            style={{
              marginTop: 22,
              fontFamily: LEXEND,
              fontWeight: 600,
              fontSize: 76,
              lineHeight: 1.06,
              letterSpacing: "-0.022em",
            }}
          >
            {copy.head.map((line, j) => (
              <RevealLine key={j} t={t} at={base + 0.1 + j * 0.12} out={out + 0.03 * j} exit="down">
                {line}
              </RevealLine>
            ))}
          </div>
          {copy.sub ? (
            <div style={{ marginTop: 28, fontFamily: STIX, fontSize: 48, lineHeight: 1.2, maxWidth: 680 }}>
              <FadeUp t={t} at={base + 0.5} out={out + 0.1}>
                {copy.sub}
              </FadeUp>
            </div>
          ) : null}
          {copy.chips ? <Chips t={t} base={base} out={out} chips={copy.chips} /> : null}
        </div>
      ) : null}
    </>
  );
};

/** Triángulo de la trama como marcador del antetítulo. */
const Marker: React.FC<{ t: number; at: number; out: number }> = ({ t, at, out }) => {
  const a = settled(ramp(t, at, at + 0.45, EASE_OUT)) * (1 - ramp(t, out, out + 0.35, EASE_IN));
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" style={{ transform: `scale(${a})` }}>
      <path d="M2 2H20L2 20Z" fill={D.navy} />
    </svg>
  );
};

/** Bloque que sube y aparece (para párrafos que pueden partirse en varias líneas). */
const FadeUp: React.FC<{ t: number; at: number; out: number; children: React.ReactNode }> = ({ t, at, out, children }) => {
  const a = settled(ramp(t, at, at + 0.6, EASE_OUT));
  const o = ramp(t, out, out + 0.4, EASE_IN);
  return (
    <div style={{ opacity: a * (1 - o), transform: `translateY(${(1 - a) * 24 + o * 18}px)` }}>{children}</div>
  );
};

const Chips: React.FC<{ t: number; base: number; out: number; chips: string[] }> = ({ t, base, out, chips }) => (
  <div style={{ marginTop: 34, display: "flex", flexWrap: "wrap", gap: 14, maxWidth: 700 }}>
    {chips.map((c, j) => {
      const a = settled(ramp(t, base + 0.5 + j * 0.06, base + 0.9 + j * 0.06, EASE_OUT));
      const on = ramp(t, CHIP_AT[j], CHIP_AT[j] + 0.25, EASE_OUT);
      const kick = settled(ramp(t, CHIP_AT[j], CHIP_AT[j] + 0.35, EASE_SNAP));
      const o = ramp(t, out + j * 0.02, out + j * 0.02 + 0.35, EASE_IN);
      return (
        <div
          key={c}
          style={{
            padding: "10px 24px",
            borderRadius: 999,
            border: `2.5px solid ${D.navy}`,
            background: on > 0.5 ? D.navy : "rgba(255,255,255,0.35)",
            color: on > 0.5 ? D.white : D.navy,
            fontFamily: LEXEND,
            fontWeight: 500,
            fontSize: 34,
            opacity: a * (1 - o),
            transform: `translateY(${(1 - a) * 16 + o * 12}px) scale(${on > 0 && on < 1 ? lerp(1.06, 1, kick) : 1})`,
          }}
        >
          {c}
        </div>
      );
    })}
  </div>
);

export { IDS, REST };
