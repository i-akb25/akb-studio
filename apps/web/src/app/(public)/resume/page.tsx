import { InteractiveResume } from "@/features/resume/components/interactive-resume";
import { getResumeProfile } from "@/features/resume/server/resume-profile";
import { createPageMetadata } from "@/features/seo/site-config";

export const metadata = createPageMetadata({
  title: "Interactive Résumé",
  description:
    "A truth-preserving, evidence-linked résumé for Anurag Kumar Bharti that can adapt its emphasis to a supplied engineering role.",
  path: "/resume",
});

export default async function ResumePage() {
  return <InteractiveResume profile={await getResumeProfile()} />;
}
