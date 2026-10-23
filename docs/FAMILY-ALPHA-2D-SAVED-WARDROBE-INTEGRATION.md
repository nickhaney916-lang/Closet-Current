# Family Alpha v0.1 — Saved Wardrobe → Layered 2D Avatar

**Status:** Isolated research adapter, NOT integrated with the live app. Do not merge/deploy without review. Family Alpha issue #255, stacked on draft PR #258 (which itself depends on draft PR #256). PR #257 and parallel Auth Work #12 remain untouched.

## Verified existing Closet Current data contracts

- Existing garment records are private to the current IndexedDB handle, with `item.id`, `item.category`, `item.image` (often a crop), optional `item.originalPhoto.image` (app-retained full outfit), optional `item.outfitSourceId`. Normal saved items do **not** carry a canonical `accountId`.
- Existing saved Outfit Builder records use `board.slots.top`, `bottom`, `shoes`, `layer`, `layer2`, `layer3`, and optional accessory slots `bag`, `accessory`, `finish`.
- **Dresses are stored in `board.slots.top`**, not a native `board.slots.dress`. Adapter maps a top item with `category==='Dresses'` to the 2D `dress` slot, and refuses conflicting bottoms or jacket/layer.
- An `originalPhoto.image` is the earliest *app-retained* image for outfit captures; it is not proof of original HEIC/raw native camera bytes. Fingerprint the app-retained original, not the cropped display image.
- Actual 2D renderer uses preloaded, already-masked `HTMLImageElement` inputs and slot planner; not a live authorization or mask provenance engine.

## Added independent adapter

`public/family-alpha-2d-saved-board.mjs` provides:

- `fingerprintAlphaRetainedOriginal(jpeg,cryptoProvider)`: SHA-256 of decoded app-retained JPEG bytes (marker screening only; does not establish a valid visual decode or nonblank image).
- `identityForSavedGarment(item)`: local item ID plus optional capture group; changes to the source grouping invalidate the old presentation binding.
- `prepareSavedBoard2D({board,items,presentations,getContext,cryptoProvider})`: rejects duplicate/deleted/mismatched items, incorrect slots, dress incompatibilities, incomplete or changed context, missing/foreign/unapproved transparent images, and changed original-source SHA. Does not fetch or persist image bytes, customer identities, tokens, or URLs.
- `renderSavedBoard2D(container,options)`: clears old avatar immediately, validates first, delegates to existing verified 2D renderer, and rejects superseded/stale operations without erasing a newer preview.

The `presentations` map, supplied only by an upstream authenticated and validated photo/mask pipeline, must have for each selected item:

```js
{
 itemId, ownerId, sourceIdentity,
 sourceVersion: 'sha256:<original-retained-JPEG-hex>',
 approved: true, // upstream mask review, not security proof
 image: decodedTransparentMaskedImage // HTMLImageElement, not a URL
}
```

The live `getContext()` callback must provide `authenticatedUserId`, `currentUserId`, `cloudOwnerId`, `indexedDbName`, and a monotonically incrementing `sessionGeneration`. The generation must change on every account switch/logout or source-scope replacement. The adapter re-reads it around each async SHA operation and before rendering. These checks protect against accidental stale-account use; **caller-supplied context fields do not verify Auth or Supabase RLS**.

## Security and source-fidelity conditions before integration

1. **Authenticated ownership is upstream and mandatory.** The caller must read from an actual authenticated user's private IndexedDB/cloud session, enforce Supabase Auth/RLS and private bucket access, and prevent cross-account data from entering `items` or `presentations`.
2. **Transparent images must come from the exact decoded saved source.** A matching caller-provided hash is insufficient to establish that the opaque image really comes from the JPEG. Confirm source-to-decoded-frame-to-mask chain, reject blank/corrupt photos, and evaluate real complex-background masks upstream.
3. **Photo change invalidation** must propagate across source ID, source version, mask generation and account switch; digest comparison in adapter catches changes of original bytes even if the cropped preview remains identical.
4. **Real hardware and UX remain unverified.** Browser emulation does not prove iOS/Android camera, physical fit or rendering parity. Do not imply real drape, garment back/sides or body measurements.
5. **Don't turn this directly into a live app button** until authenticated source/mask ownership and account-independent cache invalidation are independently verified.

## QA

- Node regression includes actual saved-board schema and dress mapping; strict source/crop mismatch, source group mismatch, duplicate/foreign items, stale mask, account-switch inside async fingerprint, no direct image URLs, and stale render concurrency.
- Chromium/WebKit mobile synthetic fixture checks actual rendered four-layer saved outfits, saved-dress mapping, invalidation when original changes, and account-switch blanking at 320/390/430px.
- All test assets are generated in memory; never use customer photos, cloud, auth tokens, paid AI or external requests.

**Release disposition:** HOLD. Review integration and security gates under #255; main Closet Current conversation owns merge, staging, physical-phone validation and deployment approval.
