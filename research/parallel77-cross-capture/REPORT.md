# Parallel #77 — Cross-capture source-safe duplicate suggestions

**Tracking:** Issue #959 — https://github.com/nickhaney916-lang/Closet-Current/issues/959

**Pinned compatible parent:** Mission 1 P847 draft PR #957, SHA bb524ab4b52437f97db30ba9030c69fbcf0f4835 (previously verified 3/3 no-deploy CI).  
**Branch:** research/parallel77-owner-verified-cross-capture-duplicate-20261112-HOLD  
**Release:** **FAMILY ALPHA HOLD #255 OPEN**. Draft / unmerged / undeployed. No production, staging, hosted Supabase or real wardrobe modifications.

## Confirmed weakness

The baseline public/photo-check.js samples 16×16 RGB and compares mean absolute error to 2.5. public/app.js requires near-identical aspect ratio and displays a generic Check duplicate warning. This is not evidence that a photo is the same physical item; two lookalikes can match and lighting/viewpoint change can miss a genuine repeat photograph.

PR #536 studied source-safe wardrobe indexing, while PR #220 guarded duplicate wardrobe IDs and saved-outfit references. Neither constitutes an approved cross-capture multi-view merge. Within-photo shoe reconciliation remains P846/#70's responsibility.

## Implemented research scope

- public/cross-capture-duplicate-77.js: read-only ranker over at most 1,200 bounded descriptors, maximum three candidates. It uses available 512-feature same-model evidence when compatible, conservative low-information abstention for unsupported RGB-only matches, and optional bounded 64×64 structural descriptors. A score is never a physical-item identity assertion.
- Top candidates are source-verified using SHA-256 of original JPEG bytes, displayed crop, mask and full record revision. Source preference is originalPhoto.image, then recognitionPhoto.image, then image. Owner ID, fresh session lease, item ID/revision, prior P846 source/mask provenance and the chosen action are bound in an ephemeral one-time receipt. Different masks from one source cannot be cross-capture links.
- public/index.html and public/app.js: experimental review OFF BY DEFAULT, enabled only by ?crossCapture77=1 on this research branch. It operates inside the existing P843 Adjust editor, matches exact current authenticated user and per-owner local IndexedDB name, and shows one verified shortlist candidate with side-by-side incoming and saved photographs.
- Four accessible review choices require an additional explicit acknowledgement identifying the exact owned item: Same owned garment — request extra view; Different garment — keep both; Review later; Remove unsaved photo. The same-item response makes an **unlinked, unpersisted pending intent**, never a save, merge, delete, photo replacement or new wardrobe unit. Different-item confirmation still must pass the independent P843 photo and color/category approval and P844 guarded write. Review later retains the unsaved draft; remove calls existing owner-controlled draft removal.
- Any owner, session, source, mask, crop, saved item revision or draft change invalidates the receipt. No network request, hosted upload, private photo log or cloud schema change exists. P845 quality advice, P846 shoe pairing, P847 independent consented correction learning and existing saved outfits are untouched.

## Explicit blocker: persistent multi-view storage is NOT implemented

Cross-tab owner-locked compare-and-swap, signed session revocation, atomic item-view append plus draft removal, recovery after quota abort, export/import and cloud 3-way merge conflicts are not yet proven together. Saving alternateViews as an ordinary item field could duplicate inventory, overwrite original photos or corrupt references on account switch/restore. The safe choice is to leave same-item decisions as **unlinked unsaved proposals**. No claim of atomic undo or multi-view persistence is made.

Future Mission 3/1 integration requires a versioned alternateViews array, immutable original and per-view SHA/mask receipt, one owner-validated IndexedDB transaction, cross-tab revision lease, durable reversible undo, duplicate import/restore tests, quota failures and protected cloud merge logic. P843 approval, P846 shoe pairing and P847 consent must never authorize this action implicitly.

## Reproduction

    node --test tests/parallel77-cross-capture.test.cjs
    node scripts/benchmark-parallel77-cross-capture.mjs
    node scripts/build.mjs
    node scripts/build-m1-no-account-trial-831.mjs
    node --test --test-concurrency=1 tests/*.cjs tests/*.mjs

With Playwright 1.56.1 and Chromium/WebKit:

    node scripts/test-parallel77-cross-capture-browser.mjs
    node scripts/test-m1-owner-learning-integration-847.mjs
    node scripts/test-m1-owner-pair-admission-846.mjs
    node scripts/test-m1-review-save-lifecycle-844.mjs parent
    node scripts/test-m1-review-first-default-843.mjs

The isolated eight-path NO DEPLOY workflow checks immutable P847 ancestry, protected-file allowlist, exact source gate, all Node tests and two builds, source-executed Chrome/WebKit at 320/390/430 CSS pixels, inherited owner/shoe/learning tests, and existing licensed-original JPEG SHA receipts. CI result and exact HEAD must be verified after each push; a queued run is not a pass.

## Before/after measurement methodology

The deterministic synthetic benchmark uses 20 **artificial** queries at each closet size 100, 500 and 1,000: ten assigned same-vector profiles under a simulated exposure change, and ten distinct profiles with identical flat RGB samples. It logs the old 16×16 baseline candidate alert counts, revised top-1/top-3 retrieval, new lookalike alerts and abstentions, shortlist size, actual Node wall-clock proxy duration, a conservative descriptor metadata byte estimate, and zero source JPEG decode calls during index-only ranking. The synthetic 512-feature vectors are **not FashionCLIP vectors**, and the simulated labels are **not independent human ground truth**. No real-item accuracy percentage may be extrapolated from this.

Independent real-photo same-physical-garment accuracy: **UNKNOWN — 0 independently labeled blind paired views**. Existing 11 publicly licensed source SHA controls establish photograph provenance only, NOT physical-item pair identity. Physical Android Chrome / iPhone Safari devices tested: **0**. Hosted signed two-owner cloud, cross-tab atomic writes, reversible multi-view persistence and restore safety: **not proven**.

## Follow-up hardening audit — owner scope and stale-item protection

The initial draft sorted all candidate descriptors before verifying individual
owner aliases; with top-k=1 a cross-owner vector could displace the rightful
owner's candidate. The revised source filters **before** ranking and accepts
explicit ownerId, userId and accountId aliases only if every populated identity
agrees with the exact live scoped owner. Older records without explicit owner
fields remain eligible **only** through the currently authenticated
`closet-current-user-<owner>` local database/collection; a mixed-owner database
is not an authorized source. Foreign record IDs, photographs and scores cannot
enter a source-verified proposal, even indirectly via shortlist displacement.

The live Adjust adapter additionally supplies callbacks to confirm that both
the saved candidate *object* and the pending draft still exist in their current
owner-scoped arrays. Removal/replacement between proposal and decision now
invalidates the one-shot receipt. The comparison's two images are sourced from
the original JPEG preference instead of a possibly cropped display image.
Additional deterministic tests cover top-one foreign-descriptor crowding,
foreign userId/accountId aliases, and removed-item or removed-draft decisions.
No sibling branches, photo bytes, cloud records or deployment configuration
were changed.

This is a conservative research safeguard, **not** cross-tab/restore
atomicity: imported clones of old records, browser tab races, revoked signed
leases, and real cloud merges still require an authoritative atomic adapter
and independent verification before saving an extra view. No new genuine
human-labeled physical-item photographs were introduced by this audit.

## Integration boundaries and recommendation

Assignments #67–#76 keep ownership of classifier, segmentation, workers, within-photo shoe units, blind recognition accuracy, learning, quality, batch review, human labels and colors. Their branches and hosted/private data are untouched. The comparison reads only existing optional compatible metadata and tests against P847's known baseline.

**Recommendation:** Keep this feature as a draft OFF by default; DO NOT deploy, merge or invite Family Alpha based on this research. Obtain #75's independently human-labeled same physical garments from distinct captures and verify a separate atomic multi-view adapter with cloud conflict tests before enabling persistence. **FAMILY ALPHA HOLD #255 OPEN**.
