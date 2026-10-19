# Full-outfit recognition priority — model-backed checkpoint (October 18, 2026 Pacific)

This document records **actual licensed-source browser/ONNX evidence** separately from simulated test results, human truth, and customer readiness. No user wardrobe was examined.

## Results from two independent pinned model families

Verified cross-model CI: [run 39198099443](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39198099443). Both model artifacts were downloaded from previous successful jobs, the original photo SHA-256 identities matched, and all eight cross-model safety tests passed.

- **Worn layered outfit `validation-0031`**: the existing semantic model produced no trusted separate *Skirt* region; the independently run experimental DeepFashion2 model produced an unapproved `skirt` mask with confidence **0.238** and a `long_sleeve_top` mask with confidence **0.685**. Its masks visibly mix some clothing layers and lack independently approved pixel outlines. **Neither mask may be auto-indexed, nor does this establish a complete separate physical garment.**
- **Flat-laid `commons-0059`**: the semantic model predicted a substantial Dress-class region but rejected outfit segmentation through its **no-person evidence gate**. The separate DeepFashion instance model generated dress and top proposals that can describe different *parts of the same dress*. **Seven model proposals must not be mistaken for seven physical garments.**
- Only **two** original source IDs overlap between these particular research suites. No claim is made about the other source photos or population recognition accuracy.

## Conservative research-stage flat-lay fallback

`public/outfit-segmentation.mjs` now has `reviewOnlyUnwornOutfitGroups`: only substantial, sufficiently confident, spatially broad clothing regions when the wearer is not detected can be emitted as **original-RGB-only review candidates**. `outfit-worker.mjs` marks every such candidate `displayFallback='original-crop'`, reason `no-person-evidence-review-only`, returns **no automatically approved color**, and preserves the high-resolution source reference. The existing save gate prevents automatic inventory creation. Tiny noisy masks remain suppressed.

**Actual-browser validation:** [mobile flow 39198452629](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39198452629), full workflow passed, with original source SHAs and real pinned segmentation worker, no mocked mask predictions:
- Flat-lay `commons-0059`: **1** Dress-labeled possible region held for review, **0** automatic saves, `personGatePassed=false`, original photo preserved.
- Worn `validation-0031`: baseline unchanged: **2** uncertain regions (Dress, Shoes), **0** automatic saves; no fabricated skirt, shirt, jacket, or confident color.
- The exported flat-lay review crop was visually inspected: it shows **most of the dress** from original source RGB but retains white background, part of a chair and another dark fabric at the top. This is a usable *review location*, **not a clean garment cutout**. Do not call this garment-only clipping accuracy.
- The real-phone result is **not available**: the browser used an emulated 390×844 touch viewport.

## Release blockers still preventing completion

1. **Originally photographed physical-garment masks**: all ten source-verified photos require independently drawn, genuinely reviewed whole-scene outlines, including garments the models never proposed, each with a separate second reviewer. Existing annotation and inventory-scoring pages are prepared. No such completed human truth set exists; accuracy metrics stay null.
2. **Actual layered garment separation**: no method currently recovers complete distinct shirt, blazer and skirt from the worn layered reference without uncertain mixed pixels. Alternative DeepFashion proposals are review-only and not independently correct.
3. **Footwear and hosiery**: the experimental DeepFashion2 class taxonomy lacks shoes and hosiery. A separately validated, appropriately licensed footwear/hosiery-capable route is required.
4. **Physical phone proof**: Android and iPhone photo capture, account restore, phone memory/timing and visual readability tests are still outstanding.

Passing CI means engineering safety and repeatability on the known reference cases—not automatic-garment accuracy or pilot readiness.

## Boundaries

Isolated [draft PR #10](https://github.com/nickhaney916-lang/Closet-Current/pull/10) targets the existing PR #7 development branch; neither PR is merged into `main`. No paid inference, model activation on production, customer photos, selfie usage or Drive Duel changes. Keep original high-resolution RGB source photos and all user-adjusted records untouched.
