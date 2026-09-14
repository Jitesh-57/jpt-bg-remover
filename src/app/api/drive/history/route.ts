import { NextRequest, NextResponse } from "next/server";
import { getToken, getDriveFolderId, getSession, setSession } from "@/lib/google-drive";

export const runtime = "nodejs";

export interface DriveHistoryItem {
  id: string;
  name: string;
  createdTime: string;
  description?: string;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.json([]);
  const s = getSession(req);
  const token = await getToken(req);
  if (!token || !s) return NextResponse.json({ error: "Please sign in to see your saved images." }, { status: 401 });

  const folderId = await getDriveFolderId(token);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`);
  const fields = "files(id,name,createdTime,description)";
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=createdTime+desc&pageSize=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listRes.ok) return NextResponse.json({ error: "Google Drive could not be reached. Please try again in a moment." }, { status: 500 });

  const data = (await listRes.json()) as { files: DriveHistoryItem[] };
  const okRes = NextResponse.json(data.files || []);
  // Drive token refresh removed
  return okRes;
}
