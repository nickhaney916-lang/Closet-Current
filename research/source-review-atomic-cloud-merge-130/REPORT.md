# Closet Current — Priority #130 / SOURCE-REVIEW-ATOMIC-CLOUD-MERGE-130

**MAIN DEVELOPMENT — RESEARCH ONLY · Family Alpha GitHub Issue #255 HOLD · NO MERGE OR DEPLOY · production and existing staging untouched.**

## Parent and ownership boundary

Pinned independently verified Priority #128, draft [PR #683](https://github.com/nickhaney916-lang/Closet-Current/pull/683), exact green HEAD `caccf49bbcf5512122f981debb111f723d7385ac`, [Actions #42334871474](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42334871474): 1,149/1,149 Node, 8/8 **disposable real PostgreSQL** owner RLS, 6/6 real native app mobile-sized Chromium/WebKit 320/390/430 viewport cases with 93 screenshots. Still no genuine signed remote Supabase accounts or physical devices independently verified.

Parallel Work Assignment #51 owns the distinct Priority #129 **gated cloud integration and signed-account acceptance**; main development's **#130** is a conflict-resolution safety prerequisite and independent research delivery. Do not modify #51, production, existing staging or other projects.

## Demonstrated defect

`public/cloud-backup-engine.js.mergeDocuments` implements generic recursive 3-way per-field JSON merging. If device A re-reviews color on photographed source A at item ID X, while device B independently replaces ID X with a different, separately genuine and owner-reviewed original+cutout source B but retains the old color, the generic merge **can produce source B with device A's color reviewed for source A**.

Both original and cutout image SHA-256 digests of source B can match perfectly, and the merged row may still pass Priority #126 integrity validation. Byte-level identity alone **does not prove that the human-approved label belongs to that photo**. The unsafe merge is therefore a semantic **review-to-source provenance mismatch**, not a JPEG hash failure.

P130's genuine licensed two-photo test explicitly demonstrates this unsafe existing merger's output and then proves the new gated merger rejects it.

## Actual research engineering

New `research/source-review-atomic-cloud-merge-130/reviewed-source-merge.mjs` exports `reconcileReviewedCloud130({base,local,remote,ownerId,assertLease})`:

- Research-only **candidate preflight**, with **NO cloud writes**, **NO alternate database writer**, NO change to the existing public merger, no real signed JWT claims.
- Clones the entire three-device snapshot **before any async JPEG digests**, checking an active authenticated owner lease and decoded P126 double-JPEG SHA + reviewed owner-provenance of each supplied device document, including base when present.
- Rejects owner-unbound or foreign documents and nested foreign-owner metadata.
- Treats original JPEG, independent reviewed cutout, both SHA/source identities, owner/color/category/type/source review provenance, approval flags and all unknown future garment fields as a **single protected review core**. Only an explicit small safe presentation metadata allowlist (notes, seasons, occasion, brand, size, material) can be concurrently merged independently.
- **Refuses a source photo/cutout replacement concurrent with ANY edit to that same garment**, even notes. Refuses separate concurrent changes to the same protected review core, and incompatible new garments reusing a new ID.
- Permits independent edits of safe adornment metadata and unrelated garments; keeps exact saved outfit board references, even deliberately unresolved historic garment references.
- Runs the existing generic merge only after the new review/source conflict guard. After merging, checks each resulting item's protected review core matches a **complete source snapshot explicitly present in base, local, or remote**. A synthesized hybrid would fail closed.
- Runs P126 full original+cutout owner-review SHA validation on the final merged decoded cloud candidate and rechecks the owner session before returning a non-write receipt.
- Failures carry only item IDs and generic reason, never original/cutout images or passwords. Cloud CAS/signed JWT and any actual persistence are deliberately left to a separately authorized owner-specific integration.

No visible consumer UI is changed. Refusal is **not auto-resolution or duplicate creation**: owner must explicitly review the conflict in a future gated integration.

## Independent genuine-photo tests

New `tests/source-review-atomic-cloud-merge-130.test.mjs` creates **two different locked licensed Commons JPEG originals**, uses Sharp to generate two distinct legitimate JPEG cutouts with actual separate SHA digests, and saves both using the actual P119 human-reviewed private IndexedDB code. Tests verify:

1. Existing generic cloud JSON merge can attach a device-A color to a wholly different device-B independently valid original+cutout photograph; **both hashes can still pass**.
2. The new source-review atomic guard rejects that hybrid instead of admitting it as reviewed.
3. Independent safe notes/occasion edits merge without source changes, preserving exact metadata and existing saved outfit references.
4. A genuine owner-reviewed color change and independent note change to the **same original/cutout bytes** can merge safely.
5. Concurrent category/type and color review edits fail closed without silently composing a new claim.
6. A valid source replacement concurrent with any same-garment edit fails closed; an uncontested replacement succeeds with its complete own source/review.
7. Unrelated independently added reviewed garments and missing historical outfit references are preserved; colliding new IDs fail closed.
8. Modified original/crop SHA, withdrawn review, false 3D certification and cross-owner ID attempts fail before merge.
9. Session revocation during asynchronous JPEG proof refuses candidate; caller-mutated source is isolated by early cloning.
10. Every result is clearly a research candidate, not an actual cloud save, authenticated JWT/RLS claim, or Family Alpha release.

## CI and limits

**Dedicated no-deploy CI must pin exact green P128 parent and guard exactly four changed research files**: new merge adapter, new Node tests, this report, registered workflow only. Run targeted P119–P130 checks, complete Node suite, inherited disposable PostgreSQL owner-RLS checks and inherited six real native app Chromium/WebKit mobile viewport cases with 93 actual screenshots.

**Exact-head final test status: PENDING**. Never mark the priority verified until final exact-head dedicated jobs are green.

Important inherited browser/real PostgreSQL runs are **regression tests**, not newly added in-browser cloud-merger UX, real signed remote accounts, learned model segmentation or physical-phone acceptance. P130 is a pure research preflight; #129 parallel integration remains responsible for actual research-gated cloud workflow and signed-account validation.

**Family Alpha #255 HOLD · Draft and unmerged PR only · No deployment · Production and existing staging untouched.**
