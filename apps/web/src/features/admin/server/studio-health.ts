import "server-only";

import { prisma } from "@/server/db/prisma";

export type StudioHealthFinding = {
  id: string;
  title: string;
  detail: string;
  proposedAction: string;
  evidence: Record<string, string | number>;
};

export async function getStudioHealthFindings(): Promise<
  StudioHealthFinding[]
> {
  const staleBoundary = new Date(Date.now() - 30 * 86_400_000);
  const [knowledgeGaps, sourceErrors, staleSources, incompleteProjects] =
    await Promise.all([
      prisma.aevaKnowledgeGap.count({ where: { status: "open" } }),
      prisma.aevaSource.count({ where: { lastError: { not: null } } }),
      prisma.aevaSource.count({
        where: {
          enabled: true,
          OR: [
            { lastCheckedAt: null },
            { lastCheckedAt: { lt: staleBoundary } },
          ],
        },
      }),
      prisma.project.count({
        where: {
          state: "PUBLISHED",
          OR: [{ role: null }, { period: null }, { links: { none: {} } }],
        },
      }),
    ]);

  const findings: StudioHealthFinding[] = [];
  if (knowledgeGaps)
    findings.push({
      id: "open-knowledge-gaps",
      title: "Unresolved Aeva knowledge gaps",
      detail: `${knowledgeGaps} grouped question gap(s) remain open.`,
      proposedAction:
        "Review the consent-safe samples and publish evidence only where the portfolio can support it.",
      evidence: { knowledgeGaps },
    });
  if (sourceErrors)
    findings.push({
      id: "source-errors",
      title: "Recorded source failures",
      detail: `${sourceErrors} approved source(s) have a recorded check error.`,
      proposedAction:
        "Verify each canonical URL and disable or correct broken sources after manual review.",
      evidence: { sourceErrors },
    });
  if (staleSources)
    findings.push({
      id: "stale-sources",
      title: "Source freshness review due",
      detail: `${staleSources} enabled source(s) have not been checked in the last 30 days.`,
      proposedAction:
        "Run the approved-source check and review every resulting change before publication.",
      evidence: { staleSources },
    });
  if (incompleteProjects)
    findings.push({
      id: "project-completeness",
      title: "Published project records need evidence metadata",
      detail: `${incompleteProjects} published project(s) lack a role, period or link.`,
      proposedAction:
        "Complete only the missing verified fields; do not generate replacement claims.",
      evidence: { incompleteProjects },
    });
  return findings;
}
