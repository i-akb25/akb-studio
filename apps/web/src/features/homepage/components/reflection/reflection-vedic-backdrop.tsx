const mandalaTicks = Array.from({ length: 12 }, (_, index) => {
  const angle = index * 30;
  const radians = (angle * Math.PI) / 180;
  const innerRadius = 220;
  const outerRadius = 234;

  return {
    angle,
    x1: 300 + Math.cos(radians) * innerRadius,
    y1: 300 + Math.sin(radians) * innerRadius,
    x2: 300 + Math.cos(radians) * outerRadius,
    y2: 300 + Math.sin(radians) * outerRadius,
  };
});

export function ReflectionVedicBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#f2ddbd] via-[#f8ead4] to-[#e8cda6] dark:from-amber-400/[0.025] dark:via-transparent dark:to-amber-600/[0.018]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,250,235,0.76),transparent_40%)] dark:bg-none" />

      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/22 to-transparent dark:hidden" />

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-amber-900/[0.045] to-transparent dark:hidden" />

      <svg
        aria-hidden="true"
        className="absolute top-1/2 -right-24 hidden size-[35rem] -translate-y-1/2 text-[#98693c]/12 md:block dark:text-amber-300/[0.075]"
        viewBox="0 0 600 600"
        fill="none"
      >
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          <circle cx="300" cy="300" r="212" strokeWidth="0.7" />

          <circle
            cx="300"
            cy="300"
            r="178"
            strokeWidth="0.65"
            strokeDasharray="2 8"
          />

          <circle cx="300" cy="300" r="136" strokeWidth="0.75" />

          <circle
            cx="300"
            cy="300"
            r="94"
            strokeWidth="0.65"
            strokeDasharray="3 8"
          />

          <path d="M300 147L432 376H168L300 147Z" strokeWidth="0.75" />

          <path d="M300 453L168 224H432L300 453Z" strokeWidth="0.75" />

          <path
            d="M300 88V512M88 300H512"
            strokeWidth="0.55"
            strokeDasharray="3 11"
          />

          <path
            d="M150 150L450 450M450 150L150 450"
            strokeWidth="0.5"
            strokeDasharray="2 11"
          />

          {mandalaTicks.map((tick) => (
            <path
              key={tick.angle}
              d={`M${tick.x1} ${tick.y1}L${tick.x2} ${tick.y2}`}
              strokeWidth="0.65"
            />
          ))}

          <circle cx="300" cy="300" r="7" strokeWidth="0.9" />

          <path d="M286 300H314M300 286V314" strokeWidth="0.65" />
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="absolute bottom-0 -left-10 hidden h-[88%] w-48 text-[#8b5a30]/14 lg:block dark:text-amber-300/[0.08]"
        viewBox="0 0 190 640"
        fill="none"
      >
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M52 640V154M138 640V154" strokeWidth="1" />

          <path d="M42 154H148M48 137H142M57 119H133" strokeWidth="0.9" />

          <path
            d="M66 119C67 90 78 63 95 39C112 63 123 90 124 119"
            strokeWidth="0.9"
          />

          <path
            d="M73 101C76 79 83 60 95 44C107 60 114 79 117 101"
            strokeWidth="0.65"
          />

          <path
            d="M52 208H138M52 262H138M52 316H138M52 370H138M52 424H138M52 478H138M52 532H138"
            strokeWidth="0.5"
            strokeDasharray="2 7"
          />

          <path
            d="M66 176H124V206H66V176ZM66 232H124V260H66V232ZM66 286H124V314H66V286Z"
            strokeWidth="0.55"
          />

          <path d="M58 576H132M48 600H142M38 624H152" strokeWidth="0.8" />
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="absolute top-0 -right-4 hidden h-72 w-32 text-[#925f31]/22 sm:block dark:text-amber-300/[0.15]"
        viewBox="0 0 130 300"
        fill="none"
      >
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M65 0V70" strokeWidth="1" />

          <path
            d="M57 0C58 16 72 16 73 0M59 20H71M59 35H71M59 50H71"
            strokeWidth="0.7"
          />

          <path
            d="M65 70C47 77 37 98 38 126C39 153 49 171 30 190H100C81 171 91 153 92 126C93 98 83 77 65 70Z"
            strokeWidth="1"
          />

          <path d="M30 190C43 201 87 201 100 190" strokeWidth="0.8" />

          <circle cx="65" cy="202" r="5" strokeWidth="0.8" />

          <path d="M65 207V221" strokeWidth="0.7" />
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="absolute top-8 left-[18%] hidden size-24 text-[#98693c]/18 sm:block dark:text-amber-300/[0.1]"
        viewBox="0 0 120 120"
        fill="none"
      >
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          <path
            d="M60 96C60 73 42 66 28 60C43 57 54 48 60 33C66 48 77 57 92 60C78 66 60 73 60 96Z"
            strokeWidth="1"
          />

          <path
            d="M60 33C50 38 43 36 37 27C48 27 55 23 60 14C65 23 72 27 83 27C77 36 70 38 60 33Z"
            strokeWidth="0.85"
          />

          <path
            d="M28 60C38 69 43 81 42 96M92 60C82 69 77 81 78 96M42 96H78"
            strokeWidth="0.75"
          />
        </g>
      </svg>

      <div className="absolute inset-x-8 top-0 flex items-center sm:inset-x-12">
        <span className="h-px flex-1 bg-[#98693c]/18 dark:bg-amber-300/[0.1]" />

        <span className="mx-3 size-1.5 rotate-45 border border-[#98693c]/38 dark:border-amber-300/25" />

        <span className="h-px w-12 bg-[#98693c]/28 dark:bg-amber-300/[0.16]" />

        <span className="mx-3 text-[0.65rem] text-[#98693c]/58 dark:text-amber-300/40">
          ✦
        </span>

        <span className="h-px w-12 bg-[#98693c]/28 dark:bg-amber-300/[0.16]" />

        <span className="mx-3 size-1.5 rotate-45 border border-[#98693c]/38 dark:border-amber-300/25" />

        <span className="h-px flex-1 bg-[#98693c]/18 dark:bg-amber-300/[0.1]" />
      </div>

      <div className="absolute inset-x-8 bottom-0 flex items-center sm:inset-x-12">
        <span className="h-px w-16 bg-[#98693c]/20 dark:bg-amber-300/[0.1]" />

        <span className="mx-3 size-1.5 rotate-45 border border-[#98693c]/34 dark:border-amber-300/20" />

        <span className="h-px flex-1 bg-[#98693c]/12 dark:bg-amber-300/[0.07]" />
      </div>
    </div>
  );
}
