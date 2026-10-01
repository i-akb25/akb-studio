"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type DailyReflection,
  getDailyReflection,
} from "../../data/reflections";
import { ReflectionEntry } from "./reflection-entry";

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMillisecondsUntilNextLocalDay(date: Date) {
  const nextDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
    0,
    0,
    1,
  );

  return Math.max(nextDay.getTime() - date.getTime(), 1_000);
}

export function DailyReflectionPreview() {
  const [localDate, setLocalDate] = useState<Date | null>(null);

  useEffect(() => {
    let timeoutId: number | undefined;

    const scheduleNextDay = () => {
      const next = new Date();

      setLocalDate((current) => {
        if (current && getLocalDateKey(current) === getLocalDateKey(next)) {
          return current;
        }

        return next;
      });

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(
        scheduleNextDay,
        getMillisecondsUntilNextLocalDay(next),
      );
    };

    const syncDate = () => {
      scheduleNextDay();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncDate();
      }
    };

    scheduleNextDay();

    window.addEventListener("focus", syncDate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener("focus", syncDate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const reflection = useMemo<DailyReflection | null>(() => {
    if (!localDate) {
      return null;
    }

    return getDailyReflection(localDate);
  }, [localDate]);

  const localDateKey = localDate ? getLocalDateKey(localDate) : null;

  return (
    <section
      id="daily-reflection"
      aria-labelledby="daily-reflection-heading"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28 xl:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-amber-800/10 dark:bg-amber-300/[0.08]" />

        <svg
          aria-hidden="true"
          className="absolute top-10 -left-20 hidden h-80 w-52 text-amber-700/[0.055] lg:block dark:text-amber-300/[0.04]"
          viewBox="0 0 220 360"
          fill="none"
        >
          <path
            d="M110 338V111M60 338V111M160 338V111M49 111H171M57 91H163M68 72H152"
            stroke="currentColor"
            strokeWidth="0.8"
          />

          <path
            d="M78 72C80 44 91 23 110 6C129 23 140 44 142 72"
            stroke="currentColor"
            strokeWidth="0.8"
          />

          <path
            d="M72 154H148M72 200H148M72 246H148M72 292H148"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="3 8"
          />
        </svg>

        <svg
          aria-hidden="true"
          className="absolute -right-24 bottom-8 hidden size-80 text-amber-700/[0.045] md:block dark:text-amber-300/[0.035]"
          viewBox="0 0 360 360"
          fill="none"
        >
          <circle
            cx="180"
            cy="180"
            r="128"
            stroke="currentColor"
            strokeWidth="0.65"
          />

          <circle
            cx="180"
            cy="180"
            r="94"
            stroke="currentColor"
            strokeWidth="0.65"
            strokeDasharray="3 9"
          />

          <path
            d="M180 52V308M52 180H308M89 89L271 271M271 89L89 271"
            stroke="currentColor"
            strokeWidth="0.55"
            strokeDasharray="2 10"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-0 h-px bg-amber-800/[0.08] dark:bg-amber-300/[0.06]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-4 text-amber-800/50 dark:text-amber-300/45">
            <span aria-hidden="true" className="h-px w-10 bg-current sm:w-16" />

            <p className="text-xs font-medium tracking-[0.18em] uppercase">
              Daily Reflection
            </p>

            <span aria-hidden="true" className="h-px w-10 bg-current sm:w-16" />
          </div>

          <h2
            id="daily-reflection-heading"
            lang="sa"
            className="mt-4 font-serif text-4xl leading-tight font-medium tracking-[-0.035em] text-[#5c3a24] sm:text-5xl lg:text-[3.5rem] dark:text-[#d9a34b]"
          >
            दैनिक संस्कृत चिंतनम्
          </h2>

          <p
            lang="hi"
            className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-6 text-foreground/58 sm:text-base sm:leading-7"
          >
            प्राचीन ज्ञान, आधुनिक जीवन
          </p>

          <div
            aria-hidden="true"
            className="mx-auto mt-5 flex max-w-xs items-center gap-3 text-amber-800/32 dark:text-amber-300/30"
          >
            <span className="h-px flex-1 bg-current" />
            <span className="text-[0.625rem]">✦</span>
            <span className="size-1.5 rotate-45 border border-current" />
            <span className="text-[0.625rem]">✦</span>
            <span className="h-px flex-1 bg-current" />
          </div>
        </header>

        <div className="mt-8 sm:mt-10 lg:mt-12">
          {reflection && localDateKey ? (
            <ReflectionEntry key={localDateKey} reflection={reflection} />
          ) : (
            <output
              aria-live="polite"
              className="relative flex min-h-[34rem] items-center justify-center overflow-hidden rounded-[1.75rem] border border-amber-700/18 bg-[#f2ddbd] px-6 text-center dark:border-amber-300/16 dark:bg-[#0b0c0d]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#f2ddbd] via-[#f8ead4] to-[#e8cda6] dark:from-amber-400/[0.025] dark:via-transparent dark:to-amber-600/[0.018]" />

                <div className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-800/10 dark:border-amber-300/10" />

                <div className="absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-amber-800/[0.08] dark:border-amber-300/[0.08]" />
              </div>

              <div className="relative max-w-sm">
                <div
                  aria-hidden="true"
                  className="mx-auto flex items-center justify-center gap-3 text-[#8a592d]/55 dark:text-amber-300/45"
                >
                  <span className="h-px w-12 bg-current" />

                  <span className="text-3xl leading-none">ॐ</span>

                  <span className="h-px w-12 bg-current" />
                </div>

                <p className="mt-6 font-serif text-xl font-medium text-[#4f321f] dark:text-[#ead7bc]">
                  आज का चिंतन तैयार हो रहा है
                </p>

                <p className="mt-3 text-sm leading-6 text-[#6b503b] dark:text-foreground/58">
                  Preparing today&apos;s reflection using your local date.
                </p>
              </div>
            </output>
          )}
        </div>

        <footer className="mt-5 flex flex-col items-center justify-center gap-2 text-center">
          <div
            aria-hidden="true"
            className="flex items-center gap-3 text-foreground/32"
          >
            <span className="h-px w-8 bg-current" />
            <span>↻</span>
            <span className="h-px w-8 bg-current" />
          </div>

          <p lang="hi" className="text-xs text-foreground/48">
            कल फिर एक नया चिंतन
          </p>
        </footer>
      </div>
    </section>
  );
}
