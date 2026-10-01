"use client";

import { useEffect, useRef } from "react";

export function SmartCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const move = (event: PointerEvent) => {
      document.documentElement.setAttribute("data-smart-cursor", "ready");
      const transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      ringRef.current?.style.setProperty("transform", transform);
      dotRef.current?.style.setProperty("transform", transform);
      ringRef.current?.setAttribute("data-visible", "");
      dotRef.current?.setAttribute("data-visible", "");
      const interactive = (event.target as Element | null)?.closest(
        "a, button, [role='button'], [data-cursor]",
      );
      const editable = (event.target as Element | null)?.closest(
        "input, textarea, select, [contenteditable='true']",
      );
      ringRef.current?.toggleAttribute(
        "data-interactive",
        Boolean(interactive),
      );
      ringRef.current?.toggleAttribute("data-suspended", Boolean(editable));
      dotRef.current?.toggleAttribute("data-suspended", Boolean(editable));
    };
    const hide = () => {
      ringRef.current?.removeAttribute("data-visible");
      dotRef.current?.removeAttribute("data-visible");
    };
    const show = () => {
      ringRef.current?.setAttribute("data-visible", "");
      dotRef.current?.setAttribute("data-visible", "");
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerenter", show);
    window.addEventListener("pointerleave", hide);
    return () => {
      document.documentElement.removeAttribute("data-smart-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerenter", show);
      window.removeEventListener("pointerleave", hide);
    };
  }, []);

  return (
    <div aria-hidden="true" className="smart-cursor-layer">
      <div ref={ringRef} className="smart-cursor-ring" />
      <div ref={dotRef} className="smart-cursor-dot" />
    </div>
  );
}
