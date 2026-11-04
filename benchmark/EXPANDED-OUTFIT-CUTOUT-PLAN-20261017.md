# Expanded outfit cutout benchmark — October 17, 2026

This eight-photo **experimental** follow-up broadens the earlier dress/shoe/jeans benchmark. The two-model approach remains draft only; it is not connected to the live application.

## Source coverage
- commons-0001 — oversized-t-shirt; expected Tops
- commons-0003 — long-sleeve-shirt; expected Tops
- commons-0041 — skirt-display; expected Skirt
- commons-0043 — patterned-skirt; expected Skirt
- commons-0060 — jacket-display; expected Outerwear
- commons-0062 — second-jacket; expected Outerwear
- commons-0059 — dress-and-jacket-display; expected Outerwear + Dresses
- validation-0008 — worn-upper-garment-with-headwear; expected Tops

Photographs come from existing `benchmark/locked-photo-sources.json` and `benchmark/manifest-fresh-11.json`; the downloader and inference script enforce immutable SHA-256 verification, license metadata, and original RGB integrity.

## Model behavior that must remain explicit
- Class 4 ("upper garment") **cannot** distinguish a top from a jacket. A shirt under a jacket may share the same class. This benchmark must not create two items from that class without separate evidence.
- Class 6 ("bottoms") **cannot** distinguish pants from shorts. Skirt has its own class (5), but class labels are not manually approved reference masks.
- Dress (7), shoes (9), and upper garment (4) can be represented as distinct broad regions in a single frame. Reliable separation of overlapping or partly occluded clothes still requires evaluation.
- Each item has an original-vs-object-vs-guided candidate review panel. No mask is promoted and no original is overwritten. A missing garment falls back to the original photo and is explicitly reported.
- Filenames and source category labels are only *expected scenarios*, not segmentation accuracy or proof of correctly extracted clothing.

## Acceptance before shipping
Independent native pixel reference masks; visual review of delicate fabric, hems and straps; preservation and contamination metrics by category; representative real phone captures; device inference latency and memory measurements; multi-item crop separation and storage isolation tests.

Run `.github/workflows/expanded-outfit-multilayer.yml`. The recorded CI pass verifies source integrity, reproducible image generation and safety guards only. No production deployment and no changes to Drive Duel.
