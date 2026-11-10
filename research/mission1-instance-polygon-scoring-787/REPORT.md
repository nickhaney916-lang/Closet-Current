# Closet Current Mission 1 P787 — Original-pixel garment instance mask scoring

**FAMILY ALPHA HOLD #255. Draft/unmerged/undeployed.** Inherits P786 exact source `ef7a9498b023b52b2dbe4fbb1c92c181f0d79687`.

## Engineering mission

P786 genuinely executed an independent ONNX instance model on six original publisher-labeled Pexels/Fashionpedia JPEGs, but it never converted output tensors into garments or measured overlap with the published human masks. P787 takes the next verifiable step: **actual source-coordinate instance segmentation and one-to-one ground-truth comparison**. This does not improve the trained model or remove its legal restrictions.

- Reuses P786's **exact immutable model URL and source JPEG SHA validation**. Additionally checks the model weight file's observed SHA-256 `485bc106721febbd82fe24297e12a9fb49a435a552afff1e6b76308716555f76`.
- Decodes genuine ONNX `[1,300,38]` post-NMS rows: four `xyxy` coordinates, score, 13-class index and 32 mask coefficients; applies actual coefficients to the model's `[1,32,104,104]` prototypes and sigmoid threshold.
- Crops masks to their model-space detection boxes, inversely maps the exact P786 letterbox without resynthesizing image evidence, and returns the mask on the source JPEG's unchanged original resolution.
- Uses P66's actual immutable Fashionpedia publisher polygon annotations; records unsupported label classes instead of claiming the model recognized shoes or other categories outside its 13-category contract.
- Matching is strictly one-to-one, class-compatible, at `IoU >= 0.50`. Pre-registered `confidence >= 0.25` and `mask probability >= 0.50` are fixed before analyzing actual publisher masks. Every unmatched decoded model instance is a false positive; every missed supported publisher polygon a false negative. No class is relabeled to create a match.
- Outputs **only scored public-source IDs, original and model SHA, mask/box statistics, IoU, TP/FP/FN**, not photo pixels, derived mask rasters or model weights.
- Adds synthetic-only geometry/score/adversarial unit tests; dedicated exact-parent, narrow-path GitHub Actions rebuilds the six actual P66 original JPEGs and runs real unmodified ONNX inference before scoring, erases both source JPEG and model weights.

## Meaning and limitations

These exact six photos were previously exposed to model research and **are not a prospective unseen holdout**. Publisher polygons are pre-existing third-party human annotations and **not two independently audited, blinded human reviewers**. The external model's DeepFashion2 training-data commercial rights are **not independently cleared**, regardless of its model card's Apache-2.0 label. Do not merge, deploy, activate native recognition, assert accurate subtype/color, save user clothing automatically, claim physical mobile acceptance, or authorize a release.

**Mission 1 end-to-end acceptance requires** legally cleared new independent photographs; double-blind manually signed human instance boundaries and category/type/color; satisfactory real photo detection, separation, mask and color evidence, verified mobile owner-to-private-cloud behavior, and explicit owner release approval.

Status: actual original-photo metrics to be populated only from exact-head dedicated no-deploy CI. **Never substitute made-up or synthetic results for genuine model performance.**
