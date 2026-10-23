# Rounded shoulders and exact indexed geometry

Research follow-up to issue #243 and draft #246, based on exact commit `07fa4a8a5a61589c68d60a7f6b80fb560b4e229f`. Reviewed #228/#231/#232, #245 at b0b6aa6 (verified color/authority contract) and #247 at 5b5a45b (independent integration QA). Those branches, contracts and reference copies are unchanged.

## Implemented changes

The prior torso shell and open sleeve tube left a notch at the shoulder. Authored rounded shoulder meshes now cover sampled notches on both sides for short/long sleeves and each existing layer. Body shoulders are rounded as well; dresses retain bare estimated shoulders. These caps use visibly estimated shading, not a fabricated photo pattern. Nested radii improve shell ordering; this is not a collision solver, body-sizing system or fabric simulation. Arbitrary poses and real garments remain unvalidated.

`indexPhotoMesh` deduplicates all eight float32 attributes by their exact bits. Position, normal and UV seams remain distinct, including negative zero. Expanding the uint16 index buffer reproduces every source triangle attribute bit for bit. No quantization, topology simplification, color changes, source-photo edits or benchmark relaxation occurs. Oversized/nonfinite/malformed meshes fail closed within the WebGL 1 uint16 index limit.

The existing research renderer uploads an element buffer and uses drawElements by default. The `{indexed:false}` option retains unindexed drawing for independent equivalence QA. CPU triangle arrays are no longer retained by renderer records after upload. Buffer deletion covers both vertex and index buffers on frame replacement, revocation, disposal and context loss. Source/account authority and SHA-256 session code are unchanged. Existing #245 is a procedural color contract, not live authentication; real authenticated integration remains a separate blocker.

## Local verification

Build and full root Node suite: **297 pass, 0 fail, 0 skip**, including six new tests. Tests expand every indexed attribute for separates, six layers and dresses; protect normal/UV/negative-zero seams; reject invalid and uint16-overflow inputs; independently check shoulder coverage. Existing 17 photo-session/geometry tests and all earlier root tests remain unchanged.

One synthetic short-sleeve three-slot mesh allocation comparison: 937,728 unindexed bytes versus 237,552 indexed bytes (**74.7% reduction**, including element buffers), 29,304 triangle vertices versus 5,592 unique attribute vertices. This includes added shoulder geometry; it is not an old-vs-new total-app-memory comparison. Original textures are untouched, and photo decode/texture memory is not reduced. The renderer releases its persistent CPU triangle arrays, but transient mesh construction/deduplication still allocates memory and needs phone profiling.

## Independent browser protocol

The new pinned Playwright workflow runs the full root suite, unchanged saved-avatar browser journeys, unchanged issue243 source-pixel/revocation/context-loss checks, and `test-3d-indexed-shoulders-mobile.mjs`. Final exact-head run/results and artifact digests are reported in the draft PR and issue #243.

The new browser benchmark requires actual WebGL in Chromium and WebKit at 320/390/430 CSS-pixel viewports. It compares raw RGBA from indexed and unindexed rendering, with identical geometry and verified synthetic source tokens, over six garment scenarios and six rotation angles (216 comparisons across both engines/viewports). Equality is strict, with no pixel tolerance. It asserts at least 50% buffer savings, no WebGL errors, no external requests/page errors/overflow, and instruments create/deleteBuffer and create/deleteTexture to verify zero live allocations after revocation/disposal.

At 390px, before/after captures use the exact prior #246 renderer/geometry loaded with git show at the pinned base SHA. They share the current branded source session module; this compares geometry without substituting an unverified account/source path. Separate captures are taken without overlapping canvases. Reports include per-scenario counts and 30-sample p50/p95 software draw + gl.finish measurements for indexed and unindexed renderers. Timings include neither network cold start nor physical phone thermal/battery behavior. Existing issue243 measurements retain page-load and preparation timings. No speedup is assumed; reduced buffer bytes are not evidence of better FPS.

## Remaining gaps and integration recommendation

Keep as a draft research extension stacked on #246. The human is still stylized, with simplified anatomy, hands and shoes. Original front-image RGB/patterns are projected onto proxy surfaces; UV stretch, photographed background and seam transitions remain. Shoulders, sleeves, sides and backs are estimated. No realistic cloth fidelity, human-reviewed segmentation accuracy or accurate fitting result is claimed.

Live authenticated authority wiring, reviewed per-garment crops/masks, licensed high-resolution garment evaluation, actual Android/iPhone performance/memory evidence and representative intersection tests remain required before customer integration. Synthetic browser emulation is not physical-device testing. Preserve the 2D release track and fallback.

All new assets are authored procedural geometry or synthetic canvas photos. No new third-party meshes, model weights, dependency or paid service was added. Earlier local-model commercial-license research is in `ISSUE243-PHOTO-HUMANOID-RESEARCH.md`; distribution licensing remains an owner decision. No customer photos, cloud/production changes, merge or deployment.
