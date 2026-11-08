# Closet Current — MAIN Priority #165: authenticated original garment photo preview with real 2D fallback

**FAMILY ALPHA ISSUE #255 HOLD. Research integration, not deployed, merged or staging-modified.**

## Important product boundary

Main [P164 PR #721](https://github.com/nickhaney916-lang/Closet-Current/pull/721), independently verified exact SHA `ecaa0827f2ecb75a9b745e5d761d3a790544b0b7`, proved that the fully integrated Work [PR #719](https://github.com/nickhaney916-lang/Closet-Current/pull/719), exact HEAD `0eaa99fe1e1a07b253a4ef2b1b5a0dc7192a2a00`, performs a real native browser workflow: synthetic camera JPEG → review/correction → private owner closet → three owned outfit suggestions → shoe swap → two saved outfits recovered on reload (six Chromium/WebKit phone viewport cases), while a **separately licensed original photographed research dress** survives 36 3D WebGL views. That acceptance **did not mean the new blouse was fitted onto either 3D figure**.

P165 adds a genuine, source-honest **user-facing owner-saved original 2D photo preview** for the new item on each styled outfit card, without ever borrowing the unrelated research dress or displaying a fictitious generic 3D garment. This is the complete fail-closed preview/fallback engineering slice, not a claim of completed realistic photo-to-3D reconstruction.

## Implementation

- `public/style-photo-preview-gate-165.mjs` is a small reusable, browser-compatible ES module. It is an additive handoff for the full-app Work owner (which keeps exclusive ownership of `public/app.js`, `public/closet-stylist.js`, and `public/index.html`). No existing product source or signed-in user account data is changed by this research PR.
- `createStyledOwnerPhotoPreview165` attaches accessible **"See original photo (2D)"** actions to *actual* 3 owned-outfit cards. The native app's real current saved garment/board state and signed owner session are injected, not independently invented. Clicking shows a photo whose original JPEG/PNG bytes are **SHA-256 reverified against the saved clothing item's source hash**, and displays "3D fitting is not yet verified for this garment. No generic garment has been substituted."
- The original source image is read from `originalPhoto.image` when available rather than an altered cutout. Saved image source metadata, owner's current signed epoch, actual IndexedDB-backed closet source record, and saved focused item in the owned outfit are rechecked after async hashing. On logout/closet mutation/dispose, previews and buttons are cleared. **No backend calls or automatic media mutations are introduced.**
- Rejected flows include cross-owner item spoofing, image/source SHA tampering, unverified source, logged-out or revoked owner session, source changed during asynchronous validation, missing saved garment or mismatched current owner.
- In exact-head CI, the original full-app Work browser journey is copied into a disposable scratch runner and extended to mount these preview actions on the **real native app style cards** in Chromium/WebKit at 320, 390 and 430 CSS px. It captures six extra actual owner-photograph 2D UI screenshots in addition to inherited six styled-outfit and 36 research 3D snapshots.
- Existing licensed 3D research dress remains separate from the new blouse. P165 neither claims nor implements arbitrary new-blouse 3D fitting; it is the accurate **2D fallback** when a supported verified 3D garment representation does not yet exist. It is not a 10/10 humanoid or cloth realism feature.
- Original Work PR #719 is fetched from its exact verified SHA and applied to a detached, uncommitted GitHub Actions worktree with `git merge --no-commit --no-ff`. No persistent branch merge. Full combined app tests, real mobile Chromium/WebKit style browser cases and inherited original male/female 36-view WebGL research checks are rerun on the same disposable checkout.

## Acceptance boundaries

Require full source Node tests and strict origin/no-deploy diff allowlist. Require actual original camera review/save/style/swap/reload, real preview source SHA verification and UI with explicit 2D/3D labels, six real Chromium/WebKit 2D fallback screenshots with SHA receipts, and unchanged genuine 3D research viewer verification. All pass or report defects, never fake acceptance.

**Not verified here:** live phone getUserMedia; non-synthetic real private photos; fresh model inference; fully automatic real garment-to-humanoid 3D fitting; actual physical Android/iPhone device; 10/10 fabric/face/skin realism; hosted two-account cloud RLS; public release. These gates stay HOLD.

**Status:** implementation and independent no-deploy CI acceptance underway; mark complete only upon exact-head two-job success.
