# Mission 1 P874 — broad category conflict must remain manual

**Family Alpha HOLD #255 OPEN. DRAFT, UNMERGED, UNDEPLOYED.**

## Immutable source base
[Mission 1 P873 draft PR #1068](https://github.com/nickhaney916-lang/Closet-Current/pull/1068), verified exact SHA `7e7e7dad90936b362011f61ccce1623c32dfa7d8` via [NO DEPLOY Actions #43515825646](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43515825646) 584/584 native and six desktop Chromium/WebKit browser policy profiles.

## Source-verified risk
`arbitrate81()` distinguishes **category_disagreement** (two model top results have different main categories) from **subtype_disagreement** (both pick the same broad category but different garment types). Both produce `status: 'abstain'`, but the existing opt-in dual panel still rendered actionable `Use ...` clothing subtype/category buttons for both types of disagreement, even if this could overwrite a previously owner-reviewed main category after a click. P873 independently forbids exact tied label scores; it did not cover cross-family **category** conflicts with distinct top scores.

These are provenance/owner review hazards, not measured real-photo false saves. Existing independent real-model accuracy is UNKNOWN and catalog false-confidence issues persist.

## Source-level policy
- When the **two genuine model ranking observations** yield `decision.reasons.includes('category_disagreement')`, give a clear manual category selection message and render no AI model `Use` buttons or model photo-choice confirmation control.
- Keep stronger P873 `top_rank_tied` and existing `nonclothing_evidence` vetoes. Preserve ordinary within-category Shorts-versus-Skirt uncertainty as visible review alternatives with explicit owner consent, while forcing the existing normal Save review before storage.
- Do not change `model-arbitration-81.mjs`, scoring math, model vectors/weights, taxonomy, original JPEGs, account/source binding, 2D fallback, segmentation or shoe-unit ownership.
- Browser test uses the actual `observation81/arbitrate81` logic with clearly **synthetic** complete score arrays whose first model ranks Bottoms/Shorts and second ranks Dresses/Casual dress. Confirm category conflict manual-only, no suggested model actions, no photo acknowledgment, no draft item subtype updates, zero wardrobe writes. Run in desktop Chromium and WebKit at CSS 320/390/430. Inherited P873 tied-score and P872 rejected-choice policy cases remain.

## Evidence, test plan and blockers
Strict exactly-four-file no-deploy workflow pins this immutable parent and runs both builds, complete serial native test suite, real original JPEG SHA/IndexedDB owner delete+reload browser policy, P82 synthetic owner/consent/stale-photo/cancel tests, six category-conflict and six tied-top manual-only cases, and footwear/owner pair safeguards. Report exact-head GitHub Actions only after completion.

This does **not** improve the actual image classifier, calibrate the model, establish independence of the 48 historically exposed development JPEG strings, prove real model multi-photo WebKit stability, test physical Android/iPhone, or pass independent source-disjoint human-blind real clothing photo recognition. Parallel #83 owns WebKit crash; #75 acquires blind independent truth. No production/staging, hosted Supabase, private wardrobes, release or family trial changes. **Family Alpha HOLD #255 stays active.**
