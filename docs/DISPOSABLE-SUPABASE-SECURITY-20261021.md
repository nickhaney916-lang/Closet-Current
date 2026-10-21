# Work Assignment #154 — disposable local Supabase integration

Isolated from verified PR #153 source `7740438f2d196b1ccd98ea6ff47afc2f41de58bf`. The parent source and all existing Work branches remain untouched. This adds test infrastructure, not a hosted migration or production change.

## Execution boundary

The authoring workspace lacks Docker and the Supabase CLI. The dedicated GitHub job installs CLI **2.121.0**, initializes a separate empty project in runner temporary storage, and runs Docker's real local Supabase Auth, PostgREST, PostgreSQL and private Storage services. It never links a hosted project, uses hosted credentials, copies repository migrations into the new project, calls an AI provider or deploys anything. `public/`, existing SQL and production workflows must be byte-identical to PR #153. Local helper tests reject hosted URLs, alternate ports/databases, redirect escapes and missing explicit disposable acknowledgement.

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

Local static guard tests passed. Full regressions and the real local HTTP integration require the exact-head dedicated CI result before completion is claimed. Existing SQL drafts are applied only to the disposable runner database, never copied to automatic hosted migrations. All results and final SHA will be recorded in the draft PR and central checkpoint.

Even a successful local integration leaves hosted Supabase configuration, email delivery, protected Cloudflare Access, real devices, original-garment recognition accuracy, release approval and a separately authorized hosted migration unverified. Production promotion remains BLOCKED. The owner's no-paid-resource/no-production-change restriction remains in force.

References: [Supabase local development](https://supabase.com/docs/guides/local-development/cli/getting-started), [CLI releases](https://github.com/supabase/cli/releases/tag/v2.121.0), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
