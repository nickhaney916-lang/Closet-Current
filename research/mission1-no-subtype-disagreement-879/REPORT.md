# Mission 1 P879 — subtype-disagreeing two-model review must abstain

**Family Alpha HOLD #255 OPEN. Isolated research DRAFT / UNMERGED / UNDEPLOYED, no live accounts, photos, hosted Supabase, staging, production or private wardrobes.**

## Exact source-verified checkpoint
P878 parent draft [#1085](https://github.com/nickhaney916-lang/Closet-Current/pull/1085), exact immutable commit `1962449bfe4010fbd8fdc35a4c2723fd9cf34c7a`, verified [no-deploy Actions #43531520669](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43531520669) completed **2/2 SUCCESS**: 601/601 native tests; all 48/48 original public source hashes, model request digests, historical manifest rows, independently recomputed model decisions; genuine q8 FashionCLIP+FashionSigLIP one desktop Chromium continuous session, **0 automatic saves**; desktop Chromium/WebKit owner-review policies passed 320/390/430 widths. The real historical-source full-frame SigLIP experiment yielded 28/45 vs 27/45 *developer-exposed string* garment subtype first-rank matches. No independent human blind accuracy, no solved sneaker-versus-ankle-boot confusion.

## Actual defect and conservative improvement
`arbitrate81` already explicitly returns `status:'abstain'` with `subtype_disagreement` when FashionCLIP and FashionSigLIP have **different top subtypes within one category**. However `dual-panel-82.mjs::sharedRankChoices82` previously still allowed clickable `Use` buttons if the shared first five ranks intersected. The owner had to acknowledge and still confirm normal Save, so this is **not evidence of automatic wrong saves**. But it is logically inconsistent: a model refusal should not be presented as an actionable AI subtype choice.

P879 makes the optional panel fail closed on any non-hypothesis outcome and verifies **identical top label** in both actual model observations before returning a shortcut. When subtype disagreement exists, the panel describes the dispute and directs the owner to examine the **unchanged original** and use normal manual Adjust. Other existing guards (known risky Sweatshirt/Tunic/Blazer/Ankle boots, tied ranks, nonclothing, category conflict, owner scope, explicit photo review, footwear pairing, original JPEG, revisions, cancellations, 2D fallback) are retained. No model weights, thresholds, training, ranking engine, cloud or normal local recognition touched.

The existing signed-owner simulated browser test is adjusted to use real independent-model **top agreement** for its positive owner-confirmed example, while adding an explicit two-family **Shorts-vs-Skirt** conflict with zero clickable subtype buttons and zero writes; formerly one-family-only shortcuts are now also blocked when that family disagrees on the top subtype. A new seven-case native test covers agreement, subtype conflict, category conflict, tied rank, risk veto, forged decision reason and consent-only misclassification.

## Genuine photo evaluation protocol, frozen before results
New `scripts/p879-dual-disagreement-audit.mjs` reads the same 48 SHA-locked publicly sourced, developer-exposed JPEGs with the same pinned genuine FashionCLIP and FashionSigLIP weights, runs the strict original-to-model P878 custody check, compares the previous P878 actionable choices to the P879 choices, verifies **no new model shortcut is added** and that any withdrawn suggestion results from an abstaining model decision; totals are numeric only. One continuous desktop Chromium session (one terminated worker per photo), no original photographs in artifacts, no non-GET/external requests and no saving.

**Any withheld button is a reduction of AI shortcut coverage—not a correct classification improvement.** Some previously proposed labels may have been correct. No new independently blind photos or human ground truth are available; developer-exposed original strings cannot determine 10/10, sensitivity, specificity, or new accuracy. No owner-facing model rollout is authorized by this research PR.

## Reproduce
- `node --test tests/mission1-disagreement-879.test.mjs`
- `node scripts/test-p82-review-browser.mjs` (desktop Chromium/WebKit synthetic owner policy)
- `P877_FULL_FRAME=1 node scripts/p82-real-browser.mjs chromium benchmark/p879-real-chromium` (requires pinned public source/model assets)
- `node scripts/p879-dual-disagreement-audit.mjs benchmark/p879-real-chromium/results.json benchmark/p879-real-chromium/conflict-audit.json`

**No-deploy CI status pending; do not report passing tests or photo coverage numbers until exact HEAD verified.** 60+ independently adjudicated source-disjoint originals, actual repeat WebKit mobile inference (#83), physical Android/iPhone, signed two-owner cloud and Family Alpha release gates remain BLOCKED. Family Alpha HOLD #255 stays OPEN.
