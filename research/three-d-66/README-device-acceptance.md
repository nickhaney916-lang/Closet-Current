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

Not testable through ADB reverse and not covered by Chromium responsive simulation. A physical iPhone and a **separately authorized, trusted HTTPS research endpoint** are required, with the same original SHA-checked source garment preview and no production deployment. This PR does **not** claim the iPhone was tested. Its localhost-only server deliberately does not listen on a LAN address or bypass the original preview privacy gate.

## Release checklist

- [ ] Source-original anatomical outfit, both photographed denim sources and upper sleeve seam contact pass dedicated no-deploy CI.
- [ ] Genuine before/after screenshots visually show cloth rather than rigid body shell; human reviewer records PASS on shoulders/sleeve gravity and no clipping.
- [ ] Actual physical Android Chrome report with genuine 3D renderer, touch, source hashes, both figures, three poses and normal mobile memory/rendering evidence.
- [ ] Actual physical iPhone Safari report with identical genuine sources and explicit independently reviewed appearance.
- [ ] Independent four-account privacy/auth and offline/restore acceptance with test credentials, no real family photos until consent.
- [ ] Human approval, release authorization and separately permitted staging/production deployment.

**Until all required gates actually pass: human visual REVIEW, Android/iPhone NOT CERTIFIED, Family Alpha HOLD.** No paid per-outfit AI, Drive Duel edits or Supabase changes.
