# CLOSET CURRENT — 3D-68: Real Saved Closet Index → Real 3D Slot Contract

**Starting point:** isolated draft 3D67 PR #478 exact head `5afd00f4247f78b696410368b1e4124a2bc5df1b`. 3D67 dedicated original 360° 163-joint humanoid CI is independent. **Do not touch PR #477 or production.**

## Why this is the next priority
The user's central product differentiator is not a 3D avatar by itself: **genuine original clothes photos → accurate local AI category/type/color → corrections → private indexed closet → movable actual-garment 3D outfit slots → 3 existing-clothes combinations and individual swaps**. Saved real Closet Current records use `id,image,category,itemType,color,userAdjusted,colorSource,indexedAt,confirmedDetails,originalPhoto,outfitSourceId`. The current 2D outfit board uses `top,bottom,layer,layer2,layer3,shoes,bag,accessory,finish`, not the simplistic `shirt,pants,dress` model. The adapter must translate rather than invent new user data.

## Implemented
`research/three-d-68/saved-closet-3d-adapter.mjs` consumes an explicitly authenticated account-scoped read of already saved wardrobe records. It checks account owner and current session generation **both before and after async local hashing**, derives a SHA-256 of the stored original JPEG **without uploading the photo**, distinguishes individual garment instances from a shared multi-garment original photo `outfitSourceId`, and requires meaningful user-confirmed category, subtype and color. It rejects estimated-only color, ambiguous types, ownership questions, duplicate records and cross-account items.

The adapter produces a metadata-only, no-photo `planIndexedBoardToAnatomical3D` for actual existing 2D board slots; rejects category/type mismatch, reusing one item in multiple slots, dress over pants/layers and floating extra layers. `swapRealBoardGarment` changes one selected piece. `previewExistingThreeSuggestions` validates exactly three pre-existing stylist-generated selections **without generating or inventing clothes**. It never calls a network or storage service, modifies live DB/auth, or falsely labels any photographed source as a fully verified movable 3D mesh.

**Privacy boundary:** this bridge is *not* an authentication service or RLS replacement. Only call it after `window.closetAuth.ready`, verifying `window.closetAuth.user.id`, taking the user's own already-account-scoped `readAll()` records and the latest `getSessionGeneration()`; on sign-out, new account, crop/source mutation, or session-generation mismatch, discard all previous indexed metadata and start over. The caller must not trust a raw client-supplied owner ID. No actual family photos, production or staging touched here.

## What this does NOT claim
- Existing photos magically become 3D wearable meshes. Genuinely fitted mesh photo/UV/pose contact requires the separate licensed source garment pipeline and human visual acceptance.
- Stored single-item JPEG is bit-identical to the camera's original sensor file; the existing app may sanitize EXIF and compress images before storing. `sourcePhotoOriginal` here means **the original saved captured JPEG selected for recognition**, not an immutable physical camera sensor RAW.
- The 3D67 preview is now connected to authenticated user records or the cloud database; this isolated metadata adapter is a tested precursor, not production deployment.
- Human 10/10 quality, physical Android/iPhone acceptance, 3D66 photorealistic drape, or Family Alpha #255 release.

## Release gate
Strict no-deploy research CI; zero private photos in fixtures; no AI inference cost; correct customer account isolation; original stored JPEG SHA; no source leakage or invented reconstruction; 3D mannequin and clothing remain distinct components. Family Alpha remains HOLD.

### Complete nonproduction app handoff (existing auth + readAll contract)
The separate `research/three-d-68/account-bound-closet-3d-bridge.mjs` consumes the **actual existing** `window.closetAuth.ready`, `user.id`, `getSessionGeneration()` methods and a read-only callback for the already owner-scoped `readAll()` data. The entrypoint forces session freshness before reading, again before hashing, again after hashing, and before each saved outfit plan, three owned outfit suggestions, or one-piece swap. The caller must already have authenticated account-bound storage isolation. If the user logs out or changes account, discard that bridge instance immediately and never reuse old plans.

This is a **code-complete research adapter, not a live deployment or a guarantee that already-stored photos are authenticated by themselves**. A fully integrated user experience requires a separately authorized account-bound UI wiring milestone and genuine photographed 3D meshes; no full 3D photo reconstruction is claimed.
