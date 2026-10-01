// Tiempos maestros (segundos globales) · v3 (revisión del usuario, 2026-09-28):
// inicio con la trama, gema más suave, transición a la trama por volteo de
// teselas y pantallas más pausadas en el primer minuto.
// Las escenas se solapan en cada transición: nunca hay un fotograma en el que
// una escena termine sin que la siguiente herede su forma, su objeto o su cámara.

export const T = {
  // Acto 1 · Gancho: la trama se despliega desde el centro
  revealIn: [0.35, 2.7] as const,
  hookLine1: 1.2,
  hookLine2: 1.75,
  hookSub: 2.6,
  hookOut: 7.4,
  revealOut: [7.7, 9.1] as const, // la trama se repliega hacia el rombo central
  sweeps: [4.3, 6.0] as const, // destellos por la trama mientras se lee
  // La gema se dibuja desde el rombo
  gemDraw: [9.2, 10.7] as const,
  gemGlint1: 10.8,
  toLock: [11.0, 11.8] as const,
  wordAt: 11.35,
  claimAt: 12.0,
  claimOut: 17.2,
  gemGlint2: 15.0,
  // La gema es la trama
  toCenter: [17.2, 17.9] as const,
  facetsOut: [17.6, 18.5] as const, // las facetas se recogen hacia el rombo
  straighten: [18.3, 18.8] as const,
  tramaIn: [18.6, 20.2] as const, // la trama vuelve a desplegarse desde el rombo
  pullBack: [20.2, 21.1] as const,
  flyToFirst: [21.1, 22.4] as const,
  // Mundo
  worldStart: 20.1,
  worldEnd: 103.6,
  // Acto 4 · cierre
  converge: [101.8, 103.4] as const,
  claimFinal: 103.4,
  claimFinalOut: 109.15,
  ctaAt: 109.2,
  loopOut: 116.8,
  end: 118.2,
} as const;

// Paradas del plano secuencia (reposo de cámara, segundos globales)
export const STOPS = {
  g1: [22.4, 31.2],
  g2: [32.6, 41.4],
  g3: [42.8, 51.6],
  giro: [53.0, 61.8], // vista general (pull-back)
  f4: [63.2, 73.2],
  f5: [74.6, 81.6],
  f6: [83.0, 90.0],
  diamacon: [91.2, 96.0], // vista general (pull-back)
  users: [97.0, 101.8], // red de usuarios (alejamiento)
} as const;

// Llegada de las tres fichas del punto de giro a la factura (una cada 0,6 s)
export const TOKEN_ARRIVE = [56.4, 57.0, 57.6];
