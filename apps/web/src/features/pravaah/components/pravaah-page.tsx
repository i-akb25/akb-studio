import {
  ArrowDownRight,
  ArrowUpRight,
  MessageCircle,
  Radio,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  SocialLogo,
  type SocialPlatform,
} from "@/components/brand/social-logo";
import type { FeatureItem } from "@/features/pravaah/model";
import { featureSourceLabel } from "@/features/pravaah/model";
import { PravaahNetworkAnimation } from "./pravaah-network-animation";
import { PravaahStream } from "./pravaah-stream";

type PravaahPageProps = {
  signals: readonly FeatureItem[];
  anonymousNoteUrl?: string;
};

const PROFILE_SOURCES: ReadonlyArray<{
  label: string;
  handle: string;
  href: string;
  platform: SocialPlatform;
}> = [
  {
    label: "LinkedIn",
    handle: "anuragkumarbharti",
    href: "https://www.linkedin.com/in/anuragkumarbharti",
    platform: "linkedin",
  },
  {
    label: "X",
    handle: "@i_official_akb",
    href: "https://x.com/i_official_akb",
    platform: "x",
  },
  {
    label: "GitHub",
    handle: "i-akb25",
    href: "https://github.com/i-akb25",
    platform: "github",
  },
] as const;

function formatDate(value: string | undefined): string | undefined {
  if (!value) return undefined;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function SignalActions({ item }: { item: FeatureItem }) {
  return (
    <div className="pravaah-links">
      {item.internalPath ? (
        <Link href={item.internalPath}>Open context</Link>
      ) : null}
      {item.canonicalUrl ? (
        <a href={item.canonicalUrl} rel="noreferrer" target="_blank">
          View original
          <ArrowUpRight aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

export function PravaahPage({ signals, anonymousNoteUrl }: PravaahPageProps) {
  const lead = signals.find((item) => item.pinned) ?? signals[0];
  const pinned = signals
    .filter((item) => item.pinned && item.id !== lead?.id)
    .slice(0, 4);
  const authoredCount = signals.filter(
    (item) => item.relationship === "by-akb",
  ).length;
  const coverageCount = signals.filter(
    (item) => item.relationship === "about-akb",
  ).length;
  const sourceCount = new Set(signals.map((item) => item.source)).size;

  return (
    <main className="pravaah">
      <header className="pravaah-hero">
        <div className="pravaah-hero__copy">
          <p className="pravaah-kicker">PRAVAAH / PUBLIC SIGNAL</p>
          <h1 id="pravaah-title">
            Ideas in
            <span className="pravaah-hero__accent">Motion.</span>
          </h1>
          <p className="pravaah-hero__body">
            A living record of what I publish, what I ship, and what others
            write about my work across the public web.
          </p>
          <a className="pravaah-hero__jump" href="#signal-archive">
            Explore the archive
            <ArrowDownRight aria-hidden="true" />
          </a>
        </div>

        <PravaahNetworkAnimation />

        <dl className="pravaah-hero__measure">
          <div>
            <dt>Signals</dt>
            <dd>{signals.length}</dd>
          </div>
          <div>
            <dt>Published by me</dt>
            <dd>{authoredCount}</dd>
          </div>
          <div>
            <dt>Written about me</dt>
            <dd>{coverageCount}</dd>
          </div>
          <div>
            <dt>Sources</dt>
            <dd>{sourceCount}</dd>
          </div>
        </dl>
      </header>

      <nav className="pravaah-channel" aria-label="Content in Pravaah">
        <span>LINKEDIN</span>
        <i aria-hidden="true" />
        <span>X</span>
        <i aria-hidden="true" />
        <span>GITHUB</span>
        <i aria-hidden="true" />
        <span>PUBLICATIONS</span>
        <i aria-hidden="true" />
        <span>NEWS &amp; MENTIONS</span>
        <i aria-hidden="true" />
        <span>ANNOUNCEMENTS</span>
      </nav>

      {lead ? (
        <>
          <section
            className="pravaah-feature"
            aria-labelledby="current-signal-title"
          >
            <header>
              <p className="pravaah-kicker">CURRENT SIGNAL</p>
              <span>{formatDate(lead.publishedAt)}</span>
            </header>
            <article>
              <div className="pravaah-feature__copy">
                <p className="pravaah-feature__source">
                  {featureSourceLabel(lead.source, lead.sourceName)} /{" "}
                  {lead.type}
                </p>
                <h2 id="current-signal-title">{lead.title}</h2>
                <p>{lead.excerpt}</p>
                <SignalActions item={lead} />
              </div>
              {lead.media ? (
                <div className="pravaah-feature__media">
                  <Image
                    alt={lead.media.alt}
                    fill
                    priority
                    sizes="(max-width: 800px) 100vw, 55vw"
                    src={lead.media.src}
                  />
                </div>
              ) : (
                <div className="pravaah-feature__trace" aria-hidden="true">
                  <Radio />
                  <span>LIVE / CURATED / PUBLIC</span>
                </div>
              )}
            </article>
          </section>
          <div id="signal-archive">
            <PravaahStream items={signals} />
          </div>
        </>
      ) : (
        <section className="pravaah-source-desk" id="signal-archive">
          <div className="pravaah-source-desk__intro">
            <Radio aria-hidden="true" />
            <div>
              <p className="pravaah-kicker">SOURCE DESK / CURATION ACTIVE</p>
              <h2>The channels are connected. The archive stays deliberate.</h2>
            </div>
            <p>
              These are the verified public profiles feeding Pravaah. Posts,
              releases and mentions appear here only after review, so the page
              can grow to hundreds of records without becoming another noisy
              social wall.
            </p>
          </div>
          <ol className="pravaah-source-desk__profiles">
            {PROFILE_SOURCES.map((profile, index) => (
              <li key={profile.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <SocialLogo platform={profile.platform} className="size-5" />
                <div>
                  <p>{profile.label}</p>
                  <strong>{profile.handle}</strong>
                </div>
                <a href={profile.href} rel="noreferrer" target="_blank">
                  Open profile
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {pinned.length || anonymousNoteUrl ? (
        <section className="pravaah-utility">
          {pinned.length ? (
            <div className="pravaah-pinned">
              <p className="pravaah-kicker">PINNED HIGHLIGHTS</p>
              <ol>
                {pinned.map((item) => (
                  <li key={item.id}>
                    <div>
                      <span>
                        {featureSourceLabel(item.source, item.sourceName)}
                      </span>
                      <h3>{item.title}</h3>
                    </div>
                    <SignalActions item={item} />
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {anonymousNoteUrl ? (
            <aside className="pravaah-note">
              <MessageCircle aria-hidden="true" />
              <p className="pravaah-kicker">ANONYMOUS / EXTERNAL CHANNEL</p>
              <h2>Leave a note without leaving a name.</h2>
              <p>
                Opens an independent third-party service. It is not hosted or
                controlled by AKB Studio.
              </p>
              <a href={anonymousNoteUrl} rel="noreferrer" target="_blank">
                Leave an anonymous note
                <ArrowUpRight aria-hidden="true" />
              </a>
            </aside>
          ) : null}
        </section>
      ) : null}

      <footer className="pravaah-outro">
        <div>
          <p className="pravaah-kicker">FOLLOW THE LONGER THREADS</p>
          <h2>Signals are the beginning, not the whole story.</h2>
        </div>
        <nav aria-label="Continue from Pravaah">
          <Link href="/projects">Projects</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/knowledge">Knowledge</Link>
        </nav>
      </footer>
    </main>
  );
}
