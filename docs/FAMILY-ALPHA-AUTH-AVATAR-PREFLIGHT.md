# Family Alpha — Authenticated 2D avatar preflight (research only)

**Development candidate only. NOT integrated with the shipping app.** Related to release issue #255 and stacked draft PRs #256, #258 and #260.

## Actual existing contracts

- public/auth.js offers window.closetAuth.user and getAccessToken({force}); its email-link verification already requests the Supabase /auth/v1/user endpoint. It does not expose an avatar-scoped login generation counter.
- public/app.js opens an IndexedDB instance named closet-current-user-<account UUID>. Saved garment items contain image, optional originalPhoto.image, and outfit board slots.
- public/cloud-backup.js obtains a bearer token from closetAuth and uses private owner-prefixed cloud paths. supabase/cloud-backup.sql describes RLS and a private bucket. Repository SQL does NOT establish which policies are actually deployed.
- PR #260 maps saved board selections, app-retained original JPEG SHA, and preloaded image masks. Caller-provided approved:true alone does not prove source authenticity or database ownership.

## Implemented in the isolated branch

- public/family-alpha-2d-auth-preflight.mjs exports verifyAlphaAuthUser: require Auth user UUID, live cloud owner, owner-specific IndexedDB handle and monotonic session generation; request getAccessToken, perform GET to the fixed Supabase project /auth/v1/user endpoint and require the returned ID to match the active account. Reject stale account changes after every await.
- The same module exports renderAlphaAuthenticatedBoard: clear any old avatar, perform identity preflight, read owner-labeled saved board/items from the authorized loader callback, obtain source-bound transparent garment images from a caller-supplied preparation callback, invoke existing PR #260 source SHA verification and 2D renderer, and reject account transitions or superseded rendering.
- No remote photo requests, new storage writes, token logging, UI activation, customer-photo access, app deployment, Supabase/Cloudflare configuration changes, paid AI or spending.

## Required wiring before live use — HOLD

1. Add an actual login epoch or generation counter to the Auth integration. It must change on logout, account transition and source scope replacement. Today the app does not expose this to the research module.
2. Independently test deployed Supabase database row-level security and private storage bucket policies using separate authenticated synthetic accounts. Checking the Auth /user endpoint only verifies token-to-user identity, NOT RLS behavior.
3. Ensure the wardrobe loader reads the correct authenticated IndexedDB handle and owner-scoped restored cloud photos. Client-supplied owner IDs cannot themselves prove ownership.
4. Ensure the mask producer decodes the exact retained JPEG, associates it with the correct segmented item, handles real complex backgrounds and alpha edges, rejects empty/invalid sources, and binds transparent derivative provenance to that exact source. The research input's approved field is not itself a proof.
5. Validate protected physical Android and iPhone workflows for four family accounts: login, 15–20 pieces each, transparent garments, three outfits, one swap, logout, reload, cross-account isolation and private feedback. Browser emulation is not hardware validation.
6. Main Closet Current conversation alone owns merging, staging access, release and final authorization.

## Synthetic tests

Tests use only fake accounts and tokens, locally generated JPEG and already-decoded synthetic images, with mock Auth responses. They cover successful token-to-user ID preflight, 401/403 and wrong-owner denials, malformed payloads, mismatched cloud and local database scope, session changes during asynchronous reads and mask prep, stale original refusal, and render supersession. The six existing Chromium/WebKit mobile-sized checks also exercise the new synthetic Auth preflight, foreign account refusal and stale display clearing.

No real Supabase HTTP request occurs in CI. Exact-head verification must be reported separately from these specifications.

**Release status: HOLD.**
