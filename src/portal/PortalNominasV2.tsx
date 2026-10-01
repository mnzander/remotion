import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { GemStrokes } from "../diamacon/components/Gem";
import { WINDOW, segPoint } from "../diamacon/gem";

// Transición «35 nóminas → portal de Comeralia → cielo» · versión 2 (limpia): las nóminas
// bajan de la rejilla a un único carril que avanza a velocidad constante hacia el portal,
// en fila y con separación fija; al cruzarlo siguen recto hacia el fondo y se desvanecen.
// Nadie se cruza con nadie. 9 s, 1920 × 1080, 60 fps, sin audio.
// - Fotograma 0 = la escena de las 35 nóminas (fondo reconstruido + rejilla exacta).
// - El mundo mide dos pantallas de ancho: a la derecha, desde siempre, el logotipo.
//   La cámara se desplaza una pantalla (fondo al 200 %) y las nóminas viajan al portal.
// - El rombo central del logotipo se abre al cielo; la cámara lo atraviesa.
// - Desde 4,5 s el cielo queda fijo e idéntico a la imagen de referencia; las nóminas
//   vuelan y caen fuera de cuadro antes del final.

export const FPS = 60;
export const DURATION = 9.2;

const T = {
  bgSwap: [0.2, 1.4] as const, // fondo del fotograma inicial → vídeo al 200 %
  pan: [0.6, 3.0] as const, // la cámara pasa a la segunda pantalla (logotipo)
  first: 2.2, // la primera nómina cruza el portal (empieza a moverse a los 0,18 s)
  gap: 0.12, // una cada 0,12 s (84 px entre nóminas en el carril)
  speed: 700, // px/s del mundo: velocidad del carril
  joinDur: 1.0, // lo que tarda cada nómina en bajar de la rejilla al carril
  open: [1.4, 2.3] as const, // el rombo se abre al cielo antes de que llegue la primera
  zoom: [6.4, 8.2] as const, // la cámara atraviesa el portal cuando ya han pasado todas
  fade: 0.32, // s: constante con la que se hunden hacia el fondo tras cruzar
  clean: 8.75, // a partir de aquí, cielo limpio
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
const camera = (t: number): Cam => {
  const p = ramp(t, T.pan[0], T.pan[1], ECAM);
  const zp = ramp(t, T.zoom[0], T.zoom[1], ECAM);
  const z = Math.exp(lerp(0, Math.log(12), zp));
  const cx = lerp(960, 1920 + 960, p);
  return { cx: lerp(cx, LOGO.x, zp), cy: lerp(540, LOGO.y, zp), z };
};
const toScreen = (c: Cam, x: number, y: number) => ({ x: 960 + (x - c.cx) * c.z, y: 540 + (y - c.cy) * c.z });

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
const DOCS: Doc[] = (() => {
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
// Carril: una sola fila horizontal a la altura del portal que avanza hacia él.
// Orden: de la columna derecha a la izquierda y, en cada columna, primero la del centro y
// luego hacia fuera (así ninguna pasa por encima de otra que aún espera); cada nómina
// entra en el carril justo cuando su hueco pasa por su columna.
// ---------------------------------------------------------------------------
const LANE_SCALE = 0.085; // tamaño en el carril (≈ 47 px de ancho, separadas 84 px)
const SCALE_GATE = 0.055; // tamaño al cruzar el portal
const laneOrder = (d: Doc) => {
  const c = (d.seed - 1) % GRID.cols;
  const r = Math.floor((d.seed - 1) / GRID.cols);
  const inColumn = [2, 1, 3, 0, 4].indexOf(r);
  return (GRID.cols - 1 - c) * GRID.rows + inColumn;
};
const crossAt = (d: Doc) => T.first + laneOrder(d) * T.gap;
/** Instante en que su hueco del carril pasa por la vertical de su columna. */
const joinAt = (d: Doc) => crossAt(d) - (LOGO.x - d.sx) / T.speed;

/** Fase A: de la rejilla al carril, y por el carril hasta el portal (mundo). */
const phaseA = (d: Doc, t: number) => {
  const laneX = LOGO.x - (crossAt(d) - t) * T.speed;
  const near = Math.max(0, Math.min(1, 1 - (LOGO.x - laneX) / 700)); // últimos 700 px: menguan
  const laneS = lerp(LANE_SCALE, SCALE_GATE, EIO(near));
  // baja al carril centrado en el paso de su hueco; en horizontal solo avanza (nunca retrocede)
  const ja = Math.max(0.05, joinAt(d) - 0.35);
  const jy = ramp(t, ja, joinAt(d) + 0.65, EIO);
  // en horizontal sigue su hueco sin retraso: arranca con suavidad (máximo suave) cuando
  // el hueco pasa por su columna y a partir de ahí va exactamente con el carril
  const W = 40;
  const z = laneX - d.sx;
  const ahead = z > 12 * W ? z : W * Math.log1p(Math.exp(z / W));
  return {
    x: d.sx + ahead * ramp(t, ja, ja + 0.2),
    y: lerp(d.sy, LOGO.y, jy),
    // menguan al principio de la bajada: entran al carril ya a su tamaño, sin rozar a las vecinas
    s: Math.exp(lerp(Math.log(DOC_K), Math.log(laneS), ramp(t, ja, joinAt(d) + 0.25, EIO))),
    p: jy,
  };
};

/** Fase B: ya en el cielo (fijo: sus píxeles son los de pantalla). Sigue recto, en la
 *  dirección del carril, hacia el fondo: cada vez más pequeña hasta desaparecer. */
const phaseB = (d: Doc, t: number) => {
  const tt = t - crossAt(d);
  const c0 = camera(crossAt(d));
  const g = toScreen(c0, LOGO.x, LOGO.y);
  const f = Math.exp(-tt / T.fade);
  const s = SCALE_GATE * c0.z * f;
  const alpha = Math.min(1, Math.max(0, (s * DOC.w - 4) / 10));
  return { x: g.x + 70 * c0.z * (1 - f), y: g.y, s, alpha };
};

export const PortalNominasV2: React.FC = () => {
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
            playbackRate={0.38}
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
