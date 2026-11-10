# Closet Current — Mission 1 P786 actual alternate instance-model MASK quality research

**FAMILY ALPHA HOLD #255. DRAFT / UNMERGED / UNDEPLOYED.** Scoped real-photo research only, no production/staging, real user photos, hosted auth, Supabase, shipping `public/`, release or original model weights changed.

## What genuinely ran

On six independently SHA-verified **real previously exposed Fashionpedia/Pexels source-original JPEGs**, actual frozen 13-category clothing detector/instance-model `HasanKabir23/Yolov26s-DeepFashion2`, revision `670bd8b`, model byte SHA-256 `485bc106721febbd82fe24297e12a9fb49a435a552afff1e6b76308716555f76`. ONNX Runtime CPU with fixed 416×416 letterboxing and actual input JPEG bytes. Real output tensor contract `[1,300,38]` = post-processed boxes (x1,y1,x2,y2), score, class index and 32 mask coefficients; `[1,32,104,104]` mask prototypes.

Model source weights are **SHA-pinned and discarded** after ephemeral execution. Original public JPEGs are **SHA-checked then deleted** before GitHub artifact upload. Source/mask/score receipts contain hashes, numerical metrics, sparse source bounding boxes and publisher annotation IDs, **not photographic bytes or mask-pixel arrays**.

Model scoring uses **actual decoded predicted masks**, not synthetic annotations or boxes-as-masks: sigmoid of 32 true model coefficients × model prototypes, bilinear upsample, actual detection-box crop, original image letterbox removal, original source resolution mask at threshold .5. Class-specific bounding-box NMS IoU .60 with a fixed .25 confidence prefilter. Publisher polygons rasterized at original source pixels, and all 16 source garment objects (including footwear this model cannot classify) counted. Maximum-cardinality one-to-one SAME family predicted-vs-publisher **pixel mask** matching IoU ≥.50; every missed and false prediction retained. No model training, per-photo threshold tuning, source suppression or conditional score improvement.

## Actual observed negative results (six previously exposed photographic development sources)

| Original source ID | Real annotated garments | Source-mask TP | False predictions | Missed garments |
|---|---:|---:|---:|---:|
| 9029 | 1 | 1 | 0 | 0 |
| 10395 | 2 | 1 | 4 | 1 |
| 11321 | 2 | 1 | 3 | 1 |
| 10904 | 5 | 0 | 7 | 5 |
| 10775 | 2 | 1 | 4 | 1 |
| 12042 | 4 | 0 | 3 | 4 |
| **Total** | **16** | **4** | **21** | **12** |

Observed **precision 16.00%, recall 25.00%, F1 19.51%** at fixed original-source mask IoU ≥.50. These are research development metrics on **already exposed** real images, not training-disjoint heldout, independently blind real-human acceptance, owner verification, consumer product test, official Fashionpedia AP or a proof the model is generally poor on all photos.

**Prior source-context only:** Frozen B0 on these six published source photos previously yielded 8 TP / 5 FP / 8 FN in Chromium, with P767 seeded review 9 TP / 4 FP / 7 FN (P778 CI). Those earlier B0 masks were evaluated in its own model raster/browser scoring setup, whereas P786 evaluates at **original JPEG source pixel coordinates** with different model pre-processing, taxonomy and mask decoding. Consequently the numeric scores are **not a strictly controlled same-res decoder-to-decoder comparison** and must not be presented as a model leaderboard or claim a deployment ranking. The new candidate's 21 false positives and 12 misses on actual published masks are unacceptable independently.

## Product/rights blocker: NOT ADOPTABLE

The external candidate model card reports Apache-2.0, but it was fine-tuned on **DeepFashion2**, whose publisher collaborator stated [no commercial dataset license is available](https://github.com/switchablenorms/DeepFashion2/issues/3). A checkpoint's Apache metadata is **not proof** of rights to commercially deploy downstream training artifacts. Regardless of performance, the research candidate is **NOT license-cleared, NOT promoted, NOT saved, NOT deployed**. The Fashionpedia dataset [licenses annotations separately from source images](https://fashionpedia.github.io/home/data_license.html); these original per-photo image rights and global model-training exposure are not independently checked for final release.

## Verification and research source hygiene

- Source/test script `scripts/probe-independent-instance-786.py` pins SHA, original source manifest and true ONNX output contract; `scripts/score_independent_instance_masks_786.py` independently decodes masks and scores every source mask.
- `tests/test_mission1_instance_source_786.py` tests actual output contract assumptions, box suppression, prototype-to-original mapping, one-to-one matching and unsupported original source class as an honest miss with four synthetic geometry-only tests. These are not real-world annotations or human identities.
- Dedicated `.github/workflows/mission1-independent-instance-model-786-no-deploy.yml` verifies pinned P785 ancestor, five research/test/CI paths only and rejects shipping code changes, runs real six-image ONNX, deletes original photos and weights and preserves only source-hash/mask-score JSON. CI success proves **faithful score measurement**, not an accuracy pass.
- The **entire Mission 1 remains NOT COMPLETE**: no two genuinely distinct independent blind humans signing new color/subtype/instance masks, no genuinely untouched rights-cleared new corpus, insufficient real segmentation recall, no authenticated real phone/two-owner hosted E2E, no independent license proof for candidate. Family Alpha HOLD #255 remains; no autonomous override is authorized.

**Decision: REJECT model promotion.** Continuing engineering should prioritize rights-cleared, actually novel source+human review and improvements to a candidate with verified use rights, rather than tuning this license-blocked model on six already-exposed images.
