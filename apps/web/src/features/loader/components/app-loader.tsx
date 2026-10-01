"use client";

import { useEffect, useState } from "react";
import { AkbConstructionMark } from "./akb-construction-mark";

type AppLoaderProps = {
  isInitializing: boolean;
};

export function AppLoader({ isInitializing }: AppLoaderProps) {
  const [rendered, setRendered] = useState(isInitializing);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (isInitializing) {
      setRendered(true);
      setExiting(false);
      return;
    }

    if (!rendered) return;
    setExiting(true);
    const exitTimer = window.setTimeout(() => {
      setRendered(false);
      setExiting(false);
    }, 180);
    return () => window.clearTimeout(exitTimer);
  }, [isInitializing, rendered]);

  if (!rendered) return null;

  return (
    // biome-ignore lint/a11y/useSemanticElements: the loader contract requires an explicit status role.
    <div
      className="akb-app-loader"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy={isInitializing}
      data-state={exiting ? "exiting" : "active"}
    >
      <AkbConstructionMark decorative />
      <span className="sr-only">Loading AKB Studio</span>
    </div>
  );
}
