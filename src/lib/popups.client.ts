"use client";

import { useEffect, useState } from "react";
import { loadPopups, popupText, type PopupsDoc, type PopupText } from "./popups";

/** The pop-up settings for a component: null until they've loaded (see popups.ts). */
export function usePopups(): PopupsDoc | null {
  const [doc, setDoc] = useState<PopupsDoc | null>(null);
  useEffect(() => {
    let alive = true;
    void loadPopups().then((d) => { if (alive) setDoc(d); });
    return () => { alive = false; };
  }, []);
  return doc;
}

/** popupText for a component: re-renders once the settings arrive. */
export function usePopup(id: string): PopupText {
  return popupText(id, usePopups());
}
