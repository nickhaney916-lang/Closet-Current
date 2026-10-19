# Real-photo fidelity benchmark and figure readiness

Isolated additive benchmark based on PR #33 at `ec32f777`. It does not edit runtime code or PR #33/#34 branches. PR #34 geometry is not integrated or claimed tested here.

## Reproduce offline

From repository root, use Python 3.12 with Pillow 11.3.0 and Node 22:

```sh
python -m pip install Pillow==11.3.0
python scripts/benchmark-local-fitting-quality.py
node scripts/score-local-fitting-reviews.mjs artifacts/real-photo-quality/results.json artifacts/real-photo-quality/review-template.json artifacts/real-photo-quality/review-results.json
node --test tests/local-fitting-benchmark.test.mjs
```

Open `artifacts/real-photo-quality/index.html`. The packet includes source thumbnails, upper/middle/lower source detail crops, checkerboard mask/warp diagnostics, both figure overlays, exact source and pipeline hashes, full original attribution/license records, and empty comparative-review receipts. It never reads customer databases or selfies. Outputs are restricted to `artifacts/`; originals are opened read-only and their bytes rehashed after processing. Source recognition/indexing inputs are untouched.

Pillow decodes/resizes to the same bounded 150k analysis size and calls the existing PR #33 white-matte, ambiguous-neck and inverse-warp pixel functions through an offline adapter. Pixel colors can differ from browser canvas interpolation; this is explicitly not pixel-identical browser evidence. Diagnostic compositions reproduce PR #33 fill-box placement, not PR #34 aspect-preserving geometry, and are always labelled rejected/unreviewed. Updating runtime modules changes the pipeline digest and invalidates old review receipts.

## Real-photo observations

The catalog test verifies all **59** stored source hashes and existing license metadata. A focused set of **12 real original photos** spans printed pale/red/black tops, long sleeves, jeans, shorts, patterned skirt, logo dress, lapels/lining, rear fur coat, embroidered pale outerwear and shoes. Source-risk notes are assistant inspection, not independent annotation or a ground-truth mask.

All 12 are **held**, with 0 independently approved composites. Eleven fail the strict white-exterior/alpha gate; `commons-0053` reaches white matting but is held for its pale mannequin neckline. The diagnostic mask visibly retains that mannequin neck: white background removal alone is not garment separation. No photograph in this selected set is currently demonstrated safe for automatic local compositing. This does not mean all 59 photos, all user photos or already-approved transparent cutouts fail. It is not a recognition/categorization accuracy score.

A source-risk inventory and automated rejection reason are two different evidence fields. Existing safeguards do not diagnose every scene hazard: they can reject a gray backdrop without independently identifying the mannequin, jeans or hanger. No hand-edited masks were fabricated to create positive results. Layering fidelity remains blocked until a verified top/bottom pair, masks and integrated composites are available.

## Comparative scoring

The eight required dimensions are collars, sleeves/cuffs, seams/hems, logos/patterns, colors, transparency/body contamination, fabric detail and layering. Visible features cannot be marked not-applicable. The review template starts with null answers and requires actual original/cutout/composite comparison, distinct documented reviewers, date, exact source/candidate/pipeline/composite digests, and no invented details/body contamination. A documented pass is evidence only; this tool cannot authenticate reviewer identities or grant production permission.

`score-local-fitting-reviews.mjs` checks actual candidate/composite/source file bytes and current pipeline digests; duplicate/foreign/stale receipts fail. It records missing reviews for all 24 figure/photo targets. Even completed feature receipts cannot override missing independently approved masks, rejected pixel gates or missing real integrated layering evidence. The headline fidelity percentage stays null.

`scoreApprovedSourceGridDetail` adds numerical RGB error, alpha loss and horizontal contrast diagnostics only with a two-reviewer-approved reference mask plus independently verified, digest-bound SAME-SOURCE-GRID alignment. Unaligned warps are rejected. It uses the garment interior; it cannot score boundary correctness, labels, realistic drape or perceptual color equivalence. No such reference exists for these 12, so these metrics are not reported as real-photo results. Synthetic exact/blur/alpha-loss cases test the metric implementation separately.

## Asset readiness and next quality work

See `figure-readiness/README.md` and its explicit unknown evidence ledger. Both shipped figures are 160×297 previews; no native master or commercial-rights evidence is present. Proposed master target is 1294×2398, with neutral base clothing, per-figure anchors, reviewed hair/hands/body occlusion layers and rights for the intended app operations. No replacement assets were acquired.

The next substantive quality step is independent garment-only masks for real front-view photos, including at least a safe top/bottom pair. Compare the actual integrated renderer with this packet; repair contamination and sleeve/collar losses without relaxing holds merely to increase acceptance. Actual phones, recognition quality, true cloth drape and competition comparisons remain unmeasured.
