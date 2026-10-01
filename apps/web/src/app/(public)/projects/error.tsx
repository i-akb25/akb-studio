"use client";

import { ProjectRouteState } from "@/features/projects/components/project-route-state";

export default function ProjectsError() {
  return (
    <ProjectRouteState
      label="Project system · Unavailable"
      title="We couldn’t load this project page."
      description="The project content could not be loaded. Reload the page to try again, or return to the studio."
    >
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
      >
        Reload page
      </button>
    </ProjectRouteState>
  );
}
