# Closet Current — reliable blank-MIME mobile garment imports

**20 October 2026 — isolated customer camera/import PR stacked on verified #86.**

## Customer-facing defect fixed

Some real phone and cross-device shared-image files have an **empty media MIME type**. Previously `readPhotoBatch` had an incorrectly escaped filename-extension regular expression; for an untyped `garment.JPG`, `.PNG` or `.HEIC` it could reject the photo immediately as **not an image** before asking the browser decoder. The app could import ordinary `image/jpeg` photos in the same batch, making the failure appear intermittent. That particularly affects the customer flow for imported HEIC from phones or transferred images with blank `File.type`.

The new check treats files as potential photos when:
- The MIME starts with `image/`, or
- The MIME is missing or is `application/octet-stream` **and** the name has a recognized case-insensitive `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.heic` or `.heif` suffix.

An explicitly contrary type (for example `text/html` in `fake.jpg`) is rejected. Even an accepted suffix is only a **candidate**: the browser must decode it into a real image before it enters the closet. Unsupported HEIC or corrupt files still show the existing actionable `could not open; try JPEG or PNG` message instead of silently creating a clothing record. No bypass for camera/account permissions, unsafe MIME, foreign garment ID, or cloud writes.

## Decoder recovery

`photoToJPEG` now bounds each underlying `HTMLImageElement.decode()` operation to 15 seconds. When decoding hangs (a damaged image or unsupported mobile codec), the object URL is released and that individual input is marked failed; **later photographs in the same batch continue**. An unavailable canvas also gives a controlled error instead of throwing an inscrutable `null` method exception.

## Original/photo quality evidence and limitations

This change does **not** mask or clip an image before recognition. All accepted input files still go through the same browser decode and JPEG re-encoding, then through existing original-RGB classification and the validated source/photo state machine.

**Known remaining image fidelity issue:** the current source conversion and high-resolution still camera capture limit each longest image dimension to 2048 pixels. The underlying 12MP capture cannot be said to be retained at true original/native resolution merely because it precedes masking. A future dedicated quality branch should evaluate raising this bound or storing original source bytes without exhausting client IndexedDB/cloud quotas or losing EXIF orientation. No untested increase or claim of physical-original fidelity is made here.

## Technical tests

- Node tests exercise `File.type==''`, octet-stream, uppercase known suffixes, opposite MIME types, unsupported HEIC, duplicate suppression, partial batch successes, a truly never-resolving decoder, guaranteed object-URL cleanup, and bounded native JPEG output.
- Playwright Chromium and WebKit at a 390px mobile viewport create actual 640×480 blue-fabric source JPEG/PNG images; import with **empty MIME** and `application/octet-stream` respectively; the browser genuinely decodes/re-encodes both before any segmentation. In the same batch, an unsupported fake HEIC is a recoverable **error** rather than a false type rejection, and a disguised text file is rejected. The on-device browser keeps all resulting data; no remote requests.
- Full app Node/CI original high-resolution outfit-crop source and duplicate provenance regressions plus blocked pilot/paid inference release gates run unchanged.

These tests simulate browser engines; no real HEIC hardware decoder, true physical phone, full JPEG EXIF orientation, human mask approval, paid provider, or deployed customer environment is validated. The separate account/auth Work branch is not modified. No user images sent to public CI.
