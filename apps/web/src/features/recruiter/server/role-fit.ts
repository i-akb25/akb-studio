import "server-only";

import { getPortfolioKnowledgeGraph } from "@/features/intelligence/server/portfolio-knowledge-graph";
import { getResumeProfile } from "@/features/resume/server/resume-profile";
import {
  analyzeRoleFit,
  type RecruiterEvidence,
  type RoleFitAnalysis,
} from "../model";

async function approvedRecruiterEvidence(): Promise<RecruiterEvidence[]> {
  const graph = await getPortfolioKnowledgeGraph();
  const resumeProfile = await getResumeProfile();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const concepts = new Map<string, string[]>();

  for (const edge of graph.edges) {
    if (edge.type !== "has-facet") continue;
    const concept = nodeById.get(edge.to);
    if (!concept) continue;
    const values = concepts.get(edge.from) ?? [];
    values.push(concept.title);
    concepts.set(edge.from, values);
  }

  const graphEvidence = graph.nodes
    .filter((node) => node.document && node.url)
    .map((node) => ({
      id: node.id,
      title: node.title,
      url: node.url ?? "/resume",
      text: [node.body, ...(concepts.get(node.id) ?? [])].join(" "),
      ...(node.provenance?.updatedAt
        ? { updatedAt: node.provenance.updatedAt }
        : {}),
    }));
  const experienceEvidence = resumeProfile.experiences.map((item) => ({
    id: `experience:${item.id}`,
    title: `${item.role} · ${item.organization}`,
    url: "/resume",
    text: [item.focus, ...item.disciplines].join(" "),
  }));

  return [...experienceEvidence, ...graphEvidence];
}

export async function analyzePublishedRoleFit(
  jobDescription: string,
): Promise<RoleFitAnalysis> {
  return analyzeRoleFit(jobDescription, await approvedRecruiterEvidence());
}
