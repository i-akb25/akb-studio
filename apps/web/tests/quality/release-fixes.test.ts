import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repositoryRoot = path.resolve(import.meta.dirname, "../../../..");
const webRoot = path.join(repositoryRoot, "apps/web");

async function repositorySource(relativePath: string) {
  return readFile(path.join(repositoryRoot, relativePath), "utf8");
}

async function webSource(relativePath: string) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("scheduled operational workflows remain manual-only", async () => {
  const workflows = await Promise.all(
    [
      ".github/workflows/scheduled-publishing.yml",
      ".github/workflows/health-monitor.yml",
      ".github/workflows/operations.yml",
    ].map(repositorySource),
  );

  for (const workflow of workflows) {
    assert.match(workflow, /workflow_dispatch:/);
    assert.doesNotMatch(workflow, /\bschedule:/);
    assert.doesNotMatch(workflow, /\bcron:/);
  }
});

test("CodeQL runs on repository changes without a scheduled cron", async () => {
  const workflow = await repositorySource(".github/workflows/codeql.yml");

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:/);
  assert.doesNotMatch(workflow, /\bschedule:/);
  assert.doesNotMatch(workflow, /\bcron:/);
});

test("Dependabot version updates cannot open pull requests", async () => {
  const configuration = await repositorySource(".github/dependabot.yml");
  const disabledLimits = configuration.match(/open-pull-requests-limit:\s*0/g);

  assert.equal(disabledLimits?.length, 2);
});

test("the production resume uses a tracked public source", async () => {
  const [loader, profile, page] = await Promise.all([
    webSource("src/features/resume/server/resume-profile.ts"),
    webSource("content/public/resume-profile.json"),
    webSource("src/app/(public)/resume/page.tsx"),
  ]);

  assert.match(loader, /content[\s\S]*public[\s\S]*resume-profile\.json/);
  assert.doesNotMatch(loader, /resume-profile\.local\.json/);
  assert.match(profile, /anurag-kumar-bharti-resume\.pdf/);
  assert.match(page, /createPageMetadata/);
  assert.match(page, /path: "\/resume"/);
});

test("Admin writes use atomic audit mutations", async () => {
  const [audioRoute, operationsRoute, studioRoute, aevaRoute, mediaRoute] =
    await Promise.all([
      webSource("src/app/api/admin/site-audio/route.ts"),
      webSource("src/app/api/admin/operations/route.ts"),
      webSource("src/app/api/admin/studio/route.ts"),
      webSource("src/app/api/admin/aeva/route.ts"),
      webSource("src/app/api/admin/media/route.ts"),
    ]);

  for (const route of [
    audioRoute,
    operationsRoute,
    studioRoute,
    aevaRoute,
    mediaRoute,
  ]) {
    assert.match(route, /runAuditedMutation/);
    assert.doesNotMatch(route, /await recordAudit\(/);
  }
});

test("Admin logout and secondary public routes are reachable", async () => {
  const [layout, footer] = await Promise.all([
    webSource("src/app/admin/(protected)/layout.tsx"),
    webSource("src/components/layout/site-footer.tsx"),
  ]);

  assert.match(layout, /AdminLogoutButton/);
  assert.match(footer, /Interactive résumé/);
  assert.match(footer, /href: "\/resume"/);
  assert.match(footer, /href: "\/lab"/);
  assert.match(footer, /href: "\/offline"/);
});

test("Admin editors can load existing records before updating them", async () => {
  const [operationsPage, operationsConsole, contentConsole, aevaConsole] =
    await Promise.all([
      webSource("src/app/admin/(protected)/operations/page.tsx"),
      webSource("src/features/admin/components/operations-console.tsx"),
      webSource("src/features/admin/components/content-console.tsx"),
      webSource("src/features/admin/components/aeva-memory-console.tsx"),
    ]);

  assert.match(operationsPage, /initialData=\{initialData\}/);
  assert.match(operationsConsole, /Edit an existing project/);
  assert.match(operationsConsole, /Edit an existing reflection/);
  assert.doesNotMatch(operationsConsole, /form\.reset\(\)/);
  assert.match(contentConsole, /Edit published content/);
  assert.match(aevaConsole, /Edit an existing entry/);
});

test("Admin document handling matches the advertised upload formats", async () => {
  const [parser, media, publisher] = await Promise.all([
    webSource("src/features/admin/server/document-parser.ts"),
    webSource("src/features/media/server/cloudinary-media.ts"),
    webSource("src/features/admin/components/content-console.tsx"),
  ]);

  assert.match(parser, /mammoth\.extractRawText/);
  assert.match(media, /openxmlformats-officedocument/);
  assert.match(publisher, /accept="\.md,\.txt,\.docx"/);
});

test("published projects retain usable pages when private content is unavailable", async () => {
  const [registry, route, explorer, homepage] = await Promise.all([
    webSource("src/features/projects/server/resolve-project-registry.ts"),
    webSource("src/app/(public)/projects/[slug]/page.tsx"),
    webSource("src/features/projects/components/projects-explorer.tsx"),
    webSource(
      "src/features/homepage/components/projects/featured-projects.tsx",
    ),
  ]);

  assert.match(registry, /existing\?\.caseStudyState/);
  assert.match(route, /ProjectOverview/);
  assert.match(route, /getGitHubProjectBySlug\(slug\)\.catch/);
  assert.match(explorer, /View project/);
  assert.match(homepage, /caseStudyUrl=\{`\/projects\/\$\{project\.slug\}`\}/);
});
