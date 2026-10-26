# Recognition learning review — October 26, 2026

Reviewed production main `1f43dcf933f965913e6ae469d179f46b1cb645c7` and validated candidate `5a48ff7da1a528e4e1107f33d25b06d1ec2ca090`. The October 26 recommendation refresh and intervening work are retained. Separate Family Alpha/recognition draft branches were reviewed for context and were not merged or overwritten.

## Targeted confirmed-example repair

Four new tests demonstrated unsafe retrieval suggestions before the repair:

- A known T-shirt could receive pattern/sleeve suggestions from confirmed Polos. Reject a conflicting known query subtype before proposing any attribute.
- A duplicate of the query photo under a different item ID could count as supporting evidence. Exclude the query's actual recognition source, falling back to its display photo only when no recognition source exists.
- The same query source could evade this exclusion behind a different display cutout. Compare unmasked recognition-source identity.
- Two revisions with the same reference item ID but different photos could satisfy the two-example requirement. Deduplicate reference IDs as well as photo strings.

All four new cases fail on the previous implementation and pass after the repair. Same-subtype retrieval, two independent confirmed examples, manual fields and the item's own color remain supported. Suggestions still require human confirmation; threshold 0.9 and minimum two agreeing examples are unchanged. The caller continues to supply only the signed-in account's wardrobe. No private wardrobe, account data or customer photo was accessed. No unconfirmed prediction is used as a reference label.

## Validation and comparison

- Baseline build: **249/249** Node tests passed. Candidate build: **253/253**, zero failures/skips; **14/14** focused retrieval cases passed.
- [Candidate Node workflow](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40351853520): success.
- [Candidate real FashionCLIP browser inference and confirmed-example evaluation](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40351853348): success on all 59 locked licensed photos, including every per-photo regression gate.
- Prior validated production [benchmark run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38777903857) at `afdd179f590df2b2c63fc577385a119a92c18d79` remains available as the comparison. Main's worker, engine, preprocessing, vectors and outfit segmentation/cropping assets are byte-identical to that baseline.

| Locked cohort | Prior correct categories | Current correct categories | Prior/current exact subtype matches |
| --- | ---: | ---: | ---: |
| Reviewed 32 | 32/32 | 32/32 | 23/32 |
| Holdout clothing | 8/13 | 8/13 | 4/13 |
| Fresh 11 | 11/11 | 11/11 | 6/11 |
| Nonclothing negatives | 3/3 rejected | 3/3 rejected | Not applicable |

Evaluation objects and per-photo category/type acceptance, reason, detail and color outputs are unchanged. This is a retrieval safety repair, **not an accuracy improvement**. The older October 14 report's 26/32 categories and 7/13 holdout result were superseded by subsequent guarded production recognition work; they must not be described as the latest baseline.

The [latest October 26 nightly run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40340221801) passed twice with 14/14 categories per attempt. That is a selected licensed-photo mobile-emulation set, not 100% recognition of all garments, exact types, colors or physical phone captures. Latest main deployment, Node, Chromium mobile, WebKit and private-backup workflows were green when reviewed.

Real-feature retrieval still produced **zero qualifying proposals** on reviewed32, holdout16 and fresh11. Confirmed-example retrieval is not neural self-training. No new positive learning/accuracy claim is supported.

## Remaining failures and next evidence

Existing automatically accepted subtype mismatches remain visible: `commons-0064` Jacket→Blazer; `commons-0003` T-shirt→Sweatshirt; `commons-0014` Blouse→Tunic; `commons-0078` Sneakers→Ankle boots. Holdout abstentions remain `commons-0016`, `commons-0036`, `commons-0059`, `commons-0062` and `commons-0095`. The existing regression checker tolerates only the same known subtype mismatches; a green run does not mean they are correct.

Further class/type tuning needs independently labeled original phone photos and frozen release holdouts, especially shoes, dresses, skirts/shorts and outerwear. New physical-phone color truth, automatic mask completeness/IoU and layered-instance recall were not measured here. Do not loosen confidence gates or modify expected labels to manufacture a gain.

Only `public/clothing-memory.js` and its tests change runtime behavior. The simplified interface, automatic crop/save pipeline, high-resolution capture, manual corrections and private account storage are preserved. No provider/backend configuration, email, paid service, private wardrobe or Drive Duel was touched. Promotion must use an expected-main SHA lease; if main advances, inspect and retain intervening changes before retrying.

Machine-readable evidence and all 59 compact outcomes: [recognition-learning-review-20261026.json](recognition-learning-review-20261026.json).
