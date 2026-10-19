# Closet Current — local alpha-bound garment alignment

**Research checkpoint — October 19, 2026. Draft only; not merged, deployed, or validated on actual phones.**

## Product objective
Reuse one female and one male licensed standard figure for every customer. Keep the natural appearance of the actual customer's clothing while layering clothes for free in the browser. Customer photos are indexed from their **full original, high-resolution RGB source before segmentation** and never replaced with these display-only image transforms. Optional selfie remains local, removable and ephemeral.

## Problem and fix
The prior browser prototype inserted garment PNGs into wide/tall rectangles with CSS `object-fit:fill`. This distorted shirt and pants proportions and exaggerated wide white/transparent backgrounds. The new **`public/garment-fit-geometry.js`**:
- Inspects only already accepted transparent cutout pixels, refusing opaque rectangles, near-blank masks, extremely small or huge images; records visible bounding extents.
- Removes only transparent peripheral margins (with a small anti-aliasing margin) in an in-memory display canvas.
- Fits the cropped garment into the existing figure-specific slot **without changing its aspect ratio**. Upper-body items anchor to the upper slot; shoes anchor at the lower sole line. Horizontal centering is preserved.
- Retains the PR #32 conservative 32-triangle local mesh warp for supported garments after cropping; warping is never used for indexing or source-image correction.
- Keeps private original item images and clothing metadata untouched, no provider inference or external billing. UI shows only the transient display result. Malformed or uncertain masks are skipped for review.

## What this does not solve
This is *not* clothing physics or true anatomy tracking. Alpha bounds are not semantic sleeve/shoulder/waist landmarks. The two checked-in figure files are still low-resolution previews; no commercial licensing or full-resolution figures have been independently approved. Pattern/logo stretch and occlusion around arms/jackets have not passed human quality review. Physical device latency, battery, pose alignment and face segmentation remain open acceptance gates.

## Evidence and next priorities
- New `tests/garment-fit-geometry.test.cjs` verifies trimming bounds, invalid-mask rejection, exact aspect ratio, upper/sole anchoring, and immutable classification input.
- Updated built-app browser emulation measures image natural dimensions and rendered geometry on **Android Chromium and iPhone WebKit emulated profiles**, while rejecting remote paid provider POSTs.
- Actual real-photo wardrobe fidelity (including pale clothing and shoe anatomy), genuine user-photo masks, two physical phones, and two approved model-image licenses are **not** proven by these synthetic tests.

Next technical priority is **verified garment-specific silhouette landmarks and controlled sleeve/waist deformation**, reviewed against authorized real photos. Never auto-fill invented seams, color, patterns or missing garments. No paid provider, customer photo uploads, merges, deploys, or Drive Duel changes.
