// One-off script: generate landing-page creative images via PixelBin nanoBananaPro.
// Run: node scripts/gen-landing-images.mjs
import { createRequire } from "module";
import { writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const { PixelbinConfig, PixelbinClient } = require("@pixelbin/admin");

// Load .env.local
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const apiSecret = process.env.PIXELBIN_API_TOKEN || process.env.PIXELBIN_ACCESS_KEY;
const client = new PixelbinClient(new PixelbinConfig({ domain: "https://api.pixelbin.io", apiSecret }));

const IMAGES = [
  { file: "hero-showcase", prompt: "Split-screen before and after photo editing showcase: left side a dull plain portrait photo, right side the same portrait with a vibrant cinematic sunset background, dramatic studio lighting, ultra realistic, high detail, professional photography. Clean modern composition." },
  { file: "feat-bg-removal", prompt: "Product photo of a stylish sneaker with background cleanly removed, transparent checkerboard pattern behind it, crisp clean edges, e-commerce style, studio lighting, ultra sharp." },
  { file: "feat-ai-edit", prompt: "A portrait photo being transformed by AI, magical glowing particles around it, half normal half enhanced with cinematic color grading, creative futuristic concept, vibrant." },
  { file: "feat-upscale", prompt: "Close-up comparison of a blurry low-resolution photo becoming sharp high-resolution 4K, crisp fine details, hair strands visible, professional quality enhancement." },
  { file: "feat-bg-generate", prompt: "A model portrait with a stunning AI-generated mountain sunset background, golden hour lighting, photorealistic, beautiful bokeh, professional photography." },
  { file: "feat-resize", prompt: "Creative flat-lay of one photo resized into multiple social media formats — Instagram square, story vertical, banner horizontal, clean modern design, soft gradient background." },
  { file: "feat-color", prompt: "A landscape photo with vivid color grading adjustments, before dull and after vibrant saturated colors, professional photo editing, split comparison." },
];

const outDir = new URL("../public/landing/", import.meta.url);
await mkdir(outDir, { recursive: true });

for (const { file, prompt } of IMAGES) {
  try {
    process.stdout.write(`Generating ${file}... `);
    const result = await client.predictions.createAndWait({
      name: "nanoBananaPro_generate",
      input: { prompt, aspect_ratio: "16:9", output_resolution: "1K" },
      options: { maxAttempts: 60, retryFactor: 1, retryInterval: 3000 },
    });
    if (result.status !== "SUCCESS") { console.log("FAILED", result.status, JSON.stringify(result.error || result.output).slice(0, 200)); continue; }
    // find URL
    const findUrl = (o) => {
      if (!o) return null;
      if (typeof o === "string") return o.startsWith("http") ? o : null;
      if (Array.isArray(o)) { for (const i of o) { const u = findUrl(i); if (u) return u; } return null; }
      if (typeof o === "object") { for (const v of Object.values(o)) { const u = findUrl(v); if (u) return u; } }
      return null;
    };
    const url = findUrl(result.output);
    if (!url) { console.log("NO URL", JSON.stringify(result.output).slice(0, 200)); continue; }
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(new URL(`${file}.png`, outDir), buf);
    console.log("OK", `${(buf.length / 1024).toFixed(0)}KB`);
  } catch (e) {
    console.log("ERROR", String(e).slice(0, 200));
  }
}
console.log("Done.");
