import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Diagnostic: lists which Gemini models this API key can use.
// Visit /api/debug-gemini after deploy to confirm the correct model name.
export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set in environment" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const json = await res.json() as { models?: { name: string; supportedGenerationMethods?: string[] }[] };

    if (!res.ok) {
      return NextResponse.json({ status: res.status, body: json }, { status: 200 });
    }

    // Only show models that support generateContent, with their short names
    const usable = (json.models || [])
      .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
      .map(m => m.name.replace("models/", ""));

    const imageCapable = usable.filter(n => n.includes("image") || n.includes("flash"));

    return NextResponse.json({
      keyPrefix: key.slice(0, 8),
      totalUsable: usable.length,
      imageOrFlashModels: imageCapable,
      allUsable: usable,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
