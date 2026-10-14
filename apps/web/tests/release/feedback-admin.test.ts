import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

class Sheet {
  cols = 26;
  constructor(
    readonly name: string,
    public data: unknown[][] = [],
  ) {}
  getName() {
    return this.name;
  }
  getLastRow() {
    return this.data.length;
  }
  getLastColumn() {
    return Math.max(0, ...this.data.map((r) => r.length));
  }
  getMaxColumns() {
    return this.cols;
  }
  insertColumnsAfter(_at: number, count: number) {
    this.cols += count;
  }
  appendRow(row: unknown[]) {
    this.data.push([...row]);
  }
  deleteRow(row: number) {
    this.data.splice(row - 1, 1);
  }
  getRange(row: number, col: number, height: number, width: number) {
    const self = this;
    return {
      getValues() {
        return Array.from({ length: height }, (_, i) =>
          Array.from(
            { length: width },
            (_, j) => self.data[row - 1 + i]?.[col - 1 + j] ?? "",
          ),
        );
      },
      getDisplayValues() {
        return this.getValues().map((r) => r.map(String));
      },
      setValues(values: unknown[][]) {
        values.forEach((r, i) => {
          r.forEach((value, j) => {
            self.data[row - 1 + i] ??= [];
            self.data[row - 1 + i][col - 1 + j] = value;
          });
        });
      },
      setValue(value: unknown) {
        this.setValues([[value]]);
      },
      createTextFinder(id: string) {
        return {
          matchEntireCell() {
            return this;
          },
          useRegularExpression() {
            return this;
          },
          findNext() {
            const index = self.data.findIndex(
              (r, i) => i >= row - 1 && String(r[col - 1]) === id,
            );
            return index < 0 ? null : { getRow: () => index + 1 };
          },
        };
      },
    };
  }
}
async function runtime() {
  const sheets = new Map<string, Sheet>();
  const logs: string[] = [];
  const properties: Record<string, string> = {
    AKB_SPREADSHEET_ID: "sheet-test",
    AKB_SERVICE_TOKEN: "token-test",
    APPS_SCRIPT_SIGNING_SECRET: "secret-test",
  };
  const book = {
    getId: () => "sheet-test",
    getSheetByName: (n: string) => sheets.get(n),
    insertSheet: (n: string) => {
      const s = new Sheet(n);
      sheets.set(n, s);
      return s;
    },
  };
  const context = vm.createContext({
    console: {
      info: (s: string) => logs.push(s),
      error: (s: string) => logs.push(s),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (n: string) => properties[n],
        setProperty: (n: string, v: string) => {
          properties[n] = v;
        },
      }),
    },
    SpreadsheetApp: { openById: () => book, getActiveSpreadsheet: () => null },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }),
    },
    Utilities: {
      getUuid: randomUUID,
      Charset: { UTF_8: "utf8" },
      DigestAlgorithm: { SHA_256: "sha256" },
      computeDigest: (_a: string, s: string) => [
        ...createHash("sha256").update(s).digest(),
      ],
      computeHmacSha256Signature: (s: string, k: string) => [
        ...createHmac("sha256", k).update(s).digest(),
      ],
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (s: string) => ({ setMimeType: () => JSON.parse(s) }),
    },
  });
  const source = await readFile(
    path.resolve(
      import.meta.dirname,
      "../../../../integrations/google-apps-script/Code.gs",
    ),
    "utf8",
  );
  vm.runInContext(source, context);
  const headers = vm.runInContext("AKB.sheets", context) as Record<
    string,
    string[]
  >;
  function post(
    action: string,
    payload: Record<string, unknown> = {},
    tamper: Record<string, unknown> = {},
  ) {
    const unsigned = { ...payload, action },
      timestamp = Date.now();
    const signature = createHmac("sha256", "secret-test")
      .update(`${timestamp}.${context.stableJson_(unsigned)}`)
      .digest("hex");
    return context.doPost({
      postData: {
        contents: JSON.stringify({
          ...unsigned,
          signature,
          timestamp,
          serviceToken: "token-test",
          ...tamper,
        }),
      },
    });
  }
  return { sheets, logs, properties, context, headers, post };
}
const feedback = {
  kind: "report",
  rating: "mixed",
  reason: "incorrect",
  responseId: "test-response",
  message: "Original visitor message",
  page: "/aeva",
  policyVersion: "2026-10-14.1",
  transcriptConsented: true,
  reportExcerpt: "Consented excerpt",
};

test("feedback management preserves messages, excludes excerpts from lists and rejects stale/delete mismatches", async () => {
  const r = await runtime();
  assert.equal(r.post("feedback_submit", feedback).ok, true);
  const listed = r.post("admin_feedback_list").data.items[0];
  assert.equal(listed.reportExcerpt, undefined);
  assert.equal(listed.status, "new");
  const detail = r.post("admin_feedback_get", { id: listed.feedbackId }).data;
  assert.equal(detail.reportExcerpt, "Consented excerpt");
  const update = {
    id: listed.feedbackId,
    revision: detail.revision,
    actorId: "owner-test",
    operationId: "op-test",
    status: "resolved",
    ownerNote: "=PRIVATE()",
  };
  assert.equal(r.post("admin_feedback_update", update).ok, true);
  const after = r.post("admin_feedback_get", { id: listed.feedbackId }).data;
  assert.equal(after.message, feedback.message);
  assert.equal(after.status, "resolved");
  assert.equal(after.ownerNote, "'=PRIVATE()");
  assert.equal(r.post("admin_feedback_update", update).error, "record_changed");
  assert.equal(
    r.post("admin_feedback_delete", {
      ...update,
      revision: after.revision,
      confirmation: "wrong",
    }).error,
    "invalid_confirmation",
  );
  assert.equal(
    r.post("admin_feedback_delete", {
      ...update,
      revision: after.revision,
      confirmation: listed.feedbackId,
    }).ok,
    true,
  );
  assert.equal(
    r.post("admin_feedback_get", { id: listed.feedbackId }).error,
    "record_not_found",
  );
  const audit = JSON.stringify(r.sheets.get("AevaFeedbackAudit")?.data);
  assert.ok(!audit.includes(feedback.message));
  assert.ok(!audit.includes(feedback.reportExcerpt));
  assert.ok(!audit.includes("PRIVATE"));
  assert.match(audit, /requested/);
  assert.match(audit, /completed/);
});
test("every feedback admin action rejects invalid authentication before reading or writing sheets", async () => {
  const r = await runtime();
  for (const action of [
    "admin_feedback_list",
    "admin_feedback_get",
    "admin_feedback_update",
    "admin_feedback_delete",
  ]) {
    assert.equal(
      r.post(action, {}, { serviceToken: "bad" }).error,
      "unauthorized",
    );
    assert.equal(
      r.post(action, {}, { signature: "0".repeat(64) }).error,
      "unauthorized",
    );
  }
  assert.equal(r.sheets.size, 0);
  const logs = r.logs.join("\n");
  assert.match(logs, /service_token/);
  assert.match(logs, /request_signature/);
  assert.doesNotMatch(logs, /token-test|secret-test/);
});
test("legacy feedback rows survive additive header upgrade and incompatible headers fail closed", async () => {
  const r = await runtime();
  const original = [
    "legacy",
    "helpful",
    "retained",
    "",
    "/aeva",
    "old",
    "old-date",
  ];
  r.sheets.set(
    "AevaFeedback",
    new Sheet("AevaFeedback", [
      [...r.headers.AevaFeedback.slice(0, 7)],
      [...original],
    ]),
  );
  assert.equal(r.post("admin_feedback_list").ok, true);
  assert.deepEqual(r.sheets.get("AevaFeedback")?.data[1], original);
  const wrong = new Sheet("AevaFeedback", [["unknown"], ["do not remove"]]);
  r.sheets.set("AevaFeedback", wrong);
  assert.equal(r.post("admin_feedback_list").error, "sheet_header_mismatch");
  assert.deepEqual(wrong.data, [["unknown"], ["do not remove"]]);
});
test("feedback pagination is bounded and source text is not interpreted as sheet formulas", async () => {
  const r = await runtime();
  for (let i = 0; i < 27; i++)
    assert.equal(
      r.post("feedback_submit", {
        ...feedback,
        message: '=HYPERLINK("bad")',
        transcriptConsented: false,
      }).ok,
      true,
    );
  const first = r.post("admin_feedback_list").data;
  assert.equal(first.items.length, 25);
  assert.ok(first.nextCursor);
  const second = r.post("admin_feedback_list", {
    cursor: first.nextCursor,
  }).data;
  assert.equal(second.items.length, 2);
  assert.equal(second.nextCursor, null);
  const detail = r.post("admin_feedback_get", {
    id: first.items[0].feedbackId,
  }).data;
  assert.equal(detail.reportExcerpt, undefined);
  assert.ok(detail.message.startsWith("'="));
});
