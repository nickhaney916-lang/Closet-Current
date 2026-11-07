# Closet Current — Priority #126 / REVIEWED-CUTOUT-ATOMIC-RESTORE-126

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · NO MERGE OR DEPLOY · production and existing staging must not change.**

## Pinned verified parent and precise gap

P125 main-controller [draft PR #680](https://github.com/nickhaney916-lang/Closet-Current/pull/680), exact SHA `034d6c7db24d98df5d2ba14a73e84b948ecf1c64`, [exact-head green Actions #42329203773](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42329203773), 1,125/1,125 inherited+new Node tests, 6/6 real Chromium/WebKit browser mobile viewports 320/390/430 with 75 JPEG-backed screenshots.

The research-only RESTORE-ATOMIC-01 V4 backup validator cryptographically verified fields named `image`, including originalPhoto.image, but **did not verify nested `segmentHint.cutoutImage` JPEG bytes against the independent saved `cutoutSHA256`**. Consequently a syntactically valid, tampered cutout could survive the V4 restore preflight, atomically overwrite the valid owner wardrobe and later become rejected by Style03. Further, `restoreOwner01` previously validated the mutable caller's backup during asynchronous SHA work then cloned the caller-supplied backup **after** verification, allowing a modified payload to be committed after its earlier image hash check.

## Actual engineering fix, only on this child research branch

`research/restore-atomic-01/atomic-restore.mjs`:

- Reuses the approved, strict P124 **`reviewedSourceBoundCutout124` metadata gate** for any row that claims a reviewed source-bound cutout; this includes the precise P119 human-reviewed source, explicit owner correction, original SHA and distinct secondary cutout SHA, human-reviewed instance, and photo-only/no fabricated 3D requirement.
- New exported `verifyReviewedCutouts126(value,{ownerId})` separately reads the nested cutout JPEG, independently rehashes its actual bytes, and compares against the exact saved secondary SHA. The full original JPEG is still hashed through existing original `image` validation. A valid original does **not** excuse missing, malformed, changed or fake cutout evidence. Partial/unreviewed cutouts cannot inherit approved source-verified styling.
- Applies the new cutout check consistently to **V4 owner file backups and shape-valid cloud-mode documents** via `validateRestore01`. Returns a non-sensitive count `reviewedCutoutJPEGsVerified` in the preflight receipt.
- Crucially clones the entire owner backup **before** awaiting the original/cutout hashes in `restoreOwner01`. The exact same immutable local snapshot (not a later caller mutation) is used for CAS-guarded single-transaction replacement.
- Preserves unrelated legacy wardrobe item data and unknown future metadata without reencoding photos or changing the existing outfit IDs. The P125 live owner lease and P124 SHA-verified Style roster remain unchanged. No new writer, authenticated cloud, 3D fitting, consumer default, staging or production modifications.

## Evidence, tests and adversarial conditions

New `tests/reviewed-cutout-atomic-restore-126.test.mjs` uses a **real licensed JPEG fixture** with independent source SHA, a **separately encoded valid JPEG crop** with its own SHA, real P119 human-reviewed original+crop private IndexedDB atomic commit, and genuine RESTORE01 V4 export/import.

Tests verify:

1. Valid original+reviewed cutout passes both byte-level SHA checks, retaining the source and review metadata.
2. 20+ forged/missing owner/color/category/provenance/hash/instance fields and an **alternate valid JPEG crop with outdated SHA** fail preflight, never silently replace or downgrade the original.
3. Actual `restoreOwner01` rejects tampered cutouts before IndexedDB state changes, with exact original wardrobe and saved outfits untouched.
4. Simulated data loss then atomic restore/reopen rehydrates exact original and derived JPEG bytes, corrected owner-reviewed garment labels, source SHA, missing historical outfit refs, and correctly marks cloud dirty without claiming remote cloud acceptance; the restored genuine cutout can be rehashed again by Style03 and remains **2D only**.
5. Wrong-owner V4 backup is rejected; legacy non-cutout files remain valid without receiving a new cutout certification.
6. Fault injection suspends the async digest and changes the caller's backup cutout, SHA and color mid-validation. The actual committed row must match the **originally cloned, independently hashed snapshot**, not the later unverified caller changes.

The dedicated exact-head no-deploy workflow enforces an exact green P125 pinned parent, allows **only four files** (restore module, P126 Node test, this report and inherited registered research-only workflow), and runs complete inherited Node, target P119/P124/P125/P126 tests and the unchanged real-app P124 six-case Playwright Chromium/WebKit 320/390/430 screenshot matrix. Browser tests are **inherited original/cutout styling regressions**, not a false claim of browser-tested P126 file-restore UX. The new P126 genuine IndexedDB restore integration is Node-based; physical Android/iPhone file picker and camera sensors are not tested.

**Exact final-head verification:** pending full GitHub Actions checks. Do not claim verification until both dedicated no-deploy jobs PASS on final exact branch SHA.

## Honest release limits

JPG source SHA and cutout SHA establish **byte identity only**, not meaningful learned garment segmentation, color/subtype scientific accuracy, independent human-review authenticity, 3D garment reconstruction, physical-phone use, authenticated remote JWT/RLS, or safe production cloud backup. No real cloud accounts or photos accessed. Parallel recognition, cloud-security and dual-humanoid research remains independent and held.

**Family Alpha Issue #255 HOLD · draft PR open/unmerged · production and existing staging untouched · never deploy.**
