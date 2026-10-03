export type ResumeExperience = {
  id: string;
  period: string;
  organization: string;
  role: string;
  focus: string;
  location: string;
  disciplines: readonly string[];
};

export type ResumeProfile = {
  name: string;
  headline: string;
  location: string;
  summary: string;
  education: {
    institution: string;
    qualification: string;
    period: string;
    evidenceUrl: string;
  };
  experiences: readonly ResumeExperience[];
  canonicalPdf: string;
};

export const safeResumeProfile: ResumeProfile = {
  name: "Anurag Kumar Bharti",
  headline: "Software Engineer · Electrical & Automation Engineer",
  location: "Bihar, India",
  summary:
    "Electrical Engineering graduate working across software, industrial systems, automation and robotics.",
  education: {
    institution: "National Institute of Technology Patna",
    qualification: "Bachelor of Technology in Electrical Engineering",
    period: "December 2021 — June 2025",
    evidenceUrl: "/about",
  },
  experiences: [],
  canonicalPdf: "/resume/anurag-kumar-bharti-resume.pdf",
};
