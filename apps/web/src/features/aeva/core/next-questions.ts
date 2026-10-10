import type { AevaQueryPlan } from "../model";

export function evidenceNextQuestions(
  plan: AevaQueryPlan,
  grounded: boolean,
): string[] {
  if (
    !grounded ||
    ["conversation", "live-information", "general-knowledge"].includes(
      plan.intent,
    )
  )
    return [];
  const project = plan.entities.find((entity) =>
    ["CodeVet", "VEYRA", "ADHAYAN", "Titan OS"].includes(entity),
  );
  if (project) {
    return plan.intent === "architecture-walkthrough"
      ? [
          `What are the documented limitations of ${project}?`,
          `Which technologies are evidenced in ${project}?`,
        ]
      : [
          `Explain the published architecture of ${project}.`,
          `What are the documented trade-offs in ${project}?`,
        ];
  }
  const technology = plan.technologies[0];
  if (technology)
    return [
      `Which published projects demonstrate ${technology}?`,
      `What evidence is missing for ${technology}?`,
    ];
  return [];
}
