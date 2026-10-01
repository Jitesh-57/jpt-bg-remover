import { type FileClean, type Finding, startsWith } from "./bytes";
import { cleanGif, cleanJpeg, cleanPng, cleanSvg, cleanWebp } from "./images";
import { cleanFlac, cleanMp3, cleanWav } from "./audio";
import { cleanOffice, cleanPdf } from "./documents";
import { scanText } from "./text";

export type { FileClean, Finding };
export { scanText };
export * from "./text";

export type Format = "png" | "jpeg" | "webp" | "gif" | "svg" | "pdf" | "docx" | "xlsx" | "pptx" | "mp3" | "wav" | "flac" | "txt" | "unknown";

export const FORMAT_LABEL: Record<Format, string> = {
  png: "PNG", jpeg: "JPEG", webp: "WebP", gif: "GIF", svg: "SVG", pdf: "PDF", docx: "Word", xlsx: "Excel",
  pptx: "PowerPoint", mp3: "MP3", wav: "WAV", flac: "FLAC", txt: "Text", unknown: "Unsupported",
};

export const ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.docx,.xlsx,.pptx,.mp3,.wav,.flac,.txt,.md,.csv,.html,.htm,.json";

const TEXT_EXT = /\.(txt|md|markdown|csv|html?|json)$/i;

/** Work out the format from the file's first bytes, falling back to its extension. */
export function detectFormat(b: Uint8Array, name: string): Format {
  if (startsWith(b, "\x89PNG\r\n\x1a\n")) return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (startsWith(b, "RIFF") && startsWith(b, "WEBP", 8)) return "webp";
  if (startsWith(b, "RIFF") && startsWith(b, "WAVE", 8)) return "wav";
  if (startsWith(b, "GIF87a") || startsWith(b, "GIF89a")) return "gif";
  if (startsWith(b, "%PDF-")) return "pdf";
  if (startsWith(b, "fLaC")) return "flac";
  if (startsWith(b, "ID3") || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && /\.mp3$/i.test(name))) return "mp3";
  if (startsWith(b, "PK\x03\x04")) {
    const ext = /\.(docx|xlsx|pptx)$/i.exec(name)?.[1].toLowerCase();
    if (ext) return ext as Format;
  }
  if (/\.svg$/i.test(name)) return "svg";
  if (TEXT_EXT.test(name)) return "txt";
  return "unknown";
}

function cleanTextFile(b: Uint8Array): FileClean {
  const text = new TextDecoder().decode(b);
  const scan = scanText(text);
  const findings: Finding[] = [];
  for (const [cls, n] of Object.entries(scan.counts)) {
    if (n) findings.push({ kind: "hidden-char", label: `${n} ${cls.replace("-", " ")} character${n === 1 ? "" : "s"}` });
  }
  for (const m of scan.hiddenMessages) findings.push({ kind: "hidden-message", label: "Hidden message", detail: m });
  if (!findings.length) return { bytes: b, findings, notes: [] };
  return { bytes: new TextEncoder().encode(scan.cleaned), findings, notes: [] };
}

export async function cleanBytes(b: Uint8Array, format: Format): Promise<FileClean> {
  switch (format) {
    case "png": return cleanPng(b);
    case "jpeg": return cleanJpeg(b);
    case "webp": return cleanWebp(b);
    case "gif": return cleanGif(b);
    case "svg": return cleanSvg(b);
    case "pdf": return cleanPdf(b);
    case "docx": case "xlsx": case "pptx": return cleanOffice(b);
    case "mp3": return cleanMp3(b);
    case "wav": return cleanWav(b);
    case "flac": return cleanFlac(b);
    case "txt": return cleanTextFile(b);
    default: return { bytes: b, findings: [], notes: ["This file type isn’t supported yet, so it was left unchanged."] };
  }
}

export type CleanReport = FileClean & {
  format: Format;
  /** Findings that a second pass over the cleaned file still turns up. Empty = verified clean. */
  remaining: Finding[];
};

/**
 * Clean a file and then verify it: the cleaned bytes are run through the same
 * cleaner again, and anything it still finds is reported as `remaining`.
 */
export async function cleanAndVerify(b: Uint8Array, name: string): Promise<CleanReport> {
  const format = detectFormat(b, name);
  const first = await cleanBytes(b, format);
  let remaining: Finding[] = [];
  if (first.findings.length && format !== "unknown") {
    remaining = (await cleanBytes(first.bytes, format)).findings;
  }
  return { ...first, format, remaining };
}
