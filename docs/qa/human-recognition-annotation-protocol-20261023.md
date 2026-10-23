# Offline human annotation protocol — recognition release gate

Status: proposed QA protocol only. No images, annotations, or measurements are included.

## Scope
Use only explicitly licensed, non-customer fixture photographs. Keep full-resolution originals immutable and store annotation outputs separately. No paid inference, cloud uploads, production configuration changes, or release authorization.

## Review procedure
1. Inventory the locked 32/16/11 source cohorts by source ID and SHA-256. Reject duplicates, missing IDs, hash changes, or replacement images.
2. Have two independent reviewers label each image without seeing model predictions: primary category (shoe, dress, top, bottom, outerwear, nonclothing), subtype, dominant and secondary color, garment count, and ambiguous/occluded status.
3. For each garment, reviewers trace a full-scene binary mask against the ORIGINAL pixel grid, not a thumbnail, crop, or resized proxy. Record width, height, source hash, annotator ID, and mask checksum.
4. Adjudicate disagreements with a third reviewer; preserve both original labels and the final adjudication, never silently overwrite.
5. Independently score shoe subtype, dresses, skirt-versus-shorts, category, subtype, color, and separation; count abstentions and incorrect high-confidence decisions separately.
6. Compare candidate and baseline predictions on exactly the same immutable cohort and publish per-source regressions, denominator, confusion matrix, and confidence intervals. Do not promote a candidate if an unsafe subtype error remains.
7. Measure segmentation intersection-over-union only for examples with adjudicated original-resolution human masks. Without masks report **NOT MEASURED**.
8. Validate crop output preserves original-photo bytes and does not replace the source with a compressed preview. Verify the output mask/crop geometry separately.
9. Run existing offline regression, security, and Chromium/WebKit suites on the candidate head. Real-device capture fidelity is a separate unverified gate.

## Annotation schema (one record per garment)
```json
{
  "source_id": "licensed-fixture-id",
  "source_sha256": "64-character-hex",
  "original_width": 0,
  "original_height": 0,
  "garment_index": 0,
  "reviewer_id": "reviewer-pseudonym",
  "category": "shoe|dress|top|bottom|outerwear|nonclothing|uncertain",
  "subtype": "controlled-vocabulary-or-uncertain",
  "dominant_color": "controlled-vocabulary-or-uncertain",
  "secondary_color": "controlled-vocabulary-or-none",
  "occluded": false,
  "ambiguous": false,
  "mask_sha256": "64-character-hex-or-null",
  "mask_coordinate_space": "original-pixels",
  "notes": ""
}
```

## Acceptance
No invented labels, no accuracy claims without verified denominators, no real-photo segmentation claims without adjudicated human masks. Historical 51/56 broad-category result is an existing measurement, **not** a new experiment. Four previously observed incorrect automatic subtypes and uncertain colors remain blockers until genuinely corrected and independently measured.

## Handoff
This protocol is non-invasive documentation. Work #211 and other active branches remain untouched. Main Closet Current conversation retains integration and release decisions.
