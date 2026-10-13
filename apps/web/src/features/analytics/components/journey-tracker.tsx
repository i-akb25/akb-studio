"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import { publicJourneyTarget } from "../model";

const PREFERENCE_KEY = "akb-privacy-preferences";
const SESSION_KEY = "akb-anonymous-journey";

function hasAnalyticsConsent() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(PREFERENCE_KEY) ?? "null",
    ) as {
      analytics?: boolean;
      version?: string;
    } | null;
    return (
      parsed?.analytics === true && parsed.version === POLICY_VERSIONS.cookies
    );
  } catch {
    return false;
  }
}

function sessionId() {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const value = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, value);
  return value;
}

function transmit(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/journey",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }
  void fetch("/api/analytics/journey", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
}

export function JourneyTracker() {
  const pathname = usePathname();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    setAnalyticsEnabled(hasAnalyticsConsent());
    function preferenceChanged(event: Event) {
      const detail = (event as CustomEvent<{ analytics?: boolean }>).detail;
      const enabled = detail?.analytics === true;
      setAnalyticsEnabled(enabled);
      if (!enabled) sessionStorage.removeItem(SESSION_KEY);
    }
    window.addEventListener("akb:privacy-preferences", preferenceChanged);
    return () =>
      window.removeEventListener("akb:privacy-preferences", preferenceChanged);
  }, []);

  useEffect(() => {
    const target = publicJourneyTarget(pathname);
    if (!target || !analyticsEnabled) return;
    const anonymousSessionId = sessionId();
    const startedAt = Date.now();
    transmit({ event: "view", anonymousSessionId, ...target });
    const heartbeat = () => {
      if (document.visibilityState === "visible" && hasAnalyticsConsent()) {
        transmit({ event: "heartbeat", anonymousSessionId, ...target });
      }
    };
    const heartbeatTimer = window.setInterval(heartbeat, 30_000);
    document.addEventListener("visibilitychange", heartbeat);
    return () => {
      window.clearInterval(heartbeatTimer);
      document.removeEventListener("visibilitychange", heartbeat);
      if (!hasAnalyticsConsent()) return;
      const seconds = Math.min(
        1_800,
        Math.max(1, Math.round((Date.now() - startedAt) / 1_000)),
      );
      transmit({ event: "duration", anonymousSessionId, seconds, ...target });
    };
  }, [analyticsEnabled, pathname]);

  return null;
}
