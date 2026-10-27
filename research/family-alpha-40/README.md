# Work 40 — still-camera research prototype / HOLD

Independent local prototype only, based on #341 source `38cb6a0c10242558052d18503a9f28b1ddc56c60` and unchanged #340 importer `c093dff392a6c1021f7cc072a37f6e106992c1e0`. No app, auth, storage, recommendation, fitting or clipping files are changed. Run a local static server from the repository root and open `/research/family-alpha-40/`. This is not a deployment artifact. No wardrobe save or indexing happens in this prototype.

## Acquisition and privacy

`ImageCapture.takePhoto()` may provide a still Blob from an active track, but the returned resolution and device/browser support vary. This prototype never asserts sensor resolution, invokes no enlargement, and reports decoded output dimensions. It passes every still or chosen camera/gallery File to #340's unchanged `photoToJPEG`: suitably bounded JPEG with strictly permitted marker framing is preserved byte-for-byte; Exif, GPS, XMP, unknown APP/comments, unsupported formats and other uncertain cases take a 4096px-or-less canvas conversion to remove metadata. Large images can be further reduced to meet storage bounds. This is a privacy-first **derived JPEG** when source carries metadata, not a promise to preserve original bytes. The raw still is not returned to consumers or persisted. Fallback to the existing <=2048px video-frame JPEG occurs if still capture is unsupported, denied, invalid or conversion fails. No specific camera capability or still-quality advantage is guaranteed.

Native `accept=image/*` / `capture=environment` input requests a device camera interface, but the user agent controls the resulting source and format. Gallery import uses the same privacy converter. Existing app continuous timing is untouched; this independent prototype supports selectable 3, 5 or 10 second cadence and serial capture. It holds only the latest successful privacy-processed preview in memory. Failed retakes preserve the prior preview, which disappears when the page closes; it does not promise persistent recoverability. Page/session cancellation stops camera tracks and rejects stale async results. There is no physical phone or camera hardware verification.

Sources: [MDN ImageCapture.takePhoto](https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture/takePhoto), [MDN capture attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture). Capability checks and real-device evidence are necessary.

## Comparison and test boundaries

Node tests: `node --test tests/research40/*.test.mjs tests/photo-source-preservation.test.cjs tests/capture.test.cjs` — **20 pass**. New tests use a mock ImageCapture source to verify conversion before return, exception/unsupported fallback, rejection of late session results and concurrent capture. Existing tests exercise #340 metadata safety and unchanged app capture, not this prototype's integration.

The no-deploy browser test constructs a synthetic 3000×2000 photo and injects an EXIF/GPS marker; it passes the fake still through real #340 importer and compares with a 2048-wide canvas video-frame simulation. It also tests a licensed photo import, corrupt input preserving the previous preview, and mobile layout in Chromium/WebKit 320/390/430. This is a synthetic resolution comparison, not a real sensor measurement, fabric fidelity study or validated device result. Actual exact-head CI outcome is reported separately. The 3000×2000 source RGBA canvas alone occupies approximately 24 MB, while its 2048×1365 simulation occupies approximately 11.2 MB; these are pixel-buffer estimates, not peak or measured browser memory. File sizes, native source dimensions, orientation, color fidelity, actual sharpness and camera hardware need physical-phone measurements.

## Required before integration

- Validate actual ImageCapture still dimensions, quality, availability and permissions on representative Samsung/Android browsers and iPhone Safari; also test native camera input, orientation and HEIC handling. Never infer support from a simulated Blob.
- Compare identical real garments with video frame, still and phone import at native output sizes; inspect fabric/edges, compare file sizes, log decoded dimensions and actual memory, and distinguish metadata-sanitized derivatives from source bytes.
- Integrate explicitly with Work #341 advisory review, original-photo recognition, existing single/continuous timing, user account/session guards and atomic storage; run full save/retry, duplicate, account-change and three-outfit regression. The prototype is not wired into those systems.
- Verify camera permission denial, unexpected interruptions, cancellation, timed mode and retention of previous photo on physical phones. Test output rotation and embedded metadata with actual camera files. Use only approved test garments.

Do not merge or deploy. No staging, provider configuration, paid service, family/customer photo, Work #37/#38 modification or Drive Duel work. Family Alpha remains HOLD.
