# Closet Current — REAL physical phone acceptance (3D-66, HOLD)

These instructions are for the unmerged research-only 3D photographed garment branch. Do not use family/customer photographs; use the two approved licensed denim fixtures and approved public photographed shirt only.

**Current hardware approval: NOT TESTED.** GitHub Actions on Ubuntu and Chromium mobile emulation are not physical Android or iPhone tests. Neither a matching User-Agent string nor running a simulator constitutes a device test. Only an independent human inspection of genuine physical phone screenshots, screen recording, and diagnostic results can close the hardware gate.

## Preconditions
- Exact draft GitHub commit SHA under test recorded in the evidence.
- Local original licensed photo sources and anatomical GLBs generated and SHA checked by the approved research scripts. No customer images, production data, or network AI.
- Research preview URL parameters:
  `construction=after&pantsDrape=after&seatFairing=after&envelope=after&loft=after&crotchPanel=after&waistFit=after&waistContact=after&hanging=after&clothFall=after&sweep=after&sleeve44=after&caps45=after&contour46=after&volume47=after&collar48=after&rear53=after&round54=after&hang55=after&move56=after&fit59=after&crisp58=after&slope61=after&crest64=after&drape66=after`.
- All tests are conducted with explicit review checkbox enabled; no bypass of original photographed source/consent gate.

## Physical Android Chrome with USB port forwarding
On a workstation with **Android SDK Platform Tools** and the test phone:
1. Install the pinned repository dependencies and build the reviewed public source assets in an isolated research checkout. Use the existing GitHub workflow as the exact audited build command sequence; do not enable production.
2. Start a static file server bound only to `127.0.0.1` in the repository checkout, for example `python3 -m http.server 8787 --bind 127.0.0.1`.
3. Connect the real Android phone over USB with USB debugging explicitly permitted; run `adb devices -l` to confirm the model and serial are real hardware, not `emulator-*`. Run `adb reverse tcp:8787 tcp:8787`.
4. Open **Android Chrome on the physical handset** at `http://127.0.0.1:8787/research/three-d-31/index.html?<parameters above>`. The localhost test is available through USB reverse forwarding; no public test website and no uploaded family photos.
5. Repeat with `research/three-d-37/index.html` for the second independently licensed denim photograph.
6. Use Chrome remote inspection if needed. Record phone make/model, Android version, Chrome version, git SHA, real portrait and landscape widths, memory and frame traces, WebGL context recovery, and original source SHA. Save screen recordings and screenshots from the real phone only. Hash evidence on your workstation using `sha256sum`.
7. Remove forwarding afterwards: `adb reverse --remove tcp:8787`.

## Physical iPhone Safari
- A physical iPhone requires **actual iPhone Safari**, not Chromium's iPhone viewport emulation or Xcode Simulator. The research app intentionally rejects non-localhost hosts to avoid exposing original/photo research on LAN or staging.
- Use a **trusted local development-only HTTPS origin presented as localhost on the actual iPhone** with a supervised, explicitly reviewed secure forwarding setup; otherwise mark iPhone **BLOCKED / NOT TESTED**. Do not weaken the localhost security check or deploy a public/staging test site just to claim hardware coverage.
- Capture actual iPhone model, iOS and Safari versions, photographed 3D views/rotations, real WebGL memory/error behavior, touch responsiveness and screen recordings. iPhone desktop Safari responsive-design mode does **not** count.

## Ten mandatory evidence checks on EACH phone
1. `verified_original_photo_front`: the genuine source shirt/front denim are crisp and original, correct SHA.
2. `three_quarter_side_back_neutral_source_truth`: missing side/back jeans photos remain explicitly neutral, never invented.
3. `female_male_anatomical_load`: both 163-bone figures load and retain licensed 3D geometry.
4. `pose_source_blend_relaxed_zero_sampled_contact`: sampled crossing pairs remain zero for source/blend/relaxed, verify genuine drape.
5. `garment_swap_no_leaked_textures`: repeatedly replace shirt+jeans with neutral reference and back, check GPU/texture counts.
6. `portrait_landscape_touch_rotate_zoom`: rotate/zoom and portrait/landscape on the actual touchscreen.
7. `app_background_resume_and_webgl_context`: background, foreground, WebGL context restore with no blank/crash.
8. `memory_and_render_responsiveness`: measured p95 render time and peak memory from the actual device, record thresholds and trace. A mobile-sized browser screenshot alone does NOT prove this.
9. `relaunch_session_and_isolated_account`: independently verify actual authentication/session persistence and cross-account privacy from a separate authorized test environment **before any Family Alpha release**; this research-only preview contains no user accounts and cannot pass this case by itself.
10. `camera_capture_original_no_gallery_leak`: independently verify camera capture without gallery leakage, original-photo recognition, and privacy in the real app. The research-only photo demo lacks camera capture and CANNOT pass this by itself.

## Evidence and decision
Prepare **separate** physical-device reports for Android Chrome and iPhone Safari using `PHONE_QA_CASES` and `assessPhysicalPhoneEvidence` in `research/three-d-66/phone-hardware-acceptance.mjs`. Include real make/model/OS/browser, exact test commit, 10 PASS/FAIL cases, peak memory and p95 latency measured on the device, genuine screenshot/video SHA-256, independent reviewer identification and attestation. Do NOT store personal family photos, secrets or account identifiers in public GitHub issues.

Reports with missing cases or physical evidence remain **HOLD**. Even both complete reports are **PENDING_INDEPENDENT_HARDWARE_SIGNOFF** until human-reviewed real evidence, and do NOT imply production release. Human garment photorealism, full continuous collision and Family Alpha #255 remain separate explicit gates.
