# Closet Current — Priority #128 / TWO-OWNER-CLOUD-RLS-RECOVERY-128

**RESEARCH ONLY · DRAFT · Family Alpha GitHub Issue #255 HOLD · NO MERGE, PRODUCTION EDIT OR EXISTING-STAGING EDIT/DEPLOY.**

## Parent and live read-only audit

Pinned green parent Priority #127 [PR #682](https://github.com/nickhaney916-lang/Closet-Current/pull/682), exact SHA `f330db062e4383937571d73ef3d31038c6159709`, [dedicated no-deploy Actions #42331755126](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42331755126): 1,141/1,141 Node tests and 6/6 actual-app Chromium/WebKit 320/390/430 mobile viewport browser scenarios with 93 screenshots.

Connected Supabase read-only project metadata inspection on November 6, 2026 (Pacific) of **production project `hlkgymugtfbirlpunsra` and existing staging `fbnplztkbsteuzrmbgib`** confirmed:
- Both databases have `public.closet_backups` and `storage.objects` with RLS enabled.
- Production `closet_backup_owner` RLS uses `(select auth.uid())=owner_id` in both USING and WITH CHECK.
- Production private photo storage SELECT/INSERT/UPDATE/DELETE policies limit the `closet-private` bucket to the first owner folder path = `auth.uid()`.
- Production `save_closet_backup` has `prosecdef=false` (SECURITY INVOKER), validates auth.uid and uses owner-scoped optimistic revision CAS; actual source matches the core repository contract.
- Existing staging has its own additionally scoped `closet_backup_writer` role and backup table policy; this is **not equivalent to independently signed JWT E2E testing**, and requires separate audit before production release.
- Both Supabase projects' security advisors flagged **leaked password protection disabled**. The existing staging/prod account settings were intentionally NOT changed. For the advisory background consult the official Supabase <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>.

No user accounts, password material, private wardrobe rows, private storage objects, signed tokens or private photos were read or changed in live Supabase. The audit read only schema/policy/procedure metadata.

## Concrete source-level cloud limitation and research mitigation

Existing `public/cloud-backup-engine.js.mapImages` rewrites fields literally named `image`, but **not `segmentHint.cutoutImage`**. Valid P119/P124 owner-reviewed cutout JPEGs therefore risk remaining inline base64 inside the `closet_backups.document` JSON, rather than becoming independently addressable `closet-private/<owner>/<cutoutSHA>.jpg` storage objects. This may increase cloud JSON size toward the strict 5 MB document limit and disconnect secondary crop integrity from the ordinary cloud photo storage path.

Research-only new `research/two-owner-cloud-rls-recovery-128/owner-cloud-cutout-proof.mjs` provides a **standalone verified packaging/reopen proof** that:
1. Clones the owner-specific V4 backup **before** asynchronous validation and uses unchanged P126 `validateRestore01` to rehash **original and separately reviewed crop JPEG bytes**, category, subtype/color, owner approval and source SHA.
2. Converts BOTH `image` and nested `cutoutImage` to deduplicated owner-specific `closet-photo:<UUID>/<actual-SHA-256>.jpg` object paths, with an object map provided to a caller-supplied private upload writer. It does not touch the native default cloud implementation, staging or production.
3. Rejects missing/malformed JPEGs, foreign owner UUIDs, arbitrary/malformed paths, changed object bytes, SHA mismatches, source review forgery or revoked private session; asserts owner lease after every asynchronous object hash/fetch and final provenance validation.
4. Reconstructs exactly the same original+cutout JPEG and complete metadata from a correctly retrieved cloud document and validated private JPEG object bytes; the resulting document may then be passed to existing P126 atomic owner-private V4 restore (no release approval inferred).

## Tests and verification scope

New `tests/two-owner-cloud-rls-recovery-128.test.mjs` uses genuine license-locked original JPEG `commons-0002.jpg`, separate actual Sharp-encoded crop and **real P119 human-reviewed owner-private IndexedDB commit**. It exercises the new double-photo owner cloud packaging and cloud readback, no-inline-cutout metadata, loss → V4 atomic restore of both byte-identical JPEGs plus saved outfit references → existing authenticated owner read-only Style03 roster rehash with 2D-only photo, and independent negative tests (other owner, tampered original/crop bytes, fake review, revoked session).

New `research/two-owner-cloud-rls-recovery-128/local-postgres-bootstrap.sql` creates ONLY the minimum disposable `auth.uid()`, `auth.users` and `storage` infrastructure, then imports the **unchanged actual `supabase/cloud-backup.sql`** into a GitHub Actions ephemeral `postgres:17-alpine` service. New `scripts/test-two-owner-postgres-rls-128.mjs` uses the actual PostgreSQL RLS evaluator with two distinct UUID principals to verify:
- Both users can independently save via original SECURITY INVOKER RPC and can read only their own backup row.
- Another owner's backup SELECT/INSERT/UPDATE/DELETE is blocked.
- Optimistic revision compare-and-swap rejects stale writes.
- `closet-private` storage SELECT/INSERT/UPDATE/DELETE policies block cross-owner paths.
- Anonymous role cannot inspect backup or photo storage.
- Missing owner claim cannot call backup RPC.

**Important:** ephemeral PostgreSQL test claims come from local controlled `request.jwt.claim.sub`, not a cryptographically signed real Supabase Auth JWT; the resulting RLS behavior is genuine PostgreSQL, but **live signed two-account authentication/remote requests remain unverified**. This requires separate opt-in test users and isolated remote acceptance, NOT permission to modify prod or existing staging.

Inherited no-deploy browser job reruns the previously verified #127 six actual-app 320/390/430 browser scenarios, including 93 screenshots and owner-specific local recovery. It is a regression check, not a new remote signed cloud or physical-phone test.

**Exact-head final CI status: PENDING.** Do not mark complete until inherited 1,141+ Node, the real ephemeral PostgreSQL tests and inherited six genuine-browser scenarios succeed at the final SHA. Dedicated workflow must guard an exact verified P127 parent and allow only this report + P128 module/tests/local script/local SQL + workflow.

## Release and legal boundaries

Research does not modify the production photo storage code, any deployed cloud policies/RPC, Supabase account settings, real remote accounts, camera/3D engine, main app, existing staging or user private data. It does not claim that original/cutout SHA proves semantic learned instance-segmentation correctness, color accuracy, humanoid fit or 3D photorealism. Real authenticated signed JWT, real external cloud upload/recovery, end-user phone file picker and physical devices are pending independent acceptance.

**Family Alpha Issue #255 HOLD · PR DRAFT / UNMERGED · NO DEPLOY.**
