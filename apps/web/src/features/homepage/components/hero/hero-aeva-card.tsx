import Image from "next/image";
import Link from "next/link";

export function HeroAevaCard() {
  return (
    <Link
      href="/aeva"
      aria-labelledby="hero-aeva-title"
      className="block w-full rounded-xl border border-foreground/12 bg-background px-4 py-4 shadow-sm transition-colors hover:border-foreground/25"
    >
      <div className="flex items-start gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-full border border-foreground/16 bg-foreground/[0.04] shadow-sm">
          <Image
            src="/images/aeva/aeva-portrait.webp"
            alt="Aeva"
            fill
            sizes="44px"
            className="object-cover"
          />
        </span>

        <div className="min-w-0">
          <p
            id="hero-aeva-title"
            className="text-sm font-semibold tracking-[-0.01em] text-foreground"
          >
            Meet Aeva
          </p>

          <p className="mt-1.5 text-sm leading-6 text-foreground/60">
            Ask her about my projects, experience, and the engineering decisions
            behind my work.
          </p>
        </div>
      </div>
    </Link>
  );
}
