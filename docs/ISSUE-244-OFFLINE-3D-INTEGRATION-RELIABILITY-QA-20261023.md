# Issue #244 — independent offline 2D → verified-original → 3D boundary audit

**Date:** 2026-10-23. **Base main SHA:** `54c9e29ede069a05d1268e003f80cbda043c7d6a`. Independent branch `qa/issue244-offline-3d-integration-qa-20261023`. Research/test only, **not installed in public/**. **No production changes, merges, deployments, real customer photos, cloud calls or paid AI.**

## Reviewed real versions

- Main `public/outfit-board-engine.js`, `public/outfit-board.js`, `public/app.js`, cloud restore and account-scoped IndexedDB v2. Actual saved outfit: `state['outfit-board']={current:{slots:{top:itemId,bottom:itemId,...}},saved:[...]} `. IDs refer to `items` records, not photo versions. Existing `cleanOutfitBoard` removes deleted/mismatched choices and dress-covered pants/layers.
- Draft PR #231 exact pinned upstream commit `b9f3f37daa49e4b6afed346b16233c624e1e89c5`. Nine exact-source QA reference files in `research/issue244/reference/pr231`, verified by Git blob hashes. Its `verifyCapturedOutfitBoard` SHA-256 checks normalized `originalPhoto.image`; `resolveSavedOutfitPresentation` preserves legacy 2D and verified 3D snapshots. It does not implement real authentication or normalize all saved item fields.
- Draft PR #232 (Assignment #229 rotating humanoid) exact pinned upstream commit `6025b134678b218d67b7ad6a7769457c8bbb2fc1`, with exact read-only WebGL renderer, mesh generator and saved-wardrobe bridge in `research/issue244/reference/pr232`. The renderer is a **solid-color geometric proxy**, not original-photo-textured 3D fabric.
- The live parallel `integration/verified-avatar-contract-20261023` branch was inspected read-only and contains the same exact PR #231 `outfit-3d-board-bridge.mjs` and `verified-3d-photo-preparation.mjs` Git blobs at review; do not amend it.
- Draft PR #242 / issue #240 owns recommendation changes, saved outfit pin/rank logic and source-change invalidation. Issue #243 owns realistic garment silhouettes/texture/appearance. No work overlaps those owners. This task checks **only** the boundary and error handling.

## Concrete compatibility matrix

| Aspect | Real saved 2D schema | PR #231 verified adapter | PR #232 humanoid bridge | QA #244 disposition |
| --- | --- | --- | --- | --- |
| Selected items | `board.slots` values are item IDs | Looks up item IDs | Looks up item IDs | Resolve in a **closed-over owner-scoped synthetic storage context**, refuse unknown/duplicate |
| Account identity | IndexedDB named for Auth user | Caller owner check; synthetic `accountId` | Editable `ownerId`/`accountId` flags required | Never treat editable item fields or `()=>true` as proof; test mock only; live verified Auth/RLS still missing |
| Original photo | `item.originalPhoto.image` may exist alongside `item.image` crop | Requires captured `outfitSourceId`, JPEG bytes, SHA-256 version | Requires owner-tagged original image, source ID and crop identity | QA creates **temporary read-only normalized copies** from verified synthetic scoped records; no mutation to underlying photo |
| Duplicate original for multiple clothes | Legitimate shared original and distinct garment crops | Same capture ID allowed only with same fingerprint | Distinct garment crop identity required | Test shared frame with unique crops **passes**; reused crop identity **2D fallback** |
| Item color | Often text value `color` | Explicit `#RRGGBB` colorHex required | Can accept known name or `#RRGGBB`, produces RGBA | Convert only a fixed known text palette in offline mock; unknown colors remain **2D** |
| Layer 0 vs layer 1 | Layer 0 top; long-sleeve top can also be layer 1 | `layer` demands Outerwear and only supports top,bottom,shoes,layer | Supports top garment as layer + layer2 jacket/layer3 coat | Long-sleeve layer, coat/jacket **stay full 2D**, never silently disappear from 3D |
| Dress | Clears bottoms/all layers | Top dress requires no bottom or layer | Dress hides lower layers in WebGL | Test dress+shoes 3D; dress with hidden garments refused even for 2D selection |
| Accessories | Separate owned slot IDs and shopping ideas | Not rendered | Not rendered | Preserve in existing **2D** rather than silently omit |
| Partial outfit | Allowed, explicitly lists missing required owned items | 3D may accept subset | Renderer has default top/trouser/shoes colors | Incomplete required slots always **2D**, preventing invented default clothes |
| Legacy saved board | Plain board with slots | Classified as legacy 2D | Has own owner/signature shape | Legacy stays safely **2D** and never silently upgrades |
| Verified saved snapshot | Production does not store immutable SHA in board | `schemaVersion=1` + `verifiedSnapshot.selected[]` with SHA | Noncryptographic internal FNV signature from source strings | Experimental QA stores additional per-selected category, crop and color SHA; after edit, fallback to authorized 2D |
| Renderer input | Full JPEG/crop paths remain in 2D UI | Outputs SHA and normalized RGBA | Returns `references` containing **full original photo strings** alongside colors | Strip `references` entirely; renderer sees **only valid RGBA**, no user/photo URLs/logging |
| Browser/WebGL unavailable | Existing 2D remains usable | Requires verifier and source fields | `createDetailedHumanoid3D` returns supported=false | Browser mock tests visible 2D fallback; no production renderer switched on |

## Independent QA architecture

- `research/issue244/qa-fixtures.mjs`: 48×72 actual JPEG produced from a synthetic solid-color image, with valid JPEG COM-tag variants to exercise distinct SHA source bytes under unchanged crop. One initial copied Base64 fixture was truncated and rejected by PR #232; that was a **test fixture error**, not a reproduced upstream defect. The test was corrected before final verification. Same app-retained JPEG may legitimately serve several garment crops. No photos from people or connected apps.
- `research/issue244/offline-3d-integration-qa.mjs`: isolated seam using **unchanged pinned PR #231** original SHA/JPEG/verified-board contracts and **unchanged pinned PR #232** source-admission/RGBA/WebGL input contracts. The test uses a **synthetic closed-over owner-scoped store**; every asynchronous boundary checks owner + generation. Does not accept editable account labels as auth. Real live Auth needs future integration.
- Prior to renderer, verifies selected IDs, visual slots, owner context, JPEG container, metadata, unchanged full-capture SHA, separate crop identity, rgba range, dress and layer compatibility. Refuses missing/corrupted/duplicated input. Verified-but-not-renderable jackets/coats/accessories, unknown color or changed original return **owner-authorized 2D**; invalid foreign/deleted/duplicate garment IDs return **unavailable**, never a cross-owner fallback.
- Saves experimental PR #231 envelope plus SHA-256 category/color/pattern/crop metadata. Valid legacy data remains 2D. This QA envelope is not a migration design and is not activated in current products.
- Pin and swap tests at boundary only (no recommendation ranking implementation or 3D texture generation). No image bytes are written into renderer input, logs, or URLs. WebGL gets only `renderer.colors={top:[r,g,b,a],...}` and a research-only marker. Unknown back/side geometry remains labeled estimated.
- Full Node root regressions and browser viewport QA run via `.github/workflows/issue244-offline-3d-integration-no-deploy.yml`, with a **zero-diff production source fence** and exact Git blob source pins.

## Findings and limitations / release blockers

1. **No production integration is shipped.** Real saved clothing lacks universally persisted `accountId`, `originalSourceVersion`, or `colorHex` fields demanded by #231. The mock derives colors conservatively from text, checks true synthetic JPEG SHA and owner-scoped fixture, but does not authenticate to hosted Supabase.
2. **Photo identity semantics:** A SHA of the app-retained JPEG bytes is not proof of untouched native camera/file bytes. Tests preserve different full-frame JPEG identity versus garment crop. See #232 provenance audit / PR #233 before any live 3D input.
3. **Layer coverage gap:** PR #231 still ignores `layer2`/`layer3`, whereas PR #232 supports them. Because silent omission is unsafe, QA explicitly requires 2D for such saved outfits. Separate 3D geometry/texture work #243 owns improvements.
4. **Renderer fidelity:** Procedural WebGL geometry can rotate 360° and accepts RGBA, but no actual garment texture/fit/accurate pattern mapping, verified side/back or physical phone metrics.
5. **True ownership:** Offline synthetic isolated accounts can catch switching and spoofed metadata, but a real service-side Auth owner, row/storage RLS, and race-proof async snapshot/recovery still need a verified integration contract. A passed caller boolean alone is insufficient.
6. **Saved outfit migration:** Existing plain slots have no immutable per-image version, so they remain 2D until a deliberate owner-reviewed, backward-compatible migration. Do not reject/delete legacy saved looks.
7. Browser tests are headless Chromium/WebKit Linux with 320, 390, 430 px touch viewports—not real Android or iOS physical devices. No Supabase, Cloudflare, customer camera, external photos, paid AI/credits, or Drive Duel use.

**Disposition:** Independent integration regression suite only. Product integration and 3D release **HOLD** until main Closet Current conversation reviews and explicitly authorizes adaptation, authoritative Auth/photo contracts, actual mobile testing and texture/fidelity gates.
