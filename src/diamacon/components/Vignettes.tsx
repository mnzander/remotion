import React from "react";
import {
  C,
  EASE_IN,
  EASE_IN_OUT,
  EASE_OUT,
  EASE_SNAP,
  LEXEND,
  lerp,
  rand,
  ramp,
  settled,
} from "../theme";
import { Check, CheckCircle, Tag } from "./Panel";

// Micro-demostraciones de interfaz para cada parada del plano secuencia.
// Todas reciben `t` = segundos desde que la cámara llega a la parada
// (negativo = estado inicial, aún sin animar).

const eur = (n: number) => {
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "−" : ""}${grouped},${dec}`;
};

const muted: React.CSSProperties = {
  fontFamily: LEXEND,
  fontWeight: 500,
  fontSize: 16,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: C.inkSoft,
};

// ---------------------------------------------------------------------------
// 01 · Entrada de apuntes
// ---------------------------------------------------------------------------
const V1_ROWS: [string, string, string, number, number][] = [
  ["02/03", "600000 Compras", "Fra. 245", 1250, 0],
  ["02/03", "472000 IVA soportado", "Fra. 245", 262.5, 0],
  ["02/03", "400000 Proveedores", "Fra. 245", 0, 1512.5],
  ["05/03", "430000 Clientes", "Fra. 118", 3025, 0],
  ["05/03", "700000 Ventas", "Fra. 118", 0, 2500],
  ["05/03", "477000 IVA repercutido", "Fra. 118", 0, 525],
];
const V1_COLS = [86, 262, 150, 150, 150];
const ROW_START = 0.45;
const ROW_STEP = 0.52;
const ROW_DUR = 0.42;

const Key: React.FC<{ label: string; pressed: number; wide?: boolean }> = ({
  label,
  pressed,
  wide,
}) => (
  <div
    style={{
      minWidth: wide ? 118 : 72,
      height: 46,
      padding: "0 16px",
      borderRadius: 10,
      border: `1.5px solid ${pressed > 0 ? C.teal : C.uiLine}`,
      background: pressed > 0 ? C.uiSoft : C.white,
      boxShadow: `0 ${lerp(4, 1, pressed)}px 0 ${pressed > 0 ? C.teal : "#d5dae6"}`,
      transform: `translateY(${3 * pressed}px)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: LEXEND,
      fontWeight: 600,
      fontSize: 18,
      color: C.ink,
    }}
  >
    {label}
  </div>
);

export const V1Apuntes: React.FC<{ t: number }> = ({ t }) => {
  const rowP = V1_ROWS.map((_, r) =>
    ramp(
      t,
      ROW_START + r * ROW_STEP,
      ROW_START + r * ROW_STEP + ROW_DUR,
      (x) => x,
    ),
  );
  const done = rowP.filter((p) => p >= 1).length;
  const debe = V1_ROWS.reduce((a, r, i) => a + (rowP[i] >= 1 ? r[3] : 0), 0);
  const haber = V1_ROWS.reduce((a, r, i) => a + (rowP[i] >= 1 ? r[4] : 0), 0);
  const allDone = done === V1_ROWS.length;
  const balanced = settled(
    ramp(
      t,
      ROW_START + 5 * ROW_STEP + ROW_DUR + 0.12,
      ROW_START + 5 * ROW_STEP + ROW_DUR + 0.5,
      EASE_SNAP,
    ),
  );

  // pulsaciones de teclado
  let tab = 0;
  let enter = 0;
  V1_ROWS.forEach((_, r) => {
    const s = ROW_START + r * ROW_STEP;
    for (let k = 1; k <= 4; k++) {
      const at = s + (ROW_DUR * k) / 5;
      if (t >= at && t < at + 0.1) tab = 1;
    }
    const e = s + ROW_DUR;
    if (t >= e && t < e + 0.14) enter = 1;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 22 }}>Asiento nº 1.284</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Tag>Ejercicio 2026</Tag>
          <Tag>Diario</Tag>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          padding: "0 14px",
          height: 36,
          alignItems: "center",
          ...muted,
        }}
      >
        {["Fecha", "Cuenta", "Concepto", "Debe", "Haber"].map((h, i) => (
          <div
            key={h}
            style={{ width: V1_COLS[i], textAlign: i >= 3 ? "right" : "left" }}
          >
            {h}
          </div>
        ))}
      </div>
      {V1_ROWS.map((row, r) => {
        const cells = [
          row[0],
          row[1],
          row[2],
          row[3] ? eur(row[3]) : "",
          row[4] ? eur(row[4]) : "",
        ];
        const total = cells.reduce((a, c) => a + c.length, 0);
        let typed = Math.floor(rowP[r] * total);
        const active = rowP[r] > 0 && rowP[r] < 1;
        return (
          <div
            key={r}
            style={{
              display: "flex",
              alignItems: "center",
              height: 50,
              padding: "0 14px",
              borderRadius: 10,
              background: active ? C.uiSoft : r % 2 === 0 ? C.uiRow : C.white,
              fontSize: 21,
              fontWeight: 400,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {cells.map((c, i) => {
              const shown = c.slice(0, Math.max(0, typed));
              const caret = active && typed >= 0 && typed <= c.length;
              typed -= c.length;
              return (
                <div
                  key={i}
                  style={{
                    width: V1_COLS[i],
                    textAlign: i >= 3 ? "right" : "left",
                    fontWeight: i >= 3 ? 500 : 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {shown}
                  {caret ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 22,
                        marginLeft: 1,
                        verticalAlign: "-4px",
                        background: C.teal,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 54,
          padding: "0 14px",
          marginTop: 6,
          borderTop: `2px solid ${C.ink}`,
          fontWeight: 600,
          fontSize: 21,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <div style={{ width: V1_COLS[0] + V1_COLS[1] }}>Total</div>
        <div style={{ width: V1_COLS[2] }}>
          {allDone ? (
            <Tag
              strong
              style={{
                transform: `scale(${lerp(0.6, 1, balanced)})`,
                opacity: balanced,
              }}
            >
              <Check size={18} color={C.navy} progress={balanced} /> Cuadrado
            </Tag>
          ) : (
            <span style={{ fontWeight: 400, fontSize: 17, color: C.inkSoft }}>
              {debe !== haber ? `Descuadre ${eur(Math.abs(debe - haber))}` : ""}
            </span>
          )}
        </div>
        <div style={{ width: V1_COLS[3], textAlign: "right" }}>{eur(debe)}</div>
        <div style={{ width: V1_COLS[4], textAlign: "right" }}>
          {eur(haber)}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <Key label="Tab" pressed={tab} />
          <Key label="↵ Intro" pressed={enter} wide />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontWeight: 500,
            fontSize: 19,
            color: C.inkSoft,
          }}
        >
          <svg width={34} height={34} viewBox="0 0 24 24">
            <rect
              x={6.5}
              y={3}
              width={11}
              height={18}
              rx={5.5}
              fill="none"
              stroke={C.inkSoft}
              strokeWidth={1.6}
            />
            <path d="M12 3v6" stroke={C.inkSoft} strokeWidth={1.6} />
            <path
              d="M3.5 3.5l17 17"
              stroke={C.ink}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </svg>
          Sin ratón
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 02 · Punteo
// ---------------------------------------------------------------------------
const BANK: [string, string, number][] = [
  ["03/03", "Transf. recibida", 3025],
  ["04/03", "Recibo suministro", -89.9],
  ["06/03", "Pago proveedor", -1512.5],
  ["07/03", "Comisión banco", -12],
  ["10/03", "Cobro cliente", 1200],
  ["12/03", "Recibo seguro", -45.3],
];
const LEDGER: [string, string, number][] = [
  ["06/03", "Proveedores 245", -1512.5],
  ["03/03", "Clientes 118", 3025],
  ["10/03", "Clientes 121", 1200],
  ["04/03", "Suministros", -89.9],
  ["12/03", "Seguros", -45.3],
  ["07/03", "Serv. bancarios", -12],
];
const MATCH = BANK.map((b) => LEDGER.findIndex((l) => l[2] === b[2]));
const P_ROW = 54;
const P_COL = 368;
const P_GUT = 100;

export const V2Punteo: React.FC<{ t: number }> = ({ t }) => {
  const pairs = BANK.map((_, k) =>
    ramp(t, 0.7 + k * 0.4, 0.7 + k * 0.4 + 0.45, EASE_OUT),
  );
  const pct = Math.round(
    (pairs.reduce((a, p) => a + p, 0) / BANK.length) * 100,
  );
  const full = settled(ramp(t, 3.15, 3.5, EASE_SNAP));
  const scan = ramp(t, 0.35, 3.1, (x) => x);
  const rowsTop = 120;

  const List: React.FC<{
    rows: [string, string, number][];
    side: "l" | "r";
  }> = ({ rows, side }) => (
    <div style={{ width: P_COL }}>
      {rows.map((row, j) => {
        const k = side === "l" ? j : MATCH.indexOf(j);
        const p = pairs[k];
        return (
          <div
            key={j}
            style={{
              display: "flex",
              alignItems: "center",
              height: P_ROW - 6,
              marginBottom: 6,
              padding: "0 14px",
              borderRadius: 10,
              background: p > 0 ? `rgba(79,211,195,${0.18 * p})` : C.uiRow,
              border: `1.5px solid ${p > 0.5 ? "rgba(79,211,195,0.7)" : "transparent"}`,
              fontSize: 18,
              fontVariantNumeric: "tabular-nums",
              gap: 10,
            }}
          >
            <div style={{ width: 52, color: C.inkSoft }}>{row[0]}</div>
            <div style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>
              {row[1]}
            </div>
            <div style={{ fontWeight: 600 }}>{eur(row[2])}</div>
            <div style={{ width: 22 }}>
              {p > 0.4 ? <Check size={22} progress={ramp(p, 0.4, 1)} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <Tag strong>Automático</Tag>
          <Tag
            style={{ background: C.white, border: `1.5px solid ${C.uiLine}` }}
          >
            Manual
          </Tag>
          <Tag
            style={{ background: C.white, border: `1.5px solid ${C.uiLine}` }}
          >
            Asistido
          </Tag>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 170,
              height: 10,
              borderRadius: 5,
              background: C.uiLine,
              overflow: "hidden",
            }}
          >
            <div
              style={{ width: `${pct}%`, height: "100%", background: C.teal }}
            />
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 22,
              width: 84,
              textAlign: "right",
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct} %
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 76,
          left: 0,
          ...muted,
        }}
      >
        <div style={{ width: P_COL + P_GUT, paddingLeft: 14 }}>
          Extracto bancario
        </div>
        <div style={{ paddingLeft: 14 }}>Mayor · 572 Bancos</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: rowsTop,
          left: 0,
          display: "flex",
          gap: P_GUT,
        }}
      >
        <List rows={BANK} side="l" />
        <List rows={LEDGER} side="r" />
      </div>
      {/* barrido de búsqueda */}
      {scan > 0 && scan < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: P_COL,
            top: rowsTop + scan * (P_ROW * 6) - 2,
            height: 3,
            background: `linear-gradient(90deg, rgba(79,211,195,0), ${C.teal}, rgba(79,211,195,0))`,
          }}
        />
      ) : null}
      <svg
        width={P_GUT + 20}
        height={P_ROW * 6}
        style={{
          position: "absolute",
          left: P_COL - 10,
          top: rowsTop,
          overflow: "visible",
        }}
      >
        {BANK.map((_, k) => {
          if (pairs[k] <= 0) return null;
          const y1 = k * P_ROW + (P_ROW - 6) / 2;
          const y2 = MATCH[k] * P_ROW + (P_ROW - 6) / 2;
          const x1 = 10;
          const x2 = P_GUT + 10;
          return (
            <g key={k}>
              <path
                d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={C.teal}
                strokeWidth={3}
                pathLength={1}
                strokeDasharray="1 2"
                strokeDashoffset={1 - pairs[k]}
                strokeLinecap="round"
              />
              <circle cx={x1} cy={y1} r={5} fill={C.teal} />
              {pairs[k] >= 1 ? (
                <circle cx={x2} cy={y2} r={5} fill={C.teal} />
              ) : null}
            </g>
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "flex-end",
          opacity: full,
          transform: `translateY(${(1 - full) * 10}px)`,
        }}
      >
        <Tag strong style={{ fontSize: 20, padding: "9px 18px" }}>
          <Check size={20} color={C.navy} progress={full} /> Cuenta conciliada
        </Tag>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 03 · Importación
// ---------------------------------------------------------------------------
const FILES = [
  { ext: "CSB43", label: "Extracto bancario", count: 48 },
  { ext: "XLSX", label: "Hoja Excel", count: 52 },
  { ext: "···", label: "Otros formatos", count: 28 },
];
const IMPORT_ROWS: [number, string, string, string, number][] = [
  [0, "03/03", "Transferencia recibida", "572000", 3025],
  [0, "04/03", "Recibo suministro", "628000", 89.9],
  [0, "06/03", "Pago proveedor", "400000", 1512.5],
  [0, "07/03", "Comisión bancaria", "626000", 12],
  [1, "08/03", "Fra. 119 · Cliente", "430000", 1815],
  [1, "09/03", "Fra. 120 · Cliente", "430000", 968],
  [1, "09/03", "Fra. 87 · Proveedor", "400000", 423.5],
  [1, "10/03", "Fra. 121 · Cliente", "430000", 2420],
  [2, "11/03", "Nómina marzo", "640000", 2150],
  [2, "12/03", "Seguro local", "625000", 45.3],
  [2, "13/03", "Alquiler oficina", "621000", 950],
];
const fileAt = (f: number) => 0.4 + f * 1.05;
const IR_H = 46;

export const V3Importacion: React.FC<{ t: number }> = ({ t }) => {
  const inserts = IMPORT_ROWS.map((r) => {
    const f = r[0];
    const idx = IMPORT_ROWS.filter((x) => x[0] === f).indexOf(r);
    return fileAt(f) + 0.45 + idx * 0.13;
  });
  const count = Math.round(
    FILES.reduce(
      (a, file, f) =>
        a + file.count * ramp(t, fileAt(f) + 0.4, fileAt(f) + 1.0, EASE_OUT),
      0,
    ),
  );

  // filas: las más nuevas arriba
  const order = IMPORT_ROWS.map((_, i) => i).sort(
    (a, b) => inserts[b] - inserts[a],
  );
  let y = 0;
  const placed = order.map((i) => {
    const p = ramp(t, inserts[i], inserts[i] + 0.35, EASE_OUT);
    const top = y;
    y += IR_H * p;
    return { i, p, top };
  });

  return (
    <div style={{ display: "flex", height: "100%", gap: 40 }}>
      <div
        style={{
          width: 236,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          paddingTop: 8,
        }}
      >
        <div style={muted}>Ficheros del cliente</div>
        {FILES.map((file, f) => {
          const act =
            ramp(t, fileAt(f), fileAt(f) + 0.25, EASE_OUT) *
            (1 - ramp(t, fileAt(f) + 0.8, fileAt(f) + 1.1));
          const sent = ramp(t, fileAt(f) + 0.8, fileAt(f) + 1.0);
          return (
            <div
              key={file.ext}
              style={{
                position: "relative",
                height: 112,
                borderRadius: 16,
                border: `2px solid ${act > 0 ? C.teal : C.uiLine}`,
                background: act > 0 ? C.uiSoft : C.white,
                transform: `scale(${1 + 0.04 * act})`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 18px",
              }}
            >
              <svg width={46} height={56} viewBox="0 0 46 56">
                <path
                  d="M4 2h26l12 12v38a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
                  fill={C.white}
                  stroke={C.ink}
                  strokeWidth={2.4}
                />
                <path
                  d="M30 2v12h12"
                  fill="none"
                  stroke={C.ink}
                  strokeWidth={2.4}
                />
                <rect
                  x={9}
                  y={28}
                  width={24}
                  height={3}
                  rx={1.5}
                  fill={C.teal}
                />
                <rect
                  x={9}
                  y={36}
                  width={18}
                  height={3}
                  rx={1.5}
                  fill={C.teal}
                />
              </svg>
              <div>
                <div style={{ fontWeight: 700, fontSize: 24 }}>{file.ext}</div>
                <div style={{ fontSize: 17, color: C.inkSoft }}>
                  {file.label}
                </div>
              </div>
              {sent > 0 ? (
                <div style={{ position: "absolute", right: 12, top: 12 }}>
                  <CheckCircle size={26} progress={sent} />
                </div>
              ) : null}
              {/* paquetes de datos hacia la tabla */}
              {[0, 1, 2, 3].map((q) => {
                const pp = ramp(
                  t,
                  fileAt(f) + 0.15 + q * 0.09,
                  fileAt(f) + 0.6 + q * 0.09,
                  EASE_IN_OUT,
                );
                if (pp <= 0 || pp >= 1) return null;
                return (
                  <div
                    key={q}
                    style={{
                      position: "absolute",
                      left: 236 + pp * 60,
                      top: 50 - 60 * f * pp * 0.9 + (q - 1.5) * 6,
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      transform: "rotate(45deg)",
                      background: C.teal,
                      opacity: 1 - pp * 0.3,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 22 }}>
            Movimientos importados
          </div>
          <Tag
            strong
            style={{
              fontVariantNumeric: "tabular-nums",
              minWidth: 70,
              justifyContent: "center",
            }}
          >
            {count}
          </Tag>
        </div>
        <div
          style={{
            display: "flex",
            padding: "0 12px",
            height: 32,
            alignItems: "center",
            ...muted,
          }}
        >
          <div style={{ width: 64 }}>Fecha</div>
          <div style={{ width: 208 }}>Concepto</div>
          <div style={{ width: 86 }}>Cuenta</div>
          <div style={{ width: 96, textAlign: "right" }}>Importe</div>
        </div>
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          {placed.map(({ i, p, top }) => {
            if (p <= 0) return null;
            const r = IMPORT_ROWS[i];
            const ok = ramp(t, inserts[i] + 0.3, inserts[i] + 0.6, EASE_OUT);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top,
                  height: IR_H - 6,
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 10,
                  background: p < 1 ? C.uiSoft : C.uiRow,
                  opacity: p,
                  fontSize: 18,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <div style={{ width: 64, color: C.inkSoft }}>{r[1]}</div>
                <div
                  style={{
                    width: 208,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {r[2]}
                </div>
                <div style={{ width: 86, color: C.inkSoft }}>{r[3]}</div>
                <div style={{ width: 96, textAlign: "right", fontWeight: 600 }}>
                  {eur(r[4])}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <CheckCircle size={24} progress={ok} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 04 · Impresos oficiales (tablero de lamas)
// ---------------------------------------------------------------------------
const CODES = [
  "IVA",
  "SOCIEDADES",
  "347",
  "349",
  "110",
  "115",
  "123",
  "130",
  "140",
  "Y MÁS",
];
const CELLS = 10;
const CODE_AT = (c: number) => 0.35 + c * 0.5;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const pad = (s: string) => {
  const left = Math.floor((CELLS - s.length) / 2);
  return (" ".repeat(left) + s).padEnd(CELLS, " ");
};

export const V4Impresos: React.FC<{ t: number }> = ({ t }) => {
  let c = -1;
  for (let i = 0; i < CODES.length; i++) if (t >= CODE_AT(i)) c = i;
  const prev = c <= 0 ? pad("") : pad(CODES[c - 1]);
  const cur = c < 0 ? pad("") : pad(CODES[c]);
  const tc = c < 0 ? -10 : CODE_AT(c);
  const calc = ramp(t, tc + 0.12, tc + 0.3);
  const pres = ramp(t, tc + 0.24, tc + 0.42);
  const badges = ["SII", "TicketBAI", "Verifactu"];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 10,
      }}
    >
      <div style={{ ...muted, alignSelf: "flex-start", marginLeft: 16 }}>
        Modelo
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {Array.from({ length: CELLS }).map((_, i) => {
          const start = tc + i * 0.028;
          const ph = ramp(t, start, start + 0.2, (x) => x);
          const flipping = ph > 0 && ph < 1 && prev[i] !== cur[i];
          const glyph = flipping
            ? ph < 0.5
              ? GLYPHS[
                  Math.floor(rand(i * 31 + Math.floor(t * 30)) * GLYPHS.length)
                ]
              : cur[i]
            : ph >= 1 || prev[i] === cur[i]
              ? cur[i]
              : prev[i];
          const sy = flipping ? Math.abs(Math.cos(ph * Math.PI)) : 1;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                width: 70,
                height: 100,
                borderRadius: 10,
                background: C.navy,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  transform: `scaleY(${Math.max(0.05, sy)})`,
                  fontFamily: LEXEND,
                  fontWeight: 600,
                  fontSize: 58,
                  color: C.white,
                  lineHeight: 1,
                }}
              >
                {glyph === " " ? " " : glyph}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 49,
                  height: 2,
                  background: "rgba(0,0,0,0.45)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
        <Tag style={{ fontSize: 20, padding: "8px 18px" }}>
          <Check size={20} progress={calc} /> Calculada
        </Tag>
        <Tag style={{ fontSize: 20, padding: "8px 18px" }}>
          <Check size={20} progress={pres} /> Presentada
        </Tag>
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 44 }}>
        {badges.map((b, i) => {
          const on = settled(ramp(t, 0.9 + i * 0.4, 1.3 + i * 0.4, EASE_SNAP));
          return (
            <div
              key={b}
              style={{
                width: 250,
                height: 100,
                borderRadius: 18,
                border: `2px solid ${on > 0.5 ? C.teal : C.uiLine}`,
                background: on > 0.5 ? C.uiSoft : C.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                fontWeight: 700,
                fontSize: 30,
                transform: `scale(${lerp(0.94, 1, on)})`,
              }}
            >
              <CheckCircle size={32} progress={on} />
              {b}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 05 · Comunicación asesor–cliente
// ---------------------------------------------------------------------------
const ENTRIES = [
  { text: "Fra. 331 · Suministros", amount: "726,00 €" },
  { text: "Ticket 58 · Dietas", amount: "18,40 €" },
  { text: "Fra. 331 · Suministros", amount: "726,00 €", dup: true },
  { text: "Fra. 332 · Alquiler", amount: "950,00 €" },
];
const entryAt = (e: number) => 0.35 + e * 0.72;
const CARD_W = 318;
const GUT = 836 - CARD_W * 2;

const cubic = (p0: number, p1: number, p2: number, p3: number, u: number) =>
  (1 - u) ** 3 * p0 +
  3 * (1 - u) ** 2 * u * p1 +
  3 * (1 - u) * u * u * p2 +
  u ** 3 * p3;

const Person: React.FC<{ letter: string; name: string; role: string }> = ({
  letter,
  name,
  role,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 18px",
      borderBottom: `1.5px solid ${C.uiLine}`,
    }}
  >
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        background: C.navy,
        color: C.teal,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: 22,
      }}
    >
      {letter}
    </div>
    <div>
      <div style={{ fontWeight: 600, fontSize: 21 }}>{name}</div>
      <div style={{ fontSize: 16, color: C.inkSoft }}>{role}</div>
    </div>
    <div
      style={{
        marginLeft: "auto",
        width: 12,
        height: 12,
        borderRadius: 6,
        background: C.teal,
      }}
    />
  </div>
);

export const V5Comunicacion: React.FC<{ t: number }> = ({ t }) => {
  const P0 = { x: CARD_W, y: 170 };
  const P3 = { x: CARD_W + GUT, y: 170 };
  const path = `M ${P0.x} ${P0.y} C ${P0.x + 70} ${P0.y - 90}, ${P3.x - 70} ${P3.y + 90}, ${P3.x} ${P3.y}`;

  let advisorY = 0;
  const advisorRows = ENTRIES.map((e, i) => {
    const arrive = entryAt(i) + 0.85;
    const p = ramp(t, arrive, arrive + 0.3, EASE_OUT);
    const collapse = e.dup ? ramp(t, arrive + 0.95, arrive + 1.3, EASE_IN) : 0;
    const h = 58 * p * (1 - collapse);
    const top = advisorY;
    advisorY += h;
    return { e, p, collapse, top, arrive };
  });

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {/* Cliente */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CARD_W,
          height: 400,
          borderRadius: 18,
          border: `1.5px solid ${C.uiLine}`,
        }}
      >
        <Person letter="C" name="Cliente" role="Introduce sus movimientos" />
        <div style={{ padding: "12px 14px" }}>
          {ENTRIES.map((e, i) => {
            const p = settled(ramp(t, entryAt(i), entryAt(i) + 0.3, EASE_OUT));
            const sending =
              ramp(t, entryAt(i) + 0.3, entryAt(i) + 0.45) *
              (1 - ramp(t, entryAt(i) + 0.7, entryAt(i) + 0.9));
            return (
              <div
                key={i}
                style={{
                  height: 52,
                  marginBottom: 6,
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 10,
                  background: sending > 0 ? C.uiSoft : C.uiRow,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 12}px)`,
                  fontSize: 17,
                }}
              >
                <span>{e.text}</span>
                <span style={{ fontWeight: 600 }}>{e.amount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canal */}
      <svg
        width={836}
        height={400}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <path
          d={path}
          fill="none"
          stroke={C.uiLine}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path
          d={path}
          fill="none"
          stroke={C.teal}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="2 14"
          opacity={0.8}
        />
        {ENTRIES.map((_, i) => {
          const u = ramp(t, entryAt(i) + 0.3, entryAt(i) + 0.85, EASE_IN_OUT);
          if (u <= 0 || u >= 1) return null;
          const x = cubic(P0.x, P0.x + 70, P3.x - 70, P3.x, u);
          const y = cubic(P0.y, P0.y - 90, P3.y + 90, P3.y, u);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={16} fill={C.teal} opacity={0.25} />
              <circle cx={x} cy={y} r={9} fill={C.teal} />
            </g>
          );
        })}
      </svg>

      {/* Asesor */}
      <div
        style={{
          position: "absolute",
          left: CARD_W + GUT,
          top: 0,
          width: CARD_W,
          height: 400,
          borderRadius: 18,
          border: `1.5px solid ${C.uiLine}`,
        }}
      >
        <Person letter="A" name="Asesor" role="Supervisión automática" />
        <div style={{ position: "relative", margin: "12px 14px" }}>
          {advisorRows.map(({ e, p, collapse, top, arrive }, i) => {
            if (p <= 0 || collapse >= 1) return null;
            const flag = e.dup ? ramp(t, arrive + 0.2, arrive + 0.4) : 0;
            const ok = !e.dup ? ramp(t, arrive + 0.2, arrive + 0.45) : 0;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top,
                  height: 52 * (1 - collapse),
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 10,
                  background: flag > 0 ? C.white : C.uiRow,
                  border:
                    flag > 0 ? `2px dashed ${C.ink}` : "2px solid transparent",
                  opacity: p * (1 - collapse),
                  fontSize: 17,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    textDecoration: flag > 0.5 ? "line-through" : "none",
                    color: flag > 0.5 ? C.inkSoft : C.ink,
                  }}
                >
                  {e.text}
                </span>
                {e.dup ? (
                  <span
                    style={{ fontWeight: 600, fontSize: 15, opacity: flag }}
                  >
                    Duplicado
                  </span>
                ) : (
                  <Check size={22} progress={ok} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontSize: 19,
          color: C.inkSoft,
        }}
      >
        <svg width={26} height={26} viewBox="0 0 24 24">
          <path
            d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z"
            fill="none"
            stroke={C.ink}
            strokeWidth={1.8}
          />
          <path
            d="M8.2 12.2l2.6 2.6 5-5.2"
            fill="none"
            stroke={C.teal}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Control automático de apuntes duplicados, modificados y/o eliminados
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 06 · Informes
// ---------------------------------------------------------------------------
const YEARS = ["2022", "2023", "2024", "2025"];
const VALUES = [186, 214, 247, 291];

export const V6Informes: React.FC<{ t: number }> = ({ t }) => {
  const pages = Math.round(39 * ramp(t, 0.3, 1.5, EASE_OUT));
  const chartH = 250;
  const barW = 68;
  const gap = 38;
  const max = 320;
  const line = ramp(t, 1.7, 2.4, EASE_IN_OUT);
  const pts = VALUES.map((v, i) => ({
    x: i * (barW + gap) + barW / 2,
    y: chartH - (v / max) * chartH,
  }));
  const excel = settled(ramp(t, 2.4, 2.8, EASE_SNAP));

  return (
    <div style={{ display: "flex", height: "100%", gap: 40 }}>
      <div
        style={{
          width: 300,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={muted}>Estudio económico-financiero</div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 190,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
            marginTop: 10,
          }}
        >
          {pages}
        </div>
        <div
          style={{
            width: 120,
            height: 8,
            borderRadius: 4,
            background: C.teal,
            margin: "8px 0 16px",
          }}
        />
        <div style={{ fontWeight: 600, fontSize: 36 }}>páginas</div>
        <div
          style={{
            fontSize: 21,
            color: C.inkSoft,
            marginTop: 8,
            lineHeight: 1.35,
          }}
        >
          Ratios, gráficos y comentarios automáticos
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 23 }}>
            Evolución de resultados{" "}
            <span style={{ fontWeight: 400, color: C.inkSoft, fontSize: 18 }}>
              (k€)
            </span>
          </div>
          <Tag strong>4 ejercicios</Tag>
        </div>
        <div
          style={{
            position: "relative",
            height: chartH,
            marginTop: 44,
            marginLeft: 20,
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <div
              key={g}
              style={{
                position: "absolute",
                left: -10,
                right: 0,
                top: chartH * g,
                height: 1.5,
                background: C.uiLine,
              }}
            />
          ))}
          {VALUES.map((v, i) => {
            const p = ramp(t, 0.6 + i * 0.16, 1.3 + i * 0.16, EASE_OUT);
            const h = (v / max) * chartH * p;
            return (
              <div key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: i * (barW + gap),
                    bottom: 0,
                    width: barW,
                    height: h,
                    borderRadius: "10px 10px 0 0",
                    background:
                      i === VALUES.length - 1
                        ? C.teal
                        : "rgba(79,211,195,0.45)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: i * (barW + gap),
                    width: barW,
                    textAlign: "center",
                    bottom: h - 34,
                    fontWeight: 600,
                    fontSize: 17,
                    opacity: ramp(p, 0.5, 1),
                    fontVariantNumeric: "tabular-nums",
                    color: C.ink,
                  }}
                >
                  {Math.round(v * p)}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: i * (barW + gap) - 10,
                    width: barW + 20,
                    textAlign: "center",
                    top: chartH + 12,
                    fontSize: 17,
                    fontWeight: 500,
                    color: C.inkSoft,
                  }}
                >
                  {YEARS[i]}
                </div>
              </div>
            );
          })}
          <svg
            width={440}
            height={chartH}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            <polyline
              points={pts.map((p) => `${p.x},${p.y - 22}`).join(" ")}
              fill="none"
              stroke={C.navy}
              strokeWidth={3}
              pathLength={1}
              strokeDasharray="1 2"
              strokeDashoffset={1 - line}
              strokeLinejoin="round"
            />
            {pts.map((p, i) =>
              line > i / 3 ? (
                <circle key={i} cx={p.x} cy={p.y - 22} r={6} fill={C.navy} />
              ) : null,
            )}
          </svg>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: excel,
            transform: `translateY(${(1 - excel) * 8}px)`,
          }}
        >
          <svg width={30} height={30} viewBox="0 0 24 24">
            <rect
              x={3}
              y={3}
              width={18}
              height={18}
              rx={3}
              fill="none"
              stroke={C.ink}
              strokeWidth={1.8}
            />
            <path
              d="M3 9h18M3 15h18M9 3v18M15 3v18"
              stroke={C.ink}
              strokeWidth={1.2}
            />
          </svg>
          <span style={{ fontWeight: 500, fontSize: 20 }}>
            Editable en Excel
          </span>
        </div>
      </div>
    </div>
  );
};
