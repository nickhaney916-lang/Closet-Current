# Closet Current — native-pixel, model-blind human garment review

**October 20, 2026 — isolated continuation of [PR #59](https://github.com/nickhaney916-lang/Closet-Current/pull/59).** This is an internal evaluation workflow, **NOT an app feature or production approval**. No customer images, outside datasets, paid inference or deployment.

## What changed

PR #59 staged twelve licensed original sources and bundled a first reviewer editor and a separate human approval editor. The older editors reduced their DRAWING canvas to at most 768 pixels, even though their loupe could see unaltered native source pixels. Enlarging a draft after the fact would invent ground-truth precision.

This branch adds **two separate standalone HTML review editors** so the old research workflows remain unchanged:

- `benchmark/annotate-garment-native.html` draws onto a canvas whose width and height **exactly equal the decoded source photo's native pixel dimensions**. Its RLE mask, review draft metadata and SHA-256 source checksum bind to the same grid. A human must select independent physical garment, source-derived item ID, category, form and target label. No AI mask seeds are allowed.
- `benchmark/approve-garment-mask-native.html` independently verifies original bytes, exactly matching source width/height and source SHAs, draft/native-grid flags, first reviewer's physical garment ID/form, and a **different second reviewer name**. This produces only a second-person REVIEWED HUMAN artifact. Human identities are not authenticated cryptographically.
- Both editors refuse unsupported source photos rather than silently downsample: **no more than 12,000,000 source pixels, no side longer than 6000 pixels and input file size up to 16 MB**. The first editor keeps only three levels of pixel-mask undo data to reduce memory. For files outside bounds, neither draft nor reference is produced; the case remains HOLD.
- The offline twelve-source packet now bundles the native editors, first/second review HTML, original bytes, rights audit and status JSON. Every photo includes `nativeGridReviewSupported`, and summary records actual supported and held counts. SHA-256 values of both editors and original sources are included in the packet status.
- The FIRST reviewer receives the original image and opaque source ID, **not** model prediction, model-guided mask, category label or existing source quality notes. The SECOND reviewer sees source-side risk notes, attribution and the first human's draft. Copies of user clothing, selfies, face images or any live account files are never written to the packet.

## Actual engineering tests

The existing `source-guided-boundaries.yml` workflow runs the full app suite, original 12-photo segmentation report and fail-closed 12/12 BLOCKED mask gate. Then:
1. Generates packet and runs Python tests checking all photo source hashes, blind first-review inputs, unchanged original sources, exact native-pixel editor code, support caps, no approvals and reproducibility.
2. Runs a **real Chromium browser**, draws a synthetic 960×1100 photo using the first reviewer, exports an original-grid RLE human DRAFT, and checks the separate editor can load exactly that image/draft, verify a distinct second name and create a synthetic local reviewed file. Browser outputs are **test-only**, never registered as actual human approvals.
3. Deliberately attempts a legacy resized 768-pixel annotation, an AI-seeded mask and a checksum-altered draft; each **must fail** before approval.
4. Loads each of the twelve existing licensed real JPEG fixture originals in the first editor (without painting/approving), compares browser decoded raster dimensions to its source-manifest width/height, and checks each is either fully native or held because of explicit dimensions/pixel limit. Zero model-proposal/automatic approvals.
5. Uploads the real 12-photo independent human work package through GitHub Actions, not to the deployed app or an external inference provider.

This is browser **emulation**, not physical iPhone/Android testing, human-vetted pixel-edge accuracy or measured segmentation quality. Large bitmap canvas editing can be memory intensive; the bound is a fail-closed protection, not proof of phone responsiveness.

## What is NOT resolved

- **There are zero human-signed original-photo reference masks in the repository.** This branch makes full-grid independent human labeling possible under the grid cap, but does NOT fabricate a first person, second person, actual outline, human photo classification or pass rates.
- The existing `benchmark/reference-mask-evidence/registry.json` remains empty with policy `proposed-unapproved`. An explicit independently reviewed evidence importer is STILL required. No human editor, browser test or generated packet may populate this registry automatically.
- Independent image and annotation redistribution rights, review evidence hashes, dual identity validation and boundary ambiguity decisions still need real human/legal evidence.
- A full opaque reference mask alone cannot prove translucent fabric edges or realistic layering/occlusion on either reusable 3D figure. Real photo composites and actual physical phone QA remain blocked.
- Original high-resolution input still drives clothing recognition and indexing **before cropping/clipping**. Do not change or downsample it for classification.

## How to use the packet

Open `FIRST-REVIEW.html` from the downloaded `twelve-source-original-mask-human-review-packet` ZIP. Use `FIRST-ANNOTATE.html`, load an unchanged `originals/*.jpg` file, select independent physical garment and manually paint/select its full original-grid silhouette (including interior holes). Export the draft JSON for an independent second reviewer. The second reviewer opens `SECOND-REVIEW.html` and `SECOND-APPROVE.html` and checks the original source at full pixel detail, not an AI score. They may reject or export a human-review artifact; **even this does not authorize production or quality scoring until verified importer and rights sign-offs exist**.

**No production merge/deployment, new paid calls, purchases, account data upload, face/selfie use, or Drive Duel changes.**
