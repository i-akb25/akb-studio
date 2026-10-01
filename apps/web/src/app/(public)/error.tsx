"use client";

import { useEffect } from "react";

function routeCategory(pathname: string) {
  const category = pathname.split("/").filter(Boolean)[0] ?? "home";
  return [
    "projects",
    "journal",
    "knowledge",
    "pravaah",
    "about",
    "resume",
    "lab",
    "aeva",
    "contact",
  ].includes(category)
    ? category
    : "other";
}

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/monitoring/error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scope: "public-boundary",
        route: routeCategory(window.location.pathname),
      }),
    }).catch(() => undefined);
  }, []);
  return (
    <main className="mx-auto grid min-h-[60vh] w-full max-w-3xl place-content-center px-5 py-20 text-center">
      <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">
        Controlled failure
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
        This page could not finish loading.
      </h1>
      <p className="mx-auto mt-5 max-w-xl leading-7 text-muted">
        The failure was recorded without sending the page content or anything
        you typed.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mx-auto mt-8 min-h-11 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
      >
        Try again
      </button>
    </main>
  );
}
