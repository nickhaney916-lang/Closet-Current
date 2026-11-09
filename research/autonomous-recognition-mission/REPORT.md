# Autonomous Mission 1 — measurement integrity checkpoint

Research only. Family Alpha HOLD #255. No merge, deployment, hosted Supabase changes, paid services or private family photographs.

## Scope

Base: Parallel 66 exact commit e67b4f79f6c4268ba743fbbe6dbd8afce21cb697. The mission sequence is real-photo recognition acceptance, followed by broader photographed clothing-to-3D fidelity only after the first acceptance gate passes. This checkpoint repairs benchmark measurement; it does not complete Mission 1 or change the recognition model.

## Corrected defect

The command-line recognition evaluator previously skipped missing result rows before counting garments, negative controls and expected outfit pieces. Missing hard examples therefore inflated reported percentages. It also credited predictions attached to runtime-error rows. It now retains every expected trial in the denominator, gives failed inference zero recognition credit, rejects duplicate manifest IDs and foreign result IDs, and preserves the nonzero exit for incomplete results. Existing complete-result output fields remain compatible.

Regression fixtures demonstrate one returned correct garment plus one missing garment yields 50%, rather than 100%; missing negative and outfit results remain failed trials. Fixtures are synthetic software QA, not human ground truth. Runtime-error predictions cannot earn category, subtype, semantic-subtype or instance matching credit.

## Evidence checked locally

- All 59 existing licensed original JPEGs SHA-verified and decoded by the unchanged P60 audit, with recorded license provenance. Frozen splits remain 32/11/16; originals are unchanged.
- P99 empty intake confirms zero human reviewers supplied, seven source candidates quarantined and no independent model accuracy claims.
- Five evaluator tests pass, including three new adversarial regressions. The independent-source/review tests were also rerun previously (31 passes).
- P94 blank A/B/C instance packets regenerated after all 59 original JPEG checks. These contain no completed human answers.
- Production static build passes locally; no build is deployed.
- Re-scoring the existing historical regression-holdout-16.json results (source commit 01ca64d2d38c89eefe41e400efae1a19ad94e5af) gives 7/13 broad categories, 3/13 exact subtypes and 3/3 negative rejections. This is an OLD stored prediction set with provisional labels, not a new model execution, independently verified truth or evidence of model improvement. Do not compare it to later historical pilots as a before/after result.

## Mission acceptance remains blocked

No independently adjudicated category/subtype/color labels or human instance masks have been supplied. Consequently independent category, subtype, color, segmentation IoU, boundary F1 and instance-separation metrics remain unmeasured. Current P60 policy needs 100 unique photographs, 30 locked garments, 10 locked negative controls, per-category representation, complete predictions and independent labels. Seven quarantined new candidates do not close the 41-photo gap and have not been exposure-cleared. Current five recognition families are Tops, Bottoms, Dresses, Outerwear and Shoes; none is certified by this checkpoint.

Owner assistance required: independently supplied human A/B reviews and a distinct adjudicator for disagreements, plus appropriate physical-device acceptance when needed. Self-attested JSON, generated labels and model-exposed data cannot establish independent human truth. Existing offline review interfaces and source-bound packets can be used for collection without posting reviewer identity or private answers to GitHub.

## Integration and verification

Review the evaluator, its tests, this report, the pinned metadata intake and its tests/candidate queue, and the dedicated no-deploy workflow relative to the exact base. Run `node --test tests/recognition-benchmark.test.mjs`, the full inherited Node suite, `node scripts/audit-recognition-ground-truth-60.mjs`, `node scripts/audit-source97-human-review-99.mjs --empty`, and `node scripts/build.mjs`. For stored benchmark wrappers, supply their `.results` array to the evaluator; it intentionally expects arrays. No shipping public app, authentication, owner persistence, photo, geometry or 2D fallback changes.

The PR records exact final commit and completed hosted CI when available. CI does not certify human labels, physical phones, garment realism or Mission 1 completion. No new visual evidence is appropriate for this numerical evaluator change.

## Next subpriority implemented: public human-annotation candidate intake

Rather than treating new owner review as the only potential source of human labels, downloaded and inspected the official Fashionpedia validation annotation JSON. It contains 1,158 images and 8,781 annotation instances, with per-image license records. The metadata-only importer is pinned to SHA-256 `f831f415edad12d52acde8b138fe7ebd1592b57bf0dcd6a3b63ba8cabd208223` and queues the 153 image records declaring CC BY 2.0, excluding 1,005 other records. The checked-in queue contains source URLs and recorded license metadata, no JPEGs or polygon copies. All 153 remain quarantined, with zero accepted benchmark photographs. Source creator attribution, original rights, exact JPEG identity and model exposure remain unverified; no license is inferred from a hosting mirror. The full original JPEG archive has not been downloaded.

Fashionpedia's authors describe human mask and attribute annotation, but this does not establish the project's two-reviewer adjudication protocol, primary-color labels, exact merged-subtype mapping, or an unseen holdout for models trained on Fashionpedia. This intake cannot bypass P60/P94/P99 or supply invented colors. It is a concrete source-investigation queue, not a completed independent benchmark. Its tests refuse substituted annotation bytes and verify the persisted no-promotion flags. CI redownloads the official JSON, checks its SHA via the importer and compares the generated queue byte for byte.

Official evidence: https://fashionpedia.github.io/home/data_license.html distinguishes CC BY 4.0 annotations from separately licensed images; https://github.com/cvdfoundation/fashionpedia lists the original validation annotation URL and per-image license format; https://arxiv.org/abs/2004.12276 describes the annotation methodology. Attribution: Fashionpedia Consortium; Jia et al., *Fashionpedia: Ontology, Segmentation, and an Attribute Localization Dataset*, ECCV 2020. Metadata adapted from CC BY 4.0 annotations; filtering and quarantine flags are Closet Current additions.
