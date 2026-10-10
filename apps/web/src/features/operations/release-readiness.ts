export type ReleaseFinding = {
  id: string;
  label: string;
  state: "configured" | "blocked" | "review" | "disabled";
  detail: string;
};

type Environment = Record<string, string | undefined>;

// This is a configuration check, never a credential or service-validity claim.
export function releaseReadiness(env: Environment): ReleaseFinding[] {
  const present = (name: string) => {
    const value = env[name]?.trim();
    return Boolean(
      value && !/GENERATE_|USER:PASSWORD|YOUR_|CHANGE_ME/i.test(value),
    );
  };
  const enabled = (name: string) => env[name]?.trim().toLowerCase() === "true";
  const group = (
    id: string,
    label: string,
    names: string[],
    required: boolean,
  ): ReleaseFinding => {
    const count = names.filter(present).length;
    const ready = count === names.length;
    return {
      id,
      label,
      state: ready
        ? "configured"
        : required || count > 0
          ? "blocked"
          : "disabled",
      detail: ready
        ? "Configuration present. Verify the service in production."
        : count > 0
          ? "Configuration is incomplete. Complete the group before using this feature."
          : required
            ? "Required configuration is missing."
            : "Not configured. This optional integration is unavailable.",
    };
  };
  const findings = [
    group("database", "Database", ["DATABASE_URL"], true),
    group(
      "auth",
      "Admin authentication",
      ["BETTER_AUTH_URL", "BETTER_AUTH_SECRET"],
      true,
    ),
    group(
      "turnstile",
      "Contact spam protection",
      ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
      true,
    ),
    group(
      "publishing",
      "Subscriptions, questions and feedback",
      [
        "AKB_PUBLISHING_SERVICE_URL",
        "AKB_PUBLISHING_SERVICE_TOKEN",
        "APPS_SCRIPT_SIGNING_SECRET",
      ],
      true,
    ),
    group(
      "media",
      "Media uploads",
      ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
      false,
    ),
    group(
      "provider",
      "Aeva provider",
      ["GEMINI_API_KEY"],
      enabled("AEVA_PUBLIC_ENABLED") || enabled("AEVA_PRIVATE_ENABLED"),
    ),
  ];
  const abuse = [
    "ABUSE_HASH_SECRET",
    "CONTACT_ABUSE_HASH_SECRET",
    "AEVA_ABUSE_HASH_SECRET",
  ].find(present);
  const abuseValid = Boolean(abuse && (env[abuse]?.trim().length ?? 0) >= 32);
  findings.push({
    id: "abuse",
    label: "Shared request quotas",
    state: abuseValid ? "configured" : "blocked",
    detail: abuseValid
      ? "Hashing secret present. Database quota storage still needs a live check."
      : "Set a non-placeholder abuse hashing secret of at least 32 characters.",
  });
  let originValid = false;
  try {
    const site = new URL(env.NEXT_PUBLIC_SITE_URL ?? "");
    const auth = new URL(env.BETTER_AUTH_URL ?? "");
    originValid =
      site.protocol === "https:" &&
      site.origin === auth.origin &&
      !site.username &&
      !site.password &&
      site.pathname === "/" &&
      !site.search &&
      !site.hash;
  } catch {}
  findings.push({
    id: "origin",
    label: "Production origins",
    state: originValid ? "configured" : "blocked",
    detail: originValid
      ? "Site and authentication origins match over HTTPS."
      : "Set NEXT_PUBLIC_SITE_URL and BETTER_AUTH_URL to the same HTTPS production origin.",
  });
  if ((env.BETTER_AUTH_SECRET?.trim().length ?? 0) < 32) {
    const auth = findings.find((item) => item.id === "auth");
    if (auth) {
      auth.state = "blocked";
      auth.detail =
        "Authentication secret must contain at least 32 characters.";
    }
  }
  const encryption = env.AEVA_TRANSCRIPT_ENCRYPTION_KEY?.trim() ?? "";
  let encryptionValid = false;
  try {
    encryptionValid =
      /^[A-Za-z0-9+/]{43}=$/.test(encryption) && atob(encryption).length === 32;
  } catch {}
  findings.push({
    id: "transcripts",
    label: "Consented conversation storage",
    state: encryptionValid ? "configured" : "review",
    detail: encryptionValid
      ? "Encryption key has the required shape. Verify consented storage and decryption."
      : "Shared exchanges cannot be saved without a base64-encoded 32-byte encryption key. Do not rotate an existing key without a recovery plan.",
  });
  findings.push({
    id: "live-web",
    label: "Live web grounding",
    state: enabled("AEVA_WEB_SEARCH_ENABLED") ? "review" : "disabled",
    detail: enabled("AEVA_WEB_SEARCH_ENABLED")
      ? "Enabled. Test a current question with live web selected; configuration alone does not verify model access or quota."
      : "Disabled. Current questions receive an explicit unavailable response.",
  });
  findings.push(
    group(
      "email",
      "Contact email notifications",
      ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"],
      enabled("CONTACT_EMAIL_ENABLED"),
    ),
  );
  return findings;
}
