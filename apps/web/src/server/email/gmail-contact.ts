import {
  type ContactCategory,
  contactCategoryLabel,
} from "@/features/contact/model";
import type { ContactSubmission } from "@/features/contact/server/contact-schema";

type GmailConfiguration = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  sender: string;
  primaryInbox: string;
  generalInbox: string;
};

export type GmailDeliveryResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function readConfiguration(): GmailConfiguration | undefined {
  if (process.env.CONTACT_EMAIL_ENABLED !== "true") return undefined;

  const configuration = {
    clientId: process.env.GMAIL_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET?.trim() ?? "",
    refreshToken: process.env.GMAIL_REFRESH_TOKEN?.trim() ?? "",
    sender: process.env.GMAIL_SENDER_ADDRESS?.trim() ?? "",
    primaryInbox: process.env.CONTACT_PRIMARY_INBOX?.trim() ?? "",
    generalInbox: process.env.CONTACT_GENERAL_INBOX?.trim() ?? "",
  };

  return Object.values(configuration).every(Boolean)
    ? configuration
    : undefined;
}

function recipientFor(
  category: ContactCategory,
  configuration: GmailConfiguration,
): string {
  const professional = new Set<ContactCategory>([
    "full-time",
    "freelance",
    "collaboration",
    "engineering",
    "product",
  ]);
  return professional.has(category)
    ? configuration.primaryInbox
    : configuration.generalInbox;
}

function stripHeaderControlCharacters(value: string): string {
  return value.replace(/[\r\n\0]/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildMessage(
  submission: ContactSubmission,
  configuration: GmailConfiguration,
  reference: string,
): string {
  const label = contactCategoryLabel(submission.category);
  const recipient = recipientFor(submission.category, configuration);
  const boundary = `akb-contact-${reference}`;
  const optionalLines = [
    submission.organisation
      ? `Organisation: ${submission.organisation}`
      : undefined,
    submission.relevantUrl
      ? `Relevant URL: ${submission.relevantUrl}`
      : undefined,
  ].filter(Boolean);
  const text = [
    `New ${label} enquiry`,
    "",
    `Reference: ${reference}`,
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    ...optionalLines,
    `Policy version: ${submission.policyVersion}`,
    "",
    `Subject: ${submission.subject}`,
    "",
    submission.message,
  ].join("\r\n");
  const htmlOptional = [
    submission.organisation
      ? `<li><strong>Organisation:</strong> ${escapeHtml(submission.organisation)}</li>`
      : "",
    submission.relevantUrl
      ? `<li><strong>Relevant URL:</strong> <a href="${escapeHtml(submission.relevantUrl)}">${escapeHtml(submission.relevantUrl)}</a></li>`
      : "",
  ].join("");
  const html = `<h1>New ${escapeHtml(label)} enquiry</h1><ul><li><strong>Reference:</strong> ${escapeHtml(reference)}</li><li><strong>Name:</strong> ${escapeHtml(submission.name)}</li><li><strong>Email:</strong> ${escapeHtml(submission.email)}</li>${htmlOptional}<li><strong>Policy version:</strong> ${escapeHtml(submission.policyVersion)}</li></ul><h2>${escapeHtml(submission.subject)}</h2><p>${escapeHtml(submission.message).replaceAll("\n", "<br>")}</p>`;

  return [
    `From: AKB Studio <${stripHeaderControlCharacters(configuration.sender)}>`,
    `To: ${stripHeaderControlCharacters(recipient)}`,
    `Reply-To: ${stripHeaderControlCharacters(submission.email)}`,
    `Subject: [AKB Studio / ${stripHeaderControlCharacters(label)} / ${stripHeaderControlCharacters(reference)}] ${stripHeaderControlCharacters(submission.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    `--${boundary}--`,
  ].join("\r\n");
}

async function accessToken(
  configuration: GmailConfiguration,
): Promise<string | undefined> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        refresh_token: configuration.refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const result = (await response.json()) as { access_token?: string };
    return response.ok ? result.access_token : undefined;
  } catch {
    return undefined;
  }
}

async function sendRawMessage(
  configuration: GmailConfiguration,
  message: string,
): Promise<GmailDeliveryResult> {
  const token = await accessToken(configuration);
  if (!token) return { ok: false, error: "gmail_token_unavailable" };

  const raw = Buffer.from(message, "utf8").toString("base64url");
  try {
    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!response.ok)
      return { ok: false, error: `gmail_http_${response.status}` };
    const result = (await response.json()) as { id?: string };
    return result.id
      ? { ok: true, messageId: result.id }
      : { ok: false, error: "gmail_missing_message_id" };
  } catch {
    return { ok: false, error: "gmail_request_failed" };
  }
}

export async function sendContactEmail(
  submission: ContactSubmission,
  reference: string,
): Promise<GmailDeliveryResult> {
  const configuration = readConfiguration();
  if (!configuration) return { ok: false, error: "gmail_not_configured" };
  return sendRawMessage(
    configuration,
    buildMessage(submission, configuration, reference),
  );
}

export async function sendGuardianConsentEmail(input: {
  guardianName: string;
  guardianEmail: string;
  visitorName: string;
  subject: string;
  reference: string;
  token: string;
  expiresAt: Date;
}): Promise<GmailDeliveryResult> {
  const configuration = readConfiguration();
  if (!configuration) return { ok: false, error: "gmail_not_configured" };
  const origin = (
    process.env.PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  ).replace(/\/$/, "");
  if (!/^https?:\/\//.test(origin))
    return { ok: false, error: "public_site_url_not_configured" };
  const link = `${origin}/guardian-consent?token=${encodeURIComponent(input.token)}`;
  const subject = `[AKB Studio / Guardian consent / ${input.reference}] Action required`;
  const text = [
    `Hello ${input.guardianName},`,
    "",
    `${input.visitorName} identified you as their guardian for an AKB Studio enquiry titled “${input.subject}”.`,
    "The enquiry will not be delivered or reviewed unless you approve its processing.",
    "",
    `Review and approve or reject: ${link}`,
    `This one-time link expires on ${input.expiresAt.toISOString()}.`,
    "",
    "If you did not expect this message, reject the request or ignore it. The pending record will be deleted after expiry.",
  ].join("\r\n");
  const html = `<p>Hello ${escapeHtml(input.guardianName)},</p><p>${escapeHtml(input.visitorName)} identified you as their guardian for an AKB Studio enquiry titled <strong>${escapeHtml(input.subject)}</strong>.</p><p>The enquiry will not be delivered or reviewed unless you approve its processing.</p><p><a href="${escapeHtml(link)}">Review and approve or reject the request</a></p><p>This one-time link expires on ${escapeHtml(input.expiresAt.toISOString())}. If you did not expect this message, reject it or ignore it.</p>`;
  const boundary = `akb-guardian-${input.reference}`;
  return sendRawMessage(
    configuration,
    [
      `From: AKB Studio <${stripHeaderControlCharacters(configuration.sender)}>`,
      `To: ${stripHeaderControlCharacters(input.guardianEmail)}`,
      `Subject: ${stripHeaderControlCharacters(subject)}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      text,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html,
      `--${boundary}--`,
    ].join("\r\n"),
  );
}

export async function sendPrivacyRequestEmail(input: {
  reference: string;
  name: string;
  email: string;
  type: string;
  details: string;
  relatedReference?: string;
  resourceUrl?: string;
  policyVersion: string;
}): Promise<GmailDeliveryResult> {
  const configuration = readConfiguration();
  if (!configuration) return { ok: false, error: "gmail_not_configured" };
  const subject = `[AKB Studio / Privacy / ${input.reference}] ${input.type}`;
  const text = [
    "New privacy or grievance request",
    "",
    `Reference: ${input.reference}`,
    `Type: ${input.type}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Related reference: ${input.relatedReference ?? "Not supplied"}`,
    `Resource URL: ${input.resourceUrl ?? "Not supplied"}`,
    `Policy version: ${input.policyVersion}`,
    "",
    input.details,
  ].join("\r\n");
  return sendRawMessage(
    configuration,
    [
      `From: AKB Studio <${stripHeaderControlCharacters(configuration.sender)}>`,
      `To: ${stripHeaderControlCharacters(configuration.generalInbox)}`,
      `Reply-To: ${stripHeaderControlCharacters(input.email)}`,
      `Subject: ${stripHeaderControlCharacters(subject)}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "MIME-Version: 1.0",
      "",
      text,
    ].join("\r\n"),
  );
}

export async function trashContactEmail(messageId: string): Promise<boolean> {
  const configuration = readConfiguration();
  if (!configuration) return false;
  const token = await accessToken(configuration);
  if (!token) return false;

  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}/trash`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}
