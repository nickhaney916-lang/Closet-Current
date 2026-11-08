# Closet Current — MAIN P163 Original Photographed Dress 360° Silhouette Integrity

**FAMILY ALPHA #255 HOLD. No merge, production/staging deployment, owner photo modification, or edits to active full-app Work PR #719.**

## Why this priority

Main [P162 PR #718](https://github.com/nickhaney916-lang/Closet-Current/pull/718), exact verified HEAD `7035fdad6396939c8032368a519767d204742b30`, proved 36 distinct genuine six-view 3D camera frames of original male/female figures with the real MIT-licensed head and original saved photographed dress. **It did not establish that the actual cloth still covers the body and retains a consistent skirt silhouette**. Unchanged photo SHA, stable outfit selection, and different camera PNG hashes alone do NOT prove visible cloth correctness.

The original 3D-02 photo-source provenance identifies benchmark source `commons-0053`, original SHA-256 `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`, as an actual externally photographed dress source with an `unverified-neutral` back material. There is no authentic photo of its rear surface. Rear black fabric is an **inference**. It is not valid to call all six views photorealistically reproduced from the original photo.

## Completed research engineering scope

P163 independently adds a source-specific, research-only visual QA capability: `scripts/audit-source-garment-360-163.mjs` consumes the actual PNG files captured by P162's verified source license/auth-bound 163-bone dress and parallel PR #716 genuine six-angle camera interactions. It does not render fabricated pictures.

For **female and male**, at **320/390/430 CSS pixels**, in **front, front-right three-quarter, right, rear-right three-quarter, rear, left** views:

- Verify actual full PNG SHA-256 and the inherited P162 source-authenticated, unchanged garment and original 80-/163-bone joint/neck provenance.
- Quantify dark photographed-fabric pixel area *only inside the anatomical torso/skirt crop*, never the black UI text/header.
- Verify over 30 rows of a continuous torso fabric patch rather than a disconnected 2D image plane.
- Verify real dress skirt and hem remain visibly expanded, including both profile views.
- Verify real source body arms and lower legs remain visible rather than disappearing into the dress or being replaced by a cropped screenshot.
- Compare garment pixel area for the *same actual camera angle and figure* across all 320/390/430 phone widths; require under 3.5% variation, proving the 3D dress does not change dimensions when phone width changes.
- Explicitly label the source rear as **UNVERIFIED INFERRED NEUTRAL**, not photorealistic reconstructed real clothing.
- Output all 36 per-image metrics and 12 matched viewport consistency metrics to a reproducible SHA-documented audit JSON, with fail-closed CI gates.

This addresses a real missing cross-angle garment fit-quality acceptance surface, rather than claiming that two successful branch tests imply cloth realism. It does NOT implement new photo-fabric simulation or make the original dress itself more realistic.

## Original-source protection and parallel coordination

Exact independent P162 parent pinned SHA. P163 contains ONLY new audit, test, report, and no-deploy workflow files. Original MIT head and saved garment materials/geometries and original JPEG/cutout bytes remain untouched. Full-app Work PR #719 is independently improving application flows and touches other app code; P163 neither reads nor modifies that branch. P716 camera behavior is fetched by the inherited P162 CI from its own exact SHA, not merged. GitHub file whitelist refuses modifications to public/, private storage, app, staging, Supabase/cloud, donor source, or previous research.

## Required acceptance

An exact-head no-deploy GitHub Actions workflow must pass the inherited P162 full Node suite and real Chromium/WebKit source photo rotation evidence, then pass the new real-PNG silhouette audit on the 36 actual screenshots. Do not call this complete until both jobs succeed and an artifact is downloadable.

**Still out of scope:** Actual cloth drape realism and physics, arbitrary original user-photo fabric projection, genuine rear photo reconstruction, independent human 10/10 photorealism review, real iOS/Android hardware, signed hosted cloud, full application integration, Family Alpha and public release. Those remain HOLD.

**Status: initial implementation; exact-head CI and screenshot audit pending.**
