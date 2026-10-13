"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LiveAnalyticsRefresh({ intervalMs = 30_000 }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intervalMs, router]);

  return (
    <p className="akb-admin-note">
      Active-session data refreshes every {Math.round(intervalMs / 1_000)}
      seconds while this tab is visible.
    </p>
  );
}
