import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { aevaCapabilities } from "../../src/features/aeva/capabilities/registry";
import {
  type AevaProvenance,
  canConsumerRetrieve,
} from "../../src/features/aeva/security/classification";

const privateSource: AevaProvenance = {
  sourceId: "private-memory:owner-plan",
  route: "/admin/aeva",
  sourceType: "managed_memory",
  classification: "owner_private",
  allowedConsumers: ["private_aeva"],
  authority: "canonical",
  published: true,
  allowAeva: true,
  sensitivity: "private",
  contentHash: "hash",
};

async function source(relativePath: string) {
  return readFile(path.resolve(import.meta.dirname, relativePath), "utf8");
}

test("private retrieval accepts owner sources without weakening public Aeva", () => {
  assert.equal(canConsumerRetrieve(privateSource, "private_aeva"), true);
  assert.equal(canConsumerRetrieve(privateSource, "public_aeva"), false);
  assert.equal(
    canConsumerRetrieve(
      { ...privateSource, classification: "secret", sensitivity: "secret" },
      "private_aeva",
    ),
    false,
  );
  assert.equal(aevaCapabilities.private.privateRetrieval, true);
  assert.equal(aevaCapabilities.private.adminDataRead, false);
  assert.equal(aevaCapabilities.private.githubRead, false);
  assert.equal(aevaCapabilities.private.emailRead, false);
  assert.equal(aevaCapabilities.private.calendarRead, false);
  assert.equal(aevaCapabilities.private.externalWrite, false);
});

test("private owner endpoint fails closed behind session, role and 2FA", async () => {
  const route = await source("../../src/app/api/admin/aeva/private/route.ts");
  assert.match(route, /privateEnabled/);
  assert.match(route, /twoFactorEnabled/);
  assert.match(route, /session\.role !== "owner"/);
  assert.match(route, /assertSameOrigin/);
  assert.match(route, /scope: "aeva:private:owner"/);
  assert.match(route, /!limit\.available/);
  assert.doesNotMatch(
    route,
    /recordAudit|runAuditedMutation|\.create\(|\.update\(/,
  );
});

test("private retrieval is a narrow allowlist, not Admin database access", async () => {
  const retrieval = await source(
    "../../src/features/aeva/private/retrieval.ts",
  );
  assert.match(retrieval, /visibility: "OWNER_ONLY"/);
  assert.match(retrieval, /state: "PUBLISHED"/);
  assert.match(retrieval, /publicAllowed: false/);
  assert.match(retrieval, /canConsumerRetrieve\(provenance, "private_aeva"\)/);
  for (const forbidden of [
    "contactSubmission",
    "contactNote",
    "auditLog",
    "user.find",
    "session.find",
    "account.find",
    "aevaConversation",
    "aevaMessage",
  ]) {
    assert.doesNotMatch(retrieval, new RegExp(forbidden, "i"));
  }
});

test("public Aeva cannot import or route through the private domain", async () => {
  const publicRoute = await source("../../src/app/api/aeva/route.ts");
  const publicRetrieval = await source(
    "../../src/features/aeva/server/retrieval.ts",
  );
  assert.doesNotMatch(publicRoute, /aeva\/private|private_aeva|OWNER_ONLY/);
  assert.doesNotMatch(publicRetrieval, /features\/aeva\/private|OWNER_ONLY/);
  assert.match(publicRetrieval, /visibility: "PUBLIC_AEVA"/);
});

test("owner-only records stay hidden and immutable for editors", async () => {
  const page = await source("../../src/app/admin/(protected)/aeva/page.tsx");
  const route = await source("../../src/app/api/admin/aeva/route.ts");
  assert.match(page, /isOwner/);
  assert.match(page, /visibility: "PUBLIC_AEVA"/);
  assert.match(page, /publicAllowed: true/);
  assert.match(page, /isOwner && aevaServerConfig\.privateEnabled/);
  assert.match(route, /session\.role !== "owner"/);
  assert.match(route, /input\.visibility !== "PUBLIC_AEVA"/);
  assert.match(route, /id: input\.id, visibility: "PUBLIC_AEVA"/);
  assert.match(route, /id: input\.id, publicAllowed: true/);
});

test("private provider degrades without dumping source fragments", async () => {
  const provider = await source("../../src/features/aeva/private/provider.ts");
  assert.match(provider, /will not assemble an answer from partial fragments/);
  assert.match(provider, /aeva:private:provider:daily/);
  assert.match(provider, /safeAevaAnswer/);
  assert.match(provider, /if \(!references\.length\) return null/);
  assert.doesNotMatch(provider, /google_search|functionDeclarations/);
});

test("Apps Script stores reports only with explicit transcript consent", async () => {
  const script = await source(
    "../../../../integrations/google-apps-script/Code.gs",
  );
  assert.match(script, /"kind"/);
  assert.match(script, /"transcriptConsented"/);
  assert.match(script, /"reportExcerpt"/);
  assert.match(
    script,
    /kind === "report" && payload\.transcriptConsented === true/,
  );
  assert.match(script, /\["privacy-concern", "unsafe"\]\.includes\(reason\)/);
});
