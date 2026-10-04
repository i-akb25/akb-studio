import { Mail } from "lucide-react";
import { getProfileLinks } from "@/components/brand/profile-links";
import {
  SocialLogo,
  type SocialPlatform,
} from "@/components/brand/social-logo";
import { getPublicSiteSettings } from "@/features/seo/server/site-settings";

export async function HeroSocialLinks() {
  const settings = await getPublicSiteSettings();
  const profileLinks = getProfileLinks(settings.professionalEmail);
  return (
    <nav aria-label="Professional profiles" className="mt-7">
      <ul className="flex flex-wrap items-center gap-1.5">
        {profileLinks.map((item) => (
          <li key={item.platform}>
            <a
              href={item.href}
              aria-label={
                item.external
                  ? `Visit Anurag on ${item.label} (opens in a new tab)`
                  : `Email Anurag at ${settings.professionalEmail}`
              }
              title={item.label}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
              className="inline-flex size-11 items-center justify-center rounded-full border border-foreground/14 text-foreground/72 transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/32 hover:bg-foreground/[0.045] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-3 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
            >
              {item.platform === "email" ? (
                <Mail
                  aria-hidden="true"
                  className="size-[18px]"
                  strokeWidth={1.8}
                />
              ) : (
                <SocialLogo
                  platform={item.platform as SocialPlatform}
                  className="size-[18px]"
                />
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
