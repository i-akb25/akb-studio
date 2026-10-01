import Image from "next/image";

export function HeroPortrait() {
  return (
    <figure className="relative isolate mx-auto w-full max-w-[35rem] lg:mx-0">
      <div
        aria-hidden="true"
        className="absolute -inset-x-6 -inset-y-8 -z-10 opacity-55 sm:-inset-x-8 lg:-inset-x-10"
      >
        <svg
          aria-hidden="true"
          className="h-full w-full text-foreground/18"
          viewBox="0 0 620 760"
          fill="none"
        >
          <g
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            <path
              d="M102 608L170 484L142 314L246 152L404 126L516 246L494 430L550 572"
              strokeWidth="0.9"
            />

            <path
              d="M170 484L302 552L494 430M142 314L302 240L516 246"
              strokeWidth="0.75"
              strokeDasharray="4 9"
            />

            <path
              d="M302 90V670M68 380H566"
              strokeWidth="0.65"
              strokeDasharray="2 10"
            />

            <circle cx="302" cy="380" r="188" strokeWidth="0.65" />

            <circle
              cx="302"
              cy="380"
              r="222"
              strokeWidth="0.65"
              strokeDasharray="3 11"
            />

            <circle cx="142" cy="314" r="5" />
            <circle cx="246" cy="152" r="5" />
            <circle cx="404" cy="126" r="5" />
            <circle cx="516" cy="246" r="5" />
            <circle cx="494" cy="430" r="5" />
            <circle cx="302" cy="552" r="5" />
            <circle cx="170" cy="484" r="5" />
          </g>
        </svg>
      </div>

      <div className="relative overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-foreground/[0.025] shadow-[0_30px_90px_-46px_rgba(0,0,0,0.6)]">
        <Image
          src="/images/profile/heroo.webp"
          alt="Portrait of Anurag Kumar Bharti"
          width={1080}
          height={1350}
          priority
          sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 35rem, 42vw"
          className="h-auto w-full object-cover object-center"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-transparent"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute -right-4 top-[18%] hidden items-center gap-2 text-foreground/28 sm:flex"
      >
        <span className="h-px w-10 bg-current" />
        <span className="size-1.5 rounded-full border border-current" />
      </div>

      <div
        aria-hidden="true"
        className="absolute -left-4 bottom-[21%] hidden items-center gap-2 text-foreground/25 sm:flex"
      >
        <span className="size-1.5 rounded-full border border-current" />
        <span className="h-px w-12 bg-current" />
      </div>
    </figure>
  );
}
