"use client";

import type { DailyReflection } from "../../data/reflections";
import { ReflectionLocalClock } from "./reflection-local-clock";
import { ReflectionSound } from "./reflection-sound";
import { ReflectionVedicBackdrop } from "./reflection-vedic-backdrop";

type ReflectionEntryProps = {
  reflection: DailyReflection;
};

export function ReflectionEntry({ reflection }: ReflectionEntryProps) {
  return (
    <ReflectionSound>
      <article className="relative isolate overflow-hidden rounded-[1.75rem] border border-amber-700/18 bg-[#fbf6ec] shadow-[0_24px_80px_-55px_rgba(98,57,18,0.5)] dark:border-amber-300/16 dark:bg-[#0b0c0d]">
        <ReflectionVedicBackdrop />

        <div className="relative z-10 grid lg:grid-cols-[13rem_1fr] xl:grid-cols-[14rem_1fr]">
          <aside className="relative border-b border-amber-700/16 px-6 py-7 sm:px-8 sm:py-8 lg:border-r lg:border-b-0 lg:py-10 dark:border-amber-300/13">
            <ReflectionLocalClock />
          </aside>

          <div className="relative px-6 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-11 xl:px-14">
            <header className="text-center">
              <div
                aria-hidden="true"
                className="mx-auto flex max-w-sm items-center justify-center gap-3 text-amber-700/48 dark:text-amber-300/45"
              >
                <span className="h-px flex-1 bg-current" />

                <svg
                  aria-hidden="true"
                  className="size-8"
                  viewBox="0 0 40 40"
                  fill="none"
                >
                  <path
                    d="M20 34C20 26 13.5 23.5 9 21.5C14 20.5 18 16.5 20 11C22 16.5 26 20.5 31 21.5C26.5 23.5 20 26 20 34Z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />

                  <path
                    d="M20 11C16.5 12.8 13.2 11.3 11 8C15 8 18 6 20 3C22 6 25 8 29 8C26.8 11.3 23.5 12.8 20 11Z"
                    stroke="currentColor"
                    strokeWidth="1"
                  />

                  <path
                    d="M9 21.5C13 25 14.5 29 14 34M31 21.5C27 25 25.5 29 26 34M14 34H26"
                    stroke="currentColor"
                    strokeWidth="0.8"
                  />
                </svg>

                <span className="h-px flex-1 bg-current" />
              </div>

              <blockquote className="mt-5">
                <p
                  lang="sa"
                  className="mx-auto max-w-4xl text-balance font-serif text-2xl leading-[1.75] font-medium tracking-[-0.02em] text-[#5c3a24] sm:text-3xl sm:leading-[1.7] lg:text-[2.15rem] dark:text-[#ead7bc]"
                >
                  {reflection.sanskrit}
                </p>
              </blockquote>

              <p className="mt-4 text-sm font-medium tracking-[0.08em] text-amber-700/76 dark:text-amber-300/72">
                {reflection.source} {reflection.reference}
              </p>

              <div
                aria-hidden="true"
                className="mx-auto mt-5 flex max-w-lg items-center gap-3 text-amber-700/34 dark:text-amber-300/32"
              >
                <span className="h-px flex-1 bg-current" />
                <span className="size-1.5 rotate-45 border border-current" />
                <span className="h-px flex-1 bg-current" />
              </div>

              <p
                lang="sa-Latn"
                className="mx-auto mt-4 max-w-3xl font-mono text-xs leading-6 text-foreground/52 sm:text-sm"
              >
                {reflection.transliteration}
              </p>
            </header>

            <div className="mt-8 grid gap-7 border-t border-amber-700/14 pt-7 sm:grid-cols-2 sm:gap-9 dark:border-amber-300/12">
              <section aria-labelledby={`reflection-hindi-${reflection.id}`}>
                <div className="flex items-center gap-3">
                  <svg
                    aria-hidden="true"
                    className="size-5 text-amber-700/68 dark:text-amber-300/68"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M4 5.5C6.5 4.5 9 4.5 12 6v13c-3-1.5-5.5-1.5-8-.5v-13ZM20 5.5C17.5 4.5 15 4.5 12 6v13c3-1.5 5.5-1.5 8-.5v-13Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <h3
                    id={`reflection-hindi-${reflection.id}`}
                    className="text-sm font-medium tracking-[0.08em] text-amber-700/76 dark:text-amber-300/72"
                  >
                    हिंदी अर्थ
                  </h3>
                </div>

                <p
                  lang="hi"
                  className="mt-3.5 text-pretty text-sm leading-7 text-foreground/74 sm:text-base"
                >
                  {reflection.hindiMeaning}
                </p>
              </section>

              <section
                aria-labelledby={`reflection-english-${reflection.id}`}
                className="border-t border-amber-700/12 pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-9 dark:border-amber-300/10"
              >
                <div className="flex items-center gap-3">
                  <svg
                    aria-hidden="true"
                    className="size-5 text-amber-700/68 dark:text-amber-300/68"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />

                    <path
                      d="M3.5 12H20.5M12 3C14.5 5.5 15.5 8.5 15.5 12C15.5 15.5 14.5 18.5 12 21M12 3C9.5 5.5 8.5 8.5 8.5 12C8.5 15.5 9.5 18.5 12 21"
                      stroke="currentColor"
                      strokeWidth="1.1"
                    />
                  </svg>

                  <h3
                    id={`reflection-english-${reflection.id}`}
                    className="text-xs font-medium tracking-[0.13em] text-amber-700/76 uppercase dark:text-amber-300/72"
                  >
                    English meaning
                  </h3>
                </div>

                <p className="mt-3.5 text-pretty text-sm leading-7 text-foreground/74 sm:text-base">
                  {reflection.englishMeaning}
                </p>
              </section>
            </div>

            <aside className="mt-7 border-t border-amber-700/12 pt-6 dark:border-amber-300/10">
              <div className="grid gap-3 sm:grid-cols-[9rem_1fr] sm:gap-8">
                <p className="text-xs font-medium tracking-[0.12em] text-foreground/52 uppercase">
                  What I carry forward
                </p>

                <p className="max-w-3xl text-pretty text-sm leading-7 text-foreground/70 sm:text-base">
                  {reflection.personalReflection}
                </p>
              </div>
            </aside>

            <div
              aria-hidden="true"
              className="mt-7 flex items-center justify-center gap-3 text-amber-700/28 dark:text-amber-300/26"
            >
              <span className="h-px w-8 bg-current sm:w-10" />
              <span className="text-[0.625rem]">✦</span>
              <span className="h-px w-12 bg-current sm:w-16" />
              <span className="size-1.5 rotate-45 border border-current" />
              <span className="h-px w-12 bg-current sm:w-16" />
              <span className="text-[0.625rem]">✦</span>
              <span className="h-px w-8 bg-current sm:w-10" />
            </div>
          </div>
        </div>
      </article>
    </ReflectionSound>
  );
}
