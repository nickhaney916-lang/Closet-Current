# AUTH-REVIEW-SESSION-36 — authenticated owner isolation and native reviewed-photo safety

**Isolated research only; Family Alpha #255 remains HOLD. Never merge, deploy or change production or existing staging.**

## Source baseline and donor

- Exact parent [PR #593](https://github.com/nickhaney916-lang/Closet-Current/pull/593), SHA `bdef04a59f4586044b2adc027a37c5dbe04ba4b8`: real browser owner-bound review source epochs, immutable confirmed garment snapshot, post-commit receipt, 536 Node tests, 12 browser IndexedDB cases and 18 screenshot SHA audits.
- Reused the **previously verified** auth session/epoch/logout protection from [Work #29 PR #581](https://github.com/nickhaney916-lang/Closet-Current/pull/581), SHA `2dd3ea96725aa1bcb797727ea31a7f99167ad3f5`, without merging the older Work branch or overwriting newer review pipeline code. The previously verified two-account adversarial signed HTTP script is copied as a **loopback-only, disposable local Supabase** test.
- New integration patches in this research branch specifically connect `closet:session-locked` to newer reviewed-garment photo/crop cleanup, outfit photo retry invalidation, worker cancellation, local DB close, queued owner checks and ready/startup assertions.

## Exact owner/session trust boundaries

1. `public/auth.js` checks a nonsecret monotonic browser epoch, locks stale tabs on storage/pageshow, publishes a user only after Auth server success and matching stored epoch, revokes local authority immediately before awaiting logout HTTP, and rejects a returned refresh token if the owner or epoch changed.
2. `public/app.js` checks the still-current authenticated browser epoch before and after asynchronous owner-private write preflight, shuts camera/model workers and pending jobs on lock, clears cached photo media and closes its IndexedDB handle, and prevents late DB open from publishing data.
3. `public/outfit-capture.js` clears the pending retry original and in-flight worker on lock.
4. `research/multi-garment-capture-01/review-ui.mjs` clears unconfirmed original/crops when a true Auth session-lock event occurs; existing immutable snapshot, source epoch and transaction owner's `currentOwner` checks remain intact.

**Threat-model limits:** An origin-scoped IndexedDB can still be inspected by same-origin script or browser developer tools. The browser epoch is not a signed token or server-side authorization. Supabase backend RLS/storage policies are still the authority for cross-owner cloud access; a previously issued JWT may remain usable until expiry even after logout. No claim of instant bearer revocation.

## Honest acceptance scopes

- **Browser UI fixture job:** Chromium and WebKit × 320/390/430, **six actual original application sessions**, A human-review/save synthetic JPEG to real private IndexedDB, second stale tab with unconfirmed source, delayed HTTP logout, immediate A local lock including crop/photo clearing, B login finds no A wardrobe rows, B human-review/save a different SHA-verified original to B private DB, then fresh A authentication sees only A saved records. Four genuine screenshots per case (24) with exact SHA, PNG dimensions and nonblank pixel variation audited independently. Authentication HTTP is an explicitly **synthetic fixture**, NOT signed browser-to-cloud; simulated model/offline manual fallback, NOT automatic SegFormer accuracy.
- **Disposable signed HTTP job:** Two genuinely independent password-authenticated local Supabase accounts, private backup and original JPEG owner RLS, foreign storage GET/PUT/DELETE/sign/list denied, forged owner denied, anonymous access denied, refresh/revocation/expiry tests. Existing unmodified `supabase/cloud-backup.sql` installed only into an isolated local Docker stack. No hosted or customer data involved.
- **Entire application Node suite:** existing + focused tests, build, no-deploy GitHub CI. All new changed paths are explicitly restricted and the pinned PR #593 source remains an ancestry check.

**Do not claim a combined signed-browser-to-cloud two-account acceptance**: real backend signed HTTP and browser UI fixture-auth are separately exercised. Actual hosted staging cross-device signed browser-to-cloud and physical Android/iPhone proof still require independent, specifically authorized testing, and therefore Family Alpha Issue #255 remains HOLD. Parallel #27 PR #592 recognition research remains independent, with negative semantic accuracy findings.

Do not mark completion until the final exact-head dedicated workflow succeeds and all screenshots are audited. Never merge or deploy.