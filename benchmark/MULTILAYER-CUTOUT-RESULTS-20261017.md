# Five-layer garment cutout route evaluation — 2026-10-17

## Evidence
- Code: PR #7, experimental branch `fix/photo-clarity-high-quality-downsampling-20261016`.
- CI run: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39052646031
- CI result: **success**. Artifacts: `experimental-hybrid-clothing-segmentation` (ID 12107828119).
- Original, object, hybrid, and conservatively selected candidate previews are exported per source.
- All five image SHA-256 values are verified; independent reference masks and real phone benchmarks are not yet available.

## Actual router results
| Photo | Category | Suggested candidate | Why |
| --- | --- | --- | --- |
| validation-0001 | Worn colorful dress | clothing-guided-hybrid | Strong dress mask and body exclusion |
| validation-0003 | Museum mannequin dress | clothing-guided-hybrid | Strong dress mask and removes mannequin head |
| validation-0010 | Worn blue layered dress | original-source | Coarse mask removed almost the whole dress |
| validation-0017 | Hanging jeans | original-source | Person detection is triggered by the scene; do not trust removal |
| validation-0019 | Sneakers | object-alpha-only | Hybrid cuts off most of the shoe uppers, BiRefNet preserves overall sneaker silhouette |

**Counts:** 2 hybrid, 1 object-only, 2 original-source. All five are **review proposals** and none is automatically promoted to production. The original pixels are preserved in every case.

## Multilayer processing
1. Protect original high-quality source; account storage only after customer consent/authentication.
2. Run segmentation recognizing clothing classes (dress, bottom, shoe); detect body and conflicts.
3. Run independent object-alpha refinement (BiRefNet).
4. Try guarded clothing-guided fusion only around target class and outside identified body pixels.
5. Compare image preservation signals and choose a *review candidate* by category and scene, with original fallback.
6. Independently label complex real phone scenes, then measure category-specific cutout accuracy and latency before considering automatic deployment.

## Known remaining concerns
- Neither model provides independently verified garment boundaries; a clean-looking image can still lose straps, sleeves or delicate fabric.
- Strong cuts in two dress examples do not prove general performance on people or mannequins.
- The segmentation module may misclassify a person behind hanging jeans.
- The fallback photo keeps the scene as captured; preserving it is safer than inventing a bad cutout but not the final user experience.
- One two-model sequential pass on CI CPU costs several seconds, requiring mobile/web deployment architecture and latency testing.
- Outfit capture should isolate *multiple garments* and preserve overlapping garments rather than flattening them into a single object cutout.

## Next experiment
Benchmark layered performance on browser/mobile-equivalent hardware; expand category-specific isolation to tops/skirts/jackets and multi-garment outfit captures. Use human-reviewed native masks and explicit catastrophic-loss metrics for promotions.

No production deployment, repository merge, account data changes, or Drive Duel changes.
