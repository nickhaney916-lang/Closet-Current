# COLOR-CONFIDENCE-SAFETY-19 — correct unsafe automatic color acceptance (DRAFT/HOLD)

**Main controller** owns this isolated color-field safety priority. Parallel #25 owns subtype recognition; Parallel #26 owns segmentation diversity; Work #27 owns full app integration. No other application modules, 3D, model, photo originals, index, auth/cloud or deployment change. Forked from PR #571 exact immutable SHA `0236182f72b29a7b4d4924f0b3f5754cb9956690`.

## Reproduced defect

`public/photo-color.js` returns a plausible color with `needsConfirmation:true` when full-scene colors conflict (e.g., black/white split or weak color). `public/photo-check.js` exposes that actual 16×16 browser canvas estimate as `quality.colorEstimate`, which the actual `public/app.js` passes into `ClothingDetails.fillColor`. Previously, the latter ignored `needsConfirmation` and silently copied the ambiguous color as an ordinary `photo-estimate` item value. This undermined the promised user review flow and category+color acceptance gate.

## Surgical implementation

**`public/clothing-details.js`** now returns the original item unchanged for `needsConfirmation:true`, unknown/malformed confidence flags, invalid numeric supports, unknown color names, or already selected/confirmed colors. Correct confident photo estimates still fill the color. Source SHA, original JPEG, owner and user correction records remain untouched; do not automatically call uncertain labels verified.

**`tests/color-confidence-safety-19.test.cjs`** checks real `PhotoColor.estimate` and `PhotoColor.maskedPalette` outcomes on deliberately constructed photos, consumer `public/app.js` handoff, confirmed colors, retained source record and malformed confidence. The tests are regression/safety checks, not colored garment photo accuracy metrics.

**`scripts/test-color-confidence-19-real-photo.mjs`** obtains six different existing licensed Commons JPEGs from `benchmark/locked-photo-sources.json` and asserts exact original byte SHA-256 against the existing lock. It exercises **actual production `checkPhoto`** 16×16 browser canvas estimation and the shared `ClothingDetails.fillColor` application path inside real Chromium and WebKit, at the three phone browser widths 320/390/430. Twelve actual photo+engine runs, six screenshots. It blocks all external browser requests and asserts zero external photo uploads. No saved user closet or customer images.

**`scripts/audit-color-confidence-19.mjs`** independently verifies sources, exact screenshot SHA, no browser errors, no unconfirmed colors silently accepted and provenance. Dedicated GitHub Actions workflow locks modified files to this small research change, builds the app, runs full inherited Node suite, real browser originals and independent audit; uploads only licensed original preview screenshots and sanitized result JSON.

### Scientific and release limits

The original Commons titles provide **source-declared color hints ONLY**. They are not independently human-reviewed primary-garment-color labels; image backgrounds and multicolored fabrics may dominate 16×16 full-scene samples. Do **not** infer per-color precision, garment color accuracy, 95% category+color frozen-set pilot threshold, or external photo generalization from this test. The expected metric is **0 uncertain photo color estimates auto-filled**, plus intact confident auto-fill and user corrections. Real signed owner A/B cloud, physical Android/iPhone, and original clothing 3D realism remain unverified.

Photos are licensed and attributed through their existing Commons entries; no user photographs enter GitHub artifacts. The first three photo screenshots from each engine are included only as manually reviewable browser evidence; real color output is stated as estimate, not fact. Explicit human confirmation still required when uncertain.

## Reproduce and acceptance

Run `node --test tests/color-confidence-safety-19.test.cjs`, then `npm install --no-save --no-package-lock playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2`, `node scripts/build.mjs && node --test tests/*.test.cjs tests/*.test.mjs`, then `node scripts/test-color-confidence-19-real-photo.mjs && node scripts/audit-color-confidence-19.mjs`.

**Research result:** Safe handling of uncertain color estimates can be accepted only if all exact-HEAD tests and photo observations pass. The true color accuracy quality gate remains UNVERIFIED pending a new, independently labeled frozen phone-photo set. **Family Alpha #255 HOLD. Do not merge or deploy.**