"use client";

import { useCallback, useEffect, useState } from "react";

type State = {
  journalKnowledgeHold: boolean;
  globalMailHold: boolean;
  scheduled: number;
  held: number;
  queued: number;
  remainingDailyQuota: number;
  nextScheduledAt?: string | null;
};

export function NotificationConsole() {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/notifications", {
      cache: "no-store",
    });

    const result = (await response.json()) as { data?: State };
    setState(result.data ?? null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setting(key: string, value: boolean) {
    setBusy(true);

    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "setting",
          key,
          value,
        }),
      });

      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    setBusy(true);

    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "send" }),
      });

      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const next = state?.nextScheduledAt
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(state.nextScheduledAt))
    : "—";

  return (
    <div className="akb-admin-ledger">
      <section className="akb-admin-ledger__status">
        <span className="akb-folio">DELIVERY STATE</span>
        <h2>{state?.globalMailHold ? "All mail held" : "Outbound active"}</h2>

        <dl>
          <div>
            <dt>Scheduled</dt>
            <dd>{state?.scheduled ?? "—"}</dd>
          </div>
          <div>
            <dt>Held</dt>
            <dd>{state?.held ?? "—"}</dd>
          </div>
          <div>
            <dt>Queued</dt>
            <dd>{state?.queued ?? "—"}</dd>
          </div>
          <div>
            <dt>Quota remaining</dt>
            <dd>{state?.remainingDailyQuota ?? "—"}</dd>
          </div>
          <div>
            <dt>Next eligible</dt>
            <dd>{next}</dd>
          </div>
        </dl>
      </section>

      <div className="akb-admin-ledger__actions">
        <section>
          <span className="akb-folio">EDITORIAL HOLD</span>
          <h3>Journal & Knowledge</h3>
          <p>Publishing stays live; publication mail waits.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              setting(
                "notification.journalKnowledgeHold",
                !(state?.journalKnowledgeHold ?? false),
              )
            }
          >
            {state?.journalKnowledgeHold
              ? "Release publication hold"
              : "Hold publication mail"}
          </button>
        </section>

        <section>
          <span className="akb-folio">EMERGENCY</span>
          <h3>All outbound mail</h3>
          <p>Stops every notification worker immediately.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              setting(
                "notification.globalMailHold",
                !(state?.globalMailHold ?? false),
              )
            }
          >
            {state?.globalMailHold ? "Resume outbound mail" : "Hold all mail"}
          </button>
        </section>

        <section>
          <span className="akb-folio">MANUAL WORKER</span>
          <h3>Send available quota</h3>
          <p>Processes only the safe, eligible part of the queue.</p>
          <button type="button" disabled={busy} onClick={send}>
            Send safe batch now
          </button>
        </section>
      </div>
    </div>
  );
}
