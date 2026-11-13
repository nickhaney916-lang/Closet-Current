# Mission 3 — Never hide a new capture during async cloud restore UI rehydration

**FAMILY ALPHA HOLD #255 OPEN. DRAFT ONLY. NO MERGE, PRODUCTION/STAGING DEPLOYMENT, HOSTED SUPABASE OR PRIVATE WARDROBE ACCESS.**

Verified exact parent [Mission 3 draft PR #998](https://github.com/nickhaney916-lang/Closet-Current/pull/998), HEAD efd9dc07e81b7ac1fae9202f2881508d308eaf08; isolated five-path diff.

## Source-verified issue

The source cloud-backup-bridge.js mission3ReloadOwnerCloudView reads the signed owner's saved wardrobe with readAllFrom and pending originals with readDraftFrom. Those independent native IndexedDB reads, plus inspiration and board reads, are awaited. The existing owner/session epoch lease rejects cross-account changes but not newly captured **same-account** JPEGs appearing in the review buffer while the saved/draft reads are paused. The final items=nextItems; batch=nextBatch could replace a newer in-memory pending original with stale disk data and hide a JPEG whose required local save is pending or failed. Likewise, an in-place owner correction to a previously reviewed draft could be replaced.

The prior PR #998 hardened the destructive cloud transaction. This milestone addresses the **post-commit asynchronous onRestored screen rehydration race**, without reopening the transaction or introducing risky automatic merges.

## Safeguards

- Before any asynchronous source reads, freeze current items/batch array identities, row references, metadata signatures with JPEG string redaction to avoid cloning whole full-resolution images, exact image and original-photo reference strings, and current signed-owner pending-write queue promise.
- Before each native read and **immediately before publishing** the two wardrobe arrays, reassert existing signed-owner lease, ensure the camera/gallery/video/recognition/review UI is idle, no failed save, no new queued private write, and original on-screen rows have not changed in length, identity, original JPEG, category, color or other metadata. If changed: reject, preserve on-screen originals, do not render or queue new recognition.
- Following provisional publication and during awaited looks/board rehydrate, check that a new source or write has not started before render/reindex. Check once before intentionally launching queued recognition; otherwise the first item legitimately sets automaticRunning and would incorrectly cancel the rest.
- Continue protecting cloud state with the previously verified native transaction fence. This milestone changes **public/cloud-backup-bridge.js only** and does not alter any data at rest, hosted cloud, schema, endpoints or production settings.
- A concurrent local camera capture after remote transaction commit may postpone the rehydration callback. In that case it is safer to preserve current in-memory photos and ask the owner to complete/review the capture and refresh than to clobber a valid original. This is not proof of complete cross-tab cloud consistency.

## Reproducible QA

- Source-executed Node tests using the exact production function: clean signed restore, multiple queued review items, new captured original during a saved read, an in-place owner color correction or SHA/photo source change during a draft read, newly queued write, same-owner photo after publication while the looks reload awaits, active camera/import, and revoked owner lease.
- Native Chromium/WebKit at 320/390/430 CSS px with synthetic owner JPEG/SHA, actual app/bridge, native private IndexedDB, an intentionally paused real saved/draft fetch, an on-screen failed original that must survive, owner correction, safe retry, separate authenticated account isolation, and all off-host requests blocked.
- Exact parent five-path no-deploy CI includes inherited full serial Node tests, mobile/native photo crop, upload, privacy, signed disposable PostgreSQL Storage RLS, backup/restore and 3D-clothing styling smoke checks.

**Verification status:** Must be established by the final exact-head green workflow; do not infer success from older PRs.

**Remaining release blockers:** Physical Android Chrome and iPhone Safari, authorized live hosted two-owner Supabase Auth/Storage recovery and revocation, independent genuine photographed-garment recognition, photorealistic photograph-to-3D fabric fitting, cross-mission integration, owner-approved release. HOLD #255 remains OPEN.
