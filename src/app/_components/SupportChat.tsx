"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

const WIDGET_SRC = "https://sjpt-chat.vercel.app/widget.js";
const SITE_KEY = "site_fb7ccac3b50d44d0b6b4a063fae347b2";

/**
 * The support chatbot, for signed-in users only.
 *
 * It used to load on every page for everyone, which meant the bubble sat over
 * the landing pages offering help to visitors we cannot answer — there is no
 * account behind an anonymous conversation, so a reply has nowhere to go — and
 * it pulled a third-party script into every first visit, on the critical path
 * of the pages that need to be fastest.
 *
 * The session is read from the Supabase cookie in the browser, so this costs no
 * request. It is a presentation gate, not a security one: nothing secret sits
 * behind the widget, and the chat service does its own auth.
 */
export default function SupportChat() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    let alive = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (alive) setSignedIn(!!session?.user);
    });

    // Covers a sign-in that happens without a reload — a token refresh, or a
    // second tab signing in.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setSignedIn(!!session?.user);
    });

    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  /*
    Injected by hand rather than with next/script.

    This runs after the session check, which is usually after the window load
    event — and `lazyOnload` keys off that event, so a <Script> rendered this
    late may never run at all. Appending the tag ourselves has no such timing
    dependency, and `async` keeps it off the render path.
  */
  useEffect(() => {
    if (!signedIn) return;
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = WIDGET_SRC;
    s.async = true;
    s.dataset.sjptKey = SITE_KEY;
    document.body.appendChild(s);
    // Deliberately not removed on unmount: the widget builds its own DOM and
    // holds its own state, and pulling the tag out would not clean that up.
    // Signing out reloads the page, which is what actually removes it.
  }, [signedIn]);

  return null;
}
