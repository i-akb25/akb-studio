import type { ProjectDiscipline, ProjectRecord } from "../types/project";

export const projectDisciplineLabels: Record<ProjectDiscipline, string> = {
  software: "Software",
  electrical: "Electrical",
  robotics: "Robotics",
  automation: "Automation",
  ai: "AI",
};

export const projectRegistry = [
  {
    order: 1,
    slug: "akb-studio",
    title: "AKB Studio",
    categoryLabel: "Engineering Platform · AI · Portfolio Infrastructure",
    summary:
      "A personal engineering platform connecting projects, writing, AI, analytics, knowledge, and professional work as one coherent system.",
    disciplines: ["software", "ai"],
    tier: "flagship",
    lifecycle: "in-progress",
    publication: "published",
    caseStudyState: "planned",
    period: "2026",
    role: "Independent product design and engineering",
    technologies: [
      { name: "Next.js", icon: "code" },
      { name: "React", icon: "code" },
      { name: "TypeScript", icon: "code" },
      { name: "PostgreSQL", icon: "database" },
      { name: "AI Orchestration", icon: "ai" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "planned-public",
      },
    ],
  },
  {
    order: 2,
    slug: "codevet",
    title: "CodeVet",
    categoryLabel: "Developer Security · CLI Tooling",
    summary:
      "An open-source security tool that orchestrates established scanners and translates findings into practical remediation guidance.",
    disciplines: ["software"],
    tier: "flagship",
    lifecycle: "active",
    publication: "published",
    caseStudyState: "planned",
    period: "2026",
    role: "Creator and maintainer",
    technologies: [
      { name: "TypeScript", icon: "code" },
      { name: "Node.js", icon: "server" },
      { name: "GitHub Actions", icon: "tool" },
      { name: "Gitleaks", icon: "tool" },
      { name: "npm audit", icon: "tool" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/codevet",
      },
    ],
  },
  {
    order: 3,
    slug: "titan-edge-telemetry",
    title: "Titan OS",
    shortTitle: "Titan Edge Telemetry",
    categoryLabel: "Industrial IoT · Telemetry · Predictive Maintenance",
    summary:
      "A containerized industrial telemetry system combining simulated edge data, real-time streaming, historical storage, operational dashboards, and machine-health logic.",
    disciplines: ["software", "electrical", "automation"],
    tier: "flagship",
    lifecycle: "active",
    publication: "published",
    caseStudyState: "planned",
    period: "2026",
    role: "Independent system design and implementation",
    technologies: [
      { name: "Python", icon: "code" },
      { name: "Node.js", icon: "server" },
      { name: "WebSockets", icon: "network" },
      { name: "MySQL", icon: "database" },
      { name: "Docker", icon: "tool" },
      { name: "Power BI", icon: "tool" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/Titan-Edge-Telemetry",
      },
      {
        kind: "demo",
        label: "Live system",
        state: "available",
        href: "https://titan-edge-telemetry.vercel.app",
      },
    ],
  },
  {
    order: 4,
    homepageOrder: 1,
    slug: "automated-drone-delivery",
    title: "Automated Drone Delivery",
    categoryLabel: "Robotics · Embedded Systems · Computer Vision",
    summary:
      "An autonomous delivery-drone prototype combining flight control, target recognition, payload release, and return-to-launch behaviour.",
    disciplines: ["robotics", "automation", "ai"],
    tier: "flagship",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    role: "Hardware integration and software development",
    cover: {
      kind: "image",
      src: "/images/projects/automated-drone-delivery/cover.webp",
      alt: "Automated drone delivery prototype",
    },
    technologies: [
      { name: "Raspberry Pi", icon: "hardware" },
      { name: "Pixhawk", icon: "hardware" },
      { name: "Python", icon: "code" },
      { name: "Computer Vision", icon: "ai" },
      { name: "DroneKit", icon: "network" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/AUTOMATED_DRONE_DELIVERY",
      },
    ],
  },
  {
    order: 5,
    homepageOrder: 2,
    slug: "adhayan-lms",
    title: "ADHAYAN LMS",
    categoryLabel: "Learning Platform · Realtime Communication · AI",
    summary:
      "A collaborative learning platform combining study resources, assessment, live communication, parent-teacher interaction, and an AI-assisted learning experience.",
    disciplines: ["software", "ai"],
    tier: "flagship",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    period: "April 2024",
    role: "AI chatbot training, backend development, and deployment",
    cover: {
      kind: "image",
      src: "/images/projects/adhayan-lms/cover.webp",
      alt: "ADHAYAN learning management system interface",
    },
    technologies: [
      { name: "React", icon: "code" },
      { name: "Node.js", icon: "server" },
      { name: "MongoDB", icon: "database" },
      { name: "JWT", icon: "server" },
      { name: "WebRTC", icon: "network" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/hackofest-e-classroom",
      },
      {
        kind: "demo",
        label: "Live demo",
        state: "under-review",
      },
    ],
  },
  {
    order: 6,
    slug: "akb-cli",
    title: "AKB CLI",
    categoryLabel: "Python · Command-Line Experience",
    summary:
      "A cross-platform interactive terminal portfolio that presents professional information, engineering work, and hidden interactions through a command-driven interface.",
    disciplines: ["software"],
    tier: "standard",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    period: "2026",
    role: "Independent design and development",
    technologies: [
      { name: "Python", icon: "code" },
      { name: "Standard Library", icon: "tool" },
      { name: "Terminal UI", icon: "tool" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/akb-cli",
      },
    ],
  },
  {
    order: 7,
    homepageOrder: 4,
    slug: "expressify",
    title: "Expressify",
    categoryLabel: "Social Web Application",
    summary:
      "A responsive social application exploring client state, content presentation, and full-stack application structure.",
    disciplines: ["software"],
    tier: "standard",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    cover: {
      kind: "image",
      src: "/images/projects/expressify/cover.webp",
      alt: "Expressify social application interface",
    },
    technologies: [
      { name: "React", icon: "code" },
      { name: "Redux", icon: "code" },
      { name: "Node.js", icon: "server" },
      { name: "MongoDB", icon: "database" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/Expressify",
      },
    ],
  },
  {
    order: 8,
    homepageOrder: 3,
    slug: "vecho",
    title: "Vecho",
    categoryLabel: "Realtime Communication · WebRTC",
    summary:
      "A real-time communication project focused on browser-based calling and peer-to-peer connection workflows.",
    disciplines: ["software"],
    tier: "standard",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    cover: {
      kind: "image",
      src: "/images/projects/vecho/cover.webp",
      alt: "Vecho realtime communication interface",
    },
    technologies: [
      { name: "React", icon: "code" },
      { name: "WebRTC", icon: "network" },
      { name: "Node.js", icon: "server" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/Vecho",
      },
    ],
  },
  {
    order: 9,
    slug: "arduino-quadcopter",
    title: "Arduino Quadcopter",
    categoryLabel: "Flight Control · Embedded Systems · PID",
    summary:
      "An Arduino-based quadcopter project exploring inertial sensing, control loops, motor actuation, and flight stabilization.",
    disciplines: ["electrical", "robotics", "automation"],
    tier: "standard",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    technologies: [
      { name: "Arduino", icon: "hardware" },
      { name: "MPU6050", icon: "hardware" },
      { name: "C++", icon: "code" },
      { name: "PID Control", icon: "tool" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/ARDUCOPTER",
      },
    ],
  },
  {
    order: 10,
    slug: "motor-simulation-study",
    title: "PMSM, BLDC and SRM Simulation Study",
    categoryLabel: "Electrical Machines · MATLAB/Simulink",
    summary:
      "A comparative electrical-machine simulation study awaiting reconstruction and validation from reproducible models and results.",
    disciplines: ["electrical", "automation"],
    tier: "standard",
    lifecycle: "under-review",
    publication: "draft",
    caseStudyState: "under-review",
    technologies: [
      { name: "MATLAB", icon: "tool" },
      { name: "Simulink", icon: "tool" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "unavailable",
      },
    ],
  },
  {
    order: 11,
    homepageOrder: 5,
    slug: "health-tracker",
    title: "Health Tracker",
    categoryLabel: "Angular · Frontend Application",
    summary:
      "A frontend application for recording and presenting health-related activities through a structured Angular interface.",
    disciplines: ["software"],
    tier: "compact",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    cover: {
      kind: "image",
      src: "/images/projects/health-tracker/cover.webp",
      alt: "Health Tracker application interface",
    },
    technologies: [
      { name: "Angular", icon: "code" },
      { name: "TypeScript", icon: "code" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/health-tracker",
      },
    ],
  },
  {
    order: 12,
    slug: "obstacle-avoiding-robot",
    title: "Obstacle-Avoiding Robot",
    categoryLabel: "Robotics · Autonomous Navigation",
    summary:
      "A mobile robotics project using sensor feedback to detect obstacles and alter its movement.",
    disciplines: ["robotics", "automation"],
    tier: "compact",
    lifecycle: "under-review",
    publication: "draft",
    caseStudyState: "under-review",
    technologies: [
      { name: "Embedded Hardware", icon: "hardware" },
      { name: "Distance Sensing", icon: "hardware" },
      { name: "Motor Control", icon: "tool" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "unavailable",
      },
    ],
  },
  {
    order: 13,
    slug: "line-follower-robot",
    title: "Line-Follower Robot",
    categoryLabel: "Robotics · Feedback Control",
    summary:
      "A mobile robot using line-sensor feedback and motor control to follow a defined path.",
    disciplines: ["robotics", "automation"],
    tier: "compact",
    lifecycle: "under-review",
    publication: "draft",
    caseStudyState: "under-review",
    technologies: [
      { name: "Embedded Hardware", icon: "hardware" },
      { name: "IR Sensors", icon: "hardware" },
      { name: "Motor Control", icon: "tool" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "unavailable",
      },
    ],
  },
  {
    order: 14,
    slug: "carbon-footprint",
    title: "Carbon Footprint",
    categoryLabel: "Environmental Awareness · Web Application",
    summary:
      "An early web project presenting a simple carbon-footprint calculation experience.",
    disciplines: ["software"],
    tier: "compact",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    technologies: [
      { name: "HTML", icon: "code" },
      { name: "CSS", icon: "code" },
      { name: "JavaScript", icon: "code" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/carbonfootprint",
      },
    ],
  },
  {
    order: 15,
    slug: "binance-trade-analysis",
    title: "Binance Trade Analysis",
    categoryLabel: "Data Analysis · Financial Metrics",
    summary:
      "A Python analysis of historical trade data using profitability, risk, drawdown, and win-rate metrics to compare account performance.",
    disciplines: ["software"],
    tier: "compact",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    technologies: [
      { name: "Python", icon: "code" },
      { name: "Data Analysis", icon: "tool" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/Binance-Trade-Analysis",
      },
    ],
  },
  {
    order: 16,
    slug: "safar-awaits",
    title: "Safar Awaits",
    categoryLabel: "Travel Interface · React",
    summary:
      "An early responsive travel interface exploring component-based frontend development and visual presentation.",
    disciplines: ["software"],
    tier: "compact",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    technologies: [
      { name: "React", icon: "code" },
      { name: "JavaScript", icon: "code" },
      { name: "CSS", icon: "code" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/safar-awaits",
      },
      {
        kind: "demo",
        label: "Live demo",
        state: "available",
        href: "https://safar-awaits.netlify.app",
      },
    ],
  },
  {
    order: 17,
    slug: "make-a-wish",
    title: "Make-A-Wish",
    categoryLabel: "Interactive Web Experience",
    summary:
      "A personalised interactive frontend experience built around playful responses, animated presentation, and configurable messages.",
    disciplines: ["software"],
    tier: "experiment",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    technologies: [
      { name: "React", icon: "code" },
      { name: "Vite", icon: "tool" },
      { name: "CSS", icon: "code" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/make-a-wish",
      },
    ],
  },
  {
    order: 18,
    slug: "accord-interface-study",
    title: "Accord",
    categoryLabel: "Zentry-Inspired Interface Study",
    summary:
      "A frontend study of scroll-driven animation, geometric transitions, video presentation, and responsive interaction inspired by Zentry.",
    disciplines: ["software"],
    tier: "experiment",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    technologies: [
      { name: "React", icon: "code" },
      { name: "GSAP", icon: "tool" },
      { name: "Tailwind CSS", icon: "code" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/accord",
      },
      {
        kind: "demo",
        label: "Live demo",
        state: "available",
        href: "https://accordgaming.netlify.app",
      },
    ],
  },
  {
    order: 19,
    slug: "proposal-experiment",
    title: "Proposal",
    categoryLabel: "Configurable Web Experiment",
    summary:
      "A small configurable web experience built around custom messages, imagery, and handcrafted animation.",
    disciplines: ["software"],
    tier: "experiment",
    lifecycle: "completed",
    publication: "published",
    caseStudyState: "planned",
    technologies: [
      { name: "JavaScript", icon: "code" },
      { name: "HTML", icon: "code" },
      { name: "CSS", icon: "code" },
    ],
    links: [
      {
        kind: "repository",
        label: "Repository",
        state: "available",
        href: "https://github.com/i-akb25/Proposal",
      },
    ],
  },
] as const satisfies readonly ProjectRecord[];

export type ProjectSlug = (typeof projectRegistry)[number]["slug"];

export const publishedProjects: readonly ProjectRecord[] =
  projectRegistry.filter((project) => project.publication === "published");

export type HomepageProjectRecord = Extract<
  (typeof projectRegistry)[number],
  { readonly homepageOrder: number }
>;

export const homepageProjects: readonly HomepageProjectRecord[] =
  projectRegistry
    .filter(
      (project): project is HomepageProjectRecord => "homepageOrder" in project,
    )
    .sort((first, second) => first.homepageOrder - second.homepageOrder);
