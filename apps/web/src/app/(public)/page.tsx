import type { Metadata } from "next";
import { Suspense } from "react";

import { AboutPreview } from "@/features/homepage/components/about/about-preview";
import { AevaPreview } from "@/features/homepage/components/aeva/aeva-preview";
import { ExperiencePreview } from "@/features/homepage/components/experience/experience-preview";
import { FinalCta } from "@/features/homepage/components/final-cta/final-cta";
import { RollingCollaboration } from "@/features/homepage/components/final-cta/rolling-collaboration";
import { HeroSection } from "@/features/homepage/components/hero/hero-section";
import { NoticeBoard } from "@/features/homepage/components/notice-board/notice-board";
import { FeaturedProjects } from "@/features/homepage/components/projects/featured-projects";
import { FeaturedProjectsLoading } from "@/features/homepage/components/projects/featured-projects-loading";
import { DailyReflectionPreview } from "@/features/homepage/components/reflection/daily-reflection-preview";
import { SkillsSnapshot } from "@/features/homepage/components/skills/skills-snapshot";
import { createPageMetadata } from "@/features/seo/site-config";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "Anurag Kumar Bharti",
  description:
    "My engineering work across software, electrical systems, automation, robotics and AI, documented through projects, field notes and technical knowledge.",
  path: "/",
});

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <AboutPreview />
      <ExperiencePreview />
      <Suspense fallback={<FeaturedProjectsLoading />}>
        <FeaturedProjects />
      </Suspense>
      <SkillsSnapshot />
      <NoticeBoard />
      <DailyReflectionPreview />
      <AevaPreview />
      <RollingCollaboration />
      <FinalCta />
    </main>
  );
}
