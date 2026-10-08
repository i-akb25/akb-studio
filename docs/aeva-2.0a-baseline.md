# Aeva 2.0A baseline

- Base commit: `ff59db31dd6d20b4df6cc12df16609d993c1d32c`
- Working branch: `feat/aeva-2-0a-security-foundation`
- Public route retained: `/aeva`
- Existing homepage Aeva preview retained.
- Existing navigation, homepage order, CTA, footer and theme system are outside this change.

## Preserved Aeva assets

| Asset | SHA-256 |
| --- | --- |
| `apps/web/public/images/aeva/aeva-identity.webp` | `dba5f50a587f4235b5bd2276053654eb368832e7bf23f61db48651cbd4281a8c` |
| `apps/web/public/images/aeva/aeva-portrait.webp` | `1bdfa2c5ca82597698a497f6f4e9c410991d99e526264206c0a5046e036cc5a8` |

Neither asset is changed, regenerated, renamed or deleted by Aeva 2.0A.

## Environment contract

All pre-existing names remain valid and unchanged. Aeva 2.0A adds only optional fail-closed controls:

- `AEVA_PUBLIC_ENABLED`
- `AEVA_PRIVATE_ENABLED`
- `AEVA_DOCUMENT_INGESTION_ENABLED`
- `AEVA_ACTIONS_ENABLED`
- `AEVA_EXTERNAL_ACTIONS_ENABLED`
- `AEVA_MONITOR_ENABLED`
- `AEVA_SOCIAL_ENABLED`
- `AEVA_EMAIL_ENABLED`
- `AEVA_VOICE_ENABLED`
- `AEVA_MAX_RETRIEVAL_CHUNKS`
- `AEVA_MAX_CONVERSATION_TURNS`
- `AEVA_REQUEST_TIMEOUT_MS`

No environment value is recorded in this baseline.

## Verification notes

- `/aeva` renders successfully through the local development server.
- Automated lint, typecheck, 93 tests, link checks, secret scanning and the existing release contract pass.
- The production build cannot be completed in the isolated verification environment because the pre-existing `next/font` configuration downloads Inter, JetBrains Mono and Space Grotesk from `fonts.googleapis.com`, which is unreachable here. No font or public-design change was made to bypass that unrelated restriction.

