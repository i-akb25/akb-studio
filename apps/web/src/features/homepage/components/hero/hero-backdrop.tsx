export function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
    >
      <svg
        aria-hidden="true"
        className="absolute -left-16 top-[9%] h-[52%] w-[42%] max-w-[36rem] text-foreground opacity-[0.035] dark:opacity-[0.05]"
        viewBox="0 0 520 520"
        fill="none"
      >
        <g stroke="currentColor" vectorEffect="non-scaling-stroke">
          {Array.from({ length: 8 }, (_, index) => {
            const offset = 40 + index * 56;

            return (
              <path
                key={`vertical-${offset}`}
                d={`M${offset} 0V520`}
                strokeWidth="0.8"
              />
            );
          })}

          {Array.from({ length: 8 }, (_, index) => {
            const offset = 40 + index * 56;

            return (
              <path
                key={`horizontal-${offset}`}
                d={`M0 ${offset}H520`}
                strokeWidth="0.8"
              />
            );
          })}
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="absolute -right-20 top-[7%] hidden h-[74%] w-[52%] text-foreground opacity-[0.055] md:block dark:opacity-[0.085]"
        viewBox="0 0 820 720"
        fill="none"
      >
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M108 558L225 392L382 466L541 256L708 342" strokeWidth="1" />

          <path d="M225 392L198 226L357 132L541 256" strokeWidth="1" />

          <path d="M382 466L453 606L648 558L708 342" strokeWidth="1" />

          <path
            d="M198 226L92 292M357 132L390 54M648 558L742 626"
            strokeWidth="0.8"
            strokeDasharray="4 10"
          />

          <circle cx="108" cy="558" r="6" />
          <circle cx="225" cy="392" r="9" />
          <circle cx="382" cy="466" r="6" />
          <circle cx="541" cy="256" r="10" />
          <circle cx="708" cy="342" r="6" />
          <circle cx="198" cy="226" r="5" />
          <circle cx="357" cy="132" r="7" />
          <circle cx="453" cy="606" r="5" />
          <circle cx="648" cy="558" r="7" />

          <circle cx="541" cy="256" r="40" strokeWidth="0.7" />

          <circle
            cx="541"
            cy="256"
            r="68"
            strokeWidth="0.7"
            strokeDasharray="2 9"
          />

          <path d="M512 256H570M541 227V285" strokeWidth="0.7" />
        </g>
      </svg>

      <svg
        aria-hidden="true"
        className="absolute -bottom-12 -left-20 h-72 w-72 text-foreground opacity-[0.04] dark:opacity-[0.065]"
        viewBox="0 0 300 300"
        fill="none"
      >
        <g stroke="currentColor" vectorEffect="non-scaling-stroke">
          <circle cx="150" cy="150" r="86" strokeWidth="0.8" />
          <circle
            cx="150"
            cy="150"
            r="58"
            strokeWidth="0.8"
            strokeDasharray="3 8"
          />
          <path d="M42 150H258M150 42V258" strokeWidth="0.7" />
          <path
            d="M89 89L211 211M211 89L89 211"
            strokeWidth="0.7"
            strokeDasharray="4 9"
          />
        </g>
      </svg>
    </div>
  );
}
