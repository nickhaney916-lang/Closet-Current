# Closet Current — Priority #129 / SIGNED-OWNER-CLOUD-INTEGRATION-129

**RESEARCH ONLY · DRAFT/UNMERGED · Family Alpha Issue #255 HOLD · PRODUCTION AND EXISTING STAGING UNCHANGED · NO DEPLOY.**

## Baseline and branch

Verified P128 PR #683 remained open and unmerged at exact parent `caccf49bbcf5512122f981debb111f723d7385ac`, with its stated green no-deploy run [#42334871474](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42334871474). Created `research/signed-owner-cloud-integration-129-main-20261106-HOLD` directly from that commit. P129 targets `research/two-owner-cloud-rls-recovery-128-main-20261106-HOLD`.

Code/test head `1a9b9976beeeada5d04ada859bbdd73730c5be64` was verified by P129 Actions [#42336677349](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42336677349): 7/7 focused P129 tests pass; full repository Node suite 1,156/1,156 passes; ephemeral PostgreSQL 17 RLS/CAS suite 8/8 passes. Its actual-app Chromium/WebKit step at 320/390/430 CSS px was still running when this report was written. This exact run's current state and any later report-only commit are shown in the PR Actions checks.

## Implementation

New research-only `native-cloud-bridge.mjs` composes the existing Closet Current authenticated owner client and database with P128's original-plus-cutout JPEG SHA/object-path verifier, existing `closet-private` Supabase Storage bucket, existing `save_closet_backup` authenticated RPC/revision CAS, and P126 whole-closet atomic IndexedDB restore. It creates no alternate wardrobe store and changes no application auth, default cloud writer, SQL, RLS or schema.

Backup snapshots and rechecks the owner-local closet, independently verifies original and cutout JPEGs, writes SHA-addressed objects under the authenticated owner's folder, verifies immutable-object collisions, and writes the manifest through revision CAS. A local edit during asynchronous photo upload prevents a stale manifest save. Restore preflights all object paths, fetches and hashes each JPEG, validates review provenance, awaits literal true owner replacement consent, compares the local snapshot fingerprint, and delegates to the existing atomic restore so saved outfit IDs remain intact. Logout, account or token change, stale remote revision, local edit, malformed owner data and nonaffirmative consent fail closed.

## Exact-head automated evidence

- **Focused bridge tests:** 7/7 passed, including distinct original and cutout JPEG object paths, backup/restore, saved outfit ID preservation, local-edit race protection, stale remote revisions, declined consent and late response revocation.
- **Full repository Node tests:** 1,156/1,156 passed on code/test head `1a9b9976beeeada5d04ada859bbdd73730c5be64`.
- **Disposable PostgreSQL:** 8/8 inherited P128 RLS/CAS checks passed against unmodified repository SQL using an ephemeral PostgreSQL 17 service.
- **Mobile app:** P129's dedicated actual-app Chromium/WebKit 320/390/430 job is tracked in [run #42336677349](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42336677349). The P128 parent has verified 6/6 inherited mobile cases and 93 screenshots in [artifact 13558858548](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42334871474/artifacts/13558858548). Those inherited UI cases do not mount the P129 bridge and are not P129 cloud UI acceptance.

## Acceptance limits and release blockers

The P129 fake transport uses deterministic test access-token strings. It is **not** cryptographically signed JWT issuance, live PostgREST/Storage RLS, or authenticated two-account cloud acceptance. The inherited PostgreSQL test injects local claim settings, not signed JWTs. The inherited mobile test uses mocked auth/cloud endpoints and the actual closet UI, but does not exercise the P129 bridge or remote cloud. Physical Android/iPhone acceptance is not available.

Therefore Priority #129 is **not complete** against the assignment's definition. Remaining essential acceptance is (1) a separately authorized mount in the normal cloud writer while retaining the research gate, (2) isolated signed-account A/B HTTP verification for database and Storage authorization, and (3) an actual-app browser flow that invokes the mounted bridge for capture/review, backup, restore and reload. Physical device verification remains incomplete. A local signed Supabase stack was not available; production and existing staging were intentionally not used.

No real user, production or staging data was read or changed. No account tokens, passwords or user wardrobe photos were included in logs/artifacts; inherited browser screenshots use public licensed test fixtures. No live settings, schema or policies changed. Keep the PR draft and unmerged.