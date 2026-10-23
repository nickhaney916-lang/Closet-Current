# Closet Current — Independent original-photo shadow color QA

2026-10-23. Research-only, NO DEPLOY. Base main SHA: 54c9e29ede069a05d1268e003f80cbda043c7d6a. Independent branch: qa/shadow-resistant-original-color-20261023.

## Overlap review and scope

Reviewed the current main branch, open recognition and original-photo PRs, active issues and existing tests. PR #249 already owns original full-frame and garment-instance evidence routing, source identity, crop/pixel preservation and ambiguity review. PR #234 owns crop geometry, mask subtype-admission and transparent-pixel safety; PR #226 owns the 59-image inference benchmark; PR #224 owns candidate model admission and #233 handles cloud source provenance. PR #236 owns storage/performance. All parallel 3D/2D, trend and account work remains untouched.

**Distinct bug addressed:** the current main public/photo-color.js maskedPalette counts colors from the visible source pixels directly. Very dark chromatic shadows can fall below the existing Black threshold, turning much of a colored garment into Black. White garments with gray shadows can appear Gray, especially in a cropped original photo. This task does NOT alter FashionCLIP garment-recognition model weights, label prompts, original-photo segmentation or automatic cropping code.

## Isolated safe implementation

File: research/original-color/shadow-corroborated-color.mjs — standalone and not loaded by the customer app.

- Bounded sampling from an already source-verified ORIGINAL full photo or original-derived native-resolution garment region; preserves every RGB/RGBA value and does not change image sizes, crop, JPEG, patterns, user corrections or stored originals.
- Requires caller-provided original source role. Optional source SHA is validated for format but caller must establish original source ownership via real Auth/provenance; a flag alone is NOT trust.
- Recovers a dark pixel's chromatic family using unchanged existing PhotoColor.family only when independent brightly illuminated pixels from the SAME masked garment corroborate that color. Without that bright source anchor, severely shadowed material remains Review; it is never guessed as red, blue, etc.
- Conservative neutral White recovery requires sufficient direct bright neutral pixels. True Black and Gray remain distinct; gray-with-small-white-highlights stays Review. Mixed strong colors become Multicolor with explicit confirmation and never an invented material/print.
- A bounded binary instance mask/alpha gate is required for meaningful regional color; a blank, tiny or fully transparent region cannot auto-index.
- composeOfflineGarmentIndex returns category, itemType, color, sourceVersion and confirmation status as the REQUIRED core fields only when both source-local color and classification are verified. An unknown subtype is explicitly itemType=Unknown, not a fabricated "T-shirt" or "Skirt". Optional material, brand, print or fit are deferred. All QA outputs set autoSave=false.
- No network, paid AI, production setting, Supabase/Cloudflare, customer photograph or data writes. This is an isolated potential improvement, not a customer app fix.

## Measured before-after color comparison — SYNTHETIC ONLY

Script: scripts/benchmark-shadow-original-colors.mjs. Seven garment types each with 3 deterministic generated pixel variants (fully lit, heavy uniform shadow, heavily shadowed garment amid bright contrasting scene background). Existing unchanged main PhotoColor.maskedPalette and the isolated new module consume the **same original pixels and mask**.

| Garment family | Color ground truth | Scenarios | Existing palette correct | New research gate correct |
| --- | --- | ---: | ---: | ---: |
| Tops / T-shirt | Red | 3 | 1 | 3 |
| Bottoms / Jeans | Blue | 3 | 1 | 3 |
| Bottoms / Shorts | Green | 3 | 1 | 3 |
| Bottoms / Skirt | Purple | 3 | 1 | 3 |
| Dresses | Pink | 3 | 1 | 3 |
| Outerwear / Jacket | Orange | 3 | 1 | 3 |
| Shoes / Sneakers | Yellow | 3 | 1 | 3 |
| **TOTAL** | | **21** | **7 (33.33%)** | **21 (100%)** |

This deliberately difficult, prepainted set is NOT representative real garment photography. It measures a **controlled color rule behavior**, not clothing-recognition accuracy, neural classification accuracy, actual shoe/shorts/skirt distinction, real-photo segmentation, lighting generalization or likely production accuracy. No real licensed photographs were opened or newly inferred on. All 21 source pixel arrays remained byte-identical.

The distinct previous PR #234/#226 native inference report was **47/56 correctly classified garment categories (83.93%)** plus three correctly rejected nonclothing controls in its separately verified artifact. That evidence and the old 43/56 historical metadata were not rerun with this color prototype. Do not present either historical cohort as a new before/after on this branch.

## Existing regression and browser verification

- tests/shadow-corroborated-original-color.test.mjs: 7 garment hue families across light, shadow, masked contrasting background; low light without source anchor abstention, real dark clothing, conservative white-vs-gray, multicolor pattern review, transparent contamination, high-resolution byte preservation, invalid input, core category/type/color requirements and no mutation of user-edited records.
- scripts/test-shadow-original-color-mobile.mjs: Generates genuine synthetic Canvas JPEG of a red garment on bright blue background with deep shadow; decodes via browser native JPEG decoder; passes original RGB data and bounded garment mask to unchanged PhotoColor.family and the research module. On Chromium and WebKit mobile-like 320/390/430px viewports, existing palette returns Black and the research module returns Red. Verified same full original pixel bytes, positive shadow corroboration, unanchored shadow refusal, exact subtype left Unknown, zero page errors, zero external requests, and no horizontal overflow. Headless viewport browser is NOT a real Android/iOS phone.
- .github/workflows/shadow-original-color-no-deploy.yml: Builds current main app unchanged, checks public/, benchmark/ and supabase/ trees are byte-for-byte unchanged relative to main, runs all root Node tests and browser cases and reports the deterministic per-category comparison. No deployment.

Exact final passing workflow URL, commit SHA and test counts are supplied in GitHub PR and issue handoff.

## Remaining risks and next steps

1. Requires a verified mapping between item, original source SHA, Auth owner, category, crop box and segment mask supplied by upstream original-photo work PR #249 and #233. The research module does not independently authenticate the user or discover garment contours. A wrong region/mask can give a confident wrong color.
2. Colored indoor lighting and casts, faded textured fabric, strong specular highlights, complex multicolor patterns, jeans/black, white/gray, fabric texture, realistic saturation clipping and background fragments need an **independently annotated, licensed real-photo test cohort** to validate. The current result is limited to constructed colors.
3. The conservative low-light abstention is intended to avoid fabricated colors but may create extra user confirmation. Need per-category precision and review-rate measurement on diverse sources.
4. Does not improve FashionCLIP/model category or subtype classification, auto crop contours, photo storage resolution, timeouts, duplicates or phone-specific handling. Those already have separate PRs and tests. The full root tests include their existing behavior.
5. No production adoption until reconciliation with PR #234 subtype release gate, PR #249 source routing and PR #233 cloud SHA, user-edit preservation, two-account Auth/IndexedDB and physical phone tests. Main Closet Current chat retains integration and release decisions.

**Disposition: completed independent original-color safety implementation and synthetic tests. Release/integration HOLD. No merges, deployments, customer photos, paid AI, account changes or Drive Duel modifications.**
