# COLOR-REVIEWED-REGION-46 — original-photo-linked reviewed crop pixel suggestions (RESEARCH HOLD)

**Dominant Closet Current controller, research-only, Family Alpha Issue #255 HOLD. Do not merge, modify existing staging or production, deploy, or use customer photos.** The latest user priority is *accurate recognition of category/type/color*; this scoped iteration makes the previously measured region-pixel color proposal available in the actual genuine FashionCLIP review flow, and preserves independent evidence of its limitations. It does **not** establish reliable automatic color recognition or improve FashionCLIP classification weights.

## Exact source provenance

- **Parent** [PR #603](https://github.com/nickhaney916-lang/Closet-Current/pull/603) exact HEAD `8bdc4fbc72b4b55afa7535c30bf539b2187201d9`, [dedicated CI #41938880275](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41938880275) SUCCESS: 582 Node, 42 real Chromium/WebKit browser cases incl six genuine pinned FashionCLIP original+reviewed crop→owner-private My Closet/outfit; 73 PNG hashes checked.
- **Research donor** Work #31 [PR #597](https://github.com/nickhaney916-lang/Closet-Current/pull/597), exact `f4464188c6fddaca35f8e06f54506fa856df455d`: its unchanged frozen, SHA-authenticated `color-manifest.json` (35 licensed **archived renditions**, with visually selected garment rectangles and provisional single-reviewer labels) and `compare-color.mjs` are copied unchanged for reproducible evidence. Dataset is not independent human-adjudicated and was previously seen during development. Zero new photographs or manual labels introduced by this PR.

## What changed in the actual reviewed-photo UI

- After locally running pinned FashionCLIP on **the unchanged original photo and the human-reviewed crop** in the existing optional `recognitionReview42=research` native capture interface, decode the *exact reviewed crop JPEG* in the browser and sample a 48×48 RGBA canvas with existing `PhotoColor.maskedPalette`. This is the same pixel-family extractor/resolution measured in Work #31, though in-product crop boundaries may differ from research rectangles. It is **not an automatically correct semantic garment mask**: background, skin, shadows and crop contamination may dominate. The UI says so explicitly.
- Show the color pixel result as a **separate**, unverified primary and optional secondary suggestion alongside the existing FashionCLIP category/subtype/optional color suggestion. This is a proposal; the user still has to choose a category, a valid type, type the correct color and check **I confirm this visible garment, category and color** before a save is possible. Model or pixel color never directly changes a confirmed user field, and no automatic acceptance threshold was introduced.
- When FashionCLIP has no color suggestion, use this observed reviewed-crop pixel candidate in its **unverified** result display with provenance `reviewed-crop-pixel-estimate`; keep legacy `checkPhoto` as a last-resort fallback if the 48×48 estimate cannot run. Its secondary color is *not* written into the user's saved confirmed garment color.
- On the final save boundary, continue the #43 strict category/subtype/user-color checks. The #45 `recognitionSuggestion42` private evidence is further sanitized to include only a bounded `colorReview46:{source:'reviewed-crop-pixels',primary,secondary,needsConfirmation:true}` with approved palette and the same source/crop hash identity. Arbitrary raw model extra fields, injection and unsupported colors are not stored. User-confirmed fields remain authoritative; explicit color correction/blank, source JPEG SHA, duplicate rejection, owner/session isolation, original-photo/private outfit references, CAS and #44 non-color confirmed learning are unchanged.

## Paired accuracy evidence — provisional, NOT a release pass

Frozen 35 archived real photos from Work #31 (19 development / 16 non-blind inherited holdout), same actual color extractor code but *benchmark visually selected rectangles*, compared to existing full-scene 16×16 sample:

| Split | Whole-scene correct | Reviewed-region pixel candidate correct |
| --- | ---: | ---: |
| Development | 6 / 19 | 11 / 19 |
| Inherited holdout | 5 / 16 | 7 / 16 |
| **Combined** | **11 / 35 (31.43%)** | **18 / 35 (51.43%)** |

These are exact prior Work #31 results to be rerun in no-deploy CI, not original new-model accuracy; the paired effect combines region selection and sample resolution, with **no auto-acceptance (0 / 35)**. Labels are provisional, no new blinded source data or independently human-certified masks. Some colors worsen (e.g. Green→Gray and Multicolor→Red). All remain review-only. Scientific accuracy still NEEDS REWORK.

## Independent engineering acceptance requirements

1. Strict exact parent, scope-allowlist and no-deploy GitHub Actions. Actual application build, all 582 inherited Node tests + new palette/persistence/owner cases.
2. Rerun all 35 frozen, byte-SHA-verified archived JPEG comparisons from donor and assert exact counts/no unknown missing and zero newly auto-accepted labels.
3. Repeat inherited 36 genuine Chromium/WebKit × 320/390/430 saved review/auth-source/CAS/color/worker tests.
4. Execute six new genuine FashionCLIP original+reviewed-crop model→actual native owner-private IndexedDB/outfit/backup/restore browser cases with independent UI `data-color-review46=unverified`, primary palette proposal displayed, user Color field remains EMPTY until manual selection, persisted model suggestion sanitized and corrected color preserved. Archive 73 genuine screenshot SHA/dimensions/pixel checks and six contact sheets. Local fake HTTP authentication (not hosted signed Supabase), real unchanged JPEG+WASM model/real IndexedDB.
5. Final exact HEAD workflow SUCCESS is **engineering integration** acceptance only; never equate with 95% independently verified true color, category, subtype or multi-instance segmentation accuracy.

**Not established:** verified 95% color/category recognition, fresh blind 100–200 original-photo independent annotations, accurate transparent garment pixel masks, reliable overlap separation, user-uploaded 3D realistic full view, physical iPhone/Android, signed hosted cloud E2E. Family Alpha stays HOLD. Continue advancing real recognition science and photo dataset independently.
