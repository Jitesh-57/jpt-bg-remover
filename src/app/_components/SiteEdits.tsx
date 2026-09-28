"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { editsPublicUrl, isEditablePath, rulesFor, type PageEdits } from "@/lib/page-edits";
import { applyTo, watch } from "./site-edits-core";

// Only ever downloaded by an admin who has switched edit mode on.
const PageEditor = dynamic(() => import("./PageEditor"), { ssr: false });

export const EDITS_EVENT = "jpt-page-edits";
const EDIT_FLAG = "jpt_edit";

/**
 * Applies the copy and image changes made in the visual page editor, on every
 * page. The layout passes a snapshot (at most a minute old) so changes show
 * straight after hydration; a fresh copy is then fetched so a change made a
 * moment ago shows too.
 */
export default function SiteEdits({ initial }: { initial: PageEdits }) {
  const pathname = usePathname() || "/";
  const [edits, setEdits] = useState<PageEdits>(initial);
  const [editing, setEditing] = useState(false);
  const rulesRef = useRef(rulesFor(initial, pathname));

  // Fresh copy, and live updates from the editor.
  useEffect(() => {
    const url = editsPublicUrl();
    if (url) {
      fetch(`${url}?t=${Math.floor(Date.now() / 30_000)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: PageEdits | null) => { if (d?.pages) setEdits(d); })
        .catch(() => {});
    }
    const onEdit = (e: Event) => { const d = (e as CustomEvent<PageEdits>).detail; if (d?.pages) setEdits(d); };
    window.addEventListener(EDITS_EVENT, onEdit);
    return () => window.removeEventListener(EDITS_EVENT, onEdit);
  }, []);

  // Edit mode: ?jpt_edit=1 turns it on for this tab, ?jpt_edit=0 turns it off.
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get(EDIT_FLAG);
      if (q === "1") sessionStorage.setItem(EDIT_FLAG, "1");
      if (q === "0") sessionStorage.removeItem(EDIT_FLAG);
      setEditing(sessionStorage.getItem(EDIT_FLAG) === "1" && isEditablePath(location.pathname));
    } catch { /* storage blocked: no edit mode */ }
  }, [pathname]);

  // Apply now, and keep applying as the page renders.
  useEffect(() => {
    if (!isEditablePath(pathname)) return;
    rulesRef.current = rulesFor(edits, pathname);
    const rules = rulesRef.current;
    const any = Object.keys(rules.text).length || Object.keys(rules.images).length;
    // A full pass even with no rules, so a rule that was just removed is undone.
    applyTo(document.body, rules);
    if (!any && !editing) return;
    return watch(() => rulesRef.current);
  }, [edits, pathname, editing]);

  if (!editing) return null;
  return <PageEditor edits={edits} path={pathname} onExit={() => { try { sessionStorage.removeItem(EDIT_FLAG); } catch {} setEditing(false); }} />;
}
