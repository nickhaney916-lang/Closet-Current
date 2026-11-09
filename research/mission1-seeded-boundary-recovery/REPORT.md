# Mission 1 — seeded garment boundary review recovery

Research only. Family Alpha HOLD #255. No merge/deploy, shipping public app, hosted Supabase, private wardrobes, model weights, prompts or original photographs changed. Mission 1 remains incomplete; Mission 2 has not begun.

## Exact baseline and bounded correction

Direct base is verified PR765 `1fb8f48d34ef70f22bf073962fede8441ec97a39`. Its six external Fashionpedia photographs and 16 published human polygons are reused as exposed development evidence. This is not a new independent or training-unseen holdout. Original 59-photo splits and the separate 153-candidate quarantine are unchanged. Publisher-recorded Pexels image permissions and missing original per-photo source pages retain the inherited provenance limitation. Published human annotations are not owner approval, independently witnessed two-reviewer adjudication, primary color or exact app subtype truth.

The original logits-to-label conversion drops pixels below probability .7 or margin .15. This can fragment garment edges before proposal grouping. The candidate works only from the real unchanged 18-class logits and already admitted original proposals; it cannot invent a new garment seed. It recomputes the original public label map and fails closed if any label differs from the supplied source map. Seed IDs must be distinct, mask membership valid/disjoint, supported and original confidence >=.8.

For each admitted seed, four-neighbour multi-source growth can claim only original rejected pixels whose SAME semantic family wins the original softmax with probability >=.5 and margin >=.1. Maximum additions are floor(50% of original seed area). No confident original label changes, no body/background winner recovery, no remote island or other-class claim, no proposal merging, no original pixel deletion. Ownership is unique across proposals. The thresholds were fixed before the first real-photo experiment; no photo-ID exceptions or target-mask coordinates are used. Input logits, map and original proposal masks remain immutable.

Expanded output is explicitly `needsReview:true`, `accepted:false`, with `confidence:null`. The original seed confidence is retained separately; minimum added-pixel confidence and actual added counts are reported. This is a candidate boundary tool, not a verified garment, ownership assertion, automatic save or 3D-ready cutout. The unchanged shipping app does not invoke it.

## Failed first arm and development-selected restriction

The initial all-class arm increased non-footwear matches but lost one existing individual-shoe match, leaving overall 8 TP / 5 FP / 8 FN unchanged. This adverse result is preserved and rerun in the final benchmark, not removed. Publisher annotations label individual shoes while the app can group pairs; all-class growth therefore cannot be represented as a general improvement.

A follow-up garment-only variant preserves footwear masks exactly. This restriction was selected AFTER observing the exposed development result and is explicitly not independent validation. The same fixed thresholds and budget remain. The final benchmark runs unchanged baseline, garment-only candidate and the initial all-class exploratory arm on the SAME actual model output and source JPEG in each browser. No model input, model weights, logits conversion or baseline grouping changes. The worker is instrumented in memory only to return actual mask bytes/receipts and evaluate the research function. Node independently rehashes all baseline and candidate masks and checks seed preservation, class/ID identity, review status and area budget.

## Local descriptive results before hosted verification

Chromium, six photos, 16 human instances:

| Diagnostic | Baseline | Garment-only candidate |
|---|---:|---:|
| TP / FP / FN | 8 / 5 / 8 | 9 / 4 / 7 |
| Instance precision | 61.54% | 69.23% |
| Instance recall | 50.00% | 56.25% |
| Instance F1 | 55.17% | 62.07% |
| Non-footwear TP / FP / FN (12 human instances) | 7 / 5 / 5 | 8 / 4 / 4 |
| Grouped semantic macro IoU | 0.528752 | 0.559597 |

The candidate adds 723 original-logit-supported raster pixels. No baseline matched annotation ID is lost in this local run. This is one additional match on an exposed, small, nonrepresentative development cohort; it is NOT independently verified broad recognition improvement. Source 11321 crosses the IoU >=.5 diagnostic threshold. Fine boundaries, class errors, occlusion and distant missed garments remain unresolved. The initial all-class arm remains 8 / 5 / 8 and is not the selected variant.

The grouped semantic IoU compares unions of admitted baseline proposal masks against unions of the candidate masks over all active supported classes, with missing/predicted-only classes included. It is NOT the earlier raw-label-map IoU (0.480161 over all active regions or 0.554032 conditional on human-present classes). Those unchanged raw-map values remain separately reported. One-to-one matching retains the earlier same-semantic-family, model-raster IoU >=.5 definition; this is not official AP or exact Tops-versus-Outerwear/subtype classification. Individual shoes stay in all-instance totals and remain unchanged by the selected candidate.

## Verification and visual interpretation

Seven new regressions exercise bounded growth and source immutability, no body/other-label/island recovery, separate same-class ownership, no invented seed, malformed/nonfinite/overlap rejection, exact source-map/logit agreement, seed confidence/identity guards, and footwear preservation versus the explicit all-class arm. Full final Node/Chromium/WebKit CI, final exact SHA and artifact links are recorded in the draft PR after completion.

Each final screenshot shows the SAME original photo with admitted baseline proposal pixels above and garment-only candidate pixels below, with published human contours in green. The top blue boxes are baseline proposal extents. This avoids falsely presenting raw rejected fragments as admitted baseline masks. No photo edits, generated garment pixels or inferred hidden geometry are used. Source/model/raw-map receipts, candidate budget/confidence/mask SHA receipts, per-image before/after matched IDs, lost/gained IDs, and all-class adverse results are retained in JSON.

The software verdict names only exposed-cohort gain when ALL baseline matched IDs are retained, per-photo false positives do not increase, total TP increases and grouped IoU does not decrease. A green CI run verifies execution/invariants, not this verdict, independent accuracy, physical devices, camera/private-closet behavior, owner approval or release. WebKit numerical differences must be preserved.

## Reproduction and integration

Run `python scripts/fetch-fashionpedia-66.py`, `node scripts/build.mjs`, `node --test --test-concurrency=1 tests/*.cjs tests/*.mjs`, then `MULTI16_RELAY_MODEL=1 MISSION1_ENGINE=chromium node scripts/test-mission1-seeded-boundary-recovery-browser.mjs` and the corresponding WebKit command. Artifacts are written under `benchmark/mission1-seeded-boundary-recovery/<engine>/`.

Review only this isolated five-file diff on top of PR765. Keep the candidate opt-in and review-only; integration into capture or private closet requires fresh acceptance on independently supplied, rights-cleared, representative held-out masks and explicit human review. Retain unchanged original-photo/2D fallbacks. Do not promote this development-selected restriction into production from these results.

Inherited annotation attribution: Fashionpedia Consortium; Jia et al., *Fashionpedia: Ontology, Segmentation, and an Attribute Localization Dataset*, ECCV 2020; https://arxiv.org/abs/2004.12276 ; https://github.com/cvdfoundation/fashionpedia ; CC BY 4.0 annotations https://fashionpedia.github.io/home/data_license.html . No annotations are newly authored or relabeled here.
