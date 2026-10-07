"use client";

import { useEffect, useState } from "react";

import { POLICY_VERSIONS } from "@/features/legal/policy-registry";

const STORAGE_KEY = "akb-privacy-preferences";

type Preferences = {
  analytics: boolean;
  version: string;
  updatedAt: string;
};

export function PrivacyPreferences() {
  const [analytics, setAnalytics] = useState(false);
  const [savedAt, setSavedAt] = useState<string>();
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<Preferences>;
      setAnalytics(parsed.analytics === true);
      setSavedAt(
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : undefined,
      );
    } catch {
      setStorageError(
        "This browser is blocking preference storage. Your selection was not saved.",
      );
    }
  }, []);

  function save() {
    const value: Preferences = {
      analytics,
      version: POLICY_VERSIONS.cookies,
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      setSavedAt(value.updatedAt);
      setStorageError("");
      window.dispatchEvent(
        new CustomEvent("akb:privacy-preferences", { detail: value }),
      );
    } catch {
      setStorageError(
        "This browser is blocking preference storage. Your selection was not saved.",
      );
    }
  }

  return (
    <div className="legal-preferences">
      <div className="legal-preferences__row">
        <strong>Essential operation</strong>
        <span>Always active for security, forms and owner authentication.</span>
      </div>
      <label className="legal-preferences__row">
        <span>
          <strong>Optional analytics</strong>
          <small>
            Records anonymous page categories, project slugs, bounded attention
            time and page counts for up to 30 days. It is never joined to a
            contact submission.
          </small>
        </span>
        <input
          type="checkbox"
          checked={analytics}
          onChange={(event) => setAnalytics(event.target.checked)}
        />
      </label>
      <button type="button" onClick={save}>
        Save preferences
      </button>
      <output aria-live="polite">
        {storageError ||
          (savedAt
            ? `Saved on ${new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(savedAt))}.`
            : "No optional analytics preference has been saved on this device.")}
      </output>
    </div>
  );
}
