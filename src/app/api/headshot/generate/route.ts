import { NextRequest, NextResponse } from "next/server";
import { WOMEN_STYLES, MEN_STYLES } from "@/lib/headshot-prompts";
import axios from "axios";
import {
  createUserPixelbinClient,
  getPixelbinAuthHeader,
  getPixelbinToken,
} from "@/lib/headshot-pixelbin-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

function extractUrl(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  if (r.status !== "SUCCESS") return null;
  const output = r.output;
  if (!output) return null;
  if (Array.isArray(output)) {
    return (output.find((v) => typeof v === "string" && v.startsWith("http")) as string) ?? null;
  }
  if (typeof output === "object") {
    const o = output as Record<string, unknown>;
    if (typeof o.url === "string") return o.url;
    if (Array.isArray(o.urls)) return (o.urls.find((v) => typeof v === "string") as string) ?? null;
    for (const val of Object.values(o)) {
      if (typeof val === "string" && val.startsWith("http")) return val;
      if (Array.isArray(val)) {
        const found = val.find((v) => typeof v === "string" && (v as string).startsWith("http"));
        if (found) return found as string;
      }
    }
  }
  return null;
}

async function saveToPermanentStorage(tempUrl: string, name: string, apiToken: string): Promise<string> {
  const res = await axios.post(
    "https://api.pixelbin.io/service/platform/assets/v1.0/upload/url",
    { url: tempUrl, path: "headshots/generated", name, access: "public-read", overwrite: false },
    {
      headers: {
        Authorization: getPixelbinAuthHeader(apiToken),
        "Content-Type": "application/json",
      },
    }
  );
  return res.data?.url as string;
}

export async function POST(req: NextRequest) {
  const apiToken = getPixelbinToken(req);
  if (!apiToken) {
    return NextResponse.json({ error: "Connect your PixelBin account first" }, { status: 401 });
  }

  let imageUrl: string, styleIds: number[], gender: string;
  try {
    ({ imageUrl, styleIds, gender } = await req.json() as { imageUrl: string; styleIds: number[]; gender: string });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  if (!Array.isArray(styleIds) || styleIds.length === 0)
    return NextResponse.json({ error: "styleIds required" }, { status: 400 });

  const styleLibrary = gender === "men" ? MEN_STYLES : WOMEN_STYLES;
  const selectedStyles = styleLibrary.filter((s) => styleIds.includes(s.id));
  const pixelbin = createUserPixelbinClient(apiToken);

  const results = await Promise.allSettled(
    selectedStyles.map(async (style) => {
      const result = await pixelbin.predictions.createAndWait({
        name: "nanoBananaPro_generate",
        input: {
          prompt: style.prompt,
          image: imageUrl,
          aspect_ratio: "3:4",
          output_resolution: "1K",
        },
      });

      const tempUrl = extractUrl(result);
      console.log(`Style ${style.id} temp URL:`, tempUrl);
      if (!tempUrl) throw new Error(`No output URL for style ${style.id}`);

      // Save temporary prediction URL to permanent PixelBin storage
      const storageName = `headshot-${style.id}-${Date.now()}`;
      const permanentUrl = await saveToPermanentStorage(tempUrl, storageName, apiToken);
      console.log(`Style ${style.id} permanent URL:`, permanentUrl);

      return { id: style.id, name: style.name, tag: style.tag, url: permanentUrl || tempUrl };
    })
  );

  const images = results
    .filter((r): r is PromiseFulfilledResult<{ id: number; name: string; tag: string; url: string }> =>
      r.status === "fulfilled"
    )
    .map((r) => r.value);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason as Error).message);

  console.log(`Generate done: ${images.length} success, ${errors.length} failed`, errors);
  return NextResponse.json({ images, errors });
}
