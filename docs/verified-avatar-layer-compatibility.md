# Verified outfit to humanoid integration matrix (research only)

## Current evidence
- Draft PR #245 maps a previously verified `selected[]` and RGBA `colors` payload to the procedural renderer color contract; Node CI run #40010091016 passed.
- PR #231 verifies source identity/version, selected item IDs and owner scope through a caller-supplied verifier. **That callback must be backed by authenticated storage in live code**; client-supplied owner fields are insufficient.
- PR #232 is a separate avatar research branch. Its `bridgeSavedOutfit` validates image headers and derives a noncryptographic FNV signature, **not** the same SHA-256 original-source verification and authenticated ownership contract as PR #231. Do not substitute one for the other.

## Slot compatibility
| Slot | Verified board bridge (#231) | Research humanoid (#232) | Integration decision |
| --- | --- | --- | --- |
| top | Tops or Dresses | Tops or Dresses | Dress top maps to renderer `dress` only after verified source |
| bottom | Bottoms | Bottoms | Preserve for non-dress outfits |
| shoes | Shoes | Shoes | Preserve |
| layer | Outerwear | Tops/Cardigan/Vest or Outerwear | Keep stricter verified category; reject unsupported garment rather than silently relabel |
| layer2 | Not supported in current verified board bridge | Outerwear jacket/blazer/raincoat/coat | HOLD until original-photo + account verification covers this slot |
| layer3 | Not supported in current verified board bridge | Outerwear coat/raincoat | HOLD until original-photo + account verification covers this slot |

The color contract recognizes layer2/layer3 **only if they appear in a verified selection**; current #231 does not produce such a selection. Never fabricate source verification for additional layers.

## Release blockers
1. Authenticated owner-scoped storage must supply and recheck every garment ownership decision on account switch.
2. Preserve normalized original JPEG source identity/version; do not equate a crop, noncryptographic FNV value or editable ownerId with source provenance.
3. Combine verified selection and renderer in an isolated integration fixture, with dress/layer, swap, source-change and account-switch regressions. Keep 2D fallback.
4. Test WebGL context loss, browser support, rotation and physical-phone memory/performance; current Node CI does not cover these.
5. Do not claim fabric textures, exact patterns, fit, side/back authenticity or photo-realism from procedural solid colors.

No customer images, paid AI, production deployment or backend mutations were used for this audit.


## Browser integration acceptance gate (not yet executed)

The #245 adapter and #232 renderer live on different draft branches. A browser result is only meaningful after a **temporary, isolated test branch** combines #231's verified board, #245's adapter, and #232's actual WebGL renderer without merging or deploying them. Preserve their provenance and do not substitute #232's demo ownership checks for #231's authenticated ownership contract.

Use a synthetic wardrobe only and run these acceptance cases in **Chromium and WebKit**, recording the browser version, device/emulation, WebGL availability, and actual observed result for each:

1. Initialize `createDetailedHumanoid3D(canvas)`; if `supported:false`, confirm 2D fallback stays visible.
2. Verify a top/bottom/shoes outfit using #231's original-source verifier, then call `applyVerifiedHumanoidOutfit`. Confirm expected renderer `getState().layers`, a successful `render()`, and that rotating by 90/180/360 degrees produces visible geometry. Do not infer visual correctness solely from a successful return value.
3. Swap the top, then replace the outfit with a verified dress. Confirm old top/bottom/outerwear layers are absent and no stale garment remains in the drawn result.
4. Call `clearVerifiedHumanoidOutfit` immediately on synthetic sign-out; verify all clothing layers disappear **before** a new account's asynchronous verification completes.
5. Simulate WebGL context loss, disposal, and thrown renderer operations. Confirm the application visibly presents its existing 2D fallback rather than a blank frame or uncaught error.
6. Invalidate original-photo source identity/version or reject ownership; confirm no unverified outfit is applied.
7. Test narrow mobile viewports and physical phones where available; record startup latency, frame time during rotation, GPU/JS memory where measurable, and any browser crashes. Do not invent measurements.
8. Capture front/side/back screenshots using synthetic garments; mark non-original rear and side surfaces as estimates. Solid-color meshes are **not** photographic pattern preservation.

**Pass gate:** zero account crossover, no stale clothing on sign-out, correct dress/layer behavior, usable 2D fallback, no uncaught errors, and explicitly recorded browser observations. **Hold gate:** unsupported layer2/layer3 selections, missing authenticated ownership verifier, missing WebGL browser evidence, and claims of realistic fit/patterns without actual garment textures.

CI success for Node adapter tests does **not** satisfy this browser gate. This document is a reproducible validation specification, not a claim that Chromium, WebKit, or physical-phone testing has been performed.
