# MOBILE-CAMERA-LIFECYCLE-69 research report

## Scope and baseline

This isolated research branch starts at Priority #68 commit `143ff1294cabd531b8eb6ad23b5a2c9f62b3dc9a`. It does not modify production or staging. The inherited #68 evidence reports 724/724 Node tests and 12/12 browser scenarios, including Chromium and WebKit at 320, 390, and 430 CSS pixels; this priority adds a focused file-handoff test and preserves the earlier camera/session protections.

## Architecture audit and changes

- `public/app.js` owns the live `getUserMedia` preview, permission response, stream teardown on page visibility/pagehide, request generations for stale camera responses, camera-file import, manual review, and private save flow.
- `public/photo-import.js` validates import type and size before creating the staged import.
- `research/capture-proof-01/source-proof.mjs` binds JPEG bytes to SHA-256, parses JPEG EXIF orientation, identifies source/import type, and prevents a changed source from being accepted as the same photo.
- Crop review and owner-private records are handled by the existing proof-mode review and wardrobe persistence path. The #68 unsaved-photo replacement guard remains in place.
- New single-item camera handoff is opt-in behind `?captureProof01=after&mobileCamera69=after`. The file input requests `capture="environment"`, but native camera launch, lens selection, picker cancellation UI, and any OS-controlled photo-library write are outside browser control.
- Empty/unknown MIME imports now use a supported filename extension as a fallback. Byte signatures are checked for JPEG, PNG, WebP, AVIF, and HEIF-family containers; a contradictory JPEG MIME is corrected from bytes rather than trusted.
- The handoff clears the input value after selection so the same file can be selected again. An empty/cancelled selection does not replace the current reviewed photograph. Import timing and browser memory readings are opt-in, contain no image data, and are reported only where Chromium exposes `performance.memory`.

## Source identity and limits

The browser acceptance fixture is Wikimedia Commons `File:Rood t-shirt, merk Diesel, maat M, objectnr 86503.JPG`, credited to Diesel, source page https://commons.wikimedia.org/wiki/File:Rood_t-shirt,_merk_Diesel,_maat_M,_objectnr_86503.JPG, under CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0). The checked-in original `benchmark/fixtures/commons-0002.jpg` has SHA-256 `fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667`. The browser test selects the original fixture bytes and checks the resulting source identity, original-photo binding, and that the item remains unconfirmed pending human category/subtype/color review. This is a real file-input interaction in Playwright, not an OS camera capture.

JPEG bytes are retained unchanged as canonical source. For non-JPEG inputs, the existing path decodes and makes a JPEG representation; the original non-JPEG bytes are not retained in the closet record. New byte sniffing identifies HEIC/HEIF container signatures, but does not add a HEIC decoder. Whether Safari can decode a given HEIC file depends on browser/OS version. If decode fails, the existing import rejects it without saving; a user can export/select JPEG or PNG. Exact original-byte preservation for HEIC/other non-JPEG is therefore not claimed. The existing 10 MB import / 12 MB proof-capture and 80 MP limits remain in force.

EXIF orientation metadata is recognized in the existing JPEG source path and original bytes are not rewritten merely to rotate the preview. This run did not execute a physical-device capture or a complete matrix of rotated/front-camera/large-image fixtures. A malformed or unsupported image fails before save; HEIC/raw-byte parity and full EXIF-device coverage remain open.

## Validation evidence

Focused tests passed: 38/38 across photo import, capture proof, camera behavior, and #68 photo-switch guard. The complete Node regression suite and build passed after changes: **725/725 tests**.

New real-page Chromium run passed at 320, 390, and 430 CSS pixels. It exercised permission-denied recovery, the app's mocked `getUserMedia`, actual file-input handoff, preview/review, crop adjustment, manually confirmed save, source tamper rejection, stream stop on interruption, pending-hash logout cleanup, outfit photo handoff, and private-index clearing on logout. Worker responses and camera media devices are controlled test doubles; recognition accuracy is not evaluated here. The new native-picker cancellation case dispatches the web `cancel` event and checks state preservation; it does not exercise an actual OS picker.

Eleven screenshots per width were generated in `benchmark/capture-proof-01/` (33 total); the handoff screen was visually self-reviewed at 320, 390, and 430 widths. Review found no horizontal overflow in the displayed states; this is implementer visual review, not independent human acceptance. Exact screenshot evidence: `chromium-{320,390,430}-11-device-camera-handoff.png`.

Measured file-handoff import timings across the final Chromium run for the 690,240-byte fixture were 158 ms at 320px, 164 ms at 390px, and 346 ms at 430px. Chromium's exposed JS heap reading was 19.3 MB before and after each import. These measurements are browser-runner observations, not physical-device performance results; `performance.memory` is Chromium-specific and does not represent total process memory.

WebKit could not launch in this execution container because system WebKit dependencies are absent (GTK/GStreamer/Graphene/AVIF libraries). The inherited #68 WebKit evidence remains applicable only to the exact #68 commit and cannot be attributed to these new changes. Physical Android Chrome and iPhone Safari were unavailable. No physical-device camera permission, native handoff, OS gallery behavior, actual HEIC decode, phone memory, or device performance result is claimed.

## Defect register and disposition

| Defect / uncertainty | Action | Status |
|---|---|---|
| No single-garment native file handoff beside live camera | Added opt-in file input with rear-camera capture hint | Implemented; actual OS handoff needs devices |
| MIME-less supported file with extension rejected due escaped regex | Corrected extension validation and regression test | Fixed |
| MIME declaration could disagree with file bytes | Added byte signature sniffing for supported containers | Fixed for identified signatures |
| Cancel/reselect could leave input unchanged and block same file | Reset input value; empty selection is a no-op | Implemented; browser cancel event only |
| HEIC support varies and original HEIC bytes are not retained | Detect container; decode failure remains safe/recoverable; disclose conversion | Open limitation |
| Stale async work/session loss | Existing request/source guards and logout cleanup retained and browser-regressed | Covered in browser simulation; device check pending |
| Browser cannot control native camera app's gallery behavior | Documented as OS behavior outside app guarantees | Limitation |
| WebKit new-code acceptance | CI workflow will run on pinned Playwright container | Pending CI |
| Android/iPhone hardware, real camera, performance/memory | Requires devices | Not performed |

## Verdict

Engineering: **NEEDS CI** (local tests pass; exact final-HEAD GitHub Actions run is pending) with the HEIC original-byte limitation documented. Chromium mobile-viewport browser workflow: **PASS for tested browser interactions**. WebKit changes: **NOT VERIFIED in this environment**. Physical Android/iPhone: **NOT PERFORMED**. Recognition accuracy: outside this priority and not measured. Family Alpha remains HOLD.
