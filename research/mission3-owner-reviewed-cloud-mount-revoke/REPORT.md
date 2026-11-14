# Mission 3 — stale P146 local owner-reviewed cloud mount must revoke its panel

**Family Alpha HOLD #255 OPEN.** Independent research-only branch stacked on verified [PR #1100](https://github.com/nickhaney916-lang/Closet-Current/pull/1100), exact parent `ce2785fd5b2646f727cfd877bab39859d494eb8c`. No merging, deploying, production/staging, hosted Supabase, real account/private JPEGs, or physical device changes.

## Source-observed issue

The normal `public/cloud-backup-bridge.js` bootstrap includes a strictly research-gated P146 owner-reviewed cloud recovery panel, available only on a local HTTP origin with `ownerReview145=research` and `ownerReview146=research`. It first requires the legacy cloud sync service to pause, then awaits `mountOwnerReviewedCloud146(...)` and calls `assertLease()` before publishing `window.ownerReviewedCloud146`.

Unlike the adjacent `createNativeRestore01(...)` setup, P146 **did not clean up its just-mounted owner-private panel if the final post-await owner lease failed**. This can leave the old signed user's local-review DOM/buttons and registered handlers mounted despite the old mount never being published as a valid global bridge. The real P146 interface is `revoke()`, not `dispose()`: its implementation cancels pending consent, revokes local backup/restore services, disables review buttons, removes private panel/dialog/style, and marks state unmounted. It also responds to `closet:session-locked`, but a session replacement is not guaranteed to have been processed before a delayed async initialization resolves.

This is a **source-verified potential stale owner UI race**, not an observed security incident.

## Fix

The P146 bootstrap now protects its final `assertLease()` in a `try/catch`. If the originating owner/auth generation has expired, it safely calls `bridge?.revoke?.()` and rethrows the original stale-session exception. No outdated panel is published. Cleanup exceptions cannot mask the original auth failure. Successful same-account mounts follow the unchanged path.

This does **not** relax the owner-DB lease, owner-confirmation, photo custody, source SHA integrity, cloud transaction CAS, independent photo-review, 2D fallback or explicit local-only research gate. `createNativeRestore01` retains its existing `dispose()` cleanup.

## Reproducible tests

- `tests/mission3-owner-reviewed-cloud-mount-revoke.test.cjs`: executes the actual P146 bootstrap source with a deferred panel and synthetic auth/DB; covers valid publish, account switches, same-owner re-login, same-ID Auth object replacement, same-named DB replacement, capture epoch rotation, owner mutation, explicit session revocation, cleanup throwing, mount reject, ABA/owner return, and verified P146 `revoke` source contract.
- `scripts/test-mission3-owner-reviewed-cloud-mount-revoke-browser.mjs`: **60 planned real Chromium/WebKit source-executed synthetic UI scenarios** (10 modes × two engines × 320/390/430 CSS-pixel viewport widths). The test simulates a mounted private panel with an actual DOM section, an awaiting mount promise, owner/session change and revocation. These are **not** actual hosted cloud or physical mobile tests.
- `.github/workflows/mission3-owner-reviewed-cloud-mount-revoke-no-deploy.yml`: strict pinned PR #1100 parent and five-path diff allowlist, focused tests and browser receipts, plus inherited source-original JPEG, private outfit, full serial Node, native photographic wardrobe-to-outfit and disposable two-owner PostgreSQL/Storage RLS checks.

**Do not claim the final branch passes until both exact-head no-deployment CI jobs and browser receipts are green.** Existing synthetic tests cannot certify authorized real-account hosted restore, independent photo recognition, 3D garment realism or Family Alpha acceptance.

## Remaining Family Alpha release prerequisites

Approved cross-mission integration, genuine independently reviewed clothing recognition, source-photograph-derived 3D geometry/fabric fit, real Android Chrome and iPhone Safari, authorized hosted two-account Auth/RLS/Storage backup/restore, explicit owner approval. HOLD #255 must remain open.
