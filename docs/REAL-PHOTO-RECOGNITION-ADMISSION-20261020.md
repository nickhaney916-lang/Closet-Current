# Recognition accuracy admission: shoes, skirts, dresses, shorts and unsafe auto-saves
**October 20, 2026 Pacific — draft-only research and safety, not a released model.**

## What was actually measured

This priority introduces `scripts/audit-recognition-admission.mjs` to read three **fixed, independently annotated original-photo manifests** and the corresponding exact photo-ID model result JSONs. It does not change the production classifier, preprocessing, thresholds, original-RGB crop, mask, index, visual model or paid AI. The test suite rejects duplicate/missing/extra results, mislabeled/unverified sources, invalid automatic-save type, false clothing on background controls and improperly represented category-only reviews.

Two distinct evidence tiers are always identified:
- **Locked historical inference:** `benchmark/regression-reviewed-32.json`, `benchmark/regression-holdout-16.json`, `benchmark/regression-fresh-11.json`. These are frozen old predictions, not a model run performed by this priority and not interchangeable with a different October 19 inference.
- **New source-verified real browser inference:** Dedicated GitHub Actions job downloads photographs with SHA-256 checks, builds the unchanged application, runs its actual existing FashionCLIP browser recognizer on all **32 + 16 + 11** locked sets, and passes those fresh results to the same admission audit. The resulting JSON is attached to the workflow for an independently auditable checkpoint; no photograph or full image is uploaded in the report.

## Archived baseline findings, before any new measurements

| Cohort | Garment photos | Non-garment controls | Category emitted | Broad category right | Strong automatic decisions | Wrong accepted subtype | Category abstentions |
|---|---:|---:|---:|---:|---:|---:|---:|
| Reviewed-32 | 32 | 0 | 26 | 26 | 25 | 1 | 6 |
| Holdout-16 | 13 | 3 | 7 | 7 | 6 | 3 | 6 |
| Fresh-11 | 11 | 0 | 10 | 10 | 9 | 0 | 1 |

Known archived subtype disagreements: `commons-0064` (Outerwear Jacket versus Blazer), `commons-0003` (T-shirt versus Sweatshirt), `commons-0014` (Blouse versus Tunic), and `commons-0078` (Sneakers versus Ankle boots). The holdout has no **recorded broad-category error** among its seven emitted categories but only 7/13 positive garments received a category; calling that “100% recognition accuracy” would be false. The three holdout non-clothing controls were rejected. Four of these subtype errors were from the archived runs, not necessarily from the new run; never mix results from separate revisions.

Note: An October 19 research note documented **7** strong automatic decisions on a separate actual holdout inference. The immutable older `regression-holdout-16.json` supplied with this branch has **6**. This audit intentionally reports **6** for that historical source and separately labels any new inference.

## Newly rerun real model, source-verified on October 20 (separate evidence)

The actual existing pinned browser recognizer was run again in GitHub Actions [#39531944295](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39531944295) with 48 verified Commons photos (the overlapping reviewed/holdout sources) plus 11 independently locked validation photos. The downloader confirmed each SHA-256 before inference. **No model, prompts, threshold, vectors, mask or app behavior changed** during this measurement.

| Fixed set | Positive garment photos | Non-clothing controls | Emitted correct categories / all positives | Strong automatic decisions | Correct accepted automatic subtypes | Wrong accepted automatic subtypes |
|---|---:|---:|---:|---:|---:|---:|
| Reviewed-32 | 32 | 0 | 32/32 | 31 | 30 | **1** |
| Holdout-16 | 13 | 3 | 8/13 | 7 | 4 | **3** |
| Fresh-11 | 11 | 0 | 11/11 | 9 | 9 | **0** |

**Four actual wrong automatic subtype decisions in the rerun:** `commons-0064` (jacket/outerwear subtype), `commons-0003` (T-shirt/Sweatshirt), `commons-0014` (Blouse/Tunic), and `commons-0078` (Sneakers/Ankle boots). Their broad categories were correct. A right category does **not** excuse an incorrect saved type. Holdout category coverage/whole-set accuracy was **61.54%**; precision *among the eight emitted categories* was 100%, which is explicitly **not** 100% recognition accuracy. All three non-garment controls were rejected. Five holdout garments received no category rather than a false classification.

The actual model run emitted more category predictions than the older archived baseline, which is why its strong-counts (31/7/9) differ from the archived (25/6/9). This is **a different observation**, not an improvement we have caused in this PR. The model remains blocked for release-quality recognition promotion, and the fully verified 59-photo evaluation is not a representative physical-phone sample or a measure of independent clothing instances in layered photographs. Because the sets have already been observed multiple times, any future threshold tuned to these examples requires **new untouched** independent photos for credible validation.

## Promotion policy

The audit reports per-set: photo coverage, emitted-category precision versus **whole-set** category accuracy, abstentions, exact incorrect broad-category IDs, exact wrong automatic subtype IDs, non-garment false positives, category-only review, and class-specific breakdowns. The 16-photo holdout has 13 positive photos plus 3 negative controls; the fresh set includes a headwear/accessory class as a documented positive source.

**Any wrong automatically saved subtype, wrong broad-category prediction, non-clothing false positive, runtime error or missing photo blocks recognition promotion.** If all pass, the result is only `REVIEW_REQUIRED`, never production release approval. The photo sets are small and already observed; they do not establish 100% real-world accuracy or independent physical-instance masks. This tool is an honest release-quality check, **not a model-quality improvement or a guarantee of correctness**.

### Engineering status and remaining work

- Eight new synthetic-vs-locked-data audit tests cover known subtype regressions, three cohorts, abstentions, negative controls, missing/duplicate rows, malicious schema and hypothetical fixes that cannot authorize launch. Full existing Node regression/build, original-camera classification and two-parent source verification remain active.
- Actual independent new real-photo inference must be read from the CI run; do not claim measured new-model quality unless the job completes with SHA-confirmed source images.
- Before changing any subtype thresholds or vectors, obtain **new untouched independent photos** with independently agreed ground-truth labels, confirm physical-article identity for layered garments, run them through the pinned model **and** the proposed candidate, then require nonregression with zero newly unsafe automatic saves. No dangerous hardcoded photo-ID exceptions or model shortcuts.

This does not authorize deployment, GitHub PR merges, hosted database/SMTP edits, use of private customer wardrobes, paid AI, or changes to Drive Duel. Production email/auth, secure cloud storage, original reusable figure provenance and real physical Android/iPhone validation remain separate pilot blockers.
