import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Download,
  MapPin,
  Radio,
} from "lucide-react";
import Link from "next/link";

import {
  SocialLogo,
  type SocialPlatform,
} from "@/components/brand/social-logo";
import { ContactForm } from "@/features/contact/components/contact-form";

type ContactPageProps = {
  turnstileSiteKey?: string;
};

const workRoutes = [
  "Software Engineer",
  "Full-Stack Developer",
  "Product Engineer",
  "Electrical & Automation",
  "Systems / Automation",
  "Developer Tools",
] as const;

const enquiryRoutes = [
  ["01", "Full-time roles"],
  ["02", "Freelance / contract"],
  ["03", "Collaboration"],
  ["04", "Engineering projects"],
  ["05", "Product discussions"],
  ["06", "Student guidance"],
  ["07", "General enquiry"],
] as const;

const socialLinks: ReadonlyArray<{
  label: string;
  href: string;
  platform: SocialPlatform;
}> = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/anuragkumarbharti",
    platform: "linkedin",
  },
  {
    label: "GitHub",
    href: "https://github.com/i-akb25",
    platform: "github",
  },
  {
    label: "X",
    href: "https://x.com/i_official_akb",
    platform: "x",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/urr_anurag.akb/",
    platform: "instagram",
  },
] as const;

export function ContactPage({ turnstileSiteKey }: ContactPageProps) {
  return (
    <main className="contact-page">
      <header className="contact-hero">
        <div className="contact-hero__copy">
          <p className="contact-kicker">CONTACT / OPEN CHANNEL</p>
          <h1>
            Let’s discuss
            <span className="contact-hero__accent">the work.</span>
          </h1>
          <p className="contact-hero__body">
            Have a role, project, or engineering problem worth discussing? Share
            the context, constraints, and intended outcome.
          </p>
          <div className="contact-hero__actions">
            <a href="#contact-form-title">
              Start an enquiry
              <ArrowDownRight aria-hidden="true" />
            </a>
            <a href="/resume">
              Interactive resume
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>

        <div
          className="contact-route"
          role="img"
          aria-label="A route from building through discussion to commitment"
        >
          <svg viewBox="0 0 560 360" aria-hidden="true">
            <path
              className="contact-route__base"
              d="M28 300C104 254 96 160 183 166C279 173 282 60 381 90C445 110 476 43 532 31"
            />
            <path
              className="contact-route__active"
              d="M28 300C104 254 96 160 183 166C279 173 282 60 381 90C445 110 476 43 532 31"
            />
            <circle cx="28" cy="300" r="7" />
            <circle cx="183" cy="166" r="7" />
            <circle cx="381" cy="90" r="7" />
            <circle cx="532" cy="31" r="9" />
          </svg>
          <span className="contact-route__label contact-route__label--one">
            BUILD
          </span>
          <span className="contact-route__label contact-route__label--two">
            DISCUSS
          </span>
          <span className="contact-route__label contact-route__label--three">
            COMMIT
          </span>
          <div className="contact-route__status">
            <Radio aria-hidden="true" />
            <span>CHANNEL OPEN</span>
          </div>
        </div>

        <dl className="contact-hero__readout">
          <div>
            <dt>Based in</dt>
            <dd>Bihar, India</dd>
          </div>
          <div>
            <dt>Joining</dt>
            <dd>Immediate / negotiable</dd>
          </div>
          <div>
            <dt>Work mode</dt>
            <dd>Remote / hybrid preferred</dd>
          </div>
          <div>
            <dt>Typical reply</dt>
            <dd>24–72 hours</dd>
          </div>
        </dl>
      </header>

      <section
        className="contact-availability"
        aria-labelledby="availability-title"
      >
        <div className="contact-availability__statement">
          <span className="contact-availability__number">01</span>
          <div>
            <p className="contact-kicker">CURRENT WAYPOINT</p>
            <h2 id="availability-title">
              Building, learning, and choosing deliberately.
            </h2>
            <p>
              I’m in a building phase: shipping my own products, sharpening my
              systems thinking, and exploring the next role worth committing to.
            </p>
          </div>
        </div>

        <div className="contact-availability__board">
          <div className="contact-availability__status">
            <span
              className="contact-availability__indicator"
              aria-hidden="true"
            />
            <strong>Available for meaningful work</strong>
            <p>Full-time · Freelance · Collaboration</p>
          </div>
          <ul>
            {workRoutes.map((route) => (
              <li key={route}>
                <ArrowUpRight aria-hidden="true" />
                {route}
              </li>
            ))}
          </ul>
          <div className="contact-availability__conditions">
            <p>
              <MapPin aria-hidden="true" />
              India, role-dependent
            </p>
            <p>
              <BriefcaseBusiness aria-hidden="true" />
              Open to relocation for the right opportunity
            </p>
          </div>
        </div>
      </section>

      <section className="contact-resume" aria-labelledby="resume-title">
        <div className="contact-resume__index" aria-hidden="true">
          02 / DOCUMENT
        </div>
        <div className="contact-resume__copy">
          <p className="contact-kicker">PROFESSIONAL RECORD</p>
          <h2 id="resume-title">Anurag Kumar Bharti — Resume</h2>
          <p>
            General engineering resume. Role-specific software/product and
            electrical/automation versions will follow after final
            reconciliation.
          </p>
        </div>
        <dl>
          <div>
            <dt>Format</dt>
            <dd>PDF</dd>
          </div>
          <div>
            <dt>Provisional date</dt>
            <dd>15 September 2026</dd>
          </div>
        </dl>
        <div className="contact-resume__actions">
          <a href="/resume">
            View in browser
            <ArrowUpRight aria-hidden="true" />
          </a>
          <a href="/resume/anurag-kumar-bharti-resume.pdf" download>
            Download PDF
            <Download aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="contact-desk" aria-labelledby="contact-form-title">
        <aside className="contact-desk__routes">
          <p className="contact-kicker">CHOOSE THE CLOSEST ROUTE</p>
          <ol>
            {enquiryRoutes.map(([number, label]) => (
              <li key={number}>
                <span>{number}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="contact-desk__student-note">
            <p className="contact-kicker">FOR STUDENTS</p>
            <h3>Guidance questions are welcome.</h3>
            <p>
              If you are under 18, do not send identity documents, financial or
              health information, your home address, school records, or precise
              location. Use the age declaration in the form and share only the
              minimum context needed for the question.
            </p>
          </div>
        </aside>

        <ContactForm turnstileSiteKey={turnstileSiteKey} />
      </section>

      <section className="contact-direct" aria-labelledby="direct-title">
        <div>
          <p className="contact-kicker">DIRECT / PUBLIC CHANNELS</p>
          <h2 id="direct-title">Prefer a shorter route?</h2>
          <p>
            Email is best for context. Social profiles are useful when the
            conversation starts from work already published there.
          </p>
        </div>
        <a
          className="contact-direct__email"
          href="mailto:akbstudioofficial@gmail.com"
        >
          <span className="contact-direct__email-label">
            General, feedback and guidance
          </span>
          <strong>akbstudioofficial@gmail.com</strong>
          <ArrowUpRight aria-hidden="true" />
        </a>
        <nav aria-label="Anurag Kumar Bharti on social platforms">
          {socialLinks.map((link) => {
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                <SocialLogo platform={link.platform} />
                {link.label}
              </a>
            );
          })}
        </nav>
      </section>

      <footer className="contact-privacy-note">
        <p>
          Enquiries are retained for up to 180 days unless they become part of
          an active professional relationship. No marketing use.
        </p>
        <nav aria-label="Contact legal information">
          <Link href="/privacy">Privacy Notice</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/data-policy">Data Policy</Link>
          <Link href="/privacy/requests">Privacy requests</Link>
        </nav>
      </footer>
    </main>
  );
}
