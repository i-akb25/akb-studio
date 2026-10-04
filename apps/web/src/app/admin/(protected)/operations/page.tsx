import Link from "next/link";
import { getDatabaseHealth } from "@/server/db/database-health";

const areas = [
  [
    "Site settings",
    "/admin/site",
    "Change public email addresses, site metadata and the sharing preview image.",
  ],
  [
    "Profile",
    "/admin/profile",
    "Change the About identity, biography, public email and profile image.",
  ],
  [
    "Availability",
    "/admin/availability",
    "Publish or expire the opportunity status shown publicly.",
  ],
  [
    "Projects",
    "/admin/projects",
    "Create and edit project records, covers, links and homepage placement.",
  ],
  [
    "Reflections",
    "/admin/reflections",
    "Manage the Daily Sanskrit Reflection and its publication state.",
  ],
  [
    "Galleries",
    "/admin/galleries",
    "Manage creative collections and attach uploaded images.",
  ],
] as const;

export default async function OperationsPage() {
  const database = await getDatabaseHealth();
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Portfolio controls</p>
        <h1>Choose one area to edit</h1>
        <p>
          This page is now an index. Each public data area has its own focused
          editor in the left navigation.
        </p>
      </header>
      <div className="akb-admin-card-grid">
        {areas.map(([title, href, description], index) => (
          <Link className="akb-admin-task-card" href={href} key={href}>
            <span>Area {String(index + 1).padStart(2, "0")}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2>Database capacity</h2>
        {database.available &&
        database.bytes !== null &&
        database.percent !== null ? (
          <p>
            {(database.bytes / 1024 / 1024).toFixed(1)} MB of 500 MB used (
            {database.percent.toFixed(1)}%).
          </p>
        ) : (
          <p>
            Capacity could not be read. This does not prove that public content
            or the database is offline.
          </p>
        )}
      </section>
    </div>
  );
}
