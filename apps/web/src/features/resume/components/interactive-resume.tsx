"use client";

import { ArrowUpRight, Download, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { RoleFitAnalysis } from "@/features/recruiter/model";
import type { ResumeProfile } from "../data/resume-profile";

export function InteractiveResume({ profile }: { profile: ResumeProfile }) {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<RoleFitAnalysis>();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus("Comparing published evidence…");
    setAnalysis(undefined);
    try {
      const response = await fetch("/api/recruiter/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      if (!response.ok) throw new Error("analysis_unavailable");
      const payload = (await response.json()) as {
        ok: true;
        analysis: RoleFitAnalysis;
      };
      setAnalysis(payload.analysis);
      setStatus("");
    } catch {
      setStatus("The comparison is temporarily unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const prioritizedExperiences = analysis?.strengths.length
    ? [...profile.experiences].sort((left, right) => {
        const terms = analysis.strengths.map((item) =>
          item.requirement.toLocaleLowerCase("en-IN"),
        );
        const score = (value: (typeof profile.experiences)[number]) =>
          terms.filter((term) =>
            `${value.focus} ${value.disciplines.join(" ")}`
              .toLocaleLowerCase("en-IN")
              .includes(term),
          ).length;
        return score(right) - score(left);
      })
    : profile.experiences;

  return (
    <main className="bg-background text-foreground print:bg-white print:text-black">
      <header className="mx-auto grid max-w-7xl gap-10 border-b border-border px-5 py-16 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-12 lg:py-24 print:block print:py-8">
        <div>
          <p className="font-mono text-xs tracking-[0.16em] text-accent-warm uppercase">
            Verified professional record / adaptive view
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl leading-[0.96] font-semibold tracking-[-0.055em] sm:text-7xl">
            {profile.name}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-foreground/76">
            {profile.headline}
          </p>
          <p className="mt-5 max-w-2xl leading-7 text-muted">
            {profile.summary}
          </p>
        </div>
        <div className="self-end border-l border-border pl-6 print:border-0 print:pl-0">
          <p className="font-mono text-xs text-muted uppercase">
            Evidence rule
          </p>
          <p className="mt-3 text-sm leading-6 text-foreground/72">
            A supplied role can change ordering and emphasis. It cannot add a
            skill, claim or job that is absent from the published portfolio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <a
              href={profile.canonicalPdf}
              download
              className="inline-flex items-center gap-2 bg-foreground px-4 py-3 text-sm font-semibold text-background"
            >
              <Download className="size-4" aria-hidden="true" />
              Download resume PDF
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12 print:hidden">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
            Recruiter instrument / 01
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
            Reorder the record around a real role.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            Paste responsibilities and requirements. The comparison remains in
            this page request and is not added to the portfolio or CRM.
          </p>
        </div>
        <form onSubmit={analyze}>
          <label htmlFor="job-description" className="text-sm font-medium">
            Job description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            minLength={40}
            maxLength={8000}
            required
            rows={9}
            placeholder="Backend Engineer&#10;Required: Node.js, TypeScript, PostgreSQL, REST APIs, testing…"
            className="mt-3 w-full resize-y border border-border bg-surface p-4 text-sm leading-6 outline-none focus:border-accent-warm"
          />
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-xs text-muted">
              {jobDescription.length.toLocaleString("en-IN")} / 8,000
            </span>
            <button
              type="submit"
              disabled={jobDescription.trim().length < 40 || busy}
              className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-sm font-semibold text-background disabled:opacity-45"
            >
              <Search className="size-4" aria-hidden="true" />
              Compare evidence
            </button>
          </div>
          <p className="mt-3 min-h-6 text-sm text-muted" aria-live="polite">
            {status}
          </p>
        </form>
      </section>

      {analysis ? (
        <section className="mx-auto max-w-7xl border-y border-border px-5 py-12 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="font-mono text-xs tracking-[0.14em] text-accent-warm uppercase">
                Evidence brief / {analysis.roleTitle}
              </p>
              <p className="mt-4 text-xl leading-8">{analysis.summary}</p>
              <p className="mt-5 text-sm text-muted">
                Generated{" "}
                {new Date(analysis.generatedAt).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold tracking-[0.08em] uppercase">
                  Published strengths
                </h2>
                <ol className="mt-4 divide-y divide-border border-y border-border">
                  {analysis.strengths.map((strength) => (
                    <li key={strength.requirement} className="py-4">
                      <strong>{strength.requirement}</strong>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {strength.evidence
                          .map((item) => item.title)
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-[0.08em] uppercase">
                  Honest gaps
                </h2>
                {analysis.gaps.length ? (
                  <ul className="mt-4 divide-y divide-border border-y border-border">
                    {analysis.gaps.map((gap) => (
                      <li key={gap} className="py-4 text-sm">
                        {gap} has no direct published evidence.
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-muted">
                    No gap was found among the explicit requirements detected.
                    This is not proof of complete role suitability.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-12">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
            Professional route / 02
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
            Experience, ordered by verified relevance.
          </h2>
        </div>
        <ol className="border-t border-border">
          {prioritizedExperiences.length ? (
            prioritizedExperiences.map((item) => (
              <li
                key={item.id}
                className="grid gap-3 border-b border-border py-6 sm:grid-cols-[9rem_1fr]"
              >
                <time className="font-mono text-xs text-muted">
                  {item.period}
                </time>
                <div>
                  <h3 className="text-xl font-semibold">{item.role}</h3>
                  <p className="mt-1 text-sm font-medium text-accent-warm">
                    {item.organization} · {item.location}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                    {item.focus}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="border-b border-border py-6 text-sm text-muted">
              Add the ignored local resume source documented in README.md to
              populate professional experience.
            </li>
          )}
        </ol>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 border-t border-border px-5 py-16 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-12">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">
            Evidence / 03
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
            Open the work behind the claim.
          </h2>
        </div>
        <div>
          <div className="border-y border-border py-5">
            <p className="text-lg font-semibold">
              {profile.education.qualification}
            </p>
            <p className="mt-1 text-sm text-muted">
              {profile.education.institution}
              {profile.education.period ? ` · ${profile.education.period}` : ""}
            </p>
          </div>
          {analysis?.relevantEvidence.length ? (
            <ul className="divide-y divide-border">
              {analysis.relevantEvidence.map((item) => (
                <li key={item.id} className="py-5">
                  <Link
                    href={item.url}
                    className="inline-flex items-center gap-2 font-semibold text-accent-warm"
                  >
                    {item.title}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                    {item.excerpt}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm leading-6 text-muted print:hidden">
              Run a role comparison to attach the most relevant published
              projects and case-study evidence here.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
