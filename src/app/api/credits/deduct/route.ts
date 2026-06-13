import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { tool } = await req.json() as { tool?: string };

  // Only basic-upscale uses this endpoint; resize/adjust are always free
  if (tool !== "basic-upscale") {
    return NextResponse.json({ credits: session!.credits });
  }

  return withCredits({}, session!, "basic");
}
