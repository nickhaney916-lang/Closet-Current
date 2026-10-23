# Issue 243: original-photo 3D research extension

Status: isolated synthetic research, not a customer fitting feature. No deployment.

## Provenance and scope

Built on PR #232 commit `6025b134678b218d67b7ad6a7769457c8bbb2fc1`, including PR #228 research. Reviewed PR #231 and `integration/verified-avatar-contract-20261023` at `d51f89fa9c6c362931daa7fff47e6b332a661660`. The existing 2D builder, saved-clothing adapters, previous 3D modules, production and cloud files remain unchanged. This branch adds a separate photo session, procedural mesh extension, WebGL renderer and synthetic comparison page.

The new body uses approximately 7.5 head heights, shoulder/chest/waist profiles, ears, nose, eyes and existing authored hand geometry. Garments include short/long sleeves, open jackets/coats, nested shells, separate skirts, dresses, trousers/shorts and shoes/boots. Shell clearances and depth testing improve ordering; they do not establish collision-free cloth simulation for arbitrary bodies or garments. The meshes are authored procedural proxies, not measured anatomy.

## Photo and authority boundary

`createPhotoTextureSession` requires caller-provided `verifySelection`, `readOriginal` and synchronous authoritative `isCurrent` callbacks. Editable account IDs are never sufficient. The synthetic demo mocks these authorities; it does not exercise live authentication or prove production account isolation.

The selected record shape preserves verified `slot`, `itemId`, `sourceIdentity`, SHA-256 `sourceVersion`, `category` and estimated-surface semantics. Optional `itemType`, `sleeveLength` and authoritative normalized `cropBounds` provide geometry and isolation information. The reviewed integration contract does not yet supply all of these optional fields. Shared originals cannot be projected twice with identical crop bounds; real multi-garment photographs need authoritative distinct crops/masks before integration. Caller verification must bind every supplied field, including crop bounds, to the authenticated selection.

Every preparation copies original bytes, checks their SHA-256 against the verified source version, decodes locally, checks source/scope generation across awaits and re-verifies the complete selection before publication. Concurrent preparations cannot publish an older frame. Tokens are branded by a private WeakMap. Every draw checks the caller's current generation; revocation is latched, clears private pixel buffers and releases GPU textures. The integrating caller must invalidate on account, source or authorization changes and supply a genuine current-scope guard. This is a component contract, not a substitute for server authorization.

JPEG/PNG originals are bounded to 16 MB; decoded images to 8192 per edge and 24 MP. Invalid, transparent, blank/near-uniform images fail closed to reference/2D handling. This screening can reject valid plain-color garment photographs and does not prove a garment exists. Crops copy source pixels and cap derived texture edges at 1024 with nearest sampling. Originals are never rewritten. Low-level same-origin application code remains trusted.

## Rendering limits

Original RGB pixels are projected, without relighting, onto front-facing garment panels. The source image may include background, occlusion and perspective; no automatic segmentation or human-reviewed mask accuracy is claimed. Source textures are not repeated onto unseen backs. Sleeves, side/back surfaces and uncovered areas use visibly hatched estimates. A front photo cannot establish back patterns, side seams, thickness, fabric drape, body measurements or physical fit.

The side-by-side synthetic comparison visibly improves contours and preserves the source stripe/logo colors. Manual review of front, back, layered coat and dress captures still shows stylized shoulders, simplified hands/feet and flat projected panels. Texture warping and synthetic seam transitions remain. Screenshot review is qualitative; no realistic fabric-fidelity score or segmentation score was measured.

Rendering is on demand, caps pixel ratio at 1.5 and each canvas edge at 900, bounds outfit slots to six, and disposes resources on replacement/revocation/context loss. Context loss displays the original-reference fallback. `preserveDrawingBuffer` supports QA pixel readback and needs device-specific performance review before production use.

## Verification

- Local build followed by full root Node suite: **291 pass, 0 fail, 0 skip**, including **17 new tests**. No acceptance criteria were relaxed.
- Initial exact-head CI `49e69e233564211849846e0d7c56e7f87d4e01f4`: run [40011002477](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40011002477), regression and browser jobs passed. Camera/indexing run 40011002360 also passed.
- Both Chromium and WebKit actually rendered WebGL at 320, 390 and 430 CSS pixels: six new viewport journeys, plus the unchanged saved-avatar baseline script. New journeys cover short sleeves, skirts, jackets, six-slot layering, dresses, 360-degree return, account/source revocation and context loss. No page errors, external requests or horizontal overflow were observed.
- Exact synthetic red RGB `(177,40,57)` appears in over 2,700 front pixels and zero back pixels in each configuration. All synthetic source-byte hashes remain unchanged across outfit changes. This demonstrates this fixture's pixel path, not general photo fidelity.
- Initial run: 23,160 mesh vertices, 741,120 vertex-buffer bytes, 1,179,648 RGBA texture-upload bytes for the initial three-item outfit. These are counted allocations, not measured total GPU/process memory.
- Initial software/emulated draw + `gl.finish` samples (60 per configuration): Chromium p95 0.3–0.4 ms; WebKit p95 8–12 ms. Cold page wall time and preparation timings are in the JSON report. These exclude physical device conditions and must not be presented as phone FPS or thermal/battery results.
- Artifact `12526906112`, `issue243-SYNTHETIC-COMPARISONS-NO-DEPLOY`, downloaded and SHA-256 checked: `f5707ce232b59d38c046562bf9103772c7d27044ffb23629ae0d52f1d53d0cf5`. Includes before/after, estimated-back, jacket, layered and dress captures plus browser-report.json. Final head CI is reported in the PR/issue after the context-loss fallback assertion runs.

No physical Android/iPhone testing occurred. No customer photos, external model inference, paid API, merge, deployment or cloud configuration change occurred.

## Commercially permissible local research options

Primary license sources reviewed 2026-10-23; no weights or third-party artwork downloaded:

| Option | Primary license evidence | Suitability and limits |
| --- | --- | --- |
| Current authored WebGL procedural meshes and native browser image decoding | Existing repository code plus new authored geometry; no imported person meshes or model weights | Zero API tokens; deterministic photo projection. Project distribution licensing still requires repository-owner review. |
| Depth Anything V2 **Small** | [Official README](https://github.com/DepthAnything/Depth-Anything-V2/blob/main/README.md): Small Apache-2.0; **Base/Large/Giant CC-BY-NC-4.0** | Small is a possible commercial-license candidate for local depth research. Larger noncommercial weights are excluded. Depth does not recover unseen garment textures or measured fit. Browser conversion, quality and phone latency remain untested. |
| SAM 2 / SAM 2.1 | [Official README](https://github.com/facebookresearch/sam2/blob/main/README.md): checkpoints, demo and training Apache-2.0; demo fonts SIL OFL 1.1; optional cc_torch has its own license | Candidate for local prompted mask research, not automatic clothing classification or verified fit. Tiny is 38.9M parameters: approximately 155.6 MB for FP32 parameters alone, an arithmetic lower bound excluding runtime/activations. Published A100 throughput is not phone evidence. Human-reviewed garment masks are required for accuracy claims. |
| Three.js | [Official license](https://threejs.org/license/), MIT | Optional future scene/glTF tooling. Not added as a dependency; does not solve photo isolation, cloth fidelity or asset licensing. |

Commercial permissions do not establish acceptable data provenance, privacy, patent clearance or model accuracy. Do not activate an API or add noncommercial body/cloth assets as a shortcut.

## Integration recommendation

Keep this as a separate 3D research draft; do not delay the 2D launch. Before customer integration: wire real authenticated authority/source-generation callbacks, extend the verified selection contract for reviewed crops and garment metadata, validate on licensed full-resolution garment photos with human-reviewed masks, measure intersections and texture distortion across representative poses, and collect actual Android/iPhone rotation/context-loss/memory/thermal evidence. Accurate virtual fitting and realistic fabric rendering remain unverified.
