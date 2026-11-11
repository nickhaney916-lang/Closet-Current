# Closet Current — Mission 3 original JPEG / reviewed cutout cloud receipt integrity

**Release restriction: FAMILY ALPHA HOLD #255. Isolated, draft-only research.**
**Do not merge, deploy or change existing production/staging.**
**Exact inherited verified parent:** Mission 3 durable private capture PR #805, SHA `103b4be39655fa2fb2ef182a412222d769fe5eee`, [CI #42926915682](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42926915682) passed 1,378 Node tests and mobile Chromium/WebKit acceptance with synthetic owners.

## Reason for independent milestone

The legacy cloud encoder transformed any plausible JPEG to a private content-addressed object based on newly computed bytes, without verifying **preexisting** source-image SHA receipts. A corrupted `originalPhoto.image` / `originalPhoto.sha256` or reviewed `segmentHint.cutoutImage` / `cutoutSHA256` could be uploaded and published as a valid-looking private backup with contradictory original/source evidence. Decoder compared remote Storage bytes against the SHA in the new object path, but not necessarily against an original-photo receipt carried inside the wardrobe metadata. The resulting cloud record could silently misrepresent what the owner originally photographed.

## Implementation

- Before encoding or decoding, validate any item explicitly marked `sourceHashVerified===true`: `sourceSHA256` must be a 64-character SHA-256 and equal `originalPhoto.sha256`.
- For a `segmentHint` explicitly marked `verified===true` and `ownerReviewedInstance===true`, require consistency between its source/cutout SHA receipts and the parent saved garment's source/cutout SHA.
- During private cloud encoding of each `originalPhoto.image` or `segmentHint.cutoutImage`, recompute SHA-256 of actual JPEG bytes and reject a mismatched preexisting receipt **before any object upload or cloud RPC**.
- During private cloud decoding of each `originalPhoto.image`, check its claimed SHA against the owner-bound Storage object SHA before restoring local IndexedDB. Existing cutout SHA checks from PR #803 are preserved.
- Keep genuinely unverified old JPEGs supported without inventing a signed or human-approved receipt. No change to automatic recognition review, 3D cloth, authentication, Supabase RLS, or cloud owner transport. Existing session/owner leases still apply.

## Test evidence policy

New `tests/mission3-cloud-source-receipts.test.cjs` uses only synthetic owner UUID, fake IndexedDB, deterministic JPEG bytes, and controlled in-memory cloud endpoints. At the exact parent it must reproduce acceptance of contradictory SHA receipts, and at the new commit it must reject them with no cloud revision and no local garment deletion. Positive controls must show unchanged valid referenced original and cutout JPEGs still back up, and old non-attested image remains restore-compatible.

No-deploy CI `.github/workflows/mission3-cloud-source-receipts-no-deploy.yml` must pass exact-parent comparator, repaired test, full serial Node suite, genuine Chromium synthetic-owner backup/restore, Chromium/WebKit 320/390/430 canonical native capture→manual review→private closet→styling, and mobile storage/accessibility before this milestone can be called verified.

## Remaining whole Mission 3 completion gates

- Physical Android Chrome and iPhone Safari camera, background/OS termination, quota and high memory pressure acceptance.
- True hosted Supabase JWT/RLS/Storage cross-owner rejection using approved test accounts in an isolated hosted test project, and real interrupted network restore.
- End-to-end large real-owner photo wardrobe memory, storage, and recoverability; user-approved final integration of parallel 1/2 and full release QA.
- Family Alpha HOLD #255 remains active; no live customer data or staged/production modification.

**This report is a resumable engineering checkpoint, not a claim that the entire mobile app is 100% complete.**
