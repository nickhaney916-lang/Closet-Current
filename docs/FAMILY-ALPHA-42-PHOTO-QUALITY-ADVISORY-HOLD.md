# Closet Current — advisory photo-quality guidance in actual full Family Alpha review (HOLD)

**2026-10-27 · Issue #255 · separate no-deploy development branch**

## Objective
Work #39 / [draft PR #338](https://github.com/nickhaney916-lang/Closet-Current/pull/338) demonstrated useful local blur, lighting and resolution hints, but only in a standalone research page. The verified [PR #340](https://github.com/nickhaney916-lang/Closet-Current/pull/340) improved actual original-JPEG import fidelity without such guidance. This changes the **actual offline compiled scanner's reviewed-result presentation**, preserving camera behavior.

## User experience
When an incoming original photo is decoded for the existing 16×16 recognition signature, separately assess a maximum 128-pixel local pixel sample using Work #39's exploratory luminance, dark/bright fraction, contrast and possible softness heuristics. After quality evaluation, when an unsaved item has an advisory, the existing Photo results / scan result card includes *one* gentle "Photo tip" and **Take a clearer photo**. The retake action navigates to the existing Add Clothes camera; **it does not delete, replace or reject the current photograph**. Adjust / Crop / manual editing / recognition still work. Automatic hands-free capture remains 5/8/10-second cadence and is not interrupted or disabled.

Optional advisory failure is ignored, never altering the authoritative original JPEG, the original RGB classification input, mask extraction or validated image hash. The low-resolution warning is informative only. An image of naturally dark clothing or a low-texture shirt can appear soft to these heuristics; the UI says "may" instead of asserting it is out of focus. It **does not** detect garment occlusion, cropped sleeves, background clutter, mannequins, skin or garment identity. The existing scanner separately detects truly blank frames as before; the new quality advice does not delete anything.

## Privacy and source identity
The advice is ephemeral text in a `WeakMap` of current in-memory garment objects. It is discarded upon pagehide and the existing alpha-session-changed signal. Each result is rendered only if its associated source data URI is still the same; a newly cropped or changed original cannot display a stale warning. No advice, photo pixels, or analysis is sent to servers or persisted to localStorage / IndexedDB / cloud. The reviewed source remains the authoritative original JPEG from PR #340.

## Safe integration
`scripts/build-family-alpha-42-photo-advice-hold.mjs` inherits the complete offline [PR #340](https://github.com/nickhaney916-lang/Closet-Current/pull/340) source-checked 3-outfit/2D-humanoid/atomic-save/owner-session/staged Auth candidate and changes **only** the reviewed source `photo-check.js` and the existing `app.js` review/advice display anchors. It appends the independent, human-readable conservative classic photo-quality implementation from `research/family-alpha-42/photo-advice-classic.js`. Every other compiled asset (including `photo-import.js`, capture cadence, worker recognition, original JPEG, mask, camera, cloud, Auth and wardrobe saving) is recursively checked **byte-for-byte** against parent.

## Verification
- Unit tests for dark, overexposed, low resolution, possible softness, invalid samples, and no image mutation or automatic rejection.
- Inherited full original-JPEG/EXIF, photo masking and original-source indexing, three outfit previews, single-shoe fallback, session fit cache, favorites, and storage rollback tests.
- Chromium/WebKit 320/390/430 synthetic test loads the **actual compiled** `photo-check.js` and `app.js` review-card function: advisory shows for current dark garment, retake navigates without deleting the original, and advice for a changed image is hidden. Also runs inherited full emulated phone Style My New Clothes workflow.
- All screenshots are clearly synthetic. No real family accounts, photos or physical camera claims.

**HOLD** until exact-head CI passes, real photos and consented Samsung/iPhone tests verify false-positive rates and UI, 15-photo clipping benchmark and realistic clothing draping pass owner visual review, and four-account staging RLS/auth privacy are proven. No merge/deployment, provider changes, live account creation, spending or new Work assignments.
