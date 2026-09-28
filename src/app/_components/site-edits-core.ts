"use client";

import { normImageSrc, normText, type PageRules } from "@/lib/page-edits";

/**
 * Applies page-edit rules to the live DOM.
 *
 * Runs after React has hydrated, so the server HTML and React's view of it
 * never disagree. Every node remembers what it said before it was changed, so
 * a rule can be undone (and the editor always keys a change on the original
 * words, not on an earlier edit). If React later renders different text into
 * a node, that becomes the node's new original.
 */

type Rules = Required<PageRules>;

interface TextRec { raw: string; norm: string; applied?: string }
interface ImgRec { src: string; srcset: string | null; sizes: string | null; key: string; applied?: string }
interface BgRec { style: string; url: string; key: string; applied?: string }

const textRecs = new WeakMap<Text, TextRec>();
const imgRecs = new WeakMap<HTMLImageElement, ImgRec>();
const bgRecs = new WeakMap<HTMLElement, BgRec>();

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "TEMPLATE", "SVG"]);

function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP.has(e.tagName.toUpperCase())) return true;
    if ((e as HTMLElement).dataset?.jptEditor !== undefined) return true;
    if ((e as HTMLElement).isContentEditable) return true;
  }
  return false;
}

/** The words this text node said before any edit. */
export function originalText(n: Text): string {
  return textRecs.get(n)?.norm ?? normText(n.nodeValue || "");
}

function applyText(n: Text, map: Record<string, string>) {
  const cur = n.nodeValue || "";
  const curNorm = normText(cur);
  let rec = textRecs.get(n);
  if (!rec) {
    if (!curNorm || !(curNorm in map)) return; // nothing to do and nothing to remember
    rec = { raw: cur, norm: curNorm };
    textRecs.set(n, rec);
  } else if (curNorm !== rec.norm && curNorm !== rec.applied) {
    rec = { raw: cur, norm: curNorm }; // React rendered new words: they're the original now
    textRecs.set(n, rec);
  }
  const target = map[rec.norm];
  if (target !== undefined && target !== rec.norm) {
    rec.applied = normText(target);
    if (curNorm !== rec.applied) {
      const lead = /^\s*/.exec(rec.raw)?.[0] ?? "";
      const trail = /\s*$/.exec(rec.raw)?.[0] ?? "";
      n.nodeValue = lead + target + trail;
    }
  } else if (rec.applied !== undefined) {
    rec.applied = undefined;
    if (cur !== rec.raw) n.nodeValue = rec.raw;
  }
}

/** The key an image's rule is stored under. */
export function imageKeyOf(el: Element): string {
  if (el instanceof HTMLImageElement) {
    const rec = imgRecs.get(el);
    return rec?.key ?? normImageSrc(el.getAttribute("src") || "", location.href);
  }
  if (el instanceof HTMLElement) {
    const rec = bgRecs.get(el);
    if (rec) return rec.key;
    const url = bgUrl(el.style.backgroundImage);
    return url ? normImageSrc(url, location.href) : "";
  }
  return "";
}

/** What an image shows right now, for the editor's preview. */
export function imageSrcOf(el: Element): string {
  if (el instanceof HTMLImageElement) return el.currentSrc || el.src;
  return el instanceof HTMLElement ? bgUrl(el.style.backgroundImage) : "";
}

function bgUrl(bg: string): string {
  const m = /url\(\s*(['"]?)(.*?)\1\s*\)/.exec(bg || "");
  return m ? m[2] : "";
}

export function hasBackgroundImage(el: Element): boolean {
  return el instanceof HTMLElement && !!bgUrl(el.style.backgroundImage);
}

function applyImg(img: HTMLImageElement, map: Record<string, string>) {
  const cur = img.getAttribute("src") || "";
  let rec = imgRecs.get(img);
  if (!rec || (cur !== rec.src && cur !== rec.applied)) {
    const key = normImageSrc(cur, location.href);
    if (!rec && !(key in map)) return;
    rec = { src: cur, srcset: img.getAttribute("srcset"), sizes: img.getAttribute("sizes"), key };
    imgRecs.set(img, rec);
  }
  const target = map[rec.key];
  if (target) {
    rec.applied = target;
    if (cur !== target) {
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      if (img.parentElement?.tagName === "PICTURE") {
        img.parentElement.querySelectorAll("source").forEach((s) => s.removeAttribute("srcset"));
      }
      img.setAttribute("src", target);
    }
  } else if (rec.applied) {
    rec.applied = undefined;
    if (rec.srcset) img.setAttribute("srcset", rec.srcset);
    if (rec.sizes) img.setAttribute("sizes", rec.sizes);
    img.setAttribute("src", rec.src);
  }
}

function applyBg(el: HTMLElement, map: Record<string, string>) {
  const url = bgUrl(el.style.backgroundImage);
  let rec = bgRecs.get(el);
  if (!rec || (url !== rec.url && url !== rec.applied)) {
    if (!url) return;
    const key = normImageSrc(url, location.href);
    if (!rec && !(key in map)) return;
    rec = { style: el.style.backgroundImage, url, key };
    bgRecs.set(el, rec);
  }
  const target = map[rec.key];
  if (target) {
    rec.applied = target;
    if (url !== target) el.style.backgroundImage = `url("${target}")`;
  } else if (rec.applied) {
    rec.applied = undefined;
    el.style.backgroundImage = rec.style;
  }
}

/** Applies the rules to everything under `root`. */
export function applyTo(root: Node, rules: Rules) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!skipped((root as Text).parentElement)) applyText(root as Text, rules.text);
    return;
  }
  if (!(root instanceof Element) && root !== document) return;
  const el = root as Element;
  if (el instanceof Element && skipped(el)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    if (!skipped(t.parentElement)) applyText(t, rules.text);
  }
  const imgs = el instanceof HTMLImageElement ? [el] : Array.from((root as ParentNode).querySelectorAll?.("img") ?? []);
  for (const img of imgs) if (!skipped(img)) applyImg(img, rules.images);
  const bgs = Array.from((root as ParentNode).querySelectorAll?.<HTMLElement>('[style*="url("]') ?? []);
  if (el instanceof HTMLElement && el.style?.backgroundImage) bgs.push(el);
  for (const b of bgs) if (!skipped(b)) applyBg(b, rules.images);
}

/** Keeps applying the rules as React renders. Returns a stop function. */
export function watch(getRules: () => Rules): () => void {
  let pending = new Set<Node>();
  let frame = 0;
  const flush = () => {
    frame = 0;
    const nodes = pending;
    pending = new Set();
    const rules = getRules();
    nodes.forEach((n) => { if (n.isConnected) applyTo(n, rules); });
  };
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "childList") r.addedNodes.forEach((n) => pending.add(n));
      else pending.add(r.target);
    }
    if (!frame) frame = requestAnimationFrame(flush);
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "style"] });
  return () => { obs.disconnect(); if (frame) cancelAnimationFrame(frame); };
}
