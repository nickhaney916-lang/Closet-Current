# Closet Current Mission 1 — P799: Actual SAM 2.1 source photo prompt comparison (point versus rectangle versus combined)

**Family Alpha HOLD #255, DRAFT, UNMERGED, UNDEPLOYED**. P799 is research-only, stacked on verified exact P798 head `5fdf7c0eccbc01e468da2f9866038072ae872ce7`. It changes only a new real-model comparison script, Python mathematical-oracle tests, this report, and a strict no-deploy workflow. It neither changes the shipping mobile app nor claims a real user drew any region.

## Rationale

P798 added a source-byte SHA-verified temporary **real native Adjust owner tap control**, with Playwright simulation verifying original-blob identity and no automatic save in both actual browsers. Independently, P796/P797 executed a real pinned SAM 2.1 Hiera-tiny ONNX CPU model with ONE point **chosen from existing publisher human-mask truth**: 15/23 full original-pixel masks achieved IoU≥.50 on ten actual SHA-pinned publisher-original photos and 23 polygon garment instances (eight failures, including 0/3 coats). A point alone often cannot tell overlapping adjacent garments apart. A rectangular region can give a stronger spatial prompt; this research asks whether it improves the **real original-source mask quality** and whether the alternative hurts other categories.

## Registered actual model study (no hindsight cherry-picking)

- All original P792 **10 genuine public publisher JPEGs and all 23 genuine publisher garment annotation polygons** scored. All were previously exposed to Mission 1 research, NOT a new independent training-disjoint holdout. The corresponding exact JPEG source SHA verified before one image encoder invocation per source.
- Identical original immutable model: `cstr/sam2.1-hiera-tiny-ONNX@8cef213`, encoder SHA `4fda6e68561e27808cedffa8689749a622bba5f11ba66f4ca4e3a8a9f6360db5`, decoder SHA `0ae944e08e55814c19afa4d143ef07b1a3dbad2decd77c15ec3ab220b9f57247`, 1MiB bounded streamed download, ONNX CPU no tensor cache.
- For each true publisher garment polygon, derive original-source **one interior positive point** and **one tight axis-aligned box from that same known published true-mask pixel set**. Both inputs are **ORACLES from existing human annotations**; there are zero real independently observed user clicks/drawn boxes and zero newly blind second-human polygon reviews.
- For the same actual source encoder image embeddings, execute three **actual ONNX decoder** arms per original publisher garment: (a) original point alone, (b) source tight box alone with SAM2 prompt labels `[2,3]`, (c) point + box with `[1,2,3]`. Never choose a prompt using output IoU. Each decoder returns four masks; report both mask 0 and the best-quality multimask among 1–3 selected by the **model's own predicted IoU** (never hindsight-selected against publisher truth).
- Preserve every generated mask's true-positive, false-positive and false-negative ORIGINAL SOURCE pixel count using identical zero-logit threshold and bilinear source resolution; original publisher garment category IDs used for grouping only, not claimed as model-predicted classification. No visual mask screenshot or original image bytes uploaded; numerical source-SHA evidence only. No model thresholds, photos, labels, category, subtype, color or weights trained or altered after scoring.
- Compare all 23 model-selected IoU≥0.50 results per arm (baseline point target 15/23), full original-pixel mean IoU, all 23 individual polygon receipts and separate three-outerwear category outcomes. A box improvement does NOT establish real owner usability, physical mobile latency, correct garment identity, masked color or automatically discovered garment instances.

## Accept/reject implications

A positive **oracle-box** result would justify prototyping a real drawn rectangle and source-private on-device point/box-to-mask correction with honest owner approval, but would not automatically promote a 130MB unoptimized CPU model into browser/mobile production. A negative result would prevent overinvestment in box UX. If the exported ONNX prompt decoder rejects box labels or fails the complete real source set, record that limitation, keep the exact-head failed run, and repair only if it can preserve pinned model/source semantics; never fake a score.

## CI safeguards and mission blockers

Dedicated `.github/workflows/mission1-sam2-source-box-prompt-799-no-deploy.yml`: strict four research/test/workflow files from exact P798 parent; entire Node native/recognizer/3D/owner-cloud suite; 5 targeted synthetic coordinate/categorization oracles; actual complete real original source+publisher mask and SHA-pinned ONNX model three-arm 23-garment inference, all 23 retained, no source JPEG/model weights uploaded. Original P797 15/23 comparator must remain unchanged.

**The entire Mission 1 is NOT 100% complete.** Truly new legally usable training-disjoint garment-photo ground truth, two real independently blind human polygon/category/subtype/color annotators, reliable unprompted real-photo detection/multi-garment isolation, private user-review mask correction and mobile inference, signed two-owner hosted-cloud privacy, real Android and iPhone physical-phone acceptance and explicit release signoff are NOT supplied by publisher-oracle prompts. Family Alpha HOLD #255 must persist.

## Exact-head model evidence

Record real results only after GitHub Actions finishes and the PR final head and run head match exactly. No claim of completion from generated source code alone.
