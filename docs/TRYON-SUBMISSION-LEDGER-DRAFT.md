# Undeployed try-on submission ledger

Code checkpoint: `2936c61ef604163ee112fbd0558136dbbc8e4f58`, draft PR #13.
This is staged server infrastructure, not an enabled service. The actual HTTP
entrypoint does not import the coordinator. No hosted migration or API key was
created. Chained paid inference remains hard-disabled.

## What the draft enforces when invoked with a trusted server adapter

- Reserve a durable request row before the provider POST. All reservations use
  a transaction-scoped global advisory lock, so independent workers cannot
  bypass either the per-owner or global rolling 24-hour job limit.
- Limits default to disabled and zero. The service role can read limits but
  cannot change them. Each provider pass consumes one reservation; these are
  job-count controls, not a currency budget or an external provider spend cap.
  A first pass can consume quota before a later pass is rejected. Whole-outfit
  budget reservation and the desired partial-outfit UX still require review.
- Owner + request UUID is unique. A continuation also has a unique owner +
  predecessor provider-job ID, so inventing another request UUID cannot submit
  the same second stage again. Reuse requires the same complete provider-payload
  SHA-256, stage, model figure, category and parent. Different inputs conflict.
- The predecessor must be an accepted same-owner first-stage top/bottom with
  the same figure and opposite garment category. The caller must additionally
  authenticate the user, verify the signed predecessor, check provider completion
  and obtain its intermediate image before calling the coordinator.
- A recorded accepted replay returns the same provider ID. A reserved row from
  a crashed worker stays on hold. An ambiguous provider or acceptance-write
  failure stays reserved/unknown; no automatic expiry, retry or refund occurs.
- If acceptance committed but its response was lost, marking unknown cannot
  overwrite accepted state. A subsequent replay reuses the committed job.
- Ledger rows contain metadata and a payload digest, not clothing photos,
  tokens or provider keys. Private tables use RLS and explicit service-only
  grants. Public RPCs use SECURITY INVOKER, empty search paths and revoked
  anon/authenticated/PUBLIC execute permissions.

## Verified evidence and limits

`tests/ai-tryon-submission.test.mjs` covers disabled defaults, provider ordering,
full-payload fingerprinting, replay reuse, invalid input, unavailable storage,
quota/conflict/hold responses, ambiguous provider acceptance, and SDK-shaped
RPC error propagation. The coordinator never initializes a provider or SDK.

`scripts/test-tryon-ledger-postgres.mjs` refuses any PGHOST other than 127.0.0.1
and any database name other than closet_tryon_test. CI creates and destroys a
fresh PostgreSQL 16 service, roles and synthetic records. It checks concurrent
per-owner/global quotas, concurrent identical starts, continuation replay under
different request IDs, role denial, owner isolation, unknown outcomes, and
commit-response loss. The coordinator runs against real SQL through an
SDK-shaped adapter with an injected simulated provider. This is NOT an actual
Supabase SDK, hosted project, physical phone or live AI fidelity test.

## Still required before activation

Reviewed HTTP integration with stable client request IDs; authentic Supabase
RPC/SDK and privilege compatibility in an approved isolated environment;
reviewed quotas and full-outfit budget policy; durable operator reconciliation
for unknown jobs (never blind retry); metadata retention/cleanup that preserves
idempotency; a provider-enforced currency cap; licensed standard model assets;
privacy/retention disclosures and explicit consent; owner financial approval;
protected staging; actual two-stage garment fidelity; and physical Android/iPhone
acceptance evidence. The internal global lock is intended for a small capped
pilot; it has not been load-tested or benchmarked as a public service.

Do not apply the DRAFT SQL to a hosted project or enable the coordinator based
on passing CI. SQL execution happened only in the disposable CI database.
