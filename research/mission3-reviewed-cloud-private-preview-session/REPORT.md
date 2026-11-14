# Mission 3 — P146 original-owner private preview/approval session fence (HOLD)

**Scope:** isolated research-only source patch stacked on the exact validated Mission 3 PR #1116 HEAD `3c7fce570f63b16da49cc94d57a1880de6a88f39`. **Family Alpha #255 OPEN/HOLD. DRAFT / UNMERGED / UNDEPLOYED.** Zero production, staging, hosted Supabase, real private wardrobe or source-owner JPEG changes.

## Source-verified gap
The P146 loopback-only synthetic cloud review dialog delegates to safe local/remote backup and restore services. Its `run()` checks owner identity **after** `await operation()`, but its `showCounts()` is invoked **inside** the awaited callback after preview resolves and **before** that outer owner assertion. If an account becomes stale without an immediate `closet:session-locked` event, the completed callback could populate former-owner private garment/outfit counts on a replacement account's page before the outer check. The plain status writer had the same missing immediate guard. Likewise, `settle(true)` only examined `revoked` and did not directly assert the originating auth lease when an approval click occurred.

This is a code path / race, **not** evidence of a reported user privacy incident. The P146 feature is explicitly local research-only: paired exact query flags, loopback origin, synthetic unsigned token, same-origin restricted transport, no redirected bearer tokens. It is not a live private hosted-cloud implementation.

## Source change
In `research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs`:
1. Check the exact captured owner session before writing count-only preview, revoke and reject if stale.
2. Check the session before writing status, revoke and suppress former-owner status when stale.
3. Pin the exact mount-time authenticated principal object (not merely owner UUID), rejecting same-owner-ID sign-out/sign-in or login replacement before owner-private UI writes. Check the session **at the owner approval click**; reject approval and revoke the stale dialog without depending on a separately delivered auth event.
4. Preserve previous independent fail-safe cleanup on exceptions, consent denial when revoked, idempotent revocation, SHA-256 double-JPEG provenance, owner review, no automatic merges and existing 2D fallback. No new transport, endpoints or data persistence.

## Reproducible acceptance
- `node --test tests/mission3-reviewed-cloud-private-preview-session.test.cjs`: actual extracted source executed with synthetic owner epoch, race/cancellation and DOM stubs. Includes current-owner preview, stale private count, stale status, stale approve, current approve, explicit decline and localhost-only invariant.
- `node scripts/test-mission3-reviewed-cloud-private-preview-session-browser.mjs benchmark/mission3-reviewed-cloud-private-preview-session-browser`: **42 planned** real Chromium/WebKit engine simulations across 320/390/430 CSS pixels × seven conditions, with machine-readable privacy receipts. These are not physical phone tests.
- `.github/workflows/mission3-reviewed-cloud-private-preview-session-no-deploy.yml`: parent-pinned five-path no-deploy diff gate and inherited full serial native Node, original photo / owner-private wardrobe / native outfit, signed disposable two-owner PostgreSQL/Storage RLS and browser suite. This workflow is created on the isolated feature branch only.

**Validation state:** Do not claim exact-head CI or browser PASS until the new GitHub Actions run actually finishes successfully. Existing inherited parent #1116 was fully green at `3c7fce...` before this patch; that does **not** automatically validate this child.

## External final Mission 3 gates still blocked
- Physical Android Chrome and iPhone Safari camera, interruption, user review, original JPEG and secure outfit testing with actual permitted devices.
- Authorized live two-account JWT, hosted private Storage and cloud backup/restore exercise; disposable synthetic cloud/Postgres testing cannot substitute.
- Cross-mission integration on a single isolated compatible branch of completed Mission 1 recognition and Mission 2 true photographed-garment 3D and the final private outfit flows.
- Family owner acceptance and deliberate release/merge/deploy authorization. #255 must stay OPEN/HOLD until all gates independently pass.

No 100% Mission 3 / pilot-ready / physical device / live cloud / 10-of-10 recognition / fitted photorealistic 3D claim.
