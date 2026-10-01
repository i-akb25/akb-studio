import type { Metadata } from "next";
import { AevaExperience } from "@/features/aeva/components/aeva-experience";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Aeva",
  description:
    "A disclosed AI portfolio assistant grounded in Anurag Kumar Bharti's approved public work and cited web sources.",
  path: "/aeva",
});

export default function AevaPage() {
  return <AevaExperience />;
}
