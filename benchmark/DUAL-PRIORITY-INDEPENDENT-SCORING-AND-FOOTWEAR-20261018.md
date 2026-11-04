# Two development priorities: independent score reliability and footwear readiness

October 18, 2026 — draft PR #7 development branch only.

## Priority 1: category-correct, complete-source independent scoring

The existing research-only `benchmark/physical-garment-inventory.mjs`
compared unapproved model masks with separately human-identified and
independently approved individual physical garments. A model could localize a
blazer perfectly but call it a shirt: that was valid **localization** evidence,
not a correct garment-category match.

New scoring uses **two separate optimal one-to-one assignments**:

- **Localization-only:** IoU ≥ 0.5, regardless of model category, to count
  detected physical garments without double-counting duplicate predictions.
- **Correct-category constrained:** IoU ≥ 0.5 **and** the predicted broad
  garment category agrees with the independently approved human category.
  A second independent assignment is necessary: simply checking the
  localization assignment can undercount a correctly categorized second
  model mask that lost a higher-IoU competition to an incorrectly labeled
  candidate.

Both scores only become measurable when actual humans independently draw
the entire scene, the second reviewer approves it, and the source SHA
matches exactly. Shoes/Hosiery are separate unsupported categories in the
DeepFashion2 taxonomy and cannot count as a supported-class success.
`scripts/score-physical-garment-inventory.mjs` now also **refuses to call
a partial review a ten-photo accuracy report**: it requires the exact ten
unique pinned source IDs before reporting any aggregate metrics.

Regressions cover wrong-category higher-IoU masks, missed garments,
unsupported shoes/tights, duplicate model proposals, rejected false approval,
the source-count gate and the CLI's actual JSON results. Every CLI fixture
that depicts an approval uses a temporary **synthetic-only** mask and is
deleted after testing. It is not a genuine first/second human review.

## Priority 2: separate footwear/hosiery suitability decision

`benchmark/footwear-readiness.mjs`, `tests/footwear-readiness.test.mjs`
and `scripts/audit-footwear-readiness.mjs` combine **existing verified
research facts without treating dissimilar image suites as head-to-head
ground truth**.

- Experimental DeepFashion2: on `commons-0079` and `validation-0019`,
  the model's category taxonomy does not include shoes. Both source-verified
  negative-control images have zero footwear model proposals.
- Earlier pinned LIP human-parsing evaluation: on `validation-0030` the
  mask confused striped socks and boot shafts; on `validation-0031` it
  produced no sock pixels for sheer tights and shoe class pixels were
  present. These are qualitative failings from a distinct two-photo test,
  **not measured per-pixel precision or a comparison of matching images**.
- The report therefore sets footwear recall/precision and model improvement
  **null**, requires independent original-photo shoe, strap, heel, toe and
  tights outlines before promotion, and always forbids customer auto-saving
  from either experiment. No new model was deployed or paid service used.

## Verification

The [experimental pinned DeepFashion CI run 39169378676](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39169378676)
passed **21 focused Node tests, zero failures**, including a synthetic
ten-source CLI round-trip and cross-study footwear rejection. Ten unchanged
SHA-locked real-photo sources were processed; `PHYSICAL_GARMENT_INVENTORY_AUDIT`
reported ten sources, **zero human-approved inventories** and **null real
garment accuracy**; `FOOTWEAR_MODEL_READINESS` reported two DeepFashion
footwear controls and two historical LIP photos, **null real shoe accuracy**
and **promotion blocked**. Other PR-wide checks are independent and should
not be claimed complete until they finish.

## Remaining external evidence

To unlock genuinely measured real-photo accuracy, two different real human
reviewers must identify *all visible physical garments* on the complete
source photos, draw/approve individual independent masks (including model-
missed skirts, footwear, tights and layers), and assemble matching complete
inventories. The already prepared ten-photo review package supports this.

Only after legitimate independently approved held-out masks exist should
category-correct IoU/recall be computed and an alternate garment/footwear
model considered. A successful code test, existing model proposal, source
description, or assistant-generated outline is **not** independent human
ground truth. Customer production, paid AI, source RGB and Drive Duel are
unchanged.
