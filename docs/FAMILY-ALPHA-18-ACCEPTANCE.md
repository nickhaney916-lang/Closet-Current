# Family Alpha 18: independent mobile/photo acceptance

Development QA only. Release HOLD. No deployment, account creation, real photos,
paid inference, backend configuration, or live authorization tests.

## Baseline and coordination

Branch `qa/family-alpha-18-mobile-acceptance-20261023` is stacked on PR #268,
`f9d2422f5a4ab562f5ce6e321558fcd4b186bbeb`. Reviewed issue #255 and PRs
#267, #268, #270, #271, #272, #273. Main remains `54c9e29`.
Other sessions' branch refs are untouched. Auth/security/staging work remains
with the main conversation. PR #273 head observed: `b16af4718d9f67848922e2f4869b2c7a239ad4ef`.
The local preview's sole runtime change here is restoring its launch button on
invalidation. Integrator should apply that line to the current controller;
this branch must not replace later Auth/cloud/staging files.

## Reproduced fix

During pending Auth/garment review, `start()` disables launch. A board/account
change calls `clear()`, increments `serial`, and cancels review. The old
`finally` correctly declines to modify a newer run, but launch stays disabled.
The new interruption regression fails before the patch (`true !== false`) and
passes after `clear()` restores launch. Existing serial/account/source checks
remain in force. This fixes retry availability, not authorization.

## Independent assessment

| Workflow | Observed implementation / test boundary | Remaining gap |
| --- | --- | --- |
| Manual/automatic camera | Actual `startCamera`, `takePhoto`, `captureTick`, `stopCamera` exercised with synthetic media mocks; five-second cadence; permission denial/retry; late grant stopped; 20 pending frames survive two sessions | No optical camera, OS permission UI or physical phone |
| Original photos | `snap()` requests 1920×1080 ideal video, caps longest edge to 2048, JPEG .94. Review provider independently decodes retained JPEG and creates a separate PNG | Not proof of best supported still resolution or retention of native sensor bytes; imported files may also be normalized |
| Crop/review | Eleven garment silhouettes, separate derivative, original/crop identity checks; explicit trusted Use cutout or Retake photo | Complex backgrounds, low contrast, blur and garment semantics require human review/retake |
| Recognition/indexing | Full existing Node regression includes recognition/indexing safety; camera `candidate()` starts Uncategorized and exact image duplicates are skipped | This assignment does not run an ML category accuracy benchmark; fixture categories are supplied, not predictions. Fresh phone labels remain required |
| Avatar | Existing renderer uses original-derived PNG pixels and contain geometry; shoes/bottom/top order; dress excludes separates via adapter | Stylized shape, not realistic fit/drape. Source RGB equality is not visual perfection |
| Outfit acceptance | Existing #15 synthetic actual stylist/adapter tests cover distinct owned outfits, pin/swap, source changes, dress, jacket, persistence and account refusal | Physical navigation/cloud recovery and real accounts not verified |
| Privacy | No external requests allowed in browser QA; local synthetic owner mocks only | Does not establish deployed RLS, signed URL behavior or actual Auth isolation |

## Synthetic matrix

`research/family-alpha-18/quality-matrix.mjs` runs 11 silhouettes × 9 scenes =
99 preparation cases: short sleeve, long sleeve, pants, jeans, shorts, skirt,
dress, jacket, sweater/outerwear, sneakers, loafers; plain, wrinkled, busy,
clipped, blank, white-on-white, dark-on-dark, blurry, half-frame shadow.
SHA-256 checks prove input RGBA unchanged, not native phone JPEG retention.

Plain/wrinkled cases prepare separate derivatives (22). Busy/clipped/blank/
white/dark/shadow return review without derivative (66). All 11 blurred cases
currently prepare a derivative: **blur is not rejected by this preparation
function**. They still require explicit user review; no auto-save or perfect
segmentation claim. Do not turn this observation into an automatic PASS for
family photo quality. No generic product images are substituted.

The browser JPEG matrix independently encodes and decodes all 11 scenes,
verifies exact retained-JPEG foreground RGB against separate transparent PNGs,
checks source/crop/owner invalidation, and aspect-preserving avatar rendering.
Simple-scene IoU is measured against programmatic synthetic truth only.
Human visual approval is never proof of mathematically perfect segmentation.

## Automated commands and evidence

- `node scripts/build.mjs`
- `node --test tests/*.test.cjs tests/*.test.mjs`
- `node scripts/test-family-alpha-18-mobile.mjs`: Chromium/WebKit × 320,390,430 portrait and 850×390 landscape = 8 cases. Actual preview markup/controller; interrupted review retry, ≥44px review buttons, overflow, 3 layers, retake, account change, no external requests.
- `node scripts/test-family-alpha-18-quality-browser.mjs`: 6 engine/width cases, 11 JPEG garments each.
- `node scripts/test-family-alpha-15-browser.mjs`: 6 existing outfit/swap/lifecycle cases.
- `node scripts/test-family-alpha-real-photo-review-browser.mjs`: 6 existing reviewed JPEG/source cases.

Baseline local Node: 380 passed, 0 failed/skipped. Added 15 tests (11 quality/
interruption, four camera). Final totals and exact-head CI are recorded in the
PR and issue #255 after execution. Local browser launch was blocked by missing
binaries; download attempt returned truncated archives. CI uses the repository's
pinned Playwright container. No local browser success is claimed from that attempt.
All browser runs are simulations; zero physical Android/iPhone tests performed.

## Priority blockers for main conversation

1. Authorized protected stage, real account isolation and live API/storage tests:
   entirely main-owner scope, not changed here.
2. Physical Android + iPhone capture→review→save→outfit→swap, 15–20 photos per
   account. Include pause/resume, browser back, denial/retry, low storage and reload.
3. Best supported still-photo resolution: video frames capped at 2048 do not
   meet a verified native-still claim. Evaluate memory/storage budgets on phones
   before selecting a camera API or changing product capture resolution.
4. Blur/ambiguous clothing: all synthetic blur examples reach preparation;
   explicit review is essential. Recognition and cutout quality need separately
   labeled real-garment evidence after authorization.
5. Complex backgrounds / white or dark low contrast: current conservative review
   is safe but not friction-free. No 100% recognition/segmentation claim.
6. Verify physical keyboard, zoom, screen reader focus, and actual camera controls;
   44px review buttons and viewport checks cover only the tested preview surface.

See FAMILY-ALPHA-18-FAMILY-GUIDE.md and FAMILY-ALPHA-18-FEEDBACK.csv.
