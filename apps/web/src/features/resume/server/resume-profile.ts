import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";
import {
  type ResumeProfile,
  unconfiguredResumeProfile,
} from "../data/resume-profile";

const resumeProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    headline: z.string().trim().min(1).max(220),
    location: z.string().trim().max(160),
    summary: z.string().trim().min(1).max(1_200),
    education: z
      .object({
        institution: z.string().trim().min(1).max(220),
        qualification: z.string().trim().min(1).max(220),
        period: z.string().trim().max(80),
        evidenceUrl: z.string().trim().startsWith("/").max(240),
      })
      .strict(),
    experiences: z
      .array(
        z
          .object({
            id: z
              .string()
              .trim()
              .regex(/^[a-z0-9-]+$/)
              .max(80),
            period: z.string().trim().min(1).max(80),
            organization: z.string().trim().min(1).max(160),
            role: z.string().trim().min(1).max(160),
            focus: z.string().trim().min(1).max(800),
            location: z.string().trim().max(160),
            disciplines: z.array(z.string().trim().min(1).max(100)).max(20),
          })
          .strict(),
      )
      .max(24),
    canonicalPdf: z.string().trim().startsWith("/").max(240),
  })
  .strict();

const localSource = path.join(
  process.cwd(),
  "content",
  "private",
  "resume-profile.local.json",
);

export const getResumeProfile = cache(async (): Promise<ResumeProfile> => {
  try {
    const source = await readFile(localSource, "utf8");
    return resumeProfileSchema.parse(JSON.parse(source));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return unconfiguredResumeProfile;
    }
    console.error("Invalid local résumé profile source", error);
    return unconfiguredResumeProfile;
  }
});
