# Parallel #76 — garment color evidence (research only)

Issue: https://github.com/nickhaney916-lang/Closet-Current/issues/954

Pinned compatible parent: Mission 1 P846 cadc619c29db4e0447dbef0638c6f6e1a91311a6
Branch: research/parallel76-mask-aware-garment-color-20261112-HOLD
Release: **FAMILY ALPHA HOLD #255 — OPEN. NO MERGE, NO DEPLOY.**

## Original behavior and reproduced weaknesses

The original public/photo-color.js maps RGB to basic HSV-style families. It counts every retained sampled mask pixel equally, including isolated shadows and specular highlights. Its uncalibrated threshold rules classify constructed dark-navy RGB (10,24,53) as Black and warm-offwhite RGB (239,232,218) as White. These are deliberately constructed *numeric fixtures*, not human-annotated photographs or verified color accuracy.

The existing outfit worker extracts original JPEG pixel samples from the existing semantic clothing mask; the app normally displays a tentative photo color that must be confirmed by the owner. The research branch does not modify default color behavior.

## New bounded research module

- public/garment-color-76.mjs separately samples existing garment-mask interior directly from already-decoded original images, with 1024-pixel maximum and a one-pixel boundary erosion where enough interior exists. Validates image buffers and mask dimensions, ignores low alpha and abstains on tiny, sparse and thin regions.
- Detects dark saturated blue hues otherwise called Black, preserves legitimate solid Black and White, distinguishes warm off-white from neutral White and downweights minority shadow and highlight components without deleting true two-tone prints.
- Returns primary and secondary *suggestions*, a meaningful-second-color flag, counted pixel support, explicit abstention/review reasons, and original photo SHA-256 + exact mask SHA-256 + owner and request bindings. Pixel support is **not a calibrated probability**.
- public/outfit-worker.mjs enables only under both color76=true and existing instanceReview70=true; original pixels and source SHA-256 remain authoritative; no new decoding or network upload and no change to the legacy colorEstimate field.
- public/outfit-capture.js enables only when URL flags outfitInstances840=1, outfitUnits70=1 and color76=1 are all present. Strict owner/request/original/mask equality must hold. Mismatch becomes manual review. Suggestions are read-only and explicitly **NOT applied**, with the existing manual Adjust and mandatory owner acknowledgement handling actual writes.
- No learner updates or automatic ownership, shoe pairing, field confirmation, storage mutation or background recoloring.

## Test plan and falsifiable evidence

- tests/parallel76-garment-color.test.mjs exercises source-level edge erosion, masks, blue-denim/black, beige/off-white, solid true black/white, multicolor, alpha, glare/shadow, malformed input, tiny regions, stale owner/photo/mask/request, and default disabled code.
- scripts/compare-parallel76-color.mjs prints frozen before/after results for 12 *synthetic* RGB/mask fixtures and per-case runtime, coverage and abstentions. These must NOT be described as human-label accuracy.
- scripts/test-parallel76-color-browser.mjs uses actual Chromium and WebKit at CSS widths 320/390/430 with synthetic image and worker fixtures, review controls and no private writes. These are not physical phones or real SegFormer inference.
- scripts/audit-parallel76-lawful-sources.mjs SHA-checks 4 publicly licensed immutable originals from benchmark/locked-photo-sources.json. No garment instance masks or human per-instance color labels may be fabricated; no photos are uploaded as CI artifacts.
- Strict pinned-parent changed-file allowlist, full Node regressions, browser review cases and no-deploy GitHub Actions workflow required.

## Evidence boundaries

As supplied by assignment #75, no newly independently human-rated per-garment masks and color answers are available. Therefore *independent real-photo garment primary/secondary color accuracy before and after is UNKNOWN*. Sealed blind acceptance count is 0. Constructed fixture outputs and real-original SHA-256 checks are **descriptive diagnostics only**. The current proposal always requires owner review; it is not a claim of 10/10 accuracy.

## Integration handoff

Keep the experiment disabled for normal users. Mission 1, #68, #71 and #75 must establish genuinely independent source-disjoint masks and per-instance color labels, prospective color-by-color confusion matrices, false-confident proposal rates, coverage and runtime on the same genuine source photos before promotion. #73 owns retake advice, #72 owns consented correction learning; no model training here. Independently verify physical Android Chrome / iPhone Safari and signed-owner privacy before release.

**Scope invariant:** untouched production/main, staging, hosted Supabase, private wardrobes, other assignment branches; Family Alpha HOLD #255 remains OPEN.
