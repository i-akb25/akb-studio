import "@/features/about/styles/about-portfolio.css";
import type { Metadata } from "next";
import { AboutJourneyPage } from "@/features/about/components/about-journey-page";
import { getManagedAboutProfile } from "@/features/about/server/managed-about-profile";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "My journey through engineering, software, automation, travel, systems thinking and creative work.",
  path: "/about",
  image: "/brand/og-about.png",
});

export default async function AboutPage() {
  const profile = await getManagedAboutProfile();
  return <AboutJourneyPage profile={profile} />;
}
