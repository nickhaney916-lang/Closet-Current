# GARMENT-CLASSIFICATION-ACCURACY-48 — model investigation

## Current system

- Model: `ff13/fashion-clip`, pinned revision `0f99955d944c39bfd9d035a02ac273c7a44a406b` (MIT model-card license).
- Transformers.js `3.8.1`; ONNX Runtime Web/WASM; Q8 image encoder; 1 WASM thread; 512-d image/text embeddings and pinned cosine scale.
- The model sees an app-preprocessed image locally; photos are never sent to the model host. Runtime code imports the Transformers.js package and downloads the public model assets. Browser timing may hide cross-origin byte totals.
- Category and subtype checks reuse the same weights and score function. Calling the same model with a different label set is not independent model corroboration. Multiple crops/frames can provide useful framing stability evidence, but share the same learned representation.
- A high softmax score is relative to the supplied candidate list and is not a calibrated probability. Candidate competition, mixed clothing in the frame, model training bias toward centered product imagery, and visual cues absent from a short label can produce confident errors. Existing gates reduce some unsafe accepts but do not repair representation or label semantics.

## Approaches

| Approach | Evidence / decision |
|---|---|
| More thresholding or stronger agreement gates | Already present in the current hierarchical engine; risks lower coverage without correcting ranking. Keep only the prior #47 human-review gate for its documented pairs. |
| Descriptive prompt ensembles in the same embedding space | Selected for this bounded experiment. Candidate descriptions are predeclared in `prompt-overrides.json`, averaged with 0.75 ensemble weight, and versioned separately. Same image model, same local runtime, modest vector payload increase. Actual paired results decide whether it is useful. |
| Alternative local FashionSigLIP | Credible licensing and fashion retrieval focus (Apache-2.0) but no verified Transformers.js/ONNX mobile export or accepted-class garment benchmark in this work. Do not swap the working model based on retrieval marketing metrics alone. |
| Fine-tuned supervised classifier | Not selected: 59 photos with provisional single-review labels are far too few for train/tune and independent 100–200 image evaluation. Avoid leaking the holdout or overselling it. |
| Hand-coded silhouette rules | Not selected for production integration: viewpoint, occlusion, loose hems, footwear perspective, and person-worn images make these features unreliable without a validated visual-feature extractor. |

## Correctness and deployment boundaries

Candidate changes only text embeddings for 16 existing class labels. Categories, vocabulary, score thresholds, `recognizeGarment` hierarchy, negative prompts, source image preprocessing, storage, user-confirmation gates, and saved human labels stay the same. Exact baseline and candidate outputs are retained separately. This is a model-prompt experiment, not an independently trained model or proof of accuracy improvement.
