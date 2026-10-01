import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeRoleFit,
  type RecruiterEvidence,
} from "../../src/features/recruiter/model";

const evidence: RecruiterEvidence[] = [
  {
    id: "project:studio",
    title: "AKB Studio",
    url: "/projects/akb-studio",
    text: "Production platform using Next.js, React, TypeScript, PostgreSQL, REST APIs, testing and security controls.",
  },
  {
    id: "project:drone",
    title: "Automated Drone Delivery",
    url: "/projects/automated-drone-delivery",
    text: "Robotics system using Pixhawk and Raspberry Pi for autonomous flight.",
  },
];

test("reports evidence coverage and explicit gaps without a fit score", () => {
  const result = analyzeRoleFit(
    "Backend Engineer\nRequired: TypeScript, PostgreSQL, REST APIs, Docker and distributed systems.",
    evidence,
    new Date("2026-09-19T00:00:00.000Z"),
  );

  assert.equal(result.roleTitle, "Backend Engineer");
  assert.deepEqual(
    result.strengths.map((item) => item.requirement),
    ["TypeScript", "REST APIs", "PostgreSQL"],
  );
  assert.deepEqual(result.gaps, ["Docker", "Distributed systems"]);
  assert.deepEqual(result.evidenceCoverage, { evidenced: 3, assessed: 5 });
  assert.doesNotMatch(result.summary, /%|score/i);
  assert.equal(result.generatedAt, "2026-09-19T00:00:00.000Z");
});

test("does not invent requirements that are absent from the supplied role", () => {
  const result = analyzeRoleFit(
    "Product role focused on communication and stakeholder coordination.",
    evidence,
  );

  assert.equal(result.evidenceCoverage.assessed, 0);
  assert.deepEqual(result.strengths, []);
  assert.deepEqual(result.gaps, []);
});
