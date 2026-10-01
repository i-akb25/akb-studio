"use client";

import type { AnimationItem } from "lottie-web";
import { useEffect, useRef, useState } from "react";

const ANIMATION_PATH =
  "/animations/about/Connecting/Networking%20For%20All.json";

export function PravaahNetworkAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: AnimationItem | undefined;
    let cancelled = false;

    void import("lottie-web")
      .then(({ default: lottie }) => {
        if (cancelled) return;

        animation = lottie.loadAnimation({
          autoplay: !reducedMotion.matches,
          container,
          loop: !reducedMotion.matches,
          path: ANIMATION_PATH,
          renderer: "svg",
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: true,
          },
        });
        animation.addEventListener("data_failed", () => setFailed(true));
        if (reducedMotion.matches) {
          animation.addEventListener("DOMLoaded", () => {
            animation?.goToAndStop(0, true);
          });
        }
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  return (
    <figure
      className="pravaah-network-animation"
      aria-label="A network of connected public ideas and conversations"
    >
      <div
        ref={containerRef}
        className="pravaah-network-animation__canvas"
        aria-hidden="true"
      />
      {failed ? (
        <p className="pravaah-network-animation__fallback">
          Public ideas, connected.
        </p>
      ) : null}
      <figcaption>ONE PUBLIC RECORD / MANY SOURCES</figcaption>
    </figure>
  );
}
