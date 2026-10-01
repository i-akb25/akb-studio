import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AevaInterfacePreview } from "./aeva-interface-preview";

export function AevaPreview() {
  return (
    <section
      id="aeva"
      aria-labelledby="aeva-heading"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24 xl:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <svg
          aria-hidden="true"
          className="absolute top-12 -right-32 hidden size-[34rem] text-foreground/[0.03] lg:block"
          viewBox="0 0 540 540"
          fill="none"
        >
          <g
            stroke="currentColor"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          >
            <circle cx="270" cy="270" r="190" strokeWidth="0.65" />

            <circle
              cx="270"
              cy="270"
              r="146"
              strokeWidth="0.55"
              strokeDasharray="3 9"
            />

            <circle cx="270" cy="270" r="78" strokeWidth="0.7" />

            <path
              d="M270 80V192M270 348V460M80 270H192M348 270H460"
              strokeWidth="0.55"
              strokeDasharray="3 8"
            />

            <path
              d="M136 136L216 216M404 136L324 216M404 404L324 324M136 404L216 324"
              strokeWidth="0.55"
              strokeDasharray="3 8"
            />

            <circle cx="270" cy="80" r="6" strokeWidth="0.75" />
            <circle cx="460" cy="270" r="6" strokeWidth="0.75" />
            <circle cx="270" cy="460" r="6" strokeWidth="0.75" />
            <circle cx="80" cy="270" r="6" strokeWidth="0.75" />

            <circle cx="136" cy="136" r="5" strokeWidth="0.7" />
            <circle cx="404" cy="136" r="5" strokeWidth="0.7" />
            <circle cx="404" cy="404" r="5" strokeWidth="0.7" />
            <circle cx="136" cy="404" r="5" strokeWidth="0.7" />

            <path d="M249 270H291M270 249V291" strokeWidth="0.6" />
          </g>
        </svg>

        <svg
          aria-hidden="true"
          className="absolute bottom-8 -left-16 hidden h-72 w-56 text-foreground/[0.035] md:block"
          viewBox="0 0 240 300"
          fill="none"
        >
          <path
            d="M18 250C68 231 68 181 106 166C146 150 167 188 210 153C232 135 231 105 222 82"
            stroke="currentColor"
            strokeWidth="0.7"
            strokeDasharray="4 9"
          />

          <circle
            cx="18"
            cy="250"
            r="5"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="106"
            cy="166"
            r="5"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="210"
            cy="153"
            r="5"
            stroke="currentColor"
            strokeWidth="0.7"
          />
          <circle
            cx="222"
            cy="82"
            r="5"
            stroke="currentColor"
            strokeWidth="0.7"
          />
        </svg>
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-7 border-b border-foreground/10 pb-8 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12 lg:pb-10 xl:gap-16">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-foreground/48">06</span>

            <span
              aria-hidden="true"
              className="mt-2 h-px w-10 bg-foreground/15"
            />

            <span
              aria-hidden="true"
              className="mt-[0.375rem] size-1.5 rounded-full border border-foreground/25"
            />

            <p className="text-sm font-medium tracking-[0.14em] text-foreground/60 uppercase">
              Meet Aeva
            </p>
          </div>

          <div className="max-w-3xl">
            <h2
              id="aeva-heading"
              className="text-balance text-3xl leading-tight font-semibold tracking-[-0.04em] text-foreground sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
            >
              Instead of making you search through everything, I want Aeva to
              help you find the part of my work that matters to you.
            </h2>

            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
              She is the disclosed intelligence layer across this portfolio: a
              focused assistant that connects projects, experience, writing,
              engineering decisions, and the context behind how I build.
            </p>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12 xl:gap-16">
          <div className="lg:pt-3">
            <div className="max-w-lg">
              <p className="text-xs font-medium tracking-[0.13em] text-foreground/54 uppercase">
                A different way to explore
              </p>

              <p className="mt-4 text-pretty text-lg leading-8 text-foreground/76 sm:text-xl sm:leading-9">
                A portfolio usually asks the visitor to follow its structure.
                I&apos;d rather let the visitor start with their own question.
              </p>

              <p className="mt-4 text-pretty text-sm leading-7 text-foreground/66 sm:text-base">
                A recruiter may care about experience. An engineer may want
                architecture and trade-offs. Someone else may be interested in
                robotics, AI, or what I&apos;m currently building. Aeva is
                intended to become the route between those questions and the
                relevant parts of this site.
              </p>
            </div>

            <dl className="mt-7 border-y border-foreground/10">
              <div className="grid grid-cols-[6rem_1fr] gap-5 border-b border-foreground/10 py-4">
                <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-foreground/46">
                  MODE
                </dt>

                <dd className="text-sm text-foreground/70">
                  Contextual exploration
                </dd>
              </div>

              <div className="grid grid-cols-[6rem_1fr] gap-5 border-b border-foreground/10 py-4">
                <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-foreground/46">
                  SOURCE
                </dt>

                <dd className="text-sm text-foreground/70">
                  My work and knowledge
                </dd>
              </div>

              <div className="grid grid-cols-[6rem_1fr] gap-5 py-4">
                <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-foreground/46">
                  STATUS
                </dt>

                <dd className="flex items-center gap-2 text-sm text-foreground/70">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-foreground/50"
                  />
                  Available now
                </dd>
              </div>
            </dl>

            <div
              aria-hidden="true"
              className="mt-7 flex items-center gap-3 text-foreground/28"
            >
              <span className="font-mono text-[0.625rem] tracking-[0.12em]">
                QUESTION
              </span>

              <span className="h-px flex-1 bg-current" />

              <span className="size-1.5 rounded-full border border-current" />

              <span className="h-px w-10 bg-current" />

              <span className="font-mono text-[0.625rem] tracking-[0.12em]">
                CONTEXT
              </span>
            </div>

            <Link
              href="/aeva"
              className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-full border border-foreground/16 bg-foreground/[0.025] py-2 pr-4 pl-2 text-sm font-semibold text-foreground transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-warm hover:bg-foreground/[0.05] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <Image
                src="/images/aeva/aeva-portrait.webp"
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-full border border-foreground/16 object-cover object-top"
              />
              Talk to Aeva
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                strokeWidth={1.7}
              />
            </Link>
          </div>

          <AevaInterfacePreview />
        </div>
      </div>
    </section>
  );
}
