# Recognition prompt validation

Baseline: `d0f1cdff58bfb3c679016fe1a140bd016da490b7`. Selected profile: `coarse-jacket`.

| Set | Correct categories before → after | Automatic before → after | Category-only review before → after |
| --- | --- | --- | --- |
| Original 32 | 25/32 → 26/32 | 24 → 25 | 1 → 1 |
| Additional 13 garments | 5/13 → 7/13 | 5 → 6 | 0 → 1 |
| Independent fresh 11 | 8/11 → 10/11 | 8 → 9 | 0 → 1 |

Original shoes improved from 11/13 to 12/13. All three nonclothing negatives remained rejected. All previously identified categories and types were retained across all 59 images. Category-only dress results require review; they do not automatically save a guessed subtype. Exact subtype accuracy remains limited: 18/32, 3/13 and 6/11 after this change.

The original 32 and additional 16 were used for tuning. The fresh 11 labels and SHA256 image identities were locked before inference; the selected profile was chosen using only the older sets. Fresh photographs include five dresses, four shoes, one pair of jeans and one headtie. They are licensed Wikimedia photographs, with attribution and image hashes in the manifest. This small check is not a population accuracy estimate.

Only six normalized text-vector rows changed: Tops, Bottoms, Dresses, Outerwear, blurry-image rejection and Jacket. Each averages three or four descriptions including the canonical label. The other 1,145 rows remain bit-for-bit unchanged. The vision model, model revision, inference thresholds, crop preprocessing and number of image passes are unchanged. Broader trial ensembles were rejected for regressions. The existing consistent full-garment and content-crop preprocessing is retained.

The vector builder previously requested an unavailable PyTorch checkpoint. It now uses the pinned fp32 ONNX text encoder, verifies input/output identities and vector normalization, and supports bounded prompt overrides. The selected binary SHA256 is `e1e0415f2272e81c0f3ce2f08fd5fd5c2a9eb6481437d696936c723e8e1abb2f` (2,357,248 bytes).

Rebuild with `pip install -r scripts/recognition-requirements.txt` then `python scripts/rebuild-recognition-vectors.py --prompt-overrides benchmark/prompt-selected.json --output-dir benchmark/rebuilt-selected`. Generated assets require review and validation before promotion.

Validation evidence:

- [Actual before/after inference on all three sets](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38502026936): passed.
- [Prompt comparison and mobile flow](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38499936293): passed.
- [Repaired vector rebuild](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38499936353): passed.
- 154 Node checks pass with selected assets.

The mobile flow uses Chromium at a 390×844 touch viewport with a simulated 1920×1080 camera and the real recognition worker. Capture preserves 1920×1080 pixels; Adjust, save, search, filters, reload persistence and subsequent automatic photo indexing pass without page errors. Authentication uses a synthetic identity; production login and physical phone hardware have not been tested. A dedicated mobile workflow repeats this check on relevant main changes.

The simplified interface and high-resolution camera code are unchanged. Drive Duel is untouched. Dress/tunic and shoe subtype ambiguity remain priorities, along with physical-phone capture and login validation. Raw predictions and metrics are in `semantic-recognition-results.json`.

## Regression enforcement — October 14, 2026

The [latest production rerun](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38505942565) confirms the selected profile on all 59 photographs. Its actual predictions are frozen in `benchmark/regression-*.json`, with their source commit and run recorded. These contain labels and acceptance flags only, without photos or private data.

The real-photo workflow now checks each result against those snapshots. Losing a previously correct category or accepted type, losing correct automatic indexing, accepting a nonclothing photo, introducing a new incorrect automatic subtype, guessing a subtype in category-only review, or producing missing, duplicate, unexpected or malformed results fails the workflow. Runtime errors also fail. Improvements remain allowed, including a reviewed dress becoming a correctly identified automatic result.

Four existing annotated automatic subtype mismatches remain explicitly reported: `commons-0064` (Blazer), `commons-0003` (Sweatshirt), `commons-0014` (Tunic), and `commons-0078` (Ankle boots). Only the same measured prediction is tolerated; a different wrong prediction fails. A green run therefore means no regression against this measured baseline, not perfect recognition. Expected labels and accepted subtype lists have not changed.

The checker passes on all three actual production result files. Six focused tests exercise deliberately degraded shoe/dress results, nonclothing acceptance, runtime failures, missing/duplicate/extra results, and the known mismatch exceptions. This change adds validation only; model, confidence gates, photo preprocessing, camera resolution and interface behavior are unchanged. Further inference changes must pass these checks before promotion. Physical-phone accuracy remains unverified.

Subsequent [dress and shoe subtype experiments](SUBTYPE-RECOGNITION-RESULTS.md) tested eight candidates on the same 59 photos. No candidate safely improved recognition; the validated production model and pipeline were retained.
