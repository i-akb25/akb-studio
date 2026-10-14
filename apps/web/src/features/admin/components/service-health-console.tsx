"use client";
import { useEffect, useState } from "react";

type ServiceHealth = {
  key: string;
  status: string;
  summary: string | null;
  latencyMs: number | null;
  consecutiveFailures: number;
  lastCheckedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
};
export function ServiceHealthConsole() {
  const [records, setRecords] = useState<ServiceHealth[]>([]);
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: The refresh counter explicitly reloads server records.
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setStatus("");
    void fetch("/api/admin/service-health", {
      cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Health could not be loaded.");
        if (!controller.signal.aborted) setRecords(result.data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setRecords([]);
          setStatus(
            error instanceof Error
              ? error.message
              : "Health could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [refresh]);
  return (
    <section>
      <button
        type="button"
        disabled={busy}
        onClick={() => setRefresh((n) => n + 1)}
      >
        {busy ? "Loading…" : "Refresh recorded status"}
      </button>
      <output>{status}</output>
      <div className="akb-admin-list">
        {records.map((row) => (
          <article key={row.key}>
            <div>
              <h2>{row.key}</h2>
              <p>
                {row.status} · Consecutive failures: {row.consecutiveFailures}
              </p>
              <p>{row.summary}</p>
              <p>Last checked: {row.lastCheckedAt}</p>
              <p>Last success: {row.lastSuccessAt ?? "Not recorded"}</p>
              <p>Last failure: {row.lastFailureAt ?? "Not recorded"}</p>
              {row.latencyMs !== null ? (
                <p>Latency: {row.latencyMs} ms</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {!busy && !status && !records.length ? (
        <p>No service results recorded yet.</p>
      ) : null}
    </section>
  );
}
