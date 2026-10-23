# Issue #230: verified source-to-avatar mapping audit

Scope: static source review of the repository default branch, **not** a live customer account or staging session.

## Confirmed application contracts

- `public/outfit-board.js`: `currentBoard.slots` contains slot names mapped to saved `item.id` values. The saved boards are `savedOutfitBoards`. `renderOutfitBoard` looks up pieces using `items.find(x => x.id === currentBoard.slots[slot.id])`.
- `public/closet-stylist-engine.js`: the recommendation engine produces up to three candidates with `candidate.board.slots`. Dress candidates suppress bottoms and optional layers.
- `public/app.js`: `saveIndexed` persists normalized item values to the IndexedDB `items` store. Some multi-garment captures attach `recognitionPhoto`, `originalPhoto`, `outfitSourceId`, and `cropBounds`. The fields are not proven mandatory for every item.
- `public/cloud-backup-bridge.js`: the bridge starts `window.closetCloud` and restores indexed items through `readAll()`. This file does not expose a verified account ID to the renderer.

## Explicitly unverified

- The authoritative account scope and exact per-item ownership assertion at the cloud boundary.
- Whether every original garment has a stable original-photo identifier (rather than only an image data URL).
- A universal verified six-digit hex garment color. The UI currently uses human-readable `item.color` values; converting these to hex must be verified.
- Original-photo source version invalidation and image hash guarantees.
- Real dress, outerwear, fabric geometry and unseen surfaces.

## Consequence

`public/outfit-3d-board-bridge.mjs` is deliberately **fail-closed**. It requires caller-supplied, verified `accountId`, `colorHex` and `sourceIdentity` metadata, which are **not** assumed to exist on live item records. Its synthetic tests verify refusal behavior, not real-cloud compatibility. Do not wire it into `renderOutfitBoard` until the actual authenticated cloud contract and original-photo identity/version are independently verified.

## Release decision

Remain research-only. Preserve existing 2D outfit functionality. No customer photos, network inference, production writes, merges or deployments.

## Additional verified cloud-auth documentation

- `public/auth.js` exposes `window.closetAuth.user` and `getAccessToken()`, with refresh logic checking that the refreshed user ID matches the original session account. This is a client-side account context, not a substitute for server-side RLS enforcement.
- `docs/CLOUD-BACKUP.md` documents owner-keyed `closet_backups`, a private `closet-private` bucket, and photo paths composed of an account UUID plus SHA-256 content hash. It reports synthetic tests of RLS, private photo access, and backup restoration. These are documented prior results, not tests rerun in this branch.
- This existing content hash may provide a provenance version, **but only if the original full-resolution photo object and its immutable hash can be unambiguously mapped to each saved garment**. A hash of a crop or resized JPEG is not interchangeable with the original-byte hash. No live integration is authorized without checking that mapping and cloud account identity.
- The offline `fingerprintOriginalPhoto` helper hashes the exact bytes provided; differences in JPEG encoding, resizing, or metadata can change its hash even when the image looks identical. Its result is not automatically equivalent to the cloud storage path hash.

## 3D renderer handoff contract (offline only)

The current `mapBoardSlotsTo3D` returns `{colors,selected,hasDress,placeholderOnly:true}`. `colors` contains normalized RGBA placeholder values keyed by `top`, `bottom`, `shoes`, and `layer`; `selected` contains slot, saved item ID, verified original-source ID and version, category, and `unseenSurfacesEstimated:true`. The adapter does **not** produce meshes, UV maps, material textures, clothing geometry, body measurements, or photorealistic try-on.

For a future renderer handoff, require the signed-in account identity, a consistent saved-board snapshot, immutable original-photo source mapping, and a verified color/category conversion. Do not treat `item.image` or `colorHex` as proof of original-photo ownership. Re-run preparation when any original photo or wardrobe item changes, and discard cached recommendations if verification fails. A restored saved outfit must resolve all garment IDs against the same verified account-scoped collection.

The live app's existing `item.color` text, original-photo storage fields, and authentication lifecycle still require a deliberate mapping; do not silently substitute synthetic `accountId`, `originalPhotoId`, `originalSourceVersion`, or `colorHex` fields as though they already exist on production records. The independent 3D avatar assignment may consume the offline output contract for prototype tests but should not integrate live account data until those mappings are verified.

## Source-line reconciliation against main (October 23)

- `public/app.js` creates multi-garment entries with `outfitSourceId`, `segmentHint`, `recognitionPhoto`, `originalPhoto`, and related crop metadata (around line 161). This provides a likely shared-source association but does not by itself prove immutable original bytes or authenticated ownership.
- `public/app.js` recognition calls use `item.recognitionPhoto?.image || item.image` (around lines 328, 338, 405), so the current inference input can be a recognition photo or garment preview; **original-photo-first classification is not proven** by those call sites. Recognition improvements belong to parallel assignment #233.
- `public/outfit-board.js` resolves `currentBoard.slots[slot.id]` to `items.find(x=>x.id===...)` (around line 31), and saved outfits are cleaned against current items during restoration (around lines 67 and 106). Thus the 3D bridge's ID-based slot mapping matches the existing board structure, but original-source version invalidation is an additional safeguard not yet connected to live restoration.
- Existing `originalPhoto` and `recognitionPhoto` fields must be inspected for exact data types, persistence, and cloud serialization before any live byte hashing. No assumption that `originalPhoto` is an immutable byte array is justified.

## Image representation confirmed from camera and capture call sites

- `public/app.js` `snap()` (line 155 on inspected main) downsamples a camera frame to a **maximum 2048-pixel dimension** and serializes it as `canvas.toDataURL('image/jpeg', .94)`. This is a JPEG data URL, not raw sensor-original bytes; provenance must describe this captured representation accurately.
- `candidate(image,options)` (lines 157–163) stores the garment preview in `item.image`; for multi-garment captures it copies `options.originalPhoto`, `options.recognitionPhoto`, `options.outfitSourceId`, and `options.cropBounds`. The exact shape of those option values is not established by these call sites.
- `public/cloud-backup-bridge.js` (lines 1–9) waits for local closet and board initialization, then starts `window.closetCloud.start` and refreshes local items/boards after restore. This bridge does not itself demonstrate which image fields are uploaded as independent cloud objects.
- Consequently the offline SHA-256 helper should **not** be connected to `item.image` as if it were the untouched original. A future integration must explicitly identify the original capture data URL or immutable cloud object, decode its bytes once, and consistently compare hashes of the same representation.

## Verified multi-garment originalPhoto construction

- `public/outfit-capture.js` `startOutfitSplit(image,sourceId=crypto.randomUUID())` receives a common source image and source ID, sends the image to `outfit-worker.mjs`, and, for each returned piece, calls `candidate(p.image,{outfitSourceId:sourceId,recognitionPhoto:p.recognitionPhoto,originalPhoto:{image},cropBounds:p.cropBounds,...})` (around lines 14–38). Thus **multi-garment `originalPhoto` is an object containing an `image` JPEG data URL**, and the shared `outfitSourceId` is a UUID per split invocation.
- `readOutfitPhoto(file)` converts uploaded images with `photoToJPEG(file,{maxDimension:3072,quality:.94})` before splitting. Consequently the preserved outfit source is the app's normalized JPEG representation, **not the untouched uploaded file bytes**. A camera source may be separately constrained to 2048 pixels.
- The worker returns cropped `p.image` as the garment preview, separate from the common `originalPhoto.image`. Hashing `p.image` would not prove identity of the original outfit source.
- Remaining gap: inspect cloud serializer and restore for nested `originalPhoto.image` to determine whether the source JPEG survives cloud backup unchanged or is transformed/omitted. No live source fingerprint can be claimed before that verification.

## Cloud serialization and restoration of nested original source: verified

- `public/cloud-backup-engine.js` implements recursive `mapImages(value,map)` across arrays and nested objects, transforming every nonempty string property named `image`. Therefore a garment's `originalPhoto:{image:<JPEG data URL>}` is included alongside `item.image` and `recognitionPhoto.image` in the cloud serialization traversal; this is not limited to top-level previews.
- `public/cloud-backup.js` `encode()` converts those JPEG data URLs to bytes and names each private object `<authenticated user UUID>/<SHA-256 of bytes>.jpg`. Repeated identical originals deduplicate by object path. `decode()` downloads every referenced image, verifies SHA-256 against the path, and reconstitutes JPEG data URLs before applying the restored document.
- This establishes **byte-level preservation of the normalized JPEG source across cloud encoding/restoration when the source is present and valid**, not preservation of untouched sensor/upload file bytes. It does not establish that all legacy garments contain `originalPhoto.image` or that original-photo provenance fields are present on every saved item.
- The adapter still requires an explicit trusted mapping from authenticated user and actual `outfitSourceId`/`originalPhoto.image` to synthetic verification fields. Existing cloud object hashes are content identities; they do not alone prove that a particular garment's source association is semantically correct.
