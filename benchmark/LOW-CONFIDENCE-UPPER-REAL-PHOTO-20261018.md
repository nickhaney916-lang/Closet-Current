# Real licensed layered-photo upper-garment review candidate — October 18, 2026 Pacific

## Source and runs
- Source: licensed original `validation-0031`, SHA-256 `0e145aa5432df3457521200d1e1bb896f66abd66fb041d31ed0db591e00e2fdc`. The photographer's description mentions blazer, shirt, skirt, tights and heels, but it **is not** independently reviewed pixel-level ground truth.
- Baseline: PR #7 prior to this experiment, e.g. [mobile run 39194138916](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39194138916). Actual browser outfit worker: **2 uncertain source regions** (Dress and Shoes); **0 automatic saves**.
- Isolated research branch [mobile run 39195853024](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39195853024), source revision `0f690c75bcc75334741d9daf231a2134c25708d2`. Existing full mobile flow completed successfully.

## Observed change from actual inference, not simulated labels
The original browser worker now emits **3 review-only source crops, 0 automatic saves**:

| Candidate label (model-proposed, not human truth) | Mean mask confidence | Display fallback | Automatically saved? |
| --- | ---: | --- | --- |
| Upper garment | 0.71781 | `low-confidence-upper-mask`, original RGB crop | No |
| Dress | 0.84192 | `fragmented-mask`, original RGB crop | No |
| Shoes | 0.89237 | `fragmented-mask`, original RGB crop | No |

For Upper garment, the model had **396 winning-label pixels**, of which **56** survived its per-pixel trust threshold, with **52** in eligible connected components. The old aggregate mean-confidence threshold discarded this region; the new **narrow and explicitly review-only** path retains its original photo crop without approving it as a garment. The two pre-existing uncertain crops remain as before. All three retained their full-photo references and narrow original-RGB recognition crops.

The independent `REAL_WHOLE_OUTFIT_READINESS` report from the same run correctly says:
- `status: blocked`
- blockers: `zero-automatic-garments`, `reference-categories-not-automatically-covered`, `regions-still-need-review`.
- Pixel segmentation precision/recall, true physical garment counts, correct-category garment recall and color accuracy: **null/not measured**.
- `sourcePreserved: true`; `unapprovedAutomaticSaves: 0`; `productionReady: false`.

## Interpretation and constraints
This is **improved visibility of model uncertainty**, not verified garment separation or better classification. The upper crop might contain portions of a blazer, shirt, skin or background; its correct physical identity is unknown. Nothing is auto-classified, colored, indexed, or published as clothing on the strength of this candidate. A new review candidate could be user-visible clutter; evaluate the UX on physical phones and against independently reviewed masks before deciding whether to integrate this change.

This branch is an isolated draft targeting the existing development branch, **not production**. The extra branch-specific mobile workflow trigger was temporary and must be removed before integration. Do not merge/deploy without owner approval. No model provider payment, selfie processing, original photo edits, or Drive Duel changes.
