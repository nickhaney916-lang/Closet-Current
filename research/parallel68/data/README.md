# Parallel #68 — human instance-mask development, validation and acceptance data

This directory contains independently human-annotated **instance-boundary evidence**, not model-generated labels. The original Fashionpedia paper, section3.2, describes trained crowd-worker masks with supervisor/author review and fashion-expert attribute annotation: https://www.ecva.net/papers/eccv_2020/papers_ECCV/papers/123460307.pdf. Coordinates, category IDs, annotation IDs and polygons are copied unchanged from official `instances_attributes_val2020.json`.

## Split meaning

- **Development:** the eight / 38-instance examples already exposed by Parallel #67, referenced by exact manifest SHA in `split-index.json`. They remain development-only.
- **Validation:** a frozen new photo group for candidate comparison/repair. Its human masks may be used for error analysis; it must not later be presented as untouched acceptance.
- **Acceptance:** a separate frozen photographer group. No model inference was used in collection or splitting, and none was performed on it by the data collector. Freeze the candidate implementation and evaluation protocol before the first acceptance inference. Record that first use separately; once exposed, do not tune on it and still call it untouched.

Source image IDs and SHA-256 values are disjoint across all three groups. Current primary Flickr photographer identities are also disjoint across all three groups. This is stronger than merely using different filenames. It does **not** prove that distinct photographers never photographed the same event/person, or that crops from the same scene cannot occur elsewhere; the source does not provide reliable scene IDs.

These are official **public validation** photos. Their possible presence in pretrained model training is unknown. “Acceptance” means unexposed to this workstream's model development at freeze; it never means novel or sealed relative to all foundation-model pretraining. This is not a population accuracy or final release claim.

## Rights and attribution

Fashionpedia annotations and ontology are **CC BY4.0**: https://fashionpedia.github.io/home/data_license.html and https://creativecommons.org/licenses/by/4.0/. Attribution: **Fashionpedia Consortium, official Fashionpedia val2020 instance segmentation annotations**. Changes: selecting a subset and excluding garment-part categories27+; source object polygons/category labels are not edited.

Photograph rights are separate. Selection requires official dataset **CC BY2.0 or CC BY-SA2.0** metadata *and* an agreeing current Flickr primary-page JSON-LD license plus a named creator and creator URL. Deleted, unverifiable, mismatched and noncommercial sources are excluded. Every selected photo retains its individual creator, source page, license URL and primary-page checksum in `photoLicenseReceipt`. Keep those attributions with reused photos and visualizations. Share-alike photos require applicable compatible share-alike terms for derivative overlays; do not treat the application's source-code license as the photograph license.

The bytes are unmodified **official dataset JPEGs**, SHA-verified from the official `val_test2020.zip` archive. They are genuine photographs, but are not claimed to be full-resolution camera originals or byte-identical to the current Flickr download. The combined official archive uses a `test/` member directory even for images identified by the official val2020 annotation IDs.

## Available and missing truth

Human polygons provide individual garment instances and official category labels0–26. Separately annotated shoes remain separate instances. Part categories such as sleeve/collar27+ are not garment-instance targets.

The taxonomy merges `shirt, blouse` and `top, t-shirt, sweatshirt`; its `shoe` class does not distinguish sneakers from boots. **Fine subtype truth is unavailable.** No independently human-verified primary-color labels are supplied. Never turn measured mask pixels, captions, AI visual review, or category synonyms into human subtype/color truth. This cohort cannot establish the90% subtype or95% color targets.

The initial acquisition target was16 new photos per validation/acceptance group. Actual counts, category coverage, creator counts and any shortfall are in `split-index.json`. The overall **200-photo target remains unmet**; do not substitute the number of polygons for the number of distinct photographs. The permission/source constraints and photographer grouping impose selection bias, and these photos do not represent the distribution of phone captures, flat lays, negatives or every troublesome class pair.

## Files and recovery

- `collect_acceptance.py`: auditable primary-license screening, without any model calls.
- `freeze_splits.py`: deterministic whole-photographer-group partition and round-robin image-ID selection, no prediction-driven selection. A frozen manifest cannot be silently replaced.
- `validation-manifest.json`, `acceptance-manifest.json` and matching `.sha256` receipts: source bytes, rights and untouched human polygons.
- `split-index.json`: exact development/split hashes, disjointness assertions and coverage.
- `license-screening.json`: all attempted permission screens, including exclusions.
- `download_splits.py`: exact source recovery. Default is validation only; use `--split acceptance` explicitly when protocol-controlled acceptance is authorized for first use. Downloading source bytes itself does not perform inference or unseal the model evaluation.

```sh
python research/parallel68/data/download_splits.py --split validation
```

Original photos are local under `benchmark/parallel68-photos/{validation,acceptance}/` and excluded from Git. Model runners must consume an explicit split manifest rather than globbing that entire photo tree. No private family photographs, accounts, uploads to inference services, or deployments were used.

## Frozen initial counts

The eligibility snapshot was frozen after173 primary-page screens:34 eligible new photos from19 photographers. A fixed whole-author partition yielded:

| Group | Photos | Human object instances | Photographers |
|---|---:|---:|---:|
| Existing development |8|38|6|
| New validation |16|53|10|
| New workstream-sealed acceptance |16|52|9|

Total source photographs including development: **40**, with143 human object instances; this is not200 photographs. Validation has12 dress and16 shoe annotations, among other items. Acceptance has7 dress and16 shoe annotations. Category counts for all objects are in `split-index.json`; these counts are annotations, not model results.

The fixed permission-screen prefix is `license-screening-frozen.json` and its SHA is in the index. The separate full screening log may include additional unselected candidates; these never silently change the frozen split membership. Future development/training collection must continue excluding acceptance source IDs, SHA values and photographer groups. Other photos from acceptance photographers are not safe training data merely because their filenames differ.

The completed primary-permission audit screened202 polygon-eligible candidates and found39 eligible new photos from22 photographers after development-source exclusions. The five extra eligible photos beyond the frozen34-photo snapshot were not added retrospectively. The split remains16/16, with all held-out identities unchanged.
