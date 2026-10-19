# Holdout recognition: coverage, abstention and unsafe subtype audit
**Recorded:** October 19, 2026. Research only, draft branch stacked on PR #16, not production.

## Evidence
The fixed 16-source holdout includes **13 annotated garments and 3 non-clothing controls**. Real browser model inference was run against the fixed manifest and evaluated without tuning any recognition thresholds. Sources are linked in `benchmark/manifest-holdout-16.json`.

- [Verified real-photo inference with new type audit](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39276247888)
- [Earlier model-inference run with category-only audit](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39275931009)
- [Complete Node regression suite](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39276279625)

| Metric | Value | Meaning |
|---|---:|---|
| Garment source photos | 13 | Not independent physical items in a layered outfit |
| Category coverage | 8/13 (61.54%) | Model emitted a non-Unknown category |
| Category precision *among emitted predictions* | 8/8 (100%) | **Not** whole-set accuracy |
| Category accuracy including abstentions | 8/13 (61.54%) | No-credit for a missing category |
| Automatic category decisions | 7/13 | Seven strong garment results |
| Incorrect automatic broad categories | 0/7 | Grounded **only** in this small fixed holdout |
| Incorrect automatic subtypes | **3/7** | Subtype disagreements are real release-quality problems |
| Independently safe auto-indexed subtypes | 4/7 | Based on manifest acceptedTypes, **not** multi-item mask truth |
| Non-clothing controls rejected | 3/3 | The three controls were not given garment labels |
| Full outfit garment recall / pixel IoU | **Not measured** | No reviewed independent physical-item masks |

### Five sources still abstained
- `commons-0016`: annotated blouse
- `commons-0036`: annotated skirt
- `commons-0059`: manifest labels a dress, but the source title includes **Dress and jacket**; it must be independently inventoried as a possible multi-garment original, never used to claim full physical-item recall
- `commons-0062`: annotated jacket
- `commons-0095`: annotated boots

### Three automatic subtype mismatches (all broad categories right)
- `commons-0003`: annotated T-shirt; model selected Sweatshirt
- `commons-0014`: annotated Blouse; model selected Tunic
- `commons-0078`: annotated Sneakers; model selected Ankle boots

These manifest disagreements should receive independent garment-form review before being treated as definitive physical clothing identities. They must **not** be hidden by claiming high category precision, calling all unclassified garments wrong autosaves, or relaxing category/indexing thresholds.

## Code changes in this research checkpoint
`scripts/evaluate-recognition-benchmark.mjs` now outputs coverage, emitted-category precision, per-photo abstention IDs, wrong-category IDs, and incorrect automatic subtype IDs separately. Two synthetic test scenarios verify abstention-versus-error and unsafe automatic subtype reporting. The original full-set metrics remain available for historical comparability.

## Release and next engineering gates
1. Score an untouched new holdout after any actual model/preprocessing improvement; using these five observed photos to tune a threshold means they are **development** cases, not proof of generalization.
2. Independently review garments and source-level masks on the layered outfit, including shirt, outerwear, skirt, dress and shoes. Two independent reviewers must establish the actual inventory before calculating physical-item recall.
3. If a candidate classifier shows improved coverage, require **zero newly incorrect broad categories, zero regressions in known correctly categorized items, and no new automatic incorrect subtype** on the untouched validation suite before any promotion.
4. No physical-phone capture, latency or hosted AI try-on evidence is established by these benchmarks.

No paid service, original-photo overwrite, model deployment, production merge, or Drive Duel changes are authorized or performed.
