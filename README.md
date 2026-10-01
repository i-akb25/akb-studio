# AKB Studio

AKB Studio is my personal engineering portfolio and publishing platform. It brings together software engineering, electrical systems, automation, robotics, applied AI, project case studies, field notes, and technical knowledge in one authored experience.

The visual direction combines modern engineering, journeys and field observation, and restrained references to Ancient India. The platform is built as a working system rather than a template portfolio.

## Release status

AKB Studio V1 is in final production-release verification. Provider configuration, deployment checks, production smoke testing, and the final release tag are completed only through the documented go-live gate.

## Public experience

- Project registry with detailed engineering case studies
- Journal and technical Knowledge archive
- About page and engineering journey
- Daily Sanskrit Reflection
- Pravaah, a curated public signal stream
- Aeva, an evidence-grounded portfolio guide
- Contact, availability, resume, consent, and privacy-request workflows
- Accessible themes, reduced-motion behavior, responsive layouts, and offline support

## Private Studio

The protected Studio supports owner-only content operations, media management, publishing, contact handling, Vartalap moderation, analytics, operational health, and audit records. Authentication uses Better Auth, mandatory TOTP, database-backed sessions, and server-side authorization.

Private contact records, Admin data, credentials, provider secrets, and unpublished material are not public retrieval sources for Aeva.

## Technology

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4
- Motion, React Three Fiber, MDX, and server-first rendering
- Neon PostgreSQL and Prisma
- Better Auth with owner-only access and TOTP
- Cloudinary for managed public media
- Gmail API for contact delivery
- Google Sheets and Apps Script for publishing workflows
- Git-backed public-content fallbacks
- Vercel deployment

## Repository layout

```text
apps/web/                         Next.js application
content-repo/                     versioned public-content manifests
integrations/google-apps-script/  Google Sheets workflow source
prisma/                           schema and forward-only migrations
scripts/                          quality, backup, and recovery commands
```

Private audit records, dormant implementation references, local notes, credentials, and unpublished assets are intentionally excluded from this public repository.

## Local setup

Requirements:

- Node.js 22 or a compatible supported release
- pnpm 11.20.0
- PostgreSQL connection for database-backed features

```bash
pnpm install --frozen-lockfile
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
pnpm db:generate
pnpm dev
```

Replace required placeholders only in local environment files. Never commit `.env`, `.env.local`, provider credentials, access tokens, database URLs, signing secrets, encryption keys, OAuth credentials, or recovery codes.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm db:validate
pnpm quality:links
pnpm quality:secrets
pnpm quality:release
pnpm audit --prod --audit-level high
pnpm --filter @akb-studio/web exec next build --webpack
pnpm --filter @akb-studio/web performance:budget
```

Some integration, accessibility, browser, and production checks require configured test providers or a deployed preview. A skipped check is not treated as a passed check.

## Production deployment

1. Configure the production Neon database and review migrations.
2. Add production environment variables through Vercel without exposing values.
3. Apply only approved forward migrations.
4. Configure Better Auth, TOTP, Cloudinary, Gmail, Turnstile, Google Apps Script, private content sources, Aeva, analytics, and monitoring.
5. Verify required production media and resume assets.
6. Run the complete release gate and inspect the deployment preview.
7. Verify the production domain, HTTPS, security headers, canonical URLs, social previews, sitemap, robots policy, and Search Console ownership.
8. Run production smoke tests before creating the V1 release tag.

Do not run destructive database operations against production. Do not deploy from an unverified branch or describe skipped checks as passed.

## Security and privacy

The application uses server-side validation, authorization, origin checks, rate limiting, honeypots, upload restrictions, security headers, log redaction, consent records, retention controls, and provider fallbacks. Secrets remain server-side.

Report security concerns privately to `akbstudioofficial@gmail.com`. Do not include credentials, private visitor data, or working exploit details in a public issue.

## Author

**Anurag Kumar Bharti**  
Software Engineer · Electrical & Automation Engineer  
🗺️ Bihar, India

- [GitHub](https://github.com/i-akb25)
- [LinkedIn](https://www.linkedin.com/in/anuragkumarbharti)
- [X](https://x.com/i_official_akb)

## License

AKB Studio is publicly viewable but is not open-source software. The source code, visual identity, written content, media, project material, and brand assets are protected under the terms in [LICENSE.md](LICENSE.md). Third-party packages and assets remain subject to their respective licenses.
