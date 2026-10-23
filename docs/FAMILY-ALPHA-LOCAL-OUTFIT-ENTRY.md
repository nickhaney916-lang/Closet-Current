# Family Alpha v0.1 — Actual Outfit Builder LOCAL ONLY reviewed-photo avatar entry

**Main thread / Issue #255 / NO MERGE, DEPLOY, PRIVATE DATA, PAID AI OR CLOUD CONFIG CHANGES.**

Based on draft PR #267 at `fe30c48d611eccec05121a4dd4812aa570ae2b64`, which builds on combined family alpha #266 and source/photo, Auth and 2D foundations.

## What changed

- The **real existing Outfit Builder** (`public/index.html`) now contains an extra hidden, disabled review/photo-avatar section directly under the existing outfit figure. The old builder, stylist, closet, saved outfits, and shopping flow are unchanged.
- `public/family-alpha-preview-boot.js` is loaded at the end of the existing app but returns immediately unless both `location.hostname` is exactly `localhost` or `127.0.0.1` **and** a pre-init `window.__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__===true`. No URL parameter, localStorage or sessionStorage can activate it. It stays **OFF by default** for normal browsers, GitHub Pages, Cloudflare staging and production.
- In an explicit local development session the boot uses existing `closetReady` and `outfitBoardReady` and passes live `db` handle and `items` accessor from the real app, `window.closetAuth` and `window.closetCloud` to `mountAlphaBuilderPreview`.
- The controller first calls actual `verifyAlphaAuthUser` (token endpoint GET /auth/v1/user via the existing publishable key), then `readAlphaSavedWardrobe` for a **single read-only private IndexedDB transaction** containing saved items + active saved outfit.
- Each selected piece must pass PR #267's real-retained-JPEG conservative masking, independent second original RGB decode + crop/source/owner/epoch validation, and explicit click on side-by-side **Retake / Use cutout**.
- The controller then calls `renderAlphaLiveSnapshot`, which rechecks server Auth, owner/database, loads the latest private snapshot, rejects any changed garment or slot, rehashes the original sources and draws original-photo-backed layers on the 2D avatar. Never uses shopping products or colors as a visual substitute.
- Switching outfits invalidates the previous avatar at the beginning of `renderOutfitBoard`. Sign-out, pagehide, photo retake and changed identity cancel pending work and clear mask images. The state is never persisted.
- `window.closetAuth.getPublicKey()` safely exposes the existing public Supabase client key; no user token is logged or embedded in markup.

## Test scope

- Node: hidden/default-off gating, correct localhost-only flag, regression guards against UI changes and bypass.
- Chromium & WebKit 320/390/430: use source **builder markup copied from real `public/index.html`**, actual source code/controller/renderer and browser JPEG decoder, **mock Supabase Auth and owner-scoped IndexedDB** populated with three synthetic garments. Explicitly click Use cutout on three independently decoded photos, verify top/bottom/shoes layers, then test board change, retake, changed account, no third-party requests.
- Original PR #267 real-JPEG review fixture, PR #265 exact-color fidelity and PR #261 three-outfit/one-piece swap browser fixtures also run. Report exact-head CI only after completion.

## Honest gaps to family usability

- The preview is **not enabled on staging**, and staging build currently copies only `public/`; source research modules live outside the deployed bundle. This version is **local development integration only** and intentionally does not expose a broken preview on production or Cloudflare.
- The UI has no feature rollout mechanism until the protected staging hostname, account-level access and artifact packaging are explicitly approved.
- Device-native capture quality/segmentation with actual family photographs is NOT verified: hard backgrounds return review/retake rather than make up a garment.
- Four actual accounts, real Supabase RLS/private storage policies, photo sync across devices, physical Android/iPhone cameras and security consent are still outstanding. Parallel Assignment #17 independently owns static RLS and synthetic privacy audit.
- The local fixture uses mocked server and synthetic photos. It is not a production Auth/RLS security certification and does not replace private staging proof.

**Release decision: HOLD. Do not expose this feature to family accounts until the main thread authorizes protected staging and completes real-user, photo and device checks.**
