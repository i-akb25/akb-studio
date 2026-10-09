"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ScreenAwareness() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    const highlightHashTarget = () => {
      for (const element of document.querySelectorAll(
        "[data-aeva-highlighted]",
      )) {
        element.removeAttribute("data-aeva-highlighted");
      }
      if (clearTimer) clearTimeout(clearTimer);
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (!/^[a-z0-9][a-z0-9-_]{0,79}$/i.test(id)) return;
      const element = document.getElementById(id);
      if (!element) return;
      element.setAttribute("data-aeva-highlighted", "");
      element.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      clearTimer = setTimeout(
        () => element.removeAttribute("data-aeva-highlighted"),
        4_000,
      );
    };
    const frame = requestAnimationFrame(highlightHashTarget);
    window.addEventListener("hashchange", highlightHashTarget);
    return () => {
      cancelAnimationFrame(frame);
      if (clearTimer) clearTimeout(clearTimer);
      window.removeEventListener("hashchange", highlightHashTarget);
    };
  }, [pathname]);

  return null;
}
