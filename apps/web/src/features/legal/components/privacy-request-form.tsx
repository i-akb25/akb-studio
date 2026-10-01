"use client";

import { type FormEvent, useRef, useState } from "react";

import {
  PRIVACY_REQUEST_POLICY_VERSION,
  PRIVACY_REQUEST_TYPES,
  type PrivacyRequestResponse,
} from "@/features/legal/privacy-request-model";

export function PrivacyRequestForm() {
  const startedAt = useRef(Date.now());
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<PrivacyRequestResponse>({
    ok: false,
    message: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    setState("submitting");
    try {
      const response = await fetch("/api/privacy/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          email: values.get("email"),
          type: values.get("type"),
          details: values.get("details"),
          relatedReference: values.get("relatedReference"),
          resourceUrl: values.get("resourceUrl"),
          website: values.get("website"),
          noticeAccepted: values.get("noticeAccepted") === "on",
          policyVersion: PRIVACY_REQUEST_POLICY_VERSION,
          startedAt: startedAt.current,
        }),
      });
      const body = (await response.json()) as PrivacyRequestResponse;
      setResult(body);
      setState(response.ok && body.ok ? "success" : "error");
      if (response.ok && body.ok) form.reset();
    } catch {
      setResult({
        ok: false,
        message: "The privacy request channel is temporarily unavailable.",
      });
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <output className="privacy-request__result">
        <strong>Request received</strong>
        <span>{result.message}</span>
        {result.reference ? <code>{result.reference}</code> : null}
      </output>
    );
  }

  return (
    <form className="privacy-request" onSubmit={submit} noValidate>
      <div className="privacy-request__grid">
        <label>
          <span>Name *</span>
          <input name="name" minLength={2} maxLength={80} required />
        </label>
        <label>
          <span>Email used with AKB Studio *</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label className="privacy-request__wide">
          <span>Request type *</span>
          <select name="type" required defaultValue="">
            <option value="" disabled>
              Choose a request
            </option>
            {PRIVACY_REQUEST_TYPES.map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Existing reference</span>
          <input name="relatedReference" maxLength={100} />
        </label>
        <label>
          <span>Public content URL</span>
          <input name="resourceUrl" type="url" maxLength={500} />
        </label>
        <label className="privacy-request__wide">
          <span>What should be located or changed? *</span>
          <textarea name="details" minLength={20} maxLength={4000} required />
        </label>
        <label className="privacy-request__consent privacy-request__wide">
          <input name="noticeAccepted" type="checkbox" required />
          <span>
            I understand this data is used to verify and resolve my request and
            retained with the case record. *
          </span>
        </label>
        <div className="contact-honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>
      <button type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "Submitting…" : "Submit privacy request"}
      </button>
      <output aria-live="polite" data-state={state}>
        {state === "error" ? result.message : ""}
      </output>
    </form>
  );
}
