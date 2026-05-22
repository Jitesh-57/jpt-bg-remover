import { NextRequest, NextResponse } from "next/server";
import FormDataNode from "form-data";
import axios from "axios";
import { getPixelbinAuthHeader, getPixelbinToken } from "@/lib/headshot-pixelbin-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const apiToken = getPixelbinToken(req);
    if (!apiToken) {
      return NextResponse.json({ error: "Connect your PixelBin account first" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `headshot-${Date.now()}.${ext}`;

    const form = new FormDataNode();
    form.append("file", buffer, { filename, contentType: file.type || "image/jpeg" });
    form.append("name", filename.replace(/\.[^.]+$/, ""));
    form.append("path", "headshots/uploads");
    form.append("access", "public-read");
    form.append("overwrite", "true");
    form.append("filenameOverride", "true");

    const res = await axios.post(
      "https://api.pixelbin.io/service/platform/assets/v1.0/upload/direct",
      form,
      {
        headers: {
          Authorization: getPixelbinAuthHeader(apiToken),
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const url = res.data?.url as string | undefined;
    if (!url) return NextResponse.json({ error: "No URL in PixelBin response" }, { status: 500 });

    return NextResponse.json({ url });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.error("PixelBin upload axios error:", err.response?.status, msg);
      return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
    }
    console.error("Upload route crashed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
