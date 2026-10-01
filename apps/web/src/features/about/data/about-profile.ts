import type { AboutProfile } from "@/features/about/types/about";

export async function getAboutProfile(): Promise<AboutProfile> {
  return {
    name: "Anurag Kumar Bharti",
    profileImage: {
      src: "/images/profile/about-dp.webp",
      alt: "Portrait of Anurag Kumar Bharti",
      width: 1200,
      height: 1200,
    },
    headline:
      "I started in electrical engineering. I kept following the systems.",
    introduction:
      "I’m Anurag Kumar Bharti, an electrical engineer who moved deeper into automation, robotics and software by following the same kind of questions: how systems behave, where they fail, how their parts interact and how to make the final result useful.",
    thesis:
      "I usually begin with the system before the tool. I want to understand the constraints, interfaces, failure modes and trade-offs first. That habit came from electrical engineering and stayed with me when I moved into software, developer tools and product work.",
    waypoints: [
      {
        index: "01",
        title: "Electrical engineering at NIT Patna",
        description:
          "My formal foundation was electrical engineering, but the work that stayed with me most was the work that crossed classroom boundaries into machines, control, hardware and systems.",
      },
      {
        index: "02",
        title: "Learning by building with others",
        description:
          "Tesla Club pushed me beyond individual projects. Workshops, technical work, design responsibilities and team coordination taught me that engineering also depends on communication and ownership.",
      },
      {
        index: "03",
        title: "Physical systems became real",
        description:
          "Drone delivery, quadcopters, robotics, motor simulations and substation exposure made sensing, control, safety and failure much more concrete than they had been on paper.",
      },
      {
        index: "04",
        title: "Software became another engineering medium",
        description:
          "Building products such as ADHAYAN and working in web development gave me another way to solve systems problems, this time through interfaces, application architecture, deployment and product decisions.",
      },
      {
        index: "05",
        title: "Industry changed the scale",
        description:
          "NBPDCL, standards exposure, software internship work and later steel-plant electrical and automation work showed me very different meanings of reliability, production and operational constraints.",
      },
      {
        index: "06",
        title: "Now I am building my own engineering platform",
        description:
          "AKB Studio, CodeVet and my technical publishing work are where I am bringing those threads together and deciding what kind of engineering work I want to be known for.",
      },
    ],
    disciplines: [
      {
        id: "electrical",
        label: "Electrical engineering",
        note: "Where I learned to respect physical constraints, safety, feedback and failure.",
        href: "/projects",
      },
      {
        id: "automation",
        label: "Automation & robotics",
        note: "Where sensing, control, hardware and software have to behave as one system.",
        href: "/projects",
      },
      {
        id: "software",
        label: "Software engineering",
        note: "Where I turn ideas into products, workflows and maintainable systems.",
        href: "/projects",
      },
      {
        id: "ai",
        label: "AI & developer tools",
        note: "Where I am exploring how intelligence can support real engineering work instead of becoming decoration.",
        href: "/projects",
      },
      {
        id: "systems",
        label: "Systems thinking",
        note: "The common layer: constraints, interfaces, feedback, failure modes and trade-offs.",
      },
      {
        id: "design",
        label: "Design & visual communication",
        note: "Because complex engineering becomes more useful when the information itself is clear.",
      },
    ],
    travel: [],
    creative: [],
    interests: [
      {
        id: "travel",
        title: "Travel",
        note: "New places. New perspectives.",
        media: {
          src: "/images/about/placeholders/travel-01.svg",
          alt: "Travel journal artwork",
          width: 1200,
          height: 1500,
        },
      },
      {
        id: "photography",
        title: "Photography",
        note: "Noticing the details.",
        media: {
          src: "/images/about/placeholders/photography.svg",
          alt: "Photography portfolio artwork",
          width: 1200,
          height: 1500,
        },
      },
      {
        id: "painting",
        title: "Painting",
        note: "Slower thinking. Deeper seeing.",
        media: {
          src: "/images/about/placeholders/painting.svg",
          alt: "Painting portfolio artwork",
          width: 1200,
          height: 1500,
        },
      },
      {
        id: "visual-design",
        title: "Visual & Design",
        note: "A more beautiful, functional world.",
        media: {
          src: "/images/about/placeholders/design.svg",
          alt: "Visual design portfolio artwork",
          width: 1200,
          height: 1500,
        },
      },
    ],
    principles: [
      {
        index: "01",
        title: "Understand the constraint before choosing the tool",
        description:
          "I would rather map the problem, interfaces and limits first than force a familiar stack onto it.",
      },
      {
        index: "02",
        title: "Make the failure mode visible",
        description:
          "If I cannot explain how something can fail, I probably do not understand the system well enough yet.",
      },
      {
        index: "03",
        title: "Prefer evidence over assumption",
        description:
          "Measurements, logs, tests, prototypes and observed behaviour beat confident guesses.",
      },
      {
        index: "04",
        title: "Build the smallest system that can teach me something",
        description:
          "I use small working versions to expose bad assumptions early, then expand only when the direction survives contact with reality.",
      },
      {
        index: "05",
        title: "Document decisions worth remembering",
        description:
          "The useful part of a decision is often the reason behind it, not just the final implementation.",
      },
      {
        index: "06",
        title: "Polish matters after the system works",
        description:
          "Reliability, accessibility and clarity come first. Refinement should strengthen a working system, not hide a weak one.",
      },
    ],
    current: {
      title: "The current chapter.",
      body: "Right now I am rebuilding AKB Studio as a production-grade engineering platform, developing CodeVet into a serious repository intelligence tool, publishing what I learn through the Journal and Knowledge Hub, and preparing for the next engineering role where I can work on systems that deserve depth.",
    },
  };
}
