import Image from "next/image";

export function AboutPortrait() {
  return (
    <figure className="relative mx-auto w-full max-w-[32rem] lg:mx-0">
      <div
        aria-hidden="true"
        className="absolute -left-5 top-10 hidden h-[70%] w-px bg-foreground/10 sm:block"
      />

      <div
        aria-hidden="true"
        className="absolute -left-8 top-10 hidden items-center gap-2 text-foreground/24 sm:flex"
      >
        <span className="size-1.5 rounded-full border border-current" />
        <span className="h-px w-9 bg-current" />
      </div>

      <div className="relative overflow-hidden rounded-[1.5rem] border border-foreground/10 bg-foreground/[0.025]">
        <Image
          src="/images/profile/about.webp"
          alt="Anurag Kumar Bharti"
          width={1000}
          height={1250}
          sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 32rem, 36vw"
          className="h-auto w-full object-cover object-center"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-transparent"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between gap-4 text-white/58"
        >
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full border border-current" />
            <span className="h-px w-7 bg-current" />
            <span className="font-mono text-[0.625rem] tracking-[0.12em] uppercase">
              Field note
            </span>
          </div>

          <span className="font-mono text-[0.625rem] tracking-[0.12em] uppercase">
            Journey / 01
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-6 border-t border-foreground/10 pt-4">
        <figcaption className="text-sm leading-6 text-foreground/52">
          I keep noticing how places, systems, and people change the way a
          problem needs to be approached.
        </figcaption>

        <div
          aria-hidden="true"
          className="hidden items-center gap-2 text-foreground/24 sm:flex"
        >
          <span className="font-mono text-[0.625rem] tracking-[0.12em]">
            27.0
          </span>
          <span className="h-px w-7 bg-current" />
          <span className="size-1.5 rounded-full border border-current" />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute -right-10 top-[18%] hidden w-20 text-foreground/18 lg:block"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 80 200"
          fill="none"
          className="h-auto w-full"
        >
          <path
            d="M40 8V42C40 62 19 68 19 91C19 110 39 118 39 139C39 159 24 170 24 192"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="3 7"
          />

          <circle cx="40" cy="8" r="3" stroke="currentColor" />
          <circle cx="19" cy="91" r="3" stroke="currentColor" />
          <circle cx="39" cy="139" r="3" stroke="currentColor" />
          <circle cx="24" cy="192" r="3" stroke="currentColor" />
        </svg>
      </div>
    </figure>
  );
}
