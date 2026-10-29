# Closet Current 3D-09 — source-verified real shirt, better 3D fabric silhouette (HOLD)

## Why now

This phase follows the successful **separate, genuinely skinned 3D garment shell** in [3D-08 PR #398](https://github.com/nickhaney916-lang/Closet-Current/pull/398), exact commit `842ea3893d72875c17942c2a74b8d8c9313404e7`. The user explicitly prefers improving a believable 3D humanoid clothed with their actual photographed wardrobe rather than polishing the temporary 2D avatar. 3D08 earned mechanical WebGL success but the black AJ shirt remained skin-tight.

## What changes

The same independently skinned **separate** outer garment geometry still follows both CC0 anatomical models (163 bones, source-pinned real GLBs), with the same source-approved Work47 black AJ photo on the front, the same original cutout alpha and exact SHA-256, and the same source-median neutral color on sleeves, sides and unverified rear. Nothing reinterprets the source image.

- New `cloth-silhouette.mjs` adds **bounded world-space fabric clearance** *after genuine skeletal skinning* and *before WebGL projection*. Base +0.013 normalized world units, up to +0.045 at the hem and +0.022 on arms. A tiny 0.0025 sinusoidal modulation is a non-physical visual wrinkle cue. Total new displacement is clamped to at most 0.085 units.
- Geometry changes in the GPU vertex stage are actual x/z world-space displacement, rather than a drawn flat decal or fake screenshot. Thus the rotated side view should show a visibly different garment outline, slight waist clearance and more separate sleeve fabric while preserving the user's photographed chest logo and color.
- A new research-only `3D-09/index.html` gives the owner a button to switch **Silhouette: relaxed ↔ close-fit** on the *same verified garment and rig*, with zero source file changes. This has no meaning when a shirt isn't active, and clearing/unchecking/reloading a body disposes the shell and requires explicit review again. Only reviewed `commons-0003` licensed shirt is tested.
- Both states are explicitly **research visualization hypotheses**, not a physically simulated woven shirt, real garment measurements, human-specific fit, or independent verified photographic rear. The underlying skinned humanoid and source-bounded cutout remain intact.

## Test gate

Dedicated strict no-deploy nine-file allowlist, historical SHA-pinned 15-photo benchmark rebuild, SHA-locked male/female GLB downloads, and all existing 3D06/07/08 binary/source/alpha/owner tests plus 3D09 clearance bounds/rig reuse/zero-cloud tests.

Real Chromium WebGL2 at **320 / 390 / 430 px** replays the full 3D08 interaction and visual source-integrity suite on both adult anatomical bodies, retains original JPEG+cutout SHA and manual trusted review, front/side/back views, material/rig swap and removal, zero external runtime requests. Then it switches the **actual GPU skinned garment** between relaxed and close-fit while holding the side camera still, and compares actual side-view pixel counts (more than 70 visibly changed pixels is the minimum mechanical gate). Screenshots of the same model/camera/clothing in both modes are in the labelled **HOLD** artifact for **human judgement**, alongside the inherited front-view male/female source-photo screenshots.

Passing these checks is **not** a human aesthetic/realism approval. We must inspect whether the hem and arms improve in the actual screenshot without unnatural inflation or source-logo distortion and use Work #55's independent visual rubric when available. Prior licensed 15-photo human acceptance remains **0 PASS, 5 REVIEW, 10 FAIL**; user/four-family alpha is not authorized. Work #53 isolation and Work #55 acceptance are separate; this branch does not change their source.

## Safety

No merge/deploy, staging, production, Cloudflare/Supabase/Resend, real customer/family photos/accounts, paid AI inference, externally fetched browser assets, or Drive Duel changes. This is an isolated experimental branch based exactly on 3D08, not another Work assignment.
