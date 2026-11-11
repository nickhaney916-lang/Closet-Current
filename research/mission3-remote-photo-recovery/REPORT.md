# Closet Current — Mission 3 durable missing/tampered remote private JPEG restore safety

**FAMILY ALPHA HOLD #255. Isolated DRAFT, unmerged, undeployed. No production/existing staging changes, hosted account access, real user photographs, or Mission 1/2 branch edits.**

## Exact parent verified

Mission 3 [draft PR #826](https://github.com/nickhaney916-lang/Closet-Current/pull/826), exact HEAD `dafe12c792c6a7fe2ff2041389ce4e802fad9814`, [NO DEPLOY CI #42956212927](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42956212927) **SUCCESS**: 1,444/1,444 Node tests; actual Chromium/WebKit 320/390/430 owner-local unsupported/invalid/oversize JPEG pause, photo correction, cloud source/reference privacy and 2D fallback. Prior artifact #13827870507 independently inspected with 73 valid screenshots, 36 matching SHA receipts, 36 zero-axe-violation reports.

## Defect closed

The current owner may have a clean existing private wardrobe with original photos and saved outfits. If a newer signed-owner cloud revision references an immutable private Storage JPEG that is **missing (HTTP 404)** or whose downloaded bytes **fail SHA-256**, the earlier decoder correctly refused the photo and never applied any partial restore. But the `sync()` catch mislabeled this deterministic cloud-photo defect a generic connection problem, and reissued the full backup's revision/document requests and private photo GET on every focus/online/60-second retry. This wastes mobile bandwidth and falsely tells the owner to restore connectivity rather than repair their missing/corrupted private cloud object.

## Scoped implementation

- Distinguish `REMOTE_PHOTO_MISSING` (private Storage 404) from `REMOTE_PHOTO_INTEGRITY` (downloaded bytes exceed 8 MiB, have invalid JPEG signature, or fail immutable SHA-256 reference check). Retain ordinary exponential retry on real transient network failures such as HTTP 503.
- In the existing authenticated owner's IndexedDB `cloud-sync` marker, persist `remotePhotoPause:{reason,revision}` for the **observed failing cloud revision**. This small local owner-only marker is excluded from the cloud backup document. Show an accurate, accessible message that existing local items and outfit board remain unchanged, cloud restoration is paused, and the owner may repair the cloud original then press **Sync closet**.
- On repeated automatic focus/online/interval or fresh controller/PWA reload, read this marker **before remote requests or local full-JPEG snapshot** and refuse another download while blocked. Explicit owner-initiated Sync bypasses the pause; if the cloud remains missing/tampered, re-record it. On successful atomic restore, clear the pause and validate the original JPEG SHA before updating local items/outfits/revision as one transaction.
- Do not promote local camera photo errors, wrong-owner Storage path, unverifiable owner metadata, malformed cloud JSON, arbitrary HTTP failures, or 503 to the permanent remote-photo pause. Preserve authenticated user/session lease, immutable photo receipts, owner-specific RLS access assumptions and previous 413/507/durable-local-photo/device-quota recovery behavior.
- The marker write is guarded by the in-flight owner and local revision: if a new local edit occurs during the failed restore, it does not silently stamp the newer revision with the prior error. If local persistence fails, status explicitly reports that the pause may not survive a full restart.

## Exact-parent evidence and browser acceptance

`tests/mission3-remote-photo-integrity-pause.test.cjs` uses fake IndexedDB, two synthetic signed owner UUIDs and a current owner REST row at revision 2 with a SHA-referenced private photo. The exact parent comparator proves **both 404 and tampered JPEG lead to generic network backoff** without a durable marker. The repaired tests require unchanged original photos/old saved outfits/base revision, persisted reason/revision, zero automatic remote requests after restarting/focus, manual retry of still-broken object to re-pause, successful manual recovery of original and outfit after repair, and ordinary 503 auto-backoff plus owner B isolation.

`scripts/test-mission3-remote-photo-repair-browser.mjs` runs the **actual built Closet Current app** in Chromium and WebKit at **320,390,430 CSS px**. It injects a missing (320/390) or SHA-corrupt (430) synthetic photo into a newer owner REST row; actual browser IndexedDB holds an old signed owner's locally saved JPEG and outfit. Checks that a real full-page reload causes **zero additional cloud requests**, original data/board/revision remain intact, visible status and axe accessibility pass; after repairing private bytes in the mocked Storage endpoint and clicking the **real Sync closet DOM control**, the app atomically restores a SHA-verified owner-private photo and saved outfit. Screenshots and SHA-256 receipts are recorded. Tests use synthetic accounts and mocked cloud, **not** genuine hosted Supabase/Auth/RLS or physical devices.

Strict `.github/workflows/mission3-remote-photo-recovery-no-deploy.yml` pins the exact verified parent and allows only five research paths (controller, Node, real browser script, report, CI); runs exact-parent comparison, repaired tests, complete serial Node suite, and every prior actual Chromium/WebKit 320/390/430 private photo/camera/revision-1,000/item-owner/capacity/quota/accessibility browser flow. **Do not declare this new milestone verified until final exact-head CI and evidence are inspected.**

## Completion gates unchanged

Genuine disposable hosted signed two-account Supabase JWT/RLS/Storage/restore tests; physical Android Chrome and iPhone Safari camera/background/OS kill/network/quota and distinct high-resolution 1,000-image peak heap; independently labeled real garment recognition and realistic photographed-clothing-to-male/female-3D integration/human signoff remain outstanding. All previous draft PRs remain unmerged/undeployed. **FAMILY ALPHA HOLD #255 is open.**
