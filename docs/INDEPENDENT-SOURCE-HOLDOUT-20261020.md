# New original-photo garment benchmark — October 20, 2026 Pacific

Research branch isolated from PR #109 exact `a6ee34a676030cff2a4fcf3b31185275c78371a7`.
PR #108 and #109 and their branches are unchanged. No customer recognizer,
threshold, vectors, old benchmark manifests, live cloud/Auth, paid inference,
Drive Duel, production merge or deployment is modified.

## Evidence and interpretation

The previous 59-photo benchmark contains four measured incorrect strong
subtypes. PR #107's frame agreement and PR #109's separate pretrained generic
CLIP agreement did not resolve them safely. These are historical observations,
not measurements of this new source set. High scores and agreement are not truth.

This collection selects new source photographs before seeing predictions:
two sneaker, boot, dress, skirt, shorts and shirt examples plus one photographed
alabaster sculpture as a non-wearable control. Candidate original URLs, Commons
source descriptions, authors and licenses are recorded in
`benchmark/independent-source-holdout/candidates.json`. They are distinct from the
prior locked source filenames; byte hashes and visual review must also pass.

**Source verification is not independent human garment adjudication.** Source
captions can be wrong or incomplete. Assistant visual observations are recorded
as assistant review, never invented human signoffs. Both original-photo hashes
and proposed family labels are frozen in a committed `locked.json` *before*
model execution. Independently labeled human ground truth and untouched future
confirmation photos remain mandatory for any production accuracy claim.

This is a project-new discovery benchmark, not proof of absence from CLIP's
pretraining corpus. Near-duplicate checks cover canonical filenames, source URLs
and exact pixel-file hashes; no universal semantic/photographic deduplication
proof is claimed. Old public photographs may have appeared in model training.
No inference result may be used to relabel an error into success.

## Pipeline

1. Acquire actual original JPEGs from canonical Wikimedia upload URLs, without
   cropping, masking, recoloring or replacing them with thumbnails. Record exact
   SHA-256, dimensions, byte length and full attribution; save small review-only
   derivatives separately. Respect rate-limit waits, preserve partial acquisition
   and refuse to infer success when a source is unavailable.
2. Visually review the original-frame images before model inference. Preserve
   ambiguous subtype limits: boots may only be scored as the boot family; dresses
   as actual dresses, not jump suits/rompers. Never call family accuracy exact
   ankle-versus-tall-boot or casual-versus-formal-dress accuracy.
3. Lock the image bytes and pre-inference labels. Reject overlaps with the old
   source records and fresh-11, duplicate IDs/hashes, missing licenses and absent
   visual evidence. No target labels, photographer captions or garment names
   enter `blind-manifest.json`; inference receives neutral IDs, original images
   and the existing fixed full vocabulary only.
4. Run the unchanged production FashionCLIP browser worker on the complete
   full-scene original-derived RGB JPEG before garment clipping. The inherited
   benchmark harness normalizes to at most 2048px/JPEG .94; the original file
   bytes remain preserved separately. This is not raw-byte sensor inference.
5. Run independently pretrained generic CLIP `Xenova/clip-vit-base-patch32`, pinned
   revision `d15189d`, q8, Transformers.js 3.8.1, using the fixed full vocabulary
   and the same source files. No paid service or in-app model is activated.
6. Only after both inference stages, score category coverage, coarse family
   correctness, incorrect strong predictions, negative controls and the number
   of correct strong predictions a proposed model-agreement policy would lose.
   `strongAutos` means model automatic-decision candidates, **not proof that the
   full app actually saved an item**; app review, color and indexing gates are
   separate. All inference errors or missing/extra rows fail scoring closed.
7. Export original photos, hashes, predictions, per-photo results and a separate
   label-free review page/template. The human review template is explicitly
   UNREVIEWED; it does not create review identities or claim human approval.

The proposed benchmark does not modify customer decision thresholds or fit a
new model. No net classification accuracy improvement is claimed without actual
independent measurements. A finding may justify collecting additional physical
form evidence, improving a training corpus or testing a stricter review-only
candidate on *different* untouched photos. Do not tune thresholds to this set.

## Reproduce

The dedicated workflow runs the complete Node suite/build, current isolated-source
scope verification and unchanged historical camera/human-review gates. Model
jobs run only after `locked.json` exists in the commit and source acquisition is
pinned to an artifact run. The optional manual collection job acquires sources
without inference. Pinned browser tooling is Playwright 1.56.1; Chromium and
WebKit run native-resolution, EXIF/color and import/source-preservation checks.

```sh
node scripts/independent-source-holdout.mjs verify
node scripts/build.mjs
PYTHONDONTWRITEBYTECODE=1 node --test tests/*.test.cjs tests/*.test.mjs
```

For collection, install sharp 0.34.4 and set `HOLDOUT_OUTPUT` to an empty temporary
directory before `node scripts/independent-source-holdout.mjs collect`. For the
locked stage, restore only the exact recorded collection artifact and run prepare,
then the commands in `.github/workflows/independent-source-holdout.yml`. Never
substitute a failed photo or a different revision without a new source lock.
Workflow artifacts last 14 days; retain a verified archive for longer research.
Source disappearance must fail a future rerun rather than silently change images.

## Initial acquisition checkpoint (historical)

Initial collection run 39537027701 retrieved two new sneaker originals, then
failed explicitly with HTTP 429 for the third source. Those two images were
visually inspected without model inference: Converse canvas high-tops on a dark
surface, and colorful patterned high-top sneakers. Retry run 39537145147 uses
source-server delays and the preserved initial artifact. Remaining source hashes
and review must be read from its result before calling the collection complete.

Eleven focused benchmark-integrity regressions and the full local Node suite
passed: **1,271 passed, zero failed, three skipped**. This is software validation,
not new-photo recognition accuracy. Final exact-head CI, acquired counts and real
inference metrics will be recorded in the draft PR after the evidence is available.
Production promotion remains BLOCKED, including if this small set scores perfectly.

## Complete original acquisition and pre-inference source lock

[Collection run 39538230372](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39538230372)
completed successfully at `38415cc345132aa7502108298b767bc8cdf97301`.
All 13 original JPEGs are in artifact 12318218952 (30,310,293 bytes; archive
SHA-256 `0a79dfeb6f2e341b4a995bddfcdec21038f3a017a9782f933922a6ae6f65ee4e`).
The earlier delayed run actually recovered nine originals before source #10
remained rate-limited; the final acquisition reused those nine exact files.
The collector now records long Retry-After deferrals instead of truncating a
server's required cooldown and making premature retries.

Every source's original-frame image was visually inspected before model output
was available. `locked.json` records full original SHA-256, encoded dimensions,
byte size, license attribution, source description and assistant visual evidence.
No source URL/filename or byte hash matches the old locked source records or
fresh-11. These are 12 real garment images plus one sculpture photograph, not
13 independent garment instances or 13 human-adjudicated gold labels.

Specific limits: #9 is a front/back two-view composite in one original source
file and counts once; #7 includes part of an upper garment; #10's compression
shorts/underwear boundary and #12's flannel shirt/jacket material boundary need
independent human adjudication. The two boot cases and two dress cases are
scored at coarse family granularity, deliberately not exact fine subtype.
The independent encoder explicitly applies EXIF display orientation and standard
sRGB decoding to the entire original frame, preventing a sideways source from
creating a misleading model disagreement. It performs no garment clipping.

The original source lock is committed before either new inference run. Model
promotion is still blocked even if discovery results appear perfect. New real
measurements must be read from final CI; no synthetic scores are used as accuracy.

## Actual new-source model results — discovery evidence, not gold accuracy

[Run 39538590277](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39538590277)
**SUCCESS** on exact source-lock/inference commit
`1a1c76c12ab37ab080fd71de1fdda1df4963ebbe`. Both real encoders completed on all
13 original source files. FashionCLIP reported **13 results, zero inference
errors**. Full app build/Node suite passed **1,271 / 0 failed / 3 skipped**.
Chromium and WebKit native JPEG/EXIF/color and untyped-import tests passed;
original-before-mask source/crop regression passed. These browser fixtures do
not establish physical-phone capture or customer wardrobe outcomes.

| Measured output against predeclared source/assistant labels | Result |
|---|---:|
| Positive garment source images | 12 |
| Correct broad category across all 12 garments | 10/12 |
| Specific allowed garment-family output across all 12 | 8/12 |
| Strong prediction candidates (not actual wardrobe saves) | 9 |
| Strong candidates matching declared family | 8 |
| Strong category/family disagreement | 1 |
| Category-only review outputs | 2 |
| Full garment abstention | 1 |
| Non-garment sculpture rejected | 1/1 |
| Exact two-model agreement would block disagreement | 1 |
| Exact agreement would also defer correct family matches | 5 |

Sneakers 2/2, boots 2/2, dresses 1/2, skirts 1/2, shorts 2/2 and shirts 0/2
produced an explicit matching family. Dress #5 and T-shirt #11 were held at a
correct category with unknown subtype. Skirt #8 abstained. Flannel #12 produced
strong Outerwear/Jacket instead of the locked source's Tops/Button-down shirt.
That is a **disagreement with a provisional source label**, not independently
adjudicated proof of a wrong real customer save: its shirt/jacket material
boundary was explicitly flagged *before* inference. Do not relabel it after
seeing the predictions to inflate results.

Raw generic CLIP top-1 labels matched 11/12 broad categories and 9/12 allowed
families, but have **no calibrated automatic admission policy**. It labeled the
sculpture a formal dress, one sneaker pair flats, and compression shorts leggings.
These unfiltered top-1 numbers cannot be compared directly to FashionCLIP's
abstaining/review-aware outputs as a proof of superior customer accuracy.
The exact subtype-agreement filter removes the flannel disagreement but loses
five otherwise matching family decisions (including ankle-versus-tall boots and
sweater-versus-formal dress differences that this set does not adjudicate).
**REJECT promotion or replacement on this evidence.** No model/threshold changed.

The immutable measurement wrapper
`benchmark/independent-source-holdout/measurement-39538590277.json` records the
actual report, source commit, source-manifest hash and original artifact digest.
Labels and image hashes remain exactly as committed before inference. The final
documentation/provenance commit must also pass exact-head regression and real
inference; read the final draft PR result rather than assuming it is green.

## What the evidence supports next

- Obtain blind independent human labels for the shirt/overshirt boundary,
  compression shorts/underwear boundary, dress family and boot heights. The
  exported neutral review HTML/template provides a handoff, not fake approvals.
- Collect genuinely untouched independent physical-phone examples, including
  black graphic tees, checker-pattern skirts, worn/flat-laid shirts and jackets,
  prior failure classes and several non-garment controls. Two samples per family
  cannot characterize real-world accuracy; public-photo pretraining overlap is
  unknown. Keep a new confirmation set separate from this now-exposed discovery set.
- Investigate category-only versus exact-subtype corroboration and better form
  evidence on *new* confirmation data; do not tune to these 13 or promote unknown
  subtypes using uncalibrated generic CLIP top-1 scores. Existing original-photo,
  confirmation, duplicate and review safeguards remain intact.
- Retain the original source archive and attribution. Review derivatives inherit
  their source image licenses; this work grants no new blanket asset license.

This assignment delivers source-verified original photos, locked provisional
labels, reusable scoring/inference and real measured failure evidence. A fully
independently human-verified gold benchmark and verified classification accuracy
improvement remain outstanding. No production readiness or 100% claim follows.

Final local regression after adding the measurement/label/hash binding test:
**1,272 passed, zero failed, three skipped**; 12 focused benchmark-integrity tests
passed. The source-lock file hash remains
`0ba1fae03ac1021d6ae58ccf17cd32026aabaa73364cf78618ce1cf7212581d9`.
Final exact-head workflow must verify this documentation/provenance checkpoint;
its result and full commit are recorded in draft PR #111.

## Complete blind human handoff

The final workflow additionally exports `independent-human-review-unlabeled` as
its own complete archive: the same 13 byte-identical original JPEGs with neutral
IDs, `review.html`, a blank `review-template.json` and a source-hash list. It
contains **no proposed label JSON, source-description manifest or model results**.
Give an independent reviewer only that archive, extract all files into one
folder, open `review.html`, and record observed families, uncertainty and visual
evidence in the blank JSON. Do not consult model outputs or the source archive's
label-bearing metadata while reviewing. This is a ready offline handoff; no human
review has occurred merely because the file exists. Keep original embedded EXIF
intact for byte verification and inspect the images, not metadata hints.

A second real-inference run at documentation/provenance commit
`d08eadfd64344bbf324837d5398556809dadd196`, Actions 39539181308, completed with
**1,272 Node passes / 0 failed / 3 skipped**, both actual model runs and browser
checks passed. Its complete scored report matched the first run exactly. This
is still **13 distinct source images**, not 26 new images or a new untouched
confirmation cohort. The final packaging-only head must also pass its own CI.
