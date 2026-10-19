# Closet Current — physical-phone pilot acceptance checklist

**Development checkpoint October 19, 2026.** This checklist is for a real person on a real Android device and a second person on a real iPhone. A desktop Chromium/WebKit simulation does **not** pass it. No hosted deployment, live AI try-on or billable service has been authorized.

## What the automated pilot test now covers

[Cross-engine original-photo benchmark](../scripts/run-phone-photo-check.mjs) on the combined PR #26 code line:
- Downloads **only two licensed locked original fixture photos** with SHA-256 checks before uploading them to the **local browser test** file input: a T-shirt (`commons-0001`) and a non-clothing control (`commons-0090`).
- Runs the actual client-side FashionCLIP classifier in Chromium and iPhone-style WebKit independently, including first-use external runtime/weights **GET downloads** (no paid AI provider).
- Requires the broad shirt category to be correct, the negative to be rejected, **zero incorrect automatic categories/types**, no browser errors or horizontally overflowing form, successful cancel/retry, and a privacy-safe downloaded summary with no source JPEG bytes or filenames.
- **Does NOT invent subtype correctness**. Browser-specific decoding may cause WebKit to return `Unknown` even though Chromium accepts `T-shirt`; this must remain an explicitly visible review outcome, not a forced auto-save.

## Real-device field steps (not yet completed)

Start with Closet Current's built-in **Try it on your phone** diagnostic. On the **same development/staging commit**, have a real Android user and a separate real iPhone user perform this independently. Do not assume a successful headless WebKit run is a successful iPhone.

1. **Login and consent.** Confirm the pilot data notice is understandable, login email/password and recovery work through the *real* account and the first-use model setup works on cellular and Wi-Fi. Deny then allow camera access. Never post screenshots containing private email tokens, account identifiers or photos in a public PR.
2. **Original-photo capture and recognition.** Take a picture of a real owned T-shirt, pair of pants and pair of sneakers in good light with each full article visible. Compare **type + color** to the original photo, not the masked/clipped or AI-cleaned preview. Record explicitly when subtype becomes `Unknown` or a color needs correcting. Reopen and confirm full original and recognized source persist.
3. **Camera controls.** Try manual shutter and hands-free five-second interval. Verify pause, completion, photo review and capture recovery after device rotation, background/lock and slow or interrupted network.
4. **Whole outfit and layers.** Photograph an actual two-layer outfit. Count distinct visible top/outerwear/bottom/shoes and examine each proposed crop independently. Unknown/skirt-versus-shorts/athletic high-tops must remain reviewable; no additional garment may auto-save from one duplicate mask.
5. **Own-clothes styling.** Photograph a new item, select **Style this**, check two outfit recommendations use the existing saved clothes, swap only one piece, explicitly save and reopen. Changing an outfit does not alter the original garment photos.
6. **AI try-on restrictions.** With paid generation disabled, the app must clearly explain unavailable previews and make **zero paid calls**. Do not test or claim live two-pass top/bottom photo fidelity, personalized faces or spending caps without a separate explicit owner approval.
7. **Readable small-screen UX.** Zoom text to 200%, verify buttons can be tapped, screen-reader/voice-over labels are understandable, no horizontal scroll, and clear failure/cancel guidance appears. Check on the actual iOS/Android version and available memory.
8. **Evidence.** Mark the built-in device check as Works/Needs help for each step. Export `closet-current-device-check.json` from each real device. Store reports privately alongside dated commit/device model/OS/browser details; don't attach photos or private auth data to public Issues/Actions. Retest both hardware devices after any build commit changes.

## Acceptance criteria and honest limits

- A physical-device record is **pending** until the person operates the live test build on their real device, saves a privacy-reviewed report and verifies the phone's real camera, source preservation, recognition, account persistence and offline/reconnect behavior.
- At least **two independent blinded original-photo garment inventories plus human-approved full-item masks** are required for defensible layer/footwear recall. Synthetic scoring tests and 16 public photos loaded in emulation are not a substitute.
- Real two-pass AI output fidelity remains **unverified** until actual authorized provider inference is tested with owner-approved costs, independent reviewers and privacy controls. Existing [acceptance evidence auditor](../benchmark/tryon-acceptance-evidence.mjs) deliberately keeps physical hardware and provider quality claims unverified until evidence exists.
- **Do not merge or deploy** this research branch or alter Drive Duel. No real photo uploads or paid inference belong in GitHub Actions.

**Technical gate:** A successful Chromium + WebKit workflow validates browser-lab regression only. It is evidence that the software can classify the chosen original sources under two engines; it is not a statement about production reliability, real camera captures, or general garment recognition accuracy.
