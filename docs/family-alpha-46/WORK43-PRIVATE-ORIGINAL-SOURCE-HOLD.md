# Family Alpha #46 — protected original-garment JPEG handoff in actual Work #43 offline styling (HOLD)

**2026-10-27 · main-thread independent stacked source fix, base Work #43 draft #347**.

## What was corrected

The first Work #43 integration used `item.originalPhoto?.image` for multi-item captures. In Closet Current, `originalPhoto` holds the *entire source scene* (potentially a person wearing several pieces), while `recognitionPhoto.image` is the *unmasked JPEG of the particular segmented item*. `item.image` can be a derived background-removed PNG. SHA hashing the wrong entire scene does not make it the correct garment.

This **separate development branch does not change Work #43's branch**. It extends that offline candidate only.

1. Import Work #45's verified `trusted-photo-source-boundary.mjs` into Work #43, preserving its actual source code and read-only private IndexedDB logic.
2. Inside the existing Work #43 `verified-board.mjs`, use the current authenticated owner, exact private database handle, current session generation, and the existing upstream `verifySession()`; do **not** trust UI-provided JPEGs, hashes, owner strings or worn approval.
3. Read the exact persisted item from the private `items` store by its selected ID. Use `recognitionPhoto.image` when present. If `outfitSourceId` exists but the original unmasked crop is unavailable, report **REVIEW REQUIRED**, never use `originalPhoto.image`, an entire scene/person, or a generated display cutout. Ordinary single items can use `item.image` as the original. No new photo storage or copies in the database.
4. Recompute SHA-256 on the current saved source bytes. Feed frozen JPEG blobs to Work #42's unchanged `evaluateOutfit` via its existing `createPhotoBoard`. Bind its `getContext` to both current account/session and the existing Work #43 full-wardrobe guard, so account changes or detected wardrobe mutations clear/deny the presentation.
5. The existing source-pinned `build-work43-photo-board-hold.mjs` now copies the trusted boundary module and supplies `getDatabase:()=>db`, `readContext` and `verifySession` from the *already protected* offline boot. No new Auth protocol or RLS rules were invented.

## Testing and honest acceptance

- `tests/work43/source-attested-board.test.mjs` includes eight previously verified Work #45 synthetic private-IndexedDB cases plus an explicit check of the full Work #43 compiled boot wiring. This is a reference-level/fake-auth test, **not four signed-in people or a live JWT/RLS audit**.
- The dedicated **no-deploy** CI rebuilds the exact Work #344 full source-pinned Family Alpha candidate, overlays Work #43, and tests the *actual compiled synthetic* three-outfit UI, swaps, favorites and atomic-save recovery on Chromium/WebKit at 320, 390, and 430 pixels. The original avatar, recognition worker, masks, clothing records, camera, cloud and Auth assets are unchanged.
- Work #43 [CI #40564867135](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40564867135) demonstrated its six synthetic browser journeys pass, but its separate 390px licensed-photo test fails to generate three meaningfully distinct looks for the supplied fixture. This branch **does not bypass or certify that licensed-photo diversity/visual test**; Work #43 still owns it and the required real-photo PASS/REVIEW/FAIL.
- The real clothing presentation is still **REVIEW**; draping/compositing experiments are incomplete/FAIL and zero licensed cutouts are owner-approved. Work #37 fitting, #38 isolation, #41 compositing and #42 visualization research are not modified.

## Restrictions

No merge, staging or production deployment, account creation, Supabase/Cloudflare/Resend changes, personal or family photos, paid API, costs, Drive Duel edits, new Work assignments or automatic Family Alpha release. Four live distinct JWT sessions with RLS, real physical Samsung+iPhone photos and actual human visual acceptance are still required. **FAMILY ALPHA HOLD.**
