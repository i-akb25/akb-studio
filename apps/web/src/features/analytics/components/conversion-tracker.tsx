"use client";

import { useEffect } from "react";
import type { AnalyticsEvent } from "@/features/analytics/model";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";

const PREFERENCE_KEY = "akb-privacy-preferences";
const SESSION_KEY = "akb-anonymous-journey";

function consented() {
  try {
    const value = JSON.parse(
      localStorage.getItem(PREFERENCE_KEY) ?? "null",
    ) as { analytics?: boolean; version?: string } | null;
    return (
      value?.analytics === true && value.version === POLICY_VERSIONS.cookies
    );
  } catch {
    return false;
  }
}

function sessionId() {
  const current = sessionStorage.getItem(SESSION_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

export function trackConversion(event: AnalyticsEvent, target?: string) {
  if (!consented()) return;
  const body = JSON.stringify({
    event,
    anonymousSessionId: sessionId(),
    ...(target ? { target } : {}),
    consentVersion: POLICY_VERSIONS.cookies,
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/events",
      new Blob([body], { type: "application/json" }),
    );
    return;
  }
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
}

function eventForLink(
  link: HTMLAnchorElement,
): { event: AnalyticsEvent; target?: string } | null {
  const url = new URL(link.href, window.location.origin);
  if (url.origin !== window.location.origin) return null;
  if (/^\/resume\/.+\.pdf$/i.test(url.pathname))
    return { event: "resume_download" };
  const project = url.pathname.match(
    /^\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/,
  );
  if (project) return { event: "project_open", target: project[1] };
  const article = url.pathname.match(
    /^\/(?:journal|knowledge)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/,
  );
  if (article) return { event: "article_open", target: article[1] };
  if (url.pathname === "/aeva") return { event: "aeva_open" };
  if (url.pathname === "/contact") return { event: "contact_open" };
  return null;
}

export function ConversionTracker() {
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!link) return;
      const metric = eventForLink(link);
      if (metric) trackConversion(metric.event, metric.target);
    };
    document.addEventListener("click", click, { capture: true });
    return () =>
      document.removeEventListener("click", click, { capture: true });
  }, []);
  return null;
}
