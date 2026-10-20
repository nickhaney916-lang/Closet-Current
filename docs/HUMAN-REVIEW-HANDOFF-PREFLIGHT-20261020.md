# Closet Current — practical twelve-photo human review handoff

**2026-10-20.** Isolated continuation of draft PR #63. The primary blocker is real FIRST and SECOND human review of all 12 exact original-photo garment masks. No humans or masks can be manufactured by this tool.

## What reviewers now can do

1. Download the existing verified artifact `twelve-source-original-mask-human-review-packet` from GitHub Actions for PR #60. Open `FIRST-REVIEW.html` and manually annotate each garment of each original photo using `FIRST-ANNOTATE.html`. Do not view AI mask proposals or supplied garment categories first.
2. Save the resulting first-human JSON file locally under its supplied filename `commons-XXXX-item-NN.mask.draft.json`.
3. A **different** person opens the unchanged original JPG and first draft in `SECOND-APPROVE.html`, checks the entire visible clothing outline, including interior holes, body/background contamination, dark trim, garment type and shorts-versus-skirt. They reject inaccurate drafts and return them to the first reviewer for correction. If acceptable, save `commons-XXXX-item-NN.mask.approved.json` beside the first draft.
4. Run this optional preflight locally **from the repository checkout** with Node.js, placing only the human JSON files (no photos) in an external directory, for example `/local/closet-review-json/`:

```sh
node scripts/preflight-human-review-handoff.mjs \
  --reviews /local/closet-review-json \
  --out artifacts/private-human-review/review-status.json
```

After running, open **`artifacts/private-human-review/review-status.html`** in your browser. This offline worklist now shows the twelve existing source photographs by opaque ID, large clickable editor links, first/second reviewer instructions, file-progress counts and item-specific next actions. The photos are referenced from the original checked-in JPEGs and are **not copied into the report**; the HTML contains no model-predicted labels or masks, human reviewer names, private review JSON, network scripts, account data or quality approvals. The local worklist and JSON are both Git-ignored and refuse overwrite. Do not publish either file.

The command validates original JPEG source digests twice against the licensed locked manifest, exact JPEG-native photo dimensions, first-human draft fields, pixel grid and RLE completeness, and immutable source/garment identity/contour after second review. It reports per-case IDs and plain statuses: `no-human-review-files`, `first-draft-present`, `two-review-files-structurally-consistent`, or `invalid-hold`. It includes read-only native outline topology warning flags for manual attention.

**Important:** It does not authenticate either person's existence or identity, verify license rights or annotations independently, prove visual correctness, measure model accuracy, or change the canonical reference registry. It never copies original/user photos or human JSON into the report, never records reviewer names in status JSON, and never promotes a structural second-review pair as independently approved. A standalone verified original-photo rights and first/second reviewer proof is still required before a final evidence registry review.

The output folder is intentionally Git-ignored; do not upload reviewer names, signatures, private legal paperwork, or personal photos to GitHub. Actual customer images are never included. Never commit human review source files or legal records.

## Status remains blocked

The existing locked fixture collection still contains **12 original source photos, zero real independently reviewed complete masks, and zero measured real-photo accuracy passes**. Synthetic-only tests use invented data for code correctness; they are NOT real human review. Original-photo recognition/indexing before clipping stays unchanged. Neither the production app nor the Work session's Style My New Clothes / PR #64 changes are touched.

Run existing CI for Node tests and verify the canonical registry remains empty; no deployment, paid service, or Drive Duel changes.
