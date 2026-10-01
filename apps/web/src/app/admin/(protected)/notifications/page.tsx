import { NotificationConsole } from "@/features/admin/components/notification-console";
export default function AdminNotificationsPage() {
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Notification Center</p>
        <h1>Control publication delivery.</h1>
        <p>
          Hold, release and process the quota-safe Journal and Knowledge queue.
        </p>
      </header>
      <NotificationConsole />
    </main>
  );
}
