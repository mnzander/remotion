import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { D, EASE_IN, EASE_IN_OUT, EASE_OUT, EASE_SNAP, FPS, LEXEND, STIX, lerp, ramp, rand, settled } from "../theme";
import { STOPS, T } from "../timeline";
import { camera, toScreen } from "../world";
import { RevealLine } from "../../diamacon/components/Kinetic";
import { INNER, OUTLINE, segLength, segPoint } from "../../diamacon/gem";
import { IcLock } from "../components/UI";

// «Usuarios ilimitados»: en los vértices de la trama brotan usuarios conectados
// y la cámara se aleja hasta el infinito. Después, en la convergencia, cada
// usuario se pliega en un triángulo que vuela a su sitio en la gema.

const STEP = 960;
const M0 = -4;
const M1 = 30;
const N0 = -9;
const N1 = 9;
const X0 = 10560 - 14 * STEP;

type Node = { m: number; n: number; x: number; y: number; appear: number };
const FAR_CAM = camera(STOPS.users[0] + 0.01);

const NODES: Node[] = [];
for (let n = N0; n <= N1; n++) {
  for (let m = M0; m <= M1; m++) {
    const x = X0 + m * STEP;
    const y = n * STEP;
    const s = toScreen(FAR_CAM, x, y);
    if (s.x < -60 || s.x > 1980 || s.y < -60 || s.y > 1140) continue;
    const d = Math.hypot(s.x - 1180, s.y - 540);
    NODES.push({ m, n, x, y, appear: STOPS.diamacon[1] + 0.15 + (d / 1200) * 1.5 + rand(m * 31 + n) * 0.12 });
  }
}
const key = (m: number, n: number) => `${m}:${n}`;
const INDEX = new Map(NODES.map((q, i) => [key(q.m, q.n), i]));
const EDGES: [number, number][] = [];
NODES.forEach((q, i) => {
  for (const [dm, dn] of [
    [1, 0],
    [0, 1],
  ]) {
    const j = INDEX.get(key(q.m + dm, q.n + dn));
    if (j !== undefined) EDGES.push([i, j]);
  }
});

// Convergencia: puntos de destino repartidos por los trazos de la gema
export const GEM_C = { x: 960, y: 540 };
export const GEM_K = 420 / 444;
const TARGETS = (() => {
  const segs = [...OUTLINE, ...INNER];
  const lens = segs.map(segLength);
  const total = lens.reduce((a, b) => a + b, 0);
  const N = 120;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < N; i++) {
    let d = ((i + 0.5) / N) * total;
    let s = 0;
    while (d > lens[s]) {
      d -= lens[s];
      s++;
    }
    const p = segPoint(segs[s], d / lens[s]);
    out.push({ x: GEM_C.x + p.x * GEM_K, y: GEM_C.y + p.y * GEM_K });
  }
  return out;
})();
// Los usuarios más cercanos al centro son los que vuelan a la gema, emparejados por ángulo
const FLYERS = (() => {
  const byDist = NODES.map((q, i) => ({ i, s: toScreen(FAR_CAM, q.x, q.y) }))
    .sort((a, b) => Math.hypot(a.s.x - 960, a.s.y - 540) - Math.hypot(b.s.x - 960, b.s.y - 540))
    .slice(0, TARGETS.length);
  const ang = (x: number, y: number) => Math.atan2(y - 540, x - 960);
  const a = [...byDist].sort((p, q) => ang(p.s.x, p.s.y) - ang(q.s.x, q.s.y));
  const tg = TARGETS.map((p, k) => ({ p, k })).sort((p, q) => ang(p.p.x, p.p.y) - ang(q.p.x, q.p.y));
  const map = new Map<number, { x: number; y: number; order: number }>();
  a.forEach((f, j) => map.set(f.i, { ...tg[j].p, order: tg[j].k / TARGETS.length }));
  return map;
})();

export const CONVERGE_ARRIVE = (order: number) => T.converge[0] + 0.55 + order * 0.8;

export const UsersOverlay: React.FC = () => {
  const t = useCurrentFrame() / FPS + T.worldStart;
  if (t < STOPS.diamacon[1] || t > T.converge[1] + 0.2) return null;
  const cam = camera(t);
  const conv = T.converge[0];
  const netOut = ramp(t, conv, conv + 0.4, EASE_IN);
  const textIn = STOPS.users[0] - 0.5;
  const textOut = STOPS.users[1] - 0.3;
  const veil = ramp(t, STOPS.users[0] - 0.9, STOPS.users[0] - 0.1, EASE_OUT) * (1 - ramp(t, textOut, textOut + 0.5, EASE_IN));

  const pos = NODES.map((q) => toScreen(cam, q.x, q.y));
  const pop = NODES.map((q) => settled(ramp(t, q.appear, q.appear + 0.35, EASE_SNAP)));

  let lines = "";
  for (const [i, j] of EDGES) {
    if (pop[i] < 0.6 || pop[j] < 0.6) continue;
    lines += `M${pos[i].x.toFixed(1)} ${pos[i].y.toFixed(1)}L${pos[j].x.toFixed(1)} ${pos[j].y.toFixed(1)}`;
  }

  // pulsos de luz que recorren la red
  const pulses: React.ReactNode[] = [];
  if (t > STOPS.users[0] && netOut < 1) {
    for (let k = 0; k < 22; k++) {
      const e = EDGES[Math.floor(rand(k * 7.13) * EDGES.length)];
      const period = 1.0 + rand(k * 3.1) * 0.6;
      const ph = ((t - STOPS.users[0] + rand(k) * period) / period) % 1;
      const a = pos[e[0]];
      const b = pos[e[1]];
      pulses.push(<circle key={k} cx={lerp(a.x, b.x, ph)} cy={lerp(a.y, b.y, ph)} r={4} fill={D.white} opacity={Math.sin(Math.PI * ph) * (1 - netOut)} />);
    }
  }

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d={lines} stroke={D.white} strokeOpacity={0.55 * (1 - netOut)} strokeWidth={2} fill="none" />
        {pulses}
        {NODES.map((q, i) => {
          const a = pop[i];
          if (a <= 0) return null;
          const fly = FLYERS.get(i);
          let x = pos[i].x;
          let y = pos[i].y;
          let r = 15 * a;
          let morph = 0;
          let alpha = 1;
          if (fly) {
            const arrive = CONVERGE_ARRIVE(fly.order);
            const p = ramp(t, arrive - 0.6, arrive, EASE_IN_OUT);
            morph = ramp(t, arrive - 0.6, arrive - 0.35, EASE_OUT);
            x = lerp(x, fly.x, p);
            y = lerp(y, fly.y, p);
            r = lerp(r, 6, p);
            alpha = 1 - ramp(t, arrive - 0.05, arrive + 0.1);
          } else {
            alpha = 1 - netOut;
          }
          if (alpha <= 0) return null;
          const rot = morph * 225;
          return (
            <g key={i} opacity={alpha} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
              {morph < 1 ? (
                <g opacity={1 - morph}>
                  <circle r={r} fill={D.navy} />
                  <circle cy={-r * 0.25} r={r * 0.34} fill={D.teal} />
                  <path d={`M${-r * 0.55} ${r * 0.62}a${r * 0.55} ${r * 0.5} 0 0 1 ${r * 1.1} 0`} fill={D.teal} />
                  <circle cx={r * 0.78} cy={r * 0.72} r={r * 0.32} fill={D.white} stroke={D.navy} strokeWidth={1.5} />
                </g>
              ) : null}
              {morph > 0 ? (
                <path d={`M${-r} ${-r}L${r} ${-r}L${-r} ${r}Z`} fill={D.navy} opacity={morph} transform={`rotate(${rot})`} />
              ) : null}
            </g>
          );
        })}
      </svg>
      {/* Velo y texto */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, rgba(79,211,195,0.95) 0%, rgba(79,211,195,0.95) 46%, rgba(79,211,195,0) 68%)`,
          opacity: veil,
        }}
      />
      <div style={{ position: "absolute", left: 150, top: 0, height: 1080, display: "flex", flexDirection: "column", justifyContent: "center", color: D.navy }}>
        <div style={{ fontFamily: LEXEND, fontWeight: 600, fontSize: 128, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
          <RevealLine t={t} at={textIn} out={textOut} exit="down">
            Usuarios
          </RevealLine>
          <RevealLine t={t} at={textIn + 0.12} out={textOut + 0.04} exit="down">
            ilimitados.
          </RevealLine>
        </div>
        <div style={{ marginTop: 30, fontFamily: STIX, fontSize: 50, lineHeight: 1.2, maxWidth: 780 }}>
          <RevealLine t={t} at={textIn + 0.4} out={textOut + 0.08} exit="down">
            Sin límite de usuarios, equipos
          </RevealLine>
          <RevealLine t={t} at={textIn + 0.5} out={textOut + 0.1} exit="down">
            o puestos conectados.
          </RevealLine>
        </div>
        <div
          style={{
            marginTop: 34,
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 22px",
            borderRadius: 999,
            background: D.white,
            fontFamily: LEXEND,
            fontWeight: 500,
            fontSize: 26,
            opacity: settled(ramp(t, textIn + 0.9, textIn + 1.3, EASE_OUT)) * (1 - ramp(t, textOut, textOut + 0.35, EASE_IN)),
          }}
        >
          <IcLock size={26} /> Permisos de acceso por usuario
        </div>
      </div>
    </AbsoluteFill>
  );
};

