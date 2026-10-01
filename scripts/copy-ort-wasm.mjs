// Copies the onnxruntime-web runtime into public/ort/ for the in-browser
// watermark remover: the WebGPU/WebAssembly script (ort.webgpu.min.js), its
// .mjs loader and the .wasm binaries. The page loads them as a plain <script>
// from our own domain rather than through webpack, which mangles the
// runtime's own file loading. Runs before `next dev` and `next build`.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

// The package's "exports" map hides package.json, so locate it on disk.
const dist = join(process.cwd(), "node_modules", "onnxruntime-web", "dist");
const out = join(process.cwd(), "public", "ort");
mkdirSync(out, { recursive: true });
const files = readdirSync(dist).filter(
  (f) => f === "ort.webgpu.min.js" || f.endsWith(".wasm") || /^ort-wasm.*\.mjs$/.test(f),
);
for (const f of files) copyFileSync(join(dist, f), join(out, f));
console.log(`[copy-ort-wasm] ${files.length} files -> public/ort/`);
