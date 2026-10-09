import { AevaMemoryConsole } from "@/features/admin/components/aeva-memory-console";
import { PrivateAevaConsole } from "@/features/admin/components/private-aeva-console";
import { requireAdmin } from "@/features/admin/server/admin-auth";
import { aevaServerConfig } from "@/features/aeva/config/server-config";
import { decryptAevaText } from "@/features/aeva/server/encryption";
import { prisma } from "@/server/db/prisma";

export default async function AdminAevaPage() {
  const session = await requireAdmin("content:write");
  const isOwner = session.role === "owner";
  const [memories, sources, gaps, incidents] = await Promise.all([
    prisma.aevaMemory.findMany({
      where: isOwner ? undefined : { visibility: "PUBLIC_AEVA" },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.aevaSource.findMany({
      where: isOwner ? undefined : { publicAllowed: true },
      orderBy: { updatedAt: "desc" },
    }),
    isOwner
      ? prisma.aevaKnowledgeGap.findMany({
          where: { status: "open" },
          orderBy: { lastSeenAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
    isOwner
      ? prisma.aevaIncident.findMany({
          where: { resolvedAt: null },
          orderBy: { lastSeenAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Aeva control room</p>
        <h1>Memory, sources and knowledge gaps</h1>
        <p>
          Public and owner-only retrieval use separate allowlists. Contacts,
          authentication records, audit data and external accounts remain
          excluded.
        </p>
      </header>
      {isOwner && aevaServerConfig.privateEnabled ? (
        <PrivateAevaConsole />
      ) : null}
      <AevaMemoryConsole
        canManagePrivate={isOwner}
        memories={memories.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          visibility: item.visibility,
          state: item.state,
          sourceLabel: item.sourceLabel,
          sourceUrl: item.sourceUrl,
        }))}
        sources={sources.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          notes: item.notes,
          publicAllowed: item.publicAllowed,
        }))}
      />
      <section>
        <h2>Current memory entries</h2>
        {memories.length ? (
          <ul>
            {memories.map((item) => (
              <li key={item.id}>
                {item.title} · {item.visibility} · {item.state}
              </li>
            ))}
          </ul>
        ) : (
          <p>No memory entries yet.</p>
        )}
      </section>
      <section>
        <h2>Approved URLs</h2>
        {sources.length ? (
          <ul>
            {sources.map((item) => (
              <li key={item.id}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.title}
                </a>{" "}
                · {item.enabled ? "enabled" : "disabled"} ·{" "}
                {item.publicAllowed ? "public" : "owner-only"}
              </li>
            ))}
          </ul>
        ) : (
          <p>No owner URLs yet.</p>
        )}
      </section>
      {isOwner ? (
        <section>
          <h2>Unanswered questions</h2>
          {gaps.length ? (
            <ul>
              {gaps.map((item) => (
                <li key={item.id}>
                  {item.encryptedQuestion
                    ? (decryptAevaText(item.encryptedQuestion) ??
                      "Encrypted sample unavailable")
                    : "Anonymous counter only"}{" "}
                  · {item.occurrences} occurrence(s)
                </li>
              ))}
            </ul>
          ) : (
            <p>No open knowledge gaps.</p>
          )}
        </section>
      ) : null}
      {isOwner ? (
        <section>
          <h2>Provider incidents</h2>
          {incidents.length ? (
            <ul>
              {incidents.map((item) => (
                <li key={item.id}>
                  {item.kind}/{item.code} · {item.occurrences} ·{" "}
                  {item.lastSeenAt.toISOString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No unresolved Aeva incidents.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
