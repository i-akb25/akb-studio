import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const systemAreas = [
  "Portfolio",
  "AI",
  "CMS",
  "Analytics",
  "Security",
] as const;

type CurrentProjectProps = {
  image?: string;
  imageAlt?: string;
};

export function CurrentProject({
  image,
  imageAlt = "AKB Studio project interface",
}: CurrentProjectProps) {
  return (
    <article className="group relative isolate h-full min-h-[32rem] overflow-hidden rounded-[1.6rem] border border-foreground/10 bg-foreground/[0.025] sm:min-h-[36rem] lg:min-h-[40rem]">
      {image ? (
        <>
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority={false}
            sizes="(max-width: 1023px) calc(100vw - 2.5rem), 58vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-black/32"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-t from-black/95 via-black/76 to-transparent"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full text-foreground/[0.085]"
            viewBox="0 0 860 760"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <g
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            >
              <circle cx="438" cy="325" r="46" strokeWidth="1" />

              <circle
                cx="438"
                cy="325"
                r="92"
                strokeWidth="0.7"
                strokeDasharray="3 10"
              />

              <path
                d="M438 233V114M530 325H680M438 417V594M346 325H182"
                strokeWidth="0.85"
              />

              <path
                d="M373 260L268 157M503 260L616 158M503 390L626 509M373 390L258 514"
                strokeWidth="0.75"
                strokeDasharray="4 10"
              />

              <circle cx="438" cy="114" r="11" strokeWidth="1" />
              <circle cx="680" cy="325" r="11" strokeWidth="1" />
              <circle cx="438" cy="594" r="11" strokeWidth="1" />
              <circle cx="182" cy="325" r="11" strokeWidth="1" />

              <circle cx="268" cy="157" r="7" strokeWidth="0.9" />
              <circle cx="616" cy="158" r="7" strokeWidth="0.9" />
              <circle cx="626" cy="509" r="7" strokeWidth="0.9" />
              <circle cx="258" cy="514" r="7" strokeWidth="0.9" />

              <path
                d="M114 78H254M606 78H746M114 654H254M606 654H746"
                strokeWidth="0.65"
                strokeDasharray="3 9"
              />

              <path d="M421 325H455M438 308V342" strokeWidth="0.75" />
            </g>
          </svg>
        </div>
      )}

      <div
        aria-hidden="true"
        className={
          image
            ? "pointer-events-none absolute inset-0 hidden"
            : "pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-background via-background/88 to-transparent"
        }
      />

      <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-6 sm:p-8 lg:p-9 xl:p-10">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={
                  image
                    ? "size-2 rounded-full bg-white/75"
                    : "size-2 rounded-full bg-foreground/60"
                }
              />

              <p
                className={
                  image
                    ? "text-xs font-medium tracking-[0.14em] text-white/78 uppercase"
                    : "text-xs font-medium tracking-[0.14em] text-foreground/60 uppercase"
                }
              >
                Current build
              </p>
            </div>

            <p
              className={
                image
                  ? "mt-2 font-mono text-xs text-white/52"
                  : "mt-2 font-mono text-xs text-foreground/48"
              }
            >
              Project 00
            </p>
          </div>

          <div
            className={
              image
                ? "flex items-center gap-2 text-xs text-white/62"
                : "flex items-center gap-2 text-xs text-foreground/54"
            }
          >
            <span
              aria-hidden="true"
              className={
                image ? "h-px w-8 bg-white/28" : "h-px w-8 bg-foreground/20"
              }
            />
            In development
          </div>
        </header>

        <div className="mt-24 max-w-2xl sm:mt-32">
          <h3
            className={
              image
                ? "text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl"
                : "text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl"
            }
          >
            AKB Studio
          </h3>

          <p
            className={
              image
                ? "mt-4 max-w-xl text-pretty text-base leading-7 text-white/76 sm:text-lg sm:leading-8"
                : "mt-4 max-w-xl text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8"
            }
          >
            I&apos;m building this as more than a portfolio: a personal
            engineering platform where my projects, writing, AI, analytics,
            knowledge, and professional work can live as one connected system.
          </p>

          <dl
            className={
              image
                ? "mt-7 grid gap-x-8 gap-y-5 border-t border-white/16 pt-5 sm:grid-cols-2"
                : "mt-7 grid gap-x-8 gap-y-5 border-t border-foreground/10 pt-5 sm:grid-cols-2"
            }
          >
            <div>
              <dt
                className={
                  image
                    ? "text-xs font-medium tracking-[0.12em] text-white/58 uppercase"
                    : "text-xs font-medium tracking-[0.12em] text-foreground/54 uppercase"
                }
              >
                What I&apos;m solving
              </dt>

              <dd
                className={
                  image
                    ? "mt-2 text-sm leading-6 text-white/74"
                    : "mt-2 text-sm leading-6 text-foreground/72"
                }
              >
                How to represent engineering work with depth without turning the
                experience into a resume or a collection of cards.
              </dd>
            </div>

            <div>
              <dt
                className={
                  image
                    ? "text-xs font-medium tracking-[0.12em] text-white/58 uppercase"
                    : "text-xs font-medium tracking-[0.12em] text-foreground/54 uppercase"
                }
              >
                Current focus
              </dt>

              <dd
                className={
                  image
                    ? "mt-2 text-sm leading-6 text-white/74"
                    : "mt-2 text-sm leading-6 text-foreground/72"
                }
              >
                A clear home for my projects, writing, engineering experience,
                and the ideas I am exploring next.
              </dd>
            </div>
          </dl>

          <ul
            aria-label="AKB Studio system areas"
            className="mt-6 flex flex-wrap gap-x-5 gap-y-2"
          >
            {systemAreas.map((area) => (
              <li
                key={area}
                className={
                  image
                    ? "text-xs font-medium tracking-[0.08em] text-white/58 uppercase"
                    : "text-xs font-medium tracking-[0.08em] text-foreground/58 uppercase"
                }
              >
                {area}
              </li>
            ))}
          </ul>

          <p
            className={
              image
                ? "mt-7 flex items-center gap-3 text-sm font-medium text-white"
                : "mt-7 flex items-center gap-3 text-sm font-medium text-foreground"
            }
          >
            You&apos;re using it now
            <ArrowUpRight
              aria-hidden="true"
              className={
                image ? "size-4 text-white/64" : "size-4 text-foreground/60"
              }
              strokeWidth={1.6}
            />
          </p>
        </div>
      </div>
    </article>
  );
}
