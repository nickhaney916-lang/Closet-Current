# Style My New Clothes — customer flow and preview performance

Isolated follow-up to PR #51 at `9d1dd7d4898dff7697f43eeecafdcfa1c10fe588`.
PR #58 artwork and PR #61 / #62 mask evidence branches are not edited.

## Customer flow reviewed and preserved
The existing capture/automatic recognition uses the original-resolution source for
classification and indexing before clipping. The existing durable Save & style this
handoff pins that saved garment while recommending only clothes already owned.
The option now says **Preview on model** to make the existing local model view
findable. Swap and Save remain in the same card; no extra screen is required.
Sparse wardrobes retain explicit missing-piece messages instead of invented items.

## Changes
- A styling request snapshots anchor, occasion, season, audience and account before
  waiting for wardrobe loading. New requests/preferences/clear-anchor actions
  invalidate old work; only the newest request can publish or reset its button.
- An identical local preview plan for the same account reuses its existing decoded
  DOM layers instead of blanking/re-decoding/re-running the alpha diagnostic.
  Equality includes full source image strings, category, color, item ID, figure,
  every placement rectangle and held slot. No lossy image signature is used.
  Failed/held previews remain retryable; account changes and pagehide revoke reuse.
- Each figure/source/intermediate/final decode is bounded to eight seconds. Base
  load failure hides the old figure; no new clothing is put onto an old model.
  Exceptions and held garments expose **Retry clothing preview**. Busy state is
  programmatic; stale async work cannot clear the current job's status/layers.
- Recommendation photos decode asynchronously, reserve dimensions and load lazily;
  an unreadable photo shows a recovery explanation instead of a broken image.
  Long garment names wrap inside narrow cards; preview/save taps are at least
  48px high, retry is 52px, and controls shrink within their available width.
  Browser tests probe 320/390/430px layouts in both engines.
  Full-resolution original images, conservative extraction gates, aspect ratio,
  lossless PNG display copies and the existing 600k native-alpha budget are kept.

## Verification
Local build and full Node suite: 1,052 passed, zero failed, three skipped (1,055
cases). Forty focused style/preview/cache/depth checks passed. Six new behavioral
checks cover full-image plan identity, request races, account change, newest-only
completion and hung decoder timeout/cleanup. Synthetic tests are not image-quality
or real-garment accuracy measurements.

Local Chromium/WebKit installation was attempted and failed (truncated download).
Initial CI exposed a missing JavaScript MIME mapping in the customer-journey
test server; fixed without suppressing page errors. A later base-load fault test
selected an already-selected figure; corrected to actually toggle models so the
new identical-plan optimization does not correctly skip that injected failure.
The branch workflow runs full Node checks, the existing owned-clothes journey in
Android-like Chromium and iPhone-like WebKit, synthetic whole-outfit Save & style
handoff, and both existing fitting browser profiles. Added browser assertions cover
unchanged DOM reuse, transient displayed-photo retry, base-model failure/retry,
loading state and existing delayed stale-photo rejection. Exact-head GitHub CI
must finish before browser verification can be claimed. Screenshots/reports are
uploaded under style-new-clothes-preview-emulation.

## Limits / next work
This improves reliability and eliminates repeated local work; no speed, FPS or
perceived sharpness percentage is claimed. The local fitting system remains a
collage with conservative alpha/print safeguards, centerline alignment, layer depth
and visibility diagnostics. It cannot provide body-part occlusion, cloth drape,
size prediction or reconstruct indistinguishable dark fabric/background pixels.
Independent real-photo mask approval and final model-art approval remain separate
blockers. No accepted fitting-quality score or actual physical-phone run exists.
No paid service, provider inference, customer upload, merge or deployment occurs.
