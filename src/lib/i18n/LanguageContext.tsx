"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, Translations, TRANSLATIONS } from "./translations";

interface LanguageContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  t: TRANSLATIONS.en,
  setLocale: () => {},
});

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("jpt-lang") as Locale | null;
    if (stored && stored in TRANSLATIONS) return stored;
    // Browser language hint
    const lang = navigator.language.split("-")[0] as Locale;
    if (lang in TRANSLATIONS) return lang;
  } catch {}
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try { localStorage.setItem("jpt-lang", l); } catch {}
    // Update html lang + dir for RTL support
    document.documentElement.lang = l;
    document.documentElement.dir = TRANSLATIONS[l].dir;
  }

  // Sync html attributes on first render
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = TRANSLATIONS[locale].dir;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, t: TRANSLATIONS[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
