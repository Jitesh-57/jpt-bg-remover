import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function dataUrlToPart(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

function base64ToDataUrl(base64: string, mimeType = "image/png"): string {
  return `data:${mimeType};base64,${base64}`;
}

// AI image editing — returns edited image as data URL
export async function geminiEditImage(dataUrl: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const result = await model.generateContent([
    dataUrlToPart(dataUrl),
    { text: `You are a professional photo editor. Edit this image based on the following instruction. Return only the edited image, no text: ${prompt}` },
  ]);

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return base64ToDataUrl(part.inlineData.data, part.inlineData.mimeType || "image/png");
    }
  }
  throw new Error("Gemini did not return an image");
}

// AI background generation — replace background with prompt
export async function geminiGenerateBg(dataUrl: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const result = await model.generateContent([
    dataUrlToPart(dataUrl),
    { text: `You are a professional photo editor. Replace the background of this image with: ${prompt}. Keep the subject (person/object) exactly as they are — same pose, appearance, and position. Only change the background behind them. Return only the edited image.` },
  ]);

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return base64ToDataUrl(part.inlineData.data, part.inlineData.mimeType || "image/png");
    }
  }
  throw new Error("Gemini did not return an image");
}

// AI background removal — returns image with transparent/white background
export async function geminiRemoveBg(dataUrl: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const result = await model.generateContent([
    dataUrlToPart(dataUrl),
    { text: "Remove the background from this image completely. Make the background fully transparent (PNG with alpha). Keep the subject perfectly intact with clean edges. Return only the resulting image." },
  ]);

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return base64ToDataUrl(part.inlineData.data, part.inlineData.mimeType || "image/png");
    }
  }
  throw new Error("Gemini did not return an image");
}

// Pro AI upscale — enhance and upscale using Gemini
export async function geminiUpscale(dataUrl: string, scale: "2x" | "4x"): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const result = await model.generateContent([
    dataUrlToPart(dataUrl),
    { text: `Enhance this image to ${scale} resolution. Increase sharpness, detail, and clarity. Improve fine details like hair strands, skin texture, fabric texture. Remove noise and artifacts. Make colors more vivid and contrast punchy. Return only the enhanced high-resolution image.` },
  ]);

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return base64ToDataUrl(part.inlineData.data, part.inlineData.mimeType || "image/png");
    }
  }
  throw new Error("Gemini did not return an image");
}
