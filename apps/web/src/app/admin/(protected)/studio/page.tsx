import { StudioWorkspace } from "@/features/admin/components/studio-workspace";
import { requireAdmin } from "@/features/admin/server/admin-auth";
import { getStudioHealthFindings } from "@/features/admin/server/studio-health";
import { prisma } from "@/server/db/prisma";

export default async function PrivateStudioPage() {
  const session = await requireAdmin("contact:moderate");
  const isOwner = session.role === "owner";
  const now = new Date();
  const [contacts, reminders, journeys, suggestions, recovery, findings] =
    await Promise.all([
      prisma.contactSubmission.findMany({
        where: { isMinor: false },
        include: {
          notes: { orderBy: { createdAt: "desc" }, take: 3 },
          meetings: { orderBy: { occurredAt: "desc" }, take: 3 },
          reminders: { where: { state: "PENDING" }, orderBy: { dueAt: "asc" } },
          consentRecords: {
            where: {
              consentType: "follow_up_reminder",
              granted: true,
              withdrawnAt: null,
            },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.followUpReminder.findMany({
        where: { state: "PENDING" },
        include: { submission: { select: { reference: true, subject: true } } },
        orderBy: { dueAt: "asc" },
        take: 50,
      }),
      isOwner
        ? prisma.anonymousJourney.findMany({
            where: { retentionUntil: { gt: now } },
            orderBy: { lastSeenAt: "desc" },
            take: 500,
          })
        : Promise.resolve([]),
      isOwner
        ? prisma.studioSuggestion.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
          })
        : Promise.resolve([]),
      isOwner
        ? prisma.recoveryVerification.findMany({
            orderBy: { restoreTestedAt: "desc" },
            take: 12,
          })
        : Promise.resolve([]),
      isOwner ? getStudioHealthFindings() : Promise.resolve([]),
    ]);
  const projectEngagement = new Map<string, number>();
  const categoryEngagement = new Map<string, number>();
  for (const journey of journeys) {
    for (const slug of journey.projectSlugs)
      projectEngagement.set(slug, (projectEngagement.get(slug) ?? 0) + 1);
    for (const category of journey.categories)
      categoryEngagement.set(
        category,
        (categoryEngagement.get(category) ?? 0) + 1,
      );
  }
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Private Studio</p>
        <h1>Relationships, signals and recovery</h1>
        <p>
          Contact records remain separate from consented anonymous journey
          summaries. Suggestions require an explicit owner decision and never
          change public content automatically.
        </p>
      </header>
      <section>
        <h2>Pipeline</h2>
        {contacts.length ? (
          contacts.map((contact) => (
            <article key={contact.id}>
              <h3>{contact.subject}</h3>
              <p>
                {contact.reference} · {contact.category} · {contact.state}
              </p>
              <p>
                {contact.notes.length} recent note(s) ·{" "}
                {contact.meetings.length} recent meeting(s) ·{" "}
                {contact.reminders.length} open reminder(s)
              </p>
            </article>
          ))
        ) : (
          <p>No eligible adult contact records.</p>
        )}
      </section>
      {isOwner ? (
        <section>
          <h2>Anonymous engagement</h2>
          <p>
            {journeys.length} consented session summary record(s), retained for
            no more than 30 days. These records have no contact identifier, IP
            address or user agent.
          </p>
          <dl>
            <div>
              <dt>Recorded page views</dt>
              <dd>{journeys.reduce((sum, item) => sum + item.pageCount, 0)}</dd>
            </div>
            <div>
              <dt>Recorded attention</dt>
              <dd>
                {Math.round(
                  journeys.reduce((sum, item) => sum + item.totalSeconds, 0) /
                    60,
                )}{" "}
                min
              </dd>
            </div>
          </dl>
          <h3>Project reach</h3>
          <ul>
            {[...projectEngagement.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([slug, count]) => (
                <li key={slug}>
                  {slug} · {count} session(s)
                </li>
              ))}
          </ul>
          <h3>Category reach</h3>
          <ul>
            {[...categoryEngagement.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <li key={category}>
                  {category} · {count} session(s)
                </li>
              ))}
          </ul>
        </section>
      ) : null}
      {isOwner ? (
        <section>
          <h2>Portfolio health</h2>
          {findings.length ? (
            <ul>
              {findings.map((finding) => (
                <li key={finding.id}>
                  <strong>{finding.title}</strong> · {finding.detail}
                </li>
              ))}
            </ul>
          ) : (
            <p>No current findings from the implemented checks.</p>
          )}
        </section>
      ) : null}
      {isOwner ? (
        <>
          <section>
            <h2>Suggestion decisions</h2>
            {suggestions.length ? (
              <ul>
                {suggestions.map((item) => (
                  <li key={item.id}>
                    {item.state} · {item.title} · {item.proposedAction}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No suggestions recorded.</p>
            )}
          </section>
          <section>
            <h2>Recovery record</h2>
            {recovery.length ? (
              <ul>
                {recovery.map((item) => (
                  <li key={item.id}>
                    {item.restoreTestedAt.toISOString()} · {item.outcome} ·{" "}
                    {item.backupLabel}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No restore drill has been recorded. A backup is not considered
                verified until a restore test succeeds.
              </p>
            )}
          </section>
        </>
      ) : null}
      <StudioWorkspace
        canManageGovernance={isOwner}
        contacts={contacts.map((item) => ({
          id: item.id,
          label: `${item.reference} · ${item.subject}`,
          followUpEligible: item.consentRecords.length > 0,
        }))}
        findings={findings.map((item) => ({ id: item.id, label: item.title }))}
        suggestions={suggestions
          .filter((item) => item.state === "PENDING")
          .map((item) => ({ id: item.id, label: item.title }))}
        reminders={reminders.map((item) => ({
          id: item.id,
          label: `${item.dueAt.toISOString().slice(0, 10)} · ${item.submission.reference} · ${item.note}`,
        }))}
      />
    </main>
  );
}
