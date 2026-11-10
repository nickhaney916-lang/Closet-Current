# Closet Current — Mission 1 P795: genuine SAM 2.1 prompt-assisted garment segmentation ONNX, source-pixel trial

**Research-only, DRAFT, UNMERGED, UNDEPLOYED, Family Alpha HOLD #255.** Base is exact verified P794 HEAD `527a7afccac2e1d588d3fd7f4d9fdea6a5ff2978`, in which the unseeded frozen SegFormer automatic review candidate method failed on 10 original photos/23 publisher garment polygons: 11 new proposals, **zero** true model mask IoU50 garment matches, all 11 false detections. P795 must not silently adopt that model or claim a successful automatic recognition result.

## Substantive alternative under test

Use a separately trained **promptable** mask model rather than hallucinate missing garment seeds. Meta [SAM 2.1 Hiera-tiny](https://github.com/facebookresearch/sam2) model code/checkpoints are officially Apache-2.0 and support positive and negative click or bounding-box image prompts. Source public third-party `cstr/sam2.1-hiera-tiny-ONNX`, revision `8cef213`, is an ONNX format conversion with model card containing published SHA-256 and exact input/output interface. Model is RESEARCH ONLY; no model legal or original source photographer commercial-use clearance is assumed.

Downloaded model bytes MUST match:
- `encoder.onnx` SHA `4fda6e68561e27808cedffa8689749a622bba5f11ba66f4ca4e3a8a9f6360db5` (109.5 MB)
- `decoder.onnx` SHA `0ae944e08e55814c19afa4d143ef07b1a3dbad2decd77c15ec3ab220b9f57247` (20.7 MB)

Actual ORT CPU `encoder` infers source-original JPEG RGB resized to 1024×1024, normalized ImageNet; `decoder` takes actual encoder feature tensors and **ONE positive point** and produces mask logits. Test first publisher annotation ID from each **pre-registered P792 exact original image IDs 15201, 20490, 13428**, without dropping difficult photos or tuning any threshold based on results.

**Critical scientific limitation:** The single positive point is DETERMINISTICALLY CHOSEN INSIDE the *publisher's existing original human polygon*, NOT clicked by an independent actual owner. This is an **oracle-prompt upper-bound experiment**, not autonomous learned garment classification/detection, a genuinely collected human click, new two-blind-person annotations, or smartphone acceptance. It is not valid to compare directly against SegFormer unprompted instance recall. The mask assessment computes full original-JPEG source-pixel IoU, TP/FP/FN versus the publisher's true garment polygon. Compare SAM2 single mask (index 0) and predeclared best among indices 1–3 using **SAM2's predicted** IoU, not the publisher ground truth, to avoid hindsight mask selection. No negative human clicks or extra prompts fabricated.

## Safety and privacy

No owner/customer photos, signed cloud users, real humans, biometric inference, garment subtype or primary color labels, hidden-garment pixels, source augmentation or model training. Download original publisher 10-image public photo development cohort by existing P792 SHA pin, require exact original bytes. Third-party ONNX weights are SHA pinned and remain ephemeral on GitHub Actions; original photos and weights are deleted before numeric-receipt-only artifact upload. Do not make remote SaaS model calls with owner private JPEGs. **No app code, local mask selection, cloud, auth or saved outfit changed.**

## Engineering verification

A dedicated no-deploy CI tests strict four research/test/workflow paths from the exact P794 ancestor, full native 3D/cloud/recognition Node suite, Python oracle mask/FP integrity unit tests, genuine independently downloaded and cryptographically pinned SAM2 encoder+decoder and true original source image inference. A PASS only proves the model executed and reported truthful measurements; the observed IoU may be poor and must remain visible. CPU time and huge 130MB model size must be measured before contemplating any mobile implementation.

**Remaining entire Mission 1 blockers**: genuinely unseen model-training-disjoint legally usable source-original photographs, two real independent blinded human polygon/category/subtype/color reviewers, practical and accepted full real-photo accuracy and multi-object separation, physical signed Android/iPhone two-account private-cloud tests, and explicit owner acceptance; none can be supplied by this oracle experiment. Family Alpha HOLD #255 persists.

## Actual model evidence

Add exact-head results to the PR only after CI completes. Never claim sample-mask result as production quality or 100% mission acceptance.
