import Image from "next/image";

const allowedExternalImageHosts = new Set([
  "github.com",
  "raw.githubusercontent.com",
  "user-images.githubusercontent.com",
  "private-user-images.githubusercontent.com",
]);

type ProjectMediaProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

type ResolvedProjectImage = {
  src: string;
  external: boolean;
};

export function resolveProjectImage(
  source: string,
): ResolvedProjectImage | null {
  const trimmedSource = source.trim();

  if (trimmedSource.startsWith("/")) {
    const pathSegments = trimmedSource.split("/");

    if (!trimmedSource.startsWith("/images/") || pathSegments.includes("..")) {
      return null;
    }

    return { src: trimmedSource, external: false };
  }

  if (!trimmedSource.startsWith("https://")) {
    return null;
  }

  try {
    const url = new URL(trimmedSource);

    if (!allowedExternalImageHosts.has(url.hostname)) {
      return null;
    }

    return { src: url.toString(), external: true };
  } catch {
    return null;
  }
}

export function ProjectMedia({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
}: ProjectMediaProps) {
  const image = resolveProjectImage(src);

  if (!image) {
    return null;
  }

  return (
    <Image
      src={image.src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      unoptimized={image.external}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}
