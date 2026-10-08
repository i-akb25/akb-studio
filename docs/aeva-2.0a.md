# Aeva 2.0A: Security & Reliability Foundation

## Invariants

- Public Aeva receives only published, explicitly approved, public sources.
- The server enforces classification and consumer permissions before prompt construction.
- Admin records, contact submissions, authentication data, operational logs, private documents, secrets and environment values are never retrieval sources.
- Public and future private Aeva do not share sessions, indexes, credentials, prompts, caches or tool permissions.
- Source text and conversation history are untrusted context, never instructions or evidence.
- Raw public conversations are not stored unless the visitor explicitly opts in.
- A visitor name is session-only context and never authentication.
- External writes remain disabled in Aeva 2.0A.

## Public request boundary

1. Validate origin, body size and schema.
2. Apply address and provider quotas.
3. Classify intent and resolve vague follow-ups from recent session context.
4. Retrieve at most four small, deduplicated chunks.
5. Reject every chunk that is not public, published, Aeva-approved and allowed for `public_aeva`.
6. Generate a bounded structured answer.
7. Accept citations only for source IDs the provider reports using.
8. Reject unsafe output and fall back to deterministic public search.
9. Attach minimal feedback to the individual response.

## Data retention

| Record | Default |
| --- | --- |
| Raw public conversation | Browser session only |
| Explicitly shared conversation | Redacted, encrypted, maximum 30 days |
| Knowledge-gap text | Not retained without explicit opt-in |
| Per-answer feedback | Response ID, reason, optional 500-character comment, policy version |
| Secrets and environment variables | Never stored by Aeva |

## Operational controls

`AEVA_PUBLIC_ENABLED` is the public kill switch. All new capability switches fail closed when absent. `AEVA_EXTERNAL_ACTIONS_ENABLED=false` remains the global write-action boundary for future releases.

## Incident response

For a suspected retrieval-boundary violation: disable `AEVA_PUBLIC_ENABLED`, preserve minimal audit evidence, identify the source ID and content hash, remove or reclassify the source, rotate any exposed credential, run the full Aeva evaluation suite, and re-enable only after every critical privacy test passes.

## 2.0A release gate

- Zero private or secret retrieval in the evaluation corpus.
- Every factual personal claim is traceable to approved provenance.
- No full stored paragraph is inserted into a provider request.
- Citations are limited to used sources.
- Long conversations cannot resize the portrait panel.
- Every assistant response has compact feedback.
- Existing assets, public routes and environment-variable names remain intact.
- Typecheck, test, build and visual verification pass.

