import type { Metadata } from "next";
import { InteractiveResume } from "@/features/resume/components/interactive-resume";
import { getResumeProfile } from "@/features/resume/server/resume-profile";

export const metadata: Metadata = {
  title: "Interactive Résumé · AKB Studio",
  description:
    "A truth-preserving, evidence-linked résumé for Anurag Kumar Bharti that can adapt its emphasis to a supplied engineering role.",
};

export default async function ResumePage() {
  return <InteractiveResume profile={await getResumeProfile()} />;
}
