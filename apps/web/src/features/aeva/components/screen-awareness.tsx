"use client";

import { useEffect } from "react";

export const AEVA_HIGHLIGHT_EVENT = "akb:aeva-highlight";

export function ScreenAwareness() {
  useEffect(() => {
    const onHighlight = (event: Event) => {
      const ids = (event as CustomEvent<string[]>).detail ?? [];
      for (const element of document.querySelectorAll(
        "[data-aeva-highlighted]",
      )) {
        element.removeAttribute("data-aeva-highlighted");
      }
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        element.setAttribute("data-aeva-highlighted", "");
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener(AEVA_HIGHLIGHT_EVENT, onHighlight);
    return () => window.removeEventListener(AEVA_HIGHLIGHT_EVENT, onHighlight);
  }, []);

  return null;
}
