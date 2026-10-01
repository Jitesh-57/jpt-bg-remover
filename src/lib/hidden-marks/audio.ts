import { type FileClean, type Finding, ascii, concat, latin1, preview, startsWith, u32be, u32le } from "./bytes";

// Audio tag strippers: ID3 for MP3, RIFF INFO/bext/iXML for WAV, and Vorbis
// comments / pictures for FLAC. Audio frames are copied unchanged.

const ID3_FRAMES: Record<string, string> = {
  TIT2: "Title", TPE1: "Artist", TALB: "Album", TENC: "Encoded by", TSSE: "Encoder software",
  COMM: "Comment", APIC: "Embedded cover picture", PRIV: "Private data", TXXX: "Custom text field", GEOB: "Embedded object",
};

function id3Findings(tag: Uint8Array): Finding[] {
  const out: Finding[] = [{ kind: "id3", label: "ID3v2 tag" }];
  const ver = tag[3];
  if (ver < 3) return out;
  let p = 10;
  while (p + 10 <= tag.length && tag[p] !== 0) {
    const id = ascii(tag, p, p + 4);
    const size = ver === 4
      ? ((tag[p + 4] & 0x7f) << 21) | ((tag[p + 5] & 0x7f) << 14) | ((tag[p + 6] & 0x7f) << 7) | (tag[p + 7] & 0x7f)
      : u32be(tag, p + 4);
    if (ID3_FRAMES[id]) {
      let detail: string | undefined;
      if (id.startsWith("T") && id !== "TXXX") {
        const body = tag.subarray(p + 11, p + 10 + size);
        const enc = tag[p + 10];
        detail = preview(enc === 1 || enc === 2 ? new TextDecoder("utf-16").decode(body) : enc === 3 ? new TextDecoder().decode(body) : latin1(body)).replace(/\0/g, "") || undefined;
      }
      out.push({ kind: "id3", label: ID3_FRAMES[id], detail });
    }
    p += 10 + size;
  }
  return out;
}

export function cleanMp3(b: Uint8Array): FileClean {
  const findings: Finding[] = [];
  let start = 0;
  // A file can carry several ID3v2 tags back to back.
  while (startsWith(b, "ID3", start) && start + 10 <= b.length) {
    const size = ((b[start + 6] & 0x7f) << 21) | ((b[start + 7] & 0x7f) << 14) | ((b[start + 8] & 0x7f) << 7) | (b[start + 9] & 0x7f);
    const total = 10 + size + (b[start + 5] & 0x10 ? 10 : 0);
    findings.push(...id3Findings(b.subarray(start, start + total)));
    start += total;
  }
  let end = b.length;
  if (end - start >= 128 && startsWith(b, "TAG", end - 128)) {
    findings.push({ kind: "id3", label: "ID3v1 tag", detail: preview(latin1(b.subarray(end - 125, end - 95)).replace(/\0/g, "")) || undefined });
    end -= 128;
  }
  if (end - start >= 32 && startsWith(b, "APETAGEX", end - 32)) {
    const size = u32le(b, end - 20);
    findings.push({ kind: "id3", label: "APE tag" });
    end -= size + (b[end - 9] & 0x80 ? 32 : 0);
  }
  return { bytes: findings.length ? b.slice(Math.max(0, start), Math.max(start, end)) : b, findings, notes: [] };
}

const WAV_KEEP = new Set(["fmt ", "data", "fact", "cue ", "smpl", "inst"]);

export function cleanWav(b: Uint8Array): FileClean {
  const findings: Finding[] = [];
  const parts: Uint8Array[] = [];
  let p = 12;
  while (p + 8 <= b.length) {
    const id = ascii(b, p, p + 4);
    const len = u32le(b, p + 4);
    const end = Math.min(b.length, p + 8 + len + (len & 1));
    if (WAV_KEEP.has(id)) parts.push(b.subarray(p, end));
    else if (id === "LIST") findings.push({ kind: "doc", label: `${ascii(b, p + 8, p + 12).trim() || "LIST"} text tags` });
    else if (id === "bext") findings.push({ kind: "doc", label: "Broadcast info (originator, dates)", detail: preview(latin1(b.subarray(p + 8, p + 8 + 256)).replace(/\0/g, " ")) || undefined });
    else if (id === "iXML" || id === "_PMX") findings.push({ kind: "xmp", label: id === "_PMX" ? "XMP metadata packet" : "iXML production notes" });
    else if (id === "id3 " || id === "ID3 ") findings.push({ kind: "id3", label: "ID3 tag" });
    else findings.push({ kind: "other", label: `Private “${id.trim()}” chunk` });
    p = end;
  }
  if (!findings.length) return { bytes: b, findings, notes: [] };
  const body = concat(parts);
  const size = body.length + 4;
  const head = b.slice(0, 12);
  head[4] = size & 0xff; head[5] = (size >> 8) & 0xff; head[6] = (size >> 16) & 0xff; head[7] = (size >>> 24) & 0xff;
  return { bytes: concat([head, body]), findings, notes: [] };
}

const FLAC_KEEP = new Set([0 /* STREAMINFO */, 3 /* SEEKTABLE */, 5 /* CUESHEET */]);

export function cleanFlac(b: Uint8Array): FileClean {
  const findings: Finding[] = [];
  const blocks: Uint8Array[] = [];
  let p = 4;
  for (;;) {
    if (p + 4 > b.length) break;
    const last = (b[p] & 0x80) !== 0;
    const type = b[p] & 0x7f;
    const len = (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3];
    const end = p + 4 + len;
    if (FLAC_KEEP.has(type)) blocks.push(b.slice(p, end));
    else if (type === 4) findings.push({ kind: "doc", label: "Vorbis comment tags (artist, encoder…)" });
    else if (type === 6) findings.push({ kind: "doc", label: "Embedded picture" });
    else if (type === 2) findings.push({ kind: "other", label: "Application data block" });
    // type 1 (PADDING) is dropped silently — it holds nothing.
    p = end;
    if (last) break;
  }
  if (!findings.length) return { bytes: b, findings, notes: [] };
  blocks.forEach((blk, i) => { blk[0] = (blk[0] & 0x7f) | (i === blocks.length - 1 ? 0x80 : 0); });
  return { bytes: concat([b.subarray(0, 4), ...blocks, b.subarray(p)]), findings, notes: [] };
}
