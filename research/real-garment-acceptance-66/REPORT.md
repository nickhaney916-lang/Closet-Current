# Parallel 66 — source boundary integrity and real-photo acceptance

FAMILY ALPHA HOLD #255. Research only. No merge or deployment.

Parent: P195 `5d391992083024a74b4a7fa7d4893f8e937e90fc` (draft PR #760). No other parallel branch modified or merged.

## Implemented correction

The existing IoU/area/connectivity/registration/interior/hairline checks can admit localized lost projecting edges. A source and edited mask regression with paired projecting tips demonstrates the gap: all inherited gates pass, but distant exterior boundary loss now fails before source geometry fitting. The new bounded four-neighbour distance transform measures precision, recall and F1 at a stated two-raster-pixel tolerance, symmetric mean boundary distance and maximum distance. A maximum beyond 8% of the larger registered raster dimension fails closed. This is a conservative research integrity envelope, not a validated segmentation threshold or ground-truth accuracy claim.

Only frame-connected background defines exterior boundaries; benign internal pinholes continue to be handled by P191/P192/P194. The first implementation treated pinholes as exterior edges and failed two existing benign-defect tests; corrected without changing their tests or relaxing inherited thresholds. Raw owner pixels never enter status receipts. Original photographs and saved outfits are never written by this module. P191 calls it only after current source/mask provenance and all inherited topology checks; P186–P195 owner/session safeguards remain in force. The original-photo/2D fallback remains.

## Real-photo cohort and reproducibility

The existing 59 distinct licensed JPEGs are reread, SHA-256 checked, decoded, and mapped to recorded rights/provenance by `node scripts/audit-recognition-ground-truth-60.mjs`. This reuses existing photographic sources rather than falsely claiming a new dataset or unseen evaluation. Frozen splits remain 32 development / 11 validation / 16 locked. Per-photo provenance, dimensions, original SHA and pending review reasons are in the generated acceptance-report.json. Existing historical category/subtype labels remain provisional; color labels and independent masks remain unavailable. `node scripts/build-independent-instance-packets-94.mjs` makes blank source-bound A/B/C polygon review packets, with no simulated human answers. No customer/private garment is used.

Do not promote the two historical P96 multi-garment candidates to unseen ground truth. They have already been model-exposed and have no independent instance masks. No new recognition-model accuracy is claimed or classification labels invented.

## Required measurement distinctions

| Measure | Genuine independent denominator | Result |
|---|---:|---|
| JPEG source identity, decodability and recorded rights | 59 | Measured by exact source audit |
| Category / subtype / primary color accuracy | 0 independently adjudicated photos | Not measurable |
| Segmentation overlap / boundary accuracy against human truth | 0 human instance masks | Not measurable |
| Instance separation accuracy | 0 independent instance masks | Not measurable |
| New garment photograph-to-3D fidelity | 0 independent reconstructions | Not established |
| Boundary integrity algorithm | Synthetic registered rasters | Regression only, not real-photo accuracy |
| Fitted garment support | One pinned licensed blouse | Source-specific inherited 163-bone fitting only |

The dedicated no-deploy workflow reruns the full Node suite/build and P195 Chromium/WebKit 320/390/430 matrix on both humanoids, with all original, unreviewed, wide-tear, hairline, positive owner-mask and bilateral-asymmetric scenarios. Its 83 PNG files per engine are independently byte-SHA audited (166 total). The added guard executes within the actual private mask-to-3D source loader. Its standalone adversarial new loss case is a synthetic Node regression; do not call that a newly photographed garment browser case. Owner review and auth in inherited browser cases are simulated fixtures. Physical Android/iPhone and genuine hosted multi-owner auth are not verified here.

## Acceptance limits

No arbitrary photo reconstruction, new supported garment category, photographed backside, fabric physics, independent human annotation or photorealism certification is established. Both humanoids retain source-specific blouse geometry; rear is inferred. Unsupported categories must remain original-photo/2D. The scientific data and product acceptance portions of Parallel 66 remain incomplete until genuine independent annotations and supported new source geometry exist. A green research CI run certifies this narrower implemented integrity improvement, not the entire assignment or release readiness.

Final exact-head CI results and artifact links are recorded in the draft PR after verification. Never infer completion from this report or a PR alone.
