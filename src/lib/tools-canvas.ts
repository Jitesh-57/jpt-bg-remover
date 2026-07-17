// Shared, dependency-free canvas helpers used by both the single editor and the
// batch editor. Everything runs in the browser — no server, no cost.

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Rough byte size of a base64 data URL.
export function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor(b64.length * 3 / 4) - pad);
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// Center-crop to ratioW:ratioH. ratioH<=0 → circle crop (transparent corners).
export async function cropToAspectRatio(dataUrl: string, ratioW: number, ratioH: number): Promise<string> {
  const img = await loadImage(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const circle = ratioH <= 0;
  const targetRatio = circle ? 1 : ratioW / ratioH;
  let cw = W, ch = Math.round(W / targetRatio);
  if (ch > H) { ch = H; cw = Math.round(H * targetRatio); }
  const sx = Math.round((W - cw) / 2), sy = Math.round((H - ch) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  if (circle) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
  if (circle) ctx.restore();
  return canvas.toDataURL("image/png");
}

// Rotate by 0/90/180/270 and optionally mirror.
export async function rotateFlipImage(dataUrl: string, deg: number, flipH: boolean, flipV: boolean): Promise<string> {
  const img = await loadImage(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const swap = deg === 90 || deg === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? H : W;
  canvas.height = swap ? W : H;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -W / 2, -H / 2);
  const png = dataUrl.includes("image/png");
  return canvas.toDataURL(png ? "image/png" : "image/jpeg", 0.92);
}

// Re-encode as JPEG at a quality (0–1) to shrink file size.
export async function compressToJpeg(dataUrl: string, quality: number): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", Math.min(1, Math.max(0.05, quality)));
}

// Convert to a target format. PNG/WEBP keep transparency; JPG flattens to white.
export async function convertImageFormat(dataUrl: string, format: "png" | "jpeg" | "webp"): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(img, 0, 0);
  const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
  return canvas.toDataURL(mime, format === "png" ? undefined : 0.92);
}

export type WatermarkPosition = "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right" | "tiled";
export interface WatermarkOptions {
  text: string;
  position: WatermarkPosition;
  fontScale: number; // % of the image's smaller side (e.g. 5 = 5%)
  color: string;
  opacity: number;   // 0–1
}

// Draw a text watermark over the image.
export async function applyWatermark(dataUrl: string, opts: WatermarkOptions): Promise<string> {
  const img = await loadImage(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const text = opts.text || "© JPT AI";
  const fontPx = Math.max(10, Math.round((Math.min(W, H) * opts.fontScale) / 100));
  ctx.font = `700 ${fontPx}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = opts.color;
  ctx.globalAlpha = Math.min(1, Math.max(0.05, opts.opacity));
  // Subtle shadow so light text stays readable on light images.
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = Math.max(2, Math.round(fontPx / 8));

  const pad = Math.round(fontPx * 0.7);
  const metrics = ctx.measureText(text);
  const tw = metrics.width;

  if (opts.position === "tiled") {
    ctx.globalAlpha = Math.min(0.5, Math.max(0.05, opts.opacity));
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((-30 * Math.PI) / 180);
    const stepX = tw + fontPx * 4;
    const stepY = fontPx * 4;
    for (let y = -H; y < H; y += stepY) {
      for (let x = -W; x < W; x += stepX) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
    return canvas.toDataURL(dataUrl.includes("image/png") ? "image/png" : "image/jpeg", 0.92);
  }

  let x = pad, y = pad + fontPx / 2;
  ctx.textAlign = "left";
  switch (opts.position) {
    case "top-left":     x = pad;            y = pad + fontPx / 2;     ctx.textAlign = "left";   break;
    case "top-right":    x = W - pad;        y = pad + fontPx / 2;     ctx.textAlign = "right";  break;
    case "center":       x = W / 2;          y = H / 2;                ctx.textAlign = "center"; break;
    case "bottom-left":  x = pad;            y = H - pad - fontPx / 2; ctx.textAlign = "left";   break;
    case "bottom-right": x = W - pad;        y = H - pad - fontPx / 2; ctx.textAlign = "right";  break;
  }
  ctx.fillText(text, x, y);
  return canvas.toDataURL(dataUrl.includes("image/png") ? "image/png" : "image/jpeg", 0.92);
}

// Classic top/bottom meme text (Impact, white with black outline, uppercase).
export async function renderMeme(dataUrl: string, topText: string, bottomText: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const fontPx = Math.max(18, Math.round(W / 12));
  ctx.font = `800 ${fontPx}px Impact, Haettenschweiler, "Arial Narrow Bold", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, Math.round(fontPx / 12));

  const draw = (raw: string, y: number, baseline: CanvasTextBaseline) => {
    const text = (raw || "").toUpperCase();
    if (!text) return;
    ctx.textBaseline = baseline;
    // Wrap to fit width.
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > W * 0.92 && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    const lineH = fontPx * 1.1;
    lines.forEach((ln, i) => {
      const ly = baseline === "top" ? y + i * lineH : y - (lines.length - 1 - i) * lineH;
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "#fff";
      ctx.strokeText(ln, W / 2, ly);
      ctx.fillText(ln, W / 2, ly);
    });
  };

  const margin = Math.round(fontPx * 0.4);
  draw(topText, margin, "top");
  draw(bottomText, H - margin, "bottom");
  return canvas.toDataURL(dataUrl.includes("image/png") ? "image/png" : "image/jpeg", 0.92);
}
