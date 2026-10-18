# Whole-outfit physical garment review gate — October 18, 2026

This is an **internal benchmark** process, not a customer step. It exists
because the real production worker saw no separate skirt in
`validation-0031`. Reviewing only AI-proposed masks would make that
missing garment invisible to recall measurement.

## Completed development, not completed human review

- The experimental DeepFashion2 CI produces source-verified original JPEGs,
  unapproved individual model mask proposals and an index. It cannot declare
  complete physical garment truth from its own predictions.
- `benchmark/annotate-garment.html` now supports an **Independent physical
  garment** mode starting from a *blank mask*. Use the original JPEG to draw
  one actual visible garment, including one for which NO model proposal
  exists. Choose a source-specific target ID such as
  `validation-0031-item-02`, a broad category, and a clear physical
  description. The mode refuses an AI seed.
- `benchmark/approve-garment-mask.html` displays that specific target,
  requires the unchanged original photo SHA-256, and a **different**
  named second reviewer who checks the entire outline. The export is
  `<source>-item-XX.mask.approved.json`.
- `benchmark/physical-garment-inventory.mjs` compares independently
  approved full-photo garments with unapproved model proposals, using
  maximum-cardinality one-to-one IoU matching (default IoU >= 0.5).
  It reports missing physical garments, unmatched/duplicate proposals,
  category errors, garment detection recall and source-resolved precision.
  Unsupported shoes, hosiery/tights and accessories remain visible
  in the denominator and are separately marked unsupported by this
  DeepFashion model. They are not invented as recognized pieces.
- All metrics are conditional on genuine, comprehensive human outlines.
  Two reviewer names/flags are format checks, **not proof of review quality**.

## New offline full-photo packet assembly

Use `benchmark/assemble-physical-inventory.html` **after** the separate
`annotate-garment.html` and `approve-garment-mask.html` steps. This page:

- Accepts the canonical unchanged original JPEG and multiple
  `<source>-item-XX.mask.approved.json` files.
- Checks actual JPEG bytes and SHA-256 source agreement, review dimensions,
  distinct same-pair reviewers, independently named physical target IDs,
  unseeded hand-drawn outlines, category labels, binary mask integrity,
  and exact per-item filenames.
- Displays the original and lets the second reviewer inspect each approved
  mask overlay; it cannot approve or invent missing masks.
- Requires both human full-scene confirmations and a separate counted total
  equal to the approved files, including clothes absent from AI predictions.
- Exports `<source>.inventory.json`, ready for the already existing offline
  `score-physical-garment-inventory.mjs` tool, with human-attested completeness.
  The page makes no server requests, stores nothing in an account, and
  performs no paid inference.

**This automates packet assembly, not genuine human judgment.** An omitted
garment can still pass a checkbox if reviewers miss it; the two people must
really inspect the source. Synthetic browser tests exercise the format and
safety gates only and never count as real-photo accuracy. Do not create
invented identities or reference outlines to satisfy CI.

## Required human review (still outstanding)

First review the five original photos already packaged in the model artifact:
`validation-0031` (blazer, shirt, skirt, tights, shoes);
`commons-0035` (shorts, model labeled vest/skirt);
`validation-0017` (trousers and mirror contamination);
`commons-0049` (dress with missing hem/cuffs);
`commons-0065` (jacket with missing panels and hardware).
The photo descriptions are **review prompts, not ground-truth labels**.
The human reviewer must independently count *all visible individual physical
garments*, including those the model completely missed, rather than infer
the number from the proposals. The second reviewer independently verifies
the count, identity, category, and pixel outlines on the original.

Save approved masks to:
`independent-outline-review/approved-physical-inventory/<source>-item-XX.mask.approved.json`

Separately, ONLY after both humans verify the entire image, provide
`independent-outline-review/approved-physical-inventory/<source>.inventory.json`
with this structure (illustrative placeholder; **do not submit as approval**):

```json
{
  "schemaVersion": 1,
  "status": "human-inventory-complete",
  "image": "validation-0031.jpg",
  "sourceSha256": "0e145aa5432df3457521200d1e1bb896f66abd66fb041d31ed0db591e00e2fdc",
  "originalPhotoVerified": true,
  "allVisibleGarmentsAccountedFor": true,
  "reviewedBy": "REPLACE WITH FIRST HUMAN REVIEWER",
  "approvedBy": "REPLACE WITH DIFFERENT SECOND HUMAN REVIEWER",
  "reviewedAt": "REPLACE WITH REAL ISO DATE TIME",
  "targets": [
    {"id": "validation-0031-item-01", "category": "Outerwear", "label": "REPLACE WITH REVIEWED PHYSICAL GARMENT"}
  ]
}
```

Each `targets[]` entry must have a separate source-matched, approved
human-drawn mask with matching `physicalTargetId`, `humanCategory`,
`humanTargetLabel`, `reviewer`, `approvedBy`, and
`targetIndependentlyIdentifiedBy`. Reviewers should not copy the example
or presume it identifies every garment; its `targets` array is deliberately
**incomplete and not a valid full-photo attestation** until review finishes.

Then run:
```sh
node scripts/score-physical-garment-inventory.mjs benchmark/deepfashion-instance-review
```

The audit checks the **actual original source image hash** and writes
`physical-garment-inventory-audit.json`. If any photo still lacks complete
human inventory, all 10-photo aggregate metrics remain **null**; partial
reviews may be displayed only as conditional per-photo diagnostics.
Existing model proposals, original RGB, review manifests, customer
closets and recognition thresholds are unchanged.

No reference masks have been independently human-approved in this
development cycle. Passing Node/browser tests uses synthetic test fixtures,
not evidence of real-photo pixel accuracy. The current segmentation model
remains unapproved for automatic garment extraction. Do not merge,
deploy, enable paid AI, or change Drive Duel as part of this workflow.
