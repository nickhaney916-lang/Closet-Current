# MOBILE-CAMERA-TO-CLOSET-INTEGRATION-75

**Status: exact-head engineering and browser CI PASS; physical-device and signed-cloud acceptance remain blocked.** This is a research-only integration, based on Priority #74's exact commit `f51d4f82c456a2e1442417a8330f024b14d6c344`. It does not alter staging, production, authentication secrets, Family Alpha issue #255, or either separate project.

## Cross-branch compatibility

Priority #69 PR #626 is based on Priority #68 commit `143ff1294cabd531b8eb6ad23b5a2c9f62b3dc9a`; it is not a descendant of the Priority #74 baseline. Whole-branch merge/cherry-pick is unsafe. Diff review found the older replacement of `research/multi-garment-capture-01/review-ui.mjs` removes the current validated-before-replacement flow, same-original preservation, stale selection epoch, and cancel-review-consent logic. It is intentionally not adopted.

| PR #626 change | Decision | Integration detail |
|---|---|---|
| Single-photo mobile camera file input and rear-camera hint | Adapted | Added `Take a photo now`, `accept="image/*"`, and `capture="environment"`, isolated behind `cameraCloset75=after` research flag; ordinary saved-photo selection remains available. |
| MIME-less media support | Adapted | File extensions permit selection, but the proof importer validates byte signatures and successfully decodes before accepting. |
| Source JPEG SHA and exact-byte retention | Adapted | Existing CAPTURE-PROOF code is extended with signature-first validation; valid JPEG bytes remain unchanged and are checked against canonical SHA-256. |
| PR #626 full review UI replacement | Rejected | It is older than Priority #74 and deletes later safeguards. Priority #74 review source remains intact. |
| Camera telemetry and #69 screenshot artifacts | Superseded | New focused browser runner records only test outcomes and evidence hashes; no garment content, account identifiers, or runtime telemetry is added. |
| Older CI baseline and changed-path allowlist | Superseded | Dedicated workflow is pinned to Priority #74 exact SHA and to this integration's explicit file allowlist. |

## Implemented behavior

- The opt-in camera file handoff enters the same review batch as saved photos. Canceling the native file picker dispatches no replacement and is a no-op; duplicate import submission is blocked by the existing busy guard.
- A valid JPEG retains its original byte sequence. The source SHA is calculated from those bytes before decoding, and original bytes are only passed into existing original-photo review/recognition flow after successful decode.
- MIME-less JPEG/PNG/GIF/WebP/AVIF/HEIC/HEIF files are recognized from their signatures. Declared MIME contradicting the signature, unknown signatures, unsupported containers, oversized files, and undecodable bytes are rejected. HEIC/HEIF is not promised as supported; a device/browser decoder must actually decode the file for that import to pass.
- The mobile browser test corrects one real, licensed original photo as a T-shirt / Tops / Blue through the existing human adjustment dialog, verifies an owner-scoped IndexedDB write, and checks the stored original's hash. The app's existing independent confirmation/save gates remain authoritative; this test does not count the human edit as AI recognition accuracy.
- Existing Priority #68–#74 modules, tests, and their strict workflows are retained without edits. The broader inherited suite covers photo-switch consent, source validation before replacement, selection races, same-source review, partial saves, Cancel extraction consent, duplicate protection, private indexes, and session cleanup.

## Browser evidence design and limits

`scripts/test-camera-to-closet-75-browser.mjs` uses the actual page, file input, image decoding, canvas, WebCrypto, and browser IndexedDB, with an openly disclosed simulated `getUserMedia` camera, authentication fixture, and recognition/outfit workers. Its test image is Wikimedia Commons `commons-0002.jpg`, CC BY-SA 3.0, attribution and origin in `benchmark/locked-photo-sources.json`, SHA-256 `fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667`.

The runner is configured for Chromium and WebKit at 320, 390, and 430 CSS pixels. It audits every produced PNG's width, height, nonblank entropy, byte count, and SHA-256 into `benchmark/camera-to-closet-75/screenshots-manifest.json` (72 screens for 12 workflow points per engine/width). Native OS picker UI, camera hardware/permission prompts, genuine signed authentication/cloud backup, and physical Android/iPhone devices are not simulated as real acceptance. Family Alpha must remain HOLD until physical and signed-owner acceptance are independently completed.

## Verification record

- Local build: passed.
- Local full Node suite: **764/764 passed** (761 inherited, plus three new source-validation cases).
- Local Chromium/WebKit run: unavailable because this runtime lacks `libgstreamer-1.0`, `libgtk-4`, `libgraphene`, and other Playwright system libraries. The dedicated CI workflow runs in a pinned Playwright container; the exact-head dedicated workflow below succeeded and published the screenshot/results artifact.
- Physical Android/iPhone test: not performed; outstanding acceptance blocker.
- Authentication mode in browser script: simulated local test owner. No real customer account or private wardrobe photo was used.
- Production deployed / existing staging changed / Family Alpha status changed: **No / No / No**.

## Final delivery

- Final HEAD: `e17a628fa74883b70ac9043d258f5889d7353631` (direct child of the exact Priority #74 SHA).
- Draft PR: https://github.com/nickhaney916-lang/Closet-Current/pull/632
- Exact-head no-deploy run: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42097613460 — **success**; changed-file scope, build, 764 Node tests, Chromium/WebKit mobile flows, source/screenshot assertions, and artifact upload all passed.
- Evidence artifact: `MOBILE-CAMERA-TO-CLOSET-INTEGRATION-75-NO-DEPLOY-HOLD` (72 PNGs plus results and screenshot manifest; SHA-256 `a15e0c883d1d6449b1768c48265101cc11745a039e3fe203ce7c5f69022f2583`).
- Browser matrix: Chromium and WebKit at 320, 390, and 430 px; 6/6 cases; 72/72 screenshots recorded and audited. The CI browser uses a simulated camera stream/auth/recognition workers and real browser file input, image decoding, canvas, WebCrypto, and IndexedDB.
- Source JPEG: Wikimedia Commons `commons-0002.jpg`, verified SHA-256 `fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667`; attribution/license are in the locked source manifest. Manual T-shirt/Tops/Blue correction was saved to synthetic owner-scoped IndexedDB; it is not a model accuracy result.
- Physical Android/iPhone camera, OS picker/permission prompts, HEIC-on-device, real signed auth/cloud backup/restore, and OS gallery side effects were **not tested**. HEIC/HEIF is only accepted when the platform decoder succeeds; browser/hardware compatibility remains unknown.
- Engineering/browser verdict: PASS for this opt-in research path and the included inherited tests. Physical device and signed cloud verdicts: NOT PERFORMED. Universal recognition: not measured. Family Alpha: HOLD. No production/staging change, merge, or deployment.

Other pre-existing per-priority workflows triggered by the shared-file PR failed at their stricter changed-file-scope guard; the dedicated #75 workflow independently ran the complete Node suite and the inherited #74 browser flows successfully. No code from #70–#74 was deleted or weakened. Do not merge, deploy, or target production.
