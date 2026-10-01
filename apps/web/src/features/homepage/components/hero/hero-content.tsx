import { HeroActions } from "./hero-actions";
import { HeroRotatingLine } from "./hero-rotating-line";
import { HeroSocialLinks } from "./hero-social-links";

export function HeroContent() {
  return (
    <div className="flex max-w-3xl flex-col items-start">
      <p className="text-sm font-medium tracking-[0.16em] text-foreground/55 uppercase">
        Hi, I&apos;m
      </p>

      <h1 className="mt-5 text-balance text-5xl leading-[0.94] font-semibold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
        Anurag
        <span className="block">Kumar Bharti</span>
      </h1>

      <div className="mt-7 sm:mt-8">
        <HeroRotatingLine />
      </div>

      <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-foreground/68 sm:text-lg sm:leading-8">
        I build across software, intelligent systems, automation, and
        hardware-driven engineering. Here, I share not only what I build, but
        also the decisions, trade-offs, challenges, and lessons behind the work.
      </p>

      <HeroSocialLinks />

      <div className="mt-6 sm:mt-7">
        <HeroActions />
      </div>
    </div>
  );
}
