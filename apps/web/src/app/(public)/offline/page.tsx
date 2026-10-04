import type { Metadata } from "next";
import { OfflineWorkspace } from "@/features/offline/components/offline-workspace";

export const metadata: Metadata = {
  title: "Offline workspace | AKB Studio",
  description:
    "A private, browser-local workspace for saved collections, notes, and contact drafts.",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-[1200px] px-5 py-16 sm:px-8 lg:px-12">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-warm">
        Private on this device
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
        Offline workspace
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
        This optional browser notebook lets you save public links, personal
        notes and a contact-message draft on this device. It does not require an
        account, does not sync with Admin and cannot change the public
        portfolio. Export a backup before clearing browser storage.
      </p>
      <div className="mt-12">
        <OfflineWorkspace />
      </div>
    </main>
  );
}
