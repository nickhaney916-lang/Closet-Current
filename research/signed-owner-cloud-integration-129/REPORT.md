# Closet Current — Priority #129 / SIGNED-OWNER-CLOUD-INTEGRATION-129

**RESEARCH ONLY · DRAFT/UNMERGED · Family Alpha Issue #255 HOLD · PRODUCTION AND EXISTING STAGING UNCHANGED · NO DEPLOY.**

## Baseline and branch

Verified P128 draft PR #683 remained open and unmerged at exact parent caccf49bbcf5512122f981debb111f723d7385ac, with its stated green no-deploy run #42334871474. Created research/signed-owner-cloud-integration-129-main-20261106-HOLD directly from that commit. P129 targets P128 branch research/two-owner-cloud-rls-recovery-128-main-20261106-HOLD.

## Implementation

New research-only native-cloud-bridge.mjs composes the existing Closet Current authenticated owner client and database with P128's original-plus-cutout JPEG SHA/object-path verifier, existing closet-private Supabase Storage bucket, existing save_closet_backup authenticated RPC/revision CAS, and P126 whole-closet atomic IndexedDB restore. It creates no alternate wardrobe store and changes no application auth, default cloud writer, SQL, RLS or schema.

Backup snapshots the current owner closet, verifies source/review provenance and each original/cutout JPEG, writes SHA-addressed objects under the owner path, checks immutable-object collisions by SHA, then calls the existing CAS RPC. Restore preflights every object path, fetches and hashes photos, revalidates review metadata, awaits literal true owner replacement consent, snapshots the local fingerprint, and delegates to the existing single-transaction restore. A stale local edit, remote revision mismatch, logout, account switch, token replacement or owner mismatch fails closed. This adapter is research-gated code; a later authorized change is required to mount it inside the normal public cloud writer.

## Acceptance scope and blockers

The new tests exercise the bridge with a deterministic fake HTTP transport and test access-token strings. They are not cryptographically signed JWTs, live PostgREST/Storage enforcement, or real two-account cloud transactions. The inherited P128 pipeline can run full Node regression tests, disposable PostgreSQL policy tests, and the existing actual-app Chromium/WebKit mobile flow. Those inherited UI cases do not mount P129 in the app. No physical Android/iPhone browser test or genuine signed-account cloud acceptance is claimed.

No real user, production or existing staging data was read or changed. No credentials or photos are written to logs or artifacts; no live settings, policies or schema changed. Family Alpha remains HOLD. Keep the PR draft and unmerged.
