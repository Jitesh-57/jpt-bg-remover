import { NextRequest, NextResponse } from "next/server";
import { getSession, getToken } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const token = await getToken(req);
  if (!token) return NextResponse.json({ error: "Token expired" }, { status: 401 });

  try {
    // Query Google Drive for files in JPT folder
    const query = encodeURIComponent("name contains 'JPT-' and trashed=false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,webContentLink,webViewLink)&pageSize=50&orderBy=createdTime desc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return NextResponse.json({ error: "Drive query failed" }, { status: 500 });

    const data = (await res.json()) as { files: Array<{ id: string; name: string; createdTime: string; webContentLink: string; webViewLink: string }> };

    return NextResponse.json({
      history: data.files.map(f => ({
        id: f.id,
        name: f.name,
        createdTime: f.createdTime,
        downloadUrl: f.webContentLink,
        viewUrl: f.webViewLink,
      })),
    });
  } catch (e) {
    console.error("History list error:", e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
