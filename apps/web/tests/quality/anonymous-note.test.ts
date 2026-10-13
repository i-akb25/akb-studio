import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ANONYMOUS_NOTE_URL,
  resolveAnonymousNoteUrl,
} from "../../src/features/pravaah/anonymous-note";

test("anonymous note uses the owner's form and permits explicit disable or override", () => {
  assert.equal(resolveAnonymousNoteUrl(undefined), DEFAULT_ANONYMOUS_NOTE_URL);
  assert.equal(
    resolveAnonymousNoteUrl("  https://forms.gle/KJAQD8y1fRZz77xQ9  "),
    DEFAULT_ANONYMOUS_NOTE_URL,
  );
  assert.equal(resolveAnonymousNoteUrl(""), undefined);
  assert.equal(
    resolveAnonymousNoteUrl("https://example.com/form"),
    "https://example.com/form",
  );
});

test("anonymous note rejects malformed Markdown, non-HTTPS and credential URLs", () => {
  for (const value of [
    "[https://forms.gle/example](https://forms.gle/example)",
    "http://example.com",
    "javascript:alert(1)",
    "https://user:pass@example.com/form",
  ])
    assert.equal(resolveAnonymousNoteUrl(value), undefined);
});
