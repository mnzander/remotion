// Genera los contornos vectoriales de las palabras del túnel en Lexend Bold (700)
// con espaciado entre caracteres reducido.
// Uso: node scripts/gen-word-paths.mjs
import fs from "node:fs";
import opentype from "opentype.js";

const WORDS = ["Control", "Organización", "Seguridad", "Facturación", "Gestión", "Planificación", "Coordinación", "Orden"];
const SIZE = 100; // unidades de mundo por em
const WEIGHT = 700; // Lexend Bold
const TRACKING = -30; // milésimas de em, como el panel Carácter de Photoshop/Illustrator
const font = opentype.loadSync(`node_modules/@fontsource/lexend/files/lexend-latin-${WEIGHT}-normal.woff`);
const capHeight = (font.tables.os2.sCapHeight / font.unitsPerEm) * SIZE;

const out = WORDS.map((text) => {
  const path = font.getPath(text, 0, 0, SIZE, { kerning: true, tracking: TRACKING });
  const bb = path.getBoundingBox();
  return { text, d: path.toPathData(2), width: +(bb.x2 - bb.x1).toFixed(2), x1: +bb.x1.toFixed(2) };
});

const ts = `// Generado por scripts/gen-word-paths.mjs — contornos de Lexend Bold (${WEIGHT}), tracking ${TRACKING}.
// Unidades: 1 em = ${SIZE}; línea base en y = 0.
export const CAP_HEIGHT = ${capHeight.toFixed(2)};
export const WORD_PATHS: { text: string; d: string; width: number; x1: number }[] = ${JSON.stringify(out, null, 2)};
`;
fs.writeFileSync("src/tunel/wordPaths.ts", ts);
console.log("ok", out.map((w) => `${w.text}:${w.width}`).join(" "), "cap", capHeight.toFixed(1));
