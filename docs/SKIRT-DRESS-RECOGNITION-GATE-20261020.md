# Skirt versus short dress — strict original-photo recovery

**2026-10-20.** Main Closet Current customer recognition track, stacked on PR #78 (not merged or deployed).

## Identified correctness risk

The existing `recognizeWithRecovery` stage sometimes used a restricted list of Bottoms garments and non-garment negatives to rescue uncertain Shorts/Skirt/Trousers. If its two image views returned a confident **Skirt** vote, that vote could previously trigger automatic indexing even though **Dresses were not in the comparison set**. Scores from a restricted vocabulary cannot demonstrate an alternative dress was ruled out.

This matters for short dresses, long tunics, pleated skirts, and similarly shaped outfits; a wrong skirt category can lead to impossible outfit assembly (e.g. incorrectly adding a shirt over a dress). This is a structural comparison flaw, not a claim of any specific real-photo misclassification from this change.

## Implemented safe decision contract

1. **Skirt is never accepted solely on Bottoms-only evidence**. Even two confidently matching source-image views must compare it to Dresses before accepting that item type.
2. The existing independently supported Bottoms-only Shorts and other non-Skirt recoveries continue to use their earlier path and do not require extra garment passes.
3. Dress-inclusive Bottoms/Dresses/non-garment comparisons now cover initial `type_uncertain` outcomes, not only `checks_disagree` and `views_disagree`. Both original-image perspectives must agree strongly on type and category. If they disagree, keep the human review workflow; never fabricate a segmentation result.
4. No text prompts or vector metadata are regenerated, all model inference uses the original RGB image, original photo color and category indexing retains existing safeguards, and the saved wardrobe is not silently rewritten.

## Proof, pending gates and product limits

Four deterministic model-adapter regression scenarios in `tests/skirt-dress-recovery-gate.test.mjs` cover false Skirt holds, two-view Skirt agreement, Dress competition and unaffected Shorts. GitHub Actions automatically triggered the full Node application suite, real FashionCLIP/browser benchmark on verified licensed photos, and mobile browser framing checks.

Those workflows run asynchronously through GitHub and are **queued as of this checkpoint**. Do not represent queued tests as passing. Final exact-head verification must inspect completed jobs and any actual photo accuracy regressions, and correct any failures before pilot acceptance.

These code-level tests do **not** measure new real-photo category precision/recall. The real benchmark is a finite licensed holdout, not a sample of the owner's physical phone photos; the independent 12-photo mask reference has zero authenticated first+second-human approvals. Product launch still requires an integrated deployment plan, real-phone camera and crop QA, and human review of model figures/clothing boundaries.

No external paid providers, merges, production deploy, sensitive uploads, Drive Duel edits or change to the PR #76 human review chain.
