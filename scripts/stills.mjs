// Renderiza fotogramas de control: node scripts/stills.mjs 1.2 3.8 ... (segundos)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import { enableTailwind } from "@remotion/tailwind-v4";

const secs = process.argv.slice(2).map(Number);
const scale = Number(process.env.SCALE ?? 0.5);
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  webpackOverride: (c) => enableTailwind(c),
});
const browser = await openBrowser("chrome");
const composition = await selectComposition({ serveUrl, id: process.env.COMP ?? "DiamaconAccountex", puppeteerInstance: browser });
for (const s of secs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const output = path.resolve(`out/check/${process.env.COMP ?? ""}t${String(s).replace(".", "_")}.png`);
  await renderStill({ composition, serveUrl, frame, output, scale, puppeteerInstance: browser, imageFormat: "png" });
  console.log("ok", s, output);
}
await browser.close({ silent: true });
