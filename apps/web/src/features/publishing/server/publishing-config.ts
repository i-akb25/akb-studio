// Pure validation: never return credentials or an untrusted destination in errors.
export function publishingConfigurationError(
  env: Record<string, string | undefined>,
):
  | "publishing_service_not_configured"
  | "publishing_service_invalid_url"
  | null {
  const raw = env.AKB_PUBLISHING_SERVICE_URL?.trim();
  if (
    !raw ||
    !env.AKB_PUBLISHING_SERVICE_TOKEN?.trim() ||
    !env.APPS_SCRIPT_SIGNING_SECRET?.trim()
  )
    return "publishing_service_not_configured";
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "script.google.com" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)
    )
      return "publishing_service_invalid_url";
    return null;
  } catch {
    return "publishing_service_invalid_url";
  }
}
