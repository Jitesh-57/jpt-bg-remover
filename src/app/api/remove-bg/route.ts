import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const HF_TOKEN = process.env.HF_TOKEN;

// HuggingFace endpoints — ordered by reliability
// RMBG-2.0 and BiRefNet are dedicated bg-removal models (return true transparent PNG)
const HF_ENDPOINTS = [
  "https://router.huggingface.co/hf-inference/models/briaai/RMBG-2.0",
  "https://api-inference.huggingface.co/models/briaai/RMBG-2.0",
  "https://router.huggingface.co/hf-inference/models/ZhengPeng7/BiRefNet",
  "https://api-inference.huggingface.co/models/ZhengPeng7/BiRefNet",
];

async function removeBackground(
  imageData: string,
  mimeType: string
): Promise<{ data: string; mimeType: string } | null> {
  const imageBuffer = Buffer.from(imageData, "base64");

  const headers: Record<string, string> = {
    "Content-Type": "application/octet-stream",
  };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  for (const url of HF_ENDPOINTS) {
    try {
      console.log(`[remove-bg] Trying ${url}`);
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: imageBuffer,
        signal: AbortSignal.timeout(55000), // 55s — within Vercel's 60s limit
      });

      if (res.status === 503) {
        // Model is loading on HF — skip to next endpoint instead of waiting
        const body = await res.text().catch(() => "");
        console.log(`[remove-bg] 503 at ${url}: ${body.slice(0, 100)}`);
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.log(`[remove-bg] ${res.status} at ${url}: ${body.slice(0, 200)}`);
        continue;
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength < 500) {
        console.log(`[remove-bg] Empty/tiny response (${buf.byteLength}B) from ${url}`);
        continue;
      }

      console.log(`[remove-bg] ✓ Success from ${url} — ${buf.byteLength} bytes`);
      return { data: Buffer.from(buf).toString("base64"), mimeType: "image/png" };
    } catch (e) {
      console.log(`[remove-bg] Error at ${url}:`, (e as Error).message);
      continue;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { session, error } = checkAuth(req);
  if (error) return error;

  try {
    const { imageData, mimeType } = (await req.json()) as {
      imageData: string;
      mimeType: string;
    };
    if (!imageData) {
      return NextResponse.json({ error: "imageData required" }, { status: 400 });
    }

    const result = await removeBackground(imageData, mimeType || "image/jpeg");
    if (result) return withCredits(result, session!);

    return NextResponse.json(
      { error: "Background removal failed — AI model may be loading, please try again in 10 seconds." },
      { status: 500 }
    );
  } catch (err) {
    console.error("[remove-bg] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
