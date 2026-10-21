# Work Assignment #154 — disposable local Supabase integration

Isolated from verified PR #153 source `7740438f2d196b1ccd98ea6ff47afc2f41de58bf`. The parent source and all existing Work branches remain untouched. This adds test infrastructure, not a hosted migration or production change.

## Execution boundary

The authoring workspace lacks Docker and the Supabase CLI. The dedicated GitHub job installs CLI **2.121.0**, initializes a separate empty project in runner temporary storage, and runs Docker's real local Supabase Auth, PostgREST, PostgreSQL and private Storage services. It never links a hosted project, uses hosted credentials, copies repository migrations into the new project, calls an AI provider or deploys anything. `public/`, production SQL/migrations, audit SQL and production workflows must be byte-identical to PR #153; only the two explicitly reviewed DRAFT hardening/recovery designs may change. Local helper tests reject hosted URLs, alternate ports/databases, redirect escapes and missing explicit disposable acknowledgement.

The integration runner accepts only local API port 54321 and PostgreSQL port 54322, demands an empty auth user set and no existing closet table, and uses the CLI's ephemeral local anonymous key. Both accounts are newly signed up and password-authenticated through actual HTTP Auth; their verified JWTs, random synthetic addresses and passwords never appear in the aggregate report. The tiny solid-color JPEG is generated test data. All runner volumes and status files are destroyed after the test. The test report does not certify any real customer environment.

## Required scenarios

- Symmetric A→B and B→A backup REST read/insert/update/delete and photo read/new upload/overwrite/upsert/delete/list/signed URL denial, verified by reading each victim's unchanged metadata and original photo bytes afterward.
- Anonymous, public-photo and forged-JWT denial; editable user metadata cannot grant access to another owner.
- Owner save/read/photo retrieval across limited-write, RPC-only, safely recovered limited-write and re-hardened catalog states.
- Actual concurrent RPC revision compare-and-swap: one successful writer and one null stale revision; invalid and trigger-rejected saves leave the prior document/revision unchanged, then a retry succeeds.
- A committed request whose response is deliberately disregarded is retried with the old revision without duplication. This is client response-loss simulation, not proof of transport-failure behavior.
- Deliberate public RPC wrapper drift causes the existing recovery draft to abort without partial grants; restore the wrapper, recover transactionally, preserve both closets/photos, then re-harden and save again.

The recovery fallback intentionally restores owner-bound SELECT/INSERT/UPDATE, so direct owner writes can bypass the RPC revision check in that fallback state. The preferred final state is RPC-only; this test must not describe fallback as equivalent hardening.

## Status and remaining gates

Implementation source `1042cd622277c4298af849af682f8478a3869b74` passed the full regression and real local HTTP integration in GitHub CI. Existing SQL drafts are applied only to the disposable runner database, never copied to automatic hosted migrations. All results and final SHA will be recorded in the draft PR and central checkpoint.

Even a successful local integration leaves hosted Supabase configuration, email delivery, protected Cloudflare Access, real devices, original-garment recognition accuracy, release approval and a separately authorized hosted migration unverified. Production promotion remains BLOCKED. The owner's no-paid-resource/no-production-change restriction remains in force.

References: [Supabase local development](https://supabase.com/docs/guides/local-development/cli/getting-started), [CLI releases](https://github.com/supabase/cli/releases/tag/v2.121.0), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Real-stack defect and bounded draft repair

The first real Supabase run passed the initial HTTP isolation and revision/failure scenarios but exposed recovery failure: `postgres` is not a superuser and cannot drop a function owned by the private writer after the hardening draft revoked its entire membership. Plain PostgreSQL superuser rehearsals had hidden this defect. The hardening draft now retains only administrator ADMIN authority, with SET and INHERIT explicitly false; browser roles receive no membership. Recovery temporarily enables administrator SET, becomes the private owner only to drop its own function/schema, resets role and drops the writer role. The transaction rolls back temporary authority on failure. This does not recover previously hardened databases whose administrative grant was already revoked; those require separate reviewed role-administration repair. No such change was applied to a hosted database. The integration explicitly requires a non-superuser executor and checks SET is disabled for both the executor and browser roles after hardening.

## Verified evidence

[Local Supabase #39677977928](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39677977928) and [camera/indexing #39677977772](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39677977772) both completed SUCCESS at implementation SHA `1042cd622277c4298af849af682f8478a3869b74`. Full app build and **1,494 Node tests passed, 0 failed, 3 skipped**. The aggregate `DISPOSABLE_SUPABASE_SECURITY_PASS` confirms **207 HTTP requests** across both accounts and all four permission states, two-way owner isolation, private photo integrity, anonymous/forged JWT denial, editable metadata isolation, revision races, actual failed-save recovery, atomic drift rejection, safe recovery and re-hardening. Cleanup completed successfully. These requests include positive controls, Auth and setup probes; they are not 207 independently named test cases.

The initial real-stack run failed on the private-function ownership defect; a subsequent draft grant attempt exposed PostgreSQL's prohibited administrator self-grant cycle. Both are resolved by preserving the creator's existing ADMIN grant while disabling SET/INHERIT, then temporarily re-enabling SET for transactional object-owner cleanup. Neither issue was bypassed by using a superuser or weakening browser grants. The final integration explicitly requires a non-superuser Supabase executor.
