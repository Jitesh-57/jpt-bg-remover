import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/google-drive";

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ authenticated: false });
  return NextResponse.json({ authenticated: true, email: s.email, name: s.name, picture: s.picture });
}
