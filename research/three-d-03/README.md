# Closet Current — 3D-03: correct real garment photo color and vertical UVs (HOLD)

## Why this was necessary

We inspected **the actual GitHub Actions screenshot artifact** from successful native WebGL [3D-02 #40770769827](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40770769827). The licensed `commons-0003` original photograph and the 2D transparent cutout show a **black printed shirt**, but the dressed WebGL humanoid was **burgundy**, the 3D-01 default synthetic shirt color. This is a real visual failure that previous mechanical tests (rendered, alpha verified, texture uploaded, angle changed) did not catch.

The bug was the coordinate-system mismatch: Work47 crop bounds are normalized from **top-left image coordinates**; the WebGL renderer enables `UNPACK_FLIP_Y_WEBGL` and must upload `uCrop.y = 1 - imageTop - cropHeight`, mapping source top to top garment and hem to hem, not sampling mostly transparent background outside the cutout. We preserve the exact original RGB, alpha, original photo files, SHA-256 hashes, and manual review requirements.

After correct source UV mapping, the formerly burgundy garment shell's sleeves, edges and neutral inferred rear must not remain generic red. New `fabric-color.mjs` computes the **channel-wise median of alpha-opaque original RGB** from the existing review sample. This is a deterministic color analysis of real pixels, NOT new inferred fabric texture, AI generation, color correction of the original photo, image storage or approval. The uniform neutral material is applied only to the garment mesh and never to the grey mannequin's head, body, arms or legs. Visible original photographed fabric on the front remains the source PNG, not a plain-color replacement.

A second image inspection after correcting the uniform color found that the photographed white **AJ lettering was still not drawn**. The vertex shader also had a reversed clip-depth sign (`p.z * .12`), allowing the cylinder's **untextured rear face to hide the real photographed front face**. Correcting it to `-p.z * .12` gives camera-nearer front clothing the nearer depth value. The new browser test now requires actual bright print pixels on the visible upper torso in addition to the dark source-colored fabric. This was a genuine missing-clothing-detail flaw, not a mere test artifact.

This is still **static approximate geometry**, not realistic fit, cloth physics, measured back, or wearer identity. Median colors only approximate large-scale fabric and can be wrong for high-contrast print or color-blocking. The user must still review edges, source identity, and actual look. No human PASS has been claimed.

## Scope boundaries

- Parent [PR #392](https://github.com/nickhaney916-lang/Closet-Current/pull/392) exact `8bc3a4e878f59e2abedd14387141fd01dd097e9a`.
- Changes are limited to existing experimental `research/three-d-01/webgl-renderer.mjs`, `research/three-d-02/reviewed-texture.mjs`, `research/three-d-02/demo.mjs` and `index.html`, plus new `research/three-d-03/fabric-color.mjs`, source/browser tests and README. No core 2D photo-processing, recognition, cutout, original JPEG, accounts, cloud, staging/production or Drive Duel changes.
- Reuses 3D-02's exact licensed test photos **black printed shirt and dress**, the original Work47 alpha gates, manual cutout review checkbox, same-origin blob source validation, strict JPEG/PNG hashes, original front-only WebGL texture, neutral rear, and pants fallback.

## Tests

The no-deploy CI builds original 15-photo Work47 benchmark using existing source pins (15 licensed source JPEGs, nine provisional cutouts, no approval), runs 3D-01/02/03 source, geometry and privacy tests, and wraps **the complete existing 3D-02 GPU browser journey** across Chromium 320/390/430.

The extra check measures visible RGB on the **actual canvas shirt torso**, comparing against an independently calculated source median RGB of the opaque cutout. The black shirt must actually appear black on the human figure; mere successful upload or alpha checks no longer count as success. The existing front/side/back, local network, shirt/dress, fallback and no-approval validations remain as strict as before. CI screenshots are labelled HOLD for the owner to visually inspect.

**Next candidate:** Use verified graded cutouts from Work #53 if/when ready and obtain independent human Work #55 acceptance on 3D appearance, then decide whether more sophisticated multi-panel UV transfer or deformation is worthwhile. Don't spend another week polishing the old 2D avatar.

**Status:** HOLD. No staging, production, merge, deploy or family invitations. Real four-person Family Alpha still requires JWT/RLS ownership, backup restore, physical phones, and owner visual signoff; last rated 2D baseline 0 PASS / 5 REVIEW / 10 FAIL.
