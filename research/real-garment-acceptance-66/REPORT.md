# Parallel 66 — source boundary integrity and real-photo acceptance

FAMILY ALPHA HOLD #255. Research only. No merge or deployment.

Parent: P195 `5d391992083024a74b4a7fa7d4893f8e937e90fc` (draft PR #760). No other parallel branch modified or merged.

## Implemented correction

The existing IoU/area/connectivity/registration/interior/hairline checks can admit localized lost projecting edges. A source and edited mask regression with paired projecting tips demonstrates the gap: all inherited gates pass, but distant exterior boundary loss now fails before source geometry fitting. The new bounded four-neighbour distance transform measures precision, recall and F1 at a stated two-raster-pixel tolerance, symmetric mean boundary distance and maximum distance. A maximum beyond 8% of the larger registered raster dimension fails closed. This is a conservative research integrity envelope, not a validated segmentation threshold or ground-truth accuracy claim.

Only frame-connected background defines exterior boundaries; benign internal pinholes continue to be handled by P191/P192/P194. The first implementation treated pinholes as exterior edges and failed two existing benign-defect tests; corrected without changing their tests or relaxing inherited thresholds. Raw owner pixels never enter status receipts. Original photographs and saved outfits are never written by this module. P191 calls it only after current source/mask provenance and all inherited topology checks; P186–P195 owner/session safeguards remain in force. The original-photo/2D fallback remains.

## Real-photo cohort and reproducibility

For the original cohort, the existing 59 distinct licensed JPEGs are reread, SHA-256 checked, decoded, and mapped to recorded rights/provenance by `node scripts/audit-recognition-ground-truth-60.mjs`. This reuses existing photographic sources rather than falsely claiming a new dataset or unseen evaluation. Frozen splits remain 32 development / 11 validation / 16 locked. Per-photo provenance, dimensions, original SHA and pending review reasons are in the generated acceptance-report.json. Existing historical category/subtype labels remain provisional; color labels and independent masks remain unavailable. `node scripts/build-independent-instance-packets-94.mjs` makes blank source-bound A/B/C polygon review packets, with no simulated human answers. No customer/private garment is used.

Do not promote the two historical P96 multi-garment candidates to unseen ground truth. They have already been model-exposed and have no independent instance masks. No new recognition-model accuracy is claimed or classification labels invented.

## Required measurement distinctions

| Measure | Genuine independent denominator | Result |
|---|---:|---|
| JPEG source identity, decodability and recorded rights | 59 | Measured by exact source audit |
| Original 59-photo cohort category / subtype / primary color accuracy | 0 independently adjudicated photos | Not measurable |
| Original 59-photo cohort human mask overlap / boundary accuracy | 0 human instance masks | Not measurable; separate new external cohort below |
| Instance separation accuracy | 0 independent instance masks | Not measurable |
| New garment photograph-to-3D fidelity | 0 independent reconstructions | Not established |
| Boundary integrity algorithm | Synthetic registered rasters | Regression only, not real-photo accuracy |
| Fitted garment support | One pinned licensed blouse | Source-specific inherited 163-bone fitting only |

The dedicated no-deploy workflow reruns the full Node suite/build and P195 Chromium/WebKit 320/390/430 matrix on both humanoids, with all original, unreviewed, wide-tear, hairline, positive owner-mask and bilateral-asymmetric scenarios. Its 83 PNG files per engine are independently byte-SHA audited (166 total). The added guard executes within the actual private mask-to-3D source loader. Its standalone adversarial new loss case is a synthetic Node regression; do not call that a newly photographed garment browser case. Owner review and auth in inherited browser cases are simulated fixtures. Physical Android/iPhone and genuine hosted multi-owner auth are not verified here.

## Acceptance limits

No arbitrary photo reconstruction, new supported garment category, photographed backside, fabric physics, independent human annotation or photorealism certification is established. Both humanoids retain source-specific blouse geometry; rear is inferred. Unsupported categories must remain original-photo/2D. The scientific data and product acceptance portions of Parallel 66 remain incomplete until genuine independent annotations and supported new source geometry exist. A green research CI run certifies this narrower implemented integrity improvement, not the entire assignment or release readiness.

Final exact-head CI results and artifact links are recorded in the draft PR after verification. Never infer completion from this report or a PR alone.


## Follow-up: conserve source shoulder triangles

A code investigation after visual failure found a concrete source-topology bug in the pinned P45 donor: all classified cap faces were excluded from the shell, including side panels below the 20-face retessellation minimum. If another panel in the same shell was large enough to be rebuilt, the sparse panel was removed without replacement. P66 now partitions those faces before removing any indices: supported caps are rebuilt; small panels retain their original source triangles, UVs and skin weights. No filler surface, substituted garment, hidden backside, changed JPEG or new human review is introduced.

The research-only installer modifies the explicitly detached donor, rejects the shipping tree/root destinations and validates exact source anchors. Regressions verify sparse/mixed/multiple-shell face conservation and reject duplicated source triangles. Native numeric receipts record whether partition conservation executed and how many original small-panel faces were retained. Final Chromium/WebKit female/male tests require the conservation partition to execute and report the actual retained-face count (zero is allowed), current 163 bones, all inherited source/owner safeguards and unchanged saved outfits. An exact asymmetric before-repair run is retained alongside after-repair screenshots, bringing the screenshot audit to 105 files per engine (210 total).

P196 PR #762 advanced separately after this branch was created; its independent mesh-readback work is neither merged nor modified here. This branch remains on P195 with the existing P66 boundary guard; controlled integration must carry both the P196 validator and this cap-partition correction, with exact-commit regression verification. Geometry defects and independent real-photo segmentation acceptance must not be certified merely from a green topology or CI result. Final visual observations are recorded in PR #761 after inspecting the actual after-repair renders.


The sparse-cap defect is a real latent source-triangle partition bug, but the genuine licensed blouse reports zero sparse panels. It therefore does NOT explain or repair the observed hole in this particular source. Two bounded posed-body clearance experiments were rendered locally: closest-face and arm-bone ray projection. Both left visible openings and introduced additional folds. Those geometry experiments were rejected and are not included in the committed implementation. Existing original-photo/2D fallback remains the supported safe route when reliable reconstruction cannot be established.


## External human-annotated real-photo cohort

A separate six-image exploratory Fashionpedia validation cohort now supplies 16 published human apparel/footwear instance polygons. These are external dataset annotations, NOT annotations made by this agent or owner review. Source: Fashionpedia Consortium, Jia et al., *Fashionpedia: Ontology, Segmentation, and an Attribute Localization Dataset* (ECCV 2020), https://arxiv.org/abs/2004.12276 ; official distribution https://github.com/cvdfoundation/fashionpedia . Annotation snapshot SHA `f831f415edad12d52acde8b138fe7ebd1592b57bf0dcd6a3b63ba8cabd208223`, CC BY 4.0 annotations, https://fashionpedia.github.io/home/data_license.html .

Photos are selected before inference by first unique ascending image ID with publisher-recorded Pexels license (id 8) for dress, pants, skirt, jacket, shorts and top. Photograph permission follows the separately recorded Pexels license https://www.pexels.com/license/ , which permits use and modification without required attribution. The publisher retains only the Pexels homepage as original_url; individual photographer/source pages are unavailable in this snapshot. This per-photo provenance limitation is retained explicitly; dataset licensing is recorded, not represented as independent legal adjudication. Photo originals are runtime inputs and are not committed. The downloader verifies the full annotation snapshot, exact excerpt records, each original JPEG byte SHA/size and license id. Original 59 sources and their frozen splits remain unchanged. Model-training exposure is unknown; this is exploratory evaluation, not a fresh locked holdout.

The browser runs the EXISTING pinned real SegFormer worker, including the app's actual logits-to-label and research visible-group code, on each original JPEG. Human polygons are rasterized at the model output resolution using browser canvas with alpha >=128. IoU and two-pixel-tolerance exterior boundary F1 are measured per image/semantic garment region. This is an explicitly bounded raster approximation, NOT official COCO/Fashionpedia AP. Semantically equivalent external ontology categories are mapped to upper/skirt/bottom/dress/shoes. Semantic class unions do not establish instance identity: 16 published instances do not imply 16 instance detections. Exact app subtype, primary color, owner approval and non-blouse 3D reconstruction remain unmeasured/unapproved. External source IDs remain rejected by the pinned blouse 3D source contract; no generic blouse mesh is substituted. Six genuine overlay screenshots per engine show actual model pixels and published human boundaries. Final numeric results are in the run artifacts and PR after model execution.


The initial genuine Chromium six-photo run measured 13 semantic-region unions: macro IoU 0.5540319282, 8/13 regions at IoU >=0.50, 1/13 completely missed, exterior boundary F1 0.6717497530 averaged across all 13 regions with misses counted as zero. These are descriptive exploratory segmentation results, not category classification accuracy or a pass threshold; the sample is small and not representative. The dress region scored IoU 0.8637719589. Human instance separation (16 instances), exact app subtype and primary color remain unscored. Final exact-head Chromium/WebKit outcomes and screenshot audits are recorded in PR #761 after CI; no unsupported capability is certified by these scores.
