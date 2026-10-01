const experienceItems = [
  {
    period: "2021 — 2025",
    organization: "NIT Patna",
    role: "B.Tech · Electrical Engineering",
    focus: "Engineering foundation and multidisciplinary project work",
    location: "Patna, Bihar",
  },
  {
    period: "Jun — Jul 2023",
    organization: "NBPDCL",
    role: "Industrial Trainee",
    focus: "33/11 kV substation operations and maintenance",
    location: "Bettiah, Bihar",
  },
  {
    period: "Feb — Jun 2025",
    organization: "Remote Intern",
    role: "Web Development Intern",
    focus: "Full-stack application development and deployment workflows",
    location: "Nagpur, Maharashtra",
  },
  {
    period: "Aug — Dec 2025",
    organization: "JSW Steel Ltd.",
    role: "Graduate Engineer Trainee (Electrical & Automation)",
    focus: "Electrical & Automation in an industrial operating environment",
    location: "Dolvi, Maharashtra",
  },
] as const;

export function ExperienceTimeline() {
  return (
    <ol className="relative grid gap-7 md:grid-cols-2 md:gap-x-8 md:gap-y-10 xl:grid-cols-4 xl:gap-0">
      {experienceItems.map((item, index) => {
        const isLast = index === experienceItems.length - 1;

        return (
          <li
            key={`${item.organization}-${item.period}`}
            className="relative min-w-0 xl:px-5 xl:first:pl-0 xl:last:pr-0"
          >
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute top-3 left-[0.3125rem] h-[calc(100%+1.75rem)] w-px bg-foreground/12 md:hidden xl:top-[0.34375rem] xl:left-[calc(50%+0.5rem)] xl:block xl:h-px xl:w-[calc(100%-1rem)]"
              />
            ) : null}

            <div className="relative pl-7 xl:pl-0">
              <div className="flex items-center gap-3 xl:flex-col xl:items-start xl:gap-3">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-0 size-2.5 rounded-full border border-foreground/40 bg-background xl:static xl:size-3"
                />

                <time className="font-mono text-xs leading-6 tracking-[0.02em] text-foreground/56">
                  {item.period}
                </time>
              </div>

              <div className="mt-3.5 xl:mt-5">
                <div className="flex items-start justify-between gap-4 xl:block">
                  <h3 className="text-lg leading-6 font-semibold tracking-[-0.02em] text-foreground xl:text-xl">
                    {item.organization}
                  </h3>

                  <span
                    aria-hidden="true"
                    className="shrink-0 font-mono text-[0.625rem] tracking-[0.1em] text-foreground/36 xl:mt-2 xl:block"
                  >
                    0{index + 1}
                  </span>
                </div>

                <p className="mt-1.5 text-sm leading-6 font-medium text-foreground/76">
                  {item.role}
                </p>

                <p className="mt-2.5 max-w-[18rem] text-sm leading-6 text-foreground/62">
                  {item.focus}
                </p>

                <div className="mt-4 flex items-center gap-2 text-foreground/48">
                  <svg
                    aria-hidden="true"
                    className="size-3.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 21C12 21 18 15.8 18 9.5C18 6.2 15.3 3.5 12 3.5C8.7 3.5 6 6.2 6 9.5C6 15.8 12 21 12 21Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <circle
                      cx="12"
                      cy="9.5"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>

                  <span className="text-xs leading-5">{item.location}</span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
