# Closet Current Mission 1 — P838 empirically unsafe subtype modern integration

**FAMILY ALPHA HOLD #255**. Isolated DRAFT, unmerged, undeployed. Do not enable owner accounts, use private photos, modify hosted Supabase/staging/production or claim finished recognition accuracy.

## Why this is a model-admission change rather than another threshold tweak

The original verified [Mission 1 PR #766](https://github.com/nickhaney916-lang/Closet-Current/pull/766), exact `bd31bccac787f0b7830ed5e405ef5ef101e18100`, ran a real source-matched A/B over **59 historically labeled public original photos** on one browser. It found the same-model extra-framing trick **failed**; the final source-independent review gate changed **43 correct/47 automatic with 4 wrong → 38 correct/38 automatic with zero wrong**, trading 9 accepted predictions (four wrong, five correct) for human review. Those original photographs are **development exposed**, not new blind ground truth, and the old result is NOT transferable without testing the new worker.

P834 verified the current modern worker has three strong wrong subtypes on its 16 photo historical cohort in both Chromium and WebKit: Tops/Sweatshirt (actual T-shirt), Tops/Tunic (actual Blouse), Shoes/Ankle boots (actual Sneakers). P836/P837 were opt-in user-review controls. But the default modern worker still could immediately stream `identified` and auto-save those bad high confidence predictions before risk assessment.

## Real implementation

- Port exact P766 source-independent owner-review policy into `public/recognition-confusion-guard.mjs`. Four empirically risky **predicted category:subtype** combos: Tops/Sweatshirt, Tops/Tunic, Outerwear/Blazer, Shoes/Ankle boots. This rule preserves broad category and marks subtype Unknown / requires human review; does not invent color or stronger certainty.
- After the *final* `recognizeWithRecovery` result, the worker decides whether to downgrade, then sends any `identified` preliminary callback **only when the final result remains strong and exactly matches**. No optimistic high-risk identity reaches the UI before owner review, including when the previous P837 opt-in flag is off.
- Preserve existing without-hint single-garment scope of P766; multi-garment hinted pieces are unchanged **pending independent image evidence**. This is an explicit gap, not silently counted as safe.
- No new image processing/extra inference, no changed FashionCLIP model or thresholds, no original owner images in artifacts.
- Update no-account model test bundle's explicit file allowlist and SHA manifest to include the actual guard module. Preserve fully local, unhosted, account-free research trial.

## Exact-head verification required

- Full Node regression, dedicated actual-worker simulation of strong, rejected, unchanged and hinted cases; hashed no-account trial build; no-deploy path boundary check.
- Actual immutable-source FashionCLIP browser evaluation on **same historic 16 originals × Chromium and WebKit** with original JPEG SHA checks, all partitions present, photo-free numeric receipts and exact original baseline comparison against [P834 Actions #43144750475](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43144750475).
- Comparator cannot change original human annotation or exclude any source, cannot claim model correctness from abstention, cannot trade unreported correct auto coverage for apparently better precision.
- Report true counts of wrong autos moved to review **and** previously correct autos moved to review, with category/negative preservation; do not report as independent blind accuracy.
- Physical Android/iPhone inference, multi-garment hinted subtype safety, primary-color human truth, balanced independent image-source blind evidence and real signed owner cloud remain unresolved.

## Decision

**Keep draft/no release even when all tests pass.** This is a verified targeted safety policy rather than achievement of 10/10 model recognition. Parallel #67/#68 remain independently responsible for improving real model/segmentation performance. Main controller owns integration and Family Alpha decision.
