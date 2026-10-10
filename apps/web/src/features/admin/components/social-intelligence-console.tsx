"use client";

import { useState } from "react";
import type {
  SocialIntelligenceSnapshot,
  SocialVerificationResult,
} from "@/features/social-intelligence/model";

type HealthRecord = {
  key: string;
  status: string;
  summary: string | null;
  lastCheckedAt: string;
};

export function SocialIntelligenceConsole({
  initialSnapshot,
  health,
}: {
  initialSnapshot: SocialIntelligenceSnapshot;
  health: readonly HealthRecord[];
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [verification, setVerification] =
    useState<SocialVerificationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function verifyGitHub() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/social-intelligence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "verify-github" }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        snapshot?: SocialIntelligenceSnapshot;
        verification?: SocialVerificationResult;
      } | null;
      if (!response.ok || !payload?.snapshot || !payload.verification) {
        throw new Error(payload?.error ?? "Provider verification failed.");
      }
      setSnapshot(payload.snapshot);
      setVerification(payload.verification);
      setMessage("Read-only GitHub verification completed.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Provider verification failed safely.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Aeva 2.3 / Social intelligence</p>
        <h1>Provider permissions and verification</h1>
        <p>
          Owner-only visibility into social access. Credentials stay
          server-side, verification is read-only, and nothing is ingested or
          published without a separate review action.
        </p>
      </header>

      <div className="akb-admin-guide">
        <strong>
          Aeva social switch:{" "}
          {snapshot.enabled ? "enabled" : "disabled (fail closed)"}
        </strong>
        <p>
          LinkedIn, X and Instagram remain manual canonical-link sources even
          when Aeva social access is off. GitHub is the only official API
          adapter in this release. Social content does not enter private Aeva
          memory.
        </p>
      </div>

      <section aria-labelledby="provider-manifest-heading">
        <h2 id="provider-manifest-heading">Permission manifest</h2>
        <div className="akb-admin-list">
          {snapshot.providers.map((provider) => (
            <article key={provider.id}>
              <div>
                <p className="akb-kicker">
                  {provider.mode.replaceAll("-", " ")} / {provider.state}
                </p>
                <h3>{provider.label}</h3>
                <p>{provider.summary}</p>
                <p>
                  Automatic ingestion:{" "}
                  {provider.automaticIngestion ? "yes" : "no"}
                  {" · "}Automatic publishing:{" "}
                  {provider.automaticPublishing ? "yes" : "no"}
                  {" · "}Aeva memory: {provider.feedsAeva ? "yes" : "no"}
                </p>
              </div>
              <div>
                <div>
                  <strong>Declared access</strong>
                  <ul>
                    {provider.permissions.map((permission) => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Safeguards</strong>
                  <ul>
                    {provider.safeguards.map((safeguard) => (
                      <li key={safeguard}>{safeguard}</li>
                    ))}
                  </ul>
                </div>
                {provider.credentials.length ? (
                  <div>
                    <strong>Server credentials</strong>
                    <ul>
                      {provider.credentials.map((item) => (
                        <li key={item.name}>
                          <code>{item.name}</code>:{" "}
                          {item.configured ? "configured" : "missing"}
                          {item.legacy ? " (legacy)" : ""} · {item.purpose}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="akb-admin-panel"
        aria-labelledby="verification-heading"
      >
        <h2 id="verification-heading">GitHub connection check</h2>
        <p>
          This checks official GitHub read endpoints. It does not prove write
          access by changing a file; mirror write permission is confirmed only
          when an explicit Pravaah update succeeds.
        </p>
        <div className="akb-admin-actions">
          <button type="button" disabled={busy} onClick={verifyGitHub}>
            {busy ? "Checking…" : "Verify GitHub access"}
          </button>
        </div>
        {message ? <output>{message}</output> : null}
        {verification ? (
          <div className="akb-ops-table">
            <table>
              <thead>
                <tr>
                  <th>Probe</th>
                  <th>Status</th>
                  <th>Detail</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {verification.probes.map((probe) => (
                  <tr key={probe.id}>
                    <th>{probe.label}</th>
                    <td>{probe.status}</td>
                    <td>{probe.detail}</td>
                    <td>
                      {probe.latencyMs === undefined
                        ? "—"
                        : `${probe.latencyMs} ms`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="social-health-heading">
        <h2 id="social-health-heading">Recorded provider health</h2>
        {health.length ? (
          <div className="akb-ops-table">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Status</th>
                  <th>Last checked</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {health.map((item) => (
                  <tr key={item.key}>
                    <th>{item.key.replaceAll("_", " ")}</th>
                    <td>{item.status}</td>
                    <td>{item.lastCheckedAt}</td>
                    <td>{item.summary ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No social provider check has been recorded yet.</p>
        )}
      </section>
    </main>
  );
}
