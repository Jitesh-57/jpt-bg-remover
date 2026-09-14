import { NextRequest, NextResponse } from "next/server";
import { getSession, getToken } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Please sign in to manage your history." }, { status: 401 });

  const token = await getToken(req);
  if (!token) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

  const { fileId } = (await req.json()) as { fileId: string };
  if (!fileId) return NextResponse.json({ error: "Nothing was selected to delete." }, { status: 400 });

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "That item could not be deleted. Please try again." }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("History delete error:", e);
    return NextResponse.json({ error: "That item could not be deleted. Please try again." }, { status: 500 });
  }
}
