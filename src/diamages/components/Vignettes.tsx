import React from "react";
import QRCode from "qrcode";
import { D, EASE_IN_OUT, EASE_OUT, EASE_SNAP, LEXEND, lerp, ramp, settled } from "../theme";
import {
  Avatar,
  Bar,
  Check,
  CheckCircle,
  IcCalendar,
  IcClock,
  IcDoc,
  IcFolder,
  IcLock,
  IcMail,
  IcNote,
  IcPhone,
  IcUndo,
  Tag,
} from "./UI";

// Viñetas de interfaz de cada parada. `t` = segundos desde la llegada de la
// cámara (negativo antes). Las etiquetas usan el vocabulario de la guía; los
// nombres de clientes, horas e importes son datos de ejemplo (a validar por Comeralia).
// Área de contenido del panel: 896 × 586 px.

const CW = 896;
const abs = (left: number, top: number, extra?: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  left,
  top,
  ...extra,
});

const pop = (t: number, at: number, dur = 0.5) => settled(ramp(t, at, at + dur, EASE_OUT));

const Label: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: D.inkSoft,
      ...style,
    }}
  >
    {children}
  </div>
);

const Row: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, ...style }}>{children}</div>
);

// ---------------------------------------------------------------------------
// 01 · Gestión de tiempos
// ---------------------------------------------------------------------------
const TASKS = [
  { u: "AM", tone: 0 as const, task: "Declaración trimestral", client: "Talleres Ugarte", time: "0:45" },
  { u: "JL", tone: 1 as const, task: "Nóminas del mes", client: "Gráficas Lema", time: "1:10" },
  { u: "NB", tone: 2 as const, task: "Consulta laboral", client: "Bodegas Arana", time: "0:20" },
];

// Cronómetro: avanza de 5 en 5 minutos, un paso cada 0,19 s, con volteo de lamas
const CLOCK_T0 = 0.8;
const STEP_S = 0.19;
const STEPS_N = 21; // 21 × 5 min = 1 h 45 min
const FLIP_S = 0.16;
const clockMins = (k: number) => Math.max(0, Math.min(STEPS_N, k)) * 5;
const clockStr = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}${String(m % 60).padStart(2, "0")}`;

const Flap: React.FC<{ now: string; prev: string; p: number }> = ({ now, prev, p }) => {
  // p < 1: volteo en curso (primera mitad: dígito anterior se pliega; segunda: el nuevo se despliega)
  const flipping = p < 1 && now !== prev;
  const ch = flipping && p < 0.5 ? prev : now;
  const sy = flipping ? Math.abs(1 - 2 * p) : 1;
  return (
    <div
      style={{
        width: 62,
        height: 90,
        borderRadius: 10,
        background: "#262a52",
        color: D.white,
        fontSize: 66,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span style={{ display: "inline-block", transform: `scaleY(${Math.max(0.04, sy)})` }}>{ch}</span>
      <div style={{ position: "absolute", left: 0, right: 0, top: 44, height: 2, background: D.navy }} />
    </div>
  );
};

export const VTiempos: React.FC<{ t: number }> = ({ t }) => {
  const k = t < CLOCK_T0 ? 0 : Math.floor((t - CLOCK_T0) / STEP_S) + 1;
  const since = t - (CLOCK_T0 + (k - 1) * STEP_S);
  const now = clockStr(clockMins(k));
  const prev = clockStr(clockMins(k - 1));
  const fp = k >= 1 && k <= STEPS_N ? Math.min(1, since / FLIP_S) : 1;
  const ring = ramp(t, CLOCK_T0, CLOCK_T0 + STEP_S * STEPS_N, (x) => x);
  const newRow = pop(t, 5.3, 0.6);
  const done = ramp(t, 5.9, 6.4, EASE_OUT);
  const tabs = ["Cliente", "Usuario", "Servicio"];
  return (
    <div style={{ position: "absolute", inset: "26px 32px 28px", fontFamily: LEXEND }}>
      {/* Pestañas: control de tiempos por cliente, usuario o servicio */}
      <Row style={abs(0, 0, { gap: 10 })}>
        {tabs.map((tab, i) => (
          <div
            key={tab}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              fontSize: 19,
              fontWeight: 500,
              background: i === 0 ? D.navy : D.uiRow,
              color: i === 0 ? D.white : D.ink2,
              opacity: pop(t, 0.1 + i * 0.1),
            }}
          >
            {tab}
          </div>
        ))}
      </Row>
      {/* Tarea en curso + cronómetro */}
      <div
        style={abs(0, 64, {
          width: CW,
          height: 150,
          borderRadius: 18,
          background: D.uiSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 26px",
          boxSizing: "border-box",
        })}
      >
        <Row style={{ gap: 20 }}>
          <svg width={70} height={70} viewBox="0 0 70 70">
            <circle cx={35} cy={35} r={30} fill="none" stroke={D.white} strokeWidth={7} />
            <circle
              cx={35}
              cy={35}
              r={30}
              fill="none"
              stroke={D.teal}
              strokeWidth={7}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${ring} 2`}
              transform="rotate(-90 35 35)"
            />
            <g transform="translate(22 22)">
              <IcClock size={26} />
            </g>
          </svg>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 30, fontWeight: 600 }}>Cierre contable trimestral</div>
            <Row style={{ gap: 10, fontSize: 20, color: D.ink2 }}>
              <Avatar label="IR" size={30} tone={1} /> Construcciones Ibar
            </Row>
          </div>
        </Row>
        <Row style={{ gap: 6 }}>
          <Flap now={now[0]} prev={prev[0]} p={fp} />
          <Flap now={now[1]} prev={prev[1]} p={fp} />
          <div style={{ fontSize: 58, fontWeight: 600, color: D.navy, margin: "0 2px" }}>:</div>
          <Flap now={now[2]} prev={prev[2]} p={fp} />
          <Flap now={now[3]} prev={prev[3]} p={fp} />
        </Row>
      </div>
      {/* Registro */}
      <Row style={abs(0, 240, { width: CW, justifyContent: "space-between" })}>
        <Label>Tareas registradas</Label>
        <Label>Tiempo</Label>
      </Row>
      {[...TASKS, null].map((row, i) => {
        const top = 276 + i * 62;
        if (row === null) {
          return (
            <div
              key="new"
              style={abs(0, top, {
                width: CW,
                height: 54,
                borderRadius: 12,
                background: done > 0.5 ? D.uiSoft : D.white,
                border: `2px solid ${newRow > 0 ? D.teal : "transparent"}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                gap: 14,
                opacity: newRow,
                transform: `translateY(${(1 - newRow) * 24}px)`,
              })}
            >
              <Avatar label="IR" size={34} tone={1} />
              <div style={{ fontSize: 21, fontWeight: 600, width: 330 }}>Cierre contable trimestral</div>
              <div style={{ fontSize: 20, color: D.ink2, width: 230 }}>Construcciones Ibar</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                <Tag strong style={{ opacity: done, fontSize: 18 }}>
                  <Check size={18} progress={done} /> Registrada
                </Tag>
                <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>1:45</div>
              </div>
            </div>
          );
        }
        return (
          <div
            key={row.task}
            style={abs(0, top, {
              width: CW,
              height: 54,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              gap: 14,
              boxSizing: "border-box",
              borderBottom: `1.5px solid ${D.uiLine}`,
              opacity: pop(t, 0.4 + i * 0.15),
            })}
          >
            <Avatar label={row.u} size={34} tone={row.tone} />
            <div style={{ fontSize: 21, fontWeight: 500, width: 330 }}>{row.task}</div>
            <div style={{ fontSize: 20, color: D.ink2, width: 230 }}>{row.client}</div>
            <div style={{ flex: 1, textAlign: "right", fontSize: 22, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              {row.time}
            </div>
          </div>
        );
      })}
      {/* Registro inmediato de tareas, tiempos, gastos y documentos (guía, pág. 4) */}
      <Row style={abs(0, 540, { gap: 10 })}>
        {["Tareas", "Tiempos", "Gastos", "Documentos"].map((c, i) => (
          <Tag key={c} style={{ opacity: pop(t, 0.9 + i * 0.1), fontSize: 18 }}>
            {c}
          </Tag>
        ))}
      </Row>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 02 · Agenda corporativa (tareas, vencimientos, reuniones y actividades pendientes)
// ---------------------------------------------------------------------------
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const HOURS = ["9:00", "10:00", "11:00", "12:00", "13:00"];
const G_X = 62;
const G_Y = 44;
const COL_W = 114;
const ROW_H = 92;
const EVENTS = [
  { d: 0, h0: 0, h1: 1, label: "Reunión", who: [["AM", 0]] },
  { d: 1, h0: 1, h1: 3, label: "Vencimiento", who: [["JL", 1]] },
  { d: 2, h0: 0, h1: 1, label: "Tarea", who: [["NB", 2]] },
  { d: 3, h0: 2, h1: 4, label: "Reunión", who: [["AM", 0], ["JL", 1], ["NB", 2]] },
  { d: 4, h0: 3, h1: 5, label: "Actividad pendiente", who: [["IR", 1]] },
] as const;
const SHARED = 3;

export const VAgenda: React.FC<{ t: number }> = ({ t }) => {
  const shared = ramp(t, 4.0, 4.5, EASE_OUT);
  const note = pop(t, 3.6, 0.6);
  const call = pop(t, 4.5, 0.6);
  const callDone = ramp(t, 5.6, 6.0, EASE_OUT);
  const gridIn = pop(t, 0.2, 0.6);
  return (
    <div style={{ position: "absolute", inset: "26px 32px 28px", fontFamily: LEXEND }}>
      {/* Usuarios que comparten la agenda */}
      <Row style={abs(0, -4, { gap: 12, width: G_X + COL_W * 5, justifyContent: "space-between" })}>
        <div style={{ display: "flex" }}>
          {(["AM", "JL", "NB", "IR"] as const).map((u, i) => (
            <Avatar key={u} label={u} size={32} tone={([0, 1, 2, 1] as const)[i]} style={{ marginLeft: i ? -8 : 0, opacity: pop(t, 0.1 + i * 0.08) }} />
          ))}
        </div>
        <Tag strong style={{ opacity: shared, fontSize: 16, padding: "5px 14px" }}>
          <Check size={16} progress={shared} /> Visible entre usuarios
        </Tag>
      </Row>
      {/* Retícula semanal: cabecera de días + filas de horas */}
      <div style={{ opacity: gridIn }}>
        {DAYS.map((d, i) => (
          <div key={d} style={abs(G_X + i * COL_W, G_Y, { width: COL_W, textAlign: "center", fontSize: 18, fontWeight: 600, color: D.ink2 })}>
            {d}
          </div>
        ))}
        {HOURS.map((h, j) => (
          <div key={h} style={abs(0, G_Y + 34 + j * ROW_H + 6, { width: G_X - 12, textAlign: "right", fontSize: 15, color: D.inkSoft, fontVariantNumeric: "tabular-nums" })}>
            {h}
          </div>
        ))}
        {Array.from({ length: HOURS.length + 1 }, (_, j) => (
          <div key={`h${j}`} style={abs(G_X, G_Y + 34 + j * ROW_H, { width: COL_W * 5, height: 1.5, background: D.uiLine })} />
        ))}
        {Array.from({ length: DAYS.length + 1 }, (_, i) => (
          <div key={`v${i}`} style={abs(G_X + i * COL_W, G_Y + 34, { width: 1.5, height: ROW_H * HOURS.length, background: D.uiLine })} />
        ))}
      </div>
      {/* Eventos encajados en sus celdas */}
      {EVENTS.map((e, i) => {
        const a = pop(t, 0.7 + i * 0.6, 0.55);
        const isShared = i === SHARED;
        const lit = isShared ? shared : 0;
        return (
          <div
            key={i}
            style={abs(G_X + e.d * COL_W + 5, G_Y + 34 + e.h0 * ROW_H + 5, {
              width: COL_W - 10,
              height: (e.h1 - e.h0) * ROW_H - 10,
              borderRadius: 10,
              background: lit > 0.5 ? D.teal : D.uiSoft,
              borderLeft: `5px solid ${isShared ? D.navy : D.teal}`,
              boxSizing: "border-box",
              padding: "9px 9px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.2,
              opacity: a,
              transform: `translateY(${(1 - a) * -24}px)`,
              boxShadow: lit > 0 ? `0 0 0 ${5 * lit}px rgba(79,211,195,0.35)` : undefined,
            })}
          >
            {e.label}
            <div style={{ display: "flex" }}>
              {e.who.map(([u, tone], j) => (
                <Avatar key={u} label={u} size={26} tone={tone as 0 | 1 | 2} style={{ marginLeft: j ? -7 : 0, borderWidth: 1.5 }} />
              ))}
            </div>
          </div>
        );
      })}
      {/* Lateral: avisos (notas internas y llamadas no atendidas) */}
      <div style={abs(G_X + COL_W * 5 + 24, 44, { width: CW - (G_X + COL_W * 5 + 24), display: "grid", gap: 16 })}>
        <Label style={{ opacity: pop(t, 0.3) }}>Avisos</Label>
        <div
          style={{
            borderRadius: 16,
            background: D.navy,
            color: D.white,
            padding: "16px 16px",
            display: "grid",
            gap: 10,
            opacity: note,
            transform: `translateX(${(1 - note) * 40}px)`,
          }}
        >
          <Row style={{ gap: 10 }}>
            <IcNote size={24} color={D.teal} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>Nota interna</div>
          </Row>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>Mensaje recibido</div>
          <Bar w={150} h={9} color="rgba(255,255,255,0.25)" />
          <Bar w={110} h={9} color="rgba(255,255,255,0.25)" />
        </div>
        <div
          style={{
            borderRadius: 16,
            background: D.white,
            border: `2px solid ${D.uiLine}`,
            padding: "16px 16px",
            display: "grid",
            gap: 8,
            opacity: call,
            transform: `translateX(${(1 - call) * 40}px)`,
          }}
        >
          <Row style={{ gap: 10 }}>
            <IcPhone size={24} />
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.15 }}>Llamada no atendida</div>
          </Row>
          <div style={{ fontSize: 16, color: D.ink2 }}>Bodegas Arana · 10:42</div>
          <Tag strong style={{ fontSize: 14, opacity: callDone, justifySelf: "start", padding: "5px 12px" }}>
            <IcCalendar size={15} /> En la agenda
          </Tag>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 03 · Gestión de expedientes (plantillas con tareas, responsables y calendarios)
// ---------------------------------------------------------------------------
const FILES = [
  { type: "Despido", client: "Talleres Ugarte" },
  { type: "Concurso", client: "Gráficas Lema" },
  { type: "Inspección", client: "Bodegas Arana" },
];
const STEPS = [
  { label: "Tarea 1", u: "AM", tone: 0 as const, day: 3 },
  { label: "Tarea 2", u: "JL", tone: 1 as const, day: 5 },
  { label: "Tarea 3", u: "NB", tone: 2 as const, day: 12 },
  { label: "Tarea 4", u: "IR", tone: 1 as const, day: 19 },
  { label: "Tarea 5", u: "AM", tone: 0 as const, day: 26 },
];
// Mini calendario (junio): el día 1 cae en domingo → columna 6
const calCell = (day: number) => {
  const idx = day - 1 + 6;
  return { col: idx % 7, row: Math.floor(idx / 7) };
};

export const VExpedientes: React.FC<{ t: number }> = ({ t }) => {
  const pick = ramp(t, 0.6, 1.1, EASE_OUT);
  const created = pop(t, 1.4, 0.55);
  const applied = ramp(t, 5.8, 6.2, EASE_OUT);
  const calX = 612;
  const calY = 362;
  const cell = 38;
  const stepAt = (i: number) => 2.0 + i * 0.35;
  const flyAt = (i: number) => 3.9 + i * 0.22;
  return (
    <div style={{ position: "absolute", inset: "26px 32px 28px", fontFamily: LEXEND }}>
      <Label style={abs(0, 0)}>Expedientes activos</Label>
      <div
        style={abs(0, 36, {
          width: 340,
          height: 64,
          borderRadius: 14,
          border: `2px dashed ${pick > 0.5 ? D.teal : D.uiLine}`,
          background: pick > 0.5 ? D.uiSoft : D.white,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          boxSizing: "border-box",
          fontSize: 19,
          fontWeight: 500,
          transform: `scale(${1 - 0.04 * Math.sin(Math.PI * pick)})`,
        })}
      >
        <IcFolder size={24} /> Plantilla: <b style={{ fontWeight: 600 }}>Auditoría</b>
      </div>
      {[{ type: "Auditoría", client: "Construcciones Ibar", isNew: true }, ...FILES].map((f, i) => {
        const a = "isNew" in f ? created : pop(t, 0.2 + i * 0.12);
        const top = 116 + i * 70 + ("isNew" in f ? 0 : (1 - created) * -70);
        return (
          <div
            key={f.type}
            style={abs(0, top, {
              width: 340,
              height: 60,
              borderRadius: 12,
              background: "isNew" in f ? D.navy : D.uiRow,
              color: "isNew" in f ? D.white : D.ink,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 12,
              boxSizing: "border-box",
              opacity: a,
            })}
          >
            <div style={{ fontSize: 15, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "isNew" in f ? D.teal : D.white, color: D.navy }}>
              {f.type}
            </div>
            <div style={{ fontSize: 18 }}>{f.client}</div>
          </div>
        );
      })}
      {/* Expediente desplegado desde la plantilla: tareas, responsables y fechas */}
      <Row style={abs(376, 0, { width: 520, justifyContent: "space-between", opacity: created })}>
        <Label>Tareas</Label>
        <Row style={{ gap: 40 }}>
          <Label>Responsable</Label>
          <Label>Fecha</Label>
        </Row>
      </Row>
      {STEPS.map((s, i) => {
        const a = pop(t, stepAt(i), 0.5);
        const fly = ramp(t, flyAt(i), flyAt(i) + 0.55, EASE_IN_OUT);
        const top = 34 + i * 60;
        const cc = calCell(s.day);
        const from = { x: 376 + 470, y: top + 26 };
        const to = { x: calX + cc.col * cell + cell / 2, y: calY + 30 + cc.row * cell + cell / 2 };
        return (
          <React.Fragment key={s.label}>
            <div
              style={abs(376, top, {
                width: 520,
                height: 52,
                borderRadius: 12,
                background: D.white,
                border: `1.5px solid ${D.uiLine}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 14px",
                boxSizing: "border-box",
                opacity: a,
                transform: `translateX(${(1 - a) * 30}px)`,
              })}
            >
              <div style={{ fontSize: 18, fontWeight: 600, width: 200 }}>{s.label}</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <Avatar label={s.u} size={30} tone={s.tone} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: D.ink2, fontVariantNumeric: "tabular-nums", width: 60, textAlign: "right" }}>
                {String(s.day).padStart(2, "0")}/06
              </div>
            </div>
            {fly > 0 && fly < 1 ? (
              <div
                style={abs(lerp(from.x, to.x, fly) - 7, lerp(from.y, to.y, fly) - 7 - Math.sin(Math.PI * fly) * 50, {
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: D.teal,
                  boxShadow: `0 0 0 3px ${D.white}`,
                })}
              />
            ) : null}
          </React.Fragment>
        );
      })}
      {/* Calendario en la agenda corporativa */}
      <div style={abs(calX - 14, calY - 6, { width: 7 * cell + 28, height: 5 * cell + 50, borderRadius: 16, background: D.uiRow, opacity: pop(t, 0.3) })} />
      <Row style={abs(calX, calY, { gap: 8, opacity: pop(t, 0.3) })}>
        <IcCalendar size={20} />
        <div style={{ fontSize: 16, fontWeight: 600 }}>Agenda corporativa</div>
      </Row>
      {Array.from({ length: 30 }, (_, k) => {
        const day = k + 1;
        const { col, row } = calCell(day);
        if (row > 4) return null;
        const step = STEPS.findIndex((s) => s.day === day);
        const lit = step >= 0 ? ramp(t, flyAt(step) + 0.5, flyAt(step) + 0.7, EASE_OUT) : 0;
        return (
          <div
            key={day}
            style={abs(calX + col * cell + 3, calY + 30 + row * cell + 3, {
              width: cell - 6,
              height: cell - 6,
              borderRadius: 8,
              background: lit > 0 ? `rgba(79,211,195,${lit})` : "transparent",
              fontSize: 14,
              fontWeight: lit > 0.5 ? 600 : 400,
              color: D.ink2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: pop(t, 0.3),
              fontVariantNumeric: "tabular-nums",
            })}
          >
            {day}
          </div>
        );
      })}
      {/* Supervisión: tiempo invertido y costes asociados (guía, pág. 5) */}
      <div style={abs(376, 362, { width: 214, display: "grid", gap: 12, opacity: pop(t, 2.2) })}>
        <div style={{ borderRadius: 14, background: D.uiSoft, padding: "12px 14px" }}>
          <Label style={{ fontSize: 13 }}>Tiempo invertido</Label>
          <div style={{ fontSize: 26, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(ramp(t, 2.2, 4.8, EASE_OUT) * 12)} h 30 min
          </div>
        </div>
        <div style={{ borderRadius: 14, background: D.uiSoft, padding: "12px 14px" }}>
          <Label style={{ fontSize: 13 }}>Costes asociados</Label>
          <div style={{ fontSize: 26, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(ramp(t, 2.2, 4.8, EASE_OUT) * 540)} €
          </div>
        </div>
      </div>
      <Tag strong style={{ ...abs(376, 548), opacity: applied }}>
        <Check size={18} progress={applied} /> Plantilla aplicada
      </Tag>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Factura (vista general del punto de giro + parada 04)
// Tipos de facturación de la guía: servicios fijos, variables, periódicos,
// aleatorios, expedientes, provisiones de fondos y suplidos.
// ---------------------------------------------------------------------------
export const INVOICE_LINES = [
  { concept: "Cierre contable trimestral · 1 h 45 min", type: "Tarea", amount: 157.5 },
  { concept: "Reunión", type: "Tarea", amount: 60 },
  { concept: "Auditoría · Construcciones Ibar", type: "Expediente", amount: 480 },
  { concept: "Servicio fijo", type: "Fijo", amount: 180 },
  { concept: "Servicio variable", type: "Variable", amount: 95 },
  { concept: "Servicio periódico", type: "Periódico", amount: 120 },
  { concept: "Servicio aleatorio", type: "Aleatorio", amount: 45 },
  { concept: "Provisión de fondos", type: "Provisión", amount: 300 },
  { concept: "Suplido", type: "Suplido", amount: 62.3 },
];
const eur = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

/**
 * `arrive[i]` = instante (global) en que la línea i entra en la factura.
 * Las tres primeras llegan desde el punto de giro; el resto, en la parada 04.
 */
export const VFactura: React.FC<{ gt: number; arrive: number[]; toFinal: number }> = ({ gt, arrive, toFinal }) => {
  const shown = INVOICE_LINES.map((_, i) => pop(gt, arrive[i], 0.45));
  const total = INVOICE_LINES.reduce((acc, l, i) => acc + (shown[i] > 0.5 ? l.amount : 0), 0);
  const flip = ramp(gt, toFinal, toFinal + 0.6, EASE_IN_OUT);
  const tagFace = flip < 0.5;
  return (
    <div style={{ position: "absolute", inset: "22px 32px 24px", fontFamily: LEXEND }}>
      <Row style={abs(0, 0, { width: CW, justifyContent: "space-between" })}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>Construcciones Ibar S.L.</div>
          <div style={{ fontSize: 17, color: D.inkSoft }}>Nº 0418</div>
        </div>
        <Row style={{ gap: 10 }}>
          <div style={{ opacity: ramp(gt, toFinal + 0.5, toFinal + 0.9), display: "flex" }}>
            <Tag style={{ fontSize: 16 }}>
              <IcUndo size={18} /> Reversible
            </Tag>
          </div>
          <div style={{ transform: `scaleY(${Math.abs(Math.cos(Math.PI * flip))})` }}>
            <Tag dark={!tagFace} strong={tagFace} style={{ fontSize: 19 }}>
              {tagFace ? "Prefactura" : "Factura"}
            </Tag>
          </div>
        </Row>
      </Row>
      <Row style={abs(0, 76, { width: CW, gap: 0 })}>
        <Label style={{ width: 520 }}>Concepto</Label>
        <Label style={{ width: 180 }}>Tipo</Label>
        <Label style={{ width: 196, textAlign: "right" }}>Importe</Label>
      </Row>
      {INVOICE_LINES.map((l, i) => {
        const a = shown[i];
        const top = 106 + i * 46;
        const flash = ramp(gt, arrive[i], arrive[i] + 0.3) * (1 - ramp(gt, arrive[i] + 0.3, arrive[i] + 1.1));
        return (
          <React.Fragment key={l.concept}>
            <div
              style={abs(0, top + 4, {
                width: CW,
                height: 38,
                borderRadius: 10,
                border: `2px dashed ${D.uiLine}`,
                boxSizing: "border-box",
                opacity: (1 - a) * (i < 3 ? 1 : 0),
              })}
            />
            <div
              style={abs(0, top, {
                width: CW,
                height: 46,
                display: "flex",
                alignItems: "center",
                borderBottom: `1.5px solid ${D.uiLine}`,
                background: flash > 0 ? `rgba(79,211,195,${0.35 * flash})` : undefined,
                opacity: a,
                transform: `translateY(${(1 - a) * -14}px)`,
              })}
            >
              <div style={{ width: 520, fontSize: 19, fontWeight: 500, paddingLeft: 4 }}>{l.concept}</div>
              <div style={{ width: 180 }}>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: i < 3 ? D.navy : D.uiSoft,
                    color: i < 3 ? D.white : D.navy,
                  }}
                >
                  {l.type}
                </span>
              </div>
              <div style={{ width: 196, textAlign: "right", fontSize: 19, fontWeight: 500, fontVariantNumeric: "tabular-nums", paddingRight: 4 }}>
                {eur(l.amount)}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <Row style={abs(0, 530, { width: CW, justifyContent: "space-between" })}>
        <Row style={{ gap: 10, opacity: ramp(gt, toFinal + 0.6, toFinal + 1.0) }}>
          <Tag style={{ fontSize: 16 }}>Prefacturas y presupuestos</Tag>
          <Tag style={{ fontSize: 16 }}>Facturas ocasionales</Tag>
        </Row>
        <Row style={{ gap: 16 }}>
          <Label>Total</Label>
          <div style={{ fontSize: 30, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(total)}</div>
        </Row>
      </Row>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 05 · Facturación masiva y envío de facturas por email
// ---------------------------------------------------------------------------
const MiniInvoice: React.FC<{ w: number; h: number; tone?: number }> = ({ w, h, tone = 0 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 8,
      background: D.white,
      border: `1.5px solid ${D.uiLine}`,
      boxSizing: "border-box",
      padding: `${h * 0.12}px ${w * 0.12}px`,
      display: "grid",
      alignContent: "start",
      gap: h * 0.07,
      boxShadow: "0 4px 10px rgba(27,30,59,0.08)",
    }}
  >
    <Bar w={w * 0.5} h={h * 0.07} color={D.navy} />
    <Bar w={w * 0.7} h={h * 0.05} />
    <Bar w={w * 0.6} h={h * 0.05} />
    <Bar w={w * 0.66} h={h * 0.05} />
    <Bar w={w * 0.36} h={h * 0.06} color={tone ? D.teal : D.tealPale} style={{ justifySelf: "end", marginTop: h * 0.04 }} />
  </div>
);

export const VMasiva: React.FC<{ t: number }> = ({ t }) => {
  const COLS = 8;
  const ROWS = 4;
  const w = 86;
  const h = 104;
  const gx = 20;
  const gy = 96;
  const stepX = 108;
  const stepY = 118;
  const count = Math.round(ramp(t, 0.6, 3.2, EASE_IN_OUT) * 248);
  const sent = ramp(t, 5.0, 5.4, EASE_OUT);
  const wave = (c: number, r: number) => 3.7 + (COLS - 1 - c) * 0.08 + r * 0.05;
  return (
    <div style={{ position: "absolute", inset: "26px 32px 28px", fontFamily: LEXEND }}>
      <Row style={abs(0, 0, { width: CW, justifyContent: "space-between" })}>
        <div style={{ display: "grid" }}>
          <Label>Facturas generadas</Label>
          <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{count}</div>
        </div>
        <Tag strong style={{ opacity: sent, fontSize: 19 }}>
          <IcMail size={20} /> Enviadas por email <Check size={18} progress={sent} />
        </Tag>
      </Row>
      {Array.from({ length: COLS * ROWS }, (_, k) => {
        const c = k % COLS;
        const r = Math.floor(k / COLS);
        // abanico: todas nacen de la primera factura (arriba a la izquierda)
        const d = Math.hypot(c, r * 1.4) / 9;
        const a = ramp(t, 0.5 + d * 2.2, 0.95 + d * 2.2, EASE_OUT);
        const x = lerp(gx, gx + c * stepX, a);
        const y = lerp(gy, gy + r * stepY, a);
        // envío: cada factura se pliega en sobre y recibe su confirmación
        const fold = ramp(t, wave(c, r), wave(c, r) + 0.4, EASE_IN_OUT);
        const tick = ramp(t, wave(c, r) + 0.35, wave(c, r) + 0.65, EASE_OUT);
        if (k > 0 && a <= 0) return null;
        return (
          <div key={k} style={abs(x, y, { width: w, height: h })}>
            <div style={{ position: "absolute", inset: 0, opacity: 1 - fold, transform: `scaleY(${1 - fold * 0.4})` }}>
              <MiniInvoice w={w} h={h} tone={(k * 7) % 3 === 0 ? 1 : 0} />
            </div>
            {fold > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 4,
                  top: 24,
                  width: w - 8,
                  height: 58,
                  borderRadius: 8,
                  background: D.navy,
                  opacity: fold,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IcMail size={34} color={D.teal} />
              </div>
            ) : null}
            {tick > 0 ? (
              <div style={{ position: "absolute", right: -4, top: 12 }}>
                <CheckCircle size={26} progress={tick} />
              </div>
            ) : null}
          </div>
        );
      })}
      <Label style={abs(0, 560, { fontSize: 14, opacity: pop(t, 1.0) })}>Sin salir del programa</Label>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 06 · TicketBAI / Verifactu · e-factura con firma digital y encriptación
// ---------------------------------------------------------------------------
const TB = QRCode.create("TicketBAI · factura de ejemplo · 0418", { errorCorrectionLevel: "M" });
const TBN = TB.modules.size;

export const VTicket: React.FC<{ t: number }> = ({ t }) => {
  const qrSize = 170;
  const cell = qrSize / TBN;
  const checks = ["Firma digital", "Encriptación", "Envío automático"];
  const stamp = settled(ramp(t, 4.0, 4.4, EASE_SNAP));
  const stampIn = ramp(t, 4.0, 4.12, EASE_OUT);
  return (
    <div style={{ position: "absolute", inset: "26px 32px 28px", fontFamily: LEXEND }}>
      <div
        style={abs(0, 0, {
          width: 520,
          height: 580,
          borderRadius: 18,
          border: `1.5px solid ${D.uiLine}`,
          background: D.white,
          boxShadow: "0 10px 30px rgba(27,30,59,0.08)",
          padding: 28,
          boxSizing: "border-box",
          opacity: pop(t, 0.1),
        })}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 26, fontWeight: 600 }}>E-factura</div>
            <div style={{ fontSize: 16, color: D.inkSoft }}>Nº 0418</div>
          </div>
          <IcDoc size={34} />
        </Row>
        <div style={{ marginTop: 26, display: "grid", gap: 16 }}>
          {[0.8, 0.62, 0.7, 0.55, 0.66].map((w, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <Bar w={290 * w} h={12} />
              <Bar w={70} h={12} color={D.tealPale} />
            </Row>
          ))}
        </div>
        <div style={{ position: "absolute", left: 28, top: 330, width: 464, height: 1.5, background: D.uiLine }} />
        <div style={{ position: "absolute", left: 28, top: 352, display: "grid", gap: 6 }}>
          <Label style={{ fontSize: 13 }}>Total</Label>
          <div style={{ fontSize: 30, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>1.204,80 €</div>
        </div>
        <svg width={qrSize} height={qrSize} style={{ position: "absolute", right: 28, bottom: 28 }} shapeRendering="crispEdges">
          {Array.from({ length: TBN * TBN }, (_, k) => {
            const r = Math.floor(k / TBN);
            const c = k % TBN;
            if (!TB.modules.get(r, c)) return null;
            const d = (r + c) / (2 * TBN);
            const p = ramp(t, 0.5 + d * 1.5, 0.7 + d * 1.5, EASE_OUT);
            if (p <= 0) return null;
            const s = cell * lerp(0.2, 1, p);
            return <rect key={k} x={c * cell + (cell - s) / 2} y={r * cell + (cell - s) / 2} width={s + 0.4} height={s + 0.4} fill={D.navy} />;
          })}
        </svg>
        <div style={{ position: "absolute", right: 28, bottom: 204, fontSize: 14, fontWeight: 600, color: D.ink2, opacity: pop(t, 0.5) }}>
          TicketBAI
        </div>
        {stampIn > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 430,
              padding: "14px 22px",
              borderRadius: 14,
              border: `4px solid ${D.navy}`,
              color: D.navy,
              background: "rgba(255,255,255,0.9)",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              opacity: stampIn,
              transform: `rotate(-7deg) scale(${lerp(1.5, 1, stamp)})`,
              whiteSpace: "nowrap",
            }}
          >
            TicketBAI · Verifactu
          </div>
        ) : null}
      </div>
      <div style={abs(560, 40, { width: 336, display: "grid", gap: 18 })}>
        <Label>E-factura</Label>
        {checks.map((c, i) => {
          const p = ramp(t, 2.3 + i * 0.5, 2.7 + i * 0.5, EASE_OUT);
          return (
            <Row
              key={c}
              style={{
                gap: 14,
                padding: "16px 18px",
                borderRadius: 14,
                background: p > 0.5 ? D.uiSoft : D.uiRow,
                fontSize: 21,
                fontWeight: 500,
              }}
            >
              <CheckCircle size={32} progress={p} />
              <div style={{ opacity: lerp(0.45, 1, p) }}>{c}</div>
            </Row>
          );
        })}
        <Row style={{ gap: 12, marginTop: 10, opacity: pop(t, 4.5), fontSize: 17, color: D.ink2 }}>
          <IcLock size={22} /> Cumplimiento de la normativa vigente
        </Row>
      </div>
    </div>
  );
};
