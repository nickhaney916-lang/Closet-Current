# Account-deletion orchestration — safe development checkpoint

Date: October 18, 2026. Draft PR #7 only.

**Status: server algorithm and synthetic tests implemented. Deletion NOT
activated or deployable as a working self-service feature. Absolutely no
real account, cloud file, database record or Auth user was deleted.**

## What the code provides

- `supabase/functions/account-delete/deletion-coordinator.mjs`: injected,
  server-only deletion orchestrator; no keys, HTTP calls or mutable production
  storage in this module. It rejects access unless `enabled === true`, the
  bearer token resolves to a verified account UUID, an **independent fresh
  password check** agrees on that UUID, and the user provides the exact phrase
  `DELETE MY ACCOUNT`. User-supplied `owner_id` / editable user metadata
  never decides the account being deleted.
- It **requires** `lockWrites(uid) === true` before modifying data. The
  future implementation must be durable, transactional and enforced across
  `closet_backups` backup writes and all Storage uploads. A JavaScript
  mutex would be insufficient. The write lock is NOT implemented in live
  Supabase, so the real endpoint must remain disabled. A failed partial
  deletion must keep the lock and proceed only through reviewed recovery.
- After the lock, enumerate the current user's private photo prefix in
  repeated <=100-object Storage pages; require a strict hash-named JPEG
  relative path, never accept another user prefix; remove via the **Storage
  API**, check the removal actually changed the listing, and verify zero
  remaining objects twice. A misleading HTTP-success/no-op or unexpected
  object name aborts deletion. Process can fail partway; never claim full
  deletion on exceptions.
- **Only after photos are confirmed gone:** delete the owner's private
  backup and verify absence, delete the Auth identity **last** and verify it
  no longer exists. No client-side privileged key or direct SQL delete of
  `storage.objects`. Existing JWTs can remain valid until expiry after
  Auth deletion, so production access control needs a session-ID liveness
  check for sensitive endpoints.
- The Deno `supabase/functions/account-delete/index.ts` entrypoint returns
  HTTP **503** regardless of environment variables or credentials. It does
  not import a service role key or call the coordinator. It is an explicit
  fail-closed placeholder in source control, **not an enabled deletion API**.

## Verification / scope

Synthetic Node tests cover over 200 photo objects with repeated page-1
deletions, exact owner scope, missing/forged confirmation, wrong password
identity, unavailable durable lock, malformed names, Storage failure,
Storage fake-success, backup deletion/verification failures, final Auth
verification failure, zero-photo accounts, disabled mode and no cross-
account deletes. All photo IDs, users and credentials are artificial. Full
application CI tests the module on the development branch.

## Mandatory remaining release blockers

1. Implement and independently audit a **durable server-enforced deletion
   state/lock** across backup RPC, Storage insert/update, restore and all
   device sessions; handle an in-flight upload during lock creation.
2. Implement real server adapters for independently verifying the bearer
   JWT and fresh password, listing/removing Storage objects, deleting
   backup, verifying no rows, removing Auth users, auditing no access after
   deletion, and handling 401/403/404/retries. No service-role secret may
   enter `public/`, browser bundles, logs or GitHub Actions artifacts.
3. Ensure terminal/retry behavior under partial failure, queue and photo
   retention, interruption, multiple simultaneously signed-in devices,
   malformed/unexpected files and old signed JWTs. Verify on separately
   authorized disposable test accounts; test cross-account denial and
   review all RLS and storage policies. Avoid accidental disclosure of
   password, bearer or personal photo data in diagnostics.
4. Operator must approve final user-facing privacy and terms, age/
   guardian eligibility, support/deletion request channel, backup
   retention and deletion turnaround. Only then add a destructive
   account-deletion control with explicit warnings/confirmation.
5. Obtain explicit owner approval before any database migration, Edge
   Function deployment/activation, deleting actual test accounts,
   emailing real users, merging production, or enabling paid services.

**Sources:** Supabase current Auth management:
https://supabase.com/docs/guides/auth/managing-user-data
and Storage deletion:
https://supabase.com/docs/guides/storage/management/delete-objects .


## October 18 verified DB lock candidate — still unapplied

A staged candidate lives in
`supabase/design/account-deletion-write-barrier.DRAFT.sql`.
It has **not** been made into an approved migration or executed on the
live Supabase project. Its internal server-only tombstone and
transaction-scoped owner locks protect backup and Storage metadata
INSERT/UPDATE, and keep a lock after Auth deletion so old JWTs do not
recreate a closet.

A disposable PostgreSQL 16 CI runner executes a real SQL smoke test and
a concurrent two-session upload/deletion race. [Run 39180835112](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39180835112)
passed: 12 coordinator tests, schema policy test, and live disposable-PG
race all green. This is **not** sufficient to claim end-to-end deletion
or real Supabase Storage compatibility. Supabase Storage may perform
multi-stage object uploads; verify object-byte orphan behavior and trigger
compatibility with the actual Storage API on a disposable project before
approving schema changes. The deployed deletion entrypoint is still
disabled with HTTP 503. No real data or account was changed.

