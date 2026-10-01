import "server-only";

import { prisma } from "@/server/db/prisma";
import type { AevaCitation } from "../model";

export async function getPublishedCurrentStatus(): Promise<
  | {
      answer: string;
      citation: AevaCitation;
    }
  | undefined
> {
  if (!process.env.DATABASE_URL) return undefined;
  const now = new Date();
  try {
    const status = await prisma.availabilityStatus.findFirst({
      where: {
        id: "current",
        state: "PUBLISHED",
        validUntil: { gt: now },
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      },
    });
    if (!status?.validUntil) return undefined;
    return {
      answer: `${status.label}: ${status.summary} This public update expires on ${status.validUntil.toISOString()}.`,
      citation: {
        id: "availability:current",
        title: "Current public status",
        url: "/contact#availability-title",
        kind: "portfolio",
        excerpt: status.summary,
        updatedAt: status.updatedAt.toISOString(),
      },
    };
  } catch {
    return undefined;
  }
}
