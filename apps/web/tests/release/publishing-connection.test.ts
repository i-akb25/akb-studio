import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { z } from "zod";
import { POLICY_VERSIONS } from "../../src/features/legal/policy-registry";
import { publishingConfigurationError } from "../../src/features/publishing/server/publishing-config";
import {
  RequestSecurityError,
  readJsonBody,
} from "../../src/server/security/body-limit";

const testRequire = createRequire(import.meta.url);
const { transformSync } = createRequire(
  testRequire.resolve("tsx/package.json"),
)("esbuild");
const configured = {
  AKB_PUBLISHING_SERVICE_URL:
    "https://script.google.com/macros/s/test-deployment/exec",
  AKB_PUBLISHING_SERVICE_TOKEN: "test-token",
  APPS_SCRIPT_SIGNING_SECRET: "test-signing",
};
test("publishing credentials can only be sent to a configured HTTPS Apps Script deployment", () => {
  assert.equal(publishingConfigurationError(configured), null);
  assert.equal(
    publishingConfigurationError({
      ...configured,
      AKB_PUBLISHING_SERVICE_TOKEN: " ",
    }),
    "publishing_service_not_configured",
  );
  for (const url of [
    "http://script.google.com/macros/s/id/exec",
    "https://example.com/exec",
    "https://script.google.com.evil.test/macros/s/id/exec",
    "https://script.google.com/macros/s/id/dev",
    "https://user:pass@script.google.com/macros/s/id/exec",
    "https://script.google.com/macros/s/id/exec?token=secret",
    "http://127.0.0.1/exec",
  ]) {
    assert.equal(
      publishingConfigurationError({
        ...configured,
        AKB_PUBLISHING_SERVICE_URL: url,
      }),
      "publishing_service_invalid_url",
    );
  }
});
test("misconfigured publishing stops before signing or fetching and records a safe diagnostic", async () => {
  const source = await readFile(
    path.resolve(
      import.meta.dirname,
      "../../src/features/publishing/server/publishing-service.ts",
    ),
    "utf8",
  );
  const health: unknown[] = [];
  let fetched = false,
    signed = false;
  const module = {
    exports: {} as {
      callPublishingService: (
        action: string,
      ) => Promise<{ ok: boolean; error: string }>;
    },
  };
  const modules: Record<string, unknown> = {
    "server-only": {},
    "./publishing-config": { publishingConfigurationError },
    "./publishing-signature": {
      signedPublishingRequest: () => {
        signed = true;
      },
    },
    "@/server/analytics/metrics": {
      recordOperationalHealth: async (value: unknown) => {
        health.push(value);
      },
    },
  };
  vm.runInNewContext(
    transformSync(source, { loader: "ts", format: "cjs", target: "es2022" })
      .code,
    {
      module,
      exports: module.exports,
      require: (n: string) => modules[n],
      process: {
        env: {
          ...configured,
          AKB_PUBLISHING_SERVICE_URL: "https://example.test/secret",
        },
      },
      fetch: () => {
        fetched = true;
      },
      URL,
    },
  );
  const result = await module.exports.callPublishingService("feedback_submit");
  assert.equal(result.ok, false);
  assert.equal(result.error, "publishing_service_invalid_url");
  assert.equal(fetched, false);
  assert.equal(signed, false);
  assert.doesNotMatch(
    JSON.stringify(health),
    /test-token|test-signing|example.test/,
  );
});
test("valid long Unicode chat reports fit the bounded public API body limit", async () => {
  const source = await readFile(
    path.resolve(import.meta.dirname, "../../src/app/api/feedback/route.ts"),
    "utf8",
  );
  let payload: Record<string, unknown> | undefined;
  const module = {
    exports: {} as { POST: (request: Request) => Promise<Response> },
  };
  const modules: Record<string, unknown> = {
    zod: { z },
    "@/features/aeva/server/aeva-guard": {
      acceptAevaFeedbackRequest: async () => true,
      hasValidAevaOrigin: () => true,
    },
    "@/features/aeva/server/encryption": { redactAevaText: (s: string) => s },
    "@/features/legal/policy-registry": { POLICY_VERSIONS },
    "@/features/publishing/server/publishing-service": {
      callPublishingService: async (
        _action: string,
        body: Record<string, unknown>,
      ) => {
        payload = body;
        return { ok: true };
      },
    },
    "@/server/security/request": { readJsonBody, RequestSecurityError },
  };
  vm.runInNewContext(
    transformSync(source, { loader: "ts", format: "cjs", target: "es2022" })
      .code,
    {
      module,
      exports: module.exports,
      require: (n: string) => modules[n],
      Response,
    },
  );
  const body = JSON.stringify({
    responseId: randomUUID(),
    kind: "report",
    reason: "incorrect",
    comment: "अ".repeat(500),
    page: "/aeva",
    policyVersion: POLICY_VERSIONS.aeva,
    includeTranscript: true,
    transcript: Array.from({ length: 8 }, () => ({
      role: "user",
      text: "अ".repeat(1000),
    })),
  });
  assert.ok(Buffer.byteLength(body) > 12000);
  const response = await module.exports.POST(
    new Request("https://example.test/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(payload?.transcriptConsented, true);
  assert.ok(String(payload?.reportExcerpt).length <= 4000);
});
