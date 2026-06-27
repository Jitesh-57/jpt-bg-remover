/**
 * save-generation.ts — client helper to store a generated image in
 * "My Generations" (localStorage primary, server best-effort), matching the
 * schema used by the editor and headshot tools (jpt_gens_v1 + jpt_img_<id>).
 */

function resize(url: string, maxDim: number, quality: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Save a generated image to My Generations. */
export async function saveGeneration(opts: { url: string; tool: string; label: string }): Promise<void> {
  try {
    const [thumb, preview] = await Promise.all([resize(opts.url, 320, 0.7), resize(opts.url, 900, 0.82)]);
    if (!thumb) return;

    const id = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item = { id, tool: opts.tool, category: "generation" as const, label: opts.label, thumb, timestamp: Date.now() };

    try {
      const raw = localStorage.getItem("jpt_gens_v1");
      const existing = raw ? (JSON.parse(raw) as (typeof item)[]) : [];
      const updated = [item, ...existing.filter((i) => i.id !== id)].slice(0, 30);
      localStorage.setItem("jpt_gens_v1", JSON.stringify(updated));
    } catch { /* storage full */ }

    if (preview) {
      try { localStorage.setItem(`jpt_img_${id}`, preview); } catch { /* storage full */ }
    }

    fetch("/api/generations/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: opts.tool, category: "generation", label: opts.label, thumb }),
    }).catch(() => {});
  } catch { /* non-critical */ }
}
