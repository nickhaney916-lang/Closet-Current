# Closet Current 3D-66 — actual physical handset validation

**Research only. Do not deploy. Family Alpha #255 remains HOLD.**

The original skinned 3D garment renderer, not an animated substitute or screenshot, is tested here. CI mobile viewport simulation is not a physical device.

## Prepare an original-source research desktop

Use a local clone of this exact PR branch with Node.js, Git and the Android SDK platform tools (`adb`). The original assets are public licensed benchmark fixtures only; no private wardrobe photos are needed.

```sh
git fetch origin
git switch research/three-d-66-source-articulated-drape-phone-gate-HOLD-20261031
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1 three-mesh-bvh@0.9.2
node scripts/build-three-d-31-jeans-proposal.mjs
node scripts/build-three-d-37-second-jeans.mjs
node scripts/build-work47-benchmark.mjs
node research/three-d-20/restore-approved-models.mjs
node scripts/serve-three-d-66-device.mjs
```

If the original avatar restore fails because source objects are not present, the dedicated no-deploy workflow restores them by pinned Git commit and SHA. Do not replace a missing original with a fabricated/mannequin placeholder.

## Verified USB hardware preflight (not a completed visual test)

In a second desktop terminal, with the read-only preview server running and **one** authorized, unlocked Android handset connected by USB:

```sh
node scripts/capture-three-d-66-android-hardware.mjs
```

This checks original local server availability, uses `adb devices -l` and Android `getprop` to reject known virtual devices and unknown transport, establishes `adb reverse`, and launches Android Chrome. It saves a local `benchmark/three-d-66/physical-android/usb-preflight.json` with the generic device model, OS, and interface class, **not** the device serial, IMEI, personal photographs or private account data. This proves only **a plausible USB physical-device connection**, not that the source renderer loaded, that a person viewed the garment, or that the phone passed visual QA.

For an optional *real device screen capture* after displaying the verified original outfit and giving your consent, rerun with `--capture-screen`. The screenshot may contain phone personal information (notifications, names); inspect/redact it locally before sharing. This capture is never done automatically and no file uploads occur. Next, finish the real original renderer's on-device checks, save `closet-current-3d66-physical-device-qa.json` from the page, and supply both redacted evidence files for independent acceptance.

## Physical Android Chrome over USB

On the phone, enable USB debugging with informed permission; unlock the phone, connect a USB cable, accept its debug prompt. On the desktop in a **separate terminal**:

```sh
adb devices -l
adb reverse tcp:8765 tcp:8765
```

In **Android Chrome on the actual handset** visit:

`http://localhost:8765/research/three-d-66/phone-acceptance.html`

This connection loops back through ADB to the read-only, loopback-only source server on the desktop. It does not publish the source data, expose a LAN service, create a login or capture photos. Tapping the preview's source review box and `Original shirt + jeans` is required. Check both figures, both jeans, front/side/back, touch rotation and poses, then use `Sample renderer` and `Generate device QA report`. Download the JSON to the phone and provide the evidence for independent review. A tester PASS is **not** independently witnessed physical approval.

## iPhone Safari physical acceptance

Not testable through ADB reverse and not covered by Chromium responsive simulation. A physical iPhone and a **separately authorized, trusted HTTPS research endpoint** are required, with the same original SHA-checked source garment preview and no production deployment. The fail-closed origin policy is in `research/three-d-66/approved-phone-origins.mjs` and currently lists **zero** authorized HTTPS origins. Before an independently approved, private research HTTPS host can be used, a reviewer must explicitly add its **exact** origin (including scheme and port) to that research-only allowlist and rerun the no-deploy tests. No wildcard hostnames, query-token shortcuts, production/staging deployments or actual iPhone certification are permitted by this PR. This PR does **not** claim the iPhone was tested. Its localhost-only server deliberately does not listen on a LAN address or bypass the original preview privacy gate.

## Release checklist

- [ ] Source-original anatomical outfit, both photographed denim sources and upper sleeve seam contact pass dedicated no-deploy CI.
- [ ] Genuine before/after screenshots visually show cloth rather than rigid body shell; human reviewer records PASS on shoulders/sleeve gravity and no clipping.
- [ ] Actual physical Android Chrome report with genuine 3D renderer, touch, source hashes, both figures, three poses and normal mobile memory/rendering evidence.
- [ ] Actual physical iPhone Safari report with identical genuine sources and explicit independently reviewed appearance.
- [ ] Independent four-account privacy/auth and offline/restore acceptance with test credentials, no real family photos until consent.
- [ ] Human approval, release authorization and separately permitted staging/production deployment.

**Until all required gates actually pass: human visual REVIEW, Android/iPhone NOT CERTIFIED, Family Alpha HOLD.** No paid per-outfit AI, Drive Duel edits or Supabase changes.
