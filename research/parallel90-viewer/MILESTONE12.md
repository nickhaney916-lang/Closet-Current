# Mission #90 Milestone 12 — body-BVH-only same-source control

**Research/HOLD only. Draft PR #1178. No merge, deploy, production, staging, hosted Supabase, or private account writes. Family Alpha #255 stays OPEN/HOLD.**

## Why separate the effect

M11 original photographed research shirts showed the cached per-pose body BVH can reduce the original collision solver's contact time. Earlier three-way baseline/candidate/restored trials ALSO changed initial garment/source-loading behavior and source bundles (M3–M6). Thus their **end-to-end** time difference is not attributable solely to BVH reuse, and small samples remain vulnerable to browser timing drift.

## M12 controlled paired source experiment

Only the already immutable pinned PR541 disposable research donor is touched. The original M11 code remains default: candidate still constructs the same real body BVH once per pose, reuses it across all 12 original garment collision passes and original final recheck, while rebuilding the changing garment BVH each pass. A new **explicit CI-only** `P90_BODY_BVH_CONTROL=1` flag makes the same *candidate* viewer use the untouched donor collision solver. The source-loader, startup clothes, SHA-attested original public JPEGs, rig, 2D fallback, owner/session gates, browser viewport, model paths, garment geometry, source UV/materials and 28 authentic garment stage timers are identical. The flag is rejected outside candidate mode; no product-facing control or persistent cache exists.

New `scripts/benchmark-parallel90-bvh-ab.mjs` runs two separate original browser sessions per engine: (A) candidate source/rig + original body collision tree rebuilt per pass; (B) **exactly the same candidate** source/rig + once-per-pose body tree reuse. It restores **all five donor source files** before each experiment and after completion. The profile output is separated using `P90_PROFILE_OUTPUT`, without changing the original M11 baseline/candidate/restored measurement.

On each 163-bone male/female original research rig, four authentic synthetic-owner saved outfit selections (two licensed shirt, two licensed dress) must be accepted. The paired check requires all **four selection modes and source SHA**, original geometry/texture resource counts, and numeric actual cloth-contact **before/after crossings, pass count, corrected vertices and maximum correction** to be exactly identical. Both source shirt and dress views are compared at original frame checkpoints using the existing RGB threshold (no per-channel difference greater than 8). Only then is median `contactFit` and entire `applyMs` reported for two shirt samples per rig/engine. No strict speedup assertion is made because small CI samples can be noisy, but a causally cleaner comparison is now available. Independent M11 exact real-garment parity, source attribution, owner logout/context loss and original image selection safeguards remain mandatory.

**M12 acceptance pending exact-head no-deploy Chromium+WebKit CI** including full Node source regression, main M11 original browser and stronger controlled A/B. These hosted samples are not physical phones, real signed owner/cloud RLS, approved arbitrary photographed 3D garment geometry, back drape, collision-certification, all outfits or Family Alpha readiness. Keep #255 HOLD.
