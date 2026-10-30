# 3D-47 — original photograph upper-arm cloth volume (DRAFT / HOLD)

**Exact parent:** PR #454 HEAD `fe351f01fe565179e40daa57ec2d7aead15adc99` (dedicated 3D-46 CI was successful, original full-repo legacy checks were not).

## Observed defect and actual implementation
The genuine PR454 male/female front/side/rear 430px original-photo screenshots show a bulbous, padded upper arm and stiff deltoid/sleeve transition. 3D46 had already shaped the real separate 3D45 caps and matching torso seam. This research-only opt-in applies a smoother bounded *3D* upper-arm volume treatment to the same independent cap/torso cloth vertices. Shared spatial vertices move as one group, protecting cap/yoke seam closure. Both front and rear upper-sleeve planes are relaxed, while original central source-photo print, anatomy, garment UV/source metadata and jeans remain unchanged.

The geometry passes through the actual existing skinned pose triangle-contact solver; no replacement synthetic garment artwork, no AI generation or paid token calls. This is not a fitted physical cloth simulator.

**Localhost comparison**: `?construction=after&sweep=after&sleeve44=after&caps45=after&contour46=after&volume47=before` vs `volume47=after`. Disabled by default, never affects production.

## Gates and evidence (record exact results after the CI run)
1. Four real model+denim combinations with separately licensed photographs and real anatomically rigged original humanoids; original image/UV and skin source arrays remain byte-for-byte unchanged.
2. Bilateral separate cloth-cap and shirt-yoke seam contours; shared seam gap <= 50μm; any missing input fails closed.
3. Actual skinned original-fabric shirt/body, jeans/body and shirt/jeans BVH triangle tests at source, 25/50/75%, relaxed and repeat states; 28 results required. A triangle-crossing PASS is **not** signed containment or continuous-motion collision certification.
4. Real local Chromium 320/390/430px before-and-after front/side/back at relaxed and half-arm pose, both figures and two original denim sources; source photo hashes unchanged and external network requests forbidden.
5. Human comparison needed: evaluate shoulder roundness, unnatural shirt puff, collar/armhole, seams, printed garment alignment and whether photo is recognizably original; record PASS / REVIEW / FAIL. Pixel changes do not constitute human acceptance.

**Release state:** strictly DRAFT HOLD. No merge, staging, production, private family photos, account changes, billed services or Drive Duel. Family Alpha #255 HOLD.