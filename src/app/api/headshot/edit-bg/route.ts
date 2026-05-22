import { NextRequest, NextResponse } from "next/server";
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
    { url: tempUrl, path: "headshots/edited", name, access: "public-read", overwrite: false },
    {
      headers: {
        Authorization: getPixelbinAuthHeader(apiToken),
        "Content-Type": "application/json",
      },
    }
  );
  return res.data?.url as string;
}

const NO_SHADOW_INSTRUCTIONS =
  "Do not add any new shadows, drop shadows, cast shadows, contact shadows, glow, vignette, halo, dark edge, or artificial grounding effect. " +
  "Do not darken the background around the person. Blend the person cleanly with natural edges only.";

export async function POST(req: NextRequest) {
  const apiToken = getPixelbinToken(req);
  if (!apiToken) {
    return NextResponse.json({ error: "Connect your PixelBin account first" }, { status: 401 });
  }

  const { imageUrl, bgType, bgColor, bgImageUrl, bgLabel, customPrompt } = await req.json();

  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  let prompt: string;
  let imageInput: string | string[];

  if (bgType === "color") {
    const colorName = bgLabel || bgColor || "white";
    prompt =
      `Take the person from the reference photo and place them in front of a solid ${colorName} color background. ` +
      `Keep the person's face, hair, clothing, and pose exactly the same. ` +
      `${NO_SHADOW_INSTRUCTIONS} ` +
      `Clean, professional corporate headshot. Sharp and polished result.`;
    imageInput = imageUrl;
  } else if (bgType === "image") {
    if (!bgImageUrl) return NextResponse.json({ error: "bgImageUrl required" }, { status: 400 });
    prompt =
      `Use the second image as a locked background plate. Do not alter, regenerate, blur, crop, replace, retouch, recolor, relight, stylize, remove, or add anything to the background image. ` +
      `Keep every background object, line, texture, color, text, perspective, and framing exactly as it appears in the second image. ` +
      `Only extract the person from the first image and composite them onto the locked background. ` +
      `Keep the person's face, hair, clothing, and pose exactly the same. ` +
      `${NO_SHADOW_INSTRUCTIONS} ` +
      `Professional headshot portrait quality.`;
    imageInput = [imageUrl, bgImageUrl];
  } else if (bgType === "prompt") {
    if (!customPrompt) return NextResponse.json({ error: "customPrompt required" }, { status: 400 });
    prompt = `${customPrompt}. ${NO_SHADOW_INSTRUCTIONS}`;
    imageInput = imageUrl;
  } else {
    return NextResponse.json({ error: "bgType must be 'color', 'image', or 'prompt'" }, { status: 400 });
  }

  const pixelbin = createUserPixelbinClient(apiToken);
  const input: Record<string, unknown> = {
    prompt,
    image: imageInput,
    output_resolution: "1K",
  };

  if (bgType !== "image") {
    input.aspect_ratio = "3:4";
  }

  const result = await pixelbin.predictions.createAndWait({
    name: "nanoBananaPro_generate",
    input,
  });

  const tempUrl = extractUrl(result);
  console.log("Edit-bg temp URL:", tempUrl);
  if (!tempUrl) return NextResponse.json({ error: "Generation failed — no output URL" }, { status: 500 });

  const storageName = `headshot-edit-${Date.now()}`;
  const permanentUrl = await saveToPermanentStorage(tempUrl, storageName, apiToken);
  console.log("Edit-bg permanent URL:", permanentUrl);

  return NextResponse.json({ url: permanentUrl || tempUrl });
}
