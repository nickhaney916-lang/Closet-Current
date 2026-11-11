# Mission 1 P814 — transactional all-or-nothing outfit worker crop output

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED.** Base: independently green P813 exact `621f2b78b077bdfa638cad3510b2a7c8ae926ac6`, [dedicated CI #42962357408](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42962357408) (2/2 success, 1,671 Node PASS, 1 optional SKIP, 0 FAIL). Research branch only; production/staging/hosting untouched. Four modified allowlisted files: native outfit worker, corresponding test, dedicated NO DEPLOY CI, this report.

## Real discovered partial-data defect

`public/outfit-worker.mjs` streamed `{type:'piece'}` to the live application **as soon as one crop/jpegData completed**, then processed the next candidate. The consumer `public/outfit-capture.js` immediately calls `candidate(...)` for each piece and renders it in the review queue. If a later image crop or encoding threw, the worker emitted `{type:'error'}` **after the first garment already entered the user's review queue**. An existing test explicitly asserted that leaking one partially separated item on later failure was intended. This violates the goal of an all-or-nothing multi-garment review batch, and undermines the source-identity guarantee of P813.

## Implemented

The worker now prepares all per-group source JPEG crop/segmentation color hints **before posting the first** piece. It buffers the encoded candidate records with explicit memory limits (8,000,000 characters per isolated JPEG or original-texture crop; 24,000,000 aggregate characters across all two-image records). Only after every original-photo crop and all encodings pass does it emit the ordered `piece` messages followed by a single `done,count`. Any error, oversized result, or previous P813 detected-region overflow sends just an actionable error and **zero** pieces/done. This does not change who owns the photo or allow the model to assign verified categories, subtypes, colors, source or 3D readiness.

## Acceptance

Dedicated tests run the actual worker implementation in Node VM with mocked encoder and model tensors. They assert (a) successful three-garment photo results in three ordered pieces and one done, (b) a deliberately thrown JPEG failure after the first full piece was encoded yields **zero** piece events, (c) a too-large synthetic encoded JPEG yields **zero** piece events with safe retry guidance, (d) 13 vs 12 P813 model regions fail closed and (e) legacy isolation, no-person and single-outfit behaviors hold. Full app native build/test and independent worker regression CI must pass at final HEAD; exact P813 parent, only four research/file modifications. **Do not claim full verification until that run finishes green.**

## Mission-level caveats

Buffering encoded JPEG data trades a bounded temporary storage allocation for atomic downstream review; 24 million base64 characters is a guardrail, **not measured iPhone or Android memory acceptance**. Existing SegFormer B0 frozen model still misses 15/23 publisher garments on the previously exposed ten-photo diagnostic. Genuine independent rights-cleared unseen human category/type/color masks and source pixel IoU, live private device inference, physical phones, and owner release approval remain unverified. Do not present these synthetic tests as independent humans, model-accuracy gains, or permission to launch.
