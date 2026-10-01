import { CurrentProject } from "./current-project";
import { ProjectCard } from "./project-card";

const projects = [
  {
    index: "01",
    title: "Automated Drone Delivery",
    category: "Robotics · Embedded · Computer Vision",
    image: "/images/projects/automated-drone-delivery/cover.webp",
    imageAlt: "Automated drone delivery project",
    technologies: [
      { name: "Raspberry Pi", icon: "hardware" },
      { name: "Pixhawk", icon: "hardware" },
      { name: "Python", icon: "code" },
      { name: "Computer Vision", icon: "ai" },
      { name: "DroneKit", icon: "network" },
    ],
  },
  {
    index: "02",
    title: "ADHAYAN LMS",
    category: "Full Stack · Learning Platform",
    image: "/images/projects/adhayan-lms/cover.webp",
    imageAlt: "ADHAYAN learning management system interface",
    technologies: [
      { name: "React", icon: "code" },
      { name: "Node.js", icon: "server" },
      { name: "MongoDB", icon: "database" },
      { name: "JWT", icon: "server" },
      { name: "WebRTC", icon: "network" },
    ],
  },
  {
    index: "03",
    title: "Vecho",
    category: "Realtime Communication",
    image: "/images/projects/vecho/cover.webp",
    imageAlt: "Vecho realtime communication project interface",
    technologies: [
      { name: "React", icon: "code" },
      { name: "WebRTC", icon: "network" },
      { name: "Node.js", icon: "server" },
    ],
  },
  {
    index: "04",
    title: "Expressify",
    category: "Social Web Application",
    image: "/images/projects/expressify/cover.webp",
    imageAlt: "Expressify social application interface",
    technologies: [
      { name: "React", icon: "code" },
      { name: "Redux", icon: "code" },
      { name: "Node.js", icon: "server" },
      { name: "MongoDB", icon: "database" },
    ],
  },
  {
    index: "05",
    title: "Health Tracker",
    category: "Frontend Application",
    image: "/images/projects/health-tracker/cover.webp",
    imageAlt: "Health Tracker application interface",
    technologies: [
      { name: "Angular", icon: "code" },
      { name: "TypeScript", icon: "code" },
    ],
  },
] as const;

export function FeaturedProjects() {
  return (
    <section
      id="featured-projects"
      aria-labelledby="featured-projects-heading"
      className="relative py-18 sm:py-20 lg:py-28 xl:py-32"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-7 border-b border-foreground/10 pb-8 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12 lg:pb-10 xl:gap-16">
          <div className="flex items-start gap-3">
            <span className="font-mono text-xs text-foreground/48">03</span>

            <span
              aria-hidden="true"
              className="mt-2 h-px w-10 bg-foreground/15"
            />

            <span
              aria-hidden="true"
              className="mt-[0.375rem] size-1.5 rotate-45 border border-foreground/25"
            />

            <p className="text-sm font-medium tracking-[0.14em] text-foreground/60 uppercase">
              Selected work
            </p>
          </div>

          <div className="max-w-3xl">
            <h2
              id="featured-projects-heading"
              className="text-balance text-3xl leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
            >
              Some things I&apos;ve built, tested, broken, and learned from.
            </h2>

            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
              I&apos;m keeping the homepage selective. The goal here is not to
              list everything I have touched, but to show work that represents
              different parts of how I think and build.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-12 lg:grid-rows-2">
          <div className="min-w-0 lg:col-span-7 lg:row-span-2">
            <CurrentProject />
          </div>

          <div className="min-w-0 lg:col-span-5">
            <ProjectCard {...projects[0]} />
          </div>

          <div className="min-w-0 lg:col-span-5">
            <ProjectCard {...projects[1]} />
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(2).map((project) => (
            <div key={project.index} className="min-w-0">
              <ProjectCard {...project} />
            </div>
          ))}
        </div>

        <div className="mt-7 flex items-end justify-between gap-6 border-t border-foreground/10 pt-5">
          <p className="max-w-xl text-sm leading-6 text-foreground/60">
            Each project will eventually open into its complete engineering case
            study with architecture, decisions, challenges, security,
            performance, and lessons.
          </p>

          <div
            aria-hidden="true"
            className="hidden shrink-0 items-center gap-3 text-foreground/28 sm:flex"
          >
            <span className="size-1.5 rounded-full border border-current" />
            <span className="h-px w-12 bg-current" />
            <span className="font-mono text-[0.625rem] tracking-[0.1em]">
              05
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
