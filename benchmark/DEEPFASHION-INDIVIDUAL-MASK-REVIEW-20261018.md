# DeepFashion2 individual-instance review bridge — no approved masks yet

The ten-photo pinned DeepFashion2 experiment previously generated genuine
binary mask candidates and composite/union overlays but did not expose
the individual proposals in the existing browser annotation format.

This update exports **one JSON AI-prediction seed per model proposal**, with
the exact verified original image filename, SHA-256 digest, source dimensions,
alternating 0/1 RLE, proposed clothing label, confidence, and proposal
ordinal. These JSON files can be loaded using "Load AI mask as editable
starting point" in the existing independent `benchmark/annotate-garment.html`
tool.

For initial reviewer priorities the GitHub artifact also includes the
five *exact* SHA-verified original photos:
`commons-0035` (shorts misclassified as vest/skirt),
`validation-0017` (trouser-leg fragments including a reflected person),
`commons-0049` (partial dress hem/cuffs),
`commons-0065` (jacket-panel gaps and attached straps),
`validation-0031` (separate blazer/skirt worn on a person).

**How to use the artifact for human reference work:**
1. Inspect the matching unchanged original from `original-photos/`.
2. In the internal annotation editor choose it, then optionally load one
   same-photo `model-seeds/` JSON. Model output is a START, NOT ground truth.
3. Carefully correct and inspect every boundary—including hems, cuffs,
   reflected people, skin, hanging hardware and shadows—then export a DRAFT.
4. A DIFFERENT reviewer must open the original and draft in
   `benchmark/approve-garment-mask.html`, inspect the native detail,
   and approve or reject. A draft, filename or click does NOT prove accuracy.
5. Only approved, source-verified *garment-instance-specific* masks may be
   considered for model scoring after establishing an unambiguous one-to-one
   garment target. The existing six-photo single-garment manifest is NOT
   automatically changed or approved.

Even if there are multiple garment-instance predictions for one photo,
none is assumed to be a second physical piece or a completed outline.
The index explicitly records **0 approved human references**; all model
seeds are `prediction-unreviewed`. No accuracy or production promotion is
claimed. No customer app changes, paid services or Drive Duel edits.
