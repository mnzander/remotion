import React from "react";
import { AbsoluteFill, Html5Audio, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Lexend";
import { EASE_BACK, EASE_IN, EASE_IO, EASE_OUT, FPS, K, T, lerp, ramp, rand } from "./timeline";

const LEXEND = loadFont("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily;

// Comeralia es el Sol y sus cuatro programas son los planetas: un único universo
// ordenado y conectado. Los discos, el símbolo y el logotipo son las imágenes de
// referencia sin redibujar (public/brand/comeralia, preparadas con
// scripts/prep-comeralia.py); el monograma de cada planeta va en una capa propia
// para que quede siempre de cara a cámara y nítido sobre la esfera sombreada.

const C = { x: 960, y: 540 }; // centro de pantalla (cierre de marca)
const PLANET_D = 104;
const DC = 2600; // distancia de cámara (unidades de pantalla)
const SUN_2D = { x: 1660, y: 540 }; // en el plano, el Sol a la derecha

// Radios con 300 px entre órbitas: en el plano los planetas quedan alineados a
// la izquierda del Sol, sobre el eje horizontal central, bien separados.
const PLANETS = [
  { name: "diamaweb", R: 380, w: 1.45 },
  { name: "diamalab", R: 680, w: 0.98 },
  { name: "diamages", R: 980, w: 0.66 },
  { name: "diamacon", R: 1280, w: 0.42 },
] as const;

// ---------------------------------------------------------------------------
// Cámara: cenital (2D) → inclinada 60° con arco orbital
// ---------------------------------------------------------------------------
// Al inclinarse, la cámara también se retira y centra el Sol: el sistema entero
// cabe en pantalla con perspectiva.
type Cam = { e: number; a: number; zoom: number; sx: number; sy: number; size: number };
const cameraAt = (t: number): Cam => {
  const tp = ramp(t, T.tilt[0], T.tilt[1], EASE_IO);
  const back = ramp(t, T.converge, T.absorb[3], EASE_IO);
  return {
    e: (lerp(90, 30, tp) * Math.PI) / 180,
    a: (50 * ramp(t, T.arc[0], T.arc[1], EASE_IO) * Math.PI) / 180,
    zoom: lerp(1, 0.56, tp),
    sx: lerp(SUN_2D.x, C.x, tp),
    sy: lerp(lerp(SUN_2D.y, 440, tp), C.y, back),
    size: lerp(1, 0.8, tp),
  };
};

/** Proyección de un punto del plano orbital (x, z) a pantalla, con perspectiva. */
const proj = (cam: Cam, x0: number, z0: number) => {
  const x = x0 * cam.zoom;
  const z = z0 * cam.zoom;
  const xr = x * Math.cos(cam.a) - z * Math.sin(cam.a);
  const zr = x * Math.sin(cam.a) + z * Math.cos(cam.a);
  const depth = DC - zr * Math.cos(cam.e);
  const s = DC / depth;
  return { x: cam.sx + xr * s, y: cam.sy + zr * Math.sin(cam.e) * s, s, depth };
};

// ---------------------------------------------------------------------------
// Movimiento orbital y espiral de convergencia
// ---------------------------------------------------------------------------
const spiral = (i: number, t: number) => ramp(t, T.converge, T.absorb[i], EASE_IN);
/** Recorrido angular: alineados (0) hasta la transición; después arrancan con suavidad. */
const orbitTravel = (t: number) => {
  const x = t - T.tilt[0];
  if (x <= 0) return 0;
  return x < 1.5 ? (x * x) / 3 : 0.75 + (x - 1.5);
};
const planetPos = (i: number, t: number) => {
  const p = PLANETS[i];
  const k = spiral(i, t);
  const th = Math.PI + p.w * orbitTravel(t) + 2.4 * k * k;
  const r = p.R * (1 - k);
  return { x: r * Math.cos(th), z: r * Math.sin(th), k };
};

// ---------------------------------------------------------------------------
// Campo de estrellas en 3 capas (posiciones fijas y deterministas)
// ---------------------------------------------------------------------------
type Star = { x: number; y: number; r: number; o: number; tw: number; ph: number; streak: boolean };
const makeLayer = (n: number, seed: number, r0: number, r1: number, o0: number, o1: number, streakShare: number) =>
  Array.from({ length: n }, (_, i): Star => {
    const s = seed + i * 7.31;
    // distribución irregular: mezcla de uniforme y ligeros cúmulos
    const cx = rand(s + 1) * 2320 - 200;
    const cy = rand(s + 2) * 1480 - 200;
    const jitter = rand(s + 3) < 0.3 ? (rand(s + 4) - 0.5) * 60 : 0;
    return {
      x: cx + jitter,
      y: cy + jitter * 0.7,
      r: lerp(r0, r1, rand(s + 5) ** 2),
      o: lerp(o0, o1, rand(s + 6)),
      tw: rand(s + 7) < 0.06 ? 3 + rand(s + 8) * 2.5 : 0, // unas pocas titilan, muy despacio
      ph: rand(s + 9) * Math.PI * 2,
      streak: rand(s + 10) < streakShare,
    };
  });
const LAYERS = [
  { stars: makeLayer(950, 11, 0.45, 0.95, 0.2, 0.4, 0), fade: T.starsFar, px: 0.35, py: 0.25, pp: 0.03, halo: false },
  { stars: makeLayer(190, 23, 0.8, 1.3, 0.45, 0.75, 0), fade: T.starsMid, px: 1.3, py: 0.9, pp: 0.08, halo: false },
  { stars: makeLayer(42, 37, 1.3, 2.1, 0.8, 1.0, 1), fade: T.starsNear, px: 3.0, py: 2.2, pp: 0.16, halo: true },
];

const Starfield: React.FC<{ t: number; cam: Cam }> = ({ t, cam }) => {
  const aDeg = (cam.a * 180) / Math.PI;
  const tiltDeg = 90 - (cam.e * 180) / Math.PI;
  const stretch = 0.11 * ramp(t, T.converge + 0.6, T.absorb[3], EASE_IN);
  const out = 1 - ramp(t, T.whiteOut[0] + 0.1, T.whiteOut[1], EASE_IN);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {LAYERS.map((L, li) => {
        const f = ramp(t, L.fade[0], L.fade[1], EASE_IO) * out;
        if (f <= 0) return null;
        const dx = -aDeg * L.px + (cam.sx - SUN_2D.x) * L.pp;
        const dy = tiltDeg * L.py;
        return (
          <g key={li}>
            {L.stars.map((s, i) => {
              const x = s.x + dx;
              const y = s.y + dy;
              if (x < -20 || x > 1940 || y < -20 || y > 1100) return null;
              const tw = s.tw ? 0.7 + 0.3 * Math.sin((t / s.tw) * Math.PI * 2 + s.ph) : 1;
              const o = s.o * f * tw;
              if (s.streak && stretch > 0.002) {
                const ex = x + (x - cam.sx) * stretch;
                const ey = y + (y - cam.sy) * stretch;
                return <line key={i} x1={x} y1={y} x2={ex} y2={ey} stroke={K.white} strokeWidth={s.r} strokeLinecap="round" opacity={o * 0.85} />;
              }
              return (
                <g key={i}>
                  {L.halo ? <circle cx={x} cy={y} r={s.r * 3.2} fill={K.white} opacity={o * 0.12} /> : null}
                  <circle cx={x} cy={y} r={s.r} fill={K.white} opacity={o} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Órbitas y estelas
// ---------------------------------------------------------------------------
const orbitPath = (cam: Cam, R: number) => {
  let d = "";
  for (let k = 0; k <= 240; k++) {
    const th = Math.PI + (k / 240) * Math.PI * 2;
    const p = proj(cam, R * Math.cos(th), R * Math.sin(th));
    d += `${k ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
};

const Orbits: React.FC<{ t: number; cam: Cam }> = ({ t, cam }) => {
  const out = 1 - ramp(t, T.orbitsOut[0], T.orbitsOut[1], EASE_IO);
  if (out <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {PLANETS.map((p, i) => {
        const draw = ramp(t, T.orbitsDraw[0] + i * 0.12, T.orbitsDraw[1] + i * 0.12, EASE_IO);
        if (draw <= 0) return null;
        const d = orbitPath(cam, p.R);
        // trazo luminoso que recorre la órbita en el sentido de los planetas
        const phase = (0.06 * t * (1 + 0.25 * i) + 0.2 * i) % 1;
        const tracer = ramp(t, T.orbitsDraw[1], T.orbitsDraw[1] + 0.6) * out;
        return (
          <g key={p.name}>
            <path d={d} fill="none" stroke={K.teal} strokeWidth={1.6} opacity={0.42 * out} pathLength={1} strokeDasharray={`${draw} 2`} />
            {tracer > 0 ? (
              <>
                <path d={d} fill="none" stroke={K.teal} strokeWidth={6} opacity={0.18 * tracer} pathLength={1} strokeLinecap="round" strokeDasharray="0.05 0.95" strokeDashoffset={-phase} />
                <path d={d} fill="none" stroke={K.white} strokeWidth={2} opacity={0.75 * tracer} pathLength={1} strokeLinecap="round" strokeDasharray="0.05 0.95" strokeDashoffset={-phase} />
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

const Trails: React.FC<{ t: number; cam: Cam }> = ({ t, cam }) => {
  if (t < T.converge) return null;
  const N = 16;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {PLANETS.map((p, i) => {
        if (t > T.absorb[i] + 0.35) return null;
        const pts = Array.from({ length: N }, (_, k) => {
          const tk = Math.max(T.converge, t - k * 0.028);
          const q = planetPos(i, Math.min(tk, T.absorb[i]));
          return proj(cam, q.x, q.z);
        });
        const fade = 1 - ramp(t, T.absorb[i], T.absorb[i] + 0.35);
        return (
          <g key={p.name}>
            {pts.slice(1).map((q, k) => (
              <line
                key={k}
                x1={pts[k].x}
                y1={pts[k].y}
                x2={q.x}
                y2={q.y}
                stroke={K.teal}
                strokeWidth={(7 - (k * 5) / N) * pts[k].s}
                strokeLinecap="round"
                opacity={(1 - k / N) * 0.75 * fade}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Planeta: disco de referencia + sombreado esférico + monograma siempre de cara
// ---------------------------------------------------------------------------
const Planet: React.FC<{ i: number; t: number; cam: Cam }> = ({ i, t, cam }) => {
  const p = PLANETS[i];
  const q = planetPos(i, t);
  const s = proj(cam, q.x, q.z);
  const pop = ramp(t, T.planetsIn[i], T.planetsIn[i] + 0.7, EASE_BACK);
  const gone = ramp(t, T.absorb[i] - 0.1, T.absorb[i] + 0.03);
  if (pop <= 0 || gone >= 1) return null;
  const size = PLANET_D * s.s * cam.size * pop * (1 - 0.4 * q.k);
  const sphere = ramp(t, T.sphere[0], T.sphere[1], EASE_IO);
  // luz direccional desde el Sol (en pantalla)
  const lx = cam.sx - s.x;
  const ly = cam.sy - s.y;
  const ll = Math.hypot(lx, ly) || 1;
  const ux = lx / ll;
  const uy = ly / ll;
  const blur = sphere * Math.max(0, Math.min(2.4, (1.0 - s.s) * 11));
  const rim = Math.max(1, size * 0.02);
  return (
    <div
      style={{
        position: "absolute",
        left: s.x - size / 2,
        top: s.y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        opacity: 1 - gone,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
        boxShadow: `0 0 0 ${rim}px rgba(255,255,255,0.8), 0 0 ${size * 0.14}px rgba(255,255,255,${0.28 + 0.12 * sphere})`,
      }}
    >
      <Img src={staticFile(`brand/comeralia/planet-${p.name}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {sphere > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            opacity: sphere,
            background: `radial-gradient(circle at ${50 + 32 * ux}% ${50 + 32 * uy}%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 38%, rgba(5,7,15,0) 48%, rgba(5,7,15,0.58) 100%)`,
          }}
        />
      ) : null}
      <Img src={staticFile(`brand/comeralia/letters-${p.name}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// El Sol: núcleo de luz blanca con el símbolo de Comeralia
// ---------------------------------------------------------------------------
const SYMBOL_W = 104;
const LOGO_W = 1000;
const LOGO_SRC = { w: 1432, h: 292, symbolEnd: 300 };
const LOGO_K = LOGO_W / LOGO_SRC.w;
const LOGO_H = LOGO_SRC.h * LOGO_K;
const LOGO_LEFT = C.x - LOGO_W / 2;
const LOGO_TOP = C.y - LOGO_H / 2;
const LOGO_SYMBOL = { x: LOGO_LEFT + (287 * LOGO_K) / 2, w: 287 * LOGO_K };

const sunState = (t: number) => {
  const inP = ramp(t, T.sunIn[0], T.sunIn[1], EASE_OUT);
  const absorbed = T.absorb.reduce((acc, a) => acc + ramp(t, a - 0.05, a + 0.3, EASE_OUT), 0);
  const expand = ramp(t, T.whiteOut[0], T.whiteOut[1], EASE_IN);
  const R = 78 * inP + 8 * absorbed + expand * 1450;
  // pulsos de luz: aparición y cada absorción
  let pulse = Math.exp(-Math.max(0, t - T.sunIn[0] - 0.25) * 3) * (t > T.sunIn[0] ? 1 : 0);
  for (const a of T.absorb) pulse += t > a - 0.05 ? Math.exp(-(t - a + 0.05) * 5) : 0;
  return { inP, R, pulse, expand };
};

const Sun: React.FC<{ t: number }> = ({ t }) => {
  const c = cameraAt(t);
  const s = sunState(t);
  if (s.inP <= 0) return null;
  const glowR = s.R * 3.4 + 40;
  return (
    <>
      {/* halo y corona */}
      <div
        style={{
          position: "absolute",
          left: c.sx - glowR,
          top: c.sy - glowR,
          width: glowR * 2,
          height: glowR * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,${0.42 + 0.3 * s.pulse}) 0%, rgba(255,255,255,${0.12 + 0.1 * s.pulse}) 32%, rgba(79,211,196,0.05) 55%, rgba(79,211,196,0) 72%)`,
          opacity: s.inP,
        }}
      />
      {/* núcleo */}
      <div
        style={{
          position: "absolute",
          left: c.sx - s.R * 1.45,
          top: c.sy - s.R * 1.45,
          width: s.R * 2.9,
          height: s.R * 2.9,
          borderRadius: "50%",
          background: `radial-gradient(circle, #FFFFFF 0%, #FFFFFF ${lerp(58, 80, s.expand)}%, rgba(255,255,255,0.55) ${lerp(72, 90, s.expand)}%, rgba(255,255,255,0) 100%)`,
        }}
      />
    </>
  );
};

/** Símbolo (REF-1) sobre el núcleo; al final se desplaza a su sitio en el logotipo. */
const SYMBOL_OVER = T.whiteOut[1] - 0.2; // desde aquí el símbolo pasa por encima del blanco
const SunSymbol: React.FC<{ t: number; over?: boolean }> = ({ t, over = false }) => {
  const c = cameraAt(t);
  const s = sunState(t);
  if (s.inP <= 0 || (over ? t < SYMBOL_OVER : t >= SYMBOL_OVER)) return null;
  const move = ramp(t, T.symbolToLogo[0], T.symbolToLogo[1], EASE_IO);
  const handoff = ramp(t, T.symbolToLogo[1] - 0.12, T.symbolToLogo[1] + 0.12);
  const w = lerp(SYMBOL_W * lerp(0.6, 1, s.inP), LOGO_SYMBOL.w, move);
  const x = lerp(c.sx, LOGO_SYMBOL.x, move);
  const y = lerp(c.sy, C.y, move);
  if (handoff >= 1) return null;
  return (
    <Img
      src={staticFile("brand/comeralia/symbol.png")}
      style={{ position: "absolute", left: x - w / 2, top: y - (w * 447) / 444 / 2, width: w, opacity: s.inP * (1 - handoff) }}
    />
  );
};

/** Logotipo oficial (REF-2): símbolo y palabra, revelada de izquierda a derecha. */
const Logo: React.FC<{ t: number }> = ({ t }) => {
  const handoff = ramp(t, T.symbolToLogo[1] - 0.12, T.symbolToLogo[1] + 0.12);
  const word = ramp(t, T.wordmark[0], T.wordmark[1], EASE_OUT);
  if (handoff <= 0 && word <= 0) return null;
  const splitPct = (LOGO_SRC.symbolEnd / LOGO_SRC.w) * 100;
  const img = { position: "absolute" as const, left: 0, top: 0, width: LOGO_W, height: LOGO_H };
  return (
    <div style={{ position: "absolute", left: LOGO_LEFT, top: LOGO_TOP, width: LOGO_W, height: LOGO_H }}>
      <Img src={staticFile("brand/comeralia/logo.png")} style={{ ...img, opacity: handoff, clipPath: `inset(0 ${100 - splitPct}% 0 0)` }} />
      <Img
        src={staticFile("brand/comeralia/logo.png")}
        style={{
          ...img,
          opacity: word,
          top: (1 - word) * 14,
          clipPath: `inset(-10% ${(1 - word) * (100 - splitPct)}% -10% ${splitPct}%)`,
        }}
      />
    </div>
  );
};

/** Ondas de luz: aparición del Sol, absorciones y fundido a blanco. */
const Waves: React.FC<{ t: number }> = ({ t }) => {
  const c = cameraAt(t);
  const s = sunState(t);
  const rings: { r: number; o: number; w: number; c: string }[] = [];
  const w1 = ramp(t, T.wave1[0], T.wave1[1], EASE_OUT);
  if (w1 > 0 && w1 < 1) rings.push({ r: lerp(80, 560, w1), o: 0.4 * (1 - w1), w: 2, c: K.white });
  T.absorb.forEach((a) => {
    const p = ramp(t, a - 0.05, a + 0.45, EASE_OUT);
    if (p > 0 && p < 1) rings.push({ r: s.R + 12 + 90 * p, o: 0.55 * (1 - p), w: 2.5, c: K.teal });
  });
  const wf = ramp(t, T.whiteOut[0], T.whiteOut[1] + 0.1, EASE_OUT);
  if (wf > 0 && wf < 1) rings.push({ r: lerp(100, 1500, wf), o: 0.85 * (1 - wf), w: 9, c: K.teal });
  if (!rings.length) return null;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {rings.map((r, i) => (
        <circle key={i} cx={c.sx} cy={c.sy} r={r.r} fill="none" stroke={r.c} strokeWidth={r.w} opacity={r.o} />
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// «todo integrado»: texto que orbita en el hueco entre Diamages y Diamacon
// ---------------------------------------------------------------------------
const TEXT = "todo integrado";
const TEXT_R = (PLANETS[2].R + PLANETS[3].R) / 2; // línea media del hueco
const TEXT_T = { in: [7.0, 8.6] as const, out: [9.55, 10.6] as const };

/** Ángulo del centro del texto: recorre el arco delantero en el sentido de los planetas. */
const textAngle = (t: number, cam: Cam) =>
  Math.PI / 2 - cam.a + lerp(-0.3, 0.42, ramp(t, TEXT_T.in[0], TEXT_T.out[1], (x) => x));

const textDepth = (t: number, cam: Cam) => {
  const th = textAngle(t, cam);
  return proj(cam, TEXT_R * Math.cos(th), TEXT_R * Math.sin(th)).depth;
};

const OrbitText: React.FC<{ t: number; cam: Cam }> = ({ t, cam }) => {
  if (t < TEXT_T.in[0] || t > TEXT_T.out[1]) return null;
  // aparición y salida suaves: letra a letra, con fundido y un desenfoque que se aclara
  const n = TEXT.length;
  const inSpan = TEXT_T.in[1] - TEXT_T.in[0];
  const outSpan = TEXT_T.out[1] - TEXT_T.out[0];
  const letterIn = (i: number) => {
    const a0 = TEXT_T.in[0] + (i / n) * inSpan * 0.45;
    return ramp(t, a0, a0 + inSpan * 0.55, EASE_IO);
  };
  const letterOut = (i: number) => {
    const a0 = TEXT_T.out[0] + (i / n) * outSpan * 0.4;
    return ramp(t, a0, a0 + outSpan * 0.6, EASE_IO);
  };
  const blur =
    5 * (1 - ramp(t, TEXT_T.in[0], TEXT_T.in[1], EASE_OUT)) + 5 * ramp(t, TEXT_T.out[0], TEXT_T.out[1], EASE_IN);
  const th = textAngle(t, cam);
  // trayecto: la elipse proyectada de la línea media, recorrida de izquierda a derecha
  const pts = Array.from({ length: 121 }, (_, k) => {
    const u = th + lerp(1.0, -1.0, k / 120);
    return proj(cam, TEXT_R * Math.cos(u), TEXT_R * Math.sin(u));
  });
  if (pts[0].x > pts[pts.length - 1].x) pts.reverse();
  const d = pts.map((q, k) => `${k ? "L" : "M"}${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join("");
  const c = proj(cam, TEXT_R * Math.cos(th), TEXT_R * Math.sin(th));
  // tamaño por perspectiva: 84 px cuando está delante del todo (s ≈ 1,27)
  const size = 84 * (c.s / 1.267) * cam.size / 0.8;
  const id = "orbitText";
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <path id={id} d={d} />
        <filter id="orbitTextBlur" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>
      <text
        fontFamily={LEXEND}
        fontWeight={500}
        fontSize={size}
        letterSpacing={size * 0.01}
        fill={K.white}
        dominantBaseline="central"
        textAnchor="middle"
        filter={blur > 0.05 ? "url(#orbitTextBlur)" : undefined}
      >
        <textPath href={`#${id}`} startOffset="50%">
          {TEXT.split("").map((ch, i) => (
            <tspan key={i} fillOpacity={letterIn(i) * (1 - letterOut(i))}>
              {ch}
            </tspan>
          ))}
        </textPath>
      </text>
    </svg>
  );
};

export const SistemaSolar: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const cam = cameraAt(t);
  const white = ramp(t, T.whiteOut[1] - 0.2, T.whiteOut[1], EASE_IO);

  // orden de pintado por profundidad: el Sol está en el centro (profundidad DC)
  const order = PLANETS.map((_, i) => {
    const q = planetPos(i, t);
    return { i, depth: proj(cam, q.x, q.z).depth };
  }).sort((a, b) => b.depth - a.depth);
  const behind = order.filter((o) => o.depth > DC);
  const front = order.filter((o) => o.depth <= DC);
  // el texto se intercala por profundidad con los planetas que tiene delante o detrás
  const dText = textDepth(t, cam);
  const frontFar = front.filter((o) => o.depth > dText);
  const frontNear = front.filter((o) => o.depth <= dText);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, ${K.spaceCenter} 0%, ${K.space} 62%)` }}>
      <Starfield t={t} cam={cam} />
      <Orbits t={t} cam={cam} />
      <Trails t={t} cam={cam} />
      {behind.map((o) => (
        <Planet key={o.i} i={o.i} t={t} cam={cam} />
      ))}
      <Sun t={t} />
      <SunSymbol t={t} />
      {frontFar.map((o) => (
        <Planet key={o.i} i={o.i} t={t} cam={cam} />
      ))}
      <OrbitText t={t} cam={cam} />
      {frontNear.map((o) => (
        <Planet key={o.i} i={o.i} t={t} cam={cam} />
      ))}
      <Waves t={t} />
      <AbsoluteFill style={{ background: K.white, opacity: white }} />
      <SunSymbol t={t} over />
      <Logo t={t} />
      <Html5Audio src={staticFile("sfx/comeralia-sistema.wav")} />
    </AbsoluteFill>
  );
};
