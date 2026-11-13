# Mission 1 P862 — Segmented subtype review and honest mask-only confidence (HOLD)

**Family Alpha HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED.** No main, production, staging, hosted Supabase, private owner JPEG/wardrobe, model weights, taxonomy or alternate mission branch modified.

## Source and priority
Immutable parent is Mission 1 P861 [PR #1019](https://github.com/nickhaney916-lang/Closet-Current/pull/1019) exact `bb7dfc69c6d11ef0daaa2c72a8ca90ab2cf78c34` (verified 2/2 strict NO DEPLOY CI, 549/549 native). P861 protects the integrity of source-locked research model-score receipts but does not measure or repair classifier accuracy.

Read the actual modern worker and isolated-garment model path. It had two **real source-level safety defects**, previously explicitly left unresolved by P838:
1. `classifyIsolatedGarment()` returned `strong:true` for a high-confidence semantic mask even when BOTH model views could not substantiate any subtype. The returned `itemType:'Unknown'` and `categoryOnly:true` are not a strong garment identification. It also fired `onIdentified` for that Unknown.
2. `public/local-worker.mjs` applied the source-independent four-risk subtype review policy only if `!request.hint`. A segmented garment could produce a strong high-risk `Ankle boots`, `Tunic`, `Blazer` or `Sweatshirt` from the same FashionCLIP model yet bypass the rule. A mask category is not independent subtype ground truth.

## Narrow code changes
- Isolated garment mask-only category fallback now yields `strong:false, categoryConfirmed:true, categoryOnly:true, itemType:'Unknown'`, reason `mask_category_type_review`. A provisional identified event occurs ONLY for a supported explicit subtype.
- Apply the existing unchanged P838 source-independent high-risk prediction guard to **both** hinted and unhinted strong results. An unresolved risky type must become owner-review-only and must not emit an optimistic worker `identified` event.
- Preserve normal strong hints for nonrisk types that actually pass two model views and mask agreement. Do not change 47-label vocabulary, recognition model/weights, color system, original photo bytes, private wardrobe, API shapes, HMAC/sha binding or owner confirmation.
- Update the two existing tests that codified the old misleading confidence and hinted risk bypass; add source-executing P862 tests and strict NO DEPLOY CI.
- Run full native, browser owner-review, original-photo regression safety and isolated public development worker as supported; do not call synthetic tests new model accuracy.

## Crucial truth boundary
This repairs **no-silent-wrong-save behavior**, NOT empirical type accuracy. It may increase manual review. The historical 32 public-development-photo regression still has five boot `Shoes/Unknown` safety abstentions versus an unsafe older auto-classification expectation; **do not lift the guard or edit labels to claim regression fixed.** A risk-flagged `Ankle boots` classifier prediction on a shoe photo cannot be proven true from these synthetic inputs. No genuinely new 60+ source-disjoint human-reviewed blind photograph cohort, independently verified 10/10, physical phone acceptance or signed hosted-cloud acceptance is provided. Main Mission 1 remains RELEASE NO-GO.

## CI result
Claim only after exact P862 HEAD run is observed. Current report is an implementation description, not CI evidence.
