# Closet Current — Independent Mission 3 checkpoint, 2026-11-10

**Status:** Scoped session/owner cloud-isolation repair under verification. NOT full Mission 3 completion or release approval.

**Release gate:** FAMILY ALPHA HOLD #255 stays OPEN. No merges, production deployments, staging changes, real family photographs, hosted cloud writes, or shared Mission 1/2 branch edits.

## Verified parent and branch isolation

- Exact parent: PR #779 head `fbce0b66d7acf5b1ea0dffcb20f793abda06b793`.
- Isolated Mission 3 branch: `research/mission3-mobile-private-cloud-integration-20261110-HOLD`.
- Parent chain PRs #775–#779 contains previously isolated mobile accessibility, wardrobe editing, save conflict/atomicity, draft recovery and deleted-item protections. Those were individually CI-verified at their exact heads, but not merged into default branch.
- This branch only proposes the legacy `public/cloud-backup.js` lease repair and independent test/CI/report paths; no Supabase policies, authentication implementation, photo model, 3D renderer or protected environment changes.

## Failure mechanism and repair

The legacy cloud controller allowed a second `start()` call to replace module-global `db`, `user` and callbacks while the previous owner's `sync()` was awaiting its network response. Because `start()` did not increment the lease generation and the global `syncing` flag blocked the new owner's sync, the old response could restore into the second owner's IndexedDB. A session lock during a suspended cloud fetch had the same stale-local-write risk.

The isolated patch:
1. Invalidates old generations at every `start()` and on `closet:session-locked`.
2. Rejects owner/database mismatches before enabling cloud sync.
3. Uses per-generation single-flight tracking, allowing a new owner to sync independently.
4. Re-checks the captured generation, owner, database, and authenticated session around remote fetches, token refresh, JPEG decode/hash, uploads, cloud RPC, and local restore.
5. Aborts an IndexedDB restore if the owner lease changes before the transaction callback writes private items, and refuses callbacks into an invalidated session.
6. Retains the pre-existing loopback-only research hold and explicit nonautomatic owner-review flow; does **not** claim to replace hosted owner-scoped Supabase RLS.

## Reproducible security regression

`tests/mission3-owner-session-cloud.test.cjs` uses two **synthetic** UUID owners and two distinct actual fake-indexeddb databases. The exact-parent comparator must expose the old cross-owner restore, session-lock stale restore, and foreign-database sync request. The modified implementation must refuse all three. All test media and tokens are synthetic.

Workflow `.github/workflows/mission3-mobile-private-cloud-no-deploy.yml` verifies the immutable parent and exact four-path allowlist, reproduces baseline failures, runs the repaired tests, builds and executes the complete serial Node suite, runs genuine Playwright Chromium/WebKit mobile-size camera-to-closet/styling and accessibility journeys, then checks bounded synthetic-owner backup compatibility. No deploy credentials or deployment permissions are configured. **Workflow results must be read at the final exact commit before declaring verification.**

## Still outstanding beyond this milestone

- True authorized hosted two-account Supabase Auth JWT/RLS/Storage/restore testing in a separately approved disposable project; existing production/staging are not test resources.
- Genuine interrupted physical camera capture on Android Chrome and iPhone Safari, physical viewport/performance/memory checks and manual assistive-technology acceptance.
- Complete large-wardrobe storage/quota/fatal-process scenarios and interrupted cloud restore on real devices.
- Independently accepted real-photo recognition from Mission 1 and realistic photographed clothing on both 3D humanoids from Mission 2.
- Full final integration and approval by the existing primary development controller; this standalone draft is not merged and does not release the app.

**Do not declare Mission 3 100% complete, family-alpha-ready or production-safe solely because this branch passes.**
