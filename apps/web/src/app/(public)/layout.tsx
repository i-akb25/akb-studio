import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ScreenAwareness } from "@/features/aeva/components/screen-awareness";
import { ConversionTracker } from "@/features/analytics/components/conversion-tracker";
import { JourneyTracker } from "@/features/analytics/components/journey-tracker";
import { SmartCursor } from "@/features/cursor/components/smart-cursor";
import { ServiceWorkerRegistration } from "@/features/offline/components/service-worker-registration";
import {
  personStructuredData,
  StructuredData,
  websiteStructuredData,
} from "@/features/seo/structured-data";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function PublicLayout({ children }: PublicLayoutProps) {
  const person = personStructuredData();
  const website = websiteStructuredData();

  return (
    <div className="portfolio-shell">
      {person ? <StructuredData data={person} /> : null}
      {website ? <StructuredData data={website} /> : null}
      <a
        href="#main-content"
        className="fixed -top-24 left-3 z-[100] rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg transition-[top] focus:top-3"
      >
        Skip to content
      </a>

      <SiteHeader />

      <div id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </div>

      <SiteFooter />
      <JourneyTracker />
      <ConversionTracker />
      <ScreenAwareness />
      <SmartCursor />
      <ServiceWorkerRegistration />
    </div>
  );
}
