# Closet Current — Mission 1 P842: source-level automatic inventory admission safeguard

**FAMILY ALPHA HOLD #255 — DRAFT / UNMERGED / UNDEPLOYED / NO STAGING OR PRODUCTION.** No hosted Supabase, owner accounts, private wardrobes, personal photos, model weights, inference implementation or other missions modified.

## Exact research parent

P841 [draft PR #926](https://github.com/nickhaney916-lang/Closet-Current/pull/926), exact pinned SHA `899f1962d53546ec15ff62e8af3a1bcbf937dbdb`. P841 itself directly descends from pinned P840 `c44166443e52ac7487ea84d8218098ff629610d2`. P842 changes public/app.js, source-executed tests, the original automatic-indexing regression expectations, report, and no-deploy CI (five scoped paths). No merges or deployments.

## Verified source defect at P841 parent (not an independently measured real-photo error rate)

1. `recognizeItem` identifies `corePartial` when the worker has **only confirmed a broad category**, with subtype `Unknown`. If a color estimate exists, the category-only branch could continue to automatic `saveIndexed` despite lacking owner subtype evaluation. The P836 review-first switch was off by default.
2. `saveIndexed` only checked batch membership, `userAdjusted`, and `requiresOwnershipConfirmation` before inserting into `items`. It did not independently check recognized category and meaningful color, unsafe segmentation, duplicates, outfit source, or the P836 review-first research switch.
3. The `mission1SubtypeSafety.ownerSubtypeReviewRequired` diagnostic was retained in `recognitionDiagnostics`, but not directly copied to the strong-result storage-admission state at this path. The model's `strong` flag must not override an explicit risk diagnostic.

## P842 narrowly scoped implementation

- `corePartial` always ends in an **unsaved draft with owner confirmation required**, including a broad category plus plausible estimated color.
- Any subtype safety diagnostic requiring review becomes `item.requiresOwnershipConfirmation=true` even if the worker reports `strong`.
- Shared `automaticAdmissionCore842` refuses missing/unknown/unsupported categories, empty or case-insensitive Unknown colors, missing source image, duplicate suspicion, owner-review requirements, unverified outfit source, or clipped segmentation. This is applied before presenting the saving status AND again in the `saveIndexed` storage transaction.
- The storage boundary independently refuses direct indexing in `reviewFirst836=1` research trial, even when a caller attempts to invoke `saveIndexed` directly. Existing manually confirmed Adjust storage path is separate and remains under P841.
- Strong complete unflagged results may still use the **legacy auto-save path when P836 research trial is OFF**. This is **not** a blanket no-wrong-save guarantee. Keep HOLD; further validation is necessary before any Family Alpha trial.

## Acceptance testing

`tests/mission1-automatic-admission-842.test.cjs` extracts and executes the **actual** `automaticAdmissionCore842`, `saveIndexed` and `recognizeItem` function bodies from `public/app.js` in Node's VM with controlled in-memory transaction/AI stubs. Cases include legitimate strong suggestions, category-only strong-color guesses, unsupported category, blank/mixed-case Unknown color, no source, suspected duplicate, clipped mask, outfit owner-review flag, diagnostic risk overriding model strength, and review-first caller bypass. All negative cases assert **zero committed items** and preserved pending draft. The inherited automatic-indexing suite now checks that category-only color estimates remain in owner review rather than expecting silent save. Native tests are not real image inference.

A dedicated no-deploy GitHub Actions job checks exact P841 ancestry and a strict five-path allowlist, validates syntax, runs focused actual-source tests, native app and no-account research builds, and the full Node regression suite. A second job executes the existing P841 actual Adjust editor test in genuine headless Chromium and WebKit at **320/390/430 CSS widths**. These scripted browsers are **not** physical Android/iPhone acceptance.

### Evidence and remaining gates

Verification status is **PENDING** until the final exact-head CI run is complete and independently checked. Do not claim any specific measured real-photo accuracy, run count or pass yet.

P842 does **not** retrain FashionCLIP, remeasure segmentation accuracy, pair shoe regions or evaluate a new human-labeled original-photo benchmark. Those remain Parallel #67/#68/#70/#71 responsibilities. Physical Android Chrome and iPhone Safari, true pair-unit counts and owner-private cloud signed acceptance are also outstanding. Family Alpha HOLD #255 remains **OPEN**.

## Debugging trail

First exact-head no-deploy run [#43293445820](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43293445820) failed 1/8 source-executed tests due only to a synthetic test fixture `persistDraft` callback using a missing `this` receiver; 7/8 passed. The fixture was repaired. An inherited camera/indexing workflow identified a real VM integration issue: unlike full `app.js`, the harness loads the canonical `clothingSchema` independently and does not load the app-global `categories`. The new guard now validates against the canonical taxonomy with a VM-safe fallback. Its outdated category-only auto-save assertions have been updated to the new explicit-review policy. Exact-head complete no-deploy run must pass before declaring P842 verified.
