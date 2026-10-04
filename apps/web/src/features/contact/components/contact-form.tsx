"use client";

import { ArrowUpRight, Check, LoaderCircle, RotateCcw } from "lucide-react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { trackConversion } from "@/features/analytics/components/conversion-tracker";
import {
  CONTACT_AGE_GROUPS,
  CONTACT_CATEGORIES,
  CONTACT_POLICY_VERSION,
  type ContactResponse,
} from "@/features/contact/model";

type FormStatus = "idle" | "submitting" | "success" | "error";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "auto";
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type ContactFormProps = {
  turnstileSiteKey?: string;
  fallbackEmail: string;
};

const initialMessage: ContactResponse = {
  ok: false,
  message: "",
};

export function ContactForm({
  turnstileSiteKey,
  fallbackEmail,
}: ContactFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const startedAtRef = useRef(Date.now());
  const [scriptReady, setScriptReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [ageGroup, setAgeGroup] = useState<"adult" | "minor">("adult");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [result, setResult] = useState<ContactResponse>(initialMessage);

  useEffect(() => {
    const target = turnstileRef.current;
    const api = window.turnstile;

    if (!turnstileSiteKey || !scriptReady || !target || !api) return;

    widgetIdRef.current = api.render(target, {
      sitekey: turnstileSiteKey,
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
      theme: "auto",
    });

    return () => {
      if (widgetIdRef.current) api.remove(widgetIdRef.current);
      widgetIdRef.current = undefined;
    };
  }, [scriptReady, turnstileSiteKey]);

  const reset = () => {
    formRef.current?.reset();
    startedAtRef.current = Date.now();
    setResult(initialMessage);
    setStatus("idle");
    setTurnstileToken("");
    setAgeGroup("adult");
    if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    setStatus("submitting");
    setResult(initialMessage);

    const values = new FormData(form);
    const payload = {
      name: String(values.get("name") ?? ""),
      email: String(values.get("email") ?? ""),
      organisation: String(values.get("organisation") ?? ""),
      category: String(values.get("category") ?? ""),
      subject: String(values.get("subject") ?? ""),
      message: String(values.get("message") ?? ""),
      relevantUrl: String(values.get("relevantUrl") ?? ""),
      ageGroup: String(values.get("ageGroup") ?? ""),
      minorDeclaration: values.get("minorDeclaration") === "on",
      website: String(values.get("website") ?? ""),
      privacyAccepted: values.get("privacyAccepted") === "on",
      followUpAccepted: values.get("followUpAccepted") === "on",
      policyVersion: CONTACT_POLICY_VERSION,
      startedAt: startedAtRef.current,
      turnstileToken,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as ContactResponse;

      setResult(body);
      setStatus(response.ok && body.ok ? "success" : "error");

      if (response.ok && body.ok) {
        trackConversion("contact_submit_success");
        form.reset();
        startedAtRef.current = Date.now();
      } else {
        trackConversion("contact_submit_failure");
      }

      if (widgetIdRef.current) {
        window.turnstile?.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    } catch {
      trackConversion("contact_submit_failure");
      setResult({
        ok: false,
        code: "unavailable",
        message:
          "The contact channel could not be reached. Please check your connection or email me directly.",
      });
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <output className="contact-form-state contact-form-state--success">
        <span className="contact-form-state__icon" aria-hidden="true">
          <Check />
        </span>
        <p className="contact-kicker">REQUEST RECEIVED</p>
        <h3>Your next step is clear.</h3>
        <p>{result.message}</p>
        {result.reference ? (
          <p className="contact-form-state__reference">
            Reference <strong>{result.reference}</strong>
          </p>
        ) : null}
        <button type="button" onClick={reset}>
          Send another message
          <RotateCcw aria-hidden="true" />
        </button>
      </output>
    );
  }

  return (
    <form ref={formRef} className="contact-form" onSubmit={submit} noValidate>
      <div className="contact-form__lead">
        <p className="contact-kicker">ENQUIRY DESK / 01</p>
        <h2 id="contact-form-title">Give me enough context to be useful.</h2>
        <p>
          Required fields are marked. I do not need your phone number, files,
          home address, or identification documents.
        </p>
      </div>

      <div className="contact-form__fields">
        <div className="contact-field">
          <label htmlFor="contact-name">Name *</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
          />
        </div>

        <div className="contact-field contact-field--wide">
          <label htmlFor="contact-age-group">Age confirmation *</label>
          <select
            id="contact-age-group"
            name="ageGroup"
            required
            value={ageGroup}
            onChange={(event) =>
              setAgeGroup(event.target.value === "minor" ? "minor" : "adult")
            }
          >
            {CONTACT_AGE_GROUPS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="contact-field__help">
            Under-18 visitors must share only the minimum information needed for
            the enquiry and must not submit sensitive records.
          </span>
        </div>

        {ageGroup === "minor" ? (
          <label className="contact-consent contact-field--wide">
            <input name="minorDeclaration" type="checkbox" required />
            <span>
              I confirm that I have not included identity documents, school
              records, financial or health information, a home address, or a
              precise location. *
            </span>
          </label>
        ) : null}

        <div className="contact-field">
          <label htmlFor="contact-email">Email *</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-organisation">Organisation</label>
          <input
            id="contact-organisation"
            name="organisation"
            type="text"
            autoComplete="organization"
            maxLength={120}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-category">What is this about? *</label>
          <select
            id="contact-category"
            name="category"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Choose a route
            </option>
            {CONTACT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="contact-field contact-field--wide">
          <label htmlFor="contact-subject">Subject *</label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            minLength={4}
            maxLength={140}
            required
          />
        </div>

        <div className="contact-field contact-field--wide">
          <label htmlFor="contact-message">
            Context, constraints and outcome *
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={8}
            minLength={20}
            maxLength={4000}
            required
          />
          <span className="contact-field__help">20–4,000 characters</span>
        </div>

        <div className="contact-field contact-field--wide">
          <label htmlFor="contact-url">Relevant URL</label>
          <input
            id="contact-url"
            name="relevantUrl"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={500}
          />
          <span className="contact-field__help">
            Job description, repository, public document, image, or video link.
            Do not share private links.
          </span>
        </div>

        <div className="contact-honeypot" aria-hidden="true">
          <label htmlFor="contact-website">Leave this field empty</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {turnstileSiteKey ? (
          <div className="contact-field contact-field--wide contact-turnstile">
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              strategy="afterInteractive"
              onLoad={() => setScriptReady(true)}
            />
            <div ref={turnstileRef} />
          </div>
        ) : null}

        <label className="contact-consent contact-field--wide">
          <input name="privacyAccepted" type="checkbox" required />
          <span>
            I have read the <a href="/privacy">Privacy Notice</a> and understand
            how this enquiry will be processed. This acknowledges the notice;
            optional uses require separate consent. *
          </span>
        </label>

        <label className="contact-consent contact-field--wide">
          <input name="followUpAccepted" type="checkbox" />
          <span>
            You may remind me about this enquiry later. This is optional and I
            can withdraw it at any time.
          </span>
        </label>

        {status === "error" ? (
          <div className="contact-form__error contact-field--wide" role="alert">
            <p>{result.message}</p>
            {result.code === "unavailable" ? (
              <a href={`mailto:${fallbackEmail}`}>
                Email AKB Studio directly
                <ArrowUpRight aria-hidden="true" />
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="contact-form__submit contact-field--wide">
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? (
              <>
                Sending
                <LoaderCircle
                  className="contact-form__spinner"
                  aria-hidden="true"
                />
              </>
            ) : (
              <>
                Send enquiry
                <ArrowUpRight aria-hidden="true" />
              </>
            )}
          </button>
          <p>I’ll use these details only to respond to this enquiry.</p>
        </div>
      </div>
    </form>
  );
}
