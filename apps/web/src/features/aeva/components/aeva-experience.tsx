"use client";

import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  Send,
  Square,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackConversion } from "@/features/analytics/components/conversion-tracker";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import type { AevaAnswer, AevaCitation, AevaMode } from "../model";
import { AEVA_HIGHLIGHT_EVENT } from "./screen-awareness";
import { VoiceControls } from "./voice-controls";

type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: AevaCitation[];
  evidenceState?: AevaAnswer["evidenceState"];
  highlights?: string[];
};
const starters = [
  "Which projects best show production engineering?",
  "How does Anurag connect electrical engineering and software?",
  "What is Ace currently building?",
];

export function AevaExperience() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<AevaMode>("explore");
  const [jobDescription, setJobDescription] = useState("");
  const [allowWeb, setAllowWeb] = useState(false);
  const [shareConversation, setShareConversation] = useState(false);
  const [shareUnknownQuestion, setShareUnknownQuestion] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [status, setStatus] = useState("");
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [ended, setEnded] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const feedbackHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const latestMessage = messages.at(-1);

    if (!status && latestMessage?.role === "assistant" && !ended) {
      questionRef.current?.focus();
    }
  }, [ended, messages, status]);

  useEffect(() => {
    if (ended) {
      feedbackHeadingRef.current?.focus();
    }
  }, [ended]);

  useEffect(() => {
    const highlights = messages.at(-1)?.highlights;
    if (!highlights?.length) return;
    window.dispatchEvent(
      new CustomEvent<string[]>(AEVA_HIGHLIGHT_EVENT, { detail: highlights }),
    );
  }, [messages]);

  function pageContext() {
    const parameters = new URLSearchParams(window.location.search);
    const sourcePath = parameters.get("from");
    const path = sourcePath?.startsWith("/") ? sourcePath : "/aeva";
    const sectionId = parameters.get("section") ?? undefined;
    const sectionLabel = parameters.get("sectionLabel") ?? undefined;
    const title = parameters.get("title") ?? document.title;
    return {
      path,
      title: title.slice(0, 160),
      ...(sectionId && /^[a-z0-9][a-z0-9-_]{0,79}$/i.test(sectionId)
        ? { sectionId }
        : {}),
      ...(sectionLabel ? { sectionLabel: sectionLabel.slice(0, 120) } : {}),
    };
  }

  async function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed || status || messages.length >= 40) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setStatus("Connecting to Aeva");
    setFollowUps([]);
    try {
      const response = await fetch("/api/aeva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          mode,
          allowWeb,
          shareConversation,
          shareUnknownQuestion,
          conversationId,
          history: messages.slice(-8).map((message) => ({
            role: message.role,
            text: message.text,
          })),
          pageContext: pageContext(),
          ...(mode === "recruiter" && jobDescription.trim().length >= 40
            ? { jobDescription: jobDescription.trim() }
            : {}),
          policyVersion: POLICY_VERSIONS.aeva,
        }),
      });
      if (!response.ok || !response.body) throw new Error("unavailable");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const line = event
            .split("\n")
            .find((item) => item.startsWith("data: "));
          if (!line) continue;
          const payload = JSON.parse(line.slice(6)) as
            | { type: "status"; message: string }
            | { type: "answer"; result: AevaAnswer };
          if (payload.type === "status") setStatus(payload.message);
          else {
            trackConversion(
              payload.result.ok ? "aeva_success" : "aeva_failure",
            );
            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                text: payload.result.answer,
                citations: payload.result.citations,
                evidenceState: payload.result.evidenceState,
                highlights: payload.result.highlights,
              },
            ]);
            setFollowUps(payload.result.followUps);
            setConversationId(payload.result.conversationId ?? conversationId);
          }
        }
      }
    } catch {
      trackConversion("aeva_failure");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I couldn't complete that request. Your message remains in this browser, so you can retry when the service is available.",
        },
      ]);
    } finally {
      setStatus("");
    }
  }

  async function endChat() {
    await fetch("/api/aeva/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    }).catch(() => undefined);
    setEnded(true);
  }

  async function sendFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackStatus("Sending…");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: data.get("rating"),
        message: String(data.get("message") ?? "") || undefined,
        ...(shareConversation && conversationId ? { conversationId } : {}),
        page: "/aeva",
        policyVersion: POLICY_VERSIONS.aeva,
      }),
    });
    setFeedbackStatus(
      response.ok
        ? "Thank you — feedback received."
        : "Feedback is temporarily unavailable.",
    );
  }

  return (
    <main className="relative overflow-hidden border-b border-border bg-background">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-accent-warm/50"
      />
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-[1440px] lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="relative min-h-[34rem] overflow-hidden border-b border-border lg:min-h-full lg:border-r lg:border-b-0">
          <Image
            src="/images/aeva/aeva-identity.webp"
            alt="Fictional portrait representing Aeva"
            fill
            priority
            sizes="(min-width: 1024px) 36vw, 100vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-12">
            <p className="font-mono text-[0.65rem] tracking-[0.18em] text-foreground/70 uppercase">
              Aeva / public interface
            </p>
            <h1 className="mt-3 font-display text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">
              Ask the work.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-foreground/75">
              Aeva is an AI portfolio assistant, not a real person. Her portrait
              is fictional. Her answers draw from approved public sources and
              cited live web results.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col px-5 py-8 sm:px-8 lg:px-12 lg:py-10 xl:px-16">
          <header className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-6">
            <div>
              <p className="font-mono text-[0.65rem] tracking-[0.16em] text-accent-warm uppercase">
                AI disclosure · sources before certainty
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                Talk with Aeva
              </h2>
            </div>
            <label className="text-sm text-muted">
              <span className="sr-only">Conversation mode</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as AevaMode)}
                className="rounded-full border border-border bg-surface px-4 py-2 text-foreground"
              >
                <option value="explore">Explore</option>
                <option value="technical">Technical walkthrough</option>
                <option value="recruiter">Recruiter evidence</option>
              </select>
            </label>
          </header>

          {mode === "recruiter" ? (
            <section className="border-b border-border py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor="aeva-job-description"
                  className="font-mono text-[0.65rem] tracking-[0.14em] text-muted uppercase"
                >
                  Optional role context
                </label>
                <Link
                  href="/resume"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent-warm"
                >
                  Open interactive résumé
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
              <textarea
                id="aeva-job-description"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                rows={3}
                minLength={40}
                maxLength={8000}
                placeholder="Paste a job description for role-fit analysis or a grounded interview."
                className="mt-3 w-full resize-y border border-border bg-surface p-3 text-sm leading-6 text-foreground outline-none focus:border-accent-warm"
              />
            </section>
          ) : null}

          <div className="flex-1 py-7" aria-busy={Boolean(status)}>
            {!messages.length ? (
              <div className="max-w-2xl">
                <p className="text-xl leading-8 text-foreground">
                  Hello — I’m Aeva. Ask me about Ace’s projects, writing,
                  knowledge, public profile, or a general topic from the live
                  web.
                </p>
                <div className="mt-7 border-t border-border">
                  {starters.map((starter, index) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => ask(starter)}
                      className="group flex w-full items-center justify-between gap-5 border-b border-border py-4 text-left text-sm text-foreground transition-colors hover:text-accent-warm"
                    >
                      <span>
                        <span className="mr-4 font-mono text-xs text-muted">
                          0{index + 1}
                        </span>
                        {starter}
                      </span>
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ol
                className="space-y-7"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Conversation with Aeva"
              >
                {messages.map((message, index) => (
                  <li
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-2xl border-r-2 border-accent-warm pr-5 text-right"
                        : "max-w-3xl border-l border-border pl-5"
                    }
                  >
                    <p className="font-mono text-[0.62rem] tracking-[0.14em] text-muted uppercase">
                      {message.role === "user" ? "You" : "Aeva"}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground sm:text-base">
                      {message.text}
                    </p>
                    {message.role === "assistant" && message.evidenceState ? (
                      <p className="mt-3 font-mono text-[0.6rem] tracking-[0.12em] text-muted uppercase">
                        {message.evidenceState.replace("-", " ")}
                      </p>
                    ) : null}
                    {message.citations?.length ? (
                      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                        {message.citations.map((citation) => (
                          <li key={citation.id}>
                            <a
                              href={citation.url}
                              target={
                                citation.url.startsWith("http")
                                  ? "_blank"
                                  : undefined
                              }
                              rel={
                                citation.url.startsWith("http")
                                  ? "noreferrer"
                                  : undefined
                              }
                              className="inline-flex items-center gap-1 text-xs font-medium text-accent-warm underline underline-offset-4"
                            >
                              {citation.title}
                              {citation.url.startsWith("http") ? (
                                <span className="sr-only">
                                  {" "}
                                  (opens in a new tab)
                                </span>
                              ) : null}
                              <ArrowUpRight
                                className="size-3"
                                aria-hidden="true"
                              />
                            </a>
                            {citation.updatedAt ? (
                              <span className="ml-2 text-[0.65rem] text-muted">
                                Updated {citation.updatedAt.slice(0, 10)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
            {status ? (
              <output
                aria-live="polite"
                className="mt-6 inline-flex items-center gap-2 text-sm text-muted"
              >
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                {status}
              </output>
            ) : null}
            {followUps.length && !ended ? (
              <div className="mt-7 flex flex-wrap gap-2">
                {followUps.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => ask(item)}
                    className="rounded-full border border-border px-4 py-2 text-left text-xs text-foreground hover:border-accent-warm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {ended ? (
            <section
              className="border-t border-border pt-6"
              aria-labelledby="aeva-feedback-heading"
            >
              <h2
                ref={feedbackHeadingRef}
                id="aeva-feedback-heading"
                tabIndex={-1}
                className="inline-flex items-center gap-2 font-medium text-foreground outline-none"
              >
                <Check className="size-4 text-accent-warm" aria-hidden="true" />
                Thank you for talking with Aeva.
              </h2>
              <p className="mt-2 text-sm text-muted">
                Would you like to leave brief feedback? I use it to make Aeva
                more useful for future visitors.
              </p>
              <form
                onSubmit={sendFeedback}
                className="mt-5 grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto]"
              >
                <label className="min-w-0">
                  <span className="sr-only">How helpful was Aeva?</span>
                  <select
                    name="rating"
                    required
                    className="min-h-12 w-full border border-border bg-surface px-3 py-3 text-sm text-foreground"
                  >
                    <option value="helpful">Helpful</option>
                    <option value="mixed">Mixed</option>
                    <option value="not-helpful">Not helpful</option>
                  </select>
                </label>
                <label className="min-w-0">
                  <span className="sr-only">Optional feedback note</span>
                  <input
                    name="message"
                    maxLength={1000}
                    placeholder="Optional note"
                    className="min-h-12 w-full border border-border bg-surface px-3 py-3 text-sm text-foreground"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-foreground px-5 py-3 text-sm font-semibold text-background"
                >
                  <ThumbsUp className="size-4" aria-hidden="true" />
                  Send
                </button>
              </form>
              <output
                aria-live="polite"
                className="mt-3 block min-h-5 text-sm text-muted"
              >
                {feedbackStatus}
              </output>
            </section>
          ) : (
            <footer className="border-t border-border pt-6">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  ask(question);
                }}
              >
                <label
                  htmlFor="aeva-question"
                  className="font-mono text-[0.65rem] tracking-[0.14em] text-muted uppercase"
                >
                  Your question
                </label>
                <div className="mt-2 flex gap-3 border-b border-foreground/30 pb-3 focus-within:border-accent-warm">
                  <textarea
                    ref={questionRef}
                    id="aeva-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Ask about a project, decision, skill, or general topic…"
                    aria-describedby="aeva-question-hint"
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        void ask(question);
                      }
                    }}
                    className="min-h-14 flex-1 resize-none bg-transparent text-base text-foreground outline-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    disabled={Boolean(status) || !question.trim()}
                    aria-label="Send question"
                    className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-40"
                  >
                    <Send className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <p
                  id="aeva-question-hint"
                  className="mt-2 text-xs text-muted-soft"
                >
                  Press Enter to send. Press Shift and Enter for a new line.
                </p>
                <VoiceControls
                  answer={
                    messages.findLast((message) => message.role === "assistant")
                      ?.text
                  }
                  disabled={Boolean(status)}
                  onTranscript={(transcript) => {
                    setQuestion((current) =>
                      current.trim()
                        ? `${current.trim()} ${transcript}`
                        : transcript,
                    );
                    questionRef.current?.focus();
                  }}
                />
              </form>
              <div className="mt-4 grid gap-3 text-xs leading-5 text-muted sm:grid-cols-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={allowWeb}
                    onChange={(event) => setAllowWeb(event.target.checked)}
                    className="mt-1 size-4 shrink-0"
                  />
                  <span>
                    Search the live web. Your question and relevant public
                    material will be sent to Google Gemini.
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={shareConversation}
                    onChange={(event) =>
                      setShareConversation(event.target.checked)
                    }
                    className="mt-1 size-4 shrink-0"
                  />
                  <span>
                    Share this conversation with Ace. Redacted text is encrypted
                    and retained for at most 30 days.
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={shareUnknownQuestion}
                    onChange={(event) =>
                      setShareUnknownQuestion(event.target.checked)
                    }
                    className="mt-1 size-4 shrink-0"
                  />
                  <span>
                    If unanswered, share a redacted anonymous sample. Otherwise
                    only an anonymous counter is kept.
                  </span>
                </label>
                <p>
                  Without consent, conversation history stays only in this page
                  and is not written to Neon. Aeva is intended for adults; an
                  under-18 visitor should use the contact route and complete its
                  safety declaration instead.
                </p>
              </div>
              <button
                type="button"
                onClick={endChat}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-muted hover:text-foreground"
              >
                <Square className="size-3" aria-hidden="true" />
                End chat
              </button>
            </footer>
          )}
        </div>
      </section>
    </main>
  );
}
