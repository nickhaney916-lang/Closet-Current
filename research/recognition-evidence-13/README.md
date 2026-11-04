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
## Exact-HEAD independent execution and evidence — November 4, 2026

- Exact starting HEAD `750712b03eb828ab4381ca59828b3f4408bd6e87`; draft research PR #570 stacked on unchanged independently accepted PR #569.
- [Dedicated Actions #41845110091](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41845110091) SUCCESS: protected-source scope, full build and inherited/new Node regressions, SHA-256-original photo downloads, genuine unmocked Chromium FashionCLIP inference, independent evaluation and sanitized artifact.
- [Evidence artifact #13330831920](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41845110091/artifacts/13330831920) independently downloaded. Actual inference: 16/16 outputs, 0 errors, 13 garments and 3 nonclothing controls. Category correct 8/13 (61.54%); 7/13 auto accepted and 7/7 accepted broad categories correct. Correct auto subtype 4/13 (30.77% coverage), 4/7 (57.14% precision); 3 wrong automatic subtypes (commons-0003 T-shirt versus Sweatshirt; commons-0014 Blouse versus Tunic; commons-0078 Sneakers versus Ankle boots). 1 category-only review, 5 abstentions; 3/3 nonclothing correctly rejected.
- Historical and new actual runs differ only for commons-0060: a Jacket now auto accepted correctly instead of abstaining. Original locked photo annotations never changed.
- **SCIENTIFIC QUALITY GATE: FAILED** due to 3 incorrectly accepted subtypes. A green CI result indicates valid measurement infrastructure, NOT model accuracy acceptance. Neither the held-out labels nor original image bytes were changed to boost scores.
- Independently annotated color ground truth unavailable: COLOR ACCURACY NOT MEASURED. Automatic multi-garment segmentation precision/recall and the distinct historical 15-photo isolation QA: NOT MEASURED. Physical phone acceptance, real signed owner A/B Supabase RLS and universal 3D still HOLD.

**Next independent technical priority:** investigate subtype-confusion patterns on separate development/tuning images, create conservative non-ID-specific review safeguards, then rerun the unchanged held-out 16, other real-photo sets and multi-piece original-photo segmentation. No photo-ID-specific tuning.
