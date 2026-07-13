"use client";

// Free, in-browser background removal via @imgly/background-removal.
// Runs entirely on the user's device — no API key, no server call, no Google
// quota, no credits. This is the engine behind the "Remove BG" tool, which is
// free for everyone (like the client-side Upscale/Resize/Adjust tools).

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Remove the background. Returns a transparent-PNG data URL. */
export async function removeBackgroundLocal(src: string | Blob): Promise<string> {
  const { removeBackground } = await import("@imgly/background-removal");
  const blob = await removeBackground(src, { output: { format: "image/png" } });
  return blobToDataUrl(blob);
}
