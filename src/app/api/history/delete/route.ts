import { NextRequest, NextResponse } from "next/server";
import { getSession, getToken } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const token = await getToken(req);
  if (!token) return NextResponse.json({ error: "Token expired" }, { status: 401 });

  const { fileId } = (await req.json()) as { fileId: string };
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Delete failed" }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("History delete error:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
