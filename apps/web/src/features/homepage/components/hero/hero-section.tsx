import { HeroAevaCard } from "./hero-aeva-card";
import { HeroBackdrop } from "./hero-backdrop";
import { HeroContent } from "./hero-content";
import { HeroPortrait } from "./hero-portrait";

export function HeroSection() {
  return (
    <section id="hero" aria-label="Introduction" className="relative isolate">
      <HeroBackdrop />

      <div className="mx-auto flex min-h-dvh w-full max-w-7xl items-center px-5 py-20 sm:px-6 md:py-24 lg:px-8 lg:py-28 xl:py-32">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12 xl:gap-18">
          <div className="relative z-10 min-w-0">
            <HeroContent />
          </div>

          <div className="relative z-10 min-w-0 lg:justify-self-end">
            <div className="relative mx-auto w-full max-w-[35rem] lg:mx-0">
              <HeroPortrait />

              <div className="relative z-20 mx-auto -mt-5 w-[calc(100%-2rem)] max-w-[20rem] sm:-mt-7 lg:absolute lg:-bottom-7 lg:-left-8 lg:mt-0 lg:w-[19rem] xl:-left-12">
                <HeroAevaCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
