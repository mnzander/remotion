import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { GemStrokes } from "../diamacon/components/Gem";
import { WINDOW, segPoint } from "../diamacon/gem";

// Transición «35 nóminas → portal de Comeralia → cielo» · versión 3 (sobre la V2 y la V3
// aprobadas): cada nómina entra por su propio punto del rombo (la rejilla en miniatura, sin
// cruces) y el paso por el portal es un único movimiento continuo: velocidad, dirección y
// ritmo de encogimiento son idénticos a ambos lados, así que no hay frenazo ni rebote. Al
// otro lado se alejan en perspectiva y se desvanecen antes de juntarse.
// 7,5 s, 1920 × 1080, 60 fps, sin audio.

export const FPS = 60;
export const DURATION = 7.5;

const T = {
  bgSwap: [0.2, 1.4] as const, // fondo del fotograma inicial → vídeo al 200 %
  pan: [0.6, 3.0] as const, // la cámara pasa a la segunda pantalla (logotipo)
  depart: 0.05, // arrancan antes que la cámara, en orden (la más cercana al logotipo primero)
  stagger: 0.04,
  travel: 2.95, // la primera cruza a los 3,0 s, justo cuando la cámara termina el barrido
  open: [1.4, 2.3] as const, // el rombo se abre al cielo antes de que llegue la primera
  zoom: [4.4, 6.25] as const, // la cámara atraviesa el portal
  clean: 7.25, // a partir de aquí, cielo limpio
};

const EIO = Easing.bezier(0.45, 0, 0.55, 1);
const ECAM = Easing.bezier(0.65, 0, 0.35, 1);
const EOUT = Easing.bezier(0.16, 1, 0.3, 1);
const ramp = (t: number, a: number, b: number, e: (x: number) => number = (x) => x) =>
  e(Math.max(0, Math.min(1, (t - a) / (b - a))));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const IMG: React.CSSProperties = { position: "absolute", maxWidth: "none", maxHeight: "none" };

// ---------------------------------------------------------------------------
// Geometría (medida sobre las referencias)
// ---------------------------------------------------------------------------
const DOC = { w: 552, h: 726 }; // nomina.png
const DOC_K = 124 / DOC.w; // escala de la rejilla inicial (124 px de ancho)
const DOC_Y = 162 / (DOC.h * DOC_K); // en la referencia miden 162 px de alto, no 163
const GRID = { x0: 148, y0: 34, dx: 250, dy: 212.5, cols: 7, rows: 5 };
const GEM_K = 1.288; // unidades de la gema → px (logotipo de 566 px)
const LOGO = { x: 1920 + 962.3, y: 533.5 }; // centro de la gema en el mundo
const GEM_STROKE_SCALE = 0.85;

type Cam = { cx: number; cy: number; z: number };
export const camera = (t: number): Cam => {
  const p = ramp(t, T.pan[0], T.pan[1], ECAM);
  const zp = ramp(t, T.zoom[0], T.zoom[1], ECAM);
  const z = Math.exp(lerp(0, Math.log(12), zp));
  const cx = lerp(960, 1920 + 960, p);
  return { cx: lerp(cx, LOGO.x, zp), cy: lerp(540, LOGO.y, zp), z };
};
export const toScreen = (c: Cam, x: number, y: number) => ({ x: 960 + (x - c.cx) * c.z, y: 540 + (y - c.cy) * c.z });

/** Ventana central de la gema (rombo de lados curvos) en pantalla. */
const windowPath = (cx: number, cy: number, k: number) => {
  let d = "";
  WINDOW.forEach((s, i) => {
    const a = segPoint(s, 0);
    const b = segPoint(s, 1);
    const m = segPoint(s, 0.5);
    const c = { x: 2 * m.x - (a.x + b.x) / 2, y: 2 * m.y - (a.y + b.y) / 2 };
    if (i === 0) d += `M${(cx + a.x * k).toFixed(2)} ${(cy + a.y * k).toFixed(2)}`;
    d += `Q${(cx + c.x * k).toFixed(2)} ${(cy + c.y * k).toFixed(2)} ${(cx + b.x * k).toFixed(2)} ${(cy + b.y * k).toFixed(2)}`;
  });
  return d + "Z";
};

// ---------------------------------------------------------------------------
// Nóminas: salida en orden (la más cercana al logotipo primero)
// ---------------------------------------------------------------------------
type Doc = { sx: number; sy: number; order: number; seed: number };
export const DOCS: Doc[] = (() => {
  const list: Doc[] = [];
  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      list.push({
        sx: GRID.x0 + c * GRID.dx + (DOC.w * DOC_K) / 2,
        sy: GRID.y0 + r * GRID.dy + 81,
        order: 0,
        seed: r * 7 + c + 1,
      });
    }
  }
  const byDist = [...list].sort(
    (a, b) => Math.hypot(LOGO.x - a.sx, (LOGO.y - a.sy) * 1.6) - Math.hypot(LOGO.x - b.sx, (LOGO.y - b.sy) * 1.6),
  );
  byDist.forEach((d, i) => (d.order = i));
  return list;
})();

// ---------------------------------------------------------------------------
// Movimiento continuo a través del portal
// ---------------------------------------------------------------------------
const SCALE_GATE = 0.04; // tamaño al cruzar el portal
const LOG_SHRINK = Math.log(DOC_K / SCALE_GATE);
// Constante de alejamiento al otro lado: igual al ritmo con que menguaban al llegar
// (con un viaje que termina a velocidad 1 en la curva de tiempo), así no hay cambio de ritmo.
const TAU = T.travel / LOG_SHRINK;
/** Curva de tiempo: arranque suave (velocidad 0) y llegada a velocidad 1, sin frenar. */
const easeGo = (x: number) => 2 * x * x - x * x * x;

export const departAt = (d: Doc) => T.depart + d.order * T.stagger;
export const crossAt = (d: Doc) => departAt(d) + T.travel;
const cell = (d: Doc) => ({ c: (d.seed - 1) % GRID.cols, r: Math.floor((d.seed - 1) / GRID.cols) });
/** Punto de entrada en el rombo: la rejilla en miniatura (mundo). */
const entryPoint = (d: Doc) => {
  const { c, r } = cell(d);
  return { x: LOGO.x - 40 + (c - 3) * 20, y: LOGO.y + (r - 2) * 30 };
};
/** Punto de fuga a la derecha de todas las entradas: siguen avanzando hacia donde
 *  venían (izquierda → derecha) y ninguna tiene que dar la vuelta al cruzar. */
const VP = { x: LOGO.x + 110, y: LOGO.y };

const bez = (a: number, b: number, c: number, e: number, p: number) => {
  const u = 1 - p;
  return u * u * u * a + 3 * u * u * p * b + 3 * u * p * p * c + p * p * p * e;
};

/** Fase A: de la rejilla a su punto del rombo. La curva llega en la dirección del punto de
 *  fuga y a la misma velocidad con la que seguirá al otro lado. Cruzan con la cámara ya
 *  quieta (entre el barrido y el zoom): nada las arrastra y no tienen que cambiar de sentido. */
export const phaseA = (d: Doc, t: number) => {
  const p = easeGo(ramp(t, departAt(d), crossAt(d)));
  const e = entryPoint(d);
  const vx = e.x - VP.x;
  const vy = e.y - VP.y;
  const k = T.travel / (3 * TAU); // 3·(P3−P2)·1/travel = (E−fuga)/τ
  const p2 = { x: e.x + vx * k, y: e.y + vy * k };
  const p1 = { x: d.sx + (LOGO.x - d.sx) * 0.35, y: d.sy + (d.sy - LOGO.y) * 0.12 };
  return {
    x: bez(d.sx, p1.x, p2.x, e.x, p),
    y: bez(d.sy, p1.y, p2.y, e.y, p),
    s: DOC_K * Math.exp(-LOG_SHRINK * p),
    p,
  };
};

/** Fase B: ya en el cielo, que está fijo (infinitamente lejos): la cámara no las arrastra.
 *  Se alejan en perspectiva hacia el punto de fuga y se desvanecen antes de juntarse. */
export const phaseB = (d: Doc, t: number) => {
  const tt = t - crossAt(d);
  const c0 = camera(crossAt(d));
  const e = entryPoint(d);
  const f = Math.exp(-tt / TAU);
  const g = toScreen(c0, VP.x, VP.y);
  const s = SCALE_GATE * c0.z * f;
  const q = Math.min(1, Math.max(0, (f - 0.38) / 0.4));
  const alpha = q * q * (3 - 2 * q); // se desvanecen antes de amontonarse
  return { x: g.x + (e.x - VP.x) * c0.z * f, y: g.y + (e.y - VP.y) * c0.z * f, s, alpha };
};

export const PortalNominasV3: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const cam = camera(t);
  const L = toScreen(cam, LOGO.x, LOGO.y);
  const k = GEM_K * cam.z;
  const passed = t >= T.zoom[1];

  const openP = ramp(t, T.open[0], T.open[1], EOUT);
  const irisR = openP * 220 * k;
  const winD = windowPath(L.x, L.y, k);

  // Fondo: el del fotograma inicial se funde en el vídeo al 200 % (el mundo de dos pantallas)
  const swap = ramp(t, T.bgSwap[0], T.bgSwap[1], EIO);
  const world = `translate(960px, 540px) scale(${cam.z}) translate(${-cam.cx}px, ${-cam.cy}px)`;

  return (
    <AbsoluteFill style={{ background: "#74a5a2", overflow: "hidden" }}>
      {!passed ? (
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: world }}>
          <OffthreadVideo
            src={staticFile("comeralia-portal/fondo.mp4")}
            muted
            // ritmo para no pasar de 3,1 s del original: a partir de ahí el vídeo avanza a saltos
            playbackRate={0.49}
            // algo más del 200 %: el vídeo trae un marco oscuro de unos píxeles que así queda fuera
            style={{ ...IMG, left: -24, top: -560, width: 3888, height: 2200 }}
          />
          {swap < 1 ? <Img src={staticFile("comeralia-portal/fondo-inicio.png")} style={{ ...IMG, left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - swap }} /> : null}
        </div>
      ) : null}

      {/* Cielo a través del rombo (desde 4,5 s, a pantalla completa y fijo) */}
      {openP > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: passed ? undefined : `path('${winD}')`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, clipPath: passed ? undefined : `circle(${irisR}px at ${L.x}px ${L.y}px)` }}>
            {/* el cielo no se mueve nunca: es exactamente el fotograma de referencia */}
            <Img src={staticFile("comeralia-portal/cielo.png")} style={{ ...IMG, left: 0, top: 0, width: 1920, height: 1080 }} />
            {t < T.clean
              ? DOCS.filter((d) => t >= crossAt(d))
                  .sort((m, n) => crossAt(m) - crossAt(n))
                  .map((d) => ({ d, b: phaseB(d, t) }))
                  .map(({ d, b }) => {
                  const px = b.x;
                  const py = b.y;
                  const w = DOC.w * b.s;
                  const h = DOC.h * b.s;
                  if (b.alpha <= 0) return null;
                  return (
                    <Img
                      key={d.seed}
                      src={staticFile("comeralia-portal/nomina.png")}
                      style={{
                        ...IMG,
                        left: px - w / 2,
                        top: py - h / 2,
                        width: w,
                        height: h,
                        opacity: b.alpha,
                      }}
                    />
                  );
                })
              : null}
          </div>
        </div>
      ) : null}

      {/* Logotipo (vector: nítido durante el zoom) y destello del portal */}
      {!passed ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {openP > 0 && openP < 1 ? (
            <path d={winD} fill="none" stroke="#ffffff" strokeWidth={6 * cam.z} opacity={0.55 * Math.sin(Math.PI * openP)} />
          ) : null}
          <GemStrokes transform={`translate(${L.x} ${L.y}) scale(${k})`} color="#1b1e3b" strokeScale={GEM_STROKE_SCALE} />
        </svg>
      ) : null}

      {/* Fase A: nóminas en el mundo, rumbo al portal (con los peldaños de la hélice) */}
      {DOCS.filter((d) => t < crossAt(d))
        .sort((m, n) => crossAt(n) - crossAt(m))
        .map((d) => ({ d, a: phaseA(d, t) }))
        .map(({ d, a }) => {
        const p = toScreen(cam, a.x, a.y);
        const w = DOC.w * a.s * cam.z;
        const h = DOC.h * a.s * cam.z * lerp(DOC_Y, 1, a.p);
        return (
          <Img
            key={d.seed}
            src={staticFile("comeralia-portal/nomina.png")}
            style={{ ...IMG, left: p.x - w / 2, top: p.y - h / 2, width: w, height: h }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
