import {
  type FileClean, type Finding, ascii, c2paGenerator, concat, latin1, preview,
  startsWith, u16be, u32be, u32le, utf8, xmpFindings,
} from "./bytes";
import { orientationApp1, readExif } from "./exif";

// Lossless metadata strippers. Each one walks the container format and copies
// the image data across byte-for-byte, leaving out the blocks that carry EXIF,
// XMP, IPTC, text comments and C2PA Content Credentials. Pixels are never
// decoded or re-encoded, so quality and file format are unchanged.

// ── PNG ───────────────────────────────────────────────────────────────────

// Ancillary chunks that affect how the image looks. Everything else that is
// ancillary (lower-case first letter) is safe to drop by the PNG spec.
const PNG_KEEP = new Set(["tRNS", "cHRM", "gAMA", "iCCP", "sBIT", "sRGB", "cICP", "mDCV", "cLLI", "bKGD", "pHYs", "sPLT", "hIST", "acTL", "fcTL", "fdAT"]);
const PROMPT_KEYS = /^(parameters|prompt|workflow|dream|sd-metadata|invokeai_metadata|negative_prompt|generation_data)$/i;

function pngTextFinding(type: string, data: Uint8Array): Finding {
  const nul = data.indexOf(0);
  const key = latin1(data.subarray(0, nul < 0 ? data.length : nul));
  let text: string | undefined;
  if (type === "tEXt" && nul >= 0) text = latin1(data.subarray(nul + 1));
  if (type === "iTXt" && nul >= 0 && data[nul + 1] === 0) {
    // keyword\0 flag method lang\0 translated\0 text
    let p = nul + 3;
    p = data.indexOf(0, p) + 1; // skip language tag
    p = data.indexOf(0, p) + 1; // skip translated keyword
    if (p > 0) text = utf8(data.subarray(p));
  }
  if (key === "XML:com.adobe.xmp") return { kind: "xmp", label: "XMP metadata packet" };
  if (PROMPT_KEYS.test(key)) return { kind: "ai-prompt", label: `AI generation data (“${key}”)`, detail: text ? preview(text) : undefined };
  if (/^software$/i.test(key)) return { kind: "software", label: "Software", detail: text ? preview(text) : undefined };
  return { kind: "text", label: `Text field “${key}”`, detail: text ? preview(text) : undefined };
}

export function cleanPng(b: Uint8Array): FileClean {
  const findings: Finding[] = [];
  const parts: Uint8Array[] = [b.subarray(0, 8)];
  let p = 8;
  while (p + 12 <= b.length) {
    const len = u32be(b, p);
    const type = ascii(b, p + 4, p + 8);
    const end = p + 12 + len;
    if (end > b.length) { parts.push(b.subarray(p)); break; }
    const data = b.subarray(p + 8, p + 8 + len);
    const critical = type.charCodeAt(0) < 0x61; // upper-case first letter
    if (critical || PNG_KEEP.has(type)) {
      parts.push(b.subarray(p, end));
    } else if (type === "tEXt" || type === "iTXt" || type === "zTXt") {
      const f = pngTextFinding(type, data);
      findings.push(f);
      if (f.kind === "xmp") findings.push(...xmpFindings(utf8(data)));
    } else if (type === "eXIf") {
      findings.push(...readExif(data).findings);
    } else if (type === "caBX") {
      const gen = c2paGenerator(data);
      findings.push({ kind: "c2pa", label: "C2PA Content Credentials manifest", detail: gen });
    } else if (type === "tIME") {
      findings.push({ kind: "date", label: "Last-modified timestamp" });
    } else {
      findings.push({ kind: "other", label: `Private “${type}” chunk` });
    }
    p = end;
    if (type === "IEND") break;
  }
  if (p < b.length) findings.push({ kind: "trailer", label: `Hidden data after the end of the image (${b.length - p} bytes)` });
  return { bytes: findings.length ? concat(parts) : b, findings, notes: [] };
}

// ── JPEG ──────────────────────────────────────────────────────────────────

const SOS = 0xda, EOI = 0xd9;

function jpegAppFinding(marker: number, seg: Uint8Array, findings: Finding[]): boolean /* keep */ {
  // seg = payload after the 2-byte length
  if (marker === 0xe0) return true; // JFIF / JFXX
  if (marker === 0xe1) {
    if (startsWith(seg, "Exif\0")) {
      const exif = readExif(seg.subarray(6)).findings;
      if (!exif.length) return true; // orientation-only block we wrote ourselves
      findings.push(...exif);
    } else if (startsWith(seg, "http://ns.adobe.com/xap/1.0/")) {
      findings.push({ kind: "xmp", label: "XMP metadata packet" }, ...xmpFindings(utf8(seg)));
    } else if (startsWith(seg, "http://ns.adobe.com/xmp/extension/")) {
      findings.push({ kind: "xmp", label: "Extended XMP data" });
    } else {
      findings.push({ kind: "other", label: "APP1 metadata block" });
    }
    return false;
  }
  if (marker === 0xe2) {
    if (startsWith(seg, "ICC_PROFILE\0")) return true; // colour profile — needed to render correctly
    if (startsWith(seg, "MPF\0")) findings.push({ kind: "other", label: "Multi-picture index (extra embedded images)" });
    else findings.push({ kind: "other", label: "APP2 metadata block" });
    return false;
  }
  if (marker === 0xee && startsWith(seg, "Adobe")) return true; // colour transform flag
  if (marker === 0xeb) {
    findings.push({ kind: "c2pa", label: "C2PA Content Credentials manifest", detail: c2paGenerator(seg) });
    return false;
  }
  if (marker === 0xed) { findings.push({ kind: "iptc", label: "IPTC / Photoshop metadata" }); return false; }
  if (marker === 0xfe) {
    findings.push({ kind: "comment", label: "Comment", detail: preview(latin1(seg)) || undefined });
    return false;
  }
  findings.push({ kind: "other", label: `APP${marker - 0xe0} metadata block` });
  return false;
}

export function cleanJpeg(b: Uint8Array): FileClean {
  const findings: Finding[] = [];
  const notes: string[] = [];
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  let orientation = 1;
  let p = 2;
  let sawEoi = false;

  while (p + 2 <= b.length) {
    if (b[p] !== 0xff) { parts.push(b.subarray(p)); p = b.length; break; } // malformed: keep rest
    const marker = b[p + 1];
    if (marker === 0xff) { p++; continue; } // fill byte
    if (marker === EOI) { parts.push(b.subarray(p, p + 2)); p += 2; sawEoi = true; break; }
    if (marker >= 0xd0 && marker <= 0xd7) { parts.push(b.subarray(p, p + 2)); p += 2; continue; }
    const len = p + 4 <= b.length ? u16be(b, p + 2) : Infinity;
    const segEnd = p + 2 + len;
    if (segEnd > b.length) { parts.push(b.subarray(p)); p = b.length; break; }

    const isMeta = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (isMeta) {
      const seg = b.subarray(p + 4, segEnd);
      if (marker === 0xe1 && startsWith(seg, "Exif\0")) orientation = readExif(seg.subarray(6)).orientation;
      if (jpegAppFinding(marker, seg, findings)) {
        parts.push(b.subarray(p, segEnd));
        if (marker === 0xe1) orientation = 1; // the kept block already carries it
      }
      p = segEnd;
      continue;
    }

    parts.push(b.subarray(p, segEnd));
    p = segEnd;
    if (marker === SOS) {
      // Entropy-coded data runs until the next marker that isn't a stuffed
      // 0xFF00 or a restart marker.
      let q = p;
      while (q + 1 < b.length && !(b[q] === 0xff && b[q + 1] !== 0 && !(b[q + 1] >= 0xd0 && b[q + 1] <= 0xd7) && b[q + 1] !== 0xff)) q++;
      parts.push(b.subarray(p, q));
      p = q;
    }
  }
  if (sawEoi && p < b.length) {
    findings.push({ kind: "trailer", label: `Hidden data after the end of the image (${b.length - p} bytes — e.g. motion-photo video or a second image)` });
  }
  if (!findings.length) return { bytes: b, findings, notes };

  if (orientation > 1 && orientation <= 8) {
    // Keep only the rotation flag so the photo isn't shown sideways.
    parts.splice(1, 0, orientationApp1(orientation));
    notes.push("Kept the rotation flag only, so the photo still displays the right way up.");
  }
  return { bytes: concat(parts), findings, notes };
}

// ── WebP ──────────────────────────────────────────────────────────────────

const WEBP_KEEP = new Set(["VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF", "ICCP"]);

export function cleanWebp(b: Uint8Array): FileClean {
  const findings: Finding[] = [];
  const parts: Uint8Array[] = [];
  let p = 12;
  let vp8x = -1; // index into parts of the VP8X chunk
  while (p + 8 <= b.length) {
    const id = ascii(b, p, p + 4);
    const len = u32le(b, p + 4);
    const end = Math.min(b.length, p + 8 + len + (len & 1));
    const data = b.subarray(p + 8, Math.min(b.length, p + 8 + len));
    if (WEBP_KEEP.has(id)) {
      if (id === "VP8X") vp8x = parts.length;
      parts.push(b.slice(p, end));
    } else if (id === "EXIF") {
      const tiff = startsWith(data, "Exif\0") ? data.subarray(6) : data;
      findings.push(...readExif(tiff).findings);
    } else if (id === "XMP ") {
      findings.push({ kind: "xmp", label: "XMP metadata packet" }, ...xmpFindings(utf8(data)));
    } else if (id === "C2PA") {
      findings.push({ kind: "c2pa", label: "C2PA Content Credentials manifest", detail: c2paGenerator(data) });
    } else {
      findings.push({ kind: "other", label: `Private “${id.trim()}” chunk` });
    }
    p = end;
  }
  if (!findings.length) return { bytes: b, findings, notes: [] };
  if (vp8x >= 0) parts[vp8x][8] &= ~(0x08 | 0x04); // clear EXIF + XMP flags
  const body = concat(parts);
  const size = body.length + 4;
  const head = new Uint8Array([0x52, 0x49, 0x46, 0x46, size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >>> 24) & 0xff, 0x57, 0x45, 0x42, 0x50]);
  return { bytes: concat([head, body]), findings, notes: [] };
}

// ── GIF ───────────────────────────────────────────────────────────────────

/** Length of a run of GIF sub-blocks starting at p, including the 0 terminator. */
function subBlocks(b: Uint8Array, p: number): number {
  let q = p;
  while (q < b.length && b[q] !== 0) q += b[q] + 1;
  return q + 1 - p;
}

export function cleanGif(b: Uint8Array): FileClean {
  const findings: Finding[] = [];
  let p = 13;
  if (b[10] & 0x80) p += 3 * (1 << ((b[10] & 7) + 1));
  const parts: Uint8Array[] = [b.subarray(0, p)];
  while (p < b.length) {
    const intro = b[p];
    if (intro === 0x3b) { parts.push(b.subarray(p, p + 1)); p++; break; }
    if (intro === 0x2c) {
      let q = p + 10;
      if (b[p + 9] & 0x80) q += 3 * (1 << ((b[p + 9] & 7) + 1));
      q += 1; // LZW minimum code size
      q += subBlocks(b, q);
      parts.push(b.subarray(p, q));
      p = q;
      continue;
    }
    if (intro === 0x21) {
      const label = b[p + 1];
      const q = p + 2 + subBlocks(b, p + 2);
      let keep = label === 0xf9 || label === 0x01;
      if (label === 0xff) {
        const app = ascii(b, p + 3, p + 14);
        keep = app === "NETSCAPE2.0" || app === "ANIMEXTS1.0" || app === "ICCRGBG1012";
        if (!keep) findings.push(app.startsWith("XMP Data") ? { kind: "xmp", label: "XMP metadata packet" } : { kind: "other", label: `Application block “${app.trim()}”` });
      } else if (label === 0xfe) {
        let text = "";
        for (let r = p + 2; r < q - 1; r += b[r] + 1) text += latin1(b.subarray(r + 1, r + 1 + b[r]));
        findings.push({ kind: "comment", label: "Comment", detail: preview(text) || undefined });
      }
      if (keep) parts.push(b.subarray(p, q));
      p = q;
      continue;
    }
    parts.push(b.subarray(p)); // unknown — keep as-is
    p = b.length;
  }
  if (p < b.length) findings.push({ kind: "trailer", label: `Hidden data after the end of the image (${b.length - p} bytes)` });
  return { bytes: findings.length ? concat(parts) : b, findings, notes: [] };
}

// ── SVG ───────────────────────────────────────────────────────────────────

export function cleanSvg(b: Uint8Array): FileClean {
  const findings: Finding[] = [];
  let s = utf8(b);
  const before = s;
  s = s.replace(/<metadata\b[\s\S]*?<\/metadata\s*>|<metadata\b[^>]*\/>/gi, (m) => {
    findings.push({ kind: "xmp", label: "<metadata> block" }, ...xmpFindings(m));
    return "";
  });
  s = s.replace(/<!--[\s\S]*?-->/g, (m) => {
    findings.push({ kind: "comment", label: "Comment", detail: preview(m.slice(4, -3)) || undefined });
    return "";
  });
  s = s.replace(/<sodipodi:namedview\b[\s\S]*?(?:\/>|<\/sodipodi:namedview\s*>)/gi, () => {
    findings.push({ kind: "software", label: "Editor view settings (Inkscape)" });
    return "";
  });
  s = s.replace(/\s(?:sodipodi|inkscape):(?:docname|export-filename|export-xdpi|export-ydpi|version)="[^"]*"/gi, (m) => {
    findings.push({ kind: "software", label: "Editor attribute", detail: preview(m) });
    return "";
  });
  if (s === before) return { bytes: b, findings: [], notes: [] };
  return { bytes: new TextEncoder().encode(s), findings, notes: [] };
}
