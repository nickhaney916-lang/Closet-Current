# Closet Current Mission 1 — P769 genuine exposed-source image similarity firewall

**Status: isolated NO DEPLOY research; Family Alpha HOLD #255.**

## Motivation

Previous Mission1 P768 cryptographically quarantined all 65 publicly examined real photos by original JPEG SHA: 59 historically labeled Wikimedia benchmark sources and six externally publisher-labeled Fashionpedia/Pexels source photographs already used for model debugging. A different JPEG encoding, resized copy or crop can bypass an exact byte hash while depicting the **same familiar garment**. Treating it as new would contaminate the next supposedly independently blinded holdout.

The main Work parallel #763/#765/#767 is already acquiring and measuring external segmentation and remains responsible for independent annotations. P769 intentionally does NOT duplicate those source annotations or alter any model, wardrobe/app, source geometry, cloud or private family photo.

## Implementation

- `research/mission1-visual-source-overlap-769/original-perceptual-ledger.mjs` decodes the original JPEG bytes with Sharp, rejects changed SHA, invalid JPEG endings, unsupported dimensions or missing references, orients pixels, and computes **seven source-window 64-bit horizontal luminance-difference fingerprints per original** (full frame, center 88%, center 72%, and four offset 78% crops). The reference ledger requires all 65 actual source bytes and 65 unique original SHAs.
- For each new candidate JPEG, compare all seven original-source windows against all seven windows of every one of the 65 exposed originals. A Hamming distance of **8 or fewer of the 64 bits** marks a *possible* exact/near-duplicate for independent manual source review. Crops, JPEG re-compression and size changes can sometimes be flagged where raw SHA alone fails. The conservative threshold is a **review heuristic**, not calibrated independent image-identity certainty; false positives and false negatives are possible.
- `scripts/scan-visual-source-overlap-769.mjs` supplies two strictly local-only commands:
  - `node scripts/scan-visual-source-overlap-769.mjs build benchmark/photos benchmark/real-garment-acceptance-66/fashionpedia /tmp/m1-exposed-visual-ledger.json`
  - `node scripts/scan-visual-source-overlap-769.mjs screen /tmp/m1-exposed-visual-ledger.json /tmp/new-candidates.json /path/to/private-original-jpegs /tmp/m1-private-candidate-preflight.json`
  Neither command sends original image bytes anywhere, promotes a new benchmark photo, generates human answers, or certifies rights/model training independence. The second stores its output with local-only file permissions. **Never upload private JPEGs or private candidate result metadata to GitHub Actions.**
- Eight synthetic image-processing/adversarial cases protect: 65 actual byte-verified image decodes (in these tests images are synthetic data, **not counted as real ground truth**), exact-byte substitution, genuine JPEG recompression, center crop, missing references, counterfeit/fabricated SHA, repeated candidate, and no release acceptance on a nonmatching candidate.
- The dedicated P769 NO DEPLOY Actions workflow also downloads and SHA verifies 59 actual licensed public originals from their existing source manifest plus **six real published external source JPEGs** from the existing P66 SHA-pinned source/archive, creates the complete source-window ledger and performs two genuine crop/recompression similarity trials. It verifies receipt identities and preserves public source-only artifact evidence. The six-source download is publisher-provided experimental material, **not newly license-certified or training-unseen**.

## Limitations and non-release declaration

A pHash/dHash heuristic does not prove independence or originality. Similar garments and plain backgrounds may yield matching fingerprints even when photos differ; substantial crop, lighting, pose, mirrored view or recomposition may evade the threshold. This scanner is an **additional quarantine signal** beyond exact SHA; none of its nonflags are automatically approved as unseen. Source-page rights, photographer permission and known/unknown foundation-model training overlap still need independent external review.

The exposed 65 photographs are NOT new prospective human ground truth; the outcome of this delivery is an audit mechanism and independently verifiable source-decode receipts, **not increased recognition category/color/segmentation accuracy**. P768's prospective cryptographic enrollment and human annotation gate remains mandatory. The scanner must be applied prior to any fresh enrollment. No new owners or human reviewers were synthesized. These research hooks must be explicitly reviewed and integrated before any product admission. All artifacts are public-source-only or synthetic fixtures.

**No merge, deployment, production/staging/Supabase changes, private family photos or Family Alpha HOLD release.** Nothing authorizes Mission 1 completion or the move to 3D Mission 2.
