import Image from "next/image";

type SiteBrandMarkProps = {
  className?: string;
  priority?: boolean;
};

export function SiteBrandMark({
  className = "size-10",
  priority = false,
}: SiteBrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 overflow-hidden ${className}`}
    >
      <Image
        src="/brand/akb-logo-dark.svg"
        alt=""
        fill
        priority={priority}
        sizes="44px"
        className="object-contain dark:hidden"
      />
      <Image
        src="/brand/akb-logo-light.svg"
        alt=""
        fill
        priority={priority}
        sizes="44px"
        className="hidden object-contain dark:block"
      />
    </span>
  );
}
