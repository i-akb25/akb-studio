import { Bot, BrainCircuit, Code2, Factory } from "lucide-react";
import Image from "next/image";

type SkillDomainIcon = "software" | "ai" | "automation" | "embedded";

type SkillDomainData = {
  index: string;
  title: string;
  shortLabel: string;
  description: string;
  skills: readonly string[];
  icon: SkillDomainIcon;
};

type SkillDomainProps = {
  domain: SkillDomainData;
};

const skillLogos: Readonly<Record<string, string>> = {
  "AI Integration": "/skills/ai-integration.svg",
  Arduino: "/skills/arduino.svg",
  Automation: "/skills/automation.svg",
  "Autonomous Systems": "/skills/autonomous-systems.svg",
  "Computer Vision": "/skills/computer-vision.svg",
  "Control Systems": "/skills/control-systems.svg",
  "Electrical Machines": "/skills/electrical-machines.svg",
  "Electrical Systems": "/skills/electrical-systems.svg",
  "Embedded Control": "/skills/embedded-control.svg",
  "Industrial Systems": "/skills/industrial-systems.svg",
  "Next.js": "/skills/nextjs.svg",
  "Node.js": "/skills/nodejs.svg",
  PostgreSQL: "/skills/postgresql.svg",
  "Prompt Orchestration": "/skills/prompt-orchestration.svg",
  RAG: "/skills/rag.svg",
  "Raspberry Pi": "/skills/raspberry-pi.svg",
  React: "/skills/react.svg",
  "REST APIs": "/skills/rest-api.svg",
  Robotics: "/skills/robotics.svg",
  "Semantic Search": "/skills/semantic-search.svg",
  Sensors: "/skills/sensors.svg",
  TypeScript: "/skills/typescript.svg",
};

function SkillDomainMark({ icon }: { icon: SkillDomainIcon }) {
  const marks = {
    software: Code2,
    ai: BrainCircuit,
    automation: Factory,
    embedded: Bot,
  } as const;
  const Mark = marks[icon];

  return <Mark aria-hidden="true" className="size-6" strokeWidth={1.6} />;
}

export function SkillDomain({ domain }: SkillDomainProps) {
  return (
    <article className="group relative min-w-0 border-t border-foreground/12 py-6 sm:py-7 lg:min-h-[18rem] lg:py-8">
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 h-px w-12 bg-foreground/32"
      />

      <header className="relative flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-foreground/16 bg-foreground/[0.04] text-foreground/82 shadow-sm">
            <SkillDomainMark icon={domain.icon} />
          </span>

          <div>
            <p className="font-mono text-[0.625rem] tracking-[0.12em] text-foreground/48">
              DOMAIN {domain.index}
            </p>

            <p className="mt-1 text-xs font-medium tracking-[0.12em] text-foreground/58 uppercase">
              {domain.shortLabel}
            </p>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="mt-1 size-1.5 rotate-45 border border-foreground/32"
        />
      </header>

      <div className="relative mt-6">
        <h3 className="max-w-md text-2xl leading-tight font-semibold tracking-[-0.025em] text-foreground sm:text-3xl">
          {domain.title}
        </h3>

        <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-foreground/68 sm:text-base">
          {domain.description}
        </p>
      </div>

      <div className="relative mt-6 border-t border-foreground/10 pt-4">
        <p className="mb-3 text-[0.625rem] font-medium tracking-[0.12em] text-foreground/46 uppercase">
          Capabilities
        </p>

        <ul
          aria-label={`${domain.title} capabilities`}
          className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
        >
          {domain.skills.map((skill) => {
            const logo = skillLogos[skill];

            return (
              <li
                key={skill}
                className="relative flex min-w-0 items-center gap-2 pl-4 text-xs leading-5 text-foreground/64 sm:text-sm"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-[0.6rem] left-0 h-px w-2 bg-foreground/28"
                />

                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    width={16}
                    height={16}
                    className="size-4 shrink-0 object-contain opacity-80 dark:invert"
                  />
                ) : null}

                <span className="min-w-0">{skill}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        aria-hidden="true"
        className="absolute right-0 bottom-0 flex items-center gap-2 text-foreground/18"
      >
        <span className="h-px w-5 bg-current" />
        <span className="size-1 rotate-45 border border-current" />
      </div>
    </article>
  );
}
