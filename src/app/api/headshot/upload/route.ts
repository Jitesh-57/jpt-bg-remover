import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = "landing";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const ext = mime.split("/")[1]?.split("+")[0] || "jpg";
    const path = `headshots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload directly to Supabase storage (server-side, no body size issue)
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": mime,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (uploadRes.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
      return NextResponse.json({ url: publicUrl });
    }

    // Fallback: return as base64 dataUrl if Supabase upload fails
    const base64 = buffer.toString("base64");
    return NextResponse.json({ url: `data:${mime};base64,${base64}` });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
