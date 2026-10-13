import assert from "node:assert/strict";
import test from "node:test";
import {
  RequestSecurityError,
  readFormBody,
  readJsonBody,
  readLimitedBody,
} from "../../src/server/security/body-limit";

function request(body: BodyInit, contentType = "application/json") {
  return new Request("https://example.com/api", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
    duplex: "half",
  } as RequestInit);
}

test("JSON accepts parameters but rejects look-alike MIME types", async () => {
  assert.deepEqual(
    await readJsonBody(
      request('{"ok":true}', "application/json; charset=utf-8"),
      64,
    ),
    { ok: true },
  );
  await assert.rejects(
    readJsonBody(request("{}", "application/json-malicious"), 64),
    (error: unknown) =>
      error instanceof RequestSecurityError && error.status === 415,
  );
  await assert.rejects(
    readJsonBody(request("not-json"), 64),
    (error: unknown) =>
      error instanceof RequestSecurityError && error.status === 400,
  );
});

test("bounded form parsing handles uploads and rejects malformed or oversized bodies", async () => {
  const form = new FormData();
  form.set("title", "A reviewed article");
  form.set(
    "document",
    new File(["content"], "note.txt", { type: "text/plain" }),
  );
  await assert.rejects(
    readFormBody(request("broken", "text/plain"), 4096),
    (error: unknown) =>
      error instanceof RequestSecurityError && error.status === 415,
  );
  const valid = new Request("https://example.com/api", {
    method: "POST",
    body: form,
  });
  const mime = valid.headers.get("content-type") ?? "";
  const bytes = await valid.arrayBuffer();
  const data = await readFormBody(request(bytes, mime), 4096);
  assert.equal(data.get("title"), "A reviewed article");
  assert.equal((data.get("document") as File).name, "note.txt");
  await assert.rejects(
    readFormBody(request(bytes, mime), 20),
    (error: unknown) =>
      error instanceof RequestSecurityError && error.status === 413,
  );
  await assert.rejects(
    readFormBody(
      request("broken", "multipart/form-data; boundary=missing"),
      4096,
    ),
    (error: unknown) =>
      error instanceof RequestSecurityError && error.status === 400,
  );
});

test("Aeva save body budget accepts the maximum Unicode memory text", async () => {
  const body = JSON.stringify({
    resource: "memory",
    title: "Education",
    content: "अ".repeat(8000),
    visibility: "PUBLIC_AEVA",
    state: "PUBLISHED",
    sourceUrl: "https://example.com",
  });
  assert.ok(new TextEncoder().encode(body).length > 16384);
  assert.deepEqual(await readJsonBody(request(body), 65536), JSON.parse(body));
});

test("body limit counts UTF-8 bytes, not string length", async () => {
  const raw = JSON.stringify({ text: "🙂" });
  const bytes = new TextEncoder().encode(raw).length;
  assert.deepEqual(await readJsonBody(request(raw), bytes), { text: "🙂" });
  await assert.rejects(
    readJsonBody(request(raw), bytes - 1),
    (error: unknown) =>
      error instanceof RequestSecurityError && error.status === 413,
  );
});

test("oversized chunked requests are cancelled before the body is fully read", async () => {
  let cancelled = false;
  let pulled = 0;
  const stream = new ReadableStream({
    pull(controller) {
      pulled++;
      controller.enqueue(new Uint8Array(32));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    readLimitedBody(request(stream), 40),
    (error: unknown) =>
      error instanceof RequestSecurityError && error.status === 413,
  );
  assert.equal(cancelled, true);
  assert.ok(pulled <= 4);
});

test("declared oversized bodies are rejected without acquiring their reader", async () => {
  const input = request("{}");
  input.headers.set("content-length", "1000");
  await assert.rejects(
    readJsonBody(input, 64),
    (error: unknown) =>
      error instanceof RequestSecurityError && error.status === 413,
  );
  assert.equal(input.bodyUsed, false);
});
