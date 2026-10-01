import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { GemStrokes } from "../diamacon/components/Gem";
import { WINDOW, segPoint } from "../diamacon/gem";

// Transición «35 nóminas → portal de Comeralia → cielo» · 6 s, 1920 × 1080, 60 fps, sin audio.
// - Fotograma 0 = la escena de las 35 nóminas (fondo reconstruido + rejilla exacta).
// - El mundo mide dos pantallas de ancho: a la derecha, desde siempre, el logotipo.
//   La cámara se desplaza una pantalla (fondo al 200 %) y las nóminas viajan al portal.
// - El rombo central del logotipo se abre al cielo; la cámara lo atraviesa.
// - Desde 4,5 s el cielo queda fijo e idéntico a la imagen de referencia; las nóminas
//   vuelan y caen fuera de cuadro antes del final.

export const FPS = 60;
export const DURATION = 7;

const T = {
  bgSwap: [0.2, 1.4] as const, // fondo del fotograma inicial → vídeo al 200 %
  pan: [0.6, 3.0] as const, // la cámara pasa a la segunda pantalla (logotipo)
  join: 0.05, // las nóminas arrancan antes que la cámara y ocupan su sitio en la doble hélice
  joinStagger: 0.03,
  joinDur: 1.1,
  cross: 1.9, // la primera cruza el portal
  gap: 0.11, // una pareja (las dos hebras) cada 0,11 s
  travel: 1.8, // s que tarda cada una en recorrer la hélice hasta el portal
  open: [1.1, 1.85] as const, // el rombo se abre al cielo antes de que llegue la primera
  zoom: [4.05, 5.85] as const, // la cámara atraviesa el portal cuando ya han pasado todas
  recede: 1.25, // s: constante con la que la hélice se aleja hacia el horizonte
  clean: 6.85, // a partir de aquí, cielo limpio
};
// Punto de fuga en el cielo (pantalla = cielo, que está fijo): algo por debajo del centro
const HORIZON = { x: 960, y: 610 };

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
// Doble hélice (como el ADN): dos hebras que giran alrededor de un eje horizontal que
// desemboca en el portal; al acercarse se estrecha para caber por el rombo y, ya en el
// cielo, sigue girando mientras se aleja hacia el horizonte.
// ---------------------------------------------------------------------------
const AXIS_LEN = 1700; // px del mundo, del extremo izquierdo del eje al portal
const R0 = 250; // radio de la hélice lejos del portal
const TURNS = 1.5; // vueltas a lo largo del eje
const SCALE_FAR = 0.12;
const SCALE_GATE = 0.05; // tamaño al cruzar el portal

const joinAt = (d: Doc) => T.join + d.order * T.joinStagger;
const crossAt = (d: Doc) => T.cross + Math.floor(d.order / 2) * T.gap; // por parejas
const strand = (d: Doc) => d.order % 2;

/** Ángulo y parámetro del eje (u < 0 antes del portal, u = 0 en el portal). */
const helixU = (d: Doc, t: number) => (t - crossAt(d)) / T.travel;
const helixAngle = (d: Doc, u: number) => 2 * Math.PI * TURNS * u + strand(d) * Math.PI;

/** Fase A: de la rejilla a su sitio en la hélice, que fluye hacia el portal (mundo). */
const phaseA = (d: Doc, t: number) => {
  const u = helixU(d, t);
  const th = helixAngle(d, u);
  const far = Math.min(1.6, -u);
  const R = R0 * (0.35 + 0.65 * far);
  const depth = Math.sin(th); // +1 delante, −1 detrás
  const hx = LOGO.x + u * AXIS_LEN + R * depth * 0.18;
  const hy = LOGO.y + R * Math.cos(th);
  const hs = lerp(SCALE_FAR, SCALE_GATE, Math.max(0, Math.min(1, u + 1))) * (1 + 0.3 * depth);
  const j = ramp(t, joinAt(d), joinAt(d) + T.joinDur, EIO);
  return {
    x: lerp(d.sx, hx, j),
    y: lerp(d.sy, hy, j),
    s: Math.exp(lerp(Math.log(DOC_K), Math.log(hs), j)),
    z: depth * j,
    alpha: lerp(1, 0.62 + 0.38 * (depth + 1) / 2, j),
    p: j,
  };
};

/** Peldaños de la hélice: une las dos nóminas de cada pareja (como las bases del ADN). */
const Rungs: React.FC<{ pts: { order: number; x: number; y: number; o: number }[]; width: number }> = ({ pts, width }) => {
  const byPair = new Map<number, { x: number; y: number; o: number }[]>();
  for (const p of pts) {
    const k = Math.floor(p.order / 2);
    byPair.set(k, [...(byPair.get(k) ?? []), p]);
  }
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {[...byPair.values()]
        .filter((v) => v.length === 2)
        .map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ffffff" strokeWidth={width} strokeLinecap="round" opacity={0.4 * Math.min(a.o, b.o)} />
        ))}
    </svg>
  );
};

/** Fase B: en el cielo (fijo: sus píxeles son los de pantalla). La hélice sigue girando
 *  y se aleja con perspectiva hacia el horizonte: radio y tamaño menguan a la vez. */
const phaseB = (d: Doc, t: number) => {
  const tt = t - crossAt(d);
  const c0 = camera(crossAt(d));
  const g = toScreen(c0, LOGO.x, LOGO.y);
  const f = Math.exp(-tt / T.recede);
  const th = helixAngle(d, tt / T.travel);
  const depth = Math.sin(th);
  const ax = HORIZON.x + (g.x - HORIZON.x) * f;
  const ay = HORIZON.y + (g.y - HORIZON.y) * f;
  const r = R0 * 0.35 * c0.z * f;
  const s = SCALE_GATE * c0.z * f * (1 + 0.3 * depth);
  const fade = Math.min(1, Math.max(0, (s * DOC.w - 6) / 9)); // se desvanece al hacerse pequeña
  // tras el portal el eje apunta hacia el fondo: la hélice se ve de frente, como un
  // anillo que gira mientras se aleja (el giro de perfil pasa a círculo con suavidad)
  const front = ramp(tt, 0, 0.7, EIO);
  const wx = lerp(0.18, 1, front);
  return { x: ax + r * depth * wx, y: ay + r * Math.cos(th), s, z: depth, alpha: fade * (0.62 + 0.38 * (depth + 1) / 2) };
};

export const PortalNominas: React.FC = () => {
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
            playbackRate={0.62}
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
            {t < T.clean ? (
              <Rungs
                width={2}
                pts={DOCS.filter((d) => t >= crossAt(d)).map((d) => {
                  const b = phaseB(d, t);
                  return { order: d.order, x: b.x, y: b.y, o: b.alpha };
                })}
              />
            ) : null}
            {t < T.clean
              ? DOCS.filter((d) => t >= crossAt(d))
                  .map((d) => ({ d, b: phaseB(d, t) }))
                  .sort((m, n) => m.b.z - n.b.z)
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
      <Rungs
        width={2.5 * cam.z}
        pts={DOCS.filter((d) => t < crossAt(d)).map((d) => {
          const a = phaseA(d, t);
          const p = toScreen(cam, a.x, a.y);
          return { order: d.order, x: p.x, y: p.y, o: a.p * a.p };
        })}
      />
      {DOCS.filter((d) => t < crossAt(d))
        .map((d) => ({ d, a: phaseA(d, t) }))
        .sort((m, n) => m.a.z - n.a.z)
        .map(({ d, a }) => {
        const p = toScreen(cam, a.x, a.y);
        const w = DOC.w * a.s * cam.z;
        const h = DOC.h * a.s * cam.z * lerp(DOC_Y, 1, a.p);
        return (
          <Img
            key={d.seed}
            src={staticFile("comeralia-portal/nomina.png")}
            style={{ ...IMG, left: p.x - w / 2, top: p.y - h / 2, width: w, height: h, opacity: a.alpha }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
