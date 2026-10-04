import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { FirstSessionBrandIntro } from "@/features/loader/components/first-session-brand-intro";
import { createBrandIntroBootstrapScript } from "@/features/loader/loader-config";
import { getPublicSiteSettings } from "@/features/seo/server/site-settings";
import { getSiteOrigin } from "@/features/seo/site-config";
import { createThemeBootstrapScript } from "@/features/theme/theme-config";
import "./globals.css";

const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  preload: false,
});

const siteOrigin = getSiteOrigin();
const metadataBase = siteOrigin ?? new URL("http://localhost:3000");

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const socialCardUrl = siteOrigin
    ? new URL("/opengraph-image", siteOrigin).href
    : "/opengraph-image";
  return {
    metadataBase,
    title: {
      default: `${settings.authorName} | ${settings.siteName}`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.description,
    applicationName: settings.siteName,
    authors: [
      { name: settings.authorName, ...(siteOrigin ? { url: siteOrigin } : {}) },
    ],
    creator: settings.authorName,
    publisher: settings.authorName,
    category: "engineering",
    keywords: [
      "Anurag Kumar Bharti",
      "Anurag Aryan",
      "Ace AKB",
      "Ace-AKB",
      "AKB NITP",
      "Anurag NITP",
      "Anurag NIT Patna",
      "AKB NIT Patna",
      "AKB Studio",
      "software engineer",
      "electrical and automation engineer",
    ],
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: settings.authorName,
      description: settings.description,
      images: [
        {
          url: socialCardUrl,
          width: 1200,
          height: 630,
          alt: settings.socialImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.authorName,
      description: settings.description,
      images: [{ url: socialCardUrl, alt: settings.socialImageAlt }],
    },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/brand/favicon.ico" },
        { url: "/brand/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/brand/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      ],
      apple: [
        {
          url: "/brand/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    referrer: "strict-origin-when-cross-origin",
    formatDetection: { email: false, address: false, telephone: false },
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION?.trim()
        ? { google: process.env.GOOGLE_SITE_VERIFICATION.trim() }
        : {}),
    },
  };
}

export const viewport: Viewport = { themeColor: "#0b0b0b" };

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body>
        <Script id="akb-studio-theme" strategy="beforeInteractive">
          {createThemeBootstrapScript()}
        </Script>
        <Script id="akb-studio-brand-intro" strategy="beforeInteractive">
          {createBrandIntroBootstrapScript()}
        </Script>
        <FirstSessionBrandIntro />
        {children}
      </body>
    </html>
  );
}
