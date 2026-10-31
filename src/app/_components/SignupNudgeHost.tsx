"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { useTrialOffer } from "@/lib/trial-offer";
import { trackEvent } from "@/lib/analytics";
import { POPUP_DESIGNS, type PopupDesign } from "@/lib/popups";
import { usePopup } from "@/lib/popups.client";
import SignupNudge from "./SignupNudge";
import { popupOnScreen } from "./PopupView";
import SignInModal from "./SignInModal";

/**
 * When the sign-up popup (SignupNudge) shows: to signed-out visitors on every
 * page they open, 5 s after they land. Closed, it comes back every 12 s on the
 * same page until they sign up, and once they've closed it, later pages in the
 * visit show it after 12 s rather than 5. Only the visitor's session decides:
 * logged in, never; logged out, yes, even on a browser that has signed in
 * before, so a returning user is asked straight away. Never inside the app,
 * admin, sign-in or payment pages, and never on top of another pop-up. The
 * delay, the comeback, the design and the on/off switch are set in /admin/popups.
 *
 * `?nudge=1` shows it after a second even with the switch off, still to
 * signed-out visitors only, for testing; `?nudge=center` (or `split`, `card`,
 * `corner`) does the same in that design.
 */

const SKIP = /^\/(app|admin|auth|invoices|m|pricing|checkout|payment)(\/|$)/;
const CLOSED = "jpt-nudge-closed"; // sessionStorage: closed at least once this visit
let firstPage = true; // the page the visitor landed on, before any in-site navigation

function closedThisVisit(): boolean {
  try { return sessionStorage.getItem(CLOSED) === "1"; } catch { return false; }
}
function markClosed() {
  try { sessionStorage.setItem(CLOSED, "1"); } catch { /* private mode */ }
}

export default function SignupNudgeHost() {
  const pathname = usePathname() || "/";
  const offer = useTrialOffer();
  const p = usePopup("signup");
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState<PopupDesign | undefined>();
  const [emailOpen, setEmailOpen] = useState(false);
  const skip = SKIP.test(pathname);
  const design = forced ?? (p.t("design") as PopupDesign);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comebacks = useRef(0); // times it may still come back on this page (Infinity: until they sign up)
  const showLater = useRef<(seconds: number) => void>(() => {});
  const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };

  // Signing in ends it on this page; the next page asks the session again.
  useEffect(() => {
    const done = () => { stop(); showLater.current = () => {}; setOpen(false); };
    window.addEventListener("jpt:signed-in", done);
    return () => window.removeEventListener("jpt:signed-in", done);
  }, []);

  useEffect(() => {
    // Wait for the admin settings; never inside a frame.
    if (skip || !p.ready || window.top !== window.self) return;
    let force = false;
    try {
      const v = new URLSearchParams(window.location.search).get("nudge");
      const asDesign = POPUP_DESIGNS.find(([d]) => d === v)?.[0];
      force = v === "1" || !!asDesign;
      if (asDesign) setForced(asDesign);
    } catch { /* no URL */ }
    if (!force && !p.enabled) return;
    let alive = true;
    const limit = Math.floor(Number(p.t("reshowTimes")) || 0);
    comebacks.current = limit > 0 ? limit : Infinity;
    const show = async () => {
      // Another pop-up is up: wait for it, rather than stack on top of it.
      if (popupOnScreen()) { timer.current = setTimeout(show, 3000); return; }
      const me = await fetch("/api/auth/google/me", { cache: "no-store" }).then((r) => r.json()).catch(() => null) as { authenticated?: boolean } | null;
      if (!alive) return;
      if (me?.authenticated) return;
      if (!me) return; // couldn't tell: say nothing
      // One may have opened while we asked (a sign-in box from a tool, say).
      if (popupOnScreen()) { timer.current = setTimeout(show, 3000); return; }
      setOpen(true);
    };
    showLater.current = (seconds) => { stop(); timer.current = setTimeout(show, Math.max(0, seconds) * 1000); };
    // 5 s on arrival; once they've closed it this visit, a new page waits as long as a comeback.
    const wait = force ? 1 : Number(p.t(closedThisVisit() ? "reshowSeconds" : "delay")) || 0;
    // On the page they landed on, count from when it started opening, not from when this code ran.
    const loading = firstPage ? performance.now() / 1000 : 0;
    firstPage = false;
    showLater.current(wait - loading);
    return () => { alive = false; stop(); showLater.current = () => {}; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, pathname, p.ready, p.enabled]);

  useEffect(() => {
    if (open) trackEvent("signup_nudge_shown", { path: pathname, trial: !!offer, variant: design });
    // Once per showing, with the offer as it stood then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Closed without signing up: back again on this page after reshowSeconds, until they sign up.
  const comeBack = () => {
    markClosed();
    if (comebacks.current <= 0) return;
    comebacks.current -= 1;
    showLater.current(Number(p.t("reshowSeconds")) || 0);
  };

  const close = () => {
    setOpen(false);
    trackEvent("signup_nudge_dismiss", { path: pathname, trial: !!offer, variant: design });
    comeBack();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Back to this page after signing in, without the testing switch.
  const here = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("nudge");
    return url.pathname + url.search;
  };

  if (emailOpen) return <SignInModal startWithEmail nextPath={here()} onClose={() => { setEmailOpen(false); comeBack(); }} />;
  if (!open || skip) return null;
  return (
    <SignupNudge
      p={p}
      offer={offer}
      design={design}
      onClose={close}
      onGoogle={() => {
        trackEvent("signup_nudge_google", { path: pathname, trial: !!offer, variant: design });
        void beginGoogleSignIn(here());
      }}
      onEmail={() => {
        trackEvent("signup_nudge_email", { path: pathname, trial: !!offer, variant: design });
        setOpen(false);
        setEmailOpen(true);
      }}
    />
  );
}
