// Small byte helpers shared by the format cleaners. Everything here works on
// plain Uint8Arrays so the cleaners run the same in the browser and in Node.

export type Finding = {
  /** Short machine key, e.g. "exif", "gps", "xmp", "c2pa". */
  kind: string;
  /** Human label shown in the report. */
  label: string;
  /** Optional value preview (camera model, software, prompt text…). */
  detail?: string;
};

export type FileClean = {
  /** Cleaned bytes. Equal to the input when nothing was found or the format is unsupported. */
  bytes: Uint8Array;
  findings: Finding[];
  /** Non-fatal caveats about this file (e.g. orientation kept). */
  notes: string[];
};

export function concat(parts: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

export function ascii(b: Uint8Array, start = 0, end = b.length): string {
  let s = "";
  for (let i = start; i < end && i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

export function startsWith(b: Uint8Array, sig: string, at = 0): boolean {
  if (b.length < at + sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (b[at + i] !== sig.charCodeAt(i)) return false;
  return true;
}

export function indexOfAscii(b: Uint8Array, needle: string, from = 0): number {
  const n = needle.length;
  const first = needle.charCodeAt(0);
  outer: for (let i = from; i <= b.length - n; i++) {
    if (b[i] !== first) continue;
    for (let j = 1; j < n; j++) if (b[i + j] !== needle.charCodeAt(j)) continue outer;
    return i;
  }
  return -1;
}

export const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
export const u32le = (b: Uint8Array, o: number) => b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + ((b[o + 3] << 24) >>> 0);
export const u16be = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];

export function utf8(b: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(b);
}

export function latin1(b: Uint8Array): string {
  return new TextDecoder("latin1").decode(b);
}

/** Collapse whitespace and cap length so a finding fits on one line. */
export function preview(s: string, max = 140): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/**
 * Pull the claim generator (the app that signed it — "ChatGPT", "Adobe
 * Firefly"…) out of a C2PA manifest. The manifest is CBOR inside JUMBF; rather
 * than decode both, look for the CBOR text key and read the text value after it.
 */
export function c2paGenerator(b: Uint8Array): string | undefined {
  for (const key of ["claim_generator", "name"]) {
    let from = 0;
    for (;;) {
      const at = indexOfAscii(b, key, from);
      if (at < 0) break;
      from = at + key.length;
      // The key must itself be a CBOR text string: header byte just before it.
      if (b[at - 1] !== 0x60 + key.length) continue;
      let p = at + key.length;
      let len = -1;
      const h = b[p];
      if (h >= 0x60 && h <= 0x77) { len = h - 0x60; p += 1; }
      else if (h === 0x78) { len = b[p + 1]; p += 2; }
      if (len > 1 && p + len <= b.length) {
        const v = utf8(b.subarray(p, p + len));
        if (/^[\x20-\x7e -￿]+$/.test(v)) return v;
      }
    }
  }
  return undefined;
}

/** Findings an XMP packet is worth reporting on beyond its mere presence. */
export function xmpFindings(xml: string): Finding[] {
  const out: Finding[] = [];
  const tool = /CreatorTool(?:>|=")([^<"]+)/.exec(xml)?.[1];
  if (tool) out.push({ kind: "xmp", label: "Editing software (XMP)", detail: preview(tool) });
  if (/trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia|algorithmicMedia/i.test(xml)) {
    out.push({ kind: "ai-label", label: "IPTC “made with AI” source tag (XMP)" });
  }
  if (/c2pa|contentcredentials/i.test(xml)) out.push({ kind: "c2pa", label: "Content Credentials reference (XMP)" });
  return out;
}
