# Closet Current — 12-photo independent garment outline review packet

**Date:** October 20, 2026. **Branch:** `benchmark/twelve-photo-independent-outline-packet-20261020`. Stacks on [PR #45](https://github.com/nickhaney916-lang/Closet-Current/pull/45); **does not** modify current in-app classifier, garment extraction, fitting previews or Work's independently created figure branches.

## Why this exists

The actual 12 locked licensed original garment photographs and one held dark-edge segmentation proposal still have **zero independently human-reviewed, full-resolution reference masks**. The previous `benchmark/verified-mask-quality.mjs` requires original-source-bound, reviewer-signed, rights-verified exact raster references, and correctly BLOCKS every measured quality pass. Simply running an overlay benchmark again will not break the impasse.

The repository already contains a human first-annotation editor `benchmark/annotate-garment.html` and independent second-review editor `benchmark/approve-garment-mask.html` in a separate research workflow. This new work stages those existing tools **unchanged** alongside 12 byte-identical photo originals and two distinct instruction pages, rather than cloning or rewriting the annotation engine.

## Produced offline work package

CI runs `python scripts/stage-independent-twelve-mask-review.py` after the evidence report and produces `artifacts/independent-mask-review/`:

- `FIRST-REVIEW.html` — image-only independent roster: original photographs, opaque IDs, exact pixel dimensions and a link to the first editor. **No AI proposed masks, classifications, original inspection descriptions, predicted labels or held-proposal details are revealed**. Human reviewer identifies the actual physical garment and starts from a blank image rather than an AI mask.
- `originals/commons-*.jpg` — exact unchanged JPEG bytes from `benchmark/fixtures`, verified against **both** the 12-photo case manifest and `benchmark/locked-photo-sources.json` SHA-256 values; these are not phone-user photos or new datasets.
- `FIRST-ANNOTATE.html` — unchanged first-review editor, which exports a DRAFT JSON. For a standalone independent physical-garment review, select the editor's independent physical garment mode and do not import an AI-predicted mask.
- `SECOND-REVIEW.html` — **separate** optional human adjudication checklist after the first draft. Only this view shows source inspection caveats and evidence-source/attribution links; it also makes garment holes, cuffs, skirt/short confusion, mannequin contamination, lost dark trim, collars and occlusion explicit.
- `SECOND-APPROVE.html` — unchanged distinct reviewer approval editor, to load the original photo and first person's JSON; it enforces separate reviewer names but does not authenticate their identity.
- `BLIND-FIRST-SOURCES.json` — only original source ID/hash, filename and dimensions; no fabricated garment truth. `RIGHTS-AUDIT.json` — per-photo existing license/attribution declarations, **not a new permission grant**. `REVIEW-STATUS.json` — exact count and blocked interpretation: 12 originals, 0 independently accepted masks, 0 real-photo quality passes, 0 human sign-offs, production authorization false, no reference importer.

**Never place new customer images or personal photos into this packet.** The source descriptions and license metadata originate with the existing locked fixtures. Keep the attribution/license conditions for any redistribution.

## Important accuracy limitation

The current browser annotation editor downsamples its editable mask raster to a maximum 768 pixels on either axis. Its zoomed detail view does sample the unmodified original native-resolution photo; however the actual exported mask still has the **review-grid dimensions**. Accordingly **neither a first draft nor a second-person approval automatically provides an exact-original-pixel full-resolution reference** for `benchmark/verified-mask-quality.mjs`. Resizing an approved 768-pixel outline back to the original grid would invent precision, so it is NOT allowed to unblock the original mask-quality score.

The necessary next technical step, after actual human first/second reviews, is explicit independently checked **native-grid** mask annotation and an importer that validates original source, whole garment, any interior holes, source/annotation redistribution rights evidence, and distinct reviewer review bytes. Even a complete opaque binary reference cannot certify translucent fabric or realistic model layering. Until then all 12 quality gates stay BLOCKED and metrics remain `null`, not zero.

## Reproducing

```sh
python -m pip install Pillow==11.3.0
python scripts/stage-independent-twelve-mask-review.py
python -m unittest discover -s tests -p 'test_independent_twelve_review_packet.py' -v
```

[The existing evidence workflow](../.github/workflows/source-guided-boundaries.yml) runs the full Node suite, verifies the old mask-evidence report still shows **12 blocked**, reconstructs the packet, rejects changed/unverified source images, and uploads a review ZIP to GitHub Actions. CI does not simulate a human doing annotations or assert a quality score. Packet evidence is reproducible, independent human decisions are not.

## Restrictions

- No changed production camera/photo classification: **original high-resolution photo still used for recognition/indexing before any cropping or clipping**.
- No automatic accept, save, upload, rating, production figure replacement, paid inference, purchases, merge, deployment or Drive Duel changes.
- A reproducible checklist and an editor **are not twelve approved masks**. Human labor, separate rights verification and independent review are genuinely still necessary.
