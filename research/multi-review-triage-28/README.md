# MULTI-REVIEW-TRIAGE-28 — rank visible unverified garment proposals; never treat model guesses as closet garments

**Main-controller research only**; parent [PR #584](https://github.com/nickhaney916-lang/Closet-Current/pull/584) exact SHA `599065825b18a67636af75ad5edc4e8eb86c80fc`. The prior original-photo SegFormer benchmark belongs to Parallel #26 [PR #575](https://github.com/nickhaney916-lang/Closet-Current/pull/575), exact SHA `241bd1ed75fb334f94877a8cddc471b41839af23`, [no-deploy run #41856942601](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41856942601), independently downloaded actual public original-photo [artifact #13340286217](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41856942601/artifacts/13340286217). License/provenance and 19 source JPEG SHA hashes are preserved in `frozen-photo-annotations-16.json`. **No original JPEG, family photographs, private accounts or image model assets are added to this branch.**

## Source-backed problem and limited objective

SegFormer ran against 19 unique originally SHA-locked licensed photographs with 35 single-reviewer visible garment boxes. Its app-equivalent resized arm produced **61 unverified proposals and only 10 source-annotation matches**, with 51 unmatched regions and 25 missed garments, in both Chromium and WebKit. The product currently shows them all without distinguishing clearly which might be more useful to inspect first. Browsers and pixel masks were not independently human annotated. These figures do NOT meet real-photo multi-garment automatic detection acceptance.

This project adds a **review-ordering aid**, not an accuracy change to the SegFormer model. Candidate tier: mask-group average model score ≥0.925 and normalized crop bounding-box area ≥0.08. Other model proposals remain listed under **Other unverified regions**; user-marked regions stay visible under **Your marked regions**. Every single detected or manually added region is unconfirmed until the user explicitly verifies the real original photo, crop, category/subtype and color. No source, original SHA, saved wardrobe row, owner identity, private storage, crop geometry, model, recognition confidence, backend, 3D readiness or atomic save rules change.

## Real frozen-model replay results (retrospective, not new unseen-photo accuracy)

`scripts/score-multi-review-triage-28.mjs` recomputes maximum-cardinality box IoU≥0.50 matching from the original unchanged PR #575 scorer and single-reviewer licensed 19-photo annotations. It reads the **real** original Chrome/WebKit `app-equivalent.json`, locked to exact raw SHA-256 `c907ee1cbfb944d7ba055921606a13c67014e6656400b5f831b6535d66307100`, from GitHub artifact #13340286217. This is not fabricated model inference or a newly-run model. Both engines reproduce the frozen metrics exactly.

| Frozen cohort, each engine | All candidate regions | First-review tier only |
| --- | ---: | ---: |
| Proposals | 61 | 9 |
| Matched annotated boxes | 10 | 8 |
| Unmatched regions | 51 | 1 |
| Precision among displayed proposals | 10/61 ≈16.4% | 8/9 ≈88.9% |
| Recall among 35 visible annotated garments | 10/35 ≈28.6% | 8/35 ≈22.9% |
| Still available under additional review | — | 52 |

Development split originally labelled 9 photos: 5/5 prioritized regions matched annotated boxes. Nominal held-out split 10 photos: 3/4 prioritized regions matched; this is **NOT a valid independent held-out test of the new rule**. The threshold choice was made after inspecting **the entire 19-photo dataset**, including the previously labelled held-out subset. All results are explicitly **post-hoc exploratory and potentially overfit**, with a single annotator and no independent masks. Do not extrapolate 8/9 to new users, describe it as an 89% garment-recognition accuracy rate, or clear any Family Alpha gate. The 10 of 35 detected visible garments and severe flat-lay/high-top/overlap failure still remain.

## Integrated UI and verification

The optional `multi24=research` owner-private `research/multi-garment-capture-01/review-ui.mjs` imports the small pure `review-triage-28.mjs` and displays three non-collapsible named groups in the same existing card grid, priority then manual then additional. No visual proposal disappears, and no row is auto confirmed. Existing independent `atomicSaveGarments24` owner+original SHA, stable source region keys, duplicate rollback, explicit cropping and human confirmation are unchanged.

`tests/multi-review-triage-28.test.mjs` exercises source-true lossless stable ordering, malformed confidence/bounding box cases, exact threshold boundaries, manual regions, no priority available, matching scorer and absence of automatic write code. All inherited Node tests must pass. `scripts/verify-multi-review-ui-28.mjs` uses **actual opted-in review UI** in Chromium and WebKit at 320, 390 and 430 CSS pixels; uploads a locally generated synthetic JPEG to a fixture `makeProof` (no external network request), supplies simulated SegFormer proposal messages **explicitly UI-test-only** (not genuine model inference), checks 1 priority/2 additional/1 user-marked review cards, original JPEG data URL, no saving without confirmation and owner-session switch clearing. It captures six genuine SHA-verified screenshots. Frozen historical model replay and synthetic browser UI checks are kept separate.

Dedicated Actions uses exact parent ancestry and file allowlist, full original build and Node suite, real browser UI screenshot acceptance, then independently downloads and SHA-checks the original PR #575 public-source model artifact (no fresh inference), rescoring all 19 original photographs in both engines. It produces sanitized report JSON and screenshots only. No production, staging, Supabase, customer gallery, 3D models, other projects, or original photos changed.

**Release:** Family Alpha Issue #255 remains OPEN/HOLD. Automatic detection quality, independent human ground truth, real newly collected phones, owner-private genuine signed browser cloud E2E, actual 3D photographed clothing and formal release approval remain unverified. This draft is not mergeable or deployable without explicit separate controller approval.
