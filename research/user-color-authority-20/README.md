# USER-COLOR-AUTHORITY-20 — protect manually confirmed and deliberately cleared color

**Main-controller research branch only.** Parent PR #576 exact final verified source SHA `55c1d3027be4761963578c014c9220eedac43ce3`. PR #576 fixed a different color bug: automatic photo estimates marked `needsConfirmation:true` were being silently filled. This follow-up fixes the remaining **explicit human correction authority** gap. It does not duplicate Parallel #25 subtype tuning, Parallel #26 segmentation, or Work #27 full consumer integration.

## Actual source-grounded defect

`public/app.js` marks a manually entered garment color with `colorSource:'user'`. But `public/clothing-details.js` allowed `fill(..., true)` (the explicit crop/model choice overwrite path) to replace that color with model-produced color and switch its source to `recognition`. `fillColor` likewise treated a user-cleared empty or `Unknown` color as an unfilled field, even when `colorSource:'user'` meant the user had intentionally declined or cleared a guess.

## Narrow production-logic fix (not deployed)

The same shared `ClothingDetails` consumer now protects an explicit user color through `fill` even with overwrite=true, and through `fillColor` even when the user intentionally leaves the value blank or Unknown. Non-user-recognized color values remain eligible for recognized updates. Other visual fields still obey existing explicit overwrite semantics. Color provenance, original photo SHA/bytes, owner ID, crop geometry and saved outfit references are not modified by these helper calls.

## Independent testing

- `tests/user-color-authority-20.test.cjs`: nine regression/failure tests for forced recognition replay, repeated conflicting suggestions, explicit user blank/Unknown, safe nonuser update, masked input, unknown category, source/owner preservation, malformed estimates, actual consumer app hook checks.
- `scripts/test-color-confidence-19-real-photo.mjs`: extends existing exact-source SHA-verified test of six licensed original JPEGs in real Chromium and WebKit (12 browser cases), with genuine Playwright fill events to set Green manually, force recognition color Blue, and reapply the actual original photo's estimated color; manual Green must remain Green. Explicitly clears via the same actual input element; forced Red recognition and photo estimates must not refill it. Green is **a synthetic test choice**, not a claim about the garment's true color. Actual `checkPhoto`/`PhotoColor`/`ClothingDetails` browser code runs, not an isolated fake scoring function. Six 320/390/430 screenshots and existing original-SHA/no-upload assertions remain.
- `scripts/audit-color-confidence-19.mjs`: inherited original/PNG SHA256 and data integrity acceptance.
- `scripts/audit-user-color-authority-20.mjs`: separately asserts 12 manual corrections protected, 12 clears protected, unchanged 12 photo source SHAs, six original licensed photographs, six independently audited screenshots, no photo uploads or JavaScript errors.
- Dedicated no-deploy GitHub Actions checks exact PR #576 ancestor, strict file whitelist, app build, all inherited+new Node tests and real browser verification. Existing narrow workflows from upstream PRs may fail their intentional source-change whitelist and must not be described as green; the dedicated assignment workflow is authoritative for this stacked research scope.

## Scientific quality boundaries

Human input events occur in an isolated browser research harness using the actual shared application color functions. This is not evidence of an unbroken full consumer app manual review, cloud account/privacy, source-true 3D fitting, photo category+color accuracy or physical Android/iPhone devices. The licensed original photo title hints are **not independently reviewed garment-color ground truth**; frozen color accuracy remains UNMEASURED. The existing owner-private index, saved outfit and CAS protections are unchanged by this patch. The full consumer E2E task is reserved for Work #27.

## Source evidence and external availability

Reuses the original 23-candidate Commons registry and six-image SHA-verified selection from PR #576, including clear quarantine of external mismatched/rate-limited sources rather than silently repinning. The original photographs are never committed as raw CI artifacts. Only sanitized JSON and genuine licensed-photo browser screenshots are retained.

## Reproduce

Run `node --test tests/user-color-authority-20.test.cjs`, then with the repository's pinned fixed dev dependencies `node scripts/build.mjs && node --test tests/*.test.cjs tests/*.test.mjs`, then `node scripts/test-color-confidence-19-real-photo.mjs && node scripts/audit-color-confidence-19.mjs && node scripts/audit-user-color-authority-20.mjs`.

**Release governance:** Family Alpha Issue #255 HOLD. All research branch/PR remains draft; no merge/deploy to production or staging. No Drive Duel or Delta Ebb changes. Main controller decides final future integration after reviewing Work #27 and Parallel #25/#26.
