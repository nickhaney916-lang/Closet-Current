# Closet Current — Multilayer image pipeline (review only)

## User experience
**Point → photograph → automatic result.** No extra screens, cropping tools, or decisions. The original full-quality source must be stored privately with the account, and remains available for recropping without JPEG recompression. Any enhanced image is a *derivative*, not a replacement. When an AI preview is unreliable, keep the original rather than saving missing sleeves, lace, soles or fabric.

## Proposed layers
1. **Camera source protection:** Record source dimensions, decode integrity, stabilization/blur and underexposure signals when actually measured on device. Avoid manufacturing quality scores from remote photographs. Capture full-resolution JPEG and retain the original pixels.
2. **Garment inventory:** Recognize category and color first, then optional material/details. Single garment and whole-outfit photos should share classification but use separate segmentation paths. If classification fails, keep the source unaltered and mark details unresolved rather than hallucinating.
3. **Object boundaries:** BiRefNet Lite generates an object-level mask useful for footwear and standalone photographed clothing. It can mistakenly include faces, mannequins, and hangers, so no universal object-only cutout.
4. **Semantic clothing regions:** SegFormer clothing-class regions identify dress, tops, bottoms, shoes. Explicitly veto semantic body/face/limb pixels for a clothing-only fusion candidate; retain fabric only inside tightly bounded garment regions with small edge halo. Coarse masks can amputate shoelaces, thin sleeves or patterned details.
5. **Cross-check multiple candidates:** Compare original, object-only and garment-aware hybrid. Fail closed on absent target clothing seed, implausibly small retained garment, excessive object removal or conflicting person/garment evidence. Route standalone sneaker imagery toward the object silhouette, strong person-worn dress imagery toward clothing-guided masking, and uncertain cases toward original.
6. **Preservation and quality gate:** Review native-resolution fabric edges, difficult backgrounds, shadows, attached hangers/tags/mannequins, seam openings and unsupported patches. No cutout is accepted as pixel-accurate until independent source-matched ground truth is available.
7. **Output and indexing:** Store image original and *only vetted* derivative; category and color are the mandatory baseline. Surface a single thumbnail in the closet, not internal AI controls. Outfit matching uses garments already owned, including newly photographed items.

## Results of five source-verified initial hybrid comparisons
This is an *offline benchmark*, not real-phone performance or an independent segmentation score. Current conservative **review suggestions**:
- validation-0001: colorful worn dress → clothing-guided hybrid (visual promise)
- validation-0003: dress on museum mannequin → clothing-guided hybrid (visual promise)
- validation-0010: worn layered blue dress → original fallback (semantic dress almost disappeared)
- validation-0017: jeans → original fallback (person detection unreliable)
- validation-0019: studio sneakers → object cutout (semantic hybrid drops most uppers)

The corresponding multi-layer router is experimental; zero production/deployment changes. These are candidate selection suggestions only, **not** release authorization.

## Acceptance gate before enabling any layer in Closet Current
- Independently annotated, native-resolution garment and background reference masks covering worn clothing, isolated product photos, multiple items, props, unusual textures, skin tones, shadows, footwear, sleeve ends and thin edges
- Per-category **garment preservation** and **background/skin contamination** measurements, plus catastrophic failure counts; do not equate a green CI test with visual accuracy
- Real Android and iPhone capture tests for first use, warm use, offline/error paths, memory footprint, responsiveness and storage persistence
- Back-to-back recognition/indexing regression tests, correct account separation, no storage corruption
- Explicitly review pipeline before promotion; do not merge large experimental PR or change deployed model by default
- Do not modify Drive Duel

## Relevant code
- `benchmark/experimental-cutout-router.mjs` — fail-closed candidate guidance
- `benchmark/hybrid-garment-mask.mjs` — protected-body veto and garment-constrained object alpha
- `scripts/run-hybrid-garment-comparison.mjs` — four-way visual and conservative recommendation artifact
- `.github/workflows/hybrid-garment-comparison.yml` — CI comparison (experimental)
