import { ProjectRouteState } from "@/features/projects/components/project-route-state";

export default function CaseStudyNotFound() {
  return (
    <ProjectRouteState
      label="404 · Project case study"
      title="This case study isn’t available."
      description="The address may have changed, or this case study may not be published. Explore the archive for the project records currently available."
    />
  );
}
