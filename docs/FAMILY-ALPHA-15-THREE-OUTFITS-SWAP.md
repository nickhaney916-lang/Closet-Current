# Family Alpha #15 — three complete saved outfits & 2D one-piece swap (independent QA)

**Release gate: HOLD.** Assignment #15 is not a production implementation, merge or deploy authorization.

## Exact development boundaries

- QA branch: `qa/family-alpha-15-three-outfits-swap-20261023`; stacked on unchanged PR #260 commit `b2502eb9fccff7241736e12c25350c933371e3ad`. PR #260 is stacked on PR #258, then PR #256. PR #257 photo-mask research, PR #259 feedback and PR #242 lifecycle work remain untouched.
- Real code paths exercised: `public/closet-stylist-engine.js`, `public/outfit-board-engine.js`, `public/family-alpha-2d-saved-board.mjs`, `public/family-alpha-2d-layer-plan.mjs`, `public/family-alpha-2d-photo-renderer.mjs`. Real main saved data contract: `items[].id/category/itemType/image/originalPhoto.image`, and `board.slots.top/bottom/shoes/layer/layer2/layer3`.
- `research/family-alpha-15/three-outfit-validator.mjs` **only validates** three actual generated recommendations, makes isolated atomic *validation-model* one-piece swap boards, and explicitly handles structural dress transitions. This does **not** replicate or replace PR #242's ranking/lifecycle engine.
- Node fixture uses deterministic synthetic JPEG boundary payloads for SHA/identity without claiming they are decoded photos. Browser fixture separately creates **actual decoded synthetic JPEG original photos** and PNG layers containing JPEG-derived fabric RGB and recognizable geometric pattern details; it never loads a customer's photo.

## Operation/garment matrix

| Operation | Expected validated behavior | Scope |
| --- | --- | --- |
| Generate 3 looks | 3 nonidentical complete wardrobe ID combinations from actual stylist, no shopping placeholders | Node + Chromium/WebKit |
| Select look 1 / 2 / 3 repeatedly | Each layer corresponds to current board slot ID; no cross-look mixing | Node + browser |
| Shirt A → shirt B | Only `top` changes, other visual ID slots unchanged | Node + browser |
| Jeans → shorts | Only `bottom` changes; native mask aspect kept | Node + browser |
| Jeans → skirt | Only `bottom` changes | Node + browser |
| Sneakers → loafers | Only `shoes` changes | Node + browser |
| Jacket → coat | Only `layer2` changes | Node + browser |
| Separates → dress | **Structural** transition: saved `top` becomes dress; incompatible bottom/layers explicitly removed; shoes preserved | Node + browser |
| Dress conflict | Dress plus bottom or outerwear rejected, not silently displayed | Node and prior PR260 checks |
| Missing/duplicate/invalid ID | Fail-closed; original board and wardrobe unchanged | Node |
| Missing/foreign/unapproved mask | No avatar and no invented substitute | Node + browser |
| Original JPEG changed under same crop | Previous prepared mask fingerprint refused | Node + browser |
| Crop changed but original unchanged | Original fingerprint remains associated; **this alone does not prove crop presentation freshness** | Node |
| Cross-account request | Foreign owner presentation rejected and stale avatar cleared | Node + browser |
| Out-of-order async operation | Older pending render cannot overwrite a newer approved outfit | Node/parent PR260 + browser |
| Aspect/pattern/original identity | Browser checks actual decoded saved JPEG-derived transparent PNG, raster detail, per-layer source URL, DOM bounding box aspect | Browser |

## Known limitations and integration findings

1. **HIGH — Real authorization still not proven.** SHA-256, account UUID matching and caller-supplied approval flags are a client-side gate, not Supabase Auth/RLS or actual prepared-mask ownership proof. Four separate protected accounts and real-device sign-out must be tested by the main conversation.
2. **HIGH — No production integration.** PRs #256/#258/#260 remain research branches; this harness does not wire generated outfits or swaps into the shipped app. Existing customer UI does not automatically inherit these QA protections.
3. **HIGH — Real photo-segmentation fidelity unknown.** Synthetic masks are derived from preprogrammed silhouettes and decoded JPEG pixels. Real garment shapes/backgrounds, overlapping outfits, alpha edges, face/privacy regions and image reuse still need independent validation. Do not call synthetic tests physical-phone readiness.
4. **MEDIUM — Original vs crop provenance.** PR #260 binds its approved layer to app-retained original SHA-256 and source identity, but does not hash the current crop. A crop-only change that keeps the original and approved mask unchanged is accepted. If the crop changes the intended garment or mask, the main app must version the derivative, not silently re-use a stale presentation. PR #242's broader lifecycle versioning is separate and should be reconciled.
5. **MEDIUM — Structural dress transition.** The existing `cleanOutfitBoard` removes incompatible bottoms and layers. This should be a clearly labeled whole-outfit transition with undo/confirmation, not falsely reported as a one-piece swap keeping all other IDs.
6. **MEDIUM — Current styleOwnedCollection handles duplicate ID arrays by deduplicating instead of blocking** within its ranking. The independent validation refuses duplicate saved IDs; the main app should ensure unique IDs before ranking/persisting.

## Integration interface and release advice

- Main conversation: consume real styleOwnedCollection output, require `validateThreeOutfits` **only when 3 complete results actually exist**, and show honest partial/empty state otherwise. Never fabricate a third look.
- Reconcile PR #242 verified wardrobe lifecycle with PR #260 `prepareSavedBoard2D` source checks before enabling save/swap UI. In particular, fix derivative/crop version pinning as a distinct gate; keep original JPEG source of truth.
- For a valid one-piece swap, compute a new candidate board and reauthorize/refingerprint the selected source before committing. On any failure, preserve wardrobe and show clear recoverable error; do not substitute plain-color art.
- Render only approved prepared transparent images via PR #258's `contain` geometry. Hide/clear stale avatar immediately on account switch or source invalidation.
- After CI, main conversation to perform actual signed-in private 4-account pilot with physical Android/iPhone captures, masks, stored wardrobe, three complete looks, shoes/skirts/layers, dresses and swaps. Only main owner approves integration and staging.

**Execution:** `node scripts/build.mjs && node --test tests/*.test.cjs tests/*.test.mjs`. Browser: `node scripts/test-family-alpha-15-browser.mjs` with Playwright Chromium/WebKit. CI is no-deploy, repository-scoped, and publishes only synthetic JSON test observations. Exact verified pass counts and CI run URL are recorded in the draft PR/issue after checks finish.
