# Closet Current Mission 1 P786 — an actual alternate clothing *instance* model research gate

## Why
The original genuine SegFormer B0 semantic model cannot reliably separate two garments or tell a dress from its upper-region body. P785 corrects the dangerous top-only interpretation but does **not** improve underlying model accuracy. P786 is a dedicated real-image research probe of a third-party **13-class clothing instance segmentation ONNX** model on the six already-exposed Fashionpedia source originals with actual publisher polygons. It is independent model evidence collection, not a product integration or independent heldout.

### External candidate
- `HasanKabir23/Yolov26s-DeepFashion2`, exact Hugging Face revision `670bd8b`, `best.onnx` (~11MB). Publisher model card declares Apache-2.0 and self-reports 13 apparel categories; those self-reported mAP values are **not** Closet Current measurements.
- Crucial **rights blocker**: the candidate was fine-tuned on DeepFashion2. Its original publisher's GitHub maintainers have stated a commercial dataset license is not available (see `https://github.com/switchablenorms/DeepFashion2/issues/3`). A third-party model card saying Apache-2.0 does **not** independently establish rights to commercially exploit a model trained on potentially noncommercial assets. This model is **NOT** cleared for production and **not** recommended for commercial use without an independent legal grant/review.
- Original Fashionpedia photos from a publisher-labeled six-source Pexels development cohort already used in P767 and P778; each original is SHA-checked from the unchanged P66 manifest. They **cannot** be rebranded as untouched independent test images.

### Scoped implementation
- `scripts/probe-independent-instance-786.py` runs actual frozen ONNX weights against all six original photographic JPEGs after SHA verification. Model weights are downloaded into a temporary job directory, SHA-256 fingerprinted, and deleted; no original photos or model weights enter Git history or public artifacts.
- The probe validates input/output tensor contracts, finite model predictions, original dimensions and publisher class metadata, and emits a source-only inference contract. It does **not** decode YOLO instance masks or score ground-truth IoU; a successful output probe proves only live model inference, not accuracy.
- Dedicated no-deploy workflow excludes any shipping app, owner storage, auth, release or Supabase modification. It retains a public-source-only JSON receipt, not licensed image/model bytes.
- No human reviewer, label, color or owner approval is simulated as real. Family Alpha HOLD #255 remains.

### Scientific next gate
Only if the raw model's output tensors are genuine and safely decodable: implement source-coordinate mask/box reconstruction and one-to-one class/IoU scoring on the exact publisher masks; compare against B0/B2 on all **same** exposed images. Retain every false positive and miss. This remains development evidence until novel licensed photos, two genuinely blind human review teams, model commercial terms and physical-phone owner tests pass.

**No deployment, merge, business-source license assumption or mission completion permitted based on this candidate.**
