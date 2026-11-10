# Closet Current — Mission 3: bounded private photo backup + reviewed cutout storage

**STATUS: UNVERIFIED ISOLATED RESEARCH UNTIL EXACT-HEAD CI COMPLETES.**
**FAMILY ALPHA HOLD #255. No merge, production/staging deployment, hosted signed-owner tests or actual user garments.**

## Baseline and ownership

- Exact verified Mission 3 camera interruption parent PR #799, SHA `d9ba6e0c96589232c26afc0ef59ca1e963fd0aee` ([CI #42916307211](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42916307211)).
- Parent chains isolated PR #798 owner cloud session leases and #775–#779 native private wardrobe and outfit fixes.
- This independent branch affects only cloud encode/decode, test/CI and documentation. Missions 1 (recognition) and 2 (3D cloth) are untouched.

## Bugs identified

1. `ClosetBackupEngine.mapImages` used `Promise.all` over the entire wardrobe list. A 1,000-item wardrobe could start hundreds of photo SHA operations or remote storage fetches concurrently, causing large transient memory/network pressure on mobile.
2. The same mapping recognized `image` but not `segmentHint.cutoutImage`. A previously human-reviewed cutout JPEG could be retained as base64 inside the private cloud JSON rather than becoming a content-addressed private Storage object. Photo SHA/source identity must not be represented as proved merely because the document exists.
3. Simply mapping `cutoutImage` would break historical cloud records with an inline cutout; an explicit SHA validation and backwards-compatible read path are necessary.

## Isolated implementation

- One **global per-call cap of four concurrent photo transforms** traverses the entire wardrobe document, including nested original and cutout photos, with bounded per-array walkers and stable document order.
- The cloud mapping now applies to both `image` and `cutoutImage` while leaving all other metadata, source/photo SHA receipts, outfit selections and source JPEG strings unchanged in local source objects.
- New backups upload reviewed cutout JPEG bytes to the existing private `closet-private/<owner>/<sha256>.jpg` storage namespace; identical originals are de-duplicated by SHA.
- Cloud restore resolves the cutout by owner-scoped private path and independently checks the claimed reviewed `cutoutSHA256` before restoring private items.
- Historical legacy inline cutout JPEGs are accepted **only** if a complete bytes SHA-256 matches `segmentHint.cutoutSHA256`; mismatches fail closed before atomic restore. Existing original/owner session lease checks from PR #798 remain intact.
- No new credential, authentication bypass, Supabase RLS policy, or owner data upload mechanism was added.

## Evidence and acceptance criteria

- `tests/mission3-cloud-photo-queue.test.cjs`: exact parent comparator must exhibit uncontrolled concurrency and missed cutout images; fixed implementation must bound global maximum at four, map 192 original/cutout fields in stable order, process 1,000 items, validate no prototype pollution, accept correct legacy cutout, reject wrong legacy SHA and wrong private cutout path, and restore correct new private cutout references.
- `scripts/test-outfit-backup-compatibility-browser.mjs`: actual Chromium mobile 390 CSS-pixel workflow seeds nine synthetic owner-private items and one original/reviewed-cutout JPEG pair derived from a licensed test photo, sends backups through the actual app cloud client to a **synthetic isolated backend**, checks both JPEGs stored under private SHA paths rather than JSON, restores them into a second browser, independently rehashes cutout bytes and verifies an unrelated owner's wardrobe stays empty.
- Dedicated `.github/workflows/mission3-bounded-cloud-photo-no-deploy.yml` must pass strict direct-parent and scope guards, baseline comparator, repaired tests, full Node/build regression, Chromium/WebKit mobile camera-to-closet, cloud-backup browser, outfit save/draft and accessibility journeys.
- CI and screenshots must be audited on **exact final HEAD** before changing this status to verified.

## Remaining external acceptance gates

The four-concurrent request limit bounds simultaneous transformations and remote fetch operations, **not peak total browser memory**: the original full IndexedDB snapshot and finished base64 wardrobe remain resident until sync finishes. Real 1,000-photo physical-device memory and storage quota tests are still required. Neither local synthetic users nor browser emulation prove real hosted Supabase Auth-signed two-owner RLS, production, physical Android/iOS camera/lifecycle, OS termination, independent human photo review or Family Alpha release readiness. Keep HOLD #255.