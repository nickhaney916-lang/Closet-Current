# Parallel Mission 90 — interactive native viewer

DRAFT / NO MERGE / NO DEPLOY. Family Alpha #255 OPEN/HOLD.

## Source and compatibility

Immutable integration parent: M34 `050a39b8fa1e6ee8084bed23855d90e2879609d7` (PR #1170). No cherry-picking or silent combination with Mission #88/#89. Viewer dependency remains PR541 `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`, prepared in a disposable detached worktree. The installer strictly checks that HEAD and unique source anchors; it edits only the donor panel and camera module. No original JPEG, GLB, skin weights, skeleton, source garment geometry, UVs, collision threshold, auth, cloud or default public app changes.

## Implementation

- Native original-owner/source admission remains authoritative: original JPEG digest before/after renderer loading, saved slots, original auth reference, wardrobe revision, current selection, hidden/frozen tab and revocation checks.
- Existing true camera-space OrbitControls drag and 360-degree turntable retained. Added accessible 15-degree left/right, zoom in/out and reset buttons (44px minimum), keyboard arrows/plus/minus/Home, canvas focus and instructions. Orbit elevation is horizontal; direct manipulation stops spin.
- Aspect-dependent camera framing accommodates narrow viewports; reset stops automatic spin. Camera metrics and resource counts are read-only and carry no private photo bytes.
- WebGL context loss closes the native preview and retains the native original-photo board and authenticated editor. Explicit reopening rechecks JPEG bytes and creates a fresh renderer. Synthetic context-loss event is distinct from hardware GPU failure.
- The installer must be run by the isolated research host; merely opening the public app does not install a patched donor. Existing `nativeLossless04=research&native3D05=research` gates remain required. This is opt-in native consumer wiring, not default enablement.

## Reproduce

Install dependencies and prepare the pinned donor exactly as `.github/workflows/parallel90-viewer-no-deploy.yml`. Then:

```
node scripts/install-parallel90-viewer.mjs
P90=1 node scripts/test-native-3d-05-browser.mjs
P90=1 P90_ENGINE=webkit node scripts/test-native-3d-05-browser.mjs
```

The interaction harness checks both real 163-bone rigs at 320/390/430 CSS pixels, actual button/keyboard/pointer camera changes, bounded zoom, 16 repeated camera commands without texture/geometry growth, context-loss cleanup and explicit reopen. Existing inherited harness checks saved source dress plus honest photo-only unsupported pieces, original board preservation, independent synthetic-owner privacy and closed-preview fallback. P90 receipts are engine-specific; the inherited WebKit evidence uses a separate `benchmark/native-3d-05-webkit` directory and engine-specific screenshot names.

## Evidence at initial publication

- Native app build PASS.
- Focused inherited native Node: 102/102 PASS.
- New installer/source-scope/lifecycle wiring checks: 3/3 PASS. These are structural safeguards, not browser acceptance.
- Full inherited Node suite: **2,669/2,669 PASS**, zero failures/skips (124.7 seconds).
- Initial Chromium 320px run: **FAIL** awaiting 3D-ready state after 150 seconds; zero recorded script errors/crashes. Cause found and corrected: detached dialog button lookup used document before insertion. Corrected Chromium **390px PASS**: both real rigs, keyboard/button/pointer camera changes, zoom/reset, 16 camera operations each without geometry/texture-count growth, simulated context loss, explicit source re-attestation/reopen, original board unchanged and synthetic-owner isolation. Genuine screenshot visually inspected. Three-width regression run pending.
- Local WebKit launch BLOCKED: missing GTK4/Graphene/WOFF/Harfbuzz/Hyphen/Manette/GLES shared libraries; automated dependency installation lacks root access. CI installs browser dependencies on Ubuntu.
- Initial head `4a707b868a20fb27bbf62621a6a7c23090c3d4df`, draft PR #1178. Dedicated no-deploy run https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43625644240 is in progress; no green acceptance claimed. Do not infer green status from workflow creation.

## Remaining blockers and handoff to #1054 / #89 / #88

Mission is NOT complete. No continuous cloth collision proof, independent photographic fidelity review, reconstructed rear texture, arbitrary owner-photo or complete multilayer 3D acceptance. Known public source research meshes retain their existing fidelity limitations; generic geometry is not newly claimed as reconstructed. Mission #89 must supply admitted genuine geometry/fidelity receipts; #88 retains recognition ownership. Master #1054 controls integration and roster/session admission.

Physical Android/iPhone, landscape, real touch drag, hardware GPU loss, FPS/device memory, actual signed hosted accounts and 1/4/16 genuine outfit swaps: NOT TESTED. Camera repetition is not outfit switching. Mouse pointer drag at mobile viewport is not physical finger evidence. Camera action round-trip includes an intentional 350ms settling interval and is not FPS/render time. Existing renderer load/render metrics are software-browser observations only. No before/after performance improvement claim without a paired baseline.

No merge/deploy, private wardrobe/photo access, hosted Supabase changes, paid APIs or modification of concurrent branches. #255 remains OPEN/HOLD.
