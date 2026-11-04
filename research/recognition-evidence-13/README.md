# RECOGNITION-EVIDENCE-13 — exact original-photo recognition QA (NO DEPLOY)

**Owner**: main Closet Current controller. **Parent**: PR #569, exact SHA \`ca23c25d6621ea41c29fc9bac5f32eefb829b550\`. **Family Alpha Issue #255: HOLD**. Research only; production, Supabase, native auth, camera, segmentation, source JPEGs, model weights and existing donor 3D untouched.

## Problem actually verified

The existing pre-recorded 16-photo holdout, sourced from \`benchmark/regression-holdout-16.json\`, has 13 actual garment photographs and 3 negative photographs. Earlier recorded scores: 7/13 broad categories correct, 6/13 automatically accepted, only 3/13 subtype-correct automatically accepted, and 3/13 automatic subtype errors (commons-0003, commons-0014, commons-0078). All 3 nonclothing controls are rejected. This does **not** represent a fresh inference run. The source hashes and reviewer labels are inherited from the existing immutable licensed \`benchmark/manifest-holdout-16.json\` and \`benchmark/locked-photo-sources.json\`.

## Independent measurement delivered

- \`scripts/audit-recognition-evidence-13.mjs\` verifies exactly 16 distinct expected labels, matching source/image IDs, original public photo SHA256s and reviewer flags; requires exactly one result per photo; rejects forged acceptance flags. Does not infer from filename, count unanswered frames as correct, re-label ambiguous samples after seeing predictions, or treat automatically unaccepted guesses as auto accuracy.
- Measures automatically accepted **correct subtype**, automatically accepted **wrong category/type**, explicit category-review and abstentions, negative false-positive counts, model runtime errors, per-class accuracy and actual coverage/precision denominators. Emits a privacy-minimal ID-only evaluation report with original SHAs and **never** emits original bytes, source URLs, raw errors or account data.
- Evaluates the recorded historical baseline with \`sourceMode: historical-baseline\` and separately scores **new actual browser-worker predictions** with \`sourceMode: actual-browser-inference\`. CI uses real \`public/local-worker.mjs\`, existing \`public/benchmark-runner.mjs\`, the original 16 SHA-locked downloaded JPEG files and the existing exact original-photo preprocessing.
- Dedicated workflow is strict no-deploy and does not change legacy recognition thresholds, baseline labels, original garments or sensitive app assets. Node regression suite/build and actual Chromium worker run required for full research acceptance.
- Scientific quality gate requires **zero** incorrect automatic category/type assignments, **zero** false positive negatives and no runtime errors. A failed quality gate must be reported honestly even if the auditing infrastructure passes. No sample tuning or threshold changes to conceal failures.

## Non-negotiable limits

This 16-photo single-garment holdout is **NOT** the historical 15-photo isolation/fit acceptance set, NOT an automatic multi-garment segmentation precision/recall benchmark and NOT a general population precision estimate. No reviewed ground-truth color labels are supplied in the cohort, so color accuracy remains **NOT MEASURED**; sampled photo palettes must not be used as ground truth. Existing multi-garment PR #569 manual reviewed flow is tested independently and remains draft. No real signed staging A/B Supabase RLS, actual physical Android/iPhone, or arbitrary photo-to-163-bone 3D certification.

A test run may pass while recognition accuracy remains unacceptable. Do not merge/deploy, mark Family Alpha ready, or claim model-level progress without independently verified performance.

## Recommended next product fix after evidence

Focus on *systematic* low-precision subtype groups from measured errors, adding conservative human review and independent confirmation before accepting labels. Avoid hardcoding one fixture ID or silently replacing stored user's confirmed category. Benchmark every prospective model change on separate held-out photos and multi-piece originals before acceptance.