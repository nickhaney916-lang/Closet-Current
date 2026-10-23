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
