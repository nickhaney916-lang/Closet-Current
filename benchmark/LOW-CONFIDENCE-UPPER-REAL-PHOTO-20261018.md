# Real licensed layered-photo upper-garment review candidate — October 18, 2026 Pacific

## Later verified correction — narrow sleeve fragment suppressed

After inspecting the **actual six display/recognition crops** stored in GitHub Actions
artifact `mobile-flow-results` for [run 39195853024](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39195853024),
the newly exposed Upper garment crop showed **a narrow region of gray blazer
shoulder/sleeve fabric**, not a useful entire garment. The Dress-labeled region
also includes skirt, exposed legs and blazer, and the Shoes-labeled region
contains background/floor and chair as well as footwear. These are **qualitative
visual observations**, not human-approved full-photo pixel masks.

The initial 3-region experiment below is retained as historical test evidence,
**NOT as the recommended implementation**. The corrected research path retains
only weak upper regions whose trusted mask bounds span at least 12% of the
source model frame in both width and height. In particular, small narrow
sleeve-like evidence no longer creates an additional customer review card.
Strong-confidence processing is unchanged; suppressed fragments still appear
in model diagnostic counts, not closet inventory.

The existing **actual-worker licensed-photo** mobile workflow
[run 39196872104](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39196872104)
passed, after this correction:
- **2** review-only candidate regions (Dress and Shoes), **0** automatically saved.
- The narrow upper fragment is no longer user-facing; original-source and
  recognition-crop preservation remain intact.
- Readiness report remains `blocked`: zero automatic garments, missing
  source-reference categories and two pending reviews.
- Measured physical garment accuracy, pixel IoU, color accuracy: **null**;
  no independent approved outline, physical phone test or production approval.

This correction **reduces false review clutter**; it does not improve measured
mask/recognition accuracy. The team still needs genuinely independent full-photo
annotations and a model that can distinguish worn jacket, shirt and skirt.

---


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
