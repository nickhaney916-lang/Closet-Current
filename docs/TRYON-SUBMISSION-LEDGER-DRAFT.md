# Undeployed HTTP try-on and prepaid submission ledger

Current code: `b7e4524be0622ad4b593037bc0ed53a20f1199e0`, draft PR #13.
The Deno entrypoint now constructs the HTTP handler, RPC transport and durable
submission coordinator. BOTH deployment approval constants remain false:
`RESERVED_PAID_INFERENCE_APPROVED=false` and
`CHAINED_PAID_INFERENCE_APPROVED=false`. No environment flag or request field
can override them. No endpoint, SQL migration or hosted service was deployed.

## Request flow and budget

- The handler checks allowed origin/method, verifies the user's bearer token
  against Supabase Auth, and derives owner identity from the verified user.
  It bounds actual request bytes to 8 MB even without Content-Length. A body
  cannot choose an owner, bypass approval or substitute its own model photo.
- The browser decodes BOTH selected garment crops before starting either pass.
  The first request declares one/two planned passes and a SHA-256 digest of
  the selected second crop. The server hashes the actual second crop again;
  the ledger rejects a substituted crop, owner, figure, category or parent.
- A root reserves the full one/two-pass quota atomically BEFORE the first
  provider POST. A continuation spends its prepaid slot with zero additional
  units, so it can finish at the quota cap. A two-pass start with only one
  unit available is rejected before any paid job. Unknown or unused slots
  retain their budget; no automatic refund is assumed.
- Reservations serialize with a global transaction-scoped advisory lock;
  quotas apply to held units in a rolling 24-hour window. They are job-count
  controls, not a currency budget or external provider spend cap. Continuation
  also requires an unexpired reservation and a completed signed first job.
- Requests bind UUIDs to the full provider-payload digest plus budget metadata.
  Owner/request UUID is unique; owner/predecessor is unique for continuations,
  so a fresh second-stage UUID cannot bypass replay protection. Accepted
  replays reuse the recorded job; reserved/unknown outcomes remain on hold.
- If acceptance committed but its response was lost, marking unknown cannot
  erase accepted state. Replaying the original request can recover its job.
  No automatic provider retry, reservation expiry or refund occurs.

## Browser recovery and data protection

The last rendered-input digest and two random request IDs are saved in
sessionStorage, with an in-memory fallback when storage is unavailable. An
identical retry/reload can reuse those IDs while that record is retained.
Only hashes/IDs are stored; source pixels are hashed individually to avoid
expanding all closet photographs into one large JSON string. Unsupported
shoe/layer changes reuse the provider request identity. Clothing/model/account
changes invalidate the visible image and never silently launch a job.

This is not universal recovery after cleared storage, a lost tab/session,
storage denial, or switching to another recorded attempt. Do not claim those
cases can safely create a new generation automatically. Requests time out
without automatic retry; network abortion does NOT cancel an accepted job.
A deliberate new paid generation/recovery UX and operator reconciliation
remain release requirements.

Ledger rows contain metadata/digests, not clothing pixels, signing tokens or
provider keys. Private tables use RLS and service-only grants. Public RPCs
use SECURITY INVOKER with empty search paths; anon/authenticated/PUBLIC execute
is revoked. Limits default to disabled/zero and cannot be changed by the service
role. SQL remains a DRAFT for an empty disposable database, not an upgrade
migration for an existing deployment.

## Verification boundaries

- Node tests exercise the real Request/Response handler, real HMAC signing,
  auth-derived ownership, tampering/cross-owner rejection, disabled approval,
  oversized bodies, stable job replay, and sanitized provider/transport errors.
- Disposable PostgreSQL 16 tests run true concurrent reservations: per-owner
  and global caps, prepaid pair capacity, second-crop binding, replay with
  different IDs, denied browser roles, unknown jobs and lost acknowledgments.
- A pinned local Supabase CLI 2.121.0 Docker stack plus actual supabase-js
  2.75.0 tests real local Auth/sign-in, SDK RPC, ordinary-client denial, server
  REST RPC transport, real loopback HTTP requests, full-budget reservation,
  prepaid continuation at global cap, cross-account rejection and timeout
  recovery. Temporary identities and containers are destroyed afterward.
- FASHN requests are intercepted before network access. Every provider result
  is synthetic. Linux Chromium Pixel and WebKit iPhone profiles are emulation,
  not physical Android/iPhone or real model quality evidence. The local HTTP
  adapter tests the shared handler; it does not prove hosted Edge gateway,
  deployment settings or actual Deno network behavior.

## Remaining activation gates

No-cost local integration is distinct from approving a hosted deployment.
Still required: reviewed hosted configuration/SQL migration and privileges;
operator reconciliation and metadata retention that preserve idempotency;
reviewed pilot quotas and new-generation consent/recovery UX; provider-enforced
currency cap; licensed standard model assets; privacy/retention disclosures and
explicit consent; owner financial approval; protected staging; actual two-pass
fidelity review of BOTH garments; physical Android/iPhone acceptance evidence.
The global lock targets a small capped pilot and is not publicly load-tested.

Official contract references reviewed October 19, 2026:
[RPC](https://supabase.com/docs/reference/javascript/rpc),
[JWT verification](https://supabase.com/docs/guides/auth/jwts), and
[function privileges](https://supabase.com/docs/guides/database/functions).
