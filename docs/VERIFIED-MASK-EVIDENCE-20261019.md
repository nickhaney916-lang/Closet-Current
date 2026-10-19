# Real-photo garment-mask evidence, October 19, 2026

This branch adds an offline evaluator, evidence gate and dark-edge review overlay.
It does not improve or approve the extraction masks. It is isolated from PRs
#40–#42 and based on PR #41's exact checkpoint `28a666d3`.

## Actual evidence

Reviewed PR #37's 12-photo source inventory, PR #39's partial witness rectangles
and PR #41's source-guided boundary report. All 12 original JPEG hashes match
both the inventory and locked source manifest; attribution is carried into the
reproducible report. Their existing CC source declarations are preserved, not
expanded into new permissions. Original high-resolution JPEGs and recognition/
indexing inputs are unchanged; local downsampled copies are used for diagnostics.

| Evidence | Result | Interpretation |
|---|---:|---|
| Licensed real originals checked | 12 | Existing source manifest and exact bytes |
| Held extraction proposals | 1 | Red shirt `commons-0002` |
| Independently verified full masks | 0 | No mask approvals invented |
| Real-photo false-removal measurements | 0 | Rates are null/unmeasured, not zero |
| Real-photo false-inclusion measurements | 0 | Rates are null/unmeasured, not zero |
| Quality passes | 0 | All 12 cases blocked |
| Removed dark pixels near retained edges | 6,129 | Unlabelled risk count on 633×946 copy; not errors |
| Physical-phone runs | 0 | Browser emulation is separate |

PR #41's 23,808 garment-core / 32,483 exterior-background witness checks still
pass, with 0 RGB edits, 0 cleared projected foreground pixels and 2,171 restored
pixels. These assistant-selected partial regions do not measure complete collars,
sleeves, hems, logos, buttons, seams, dark trim, fabric detail or background.
No previously held photograph is released. Black trim indistinguishable from
background, removed low-contrast material, dark fringes, translucent edges and
body layering remain unresolved. No full-mask quality improvement is claimed.

The magenta overlay highlights source pixels with max RGB ≤85 and spread ≤16,
alpha 0 and a retained pixel within Chebyshev radius 2. This includes legitimate
background. It changes neither source nor candidate; it cannot find dark trim
farther from the retained edge and is not a complete uncertainty estimate.

## Independent references and legal reuse audit

See `benchmark/reference-mask-evidence/source-audit-20261019.json`. No dataset
images or masks were imported and no external model/inference was used.

* [Fashionpedia publisher terms](https://fashionpedia.github.io/home/data_license.html)
  license annotations under CC BY 4.0 but expressly separate image rights and
  image-host terms. This is a conditional route to published external masks,
  requiring exact photo/annotation checksums, individual image rights and
  independent coverage inspection. It does not supply a reference for any of
  our 12 exact fixture photographs. Generic mirror license badges are insufficient.
* [ModaNet publisher](https://github.com/eBay/modanet) and
  [license](https://github.com/eBay/modanet/blob/master/LICENSE) identify CC BY-NC
  4.0 annotations. No permission sufficient for this commercial project's
  reusable corpus was established; images have separate rights.
* [DeepFashion2 publisher](https://github.com/switchablenorms/DeepFashion2)
  requires a download request. The [maintainer's commercial-license answer](https://github.com/switchablenorms/DeepFashion2/issues/3)
  says no commercial license is available. No agreement accepted or mirror used.

No legally cleared, independently verified full-garment references were obtained.
The practical next route is independent annotation and second-person inspection
of already licensed originals, or per-image rights verification for selected
Fashionpedia pairs. Neither has happened in this session. Annotation labels must
cover the entire visible garment, including holes/trim, with explicit ambiguity
handling; no inferred hidden fabric. Document disagreements rather than pretending
black-on-black or translucent boundaries have certain binary truth.

## Evaluation contract

`benchmark/verified-mask-quality.mjs` accepts exact-grid reference RLE and candidate
alpha/RGBA. Its provenance gate requires a registry entry bound to the entire
reference object hash and exact source JPEG hash; full-visible-garment scope;
manual independent annotation; distinct annotator/reviewer; dated sign-off bytes;
and separate recorded image and annotation redistribution-rights evidence bytes.
Evidence hashes are checked, not just presence of names. Registry records require
human review through normal code review: metadata validation cannot authenticate
reviewer identities or decide copyright ownership. The committed registry is empty.
The CLI refuses a populated registry until an explicit, reviewed importer exists.
This prevents proposals from silently becoming trusted labels.

Metrics use threshold 128 unless explicitly configured, with no resizing of
reference masks. False removal = FN / all reference garment pixels; background
inclusion = FP / all reference background pixels. Precision and IoU are also
reported, with null for undefined denominators. Fractional alpha loss/inclusion
are measured separately from binary errors. Boundary precision/recall use
four-connected interior boundary pixels and explicit Chebyshev tolerance (proposed:
1 reference pixel); exact reference-boundary retention remains separate so a
nearby displaced edge cannot hide removal. Feature RLE masks are included in the
independently reviewed reference hash, must lie wholly within garment truth and
report alpha retention and RGB error. Missing features block; nonapplicability
needs a reviewed reason. RGB checks include transparent pixels and do not equate
unchanged hidden RGB with retained visible fabric.

Proposed, **unapproved** thresholds: removal ≤0.5%, background inclusion ≤0.5%,
boundary recall ≥99%, feature retention and alpha retention ≥99.5%, unchanged RGB.
These are policy proposals, not validated tolerances or measured outcomes. Binary
silhouettes cannot certify native translucency, fabric appearance after warping
or body occlusion: transparency/layering evidence remains a separate mandatory
block. This evaluator currently cannot produce a complete release approval, even
with a perfect binary outline. Production authorization always remains false.

## Reproduce and interpret gates

```sh
python -m pip install Pillow==11.3.0
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
python scripts/benchmark-source-guided-boundaries.py
node scripts/assert-source-guided-boundaries.cjs
node scripts/report-verified-mask-evidence.mjs
node scripts/assert-verified-mask-evidence.mjs
```

Outputs: `artifacts/verified-mask-evidence/results.json`, `report.md`, plus attributed
source/projection/candidate/mesh/uncertainty/dark-risk views in
`artifacts/source-guided-boundaries/index.html`. The committed JSON is an actual
pinned-Pillow run, not a hand-authored quality result. Repeated reports must match
byte for byte. Pipeline and input-report hashes expose drift; assertion code
compares the full report and fails on any changed evidence. A passing **evidence
integrity** job means the blocked state is correctly reproduced, never that a
photo passed the quality gate. Synthetic unit references exist only in test memory
and are never placed in the real-photo registry.

Local full suite: **1013 passed, 0 failed, 3 skipped** (8 new evaluator tests).
CI runs the same suite/report assertions/repeatability checks and the existing
Android Chromium / iPhone WebKit harness. Browser checks validate execution,
privacy, temporary selfie positioning, caching and proposal safeguards; they do
not validate independent mask accuracy or physical-phone performance. The draft
PR records exact-head CI results. No merge/deploy, purchases, customer uploads,
paid generation, new inference, figure replacement or Drive Duel changes.
