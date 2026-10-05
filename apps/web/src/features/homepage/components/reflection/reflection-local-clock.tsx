"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const monthNames = [
  "जनवरी",
  "फ़रवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
] as const;

const weekdayNames = [
  "रविवार",
  "सोमवार",
  "मंगलवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार",
] as const;

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("hi-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatLocalDate(date: Date) {
  return new Intl.DateTimeFormat("hi-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toDateTimeAttribute(date: Date) {
  return date.toISOString();
}

export function ReflectionLocalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateClock = () => {
      setNow(new Date());
    };

    updateClock();

    const intervalId = window.setInterval(updateClock, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const display = useMemo(() => {
    if (!now) {
      return null;
    }

    return {
      day: String(now.getDate()).padStart(2, "0"),
      monthYear: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      weekday: weekdayNames[now.getDay()],
      time: formatClock(now),
      localDate: formatLocalDate(now),
      dateTime: toDateTimeAttribute(now),
    };
  }, [now]);

  return (
    <div className="relative flex h-full flex-col justify-between">
      <div>
        <p className="text-xs font-medium tracking-[0.15em] text-[#7a4c27]/82 uppercase dark:text-amber-300/65">
          <span lang="sa-Deva">दैनिक संस्कृत चिन्तनम्</span>
        </p>

        <div
          aria-hidden="true"
          className="mt-4 flex items-center gap-2 text-[#98693c]/48 dark:text-amber-300/30"
        >
          <span className="h-px w-10 bg-current" />
          <span className="size-1.5 rotate-45 border border-current" />
          <span className="h-px w-5 bg-current" />
        </div>
      </div>

      <div className="my-8 sm:my-10">
        {display ? (
          <time dateTime={display.dateTime} className="block">
            <span className="block font-serif text-6xl leading-none font-medium tracking-[-0.055em] text-[#4f321f] sm:text-7xl dark:text-foreground">
              {display.day}
            </span>

            <span
              lang="hi"
              className="mt-3 block text-base font-medium text-[#5f4734] dark:text-foreground/70"
            >
              {display.monthYear}
            </span>

            <span
              lang="hi"
              className="mt-2 block text-sm text-[#715b49] dark:text-foreground/55"
            >
              {display.weekday}
            </span>
          </time>
        ) : (
          <div aria-hidden="true" className="h-[8.75rem]" />
        )}

        <div className="relative mt-7 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute left-0 h-px w-[34%] bg-[#98693c]/24 dark:bg-amber-300/14"
          />

          <div
            aria-hidden="true"
            className="relative flex size-16 items-center justify-center rounded-full border border-[#98693c]/34 text-3xl text-[#8a592d] dark:border-amber-300/22 dark:text-amber-300/72"
          >
            <svg
              aria-hidden="true"
              className="absolute inset-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)]"
              viewBox="0 0 64 64"
              fill="none"
            >
              <circle
                cx="32"
                cy="32"
                r="27"
                stroke="currentColor"
                strokeWidth="0.7"
                strokeDasharray="2 4"
              />

              <path
                d="M32 5V12M32 52V59M5 32H12M52 32H59"
                stroke="currentColor"
                strokeWidth="0.7"
              />
            </svg>

            <span className="relative">ॐ</span>
          </div>

          <span
            aria-hidden="true"
            className="absolute right-0 h-px w-[34%] bg-[#98693c]/24 dark:bg-amber-300/14"
          />
        </div>
      </div>

      <div className="border-t border-[#98693c]/20 pt-5 dark:border-amber-300/12">
        <div className="flex items-center gap-3">
          <CalendarDays
            aria-hidden="true"
            className="size-4 text-[#8a592d]/72 dark:text-amber-300/55"
            strokeWidth={1.6}
          />

          {display ? (
            <time
              lang="hi"
              dateTime={display.dateTime}
              className="text-xs text-[#6c5543] dark:text-foreground/45"
            >
              {display.localDate}
            </time>
          ) : (
            <span aria-hidden="true" className="h-4 w-24" />
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Clock3
            aria-hidden="true"
            className="size-4 text-[#8a592d]/72 dark:text-amber-300/55"
            strokeWidth={1.6}
          />

          {display ? (
            <time
              dateTime={display.dateTime}
              className="text-sm font-medium tabular-nums text-[#4f3929] dark:text-foreground/72"
            >
              {display.time}
            </time>
          ) : (
            <span aria-hidden="true" className="h-5 w-16" />
          )}
        </div>
      </div>
    </div>
  );
}
