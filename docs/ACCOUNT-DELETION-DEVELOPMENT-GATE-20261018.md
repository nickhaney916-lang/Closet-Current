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



## Server-adapter and RPC permission checkpoint — October 18, 2026

The undeployed draft SQL includes a `SECURITY INVOKER`
`public.begin_closet_account_deletion(uuid)` wrapper with EXECUTE
only for `service_role`. Disposable PostgreSQL tests verify
authenticated and anon cannot execute it and service-role execution
serializes with photo and backup metadata writes. The server-only
`supabase/functions/account-delete/supabase-adapters.mjs` now supplies
mock-tested Auth.getUser, independent password proof, Storage .list/.remove,
backup deletion/verification and Auth.admin.deleteUser/getUserById
operations. The password client **must** be a separate server-only client
with `persistSession:false`. Do not put administrative credentials into
public bundles; the adapter stores none.

[Verification run 39182636169](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39182636169):
22 focused tests passed. These tests simulate Supabase SDK responses and
use disposable bare PostgreSQL for locking; they are **not proof of real
Supabase Storage API upload/cleanup compatibility**. The real Deno
entrypoint still responds 503 and imports nothing privileged.
No account deletion can run in production. Before activation, use a
disposable complete Supabase environment and independent security
review, including verified active-session behavior and final irreversible
confirmation. Passwordless members need an approved recent-authentication
alternative; currently only password verification is modeled.



## Local Supabase Storage/Auth HTTP integration — October 18 follow-up

The first true local Supabase integration reached private Storage and exposed
a subtle **RLS-filtered HTTP 200 / empty-array response** to a foreign
user's delete attempt. It was not a successful deletion; the updated
test independently confirms the actual owner's photo remains in Storage.

The [successful isolated GitHub Actions run
39186780893](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39186780893)
then verified real local Supabase GoTrue/Auth and Storage HTTP semantics,
per-user isolation, service-role-only RPC, locked uploads/backup changes,
Storage photo removal, backup and Auth deletion, and old-token lock
persistence. It also interrupted a second disposable account after
removing one of two photos and successfully retried cleanup without
lifting the lock or damaging an unrelated account.

**This closes the local Auth/Storage behavior verification milestone**, not
the customer-ready account-deletion feature. The HTTP entrypoint remains
hard-disabled (503). Operator-approved terms/retention, passwordless
reauthentication, service-client lifecycle, hosted configuration and key
audit, careful migration planning and rollback, actual device testing,
reliable recovery worker/support process and explicit launch approval
remain prerequisites. No remote project, production user or customer
photo was modified.

## Verified real Supabase JS SDK account-delete adapters — October 18 follow-up

[Isolated Supabase integration run 39188315048](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39188315048)
used pinned actual `@supabase/supabase-js@2.75.0`, not an SDK mock,
with a temporary local Supabase Auth, Storage, and PostgREST stack.
It tested two disposable password-backed users, a wrong-password denial,
test-only activated coordinator, photo Storage removal and verification,
backup deletion, Auth deletion last, old-token write rejection, and
preservation of another account's objects. The earlier direct REST tests
also passed, including interrupted cleanup recovery. All temporary
containers were destroyed after the run.

This demonstrates **real local SDK compatibility** for the existing
password-backed account flow. The deployed Deno deletion entrypoint
still always returns 503 and has no privileged SDK initialization.
The draft write-lock schema was **not** applied to hosted Supabase.
Do not construe a local test's `enabled:true` coordinator as a
production activation.

**Remaining release gates:** independently approved passwordless
reauthentication (most pilot users may use email links), final operator
privacy/deletion commitments, supervised recovery/retry, signed-off
production migration/RLS/key isolation, mobile validation, and owner
approval before any hosted changes.


## October 22 draft security improvement — durable *exclusive* cleanup claim (undeployed)

**New discovery:** `begin_closet_account_deletion` was designed to be idempotent and returned `true` for multiple requests for one account. This was correct for the durable *write tombstone*, but not proof that only one destructive cleanup worker was active. Two servers could simultaneously enumerate/remove a user's same Storage objects and issue competing Auth deletions. A mere process-level lock is not sufficient across server instances.

The updated **still-undeployed** `supabase/design/account-deletion-write-barrier.DRAFT.sql` adds a private `closet_internal.deletion_cleanup_claims` table with one owner UUID primary key, and a separate `public.claim_closet_account_cleanup(p_owner uuid)` service-role-only RPC. The RPC requires an existing committed deletion tombstone; only its first unique claim succeeds (`true`), later claims receive `false`, and anonymous/authenticated callers have no EXECUTE grant. The server-side coordinator now requires **both** `lockWrites` and `claimCleanup` after reauthentication before listing or removing any private photo. The new Supabase SDK adapter uses the separate RPC; a second claimant aborts before destructive operations.

**Recovery tradeoff:** The claim has NO TTL and is never silently released. If a worker dies after claiming, the account remains write-locked and cleanup cannot automatically resume; an authorized support/operations process must inspect the partial Storage, backup and Auth state and deliberately resume with an audited owner-specific recovery transaction. This is an intentional fail-closed safeguard, **not a complete recovery system**. Until that procedure, passwordless recent-authentication, live-hosted migrations and other release gates are approved and independently verified, the real HTTP deletion entrypoint remains **unchanged and disabled with 503**. This branch is a draft security design and must never be applied to live Supabase or deployed automatically.

Dedicated scope tests, coordinator and SDK mock tests, PostgreSQL role/isolation checks, live but **disposable local** Supabase Storage/Auth HTTP tests, actual supabase-js local SDK integration and two-client write-lock race tests are used as preconditions for further development. No hosted Supabase project, real photo or actual customer is accessed.
