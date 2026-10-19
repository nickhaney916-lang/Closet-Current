# Closet Current — two owned reusable figures, in-house outfit layers and optional local selfie

**Product direction confirmed October 19, 2026.** The preferred customer experience is NOT a paid per-outfit AI-generative try-on provider.

## Exact intended experience

1. **Acquire just TWO standard full-body figure images**: one male and one female, stable front view, identical design scale with safe, documented commercial reproduction/modification rights. Produce once using a suitable generator, commission the artwork with written assignment/licensing, or obtain a properly cleared commercial license. Keep the chosen final files on a private approved asset record with file hashes and license receipts. Never substitute unreviewed third-party photos or claim stock images are exclusive property.
2. The signed-in user chooses the standard figure. **Every outfit reuses these same two figure files**—no new human images required when clothing changes.
3. **Recognize type and color from the ORIGINAL unmasked full-resolution user photo before clipping**. Keep the untouched source for trust/accuracy. Build transparent, original-looking item display cutouts after indexing. Arrange tops, bottoms, jackets/layers and shoes on the chosen figure in z-order. Dress replaces pants/layers. One-piece swaps rerender the local composition.
4. An **optional selfie** can be placed over the fixed figure's face, temporarily in the browser. It must never silently upload, back up or save the face. The first implementation is an approximate on-device crop overlay, NOT face detection or high-fidelity identity transfer. A secure, optional local face segmenter can improve this later if quality tests show a need. Face/body proportion and consent/privacy need independent review.
5. The styling overlay runs in the customer's browser using owned closet images and ordinary 2D CSS/canvas composition. **Zero third-party per-generation AI image charges** for the collage itself. Existing web hosting, authentication, data storage and email can still have operating costs.

## Current isolated development implementation

- `public/reusable-figure-engine.js` selects **two fixed static preview asset paths** and exact owned wardrobe item IDs. It has no external calls and cannot save changes to source items.
- `public/reusable-figure-preview.js` creates local, display-only in-memory transparent cutouts, conservatively holds uncertain/opaque inputs instead of pasting rectangular photos over the body, and overlays a user-chosen local selfie using a revocable object URL. Full-resolution original/source photos are not overwritten or reclasified.
- A mobile-compatible display sits in the existing outfit builder and re-renders after each wardrobe selection/swap. The older paid AI panel is hidden, and its startup no longer checks the external provider while the reusable engine is active. The server paid-activation approvals remain hardcoded false.
- Existing assets `public/ai-models/female-preview.webp` and `male-preview.webp` can demonstrate the idea, but full-sized figure JPGs are **not committed**, and their standalone commercial rights / visual approval **have not been independently verified** here.
- Currently the rectangles are **coarse placement templates**, not body-pose deformation or photorealistic draping. The smile/face region is also a coarse front portrait alignment, not real face segmentation; do not call this production-quality dressing yet.

## Acceptance before real-phone pilot

- Approve model art rights, full resolution, clear cutout/face anchor dimensions and consistent pose.
- Ensure enough garments produce properly transparent display cutouts (including pale shirts and black shoes), no arms/bodies obscure seams, no wrong layers or phantom duplicates. Measure display fidelity on independent licensed real photos. Unsupported opaque images stay unavailable as layers, not falsely accepted.
- Test horizontal/portrait small-screen preview, 200% text scaling, camera photo input, pixelation, selfie isolation/withdrawal, account switch and privacy on **actual** Android and iPhone. Current automated emulation alone is insufficient.
- Separately decide whether to remove the old paid FASHN prototype entirely after the reusable preview passes field quality review. Keep it disabled now.
- Do not merge, deploy, purchase AI credits, upload selfies, change Drive Duel, or activate a third-party generation endpoint without specific owner permission.

## One-time figure image cost / rights notes

- If generating two figures using an image tool already included in a current software plan, the **incremental per-image cash cost can be $0**, subject to limits, terms, and review of applicable commercial-use rights. This does **not** guarantee exclusive copyright for fully AI-generated assets or prevent similar outputs.
- With stock imagery, the cost can be a one-time commercial license, but **stock images are ordinarily licensed, not exclusively owned**. Check commercial use, adaptation, redistribution inside the app and recognizable-person releases.
- A commissioned illustration with a written assignment or carefully drafted exclusive license may offer clearer control, but actual quotes vary; request quotations rather than assuming a market price.
- Once full assets are ready, each subsequent local 2D composite requires no per-image API billing. Cloud/hosting and storage have separate cost structures.

The previously discussed budget number was **an unfounded planning assumption and is NOT a project requirement or approved spending budget**. No billing was activated or charged. The separate quote-only branch must not be merged or used as a decision baseline.
