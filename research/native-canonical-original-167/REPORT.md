# Closet Current — MAIN Priority #167: Native canonical original-photo capture + human-reviewed private closet + Style My New Clothes

**FAMILY ALPHA #255 HOLD · Draft unmerged isolated integration only · NEVER modify production, existing staging, live owner accounts or cloud, Delta Ebb or Drive Duel · NEVER deploy.**

## Starting references and ownership isolation

This is a direct isolated child of the full-application Work [PR #719](https://github.com/nickhaney916-lang/Closet-Current/pull/719) verified exact HEAD `0eaa99fe1e1a07b253a4ef2b1b5a0dc7192a2a00`. No edits occur on that active full-app Work branch, the parallel photo-fabric research [PR #722](https://github.com/nickhaney916-lang/Closet-Current/pull/722), or previously verified main P166 [PR #724](https://github.com/nickhaney916-lang/Closet-Current/pull/724) (research SHA `6eee1ea4c7611d24215105181a7af2d2809c50c2`).

P166 proved the canonical original JPEG/PHOTO119 atomic save + P165 real photo-only style in an ephemeral research checkout. P167 promotes this functionality **only on its own isolated unmerged app branch** into the everyday camera/gallery/review/Style My New Clothes interface, **without query parameters**.

## Actual implementation

- `public/app.js` in P167's branch enables canonical JPEG source capture for real camera frames, video-frame capture and photo file picker through the existing native handlers. An unproved plain candidate cannot silently masquerade as an original source. Existing human review UI explicitly requests separate confirmation of clothing category/type/color and whether it is a single garment or specific separated instance. No checkboxes are preselected.
- The prior capture/review research code could not be built as a standalone app because the normal build copies only `public/`; importing `../research/...` at runtime would fail in deployed `dist/`. P167 copies four verified and pinned code modules into `public/` with only corrected relative imports: exact original photo capture and SHA source; indexing/owner identity; owner-private wardrobe index; and PHOTO119 transactional owner-review commit. **The normal `scripts/build.mjs` must prove these actual files exist inside `dist/`**. No cloud or gallery writes are added.
- A copy of the P166 owner source-SHA 2D preview module is bundled and strengthened for actual **asynchronous saved IndexedDB reads**. Owner/session epoch and database scope are checked before and after original SHA and saved-closet verification. Unreviewed original photo, replaced original JPEG or logged-out owner fail closed.
- `public/closet-stylist.js` mounts **"See saved photo (2D)"** on each real owned styling card, automatically and without research flags. A stale render/session has its previous controller disposed; saving or swapping owned outfits remains unchanged. Explicitly disclose that the new blouse was NOT automatically fitted onto the humanoid in 3D.
- On the actual unmodified app HTML URL, independent CI drives the original **Choose clothing photos** input with a synthetic JPEG (not a privileged direct `candidate()` injection), then waits for the native review card, manually corrects category/subtype/color and explicitly checks both confirmation controls, saves a private indexed record and verifies the original raw byte SHA-256. It then selects the new blouse from My Closet, creates three owned looks, sees the **canonical verified original 2D** picture, saves one look, swaps one shoe, saves again and checks both outfits after reload.
- Chromium and WebKit browser acceptance at 320/390/430 CSS px (six cases) captures twelve genuine source-verified screenshots (six original 2D views and six outfit views), no fake 3D garment. All Node/app regression tests must pass independently.

## Required final acceptance

**P167 is IN PROGRESS until the exact current branch HEAD runs successful no-deploy GitHub Actions browser + full regression and the screenshot SHA audit completes.** The named CI workflow enforces exactly 11 narrowly scoped changed files from pinned Work719 source SHA. If CI or required original source checks fail, keep P167 incomplete and fix only on this branch.

## Strict limits

**This is NOT a release or final user-app completion.** CI camera photos and owner authentication are synthetic, browser viewports simulate mobile but are not physical Android/iOS devices, and no hosted two-account cloud/auth/RLS or real ML recognition accuracy is accepted. Existing 3D separate licensed research dress is NOT automatically the newly photographed blouse: real photo-to-3D reconstruction, realistic cloth drape and physical-device visual acceptance remain open independent gates. Copying approved research functions to an unmerged app branch is not deployment. Production and existing staging are unchanged, and Family Alpha #255 remains HOLD until independent release authority.
