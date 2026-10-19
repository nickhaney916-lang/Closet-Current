# Original-photo garment form ground-truth gate — October 19, 2026

## Purpose
Before trying to improve garment-type classification from real original photos, rule out misleading reference labels and multiple-item sources. The source's file name is a **cue to inspect**, not proof of the visible garment type, shape, or count. A FashionCLIP prediction is likewise not ground truth.

## Reproducible evidence
- [Completed actual browser inference, original full-photo frame study](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39278360491): 16 public photo sources, original FashionCLIP predictions and three original-photo framing variants. The three recorded wrong types stayed unchanged across all three framings.
- [Completed independent-source-audit workflow](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39289309062): **17 passed, 0 failed**, SHA matches, licensed original metadata, exact existing inference result identities, no new model inference, no paid API.
- [Source manifest](../benchmark/manifest-holdout-16.json); [SHA lock and licensing](../benchmark/locked-photo-sources.json). The structured `review-queue.json` is the CI artifact, **not** a user closet file.

| Original ID | Existing manifest | Existing model | Required review |
|---|---|---|---|
| `commons-0003` | T-shirt | Sweatshirt | Inspect long-sleeve garment's actual construction. File title alone may be overly broad |
| `commons-0014` | Blouse | Tunic | Decide whether these styles legitimately overlap or the model chose the wrong type |
| `commons-0078` | Sneakers | Ankle boots | Inspect high-top athletic footwear silhouette, closure, upper material and sole |
| `commons-0059` | Dress | No category | File title says **Dress and jacket**; inspect complete source for *more than one item*, not just one dress |
| `commons-0016` | Blouse | No category | Determine whether garment is visually identifiable in the original |
| `commons-0036` | Skirt | No category | Inspect skirt versus bottoms shape and source framing |
| `commons-0062` | Jacket | No category | Inspect true outerwear construction |
| `commons-0095` | Boots | No category | Inspect original boot visibility and possible framing/background ambiguity |

**Scope and safeguards:** These are 8 *review flags*, not 8 confirmed model errors. Other original photos have no flagged issues **under this exact audit**, not independent form certification. The three specific-type disagreements have strong model predictions, so changing a confidence threshold or comparing more images from the same model is not a demonstrated solution. The remaining two more-general published metrics (61.54% broad category coverage; 30.77% specific type accuracy over the fixed single-photo manifest) still use unadjudicated source labels, and the dress+jacket example must not be counted as complete physical-item recognition.

### Minimum accepted original-photo adjudication
1. Two **separate** human reviewers independently examine each SHA-verified original *before seeing model suggestions*. Record all visible distinct physical garments, not just the file title's nominal subject. Mark obscured/unclear clothing unknown; never infer a hidden garment.
2. Compare reviewers' full-photo inventories, settle class/type disagreements with original-pixel evidence, and explicitly distinguish a sneaker from a fashion boot or shirt from sweatshirt based on visible features. Document evidence and uncertainty. Full-outfit photos require independently traced item outlines.
3. Run the existing independent physical-item inventory and garment-form match evaluation where outlines are reviewed; verify cross-image holds against a **new untouched holdout**. Never tune on these disputed samples then claim they are still independent.
4. Release gates remain: actual Android and iOS photos, real rendered two-garment fabric/detail fidelity and authorized spend cap, consent, and privacy review. No fake masks or manufactured acceptance evidence.

The audit intentionally emits **null** independent category accuracy, specific-form accuracy and physical-item recall and has **zero** customer automatic saves. No product-model threshold, production closet record, paid AI or deployed service changed.
