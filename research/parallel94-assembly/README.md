# P94 — source-pinned native integration candidate (Family Alpha HOLD #255)

Parent at branch creation: `d1f11b1d5a30eb2d3a8f82c9fca3c48fa2dc24c1` (M4 PR #1210). This branch is independent, draft-only, no deploy.

## Strict source and consumer ledger

- **M1** PR #1175 HEAD `bec1ae8eba2a3979ec0581cb93a91b1ec3ad231c`; immutable P88 worker donor `cc4554ef0104506a72bf0a28423fee52b6e4fff2`, file blob `ab7d3837139c5b7d693383f9d6617e199ec8de4f` copied unchanged into `public/outfit-worker-p94.mjs`. The conservative P840 review component blob `6324d8eda33024f166311f424392ed83363e4942` copied unchanged into `public/outfit-instance-review-840.mjs`. `public/outfit-segmentation.mjs` blob `d357955dd8fdab7c0cb727ea597c270edd9309ac` is common to both. Actual SegFormer WASM region proposals, not independently proven garment count/identity. No background auto-save.
- **M2** PR #1177 HEAD `569a1b90780ab25651b6c9adf98cc1b078b501c0`, research source contract blob `9995203e9d83fbfc3e6222f771e750a47db15faf`. Does NOT grant wearer-specific photo-fit or 3D. Preserve main `research/main-thread-integration-1054/photographed-3d-evidence-gate15.mjs` `82b93d12d2fbcba146a190f5dce87a6ac5fc44af`, real 3D denied, exact-original 2D only.
- **M3** PR #1135 HEAD `4d9a28bba60c7f17f934848fc36d4bd478ffea55`, historical importer blob `2d9ad8a5309a2f2392bd35ccfd1b0b2ad0ce7491` cannot prevent shared-original IDs and unsafe backups (P93). **Not imported**. Retain main native guarded M3 importer `e739f1533108d53961483d761a27f0525623af3d` and exporter `e70fdc392c2652dc969b7d7c4b807f3cafd81e03`; authenticated owner original SHA/duplicate and atomic restore gates unchanged.
- **M4** current original `public/app.js` `835b4ad1f4a4a7f520aad5afd225134e5ea56e2d`, `public/outfit-board.js` `03c83b79e076ed3b7f67353cd3cd69f13529ccab`, ordinary worker `03f4f354f8ad28ed764bf2601d31b0577e6ca8f9`. All unchanged. Reviewed full photo, native wardrobe, saved outfit and backed-up 2D are reused, with no M4-owned consumer rewrite.

## Executable candidate and QA

For a **local** original repo source host only, open `/public/index.html?multi24=research&parallel94Assembly=research&captureProof01=after&index04=after&nativeLossless04=research&nativeIndex07=research&index02=after&restoreAtomic01=research&styleOwned03=research&nativeCorrection10=research&mission4Preview=research&reviewedPhotoGallery59=research`. P94 flag is accepted only from localhost or 127.0.0.1. Without the flag, all existing consumer and scratch donor paths are unchanged. The new public P88 worker preserves its original hash/mask claim protocol, and the existing owner/lease-correct research intake remains the sole adapter to review. All model suggestions require explicit owner verification. Nothing licenses 3D from a photo-unfitted surface.

`node scripts/build.mjs` then full Node and `M58_ENGINE=chromium|webkit P94_WIDTH=320|390|430 node scripts/test-parallel94-native-p88-browser.mjs` under Playwright 1.56.1 + source test dependencies. The browser test retains every inherited M58 genuine model inference, no-autosave, explicit *synthetic-owner* manual crop and private save, native outfit selection, verified full original-only 2D, v4 export, owner-/SHA-tampered import denial, atomic restore, A→B→A privacy and JPEG mutation/recovery assertion. Only worker URL, viewport and receipt location differ.

## Remaining gates — no false completion

1. No independent sealed-source subtype/color/instance/pair correctness. The manually cropped source test is not blind independent photo labelling; unresolved fragments must stay unsaved.
2. P88 source worker refuses source originals exceeding 3072px / 12M encoded. Do not resize or substitute a source without separate provenance; manual owner review remains.
3. No independently photo-fitted, human-approved dual-humanoid 3D drape. Continue exact-original 2D and explicit 3D veto.
4. No physical iPhone Safari / Android Chrome tests or authorized hosted two-account cloud RLS, only synthetic signed auth and private IndexedDB in CI.
5. Intermittent WebKit first-import preview reliability is owned by #1219. CI RED is not a release candidate. Family Alpha #255 HOLD remains open.

Conflict-aware handoff: inspect exact native worker and P840 donor blobs first, the one explicit research-mode intake route second, then actual browser/Node CI results. No change to main #1210 or other missions, no cherry-pick/merge/deploy.

## Additional distinct-original acceptance (no model-accuracy substitution)

The P94 job at width 390 for each engine additionally invokes unchanged M123 exact blob `b76ffa0625d421a36a1cf3bcc00d109e9cea42b9`. M123 itself executes real native Chromium/WebKit app at 320, 390 and 430 widths, using two **different** public original JPEGs `commons-0003` and `commons-0002` with human-gesture *synthetic* category labels. It verifies explicit owner PHOTO119 review, both real saved top/bottom outfit slots, v3 export/import, large-original owner display review, source-bound original 2D and no unverified 3D. This is complementary to M58 genuine WASM source inference through one tested original; they are separate acceptance phases, and M123's Worker deliberately uses a controlled fixture. Never cite M123 as independent model accuracy or a two-garment SegFormer success.

The exact existing M3 lossless-v4 acceptance harness blob `dfba236c7188dba96420af55b1feced251155e9e` also runs once in the pinned Playwright browser container. It covers six Chromium/WebKit×320/390/430 synthetic signed-owner runs with a saved source and separate pending source, durable original SHA/preview, rejection of foreign/tampered input, full v4 export, rollback, atomic restoration and revocation. Its JPEG images are synthetic fixtures, and it is not evidence of a second independently recognized garment from genuine P88.

## P94 full Node CI red investigation (2026-11-16)

At exact commit `cb35cc1ad157e0624c5c9b8dd5a7b71b893358fd`, native build and real P88 browser passed Chromium/WebKit at 320/390/430 (6/6), but the inherited full Node suite finished **2854/2856**, two structural test failures:

1. `tests/detector-manual-recovery-65.test.mjs` expects the original P88 transport to be the outer ternary of the guarded Worker constructor. P94's first adapter placed the local-P94 path outside that ternary. Fixed in isolated `research/multi-garment-capture-01/review-ui.mjs` by keeping the outer `p88Transport57` gate and moving `parallel94Native` into its true branch. **No Worker fallback, original-photo verification or source/owner lease is removed.**
2. `tests/main1054-m148-preview-click-ownership.test.mjs` matched the entire `public/outfit-board.js` and expected only one `const result=await viewer.refresh()`; original M4 subsequently added an independently scoped M59 photo-only viewer, so there are now two. Repaired the *test only*, requiring a unique strict M4 section marker and a unique M59 section marker, and extracting the actual M4 signed-owner completion region. Every prior stale-click/owner-change safety assertion remains intact. Protected `public/outfit-board.js` remains the identical main blob.

A dedicated exact-head CI preflight now executes both affected tests before the full suite, while the strict source-path allowlist permits only that test file in addition to the P94 already listed paths. Earlier red is historical; new runs must pass before claiming resolved. See push run `43975575529` for the original two failures.

## Conflict-aware M4 HEAD convergence, 2026-11-16

The independent main Mission 4 integration advanced from P94's immutable parent `d1f11b1...` to `003947f16f0122fee9a906c69f51b9e75c86fd78` and changed *only* its dedicated M58 workflow, M148 preview ownership test and RECOVERY65 worker-selection test. No protected M4 `public/app.js` or `public/outfit-board.js` source drift occurred.

Rather than keeping a competing test amendment, P94 now adopts **exact byte-identical current main** `tests/main1054-m148-preview-click-ownership.test.mjs` blob `182e135803cb2be354211969ddfb83382eb828e5` (includes two extra held-native-refresh behavioral cases) and `tests/detector-manual-recovery-65.test.mjs` blob `23e83af2cf40e37d640e6b302f1a6e0f751af673` (checks the isolated P94 branch directly), while retaining the previously tested P94 native selector `research/multi-garment-capture-01/review-ui.mjs` blob `77471549396d89336dc9e5ec8ea92a322b5ffa93`. This is a narrow explicit source selection inside P94 only; no merge, cherry-pick, deployment or write to the M4 branch. The test path allowlist adds only those two scoped existing test files. Strict Node and WebKit/Chromium must rerun at the new P94 exact HEAD; previous pass results do not certify this convergence.
