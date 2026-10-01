"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type Option = { id: string; label: string; followUpEligible?: boolean };

async function submit(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/studio", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Operation failed");
}

function data(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

export function StudioWorkspace({
  contacts,
  findings,
  suggestions,
  reminders,
}: {
  contacts: Option[];
  findings: Option[];
  suggestions: Option[];
  reminders: Option[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  async function run(
    event: FormEvent<HTMLFormElement>,
    build: (
      values: Record<string, FormDataEntryValue>,
    ) => Record<string, unknown>,
  ) {
    event.preventDefault();
    setStatus("Saving…");
    try {
      await submit(build(data(event.currentTarget)));
      event.currentTarget.reset();
      setStatus("Saved and added to the audit log.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  }
  const ContactSelect = ({
    followUpOnly = false,
  }: {
    followUpOnly?: boolean;
  }) => (
    <label>
      <span>Contact</span>
      <select name="submissionId" required>
        {contacts
          .filter((item) => !followUpOnly || item.followUpEligible)
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
      </select>
    </label>
  );
  return (
    <div className="akb-admin-operations">
      <output aria-live="polite">{status}</output>
      <section>
        <h2>Contact note</h2>
        <form
          onSubmit={(event) =>
            run(event, (v) => ({
              action: "add-note",
              submissionId: v.submissionId,
              body: v.body,
            }))
          }
        >
          <ContactSelect />
          <label>
            <span>Private note</span>
            <textarea name="body" required maxLength={2000} />
          </label>
          <button type="submit">Add note</button>
        </form>
      </section>
      <section>
        <h2>Meeting record</h2>
        <form
          onSubmit={(event) =>
            run(event, (v) => ({
              action: "add-meeting",
              submissionId: v.submissionId,
              occurredAt: new Date(String(v.occurredAt)).toISOString(),
              summary: v.summary,
              nextStep: v.nextStep || undefined,
            }))
          }
        >
          <ContactSelect />
          <label>
            <span>Occurred at</span>
            <input name="occurredAt" type="datetime-local" required />
          </label>
          <label>
            <span>Summary</span>
            <textarea name="summary" required />
          </label>
          <label>
            <span>Next step</span>
            <textarea name="nextStep" />
          </label>
          <button type="submit">Record meeting</button>
        </form>
      </section>
      <section>
        <h2>Voluntary follow-up</h2>
        <form
          onSubmit={(event) =>
            run(event, (v) => ({
              action: "add-reminder",
              submissionId: v.submissionId,
              dueAt: new Date(String(v.dueAt)).toISOString(),
              note: v.note,
            }))
          }
        >
          <ContactSelect followUpOnly />
          <label>
            <span>Due at</span>
            <input name="dueAt" type="datetime-local" required />
          </label>
          <label>
            <span>Reminder</span>
            <textarea name="note" required />
          </label>
          <button type="submit">Schedule reminder</button>
        </form>
        {reminders.length ? (
          <form
            onSubmit={(event) =>
              run(event, (v) => ({
                action: "set-reminder-state",
                id: v.id,
                state: v.state,
              }))
            }
          >
            <label>
              <span>Open reminder</span>
              <select name="id">
                {reminders.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Resolution</span>
              <select name="state">
                <option>COMPLETED</option>
                <option>CANCELLED</option>
              </select>
            </label>
            <button type="submit">Resolve reminder</button>
          </form>
        ) : (
          <p>No pending reminders.</p>
        )}
      </section>
      <section>
        <h2>Approval queue</h2>
        {findings.length ? (
          <form
            onSubmit={(event) =>
              run(event, (v) => ({
                action: "queue-suggestion",
                findingId: v.findingId,
              }))
            }
          >
            <label>
              <span>Current finding</span>
              <select name="findingId">
                {findings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Queue proposed action</button>
          </form>
        ) : (
          <p>No current health findings.</p>
        )}
        {suggestions.length ? (
          <form
            onSubmit={(event) =>
              run(event, (v) => ({
                action: "review-suggestion",
                id: v.id,
                state: v.state,
              }))
            }
          >
            <label>
              <span>Pending suggestion</span>
              <select name="id">
                {suggestions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Decision</span>
              <select name="state">
                <option>APPROVED</option>
                <option>REJECTED</option>
              </select>
            </label>
            <button type="submit">Record decision</button>
          </form>
        ) : (
          <p>
            No suggestions await review. Approval never applies a change
            automatically.
          </p>
        )}
      </section>
      <section>
        <h2>Recovery verification</h2>
        <form
          onSubmit={(event) =>
            run(event, (v) => ({
              action: "record-recovery",
              backupLabel: v.backupLabel,
              backupCreatedAt: new Date(
                String(v.backupCreatedAt),
              ).toISOString(),
              restoreTestedAt: new Date(
                String(v.restoreTestedAt),
              ).toISOString(),
              outcome: v.outcome,
              notes: v.notes || undefined,
            }))
          }
        >
          <label>
            <span>Backup label</span>
            <input name="backupLabel" required />
          </label>
          <label>
            <span>Backup created</span>
            <input name="backupCreatedAt" type="datetime-local" required />
          </label>
          <label>
            <span>Restore tested</span>
            <input name="restoreTestedAt" type="datetime-local" required />
          </label>
          <label>
            <span>Outcome</span>
            <select name="outcome">
              <option>PASS</option>
              <option>FAIL</option>
            </select>
          </label>
          <label>
            <span>Notes</span>
            <textarea name="notes" />
          </label>
          <button type="submit">Record restore drill</button>
        </form>
      </section>
    </div>
  );
}
