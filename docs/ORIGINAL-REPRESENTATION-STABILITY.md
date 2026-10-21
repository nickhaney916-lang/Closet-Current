# Original-photo representation stability

Research follow-up to PR #113 `71053247402d2e428044ef38b359057011335823`.
The independent-human review dependency remains external. This experiment instead
tests a measurable camera/import risk: does re-encoding or resizing the same
entire photograph change the unchanged production recognizer's decision?

## Frozen experiment

Use all 13 originals from PR #111's unchanged source lock. No selection based on
model performance, relabeling, new thresholds, classification models or vectors.
There are **13 distinct sources and 39 inference inputs**, not 39 new photos.

1. Untouched original JPEG bytes, verified against the locked source hash.
2. Full-resolution, EXIF-oriented, sRGB PNG. Its decoded RGB pixels must match
   the correspondingly oriented original decoded by pinned Sharp 0.34.4.
3. Entire oriented sRGB frame resized to fit 2048 pixels, no enlargement, JPEG
   quality 94 with 4:2:0 chroma subsampling. This is a specified research encoding,
   **not proof of a physical camera's output or browser-canvas encoder identity**.

No cropping, masking or clipping occurs in these derivations. Rounding dimensions
uses full-frame resampling, not a center-cover crop. Original inference runs first.
The unchanged browser benchmark subsequently converts each input through its
existing full-frame 2048-pixel canvas JPEG path, then invokes the existing worker.
Consequently this measures the complete existing import/preprocessing path's
sensitivity, not the encoder in isolation or direct model ingestion of raw PNG.
Sharp and browser JPEG decoders may differ; a PNG is lossless relative to Sharp's
oriented sRGB decode, not a claim of identical cross-decoder input tensors.

Neutral inference manifest contains only ID, image and mode; proposed garment
labels and source captions are never included. Lineage binds original/derived
byte hashes, decoded-pixel hashes, dimensions, byte sizes and actual unchanged
worker/catalog/preprocessor/vector/runner source hashes. Every inference input
is rehashed after inference. Existing source manifests and measurements remain
unchanged.

## Measurement

Count exact category/type/strong/category-review decision agreement per original
and variant, strong-to-different-strong decisions, deferred strong decisions and
new strong decisions. Compare the original-byte baseline with the historical
13-photo decisions as a separate reproducibility check; never replace a newly
observed baseline with the older result. No independent gold labels exist here,
so accuracy is always null and promotion BLOCKED. Stable decisions can still be
wrong; changed decisions do not establish which version is correct.

No thresholds or filters will be tuned on these exposed discovery images. Any
follow-up needs independently human-adjudicated labels and untouched confirmation
sources before claiming improved classification or automatic-save quality.

## Reproduce

Node 22; Playwright 1.56.1; Sharp 0.34.4; free existing FashionCLIP browser model.
The dedicated workflow installs Chromium/WebKit, downloads the fixed original
collection, runs full build/Node/source guards and actual browser model inference,
then supported original-photo fidelity/import/crop browser checks. Artifacts
contain blind input manifest, full derivation lineage, raw inference and report.
Originals remain in the separately pinned source collection artifact. Download
before the 14-day artifact retention expires.

```sh
gh run download 39538230372 -n new-source-originals-before-inference -D /tmp/repr-originals
node scripts/original-representation-stability.mjs prepare /tmp/repr-originals /tmp/repr-results
node scripts/build.mjs
node scripts/run-browser-photo-benchmark.mjs /tmp/repr-results/blind-manifest.json /tmp/repr-results/actual
node scripts/original-representation-stability.mjs score /tmp/repr-results /tmp/repr-results/actual/results.json
```

Use a clean checkout and fresh output directory. The preparation command refuses
to overwrite prior generated inputs. No customer photo/wardrobe saves, physical
phones, paid AI, live Supabase/Auth/customer data, deployment or Drive Duel access.
Actual measurements are pending their Actions run; software fixture tests are
not model evidence.
