# Closet Current Mission 3 — owner revision fence for stale 413 responses

**FAMILY ALPHA HOLD #255. DRAFT, UNMERGED, UNDEPLOYED.** This is one isolated owner-private cloud recovery change. Existing main, production, staging, hosted Supabase, other mission branches and genuine owner photographs are untouched.

## Starting evidence

Exact independently verified parent: [draft PR #853](https://github.com/nickhaney916-lang/Closet-Current/pull/853) HEAD `ab7a60754e403ecb3881f98b5695c4340c76c18c`, [NO DEPLOY Actions #42971471214](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42971471214), **1,492/1,492 complete serial Node regression**, **66/66 genuine Chromium/WebKit 320,390,430 mobile viewport cases**, local original-photo SHA/private cloud authentication, 1000 distinct synthetic high-resolution JPEGs, complete 8-MiB photo/32-MiB cloud JSON bounds, native private closet/styling and real *disposable* PostgreSQL 17 two-owner RS256 signed-JWT RLS.

## Reproduced defect and affected user workflow

At local garment revision 1, an owner uploaded a private original JPEG. The Storage API's upload was in flight. The owner then replaced or **deleted** the outdated garment (revision 2). The old upload returned **HTTP 413** (photo too large). The generic error handler persisted `cloud-sync.capacityPause=413` without checking that the local revision had changed. The stale 413 stopped an entirely valid new cloud backup until the user manually clicked Sync—even if the oversized garment had already been deleted and the new snapshot had no photo at all.

This differs from **HTTP 507**, which indicates owner cloud-storage capacity exhaustion and typically persists regardless of which garment is edited. Automatically clearing 507 on a local edit would create repeated futile upload attempts. The current owner's valid unchanged 413 must also remain durably paused, not auto-retry.

## Implementation

- Add an optional `expectedRevision` argument and transactionally checked `localRevision` to `writeCapacityPause`, consistent with existing owner-local integrity error fences.
- For **413 only**, if the response refers to an older photo/source revision, return `stale` from the same owner-local IndexedDB transaction without writing or clearing any other markers.
- The caller then clears only the in-memory *old 413*, retains all current items/private JPEGs/draft/outfit/local dirty revision, and schedules normal revision-first sync. The current owner edit or deletion is published by an ordinary later sync, **not** by a forced/manual capacity-bypass retry.
- For unchanged-revision 413, keep the previously verified durable pause and signed-owner manual recovery. For **507**, preserve existing global durable pause even if localRevision changed. Clearing via deliberate current-owner Sync remains supported.
- No changes to auth, cloud SQL/RLS, camera/recognition/3D, original-photo receipt SHA, server APIs, release state, quota guards or other branches.

## Verification contract

1. Exact verified parent reproduction: hold the original JPEG HTTP POST until `closetCloud.beforeWrite` and committed IndexedDB owner garment edit/delete advance the localRevision. Return synthetic HTTP 413. Confirm old code persists stale 413 and stops automatic sync.
2. Current regression: replay the same race. Confirm revision 2 remains dirty with unchanged original/private owner, no capacityPause, no stale publish, no manual override required. The next normal sync publishes only edited color or correctly empty closet; previously deleted garment never resurrects.
3. Unchanged original HTTP 413 remains durably owner-paused until manual Sync; HTTP 507 remains durable/global when an owner changes or deletes the local garment. No retry storms or cross-owner visibility.
4. Real native Chromium and WebKit at **320,390,430 CSS pixels**, both edit and delete scenarios: hold first original JPEG POST, commit a real IndexedDB owner edit, return HTTP 413, verify no pause, latest image/source and outfit integrity, screenshot SHA and axe accessibility; next ordinary `closetCloud.sync()` (no forced/manual retry) succeeds with only newest wardrobe. The server and photos are synthetic, with no hosted account contact.
5. Full 1,492+ serial Node regression, all 11 inherited six-case mobile browser suites, 1000 synthetic distinct 1280×1680 JPEG memory workload, real disposable signed two-owner RS256 JWT/PostgreSQL 17 RLS and private Storage owner policy tests, legacy cloud repair and atomic backup/restore.
6. Strict exact-parent SHA, five allowed research/test/source paths and dedicated **NO DEPLOY** CI. Inspect final exact-head Actions result and screenshots/JSON receipts before claiming completion of this *engineering checkpoint*.

## Release acceptance exclusions

No physical iPhone Safari/Android Chrome camera lifecycle or OS-memory/kill testing, genuine owner-approved photos, or **hosted** Supabase Auth+Storage two-account verification. Synthetic browser viewport and cryptographically signed real disposable PostgreSQL RLS cannot substitute. User release decision, cross-mission integration and Family Alpha HOLD #255 remain outstanding. No merge/deploy and no hosted customer/staging writes.

**Report created while dedicated exact-head CI is pending.**
