"use client";

import type { AnimationItem } from "lottie-web";
import { useEffect, useRef, useState } from "react";

const ANIMATION_PATH =
  "/animations/about/Connecting/Networking%20For%20All.json";

export function PravaahNetworkAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let animation: AnimationItem | undefined;
    let cancelled = false;
    let loaded = false;

    const loadTimeout = window.setTimeout(() => {
      if (!loaded && !cancelled) {
        setFailed(true);
      }
    }, 8_000);

    void Promise.all([
      import("lottie-web"),
      fetch(ANIMATION_PATH, { cache: "force-cache" }),
    ])
      .then(async ([{ default: lottie }, response]) => {
        if (!response.ok) {
          throw new Error("Pravaah animation asset unavailable");
        }

        const animationData = (await response.json()) as object;

        if (cancelled) return;

        animation = lottie.loadAnimation({
          autoplay: !reducedMotion.matches,
          animationData,
          container,
          loop: !reducedMotion.matches,
          renderer: "canvas",
          rendererSettings: {
            clearCanvas: true,
            preserveAspectRatio: "xMidYMid meet",
          },
        });

        animation.addEventListener("data_failed", () => {
          if (!cancelled) {
            setFailed(true);
          }
        });

        animation.addEventListener("DOMLoaded", () => {
          if (cancelled || !animation) return;

          loaded = true;
          window.clearTimeout(loadTimeout);
          setFailed(false);

          if (reducedMotion.matches) {
            const totalFrames = animation.getDuration(true);

            animation.goToAndStop(
              Math.max(1, Math.floor(totalFrames * 0.62)),
              true,
            );

            window.requestAnimationFrame(() => {
              if (!cancelled) {
                setReady(true);
              }
            });
          }
        });

        animation.addEventListener("enterFrame", () => {
          if (!cancelled) {
            setReady(true);
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
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
        data-ready={ready}
        aria-hidden="true"
      />

      {!ready ? (
        <div className="pravaah-network-animation__static" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {failed && !ready ? (
        <p className="pravaah-network-animation__fallback">
          Public ideas, connected.
        </p>
      ) : null}

      <figcaption>ONE PUBLIC RECORD / MANY SOURCES</figcaption>
    </figure>
  );
}