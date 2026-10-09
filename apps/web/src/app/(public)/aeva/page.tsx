import type { Metadata } from "next";
import { aevaCapabilities } from "@/features/aeva/capabilities/registry";
import { AevaExperience } from "@/features/aeva/components/aeva-experience";
import { aevaServerConfig } from "@/features/aeva/config/server-config";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Aeva",
  description:
    "A disclosed AI portfolio assistant grounded in Anurag Kumar Bharti's approved public work and cited web sources.",
  path: "/aeva",
});

export default function AevaPage() {
  return (
    <AevaExperience
      voiceEnabled={
        aevaServerConfig.voiceEnabled && aevaCapabilities.public.voiceInput
      }
    />
  );
}
