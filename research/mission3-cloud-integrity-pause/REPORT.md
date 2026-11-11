# Mission 3 — owner-durable quarantine on corrupt private cloud photographs

## Direct verified parent and release hold

Parent is Mission 3 draft PR #819, exact final **6a122c8a194acc018566a46e3a33b35dc16ca9ad**, [NO DEPLOY Actions #42944247299](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42944247299), SUCCESS, **1,418/1,418 Node tests** and 6/6 new real Chromium/WebKit persistent-device-quota reload cases at 320/390/430. All changes remain isolated to this research stack. **FAMILY ALPHA HOLD #255** is active; no merge, deployment, existing staging, hosted Supabase, customer data or changes to parallel Missions 1/2.

## Failure and repair

The parent checks every private source JPEG/cutout SHA and the published backup receipt but treats a corrupt remote Storage object as a generic connectivity error. On online/focus/interval, the app redownloads and rejects the *same immutable corrupt object* indefinitely. This wastes battery/network bandwidth and can falsely imply a transient connection failure. It must not overwrite existing local originals or saved outfits.

Add a typed `cloud-photo-integrity` failure for mismatched private Storage JPEG bytes, invalid owner-bound private object path, verified-original or reviewed-cutout receipts, invalid remote backup document and mismatched existing immutable upload object. Integrity errors are intentionally distinct from temporary HTTP 503 failures or device/cloud capacity 413/507 errors.

For an integrity failure, preserve the *entire existing local wardrobe* and stop automatic cloud sync. Persist a minimal `integrityPause: true` marker in the already owner-specific IndexedDB `cloud-sync` state, which is never included in remote JSON. A page/PWA reload checks this small marker **before any cloud requests or full-resolution photo snapshot**. The existing **Sync closet** action remains visible; only a valid, deliberate owner action clears the marker and re-fetches the remote source. If the cloud photograph remains corrupt, re-quarantine. Account switching or revoked auth lease must not clear the previous owner's pause.

Storage failure while trying to persist the stop is surfaced as non-durable; do not overclaim protection. The repair does not mutate or delete suspicious cloud objects or trust invalid source evidence.

## Independent acceptance

- Strict exact-parent reproduction: the parent contains no integrity quarantine.
- Focused fake-indexeddb source/photo receipt and remote JPEG byte mismatch tests: genuine SHA mismatch, local garment and saved outfit unchanged, owner-revision unchanged, stop survives reload, zero new HTTP calls, manual retry only after restoring original bytes, second owner isolation, stale/revoked owner manual action refused.
- Real app in actual Chromium & WebKit at 320, 390 and 430 CSS widths: controlled corrupted Storage object; verify visible integrity message, atomic unchanged local JPEG/outfit/revision, no new remote requests on full page reload, then manually switch fixture to correct original bytes and click Sync closet, confirm restored SHA-bound original photo, outfit and revision. Capture screenshots and axe-core accessibility.
- Inherited full serial Node regression, original/cutout backup compatibility, device quota atomic/durable rollback tests and native photographed styling mobile browser flows.

**Verification status pending exact final HEAD CI.** No physical Android/iPhone, live signed hosted JWT/RLS/Storage two-account test, or actual owner photo stress evidence is implied. Draft PR only; Family Alpha remains HOLD.
