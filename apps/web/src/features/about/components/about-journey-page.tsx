import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Box,
  BriefcaseBusiness,
  Heart,
  Laptop,
  Leaf,
  MapPin,
  PenTool,
  Send,
  Settings,
  Sparkles,
  Sun,
  Target,
  Triangle,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { AboutProfile } from "@/features/about/types/about";

type Props = {
  profile: AboutProfile;
};

const disciplines = [
  {
    icon: Zap,
    title: "Electrical",
    lines: ["Power systems", "Embedded systems", "Control and instrumentation"],
    shows: "Drone systems · motor simulations · substation work",
  },
  {
    icon: Settings,
    title: "Automation",
    lines: [
      "Control and automation",
      "Sense → Decide → Act",
      "Efficiency and reliability",
    ],
    shows: "Robotics · flight control · industrial automation",
  },
  {
    icon: Box,
    title: "Software",
    lines: ["Full-stack development", "Tools and products", "Systems at scale"],
    shows: "AKB Studio · ADHAYAN · production systems",
  },
  {
    icon: BarChart3,
    title: "AI",
    lines: [
      "Applied intelligence",
      "Human-in-the-loop",
      "System-wide applications",
    ],
    shows: "CodeVet · computer vision · developer tooling",
  },
  {
    icon: PenTool,
    title: "Design",
    lines: ["Visual communication", "Product thinking", "Make complex simple"],
    shows: "Interfaces · documentation · technical storytelling",
  },
] as const;

const journeyStages = [
  ["2021", "Electrical engineering at NIT Patna", "Formal systems foundation"],
  [
    "2023",
    "First field and substation exposure",
    "Constraints became physical",
  ],
  [
    "2023–24",
    "Built drones, robots and simulations",
    "Learning through working systems",
  ],
  [
    "2024–25",
    "Software became another medium",
    "Products, tools and deployment",
  ],
  ["2025", "Industry changed the scale", "Reliability met production"],
  ["Now", "Building AKB Studio and CodeVet", "The threads come together"],
] as const;

const methodSteps = [
  ["Understand the real problem", "Look beyond the surface."],
  [
    "Find the right level of abstraction",
    "Simplify without losing what matters.",
  ],
  ["Connect across domains", "Better ideas live at the intersections."],
  ["Build, test, learn, repeat", "Progress over perfection."],
  ["Make it useful for real people", "Ideas only matter when they work."],
] as const;

const principles = [
  {
    icon: Triangle,
    title: "Understand the context",
    body: "Zoom out before choosing a solution.",
  },
  {
    icon: Sun,
    title: "Make a practical impact",
    body: "Solve something real, however small.",
  },
  {
    icon: Leaf,
    title: "Prefer depth over quick wins",
    body: "Build for value that survives the moment.",
  },
  {
    icon: Target,
    title: "Build for resilience",
    body: "Expect uncertainty instead of hiding it.",
  },
  {
    icon: Users,
    title: "Choose people I respect",
    body: "Work with kind, curious builders.",
  },
  {
    icon: Heart,
    title: "Own the outcome",
    body: "Take responsibility and give credit.",
  },
  {
    icon: BarChart3,
    title: "Stay a learner",
    body: "Ask better questions and keep evolving.",
  },
  {
    icon: Sparkles,
    title: "Keep curiosity alive",
    body: "Interest makes the work better.",
  },
] as const;

const currentRoutes = [
  [BriefcaseBusiness, "AKB Studio", "Personal projects and experiments"],
  [Laptop, "Open to opportunities", "Full-time, freelance and consulting"],
  [BookOpen, "Learning", "AI, systems, design and more"],
  [MapPin, "Based in India", "Open to remote and global"],
] as const;

export function AboutJourneyPage({ profile }: Props) {
  return (
    <main className="about-final">
      <section className="about-final__hero" aria-labelledby="about-title">
        <div className="about-final__hero-copy">
          <p className="about-final__eyebrow">01 / About me</p>
          <h1 id="about-title">
            I build systems that have to survive <em>reality.</em>
          </h1>
          <p className="about-final__lead">
            Electrical engineering gave me the physics. Software gave me another
            medium. Building brings it all together: systems, people and
            problems that matter.
          </p>
          <p className="about-final__aside">Same curiosity. Different tools.</p>
          <a className="about-final__scroll" href="#disciplines">
            <span>
              <ArrowDown aria-hidden="true" />
            </span>
            Scroll to explore
          </a>
        </div>

        <div className="about-final__portrait">
          <div className="about-final__orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="about-final__roles" aria-hidden="true">
            <span>Engineer.</span>
            <span>Explorer.</span>
            <span>Learner.</span>
            <span>Builder.</span>
          </div>
          <div className="about-final__portrait-mask">
            <Image
              src={profile.profileImage.src}
              alt={profile.profileImage.alt}
              fill
              priority
              sizes="(max-width: 760px) 78vw, (max-width: 1100px) 42vw, 380px"
            />
          </div>
        </div>

        <aside className="about-final__dossier" aria-label="Profile details">
          <strong>AKB Studio</strong>
          <span>Systems · Products · People</span>
          <p>
            I am Ace, an electrical engineer, software builder and lifelong
            learner interested in how things work and how to make them better.
          </p>
          <div>
            <span>
              <MapPin aria-hidden="true" /> Based in India
            </span>
            <span>
              <Laptop aria-hidden="true" /> Open to opportunities
            </span>
            <span>
              <BriefcaseBusiness aria-hidden="true" /> Building AKB Studio
            </span>
            <span>
              <Send aria-hidden="true" /> Always up for a good conversation
            </span>
          </div>
          <b>Ace</b>
        </aside>
      </section>

      <section
        className="about-final__section about-final__disciplines"
        id="disciplines"
        aria-labelledby="disciplines-title"
      >
        <header className="about-final__intro">
          <p className="about-final__eyebrow">02 / Disciplines</p>
          <h2 id="disciplines-title">
            Different mediums.
            <br />
            One systems mindset.
          </h2>
          <p>
            I work across domains, but the goal stays the same: understand,
            simplify and build things that work in the real world.
          </p>
        </header>

        <div className="about-final__discipline-list">
          {disciplines.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon aria-hidden="true" />
                <h3>{item.title}</h3>
                <ul>
                  {item.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="about-final__discipline-proof">
                  <span>Where it shows</span>
                  {item.shows}
                </p>
                <i aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="about-final__section about-final__journey"
        id="journey"
        aria-labelledby="journey-title"
      >
        <header className="about-final__intro">
          <p className="about-final__eyebrow">03 / Journey</p>
          <h2 id="journey-title">
            A route shaped by people, places and problems.
          </h2>
          <p>
            The road has not been linear, but every stop has added a new
            perspective.
          </p>
        </header>

        <div className="about-final__timeline">
          <ol>
            {journeyStages.map(([year, title, note]) => (
              <li key={year}>
                <b>{year}</b>
                <i aria-hidden="true" />
                <strong>{title}</strong>
                <span>{note}</span>
              </li>
            ))}
          </ol>
          <aside className="about-final__journey-note">
            <span>Field note / 05</span>
            <strong>Industry changed the scale.</strong>
            <p>
              Reliability means something different when failure affects
              production, safety and people.
            </p>
          </aside>
        </div>
      </section>

      <section
        className="about-final__section about-final__systems"
        aria-labelledby="systems-title"
      >
        <header className="about-final__intro">
          <p className="about-final__eyebrow">04 / How I think</p>
          <h2 id="systems-title">From constraints to progress.</h2>
          <p>
            I look at problems through a systems lens: people, context,
            constraints and long-term impact.
          </p>
        </header>

        <div
          className="about-final__venn"
          role="img"
          aria-label="People, technology and constraints overlap to create better systems"
        >
          <span className="about-final__venn-circle about-final__venn-circle--people">
            <b>People</b>
            <small>Human needs, real context</small>
          </span>
          <span className="about-final__venn-circle about-final__venn-circle--technology">
            <b>Technology</b>
            <small>Tools that enable</small>
          </span>
          <span className="about-final__venn-circle about-final__venn-circle--context">
            <b>Constraints</b>
            <small>What is real</small>
          </span>
          <p>
            Better
            <br />
            Systems
          </p>
        </div>

        <aside className="about-final__method">
          <h3>Multiple forms. Same thinking.</h3>
          <p>
            Different domains. A consistent approach: zoom out, connect the
            dots, find leverage, and build iteratively.
          </p>
          <ol>
            {methodSteps.map(([title, body]) => (
              <li key={title}>
                <i aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section
        className="about-final__section about-final__interests"
        aria-labelledby="interests-title"
      >
        <header className="about-final__intro">
          <p className="about-final__eyebrow">05 / Beyond engineering</p>
          <h2 id="interests-title">The things that keep my attention sharp.</h2>
          <p>
            Travel, photography, painting and design help me see the world
            differently and bring that perspective back to my work.
          </p>
        </header>

        <div className="about-final__interest-grid">
          {profile.interests.map((item) => (
            <figure key={item.title}>
              <div>
                <Image
                  src={item.media.src}
                  alt={item.media.alt}
                  fill
                  sizes="(max-width: 760px) 80vw, 22vw"
                />
              </div>
              <figcaption>
                <strong>{item.title}</strong>
                <span>{item.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section
        className="about-final__section about-final__principles"
        aria-labelledby="principles-title"
      >
        <header className="about-final__intro">
          <p className="about-final__eyebrow">06 / Principles</p>
          <h2 id="principles-title">
            Working rules I want my decisions to survive.
          </h2>
          <p>Not just for code or careers, but for life.</p>
        </header>

        <ol className="about-final__principle-list">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <li key={principle.title}>
                <Icon aria-hidden="true" />
                <div>
                  <strong>{principle.title}</strong>
                  <p>{principle.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section
        className="about-final__section about-final__current"
        aria-labelledby="current-title"
      >
        <header className="about-final__intro">
          <p className="about-final__eyebrow">07 / Current chapter</p>
          <h2 id="current-title">{profile.current.title}</h2>
          <p>{profile.current.body}</p>
        </header>

        <ul className="about-final__current-list">
          {currentRoutes.map(([Icon, title, body]) => (
            <li key={title}>
              <Icon aria-hidden="true" />
              <div>
                <strong>{title}</strong>
                <span>{body}</span>
              </div>
              <ArrowRight aria-hidden="true" />
            </li>
          ))}
        </ul>

        <aside className="about-final__next">
          <h3>Building something difficult?</h3>
          <p>I would love to hear about it.</p>
          <Link
            className="about-final__button about-final__button--light"
            href="/contact"
          >
            Start a conversation <ArrowRight aria-hidden="true" />
          </Link>
          <small>Ideas, projects, or just a good chat.</small>
        </aside>
      </section>
    </main>
  );
}
