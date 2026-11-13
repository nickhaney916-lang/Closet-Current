# Parallel #80 — Real public photo pre-inference quality gate, browser acceptance

**FAMILY ALPHA HOLD #255 OPEN. Draft, unmerged, undeployed.**

## Engineering objective

The verified [P80 #990](https://github.com/nickhaney916-lang/Closet-Current/pull/990) protects the owner-reviewed subtype path with a **before-inference** quality gate. Previously, the actual Adjust UI was exercised on generated graphics. This follow-up tests the genuine `mountSubtype80` panel (the same imported module used by the app, not a copy) against **actual, previously public development-exposed licensed clothing JPEGs** at 320/390/430 CSS-pixel viewport widths in desktop Chromium and WebKit.

This work stacks on [P80 real source-revision #999](https://github.com/nickhaney916-lang/Closet-Current/pull/999) immutable HEAD `0e95d71c8d3c37abb86cd32b148d199be0abe46f`. That parent already tested real pinned FashionCLIP on three public originals and three transformed photos, complete 47-label scores, old input lease revocation, changed recognition SHA and safe Unknown decisions. This update addresses a different question: **does the real UI avoid requesting inference in the first place when real decoded input pixels are unusable?**

## Deterministic and reproducible test

Use three source-locked Wikimedia Commons **development-exposed** JPEG IDs: `commons-0033`, `commons-0041`, `commons-0088`, downloaded only by the existing frozen-manifest source verifier. Recompute each SHA-256 before using any image and again afterwards. These are not novel training/validation data or independently curated subtype labels.

For each original, generate three local-only, clearly labeled **synthetic transformations of real photographs**: (1) severe 96% darkening by a black pixel overlay on decoded JPEG, (2) an undersized 96 × 128 JPEG, and (3) a cropped 320 × 400 JPEG with **explicit source `segmentHint.clipped=true` metadata**. The third case does **not** claim the code detects clipped edges from pixels alone. Keep `item.image` and `item.originalPhoto.image` the original exact byte-identical JPEG; only `item.recognitionPhoto.image` changes.

Mount the actual `public/subtype-panel-80.mjs` under a simulated owner, explicitly tick the same consent and visible-detail controls and invoke the panel's subtype check. The inference callback is an observable fail-on-call spy, not a model scorer. Verify the UI status includes **'No model comparison was requested'**; item type remains Unknown; no proposal chosen, saved, learned or uploaded; panel remains valid and unmodified, then closes correctly. Also verify no external network request and no layout-independent source mutation. All tests run in real browsers with the actual image decoding and quality preflight code.

**Expected evidence:** 3 originals × 3 transformations × 2 desktop engines × 3 viewport widths = **54 browser policy cases**. This is 54 repetitions of 9 transformed test inputs under browser/viewports, *not* 54 independent garment photographs. Report correct denominators and do not claim photo classification accuracy, image sharpness calibration, or mobile performance.

## No-deploy scope

Only one new test script, this report, and the isolated P80 no-deploy workflow (restricted allowlist increased 15→17 paths). Strict ancestor `29d1905172ab21a277021ac40333174e70879a0d`, unchanged native/smoke workflows, real FashionCLIP worker jobs, source SHA custody, and original public/private boundary controls remain enforced. No default app / model / scorer / taxonomy / production / staging / hosted data change.

## To reproduce

```bash
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install --with-deps chromium webkit
node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json benchmark/photos commons-0033,commons-0041,commons-0088
node scripts/test-p80-real-photo-panel-preflight.mjs
```

**Known release blockers remain:** zero source-disjoint independently adjudicated human real-photo subtype labels/masks, zero physical Android Chrome or iPhone Safari, zero signed two-owner private cloud acceptance, prior 32-photo historical auto-index expectations failing in a separate workflow. No claimed 10/10 recognition or new measured accuracy; Family Alpha HOLD #255 remains OPEN and P851 gate BLOCKED. The source rights / reviewer approval pipeline belongs to #75/#79; controller Mission 1 must separately integrate evidence and decide release. Exact-head CI must be verified before labeling this change successful.
