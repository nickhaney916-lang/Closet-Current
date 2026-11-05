# MOBILE-CAMERA-TO-CLOSET-INTEGRATION-75

**Status: PENDING CI; physical-device acceptance blocked.** This is a research-only integration, based on Priority #74's exact commit `f51d4f82c456a2e1442417a8330f024b14d6c344`. It does not alter staging, production, authentication secrets, Family Alpha issue #255, or either separate project.

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
- Local Chromium/WebKit run: unavailable because this runtime lacks `libgstreamer-1.0`, `libgtk-4`, `libgraphene`, and other Playwright system libraries. The dedicated CI workflow runs in a pinned Playwright container; do not call browser acceptance passed until that exact-head workflow succeeds and publishes artifacts.
- Physical Android/iPhone test: not performed; outstanding acceptance blocker.
- Authentication mode in browser script: simulated local test owner. No real customer account or private wardrobe photo was used.
- Production deployed / existing staging changed / Family Alpha status changed: **No / No / No**.

## Final delivery

Final SHA, draft PR URL, exact-head workflow URL, uploaded evidence artifact, final regression totals, and final acceptance status are added here after the CI result is available. Do not merge, deploy, or target production.
