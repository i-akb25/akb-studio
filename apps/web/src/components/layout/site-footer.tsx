import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getProfileLinks } from "@/components/brand/profile-links";
import { SiteBrandMark } from "@/components/brand/site-brand-mark";
import {
  SocialLogo,
  type SocialPlatform,
} from "@/components/brand/social-logo";
import { JourneyScene } from "@/features/footer/components/journey-scene";
import { getPublicSiteSettings } from "@/features/seo/server/site-settings";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Pravaah", href: "/pravaah" },
  { label: "Journal", href: "/journal" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "Aeva", href: "/aeva" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

const resourceLinks = [
  { label: "Search", href: "/search" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Data Policy", href: "/data-policy" },
  { label: "Privacy requests", href: "/privacy/requests" },
  { label: "Interactive résumé", href: "/resume" },
  { label: "Engineering lab", href: "/lab" },
  { label: "Offline workspace", href: "/offline" },
] as const;

export async function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const settings = await getPublicSiteSettings();
  const socialLinks = getProfileLinks(settings.professionalEmail).filter(
    (item): item is typeof item & { platform: SocialPlatform } =>
      item.platform !== "email",
  );

  return (
    <footer className="relative overflow-hidden bg-surface">
      <JourneyScene />

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid gap-12 py-12 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1.35fr)_repeat(3,minmax(140px,0.65fr))] lg:gap-8 lg:py-14">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label="AKB Studio home"
              className="group inline-flex items-center gap-3 rounded-md"
            >
              <SiteBrandMark className="size-11" />

              <span>
                <span className="block font-display text-base leading-none font-semibold tracking-[-0.025em] text-foreground">
                  AKB Studio
                </span>
                <span className="mt-1.5 block font-mono text-[9px] leading-none tracking-[0.18em] text-muted uppercase">
                  Exploring Engineering Innovation
                </span>
              </span>
            </Link>

            <p className="mt-5 text-sm leading-7 text-muted">
              An evidence-led engineering portfolio covering software,
              electrical systems, automation, robotics, and applied AI.
            </p>

            <p className="mt-5 font-mono text-[10px] leading-5 tracking-[0.12em] text-muted-soft uppercase">
              Patna, Bihar
              <br />
              India
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              Navigate
            </h2>

            <ul className="mt-5 space-y-3">
              {primaryLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex rounded-sm text-sm text-muted transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer resources">
            <h2 className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              Resources
            </h2>

            <ul className="mt-5 space-y-3">
              {resourceLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex rounded-sm text-sm text-muted transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              <li>
                <a
                  href="/resume/anurag-kumar-bharti-resume.pdf"
                  download
                  className="inline-flex rounded-sm text-sm text-muted transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
                >
                  Download resume
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              Elsewhere
            </h2>

            <ul className="mt-5 space-y-3">
              {socialLinks.map((item) => (
                <li key={item.platform}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 rounded-sm text-sm text-muted transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
                  >
                    <SocialLogo platform={item.platform} className="size-3.5" />
                    {item.label}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                      strokeWidth={1.8}
                    />
                  </a>
                </li>
              ))}

              <li>
                <Link
                  href="/contact"
                  className="inline-flex rounded-sm text-sm text-muted transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
                >
                  Contact
                </Link>
              </li>
            </ul>

            <div className="mt-7 flex items-center gap-2 text-xs text-muted">
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-warm opacity-40 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-accent-warm" />
              </span>
              Available for opportunities
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} AKB Studio. All rights reserved.</p>

          <p className="font-mono text-[9px] tracking-[0.14em] uppercase">
            I designed and engineered AKB Studio with ❤️ & curiosity.
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 left-0 overflow-hidden"
      >
        <div
          aria-hidden="true"
          data-label="AKB STUDIO"
          className="akb-footer-watermark translate-y-[32%] whitespace-nowrap text-center font-display text-[clamp(4.5rem,14vw,13rem)] leading-none font-semibold tracking-[-0.075em] text-foreground/[0.018] select-none dark:text-foreground/[0.025]"
        />
      </div>
    </footer>
  );
}
