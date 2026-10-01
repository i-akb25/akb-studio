export const PROFILE_LINKS = [
  {
    label: "Email",
    href: "mailto:anuragbhartiee25@gmail.com",
    platform: "email",
    external: false,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/anuragkumarbharti",
    platform: "linkedin",
    external: true,
  },
  {
    label: "GitHub",
    href: "https://github.com/i-akb25",
    platform: "github",
    external: true,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/ace_akb/",
    platform: "instagram",
    external: true,
  },
  {
    label: "X",
    href: "https://x.com/i_official_akb",
    platform: "x",
    external: true,
  },
] as const;

export type ProfileLink = (typeof PROFILE_LINKS)[number];
