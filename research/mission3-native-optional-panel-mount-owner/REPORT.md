# Mission 3 — pin native research panel mounts to original private owner

**Family Alpha HOLD #255 remains OPEN.** Isolated research branch stacked on fully green [PR #1083](https://github.com/nickhaney916-lang/Closet-Current/pull/1083), parent HEAD `eb64c0248fa74281f7b04052d5b7a2d0cfcc4fc4`. No merges, live Supabase/Storage/Auth, production or staging, genuine private photographs or physical phones.

## Source-verified risk

`public/outfit-board.js` initializes research-only native BOARD04 and, when URL research flags are set, **asynchronously imports/mounts** four optional UI panels: `native3D05`, `sourceReadiness08`, `styleOwned03` and `nativeMobile09`.

Prior PR #1083 bound BOARD04 controller `onChange` and `onStatus` callbacks to an exact signed owner and controller. **But optional mounts then assigned `window.native3D05Bridge`, `nativePhotoReadiness08Bridge`, `styleOwnedLive03Bridge` and `nativeMobile09Bridge` after awaits without rechecking the same owner and controller**. A panel created under the former login could finish after sign-out/relogin (including the same user ID), be published as a global bridge, and retain event handlers/owner-private previews. Optional module-mount errors also displayed generic status without checking whether their initiating account remained signed in.

Another gap: the session-lock handler cleared the visible BOARD04 garment DOM but did not revoke/dispose the four optional research bridges and `nativeLossless04Bridge`, potentially leaving former-owner event listeners and references.

This is a **source-observed privacy/correctness risk**, not a known security incident.

## Engineering change

- New `publishNative04OwnerPanel(callbacks,consumer,panel,bridgeName)` admits a panel only if the original `callbacks.current()` owner/session lease is still true, the exact initiating `nativeLossless04` consumer matches, and its `status().active` remains true. An obsolete panel is **disposed rather than published**, with disposal errors safely suppressed.
- Each optional async import verifies the owner/session before and after import, and the result of `mount` is verified by the same publication gate before entering a `window.*Bridge` global. All panels receive the originally captured consumer; failures only display status for that still-signed owner.
- The authoritative `closet:session-locked` handler clears saved-outfit preview state, nulls all five native global bridge references, and disposes their old controller/panels. Prior session-bound controller callbacks remain silent.
- The underlying source-original JPEG/custody records, wardrobe transaction CAS, Auth generation checks, cloud backup, source signatures, owner reviews, 2D fallback, fabric/geometry/collision logic and three mission branches remain unchanged.

## Reproducibility

- `tests/mission3-native-optional-panel-mount-owner.test.cjs`: source-executed regression for all four research panels; allowed mounts, owner switches, same-account re-login, revocation, DB handle/name mismatch, wrong epoch, detached/replaced controller, failing dispose, complete session-lock teardown and original code structure.
- `scripts/test-mission3-native-optional-panel-mount-owner-browser.mjs`: **102 planned** real Chromium/WebKit *synthetic* browser source scenarios across 17 modes × two engines × 320/390/430 CSS mobile viewport widths. These **do not** certify physical Android/iPhone or hosted Supabase.
- `.github/workflows/mission3-native-optional-panel-mount-owner-no-deploy.yml`: strict pinned-parent **five-file** gate including new source, synthetic browser, inherited full serial Node, native original photographed garment→owner private wardrobe→outfit browser integration, signed disposable two-owner PostgreSQL/Storage RLS and browser JSON receipts.

**Require fully green exact-head CI, including browser evidence, before claiming this milestone validated.** It does not establish genuine owner-photograph recognition, photographic 3D reconstruction, physical device acceptance, or authorized live cloud test results.

## Outstanding launch prerequisites

Physical Android Chrome and iPhone Safari acceptance, approved two-owner hosted Auth/RLS/Storage backup/restore, independent real-photograph clothing recognition quality, Mission 2 actual source-photo garment geometry and drape, cross-mission conflict-aware integration, explicit owner acceptance. Family Alpha HOLD #255 stays OPEN.
