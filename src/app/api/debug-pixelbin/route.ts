import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CLOUD_NAME = "misty-band-06f445";
const ORG_ID = "318452";

export async function GET() {
  const t = process.env.PIXELBIN_API_TOKEN || "";
  const k = process.env.PIXELBIN_ACCESS_KEY || "";
  const results: Record<string, unknown> = { cloudName: CLOUD_NAME };

  // 1. Test CDN transformation on a public image (no auth needed?)
  const publicImg = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png";
  const cdnUrls = [
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/erase.bg()/${publicImg}`,
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/t-erase.bg()/__ext/${Buffer.from(publicImg).toString("base64")}`,
    `https://cdn.pixelbin.io/v2/${CLOUD_NAME}/erase.bg()/__ext/${Buffer.from(publicImg).toString("base64")}`,
  ];
  for (const url of cdnUrls) {
    const res = await fetch(url, { method: "HEAD" });
    results[`cdn_${url.split("__ext")[0].slice(-30)}`] = `${res.status} ${res.statusText}`;
  }

  // 2. Try presigned URL generation with different auth
  const authVariants = [
    ["x-ebz-token", t, "default"],
    ["Authorization", `Bearer ${t}`, "bearer-raw"],
    ["Authorization", `Bearer ${Buffer.from(t + ":").toString("base64")}`, "bearer-b64"],
    ["x-api-key", t, "x-api-key"],
  ];
  for (const [headerName, headerVal, label] of authVariants) {
    const res = await fetch(`https://api.pixelbin.io/service/platform/assets/v2.0/${ORG_ID}/presignedUploadUrl`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [headerName]: headerVal },
      body: JSON.stringify({ name: "test.png", path: "temp", format: "png", access: "public-read" }),
    });
    results[`presigned_${label}`] = `${res.status}: ${(await res.text()).slice(0, 150)}`;
  }

  // 3. Try erase.bg specific API
  const eraseBgFormats = [
    ["Authorization", `Bearer ${t}`],
    ["X-API-Key", t],
    ["Authorization", `Bearer ${Buffer.from(k + ":" + t).toString("base64")}`],
  ];
  const fd = new FormData();
  fd.append("image_url", publicImg);
  for (const [hName, hVal] of eraseBgFormats) {
    const res = await fetch("https://api.erase.bg/v1/removebg", {
      method: "POST", headers: { [hName]: hVal }, body: fd,
    });
    results[`erasebg_api_${hName}`] = `${res.status}: ${(await res.text()).slice(0, 150)}`;
  }

  // 4. Try PixelBin upload with x-ebz-token (their custom header)
  const uploadFd = new FormData();
  uploadFd.append("file", new Blob(["test"], { type: "image/png" }), "test.png");
  uploadFd.append("path", "temp");
  const uploadRes = await fetch(`https://api.pixelbin.io/service/platform/assets/v2.0/${ORG_ID}/upload`, {
    method: "POST",
    headers: { "x-ebz-token": t },
    body: uploadFd,
  });
  results["upload_x-ebz-token"] = `${uploadRes.status}: ${(await uploadRes.text()).slice(0, 150)}`;

  return NextResponse.json(results);
}
