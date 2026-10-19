# Local alpha-contour garment depth — Closet Current

**October 19, 2026 — draft PR, not deployed.** Based on verified [PR #49](https://github.com/nickhaney916-lang/Closet-Current/pull/49). The parallel Work session is independently pursuing two high-resolution rights-cleared figure masters; this code does **not** touch its assets or licensed-photo mask benchmark.

## Purpose and scope

The existing fixed figure overlays show shirts beneath open outerwear but their edges can appear flat, because they are simply overlaid transparent PNGs. This change introduces a **very small CSS alpha-shaped contact shadow** only on an *already decoded and approved* outerwear layer with an actual successfully displayed clothing underlayer. This modestly distinguishes garment overlap without reconstructing fabric, guessing shadows or generating an image.

- `public/local-layer-depth.js`: deterministic browser-local policy. Only `Outerwear` in `layer`, `layer2`, or `layer3` can get contour shading, and only when `top` or an earlier clothing layer was **actually decoded and appended**, not merely selected. Standalone jacket, dresses, tops, pants and shoes receive **no** contour shadow.
- `public/reusable-figure-preview.js`: marks each successfully decoded garment with a slot. If the policy permits, add `reusable-figure-layer--contact-depth` just before the atomic image fragment is committed. Because it follows the actual PNG alpha via CSS `filter: drop-shadow`, the opening in an open jacket remains transparent; there is no rectangular shadow box.
- `public/style.css`: conservative single shadow, 0px horizontal, 1px vertical, 1.25px blur, alpha 0.16. It does not modify original RGB, alpha, logos, seams, buttons, cached cutouts or the existing silhouette alignment. No new cloud endpoint, paid image inference or persistence.
- Browser Chromium Android and WebKit iPhone **emulations** check both fixed figures with a shirt, pants, transparent-center open jacket and shoes; the jacket alone receives the depth filter, while the shirt, shoes and dress scene do not. Unit tests verify fail-closed layer policy, image-decode ordering, source untouched and paid backend approval still false.

This is not physical fabric simulation. Shadow color/intensity are fixed, not inferred from actual light or human anatomy. It does not occlude garments behind **hands, hair, neck, arms, or body parts** because reviewed human occlusion masks and production-ready fixed figures are not available. It does not overcome the 0 independently accepted real-garment fitted photo benchmark. Human visual rating and real physical phones remain release requirements.

All source photo classification/indexing stays on original high-resolution input **before** clipping; the 12 licensed real-photo proposals remain HOLD. Both current figures remain 160×297, without authenticated commercial-use/face-replacement licensing. PR #48 figure readiness is preserved unchanged.

No merge/deploy, paid AI activation, new recurring charges, purchase, photo upload or Drive Duel changes.
