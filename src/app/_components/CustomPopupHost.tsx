"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { trackEvent } from "@/lib/analytics";
import { matchesPages, safeLink, type CustomPopup } from "@/lib/popups";
import { usePopups } from "@/lib/popups.client";
import PopupView, { popupOnScreen, type PopupContent } from "./PopupView";

/**
 * The pop-ups made in /admin/popups, on the pages and for the visitors admin
 * chose, after the delay admin set.
 *
 * One at a time, and never over another pop-up (the sign-up popup included):
 * the first one that fits this page and visitor waits its turn. Once shown it
 * is not shown again this visit; once closed, not again for its "show again
 * after" days (0: next visit). Never on the app, admin, sign-in or payment pages.
 *
 * `?popup=<id>` shows that pop-up after a second whatever its switch, visit or
 * snooze, so it can be checked before switching it on.
 */

const SKIP = /^\/(app|admin|auth|invoices|m|checkout|payment)(\/|$)/;
const DAY_MS = 24 * 60 * 60 * 1000;
const seenKey = (id: string) => `jpt-popup-seen-${id}`; // sessionStorage
const closedKey = (id: string) => `jpt-popup-closed-${id}`; // localStorage

function read(kind: "local" | "session", key: string): string | null {
  try { return (kind === "local" ? localStorage : sessionStorage).getItem(key); } catch { return null; }
}
function write(kind: "local" | "session", key: string, value: string) {
  try { (kind === "local" ? localStorage : sessionStorage).setItem(key, value); } catch { /* private mode */ }
}

/** A made-in-admin pop-up's words and buttons, as PopupView takes them. */
export function customContent(c: CustomPopup, go: (href: string) => void, signUp: () => void): PopupContent {
  const link = safeLink(c.link);
  const second = safeLink(c.secondaryLink);
  return {
    label: c.title || c.name,
    badge: c.badge || undefined,
    title: c.title,
    text: c.text || undefined,
    bullets: c.bullets.split("\n").map((s) => s.trim()).filter(Boolean),
    image: c.image || undefined,
    caption: c.caption || undefined,
    beforeAfter: c.beforeAfter,
    primary: c.action === "signup"
      ? { label: c.button || "Continue with Google", onClick: signUp, google: true }
      : { label: c.button || "Open", onClick: () => { if (link) go(link); } },
    secondary: c.secondary && second ? { label: c.secondary, onClick: () => go(second) } : undefined,
    dismiss: c.dismiss || undefined,
  };
}

export default function CustomPopupHost() {
  const pathname = usePathname() || "/";
  const doc = usePopups();
  const [shown, setShown] = useState<CustomPopup | null>(null);

  useEffect(() => {
    if (!doc || SKIP.test(pathname) || window.top !== window.self) return;
    let forced = "";
    try { forced = new URLSearchParams(window.location.search).get("popup") || ""; } catch { /* no URL */ }
    const fits = (c: CustomPopup) => {
      if (c.id === forced) return true;
      if (!c.enabled || !matchesPages(c.pages, pathname)) return false;
      if (read("session", seenKey(c.id))) return false;
      const closedAt = Number(read("local", closedKey(c.id)) || 0);
      return !(closedAt && c.repeatDays > 0 && Date.now() - closedAt < c.repeatDays * DAY_MS);
    };
    const next = doc.custom.find(fits);
    if (!next) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const show = async () => {
      // Another pop-up is up: wait for it, rather than stack on top of it.
      if (popupOnScreen()) { timer = setTimeout(show, 3000); return; }
      if (next.audience !== "everyone" && next.id !== forced) {
        const me = await fetch("/api/auth/google/me", { cache: "no-store" }).then((r) => r.json()).catch(() => null) as { authenticated?: boolean } | null;
        if (!alive || !me) return;
        if ((next.audience === "signed-in") !== !!me.authenticated) return;
      }
      if (!alive) return;
      write("session", seenKey(next.id), "1");
      setShown(next);
    };
    timer = setTimeout(show, next.id === forced ? 1000 : next.delay * 1000);
    return () => { alive = false; clearTimeout(timer); };
  }, [doc, pathname]);

  useEffect(() => {
    if (shown) trackEvent("popup_shown", { popup: shown.id, name: shown.name, path: pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const close = () => {
    if (!shown) return;
    write("local", closedKey(shown.id), String(Date.now()));
    trackEvent("popup_dismiss", { popup: shown.id, path: pathname });
    setShown(null);
  };

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  if (!shown) return null;
  const go = (href: string) => {
    trackEvent("popup_click", { popup: shown.id, href, path: pathname });
    write("local", closedKey(shown.id), String(Date.now()));
    if (/^https?:/.test(href) && !href.startsWith(window.location.origin)) window.open(href, "_blank", "noopener");
    else window.location.href = href;
    setShown(null);
  };
  const signUp = () => {
    trackEvent("popup_click", { popup: shown.id, href: "google-signup", path: pathname });
    void beginGoogleSignIn(pathname);
  };
  return <PopupView design={shown.design} content={customContent(shown, go, signUp)} onClose={close} />;
}
