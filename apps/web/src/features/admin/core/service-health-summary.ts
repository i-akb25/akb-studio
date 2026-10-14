const publishingErrors = new Set([
  "unauthorized",
  "unsupported_action",
  "invalid_feedback",
  "invalid_identifier",
  "invalid_text",
  "internal_error",
  "required_sheet_missing",
  "sheet_header_mismatch",
  "publishing_service_not_initialized",
  "service_busy",
  "record_not_found",
  "record_changed",
  "invalid_confirmation",
  "publishing_service_error",
]);
const fixedSummaries = new Set([
  "Publishing service URL is invalid",
  "Publishing service configuration is incomplete",
  "Publishing service request failed",
  "Publishing service returned an invalid response",
  "Publishing service responded successfully",
  "Publishing service reported a controlled error",
  "Database query succeeded",
  "Database query failed",
]);
export function safeHealthSummary(summary: string | null): string {
  if (summary && fixedSummaries.has(summary)) return summary;
  const prefix = "Publishing service rejected request: ";
  if (
    summary?.startsWith(prefix) &&
    publishingErrors.has(summary.slice(prefix.length))
  )
    return summary;
  if (summary && /^Publishing service returned [1-5][0-9]{2}$/.test(summary))
    return summary;
  return "See the recorded status and timestamps. Additional provider details are not displayed here.";
}
