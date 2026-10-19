# Two production figure assets: requirements and evidence

The existing two figures remain unchanged and **blocked for production readiness**.
This branch owns asset validation, not silhouette positioning or fitting integration.
It is based on PR #44 checkpoint `6dee7851`, with PR #37's original asset audit
preserved verbatim under `benchmark/figure-readiness/`. No existing draft branch
is edited. Exactly one female and one male figure are reused for all customers.

## Actual assets reviewed

| Figure | Current file | Dimensions | SHA-256 |
|---|---|---|---|
| Female | `public/ai-models/female-preview.webp` | 160×297 | `acb973c4a8084424197c26e389ea8819d3ec7765c0cf15a461a74d6c53b9eab4` |
| Male | `public/ai-models/male-preview.webp` | 160×297 | `92993d2a3a33a7d6ee7c504e308df0325632c424ce6202c72c3737e7c2562c29` |

Both decode as opaque RGB WebP. The expected master JPEG names and hashes in
`scripts/stage-ai-model-figures.mjs` do not establish possession, native detail or
rights. Masters, creator/creation records, licenses, person releases or fictional
provenance, reviewed landmarks and occlusion masks are absent. No file license is
approved in this assignment. Pixel decoding cannot recover those missing facts.

Source inspection (assistant observations, not independent visual approval):
gray shirts/trousers may protrude through sleeveless/short/dress overlays; female
hair covers part of shoulder/chest; hands are close to hips; background/shadow is
baked into the opaque images. Head/hands/feet appear in the small previews, but
anatomical correctness and skin/hair/finger detail cannot be certified at this
resolution. These are limits to review on real masters, not numerical scores.

## Proposed production requirements

Policy file: `benchmark/figure-readiness/production-policy.json`. Targets and
numerical tolerances are **proposed**, not validated industry standards or approved
product requirements. Keep the original high-resolution source separately from
working masters and web derivatives; resizing never establishes native detail.

| Area | Acceptance requirement |
|---|---|
| Resolution | Minimum 1294×2398 native-detail master (2× canonical 647×1199); preferred 1941×3597 (3×). 1294 width covers canonical 2× but not the largest 290 CSS-pixel / DPR3 / 200% CSS-zoom case (1740 required). |
| Integrity/color | Decodable single image, ≤20 million pixels, normalized orientation, lossless working PNG, explicit sRGB conversion/profile and source provenance. Retain original scene/photo and ICC metadata. No metadata or pixel upscaling masquerading as original resolution. |
| Framing/background | Match canonical aspect within proposed 0.2%; full head/hands/feet plus reviewed margins. Transparent source-aligned alpha, neutral separate stage background, no baked floor shadow or foreground clipping. |
| Pose/anatomy | Front-facing fictional adults, neutral expression, arms/hands visibly separated from torso and hips, uncrossed legs, complete fingers/feet, no duplicated/distorted anatomy. Review both full-size and mobile crops. Preserve individual body proportions; do not force equal body shapes. |
| Clothing/hair | Modest neutral fitted base without logos; base coverage reviewed for sleeveless tops, shorts, skirts and dresses. Hair clear of garment boundaries where feasible; reviewed foreground hair/hands/body masks otherwise. |
| Light/color | Shared soft neutral studio key/fill and camera; consistent exposure and color transform, no colored cast or strong contrast that conflicts with overlaid fabrics. Human review remains necessary. |
| Alignment | Reviewed normalized central head/chin/shoulder/waist/hip/ankle/sole anchors, proposed pair deltas ≤2% of stage per axis. This checks common scale/framing, not body dimensions or actual clothing fit. No automatic anchor guessing from beige pixels. |
| Layers/selfie | Same-grid hair/hand/body occlusion masks and face oval/anchor reviewed for both; no additional bodies. Face substitution permission must cover actual intended usage. This branch does not edit those runtime coordinates. |
| Appearance | Art-direction approval of skin, hair, anatomy, pose and base clothing at native detail, canonical 1×/2× and phone views on light/dark backgrounds. No automated photorealism score. |
| Mobile | Both exact assets decode, scale consistently and avoid unexpected stretching. Test DPR1/2/3 and CSS zoom1/2; separately review actual device display, memory and frame timing. Browser emulation is not physical hardware or perceptual approval. |

Current previews require about 1.69× enlargement at 270 CSS pixels / DPR1, 5.07×
at DPR3, 8.09× at canonical 2×, and 10.89× in the largest proposed zoom case.
The slight canvas ratio difference is measured separately; matching canvas aspect
is not evidence that shoulders/waists/soles line up. Anchor comparisons remain
**unmeasured** until exact-asset reviews exist.

## Commercial sourcing and local creation

The machine-readable audit is `source-options-20261019.json` and the reproducible
creation contract is `local-creation-plan.json`. No new asset was downloaded,
purchased, generated, incorporated or substituted. Research describes publisher
terms; final exact-file permission and all intended uses remain unapproved.

The strongest current route is local authorship with Blender and verified
MakeHuman/MPFB core components. [MakeHuman's license](https://static.makehumancommunity.org/about/license.html)
separates CC0 core graphical assets from program-source licensing; [MPFB's commercial FAQ](https://static.makehumancommunity.org/mpfb/faq/can_i_sell_models.html)
explicitly warns that third-party assets can differ. The [asset directory](https://static.makehumancommunity.org/assets/assetpacks.html)
lists core assets and natural female/male skin packs under CC0, alongside separate
CC-BY packs. Do not assume every community hairstyle, skin or garment is CC0.

[Blender's official demo-file listing](https://www.blender.org/download/demo-files/)
labels Human Base Meshes v1.4.1 CC0; these are a starting mesh collection, not a
finished photorealistic pair. [Blender's artwork terms](https://www.blender.org/about/license/)
allow commercial output; they do not license someone else's imported components.

[Unsplash's license](https://unsplash.com/license), [terms](https://unsplash.com/terms)
and [Pexels' license](https://www.pexels.com/license/) allow broad editing/use subject
to restrictions. No matched photo pair with adequate framing, clothing, resolution
and documented permissions for face replacement, caching, distribution and user
exports was established. Free stock labels and lack of a fee do not fill those
gaps. No generic stock image is approved here.

Creating our own two standardized fictional figures is feasible without recurring
external image generation: art-direct two fixed local characters, use a shared
camera/light rig, render once and derive web assets. Keep every component's exact
version/checksum, creator/license evidence and changes; preserve character presets,
scene and color/render settings. Local compute and artist time still exist.
Photorealistic quality is not guaranteed by CC0, rendering software or pixel count.
Blender is absent from this container; no render or source component acquisition
was attempted. The plan does not claim production characters have been created.

## Benchmark and safeguards

```sh
python -m pip install Pillow==11.3.0
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
python scripts/benchmark-production-figures.py
node scripts/assert-production-figure-evidence.mjs
# Repeat and compare artifacts/production-figures/results.json byte for byte.
npm install --no-save --no-package-lock playwright
npx playwright install --with-deps chromium webkit
node scripts/test-production-figure-browsers.mjs
node scripts/test-reusable-figure-phone-browsers.mjs
```

The offline Pillow benchmark verifies complete decoding, exact file and RGBA
hashes, size, image mode/format, frame count, orientation/profile presence and
alpha distribution. Lack of ICC is not treated as proof of sRGB. It evaluates
sampling needs without modifying original files. The report records decoder and
pipeline hashes, and a committed full snapshot detects evidence drift. It emits
local diagnostic thumbnails/gallery; those are review artifacts, not new assets
or a redistribution-rights grant.

The evaluator binds rights/native/visual/alignment review records to exact master
hashes and proof bytes. Boolean claims or a large upscaled file cannot satisfy
missing provenance. It validates reviewed normalized pair anchors when available.
The CLI deliberately refuses new masters/reviews until an explicit reviewed
importer handles source components, profiles, occlusion masks and private evidence
safely. Current null records are never silently promoted to approval. Metadata
checks cannot authenticate reviewers or independently determine rights. Production
authorization and automated licensing approval always remain false.

The browser fixture uses the app's stage CSS and the two exact WebP files, blocks
external requests, and checks 24 cases: two engines × three DPRs × two figures ×
two CSS zoom factors. It measures decode, nonempty canvas, geometry and sampling;
200% CSS zoom is a controlled rendering diagnostic, not browser accessibility-
zoom or real-phone certification. Enlargement may scroll in this isolated fixture.
The existing whole-app harness separately checks the integrated figure/selfie,
privacy, garment and recovery paths. Neither test scores anatomy, realism or fit.

CI stores JSON and screenshots under `production-figure-readiness-evidence`.
Passing evidence-integrity tests mean **both production figure gates remain
blocked**, not that the assets are approved. Exact-head results belong in the draft
PR; actual phone inspection remains outstanding. Original garment recognition
inputs, silhouette positions, fitting code and customer-image privacy are unchanged.
No paid services, merge/deploy, purchases, customer uploads or Drive Duel changes.
