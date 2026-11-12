# Independently human-validated color-object reference

Source: Datable / AI4Culture, [`AI4_C_datasets` at 767169b2b053485ee7b909fd19b96e98f6be0453](https://github.com/datable-be/AI4_C_datasets/tree/767169b2b053485ee7b909fd19b96e98f6be0453). Annotation release `AI4C_Fashion_Color_Dataset_2024-06-01_0.json`; commit date 2024-07-22. Publisher methodology: algorithmic color prelabels approved, corrected or rejected by a human validator. Individual reviewer/action/timestamps are not supplied. Do not invent them.

## Final frozen splits

- **Development:** 9 actual garment photographs from Antwerp/MoMu. Black 2; White, Gray, Red, Brown, Yellow, Orange, Beige 1 each. AI visually screened development garment relevance only. Color labels remain original source-human labels, with no relabeling; AI screening is not human category/mask truth.
- **Acceptance:** 9 source- and institution-separated publisher-named garment photographs from other museum collections. White 3, Purple 2, Black/Red/Yellow/Orange 1 each. Acceptance pixels have not been reviewed by this collector or processed by a color algorithm before freeze. Metadata/title/license screening only.
- No shared source landing page, metadata identity or JPEG SHA. Potential unidentified same-object overlap with other datasets and foundation-model pretraining remains unknown.
- Missing **acceptance Gray, Off-white, Blue, Green, Brown, Beige and Multicolor** coverage is an explicit gap. Off-white does not exist in the source ontology. A tiny museum-object subset cannot prove >=95% representative color accuracy or a 10/10 user photo suite.

Every selected photograph's current primary Europeana rights statement was checked against the individual dataset image rights. Sources are CC BY 4.0, CC0 or Public Domain as recorded. Preserve source/creator credit, landing page and license URL per image. The dataset-level CC0 license does not clear arbitrary source photos. Rights-unknown, in-copyright and noncommercial/nonderivative rows were not admitted.

`candidate-development.json` preserves the original 28 metadata-qualified candidates. A development-only AI contact-sheet screen excluded textile swatches, trim, feathers and a product package; see `development-relevance-exclusions.json`. `candidate-acceptance.json` preserves 15 primary-title-qualified candidates. Six fragments/compound ensembles or first publisher-named material colors conflicting with the source human single-color label were excluded prospectively; see `scope-quality-exclusions.json`. Conflict means further human adjudication is needed, not proof that either source color describes the photograph incorrectly. No color label was edited to agree with a pixel prediction. No color estimator was evaluated on either final split before freeze.

## What this can and cannot measure

The human source labels describe the **color(s) of the predominant object in an image**, not per-garment color boundaries or ranked primary colors on overlapping outfits. Only original single-label examples were admitted. A model-derived foreground mask can be evaluated for predominant-object color agreement, but that cannot be presented as independently verified per-instance color accuracy. Mask quality and object detection remain separate uncertainty sources.

Archive images were normalized to JPEG with maximum dimension 500 by the dataset publisher. Their exact dataset JPEG bytes and SHA-256 are preserved here without recoding. They are not claimed to be original camera JPEGs or byte-identical to current museum source downloads. No private family photos were used.

## Reproduction

`python research/parallel68/color-data/download_reference.py` downloads the pinned archive bytes, verifies archive and each final JPEG SHA, and recovers `benchmark/parallel68-color-photos/`. It does no inference or annotation. `build_reference.py` documents original metadata collection and writes **candidate** files; `finalize_reference.py` documents subsequent relevance/scope exclusions. Do not rerun either selection script to tune an evaluated acceptance set. Restore and use the frozen manifests and SHA receipts instead.

`scoreColorReference68` in `../color-evaluate.mjs` counts all originals, retains abstentions in the overall agreement denominator, reports proposal coverage separately, rejects altered source identities and prevents a review proposal being represented as automatic or verified. Its scope is explicitly predominant-object agreement. It cannot turn this dataset into representative primary-color or off-white evidence.
