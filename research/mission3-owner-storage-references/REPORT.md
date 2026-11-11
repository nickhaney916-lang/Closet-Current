# Closet Current — Mission 3 owner-private Storage reference integrity before cloud merge

**FAMILY ALPHA HOLD #255. Isolated DRAFT, UNMERGED, UNDEPLOYED. No production/existing staging mutation, hosted signed account writes, real user photographs, or Mission 1/2 branch edits.**

## Exact previously verified parent

Mission 3 [draft PR #822](https://github.com/nickhaney916-lang/Closet-Current/pull/822), HEAD `2ef3202ee60a13ef0d61c6493a1da02dd2ad7224`, [NO DEPLOY CI #42947160691](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42947160691) **SUCCESS**: **1,429/1,429 serial Node tests**, real Chromium/WebKit 320/390/430 owner-tagged garment/draft rejection, private cloud 1,000-piece revision-only sync, recovered original/cutout source hashes, 61/61 valid screenshots and 36/36 zero-axe-violation reports.

## Specific distinct security failure

The previous PR #822 rejects saved garments and private camera drafts carrying a foreign `ownerId` even if they arrive from an otherwise correctly authenticated owner-specific PostgREST backup row. But its `getRemote` function still accepted a remote garment whose **item.ownerId equals the current account** while a nested photo URL `originalPhoto.image`, `recognitionPhoto.*.image`, `segmentHint.cutoutImage`, or other nested image field points at `closet-photo:<other-owner>/<SHA256>.jpg`.

A *clean* cloud restore would eventually reject this when `decode()` checked the Storage path. A **dirty local backup with a newer remote revision**, however, merged and could publish the tainted foreign photo reference in the current owner's next cloud revision **before** ever calling `decode()`. The older decoder also let a forged legacy inline reviewed-cutout SHA receipt pass through `getRemote` and dirty merge without checking the actual inline JPEG bytes. This violates the desired owner-private storage source invariant even when RLS would prevent accessing the other account's physical Storage object.

## Implemented fail-closed verification

- New `assertCloudPhotoReferences(document, assertActive)` recursively inspects every nonempty nested key that the actual image transform recognizes (`image` and `cutoutImage`). Every cloud Storage reference must match the **current authenticated owner's** strict `closet-photo:<owner>/<64-lowercase-hex>.jpg` path format. No URL, malformed SHA, or another owner's private folder is permitted.
- Where `originalPhoto.sha256` or `segmentHint.cutoutSHA256` accompanies a reference, it must match the exact path digest. The review flag alone is not treated as proof.
- Historical inline `segmentHint.cutoutImage` JPEGs remain supported only with a SHA-256 receipt that actually matches decoded bytes, verified **before any remote merge**. No additional fabricated human review or source approval is created.
- Apply validation to the **full fetched remote JSON** (not metadata-only revision probes), to newly encoded owner-local JSON, and to the **final output of three-way/keep-both merges before photo upload or cloud RPC**. Each asynchronous hash check reasserts the authenticated owner/session lease.
- Preserve earlier owner-tagged garment checks, private-source byte SHA validation, checked restore, atomic device-quota rollback, bounded photo queue, revision-only normal sync, and 2D fallback. Do not alter Supabase/Auth/recognition/3D paths.

## Exact-parent and independent mobile evidence

New `tests/mission3-owner-photo-reference-guard.test.cjs` compares the **exact verified PR #822 parent** to the repaired controller with synthetic owners A/B and fake IndexedDB. The parent comparator demonstrates publication of current-owner rows carrying foreign original, reviewed cutout, nested photo, external URL, mismatched same-owner SHA, and forged legacy inline cutout. Repaired cases demand **zero cloud writes**, unchanged original private clothing and durable dirty revision, and honest pending status. Positive tests require intact same-owner SHA-verified Storage original, correctly attested inline cutout and legitimate owner metadata to restore normally.

New `scripts/test-mission3-owner-photo-ref-browser.mjs` runs real automated Chromium and WebKit at **320, 390 and 430 CSS pixels**. An existing owner-A actual synthetic JPEG/source SHA/dirty wardrobe receives a newer owner-A REST row containing a photo reference to owner-B private Storage. The app must refuse to publish or fetch B's private photo, preserve A's originals and revision, show pending backup, then successfully merge a correct owner-A original with real byte hashing and a deliberate `Sync`. The test also rejects a newly received foreign reviewed-cutout reference; each browser case retains screenshot SHA and axe accessibility receipts. **Cloud identities and HTTP are mocked**, not signed hosted Supabase security acceptance.

The dedicated `.github/workflows/mission3-owner-storage-ref-no-deploy.yml` enforces the exact parent and an allowlist of **five changed paths**: cloud controller, new Node test, new actual browser test, this report, and the no-deploy workflow. It runs baseline comparison, repaired tests, **all serial Node regressions**, and all established Chromium/WebKit 320/390/430 private wardrobe, camera styling, remote-capacity, atomic local-quota and accessibility acceptance. **Do not claim a verified final milestone until the final exact-head CI and artifact are independently checked.**

## External release acceptance remains pending

No authorized disposable hosted Supabase test environment with genuine two-account signed JWT/RLS/Storage/restore rejection has been accepted, and no physical iPhone Safari or Android Chrome camera and OS-memory/kill/real 1,000-high-res garment JPEG quota testing has been completed. Recognition and real photographed clothing 3D readiness remain separate Mission 1/2 work. **FAMILY ALPHA HOLD #255 stays active; release is not authorized.**
