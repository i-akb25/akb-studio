import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
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

  const audit = await webSource("src/features/admin/server/audit.ts");
  assert.doesNotMatch(audit, /pg_advisory_xact_lock/);
  assert.doesNotMatch(audit, /isolationLevel/);
});

test("Admin logout and secondary public routes are reachable", async () => {
  const [layout, sidebar, footer] = await Promise.all([
    webSource("src/app/admin/(protected)/layout.tsx"),
    webSource("src/features/admin/components/admin-sidebar.tsx"),
    webSource("src/components/layout/site-footer.tsx"),
  ]);

  assert.match(layout, /AdminSidebar/);
  assert.match(sidebar, /AdminLogoutButton/);
  assert.match(sidebar, /aria-current/);
  assert.match(footer, /Interactive resume/);
  assert.match(footer, /href: "\/resume"/);
  assert.match(footer, /href: "\/lab"/);
  assert.match(footer, /href: "\/offline"/);
});

test("Admin editors can load existing records before updating them", async () => {
  const [
    projectsPage,
    operationsData,
    operationsConsole,
    contentConsole,
    aevaConsole,
  ] = await Promise.all([
    webSource("src/app/admin/(protected)/projects/page.tsx"),
    webSource("src/features/admin/server/operations-data.ts"),
    webSource("src/features/admin/components/operations-console.tsx"),
    webSource("src/features/admin/components/content-console.tsx"),
    webSource("src/features/admin/components/aeva-memory-console.tsx"),
  ]);

  assert.match(projectsPage, /section="projects"/);
  assert.match(operationsData, /prisma\.project\.findMany/);
  assert.match(operationsConsole, /Edit an existing project/);
  assert.match(operationsConsole, /Edit an existing reflection/);
  assert.doesNotMatch(operationsConsole, /form\.reset\(\)/);
  assert.match(contentConsole, /Edit published content/);
  assert.match(aevaConsole, /Edit an existing entry/);
});

test("Admin uses task-based navigation and separate portfolio editors", async () => {
  const [
    sidebar,
    site,
    profile,
    availability,
    projects,
    reflections,
    galleries,
  ] = await Promise.all([
    webSource("src/features/admin/components/admin-sidebar.tsx"),
    webSource("src/app/admin/(protected)/site/page.tsx"),
    webSource("src/app/admin/(protected)/profile/page.tsx"),
    webSource("src/app/admin/(protected)/availability/page.tsx"),
    webSource("src/app/admin/(protected)/projects/page.tsx"),
    webSource("src/app/admin/(protected)/reflections/page.tsx"),
    webSource("src/app/admin/(protected)/galleries/page.tsx"),
  ]);

  for (const route of [
    "site",
    "profile",
    "availability",
    "projects",
    "reflections",
    "galleries",
  ])
    assert.match(sidebar, new RegExp(`/admin/${route}`));
  assert.match(site, /section="site"/);
  assert.match(profile, /section="profile"/);
  assert.match(availability, /section="availability"/);
  assert.match(projects, /section="projects"/);
  assert.match(reflections, /section="reflections"/);
  assert.match(galleries, /section="galleries"/);
});

test("protected Admin pages do not load conflicting public or legacy styles", async () => {
  const [layout, pravaahPage, shell] = await Promise.all([
    webSource("src/app/admin/(protected)/layout.tsx"),
    webSource("src/app/admin/(protected)/pravaah/page.tsx"),
    webSource("src/features/admin/admin-shell.css"),
  ]);

  assert.doesNotMatch(layout, /content-surface\.css/);
  assert.doesNotMatch(pravaahPage, /pravaah-admin\.css/);
  assert.match(shell, /\.akb-admin-publisher/);
  assert.match(shell, /\.akb-admin-editor/);
  assert.match(
    shell,
    /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 24rem\)/,
  );
  assert.match(shell, /\.akb-admin-list \.akb-pravaah-item-media select/);
  assert.match(shell, /max-width:\s*100%/);
});

test("Admin can override tracked projects and select managed media", async () => {
  const [operationsData, operationsConsole] = await Promise.all([
    webSource("src/features/admin/server/operations-data.ts"),
    webSource("src/features/admin/components/operations-console.tsx"),
  ]);

  assert.match(operationsData, /publishedProjects/);
  assert.match(operationsData, /mediaAsset\.findMany/);
  assert.match(operationsConsole, /MediaSelect/);
  assert.match(operationsConsole, /Site identity and sharing preview/);
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

test("homepage retains the requested six-project composition", async () => {
  const [registry, homepage, card, config] = await Promise.all([
    webSource("src/features/projects/server/resolve-project-registry.ts"),
    webSource(
      "src/features/homepage/components/projects/featured-projects.tsx",
    ),
    webSource("src/features/homepage/components/projects/project-card.tsx"),
    webSource("next.config.ts"),
  ]);

  for (const slug of [
    "veyra",
    "codevet",
    "titan-os",
    "automated-drone-delivery",
    "adhayan-lms",
  ]) {
    assert.match(registry, new RegExp(`"${slug}"`));
  }
  assert.match(homepage, /<CurrentProject/);
  assert.match(homepage, /project records, and interface studies/);
  assert.match(card, /Project record/);
  assert.doesNotMatch(card, /<iframe/);
  assert.doesNotMatch(config, /https:\/\/veyra-pro\.vercel\.app/);
});

test("generated project covers are tracked and referenced by the fallback registry", async () => {
  const registry = await webSource(
    "src/features/projects/data/project-registry.ts",
  );
  const covers = [
    "codevet",
    "production-website-fieldbook",
    "binance-trade-analysis",
  ];

  for (const slug of covers) {
    const relativePath = `public/images/projects/${slug}/cover.webp`;
    assert.match(registry, new RegExp(`/images/projects/${slug}/cover\\.webp`));
    assert.ok((await stat(path.join(webRoot, relativePath))).size > 0);
  }

  assert.match(registry, /title: "The Production Website Companion"/);
  assert.match(registry, /slug: "health-tracker"[\s\S]*?tier: "standard"/);
  assert.match(registry, /slug: "vecho"[\s\S]*?tier: "compact"/);
});

test("republishing editorial content preserves established cover metadata", async () => {
  const publisher = await webSource(
    "src/features/admin/server/github-publisher.ts",
  );

  assert.match(publisher, /existing\?\.cover/);
  assert.match(publisher, /existing\?\.seo/);
});

test("book evidence can open a Google Drive PDF preview", async () => {
  const [viewer, config] = await Promise.all([
    webSource("src/features/content/components/evidence-viewer.tsx"),
    webSource("next.config.ts"),
  ]);

  assert.match(viewer, /className="akb-evidence__item"/);
  assert.match(viewer, /drive\.google\.com\/file\/d/);
  assert.match(viewer, /Open in new tab/);
  assert.match(config, /https:\/\/drive\.google\.com/);
});

test("public source and tests use plain resume spelling", async () => {
  const files = await Promise.all([
    webSource("src/app/(public)/resume/page.tsx"),
    webSource("src/components/layout/site-footer.tsx"),
    webSource("src/features/contact/components/contact-page.tsx"),
    webSource("src/features/aeva/components/aeva-experience.tsx"),
    webSource("src/features/resume/components/interactive-resume.tsx"),
  ]);

  for (const source of files) assert.doesNotMatch(source, /\u00e9|\u00c9/);
  assert.match(files.at(-1) ?? "", /Download resume PDF/);
  assert.doesNotMatch(files.at(-1) ?? "", /Print \/ save PDF|General PDF/);
});

test("every available project cover is mapped and the homepage uses six flagship records", async () => {
  const [registry, homepage] = await Promise.all([
    webSource("src/features/projects/data/project-registry.ts"),
    webSource(
      "src/features/homepage/components/projects/featured-projects.tsx",
    ),
  ]);
  const covers = [
    "akb-studio",
    "veyra",
    "codevet",
    "titan-os",
    "automated-drone-delivery",
    "adhayan-lms",
    "production-website-fieldbook",
    "akb-cli",
    "arduino-quadcopter",
    "health-tracker",
    "expressify",
    "carbon-footprint",
    "vecho",
    "binance-trade-analysis",
    "safar-awaits",
  ];

  for (const slug of covers) {
    const relativePath = `public/images/projects/${slug}/cover.webp`;
    assert.match(registry, new RegExp(`/images/projects/${slug}/cover\\.webp`));
    assert.ok((await stat(path.join(webRoot, relativePath))).size > 0);
  }

  assert.match(
    homepage,
    /<CurrentProject image="\/images\/projects\/akb-studio\/cover\.webp" \/>/,
  );
});

test("social discovery, project indexing and installability have complete fallbacks", async () => {
  const [layout, settings, sitemap, robots, manifest, installer, footer] =
    await Promise.all([
      webSource("src/app/layout.tsx"),
      webSource("src/features/seo/server/site-settings.ts"),
      webSource("src/app/sitemap.ts"),
      webSource("src/app/robots.ts"),
      webSource("src/app/manifest.ts"),
      webSource("src/features/offline/components/install-app-control.tsx"),
      webSource("src/components/layout/site-footer.tsx"),
    ]);

  assert.match(layout, /socialCardUrl/);
  assert.match(layout, /Anurag NITP/);
  assert.match(settings, /images\/projects\/akb-studio\/cover\.webp/);
  assert.match(sitemap, /project\.publication === "published"/);
  assert.doesNotMatch(robots, /\/_next\//);
  assert.match(manifest, /icon-maskable-512\.png/);
  assert.match(manifest, /scope: "\/"/);
  assert.match(installer, /beforeinstallprompt/);
  assert.match(installer, /Add to Home Screen/);
  assert.match(footer, /InstallAppControl/);
});

test("About galleries stay balanced while supporting swipeable multi-image sets", async () => {
  const [resolver, carousel, operations, api] = await Promise.all([
    webSource("src/features/about/server/managed-about-profile.ts"),
    webSource("src/features/about/components/about-interest-carousel.tsx"),
    webSource("src/features/admin/components/operations-console.tsx"),
    webSource("src/app/api/admin/operations/route.ts"),
  ]);

  assert.match(resolver, /slice\(0, 25\)/);
  assert.match(carousel, /onTouchStart/);
  assert.match(carousel, /SetIndex|setIndex/);
  assert.match(operations, /Set as cover/);
  assert.match(api, /gallery-item-cover/);
  assert.match(api, /already contains 25 images/);
});

test("Pravaah uses an approved media-library image without scraping the source", async () => {
  const [adminPage, consoleSource, api, model, publicPage, publisher, errors] =
    await Promise.all([
      webSource("src/app/admin/(protected)/pravaah/page.tsx"),
      webSource("src/features/admin/components/pravaah-console.tsx"),
      webSource("src/app/api/admin/pravaah/route.ts"),
      webSource("src/features/pravaah/model.ts"),
      webSource("src/features/pravaah/components/pravaah-page.tsx"),
      webSource("src/features/pravaah/server/feature-publisher.ts"),
      webSource("src/features/admin/server/admin-api-response.ts"),
    ]);

  assert.match(adminPage, /mediaAsset\.findMany/);
  assert.match(consoleSource, /Post image from Media/);
  assert.match(consoleSource, /name="mediaAssetId"/);
  assert.match(consoleSource, /value="update-media"/);
  assert.match(consoleSource, /value="delete"/);
  assert.match(consoleSource, /window\.confirm/);
  assert.match(consoleSource, /formData\.set\("action", requestedAction\)/);
  assert.doesNotMatch(
    consoleSource,
    /Every change is written to the private knowledge repository/,
  );
  assert.match(api, /state: "READY"/);
  assert.match(api, /mimeType: \{ startsWith: "image\/" \}/);
  assert.match(model, /res\.cloudinary\.com/);
  assert.match(publicPage, /lead\.media/);
  assert.match(publicPage, /<PravaahNetworkAnimation/);
  assert.match(publisher, /GITHUB_CONTENT_TOKEN/);
  assert.match(publisher, /deleteFeatureItem/);
  assert.match(publisher, /Pravaah repository could not be reached/);
  assert.match(publisher, /Refresh the Admin page before trying again/);
  assert.match(api, /The Pravaah image could not be saved/);
  assert.match(errors, /Choose a ready image from the media library/);
  assert.doesNotMatch(consoleSource, /fetch\(.*linkedin/i);
});

test("the reflection clock preserves correct Devanagari text and Hindi locale", async () => {
  const clock = await webSource(
    "src/features/homepage/components/reflection/reflection-local-clock.tsx",
  );

  for (const label of [
    "जनवरी",
    "फ़रवरी",
    "मार्च",
    "अप्रैल",
    "सितंबर",
    "अक्टूबर",
    "रविवार",
    "सोमवार",
    "मंगलवार",
    "बुधवार",
    "गुरुवार",
    "शुक्रवार",
    "शनिवार",
  ]) {
    assert.match(clock, new RegExp(label));
  }

  assert.match(clock, /दैनिक संस्कृत चिन्तनम्/);
  assert.match(clock, /lang="sa-Deva"/);
  assert.match(clock, /Intl\.DateTimeFormat\("hi-IN"/);
  assert.doesNotMatch(clock, /दनक ससत चतनम/);
});

test("uploaded Admin media is immediately available to dependent controls", async () => {
  const [route, library, audio, operations] = await Promise.all([
    webSource("src/app/api/admin/media/route.ts"),
    webSource("src/features/admin/components/media-console.tsx"),
    webSource("src/features/media/components/site-audio-console.tsx"),
    webSource("src/features/admin/components/operations-console.tsx"),
  ]);

  assert.match(route, /export async function GET/);
  assert.match(route, /private, no-store/);
  assert.match(library, /akb:media-updated/);
  assert.match(library, /akb-admin-media-thumbnail/);
  assert.match(audio, /akb:media-updated/);
  assert.match(operations, /akb:media-updated/);
});

test("the service worker clones cacheable responses before returning them", async () => {
  const worker = await webSource("public/sw.js");
  assert.match(worker, /const cacheCopy = response\.clone\(\)/);
  assert.match(worker, /cache\.put\(request, cacheCopy\)/);
  assert.doesNotMatch(worker, /cache\.put\(request, response\.clone\(\)\)/);
});

test("Pravaah Admin writes to Neon and treats GitHub as a fallback mirror", async () => {
  const [publisher, source, store, schema, migration] = await Promise.all([
    webSource("src/features/pravaah/server/feature-publisher.ts"),
    webSource("src/features/pravaah/server/feature-source.ts"),
    webSource("src/features/pravaah/server/feature-store.ts"),
    repositorySource("prisma/schema.prisma"),
    repositorySource(
      "prisma/migrations/20261006170000_pravaah_database_registry/migration.sql",
    ),
  ]);

  assert.match(store, /prisma\.pravaahRegistry\.findUnique/);
  assert.match(store, /runAuditedMutation/);
  assert.match(publisher, /saveStoredFeatureManifest/);
  assert.match(publisher, /await mirrorManifest/);
  assert.match(source, /readStoredFeatureManifest/);
  assert.match(schema, /model PravaahRegistry/);
  assert.match(migration, /CREATE TABLE "PravaahRegistry"/);
});
