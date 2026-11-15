# Mission #90 milestone 7 — measure real skinned-garment presentation, not synthetic UI speed

**DRAFT RESEARCH ONLY · NO MERGE/DEPLOY · Family Alpha #255 OPEN/HOLD.**

## Why the next bottleneck needs evidence

In accepted [M5 CI #43637281544](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43637281544), both original 163-bone male/female rigs passed native saved-outfit switching and Chromium/WebKit same-host baseline/candidate/restored source-frame comparisons. Sample candidate per-change median source loading was around 0.5 seconds and candidate total presentation around 2.6–3.25 seconds on those CI runners. Those numbers are **not** isolated garment-geometry timings: presentation includes adapter planning, source-bound preparation, rigged mesh application and WebGL updates. Rewriting geometry or dropping SHA checks without profiling would jeopardize authenticity.

## Actual isolated instrumentation

- In the **disposable exact pinned PR541 research donor installer**, wrap the existing `prepareIndexedGarmentsFor3D` and `applyIndexed3DSelection` calls using `performance.now()` without altering their arguments, order, return checks, source checks, original files or meshes. Dress `viewer.applyOutfit('dress',...)` is measured independently, with `prepareMs=0` because dress does not call the indexed shirt adapter.
- Attach **numeric** `renderStages90:{kind,prepareMs,applyMs}` only to the already existing source-verified presenter receipt returned **after** all the existing success checks. On any denied or interrupted admission, no verified stage receipt is returned.
- The native research bridge only returns these timings when its existing owner/session/source/revision visibility and source-revocation gate says the real viewer is **active**; otherwise it returns `null`. No user ID, garment name, image bytes, private source metadata, mesh, source image path, screenshot, texture or owner-specific performance cache is added.
- Browser-switch tests assert valid actual displayed garment `kind`, non-negative finite stage times (zero prepare for dress) on each real native save-selection and write them alongside the already required SHA/source and authentic resource/canvas receipts. The paired startup comparison reports medians separately for shirt preparation, shirt mesh application, and dress mesh application for each rig/variant/engine. N=2 shirt and N=2 dress examples per rig/variant — descriptive diagnostics, **not** publishable benchmark precision.
- Structural Node test ensures telemetry is derived only from the live presenter and gated by active owner, with original `revokeChangedSource89()` retained. No production/hosted code touched.

## Acceptance and handoff

The dedicated exact-head M7 no-deploy CI must pass both Chromium and WebKit, mandatory full Node, genuine source-photo hashes, both original rigs, baseline/candidate/restored pixel comparisons with no material/source/geometry changes, repeated saved selection and browser lifecycle/owner revocation tests. M7 **does not** claim measurable speedup: it is the evidence required to select the first real performance fix in the source-preserving mesh-preparation/application path.

M5 [CI #43637281544](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43637281544) is accepted 2/2 browser with 2,678/2,678 Node success. M6 originally failed only two obsolete static test patterns; exact-head [M6 CI #43638329478](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43638329478) must be checked independently. No result can be inherited from one SHA to another.

**Still blocked:** physical Android/iPhone hardware touch/performance, hosted owner accounts/cloud privacy/integration, faithful multi-category independently approved clothing geometry and rear drape/collision evidence from Mission #89, real full layered outfits, true hardware GPU memory and motion FPS. Keep Family Alpha #255 OPEN/HOLD.
