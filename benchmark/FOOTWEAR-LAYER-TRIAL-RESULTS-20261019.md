# Footwear and layered-garment recovery — completed research checkpoint (October 19, 2026)

## Decision
**Do not deploy a generic “Ankle boots means review” rule, and do not promote a model-only skirt or underlayer proposal into the customer's closet.** On the unchanged real-photo references available today neither change has defensible independent physical-garment validation. The current original-RGB-first recognition engine and its conservative review-only segmentation remain unchanged.

## Reproducible actual-model evidence

[Verified real-photo tradeoff workflow 39291554766](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39291554766): **8 passed, 0 failed, 0 skipped**. It reused original-browser FashionCLIP outputs and SHA-locked licensed originals from [run 39276247888](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39276247888), [original three-frame audit 39278360491](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39278360491) and [same-source cross-model layered suite 39198099443](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39198099443). **No inference rerun or paid AI call** was needed.

| Actual original-photo cohort | Number of photo sources | Shoes in existing manifest | Automatically accepted ankle boots |
|---|---:|---:|---|
| Original reviewed 32 | 32 | 13 | 5 — all manifest-compatible Boots |
| Fixed holdout 16 | 16 | 3 | 1 — labeled Sneakers, model called Ankle boots |
| Fresh 11 | 11 | 4 | 0 |
| **Total** | **59** | **20** | **6** |

A blanket rule to hold all strong **Ankle boots** predictions for manual subtype review would prevent the one mistaken subtype *against the currently unadjudicated holdout manifest*, but impose five extra reviews on manifest-compatible boot images. **That is one flagged mismatch for five otherwise unnecessary reviews**, not a proven improvement or a calibrated error rate. In the disputed `commons-0078` high-top sneaker, original 288/320/336 crops **all agree on the wrong ankle-boot subtype**: the same-model framing consensus is insufficient as a rescue/verification technique.

## Layered outfit cross-model experiment

- **`validation-0031` worn outfit**: independent experimental instance model suggested skirt at **0.238 confidence** despite the semantic parser providing **zero trusted skirt pixels**; the semantic parser also struggled with the separate top. This points to a **review priority**, not a verified separately segmented skirt or blouse.
- **`commons-0059` flat-lay**: independent model proposed `long_sleeve_top` as well as a dress while semantic model emitted a dress region and did not detect a wearer. The source title indicates dress and jacket, but neither source title nor two model proposals establishes two independently outlined garments. It remains original-RGB, source-only review.

The experimental DeepFashion2 taxonomy **does not include shoes or hosiery** and therefore cannot cross-validate high-top sneakers vs ankle boots or recover shoes/stockings in a physical item inventory. Source matches have been established only for the two cited layered scenes; no general item-level recall, mask IoU or released segmentation accuracy exists.

## Completed changes
- New **strict replay** of all three original-image cohorts and the independent-model layered observations, with 59 verified immutable source IDs, original SHA locks, licensing evidence and complete actual classifier output for each cohort.
- Counterfactual of broad shoe subtype review measures **correct references lost as well as apparent mistakes prevented** and reports them separately per cohort, no favorable cherry-picking.
- Fail-closed tests for missing or duplicated inference, tampered original identity and falsely claimed category/form/model approval.
- Structured GitHub artifact for future adjudication. No garment original changed, customer automatic-save path modified, prompt/site/payments altered or production branch merged.

## Next evidence gates
1. Independently adjudicate actual shoe forms in the 16-photo holdout, especially high-top sneakers versus fashion ankle boots. The two reviewer-blind packets are available in [draft PR #22](https://github.com/nickhaney916-lang/Closet-Current/pull/22).
2. Independently inventory and draw per-item source masks on genuinely layered photos; second reviewer validates all visibly distinct garments and uncertain regions.
3. Evaluate *different* candidate shoe feature extractor / licensed independent model on a **new untouched** photo set, keeping identity/color from high-resolution original RGB. No provider billing or model download into production without permission.
4. Promote a code change only if it improves independently measured subtype errors **without reducing correct automatic coverage unacceptably**. Actual iOS/Android phone captures and live AI image fidelity remain separate release blockers.

**This completed research excludes two unsafe fixes; it does not improve model accuracy and cannot authorize a pilot on its own.**
