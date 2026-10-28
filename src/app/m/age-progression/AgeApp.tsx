"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CreativeApp } from "@/lib/creative-apps";
import { buildPrompt, defaultModelFor } from "@/lib/app-presets";
import { optionsFor, defaultValues, optionPhrases, optionSummary } from "@/lib/app-options";
import { CREDIT_COST } from "@/lib/plans";
import { publishCredits } from "@/lib/credits";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { useTrialOffer } from "@/lib/trial-offer";
import { TRIAL_PROVIDERS_LABEL } from "@/lib/trial-email";
import { prepareDataUrl, parseJsonResponse } from "@/lib/upload-prep";
import { savePendingContext, loadPendingContext, clearPendingContext } from "@/lib/pending-image";
import { userMessage } from "@/lib/user-message";
import { trackEvent } from "@/lib/analytics";
import GeneratingFx from "@/app/creative/[slug]/GeneratingFx";
import Paywall from "../_components/Paywall";
import { usePlayStore, recoverPlayPurchases } from "@/lib/play-billing.client";

/**
 * AI Age Progression — the mobile app, web version.
 *
 * One component with screen state rather than routes, so it behaves like an
 * app (no page loads between steps) and wraps cleanly for Android later.
 *
 *   welcome → home → age → generating → result      (tabs: Home · My Photos · Account)
 *   credits — the pack screen, over whichever screen raised it
 *
 * Generation is the site's own: the age-progression app's prompt and its
 * 1–100 age option, sent to /api/creative-edit, which charges credits and
 * files the result in My Creations. Results are also kept on the device for
 * the My Photos tab.
 */

type Example = { split: string | null; after: string[] };
type Screen = "welcome" | "home" | "age" | "generating" | "result" | "photos" | "account" | "credits";
type Session = { signedIn: boolean; credits: number | null; name?: string; email?: string; picture?: string };
type Shot = { id: string; age: number; after: string; before?: string; at: number; url?: string };

const TOOL = "m-age-progression";
/** This app's key in PLAY_APPS (lib/play-billing). */
const PLAY_APP = "age-progression";
const WELCOMED = "jpt-m-age-welcomed";
const HISTORY = "jpt-m-age-history";
/** Where in the app a Google sign-in started, so the round-trip lands back there. */
const RETURN_TO = "jpt-m-age-return";
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

/** What a result can be reported for (Play's AI-generated content policy). */
const REPORT_REASONS: [string, string][] = [
  ["offensive", "Offensive or hateful"],
  ["sexual", "Sexual or nude"],
  ["violent", "Violent or disturbing"],
  ["wrong", "Wrong or broken result"],
  ["other", "Something else"],
];

const QUICK_AGES = [
  { age: 8, label: "Child" },
  { age: 16, label: "Teen" },
  { age: 30, label: "30" },
  { age: 50, label: "50" },
  { age: 70, label: "70" },
  { age: 90, label: "90" },
];

function readHistory(): Shot[] {
  try { return JSON.parse(localStorage.getItem(HISTORY) || "[]") as Shot[]; } catch { return []; }
}
function writeHistory(list: Shot[]) {
  try { localStorage.setItem(HISTORY, JSON.stringify(list.slice(0, 40))); } catch { /* full or blocked */ }
}

/* ── Small pieces ─────────────────────────────────────────────────────────── */

function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const I = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  photos: "M4 5h16v14H4zM4 15l4.5-4.5L13 15m-1-1 2.5-2.5L20 17M15.5 8.5h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  upload: "M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  back: "M15 18l-6-6 6-6",
  save: "M12 4v12m0 0-4-4m4 4 4-4M5 20h14",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  gift: "M3 8h18v4H3zM12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5",
};

/**
 * onError for a server-rendered <img>: one that failed before hydration never
 * fires the handler, so the ref checks for that case as well.
 */
function failedRef(onError?: () => void) {
  return (el: HTMLImageElement | null) => { if (el && el.complete && el.naturalWidth === 0) onError?.(); };
}

/** One half of a side-by-side before|after creative. */
function Half({ src, side, onError }: { src: string; side: "before" | "after"; onError?: () => void }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={failedRef(onError)} src={src} alt="" className="mapp-half" onError={onError} style={{ left: side === "after" ? "-100%" : 0 }} />
  );
}

/** Shown when the example picture is missing or fails to load. */
function ExamplePlaceholder() {
  return (
    <div className="mapp-compare mapp-placeholder" aria-hidden>
      <span>⏳</span>
      <strong>Any age, 1 to 100</strong>
    </div>
  );
}

/** A before/after you drag across. `split` is one image holding both halves. */
function Compare({ before, after, split, labels = ["Now", "Older"], auto = false }: {
  before?: string; after?: string; split?: string; labels?: [string, string]; auto?: boolean;
}) {
  const [pos, setPos] = useState(50);
  const [touched, setTouched] = useState(false);
  const [broken, setBroken] = useState(false);
  // On the example, sweep gently until someone touches it.
  useEffect(() => {
    if (!auto || touched) return;
    let t = 0;
    const h = setInterval(() => { t += 0.035; setPos(50 + Math.sin(t) * 28); }, 40);
    return () => clearInterval(h);
  }, [auto, touched]);
  const layer = (which: "before" | "after") =>
    split ? <Half src={split} side={which} onError={() => setBroken(true)} /> : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={which === "before" ? before : after} alt="" className="mapp-img" />
    );
  if (broken) return <ExamplePlaceholder />;
  return (
    <div className="mapp-compare">
      {layer("before")}
      <div className="mapp-compare-after" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>{layer("after")}</div>
      <div className="mapp-compare-line" style={{ left: `${pos}%` }}><span /></div>
      <span className="mapp-chip mapp-chip-l">{labels[0]}</span>
      <span className="mapp-chip mapp-chip-r">{labels[1]}</span>
      <input type="range" min={0} max={100} value={pos} aria-label="Compare before and after"
        onChange={(e) => { setTouched(true); setPos(Number(e.target.value)); }} className="mapp-compare-range" />
    </div>
  );
}

/* ── The app ──────────────────────────────────────────────────────────────── */

export default function AgeApp({ app, example }: { app: CreativeApp; example: Example }) {
  const options = useMemo(() => optionsFor(app), [app]);
  const [screen, setScreen] = useState<Screen>("home");
  const [slide, setSlide] = useState(0);
  const [session, setSession] = useState<Session>({ signedIn: false, credits: null });
  const [photo, setPhoto] = useState<string | null>(null);
  const [age, setAge] = useState(70);
  const [result, setResult] = useState<Shot | null>(null);
  const [history, setHistory] = useState<Shot[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // The sheet over the screen: report a result, or ask for the account to be deleted.
  const [sheet, setSheet] = useState<"report" | "delete" | null>(null);
  const [reason, setReason] = useState(REPORT_REASONS[0][0]);
  const [sending, setSending] = useState(false);
  // The screen the pack screen returns to when it closes.
  const [payFrom, setPayFrom] = useState<Screen>("home");
  const trial = useTrialOffer();
  const play = usePlayStore();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // First visit sees the welcome slides; everyone gets their history and session.
  useEffect(() => {
    try { if (!localStorage.getItem(WELCOMED)) setScreen("welcome"); } catch { /* blocked */ }
    setHistory(readHistory());

    /*
      Back from Google sign-in: the auth callback returns to this page (and
      AuthReturn steps in if its cookie was lost), so the app picks up where it
      left off — the same tab, the same age, the photo restored below — rather
      than the user landing anywhere on the website.
    */
    let back: { screen?: Screen; age?: number } | null = null;
    try {
      back = JSON.parse(sessionStorage.getItem(RETURN_TO) || "null");
      sessionStorage.removeItem(RETURN_TO);
    } catch { /* blocked */ }
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("error");
    // Keep the app's address clean of a failed sign-in's message. (A `code`
    // is left alone: AuthReturn, in the layout, still has to finish that one.)
    if (authError) window.history.replaceState(null, "", window.location.pathname);
    if (back) {
      try { localStorage.setItem(WELCOMED, "1"); } catch { /* blocked */ }
      if (typeof back.age === "number") setAge(back.age);
      if (back.screen === "account" || back.screen === "photos") setScreen(back.screen);
      else setScreen("home");
      if (authError) setErr("Sign-in didn't finish. Please try again.");
    }

    fetch("/api/auth/google/me").then((r) => r.json())
      .then((d: { authenticated?: boolean; credits?: number; name?: string; email?: string; picture?: string; trialGranted?: number }) => {
        if (!d.authenticated) return;
        setSession({ signedIn: true, credits: typeof d.credits === "number" ? d.credits : null, name: d.name, email: d.email, picture: d.picture });
        // A new account's free trial, announced here rather than on the website's dashboard.
        const m = document.cookie.match(/(?:^|; )jpt_trial=(\d+)/);
        const granted = d.trialGranted || (m ? Number(m[1]) : 0);
        if (m) document.cookie = "jpt_trial=; path=/; max-age=0";
        if (granted > 0) {
          const n = Math.floor(granted / CREDIT_COST);
          setToast(`Welcome! Your first ${n > 1 ? `${n} age photos are` : "age photo is"} on us.`);
        } else if (back) {
          setToast(`Signed in${d.name ? ` as ${d.name}` : ""}`);
        }
      }).catch(() => {});
    // A photo kept across the Google sign-in comes back ready to age.
    void loadPendingContext().then((ctx) => {
      if (ctx?.tool === TOOL && ctx.image) {
        setPhoto(ctx.image);
        setScreen("age");
        void clearPendingContext();
      }
    });
  }, []);

  // In the Play app: credit any purchase that was paid but not confirmed (app closed mid-way, a pending payment cleared).
  useEffect(() => {
    if (!play.store || !session.signedIn) return;
    void recoverPlayPurchases(play.store, PLAY_APP).then((credits) => {
      if (credits === null) return;
      setSession((s) => (s.credits !== null && credits > s.credits ? { ...s, credits } : s));
      publishCredits(credits);
    });
  }, [play.store, session.signedIn]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // A screen that has lost its data (age with no photo, result with none) goes home.
  useEffect(() => {
    if ((screen === "age" && !photo) || (screen === "result" && !result)) setScreen("home");
  }, [screen, photo, result]);

  const openPaywall = () => {
    // Not mid-generation: its result would land on top of the pack screen.
    if (screen === "generating" || screen === "credits") return;
    setPayFrom(screen);
    setScreen("credits");
  };

  const refreshCredits = (credits: number | null) => {
    if (credits !== null) {
      setSession((s) => ({ ...s, credits }));
      publishCredits(credits);
      return;
    }
    // The payment verified without a balance in the reply: read it back.
    fetch("/api/auth/google/me").then((r) => r.json())
      .then((d: { credits?: number }) => { if (typeof d.credits === "number") refreshCredits(d.credits); })
      .catch(() => {});
  };

  const finishWelcome = () => {
    try { localStorage.setItem(WELCOMED, "1"); } catch { /* blocked */ }
    setScreen("home");
  };

  const onFile = useCallback(async (file: File) => {
    setErr(null);
    if (!file.type.startsWith("image/")) { setErr("Please choose a photo (JPG, PNG or WebP)."); return; }
    if (file.size > 15 * 1024 * 1024) { setErr("That photo is over 15 MB. Please pick a smaller one."); return; }
    const raw = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    setPhoto(await prepareDataUrl(raw));
    setScreen("age");
  }, []);

  const signIn = async () => {
    try { sessionStorage.setItem(RETURN_TO, JSON.stringify({ screen: screen === "credits" ? payFrom : screen, age })); } catch { /* blocked */ }
    if (photo) await savePendingContext({ image: photo, tool: TOOL });
    // Back to this app, never the website: see the return handling on mount.
    await beginGoogleSignIn("/m/age-progression");
  };

  const generate = async () => {
    if (!photo) return;
    if (!session.signedIn) { await signIn(); return; }
    if (session.credits !== null && session.credits < CREDIT_COST) { openPaywall(); return; }

    setErr(null);
    setScreen("generating");
    trackEvent("m_age_generate", { age });
    const values = { ...defaultValues(options), age: String(age) };
    try {
      // A URL keeps the request small; the data URL is the fallback if the upload fails.
      let payload: { dataUrl?: string; imageUrl?: string } = { dataUrl: photo };
      if (!photo.startsWith("http")) {
        try {
          const { uploadDataUrlToSupabase } = await import("@/lib/supabase-upload");
          payload = { imageUrl: await uploadDataUrlToSupabase(photo) };
        } catch { /* keep the data URL */ }
      } else {
        payload = { imageUrl: photo };
      }

      const res = await fetch("/api/creative-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          prompt: buildPrompt(app, "solo", null, "", optionPhrases(options, values), defaultModelFor(app)),
          slug: app.slug,
          model: defaultModelFor(app),
          preset: optionSummary(options, values) || undefined,
        }),
      });
      type Body = { dataUrl?: string; resultUrl?: string | null; error?: string; credits?: number; upgradeRequired?: boolean };
      let data: Body = {};
      try { data = await parseJsonResponse<Body>(res); } catch (e) { data = { error: (e as Error).message }; }

      if (typeof data.credits === "number") {
        setSession((s) => ({ ...s, credits: data.credits! }));
        publishCredits(data.credits);
      }
      if (res.status === 401) { await signIn(); return; }
      if (res.status === 402 || res.status === 403 || data.upgradeRequired) { setPayFrom("age"); setScreen("credits"); return; }
      if (!res.ok || !data.dataUrl) {
        setErr(userMessage(data.error, "That didn't work. Please try again."));
        setScreen("age");
        return;
      }

      const shot: Shot = { id: `${Date.now()}`, age, after: data.dataUrl, before: payload.imageUrl, at: Date.now(), url: data.resultUrl ?? undefined };
      setResult(shot);
      setScreen("result");
      // Kept on the device by URL (a data URL would fill localStorage in a few shots).
      if (data.resultUrl) {
        const next = [{ ...shot, after: data.resultUrl }, ...history];
        setHistory(next);
        writeHistory(next);
      }
    } catch {
      setErr("Could not reach the server. Check your connection and try again.");
      setScreen("age");
    }
  };

  const save = async (shot: Shot) => {
    try {
      const blob = await (await fetch(shot.after)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `age-${shot.age}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      window.open(shot.after, "_blank");
    }
  };

  const share = async (shot: Shot) => {
    try {
      const blob = await (await fetch(shot.after)).blob();
      const file = new File([blob], `age-${shot.age}.png`, { type: blob.type || "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Me at " + shot.age, text: `Me at ${shot.age} — made with Pixel Shine` });
        return;
      }
      await navigator.share?.({ title: "Age Progression · Pixel Shine", url: "https://www.sjpt.io/creative/age-progression" });
    } catch { /* cancelled */ }
  };

  const signOut = async () => {
    try { await fetch("/api/auth/google/logout", { method: "POST" }); } catch { /* ignore */ }
    try { const { createSupabaseClient } = await import("@/lib/supabase"); await createSupabaseClient().auth.signOut(); } catch { /* ignore */ }
    setSession({ signedIn: false, credits: null });
  };

  /** Posts the open sheet's request; closes it with a thank-you, or keeps it open with the error. */
  const sendSheet = async () => {
    const report = sheet === "report";
    setSending(true);
    try {
      const res = await fetch(report ? "/api/report" : "/api/account/delete-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(report
          ? { app: PLAY_APP, reason, age: result?.age, image: result?.url ?? result?.after }
          : { source: PLAY_APP }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setToast(userMessage(data.error, "That didn't go through. Please try again.")); return; }
      setSheet(null);
      setToast(report
        ? "Thanks for telling us. We review every report."
        : "Request received. Your account and photos will be deleted within 30 days.");
    } catch {
      setToast("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const tab: "home" | "photos" | "account" = screen === "photos" ? "photos" : screen === "account" ? "account" : "home";
  const showTabs = screen === "home" || screen === "photos" || screen === "account";
  const [afterBroken, setAfterBroken] = useState(false);
  const exampleCompare = example.split
    ? <Compare split={example.split} auto labels={["Before", "After"]} />
    : example.after[0] && !afterBroken
      // eslint-disable-next-line @next/next/no-img-element
      ? <div className="mapp-compare"><img ref={failedRef(() => setAfterBroken(true))} src={example.after[0]} alt="" className="mapp-img" onError={() => setAfterBroken(true)} /></div>
      : <ExamplePlaceholder />;

  /* ── Screens ── */

  const Header = ({ title, back }: { title: string; back?: () => void }) => (
    <header className="mapp-header">
      {back ? <button className="mapp-iconbtn" onClick={back} aria-label="Back"><Icon d={I.back} /></button> : <span className="mapp-logo"><Icon d={I.spark} size={18} /></span>}
      <span className="mapp-title">{title}</span>
      {session.signedIn && session.credits !== null
        ? <button className="mapp-credits" onClick={openPaywall}>{session.credits} credits</button>
        : <span style={{ width: 40 }} />}
    </header>
  );

  const pickers = (
    <>
      <input ref={cameraRef} type="file" accept={ACCEPT} capture="user" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />
      <input ref={galleryRef} type="file" accept={ACCEPT} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />
    </>
  );

  let body: React.ReactNode = null;

  if (screen === "welcome") {
    const slides = [
      { title: "See yourself at any age", text: "Upload a selfie and AI shows you older or younger, in seconds." },
      { title: "From 1 to 100", text: "Pick an age — a child, a teenager, or 90 — and compare it with your photo today." },
      { title: "Sharp, private results", text: "2K images with no watermark, saved to your account so you never lose them." },
    ];
    const s = slides[slide];
    body = (
      <div className="mapp-welcome">
        <button className="mapp-skip" onClick={finishWelcome}>Skip</button>
        <div className="mapp-welcome-art">{exampleCompare}</div>
        <div className="mapp-welcome-copy">
          <h1>{s.title}</h1>
          <p>{s.text}</p>
          <div className="mapp-dots">{slides.map((_, i) => <span key={i} className={i === slide ? "on" : ""} />)}</div>
          <button className="mapp-primary" onClick={() => (slide < slides.length - 1 ? setSlide(slide + 1) : finishWelcome())}>
            {slide < slides.length - 1 ? "Next" : "Get started"}
          </button>
        </div>
      </div>
    );
  } else if (screen === "home") {
    body = (
      <>
        <Header title="Age Progression" />
        <main className="mapp-scroll">
          <div className="mapp-hero">{exampleCompare}</div>
          <h1 className="mapp-h1">See yourself at any age</h1>
          <p className="mapp-sub">Take a selfie or pick a photo. Choose an age from 1 to 100.</p>
          {!session.signedIn && trial && (
            <button className="mapp-trial" onClick={() => galleryRef.current?.click()}>
              <Icon d={I.gift} size={18} /> Your first age photo is free — new accounts
            </button>
          )}
          <div className="mapp-actions">
            <button className="mapp-primary" onClick={() => cameraRef.current?.click()}><Icon d={I.camera} /> Take a selfie</button>
            <button className="mapp-secondary" onClick={() => galleryRef.current?.click()}><Icon d={I.upload} /> Upload a photo</button>
          </div>
          {err && <div className="mapp-error">{err}</div>}
          <ul className="mapp-tips">
            <li>Face the camera, one person in the photo</li>
            <li>Good light, no sunglasses</li>
            <li>Results in about 20–40 seconds</li>
          </ul>
        </main>
      </>
    );
  } else if (screen === "age" && photo) {
    body = (
      <>
        <Header title="Choose an age" back={() => setScreen("home")} />
        <main className="mapp-scroll">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="mapp-preview"><img src={photo} alt="Your photo" /></div>
          <div className="mapp-age-readout"><strong>{age}</strong> years old</div>
          <div className="mapp-quick">
            {QUICK_AGES.map((q) => (
              <button key={q.age} className={age === q.age ? "on" : ""} onClick={() => setAge(q.age)}>{q.label}</button>
            ))}
          </div>
          <input type="range" min={1} max={100} value={age} onChange={(e) => setAge(Number(e.target.value))} className="mapp-slider" aria-label="Age" />
          <div className="mapp-scale"><span>1</span><span>50</span><span>100</span></div>
          {err && <div className="mapp-error">{err}</div>}
        </main>
        <footer className="mapp-cta">
          <button className="mapp-primary" onClick={() => void generate()}>
            {!session.signedIn
              ? (trial ? "Try it free — sign in with Google" : "Sign in with Google to continue")
              : session.credits !== null && session.credits < CREDIT_COST
                ? "Get credits to continue"
                : `Show me at ${age} · ${CREDIT_COST} credits`}
          </button>
          <button className="mapp-link" onClick={() => galleryRef.current?.click()}>Use a different photo</button>
        </footer>
      </>
    );
  } else if (screen === "generating") {
    body = (
      <>
        <Header title={`Aging to ${age}…`} />
        <main className="mapp-gen"><GeneratingFx ghost={photo} name="Age Progression" /></main>
      </>
    );
  } else if (screen === "result" && result) {
    body = (
      <>
        <Header title={`You at ${result.age}`} back={() => setScreen("age")} />
        <main className="mapp-scroll">
          <Compare before={result.before || photo || undefined} after={result.after} labels={["Now", `${result.age}`]} />
          <p className="mapp-sub" style={{ textAlign: "center" }}>Drag to compare. Saved in My Photos.</p>
          <div className="mapp-row">
            <button className="mapp-secondary" onClick={() => void save(result)}><Icon d={I.save} /> Save</button>
            <button className="mapp-secondary" onClick={() => void share(result)}><Icon d={I.share} /> Share</button>
          </div>
          <button className="mapp-link mapp-report" onClick={() => { setReason(REPORT_REASONS[0][0]); setSheet("report"); }}>Report this image</button>
        </main>
        <footer className="mapp-cta">
          <button className="mapp-primary" onClick={() => setScreen("age")}>Try another age</button>
          <button className="mapp-link" onClick={() => { setPhoto(null); setResult(null); setScreen("home"); }}>New photo</button>
        </footer>
      </>
    );
  } else if (screen === "credits") {
    const backToAge = payFrom === "age" && !!photo;
    body = (
      <Paywall
        unit={{ one: "age photo", many: "age photos" }}
        signedIn={session.signedIn}
        balance={session.credits}
        prefill={{ name: session.name, email: session.email }}
        play={{ app: PLAY_APP, inApp: play.inApp, store: play.store }}
        next={backToAge && photo ? { photo, label: `Next up: you at ${age}` } : null}
        onClose={() => setScreen(payFrom)}
        onSignIn={() => void signIn()}
        onPurchased={refreshCredits}
        onContinue={backToAge ? () => { setScreen("age"); void generate(); } : () => setScreen("home")}
        continueLabel={backToAge ? `Show me at ${age}` : "Start aging"}
      />
    );
  } else if (screen === "photos") {
    body = (
      <>
        <Header title="My Photos" />
        <main className="mapp-scroll">
          {history.length === 0 ? (
            <div className="mapp-empty">
              <Icon d={I.photos} size={40} />
              <p>Your age photos will appear here.</p>
              <button className="mapp-primary" onClick={() => setScreen("home")}>Make your first one</button>
            </div>
          ) : (
            <div className="mapp-grid">
              {history.map((h) => (
                <button key={h.id} className="mapp-tile" onClick={() => { setResult(h); setScreen("result"); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.after} alt={`At ${h.age}`} loading="lazy" />
                  <span>{h.age}</span>
                </button>
              ))}
            </div>
          )}
        </main>
      </>
    );
  } else if (screen === "account") {
    body = (
      <>
        <Header title="Account" />
        <main className="mapp-scroll">
          {session.signedIn ? (
            <>
              <div className="mapp-card mapp-profile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {session.picture ? <img src={session.picture} alt="" /> : <span className="mapp-avatar"><Icon d={I.user} /></span>}
                <div><strong>{session.name || "Signed in"}</strong><span>{session.credits ?? 0} credits · {Math.floor((session.credits ?? 0) / CREDIT_COST)} age photos</span></div>
              </div>
              <button className="mapp-primary" onClick={openPaywall}>Buy credits</button>
              <button className="mapp-link" onClick={() => void signOut()}>Sign out</button>
              <button className="mapp-link mapp-link-danger" onClick={() => setSheet("delete")}>Delete account</button>
            </>
          ) : (
            <div className="mapp-card">
              <strong style={{ fontSize: 17 }}>Sign in to save your photos</strong>
              <p className="mapp-sub">Your photos and credits stay with your Google account.{trial ? ` New ${TRIAL_PROVIDERS_LABEL} accounts get their first age photo free.` : ""}</p>
              <button className="mapp-primary" onClick={() => void signIn()}>Continue with Google</button>
            </div>
          )}
          <p className="mapp-fine">AI age progression is a fun, illustrative guess, not a prediction.</p>
          <p className="mapp-fine"><a href="/privacy">Privacy policy</a> · <a href="/terms">Terms</a> · <a href="/delete-account">Delete account</a></p>
        </main>
      </>
    );
  }

  return (
    <div className="mapp-stage">
      <div className="mapp-phone">
        {pickers}
        <div className="mapp-screen">{body}</div>
        {toast && <div className="mapp-toast" role="status" onClick={() => setToast(null)}>{toast}</div>}
        {sheet && (
          <div className="mapp-sheet-back" onClick={() => { if (!sending) setSheet(null); }}>
            <div className="mapp-sheet" role="dialog" aria-modal="true" aria-labelledby="mapp-sheet-title" onClick={(e) => e.stopPropagation()}>
              {sheet === "report" ? (
                <>
                  <h2 id="mapp-sheet-title" className="mapp-sheet-title">Report this image</h2>
                  <p className="mapp-sub">What&apos;s wrong with it? We review every report and remove results that break our rules.</p>
                  <div className="mapp-reasons" role="radiogroup" aria-label="Reason">
                    {REPORT_REASONS.map(([id, label]) => (
                      <button key={id} role="radio" aria-checked={reason === id} className={`mapp-reason${reason === id ? " on" : ""}`} onClick={() => setReason(id)}>{label}</button>
                    ))}
                  </div>
                  <button className="mapp-primary" disabled={sending} aria-busy={sending} onClick={() => void sendSheet()}>
                    {sending ? <span className="mapp-spin" /> : "Send report"}
                  </button>
                </>
              ) : (
                <>
                  <h2 id="mapp-sheet-title" className="mapp-sheet-title">Delete your account?</h2>
                  <p className="mapp-sub">Your account, your photos and any unused credits will be permanently deleted within 30 days. This can&apos;t be undone, so save any photos you want to keep first.</p>
                  <button className="mapp-primary mapp-danger" disabled={sending} aria-busy={sending} onClick={() => void sendSheet()}>
                    {sending ? <span className="mapp-spin" /> : "Delete my account"}
                  </button>
                </>
              )}
              <button className="mapp-link" disabled={sending} onClick={() => setSheet(null)}>Cancel</button>
            </div>
          </div>
        )}
        {showTabs && (
          <nav className="mapp-tabs" aria-label="App">
            <button className={tab === "home" ? "on" : ""} onClick={() => setScreen("home")}><Icon d={I.home} />Home</button>
            <button className={tab === "photos" ? "on" : ""} onClick={() => setScreen("photos")}><Icon d={I.photos} />My Photos</button>
            <button className={tab === "account" ? "on" : ""} onClick={() => setScreen("account")}><Icon d={I.user} />Account</button>
          </nav>
        )}
      </div>
    </div>
  );
}
