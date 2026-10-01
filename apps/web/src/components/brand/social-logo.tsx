import Image from "next/image";

export type SocialPlatform = "github" | "instagram" | "linkedin" | "x";

type SocialLogoProps = {
  platform: SocialPlatform;
  className?: string;
};

export function SocialLogo({
  platform,
  className = "size-4",
}: SocialLogoProps) {
  return (
    <Image
      src={`/social/${platform}.svg`}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      className={`shrink-0 dark:invert ${className}`}
    />
  );
}
