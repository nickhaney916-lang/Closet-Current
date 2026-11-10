# Closet Current — Mission 1 P796: all 23 genuine garment polygons through actual human-promptable SAM2.1 ONNX

**Research-only, DRAFT / UNMERGED / UNDEPLOYED, Family Alpha HOLD #255.** This branch extends verified P795 exact HEAD `0f3d49a7d6008ab12fa643eebe41c30222635b6e`; source photos, original model, SHA registry and runtime code are isolated from the app's native private closet.

## Why expand from three photographs

P795's real, SHA-verified SAM2.1 Hiera-tiny ONNX encoder+decoder trial received a single **polygon-derived oracle positive point** from one publisher-labeled garment in each of three genuine previously exposed original photos: model-selected IoU was **0.004804, 0.946533 and 0.771516**. Two were strong but the failure was severe. None are real user clicks. Selecting only a few attractive examples could exaggerate future value.

P796 pre-registers **all ten previously P792 model-exposed original photos** (IDs `15201,20490,13428,12197,15461,18553,19659,13585,17509,17401`) and **EVERY one of 23 actual Fashionpedia publisher polygon instances** from those originals, including small, occluded, difficult or multi-garment regions. No source filtering based on an IoU outcome, no threshold tuning after inference, no skipping failed class masks.

## Exact model and evaluation

- Source upstream model: Meta SAM 2.1 Hiera-tiny Apache-2.0. Converted ONNX distribution `cstr/sam2.1-hiera-tiny-ONNX` revision `8cef213`, encoder SHA `4fda6e68561e27808cedffa8689749a622bba5f11ba66f4ca4e3a8a9f6360db5`, decoder SHA `0ae944e08e55814c19afa4d143ef07b1a3dbad2decd77c15ec3ab220b9f57247`, verified before runtime.
- Source JPEG body matches the P792 immutable original byte SHA and original width/height, with source photograph image encoder invoked **once per photograph**. For every publisher original polygon instance we derive one interior point algorithmically (nearest occupied true source mask pixel to the publisher-mask bounding-box center). This is **ORACLE truth-assisted input**, not a genuine independently captured user tap or fully automatic learned clothes discovery.
- For each actual point the decoder returns four real masks; score fixed single-mask index 0 and the top model-predicted-IoU mask among indices 1–3. We do **not** use the publisher ground-truth mask to choose the highest actual IoU output. Upsample the real mask logits bilinearly to original source pixel resolution, threshold at 0, and report source-pixel mask IoU, TP/FP/FN, model predicted-IoU score and CPU wall time.
- All 23 actual original source masks included and retained, results grouped by publisher category. **No model subtype or color prediction, no model classes, no automatic garment identity, no owner approval, no source truth added**. Results are not comparable to unprompted SegFormer automatic recall without explicitly acknowledging oracle-prompt assistance.
- This method may help a user **manually correct a missed garment** if actual user clicks can be collected and supported reliably. Commercial image rights and model training-disjointness on the existing publisher Pexels photos are unverified. Any eventual implementation needs owner original photos to remain private; no third-party upload and no deployment from this experiment.

## Verification and red lines

Dedicated `.github/workflows/mission1-sam2-all-source-instances-796-no-deploy.yml` enforces four only research/CI paths atop exact green P795 parent, full native app/recognition/private storage/3D Node suite, source-identity and synthetic per-instance mask validators, actual 10 original-source / 23 polygon source-pixel CPU SAM2.1 inference and numeric source-only evidence artifact. Model weights and all original JPEG bytes are erased before any artifact upload.

**Entire Mission 1 is NOT accepted:** actual independent blind person and a legally cleared, truly training-disjoint new photo corpus, independently adjudicated source mask + native category/subtype/color accuracy, successful real person-assisted mobile polygon editing on both phone platforms, hosted signed two-account owner privacy and release authorization remain absent. Family Alpha HOLD #255 cannot be overridden.

## Verified exact-head real-image result

To be recorded in PR after final CI. Numeric FAIL results must not be suppressed.
