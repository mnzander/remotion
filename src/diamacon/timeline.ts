// Tiempos maestros (segundos globales). Las escenas se solapan en las
// transiciones: nunca hay un fotograma en el que una escena termine sin que
// la siguiente ya esté heredando su geometría o su movimiento.

export const SCENES = {
  hook: { start: 0, end: 8.6 }, // Contabilidad · Impuestos · Cumplimiento
  logo: { start: 8.6, end: 18.2 }, // Gema + Diamacon + claim
  unico: { start: 17.0, end: 27.4 }, // Un único programa
  world: { start: 27.4, end: 78.2 }, // Plano secuencia + Sin límite
  close: { start: 77.4, end: 92.0 }, // Claim final + CTA + retorno del loop
} as const;

// Plano secuencia (tiempo local de "world")
export type Stop = { rest: [number, number] };

export const STOPS: Stop[] = [
  { rest: [0, 6.8] }, // 01 Entrada de apuntes
  { rest: [8.0, 13.6] }, // 02 Punteo
  { rest: [14.8, 20.4] }, // 03 Importación
  { rest: [21.6, 28.2] }, // 04 Impresos oficiales
  { rest: [29.4, 35.2] }, // 05 Comunicación asesor–cliente
  { rest: [36.4, 42.2] }, // 06 Informes
];

export const WORLD = {
  overviewStart: 42.2,
  overviewEnd: 44.2,
  limitlessTextIn: 43.9,
  convergeStart: 49.2,
  end: 50.8,
} as const;
