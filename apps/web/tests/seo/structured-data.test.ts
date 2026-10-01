import assert from "node:assert/strict";
import test from "node:test";

import { projectStructuredData } from "../../src/features/seo/structured-data";

test("represents a project and its case study as separate linked entities", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://portfolio.example.com";

  try {
    const data = projectStructuredData({
      path: "/projects/field-monitor",
      title: "Field Monitor",
      description: "An engineering project.",
      technologies: ["TypeScript", "Embedded systems"],
      repositoryUrl: "https://github.com/i-akb25/field-monitor",
    });

    assert.ok(data);
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    assert.equal(graph[0]?.["@type"], "Project");
    assert.equal(
      (graph[0]?.subjectOf as Record<string, unknown>)["@id"],
      "https://portfolio.example.com/projects/field-monitor#case-study",
    );
    assert.equal(graph[1]?.["@type"], "CreativeWork");
    assert.equal(
      (graph[1]?.mainEntity as Record<string, unknown>)["@id"],
      "https://portfolio.example.com/projects/field-monitor#project",
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
