# Parallel #73 — photo quality and capture guidance research

**Tracking:** Issue #940. **Pinned parent:** Mission 1 P843 PR #937, commit cc5c0640e8c2814a053807e7159a591ab3e96a3f.
**Branch:** research/parallel73-photo-quality-capture-guidance-20261112-HOLD.
**Release:** FAMILY ALPHA HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED. No production, staging, hosted Supabase or private wardrobes.

## Implementation

- New public/photo-quality-research.js implements bounded, explainable pixel diagnostics: actual decoded-image dimensions; sample maximum 256x256; luminance distribution, near-black and near-white fractions, opaque fraction, adjacent pixel contrast as an uncertain focus proxy. No classifier, threshold, worker, training, segmentation or cloud edits.
- The UI checkbox photoQualityResearch73 is opt-in and unchecked by default. Existing 16x16 checks and original recognition input remain unchanged. Additional analysis reuses the Image already decoded by checkPhoto; a diagnostic failure is advisory only.
- Only when opted in, uncertain flat/near-white or black capture remains reviewable instead of dropped by the old 16x16 blanket skip. No automatic save: P843 reviewFirst836=true remains.
- Per-item guidance is kept solely in the page's ephemeral Map, keyed by the same item object, original recognition-source reference and signed-in owner. Not stored with the garment or transmitted to the worker. Keep dismisses; Take another photo opens the capture view without deleting the draft. Old source, account or flag cannot show stale advice.
- Advisory capture tips cover exposed brightness, limited resolution, highlight washout, possible softness. Background interference, cropped hems, missing straps or soles, actual color, multi-garment shots and blur cause are **NOT** detected by this module and must be confirmed visually.

## Source integrity and limitations

The current photoToJPEG gallery import converts and optionally downsizes to 2048 px; video snap() also JPEG-encodes to a maximum 2048 px. This change never resamples or replaces the JPEG used by the existing recognition path, but it does **not** guarantee preservation of the original phone-file bytes or EXIF in the legacy import path. Source identity/storage changes belong with Mission 3, not this parallel branch.

Pixel-level lighting indicators are not human quality labels. Uniform black or white cloth, shiny leather, photographic backgrounds, patterns, occlusions, transparent PNG and low-resolution images can cause false positives. The user always retains manual Adjust and ownership confirmation. No hard retake threshold is permitted. Local sample memory is at most 256x256x4 bytes (~256 KiB) plus browser decoder; measured physical phone latency/memory is UNKNOWN.

## Lawful genuine image audit (frozen 11-source cohort)

From the existing benchmark/locked-photo-sources.json licensing and SHA-256 manifest, the research evaluator freezes:
commons-0003, commons-0014, commons-0021, commons-0033, commons-0049, commons-0060, commons-0077, commons-0082, commons-0094, validation-0001, validation-0019.

Each actual downloaded original from the licensed public-source manifest is SHA-256 verified before analysis. License, author and source-page attribution are in the manifest; no photographic bytes are committed or redistributed in this PR. The evaluator outputs only per-source technical metrics and summaries, as GitHub Actions artifacts. Script: scripts/evaluate-parallel73-real-photo.mjs. Downloader: scripts/download-reviewed-photos.mjs. Requires a temporary sharp@0.34.3 test dependency.

**Before:** existing 16x16 sample flags only flat/blank and generates a lookalike signature. **After:** optional additional metrics/warnings are available on the same SHA-verified photos. This is a diagnostic-capability comparison, NOT a controlled real-world recognition improvement.

Human-rated photo quality ground truths: 0. Source-disjoint same-garment before/after re-captures: 0. Independently verified subtype/category/color delta: UNKNOWN. Warning precision, recall and false-retake rate: UNKNOWN. Recognition improvement: **UNKNOWN / NOT ESTABLISHED**. No claim of 10/10 accuracy.

## Reproduction and no-deploy verification

- Node unit tests: tests/parallel73-photo-quality.test.cjs (dark/bright/flat/pattern/transparent PNG, invalid/corrupted data, privacy and source contracts); these use synthetic test pixels, not genuine photographic truth.
- Browser test: scripts/test-parallel73-photo-quality-browser.mjs executes the actual photo-check and card-rendering source under genuine desktop Chromium and WebKit browser engines at CSS widths 320, 390 and 430, testing off-by-default, optional retake/keep, stale-photo and changed-owner advice exclusion. Synthetic control image; no physical Android/iPhone, real camera permissions or genuine recognition acceptance is claimed.
- Strict no-deploy workflow: .github/workflows/parallel73-photo-quality-no-deploy.yml with exact P843-parent ancestry, a bounded path allowlist, native full build/regressions, Chromium/WebKit and image audit. No deployment permission, credentials, production change or hosted API.
- Real-photo evaluation: first run existing downloader with benchmark/locked-photo-sources.json, benchmark/photos and the comma-separated 11 source IDs; then node scripts/evaluate-parallel73-real-photo.mjs. Never use private photos in CI or logs.

## Verified executable CI evidence (November 12, 2026)

At executable HEAD `d6e26606153011af46de87c58a30964afdc9fc28`, [NO DEPLOY Actions run #43323443847](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43323443847) **completed SUCCESS, 3/3 jobs**:

- Strict immutable P843 parent/9-path allowlist, native builds and full Node suite: **327/327 passed; 0 failed**. Focused quality module tests: **9/9 passed**.
- Genuine desktop Chromium and WebKit browser engines: **6/6 width-engine runs** at **320, 390 and 430 CSS pixels**; checkbox OFF by default, opt-in diagnostics, non-destructive keep/retake, source replacement and owner switch fences all passed; **0 page errors**. Separate inherited P843 scanner browser safety suite also passed. These are browser tests with a synthetic control picture, not physical device or authentic recognition correctness.
- Source-verified licensed original photographs: **11/11 SHA-256 matched** the pinned licensed public photo manifest, **0/11** flagged by the original 16x16 flat/blank check. Additional advisory **1/11** (limited resolution); severe low light **0/11**, bright detail **0/11**, highlights **0/11**, possible softness **0/11**. This is **descriptive image-statistics evidence only**, and is not sensitivity/precision measurement for any of those conditions.

**Human-verified real-photo false-positive warning rate: UNKNOWN** (0 independently quality-labeled images). **Matched real-photo recapture pairs: 0**. **Before/after model-recognition category/type/color accuracy: UNKNOWN** (no unchanged-model matched-condition experiment). No scientific quality or recognition improvement is claimed. The full nonimage source receipt is uploaded as a workflow artifact, never photos themselves.

The workflow run cited above applies to that executable HEAD. Later documentation-only changes must be independently rechecked at their own final HEAD before claiming exact-head CI.

## Coordination and remaining work

Assignments #67–#72 retain exclusive ownership of model/classification, garment masks, inference performance, shoe pairing, independent recognition acceptance and owner-confirmed learning. P73 changes none of those. Main Mission 1 may cherry-pick the bounded changes after reconciling current scanner/app files, maintaining default owner review and Mission 3's account-epoch fence. Physical Android Chrome/iPhone Safari, EXIF variation, true camera interruptions, blur and lighting human adjudication, garment-masked framing, matched recapture pairs, and numerical latency/memory studies remain required before enabling the research flag for users.

**Disposition:** engineering research only, Family Alpha HOLD.
