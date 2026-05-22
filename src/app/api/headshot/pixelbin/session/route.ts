import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ connected: !!process.env.PIXELBIN_API_TOKEN });
}
