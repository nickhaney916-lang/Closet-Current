# Family Alpha #19 — Style My New Clothes / Pinned Outfit Quality

**Independent draft only, no deployment. Family Alpha issue #255. Release HOLD.**

## Existing implementation reviewed

Stacked on main integration candidate PR #271 at exact commit 703881baafbe883a28ba2de3543bad2d5f0b2467. PR #268's local-only Outfit Builder/photo-avatar integration is inherited, not modified. PR #273 handles staging Auth; parallel #18 owns camera capture. No other branches were changed.

The actual Closet Current stylist has existing category/season/occasion profiles, color harmony, and saved board slot rules. Its default three outfits are distinct by saved IDs but do not require a selected newly photographed garment, and may differ only slightly. The current shipped outfit form has no pinned "Style My New Clothes" journey. Existing #15 and #242 work owns ordinary three-outfit/swapping and lifecycle QA; this task reuses that logic rather than replacing it.

The actual saved wardrobe contract uses item ID, category, indexed type/color/pattern/seasons, originalPhoto.image, cropped image, and optional source group. Outfit boards select actual IDs in top, bottom, shoes, layer2. Dresses disallow conflicting bottoms/layers. Short and long sleeves share top; skirts and shorts remain bottom. There is no retailer-specific inventory.

## Isolated implemented candidate

research/family-alpha-19/style-my-new-clothes.mjs exports createStyleMyNewClothes and diversityScore. It injects the real stylistItemScore, stylistHarmony, cleanOutfitBoard and existing #15 atomic swap validator. It does not fetch products, use paid AI, modify runtime UI, touch avatars, or persist photos.

1. New garment must already exist in the owner's saved wardrobe. Pin it to top, bottom, shoes, or layer2. Context-incompatible pins yield zero complete outfits and a specific explanation, not a silent replacement.
2. Bounded deterministic combinations use only owner-scoped saved garment IDs and the current stylist's category, season, occasion, and color/pattern scoring rules. Required slots: top plus shoes plus bottoms except a dress. Dress removes all conflicting layers.
3. Select up to three looks with at least two changed NONPIN visual slots between separated outfits; a pinned dress needs a shoe change because it cannot use a bottom or jacket. Duplicate original-JPEG photographs do not count as separate visual combinations. Fewer than three valid combinations are explicitly reported.
4. Preserve original SHA-256, crop SHA-256 and garment/source group with each referenced saved ID, bound to owner context. Guard against concurrent owner/epoch/wardrobe/source changes before returning or swapping; invalidate cancels older operations.
5. Atomic one-piece swap preserves all other clothing IDs and protects the pinned garment. A dress transition is structural, not silently treated as a one-piece swap. Invalid swaps never modify saved clothes.

**Important:** This research helper is NOT wired into the live app. Calling code must still provide authenticated owner scope and independently authorized photo provenance before any user presentation. These checks do NOT prove actual Supabase RLS.

## Repeatable synthetic benchmark matrix

| Case | Acceptance criterion |
| --- | --- |
| Teenager, adult, limited and varied wardrobes | Saved clothing IDs only; no invented clothing |
| New shirt and new pants | 3 pinned complete looks when enough compatible alternatives exist; >=2 nonpin slots differ |
| New dress | Pin to dress; shoes vary; no conflicting bottoms or layers |
| New shoes | All 3 contain the chosen shoes; alternate top and bottom |
| New jacket | All 3 contain pinned outer layer, base outfit changes |
| Casual/school/work/dinner/athletic, seasons | Source stylist compatibility, no inappropriate substitution |
| Missing or small wardrobe | 0–2 valid complete alternatives with explicit reason |
| One-piece shirt/bottom/shoe/outerwear swap | Only designated slot changes; new garment stays pinned |
| Modified original/crop, deleted item or stale source group | Existing recommendation invalidated |
| Duplicate ID/photo | Reject duplicate ID; no fake diversity from one identical original |
| Wrong owner, rapid switch, delayed hash operation | Reject source and do not return foreign/stale result |

Node test matrix: four fictional owner UUIDs × five new-item categories, plus independent case tests for source replacement, cross-account changes, insufficient wardrobes, pinning and swaps.

Browser fixture: Chromium/WebKit at 320/390/430 pixels using code-generated photographs JPEG-encoded and browser-decoded, preview cards, real closet stylist functions and photo source checks. Run the prior #15 Chromium/WebKit photo-avatar browser tests unchanged as additional regression. No actual personal images, network uploads or physical-device QA.

The slot-difference threshold is a clearly defined synthetic diversity proxy, NOT empirical fashion quality or real-world wardrobe recommendation accuracy.

## Pending integration and release gates

- Main chat must decide how to expose one minimal "Style this new piece" control after capture/import or in My Closet, then show three owned-look cards and swaps within the existing Outfit Builder. Avoid extra retailer screens.
- Approved saved-source-to-mask provenance, real account-scoped Auth/RLS, protected private staging, stale avatar clearing, account/photo deletion policy, and minors' privacy still require separate integration/approval.
- Independently labeled real fashion/garment holdouts, actual Family Alpha photography, physical Android/iPhone tests, and approved four-owner staging verification remain NOT VERIFIED.
- No merge, deployment, production/Supabase/Cloudflare setting change, paid AI, customer account/photo access or Drive Duel modification.

**Release status: HOLD.**