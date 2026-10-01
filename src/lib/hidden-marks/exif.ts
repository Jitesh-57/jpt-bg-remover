import { type Finding, preview } from "./bytes";

// Minimal EXIF (TIFF) reader — just enough to tell the person what the
// metadata gave away (camera, software, dates, GPS) and to rescue the
// orientation tag so a stripped photo still displays the right way up.

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

type Entry = { tag: number; type: number; count: number; valueOffset: number };

class Tiff {
  readonly le: boolean;
  constructor(readonly b: Uint8Array) {
    this.le = b[0] === 0x49; // "II"
  }
  u16(o: number) { return this.le ? this.b[o] | (this.b[o + 1] << 8) : (this.b[o] << 8) | this.b[o + 1]; }
  u32(o: number) {
    const b = this.b;
    return this.le
      ? b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + ((b[o + 3] << 24) >>> 0)
      : ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
  }
  ifd(off: number): Entry[] {
    if (off < 8 || off + 2 > this.b.length) return [];
    const n = this.u16(off);
    const out: Entry[] = [];
    for (let i = 0; i < n && i < 512; i++) {
      const e = off + 2 + i * 12;
      if (e + 12 > this.b.length) break;
      const type = this.u16(e + 2);
      const count = this.u32(e + 4);
      const size = (TYPE_SIZE[type] ?? 1) * count;
      out.push({ tag: this.u16(e), type, count, valueOffset: size <= 4 ? e + 8 : this.u32(e + 8) });
    }
    return out;
  }
  str(e: Entry): string {
    const end = Math.min(e.valueOffset + e.count, this.b.length);
    let s = "";
    for (let i = e.valueOffset; i < end; i++) { if (!this.b[i]) break; s += String.fromCharCode(this.b[i]); }
    return s.trim();
  }
  num(e: Entry): number {
    if (e.type === 3) return this.u16(e.valueOffset);
    if (e.type === 4) return this.u32(e.valueOffset);
    return NaN;
  }
  rationals(e: Entry): number[] {
    const out: number[] = [];
    for (let i = 0; i < e.count; i++) {
      const o = e.valueOffset + i * 8;
      if (o + 8 > this.b.length) break;
      const d = this.u32(o + 4);
      out.push(d ? this.u32(o) / d : 0);
    }
    return out;
  }
}

const TEXT_TAGS: Record<number, string> = {
  0x010e: "Image description",
  0x010f: "Camera make",
  0x0110: "Camera model",
  0x0131: "Software",
  0x0132: "Modified date",
  0x013b: "Artist",
  0x8298: "Copyright",
  0x9003: "Date taken",
  0xa431: "Camera serial number",
  0xa434: "Lens",
  0xa420: "Unique image ID",
};

/** `tiff` starts at the TIFF header ("II*\0" / "MM\0*"), i.e. after "Exif\0\0". */
export function readExif(tiffBytes: Uint8Array): { findings: Finding[]; orientation: number } {
  const findings: Finding[] = [{ kind: "exif", label: "EXIF metadata block" }];
  let orientation = 1;
  if (tiffBytes.length < 8) return { findings, orientation };
  const t = new Tiff(tiffBytes);
  const ifd0 = t.ifd(t.u32(4));
  // Exactly what orientationApp1() writes: nothing but the rotation flag.
  if (ifd0.length === 1 && ifd0[0].tag === 0x0112 && t.u32(t.u32(4) + 14) === 0) {
    return { findings: [], orientation: t.num(ifd0[0]) || 1 };
  }

  const visit = (entries: Entry[]) => {
    for (const e of entries) {
      const label = TEXT_TAGS[e.tag];
      if (label && e.type === 2) {
        const v = t.str(e);
        if (v) findings.push({ kind: e.tag === 0x0131 ? "software" : "exif", label, detail: preview(v) });
      }
      if (e.tag === 0x927c) findings.push({ kind: "exif", label: "Camera maker notes" });
      if (e.tag === 0x0112) orientation = t.num(e) || 1;
    }
  };
  visit(ifd0);

  const exifPtr = ifd0.find((e) => e.tag === 0x8769);
  if (exifPtr) visit(t.ifd(t.num(exifPtr)));

  const gpsPtr = ifd0.find((e) => e.tag === 0x8825);
  if (gpsPtr) {
    const gps = t.ifd(t.num(gpsPtr));
    const lat = gps.find((e) => e.tag === 2);
    const lon = gps.find((e) => e.tag === 4);
    let detail: string | undefined;
    if (lat && lon && lat.type === 5 && lon.type === 5) {
      const dms = (v: number[]) => (v[0] ?? 0) + (v[1] ?? 0) / 60 + (v[2] ?? 0) / 3600;
      const latRef = gps.find((e) => e.tag === 1);
      const lonRef = gps.find((e) => e.tag === 3);
      const la = dms(t.rationals(lat)) * (latRef && t.str(latRef) === "S" ? -1 : 1);
      const lo = dms(t.rationals(lon)) * (lonRef && t.str(lonRef) === "W" ? -1 : 1);
      if (la || lo) detail = `${la.toFixed(5)}, ${lo.toFixed(5)}`;
    }
    findings.push({ kind: "gps", label: "GPS location", detail });
  }

  if (ifd0.length && t.u32(4) + 2 + ifd0.length * 12 + 4 <= tiffBytes.length) {
    const next = t.u32(t.u32(4) + 2 + ifd0.length * 12);
    if (next) findings.push({ kind: "exif", label: "Embedded thumbnail (may show the uncropped original)" });
  }
  return { findings, orientation };
}

/** A complete JPEG APP1 segment holding only an Orientation tag. */
export function orientationApp1(orientation: number): Uint8Array {
  const body = [
    0x45, 0x78, 0x69, 0x66, 0, 0, // "Exif\0\0"
    0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, // big-endian TIFF header, IFD0 at 8
    0, 1, // one entry
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation & 0xff, 0, 0, // Orientation SHORT
    0, 0, 0, 0, // no next IFD
  ];
  const len = body.length + 2;
  return new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...body]);
}
