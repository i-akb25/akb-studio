import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { signedPublishingRequest } from "../../src/features/publishing/server/publishing-signature";

test("optional feedback fields sign exactly the JSON received by existing Code.gs", async () => {
  const script = await readFile(
    path.resolve(
      import.meta.dirname,
      "../../../../integrations/google-apps-script/Code.gs",
    ),
    "utf8",
  );
  const canonicalFunction = script.slice(
    script.indexOf("function stableJson_(value)"),
    script.indexOf("function hmacSha256Hex_"),
  );
  const canonical = vm.runInNewContext(`${canonicalFunction}; stableJson_`) as (
    value: unknown,
  ) => string;
  const signingSecret = "test-only-signing-secret";
  for (const payload of [
    {
      kind: "feedback",
      message: undefined,
      reportExcerpt: undefined,
      reason: "helpful",
    },
    {
      kind: "report",
      message: "Useful report",
      nested: { omitted: undefined, retained: true },
      values: [undefined, "a"],
      date: new Date("2026-10-10T00:00:00Z"),
    },
  ]) {
    const wire = JSON.parse(
      JSON.stringify(
        signedPublishingRequest({
          action: "feedback_submit",
          payload,
          serviceToken: "test-token",
          signingSecret,
          timestamp: 123456,
        }),
      ),
    );
    const {
      signature,
      timestamp,
      serviceToken: _serviceToken,
      ...unsigned
    } = wire;
    assert.equal(
      signature,
      createHmac("sha256", signingSecret)
        .update(`${timestamp}.${canonical(unsigned)}`)
        .digest("hex"),
    );
    assert.doesNotMatch(canonical(unsigned), /undefined/);
  }
});

test("payload cannot replace the signed action or authentication envelope", () => {
  const request = signedPublishingRequest({
    action: "subscribe",
    payload: {
      action: "admin_send_notifications",
      serviceToken: "wrong",
      timestamp: 0,
      signature: "wrong",
    },
    serviceToken: "test-token",
    signingSecret: "test-only-secret",
    timestamp: 123,
  });
  assert.equal(request.action, "subscribe");
  assert.equal(request.serviceToken, "test-token");
  assert.equal(request.timestamp, 123);
  assert.notEqual(request.signature, "wrong");
});
