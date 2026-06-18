import { NextResponse } from "next/server";
import { runPixelBinPrediction } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

// A small public test image (data URL, ~1px is too small for erase.bg, use a real photo)
const TEST_IMG = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    // Fetch a real test image and convert to data URL
    const imgRes = await fetch(TEST_IMG);
    const buf = await imgRes.arrayBuffer();
    const dataUrl = `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`;

    results["test_image_loaded"] = `${buf.byteLength} bytes`;

    // Run erase.bg via SDK
    const start = Date.now();
    const url = await runPixelBinPrediction(dataUrl, "erase", "bg");
    results["erase_bg_result_url"] = url;
    results["erase_bg_took_ms"] = Date.now() - start;
    results["success"] = true;
  } catch (e) {
    results["error"] = (e as Error).message;
    results["stack"] = (e as Error).stack?.slice(0, 500);
  }

  return NextResponse.json(results);
}
