# Mission 2: photographed garment fit integrity

Family Alpha HOLD #255. Isolated draft research, no merge or deployment.

Baseline: P196 PR #762, exact a19aae78026c8ec9e1b4b34028142abc7df8c8c8.
Its independently recorded Actions 42708943271 passed three jobs and 210
SHA-audited screenshot files. This is inherited evidence, not this branch's result.

## Reproduced defects and repairs

The real THREE.js fitter accepted a singular world transform (whose inverse
collapses coordinates), nonfinite position attributes, overlapping panel/position
storage and duplicate mesh references. Interleaved attributes produced an
uncontrolled TypeError. All five cases were reproduced before the fix.

The fitter now preflights every torso and shoulder target before staging any
changes: finite invertible world matrices, finite packed floating-point XYZ
attributes, nonoverlapping backing storage and unique mesh identities. It also
rejects nonfinite staged coordinates before committing any panel. Existing
source/owner SHA, skeleton, bilateral contour, cap and topology checks remain.
A transformed nonuniformly scaled/rotated hierarchy test verifies that accepted
fit displacement stays bounded on world X without introducing Y/Z drift.

Six new regressions exercise actual THREE objects and assert that a rejected
last panel leaves ALL panel and position arrays untouched. Focused local suite:
16/16 passing. Full local suite: 1,502/1,502 PASS with zero skips/failures. Exact-head CI results must be read separately.

## Genuine visual verification protocol

The dedicated NO DEPLOY workflow retains P196's genuine source-donor setup,
Chromium and WebKit, both humanoids, 320/390/430 CSS widths, rotation,
source-private saved-outfit path and inherited positive/negative original-photo
fallback cases. It audits 105 screenshot files per engine. Results are pending
until that exact commit's jobs finish; no new screenshot or performance claim
is made by this report in advance.

## Mission limitations

This repairs fitting transaction integrity; it does not expand supported garment
reconstruction. The fixture remains one licensed blouse and a synthetically
edited owner-asserted mask, simulated sign-in, inferred unphotographed back.
No independent human segmentation, arbitrary photograph geometry, physical cloth
simulation, collision certification, measured physical-phone performance, real
hosted owner authentication or photorealistic human acceptance is established.
Mission 1 research remains untouched. Full Mission 2 is not complete.

Next substantial work requires diverse rights-cleared source/mask garment inputs,
category-specific mesh construction, genuine body/layer collision measurements,
and new rendered visual comparisons. Source-derived fitting must preserve
uncertainty about occluded construction instead of claiming reconstructed backs.

## Performance evidence added after baseline audit

The inherited harness did not record timing. An opt-in MISSION2_PERFORMANCE
probe now samples 60 genuine requestAnimationFrame scheduling intervals with
the actual loaded 163-bone female and male scene at each mobile width. It records
median/p95/max interval and Chromium JS heap where available (WebKit null).
The six-sample inventory is asserted in the dedicated final browser stage.
Sampling times out after 30 seconds rather than hanging indefinitely. These
are headless software-WebGL scheduling diagnostics, NOT completed GPU-frame
measurements, physical-phone FPS or a performance acceptance pass. Raw private
photo bytes and owner identifiers never enter telemetry.
