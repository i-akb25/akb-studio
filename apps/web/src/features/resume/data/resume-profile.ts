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

export const unconfiguredResumeProfile: ResumeProfile = {
  name: "AKB Studio",
  headline: "Interactive resume source not configured",
  location: "",
  summary: "Added the private local resume source to populate this view.",
  education: {
    institution: "Not configured",
    qualification: "Local resume source required",
    period: "",
    evidenceUrl: "/about",
  },
  experiences: [],
  canonicalPdf: "/contact",
};
