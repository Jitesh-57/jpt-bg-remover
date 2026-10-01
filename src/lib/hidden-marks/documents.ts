import { type FileClean, type Finding, preview, utf8, xmpFindings } from "./bytes";

// Document cleaners. These are heavier than the image ones, so their
// libraries (pdf-lib, jszip) are imported on first use only.

// ── PDF ───────────────────────────────────────────────────────────────────

const INFO_LABELS: Record<string, string> = {
  Title: "Title", Author: "Author", Subject: "Subject", Keywords: "Keywords",
  Creator: "Created with", Producer: "PDF producer", CreationDate: "Created date", ModDate: "Modified date",
};

export async function cleanPdf(b: Uint8Array): Promise<FileClean> {
  const { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef, PDFStream, PDFString, PDFHexString } = await import("pdf-lib");
  let doc: Awaited<ReturnType<typeof PDFDocument.load>>;
  try {
    doc = await PDFDocument.load(b, { updateMetadata: false });
  } catch (e) {
    const encrypted = /encrypt/i.test(String(e));
    return { bytes: b, findings: [], notes: [encrypted ? "This PDF is password-protected, so it can’t be cleaned here." : "This PDF couldn’t be read, so it was left unchanged."] };
  }
  const ctx = doc.context;
  const findings: Finding[] = [];

  // 1. Document information dictionary (Author, Creator, dates…).
  const infoRef = ctx.trailerInfo.Info;
  const info = infoRef ? ctx.lookup(infoRef) : undefined;
  if (info instanceof PDFDict) {
    for (const [k, v] of info.entries()) {
      const key = k.decodeText();
      const text = v instanceof PDFString || v instanceof PDFHexString ? v.decodeText() : String(v);
      if (!text) continue;
      findings.push({ kind: key === "Creator" || key === "Producer" ? "software" : "doc", label: INFO_LABELS[key] ?? `Info field “${key}”`, detail: preview(text) });
    }
    if (!findings.length) findings.push({ kind: "doc", label: "Empty document-info block" });
  }
  ctx.trailerInfo.Info = undefined;

  // 2. XMP streams and Acrobat private data on the catalog and every page.
  const scrub = (dict: import("pdf-lib").PDFDict, where: string) => {
    for (const key of ["Metadata", "PieceInfo"]) {
      const name = PDFName.of(key);
      const v = dict.get(name);
      if (!v) continue;
      if (key === "Metadata") {
        const stream = ctx.lookup(v);
        let xml = "";
        if (stream instanceof PDFStream) {
          try { xml = utf8((stream as unknown as { getContents(): Uint8Array }).getContents()); } catch { /* compressed — presence is enough */ }
        }
        findings.push({ kind: "xmp", label: `XMP metadata (${where})` }, ...xmpFindings(xml));
      } else {
        findings.push({ kind: "software", label: `Editor private data (${where})` });
      }
      dict.delete(name);
    }
  };
  scrub(doc.catalog, "document");
  doc.getPages().forEach((page, i) => scrub(page.node, `page ${i + 1}`));

  // 3. Drop every object no longer reachable from the catalog — orphaned
  //    metadata and leftovers from earlier edits would otherwise be re-saved.
  const reachable = new Set<string>();
  const stack: unknown[] = [ctx.trailerInfo.Root];
  while (stack.length) {
    const o = stack.pop();
    if (o instanceof PDFRef) {
      if (reachable.has(o.tag)) continue;
      reachable.add(o.tag);
      stack.push(ctx.lookup(o));
    } else if (o instanceof PDFDict) {
      for (const [, v] of o.entries()) stack.push(v);
    } else if (o instanceof PDFArray) {
      stack.push(...o.asArray());
    } else if (o instanceof PDFStream) {
      stack.push(o.dict);
    }
  }
  let orphans = 0;
  for (const [ref] of ctx.enumerateIndirectObjects()) {
    if (!reachable.has(ref.tag)) { ctx.delete(ref); orphans++; }
  }
  if (orphans) findings.push({ kind: "other", label: `${orphans} unused leftover object${orphans === 1 ? "" : "s"} (old edits, orphaned metadata)` });

  if (!findings.length) return { bytes: b, findings, notes: [] };
  const out = await doc.save({ updateFieldAppearances: false });
  return { bytes: out, findings, notes: [] };
}

// ── Office (DOCX / XLSX / PPTX) ─────────────────────────────────────────────

const CORE_LABELS: Record<string, string> = {
  "dc:creator": "Author", "cp:lastModifiedBy": "Last modified by", "dc:title": "Title", "dc:subject": "Subject",
  "cp:keywords": "Keywords", "dc:description": "Comments", "cp:category": "Category", "cp:contentStatus": "Status",
  "dcterms:created": "Created date", "dcterms:modified": "Modified date", "cp:lastPrinted": "Last printed", "cp:revision": "Revision number",
};
const APP_STRIP = ["Company", "Manager", "Template", "HyperlinkBase"];
const EMPTY_CORE =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
  '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"></cp:coreProperties>';
// Zip entries carry their own modified-time; set them all to the zip epoch.
const ZIP_EPOCH = new Date(Date.UTC(1980, 0, 1));

export async function cleanOffice(b: Uint8Array): Promise<FileClean> {
  const JSZip = (await import("jszip")).default;
  let zip: InstanceType<typeof JSZip>;
  try { zip = await JSZip.loadAsync(b); } catch {
    return { bytes: b, findings: [], notes: ["This file couldn’t be opened as an Office document, so it was left unchanged."] };
  }
  const findings: Finding[] = [];

  const core = zip.file("docProps/core.xml");
  if (core) {
    const xml = await core.async("string");
    for (const m of Array.from(xml.matchAll(/<((?:dc|cp|dcterms):\w+)\b[^>]*>([^<]*)<\/\1>/g))) {
      if (m[2].trim()) findings.push({ kind: "doc", label: CORE_LABELS[m[1]] ?? m[1], detail: preview(m[2]) });
    }
    if (findings.length) zip.file("docProps/core.xml", EMPTY_CORE);
  }

  const app = zip.file("docProps/app.xml");
  if (app) {
    let xml = await app.async("string");
    const before = xml;
    for (const tag of APP_STRIP) {
      xml = xml.replace(new RegExp(`<${tag}>([^<]*)</${tag}>|<${tag}/>`, "g"), (_m, v: string | undefined) => {
        if (v?.trim()) findings.push({ kind: "doc", label: tag === "HyperlinkBase" ? "Link base path" : tag, detail: preview(v) });
        return "";
      });
    }
    if (xml !== before) zip.file("docProps/app.xml", xml);
  }

  const custom = zip.file("docProps/custom.xml");
  if (custom) {
    const xml = await custom.async("string");
    const names = Array.from(xml.matchAll(/name="([^"]+)"/g)).map((m) => m[1]);
    findings.push({ kind: "doc", label: "Custom document properties", detail: names.length ? preview(names.join(", ")) : undefined });
    zip.remove("docProps/custom.xml");
    const rels = zip.file("_rels/.rels");
    if (rels) zip.file("_rels/.rels", (await rels.async("string")).replace(/<Relationship\b[^>]*Target="\/?docProps\/custom\.xml"[^>]*\/>/g, ""));
    const types = zip.file("[Content_Types].xml");
    if (types) zip.file("[Content_Types].xml", (await types.async("string")).replace(/<Override\b[^>]*PartName="\/docProps\/custom\.xml"[^>]*\/>/g, ""));
  }

  if (!findings.length) return { bytes: b, findings, notes: [] };
  zip.forEach((_path, f) => { f.date = ZIP_EPOCH; });
  const out = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", mimeType: "application/zip" });
  return {
    bytes: out,
    findings,
    notes: ["Names on comments and tracked changes are part of the document itself and are left as they are."],
  };
}
