# Closet Current — original rounded shoe refinement (2026-10-19)

This **main-chat** continuation builds only on parallel Work's verified [PR #52](https://github.com/nickhaney916-lang/Closet-Current/pull/52) creation system. The new figures, rights documents, and source provenance remain isolated from the deployed product and all unrelated development branches. The old in-app 160×297 avatars are untouched.

## Fixed specific quality flaw

The initial new high-resolution male and female candidates used primitive **rounded rectangular shoe blocks** with poor toe/heel definition. Both remain unmistakably artificial even though the original files are 1941×3597; scaling doesn't solve it. This branch replaces those blocks **in the editable original Blender scene**, never by image upscaling or AI generation.

- For each of **exactly two adult characters**, model **two** low-profile original three-dimensional uppers using seven shaped longitudinal toe/instep/heel cross sections, 16 angular samples per cross section and Blender Catmull–Clark smoothing.
- Add a corresponding separate contoured outsole and three simple neutral-tone lace strokes per shoe. Shoe materials are locally created procedural diffuse materials; no shoe download, customer imagery or purchased textures/assets are used.
- Retain Work's pinned official Blender 4.3.0 and CC0 MakeHuman revision, asset content hashes, consistent two-figure camera, source-weighted arm-chain pose, same color management, recorded leg-motion zero, transparent background, and two **native** preferred-resolution 1941×3597 renders. Derive 1294×2398 PNG and 970×1798 WebP output as before; do **not** change the product's existing figures.
- An independent scene-evidence contract requires **2 rounded shoe uppers + 2 contoured soles + 6 lace strokes per figure**, no cube primitive footwear, and checks zero approval claims. Exact image/scene/input hashes are regenerated and recorded for the new assets. Run 24 Chromium/WebKit **browser emulation** cases, the full Node tests, local creation benchmark and repeatability checks.

## Visual QA and release blockers

Part counts and mesh topology are implementation evidence, **not** proof of beautiful footwear, realistic shoes, anatomical foot/ankle correctness, customer garment fit or market parity. Compare rendered image previews from CI against the preceding [PR #52 output](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39332784134) before any later choice to adopt an asset. If the new lower-leg/shoe transition looks bad, hold and revise rather than promoting the asset.

Remaining issues from PR #52 are synthetic head/face/eyes/hair, jagged shirt hem/collars, unreviewed hand/feet anatomy, unapproved body-occlusion/fit landmarks, untested commercial-facing final art rights, independent real-photo garment fidelity and physical phone hardware. Rights of CC0 source assets are documented; whole-product/optional customer face overlay approval and polished appearance have **not** been claimed.

**No paid AI, new subscription charges, customer uploads, scene or runtime image replacement, merge, deployment or Drive Duel changes.**
