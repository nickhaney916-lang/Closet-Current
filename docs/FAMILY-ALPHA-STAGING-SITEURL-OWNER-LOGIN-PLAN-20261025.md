# Closet Current — Family Alpha v0.1 staging Site URL confirmed

**Owner-observed: October 25, 2026 · Issue #255 · NO ADDITIONAL DEPLOYMENT AUTHORIZED**

## Confirmed checkpoint

The owner changed the Supabase **staging** `Site URL` to the exact root:

`https://closet-current-staging.pages.dev/`

After saving and refreshing the Supabase dashboard, the owner explicitly replied **Confirmed**. The owner had already provided a screenshot showing the redirect allowlist contained exactly two staging destinations:

- `https://closet-current-staging.pages.dev/` (Family Alpha staging root)
- `https://pilot-access-check.closet-current-staging.pages.dev/` (older pilot)

These are owner UI observations, **not** an export of current Auth settings via the Supabase management API or a successful invitation email test. No wildcard or production redirect appeared in the screenshots.

## Live staging status at this checkpoint

- The owner previously approved **one staging-only complete-app deployment**, specifically **with login and the photo/avatar rollout disabled**, replacing the one-file Cloudflare Access placeholder. Successful GitHub run: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40237500438 ; hashed preview `fd096539.closet-current-staging.pages.dev`.
- The owner visually verified that the new mobile login page loads and explicitly displays **Family Alpha staging sign-in is not enabled**. It has email, password and visibility controls but the running client cannot authenticate. The 2D avatar remains OFF.
- GitHub confirmed post-deployment anonymous Cloudflare Access challenges on `/`, `/index.html`, `/app.js`, and `/auth.js`. This does **not** prove authenticated unapproved identity denial or all media/worker paths.
- A fresh **read-only** Supabase staging SQL query on October 25 shows **exactly 1 Auth user**, backup row-level security **ON**, and the `closet-private` bucket **private**; project status ACTIVE_HEALTHY.
- Public registration was last observed disabled in staging. It still requires an independently authorized safe negative endpoint test.
- No evidence of completed real SMTP invitation/reset delivery, two-account staging JWT/Storage/RPC authorization, or family device original-JPEG/avatar acceptance testing.

## Next milestone: owner-only staging Auth QA

**Preparatory work allowed without further permission:** offline source/VM tests, build review, documentation, synthetic test accounts. The added `tests/family-alpha-post-site-url-owner-login-hold.test.mjs` verifies the current source-generated Auth config stays blocked when blank, and that a **fictional** publishable key/callback activates only at the exact protected staging root. It also verifies the independent avatar hold and absence of production endpoints and public signup requests in the staging client.

**Not yet approved:** a new login-enabled Cloudflare Pages upload, adding or inviting disposable adult test accounts, actual login attempts using owner credentials, any real JWT backend write test, real email sends, turning on the 2D avatar, or inviting any family members.

If separately approved, the owner-only activation must:

1. Preserve Cloudflare Access policy and verify the exact project `closet-current-staging`, not `closet-current`. Retain the existing `Site URL` and two allowlisted redirects.
2. Produce a new source-pinned isolated staging build using *only the existing staging publishable (public) key*, no service-role or secret key. The frontend config must bind only to `fbnplztkbsteuzrmbgib.supabase.co` and exact root `https://closet-current-staging.pages.dev/`. No key value should appear in GitHub PR comments.
3. Include a distinct, explicit build-time owner-only QA authorization; keep public signup disabled **in Supabase** and hidden in frontend; keep the 2D avatar owner rollout flag false.
4. Verify exact staging root access and protected preview hash; check anonymous response to the newly deployed JS/CSS/worker/model routes (not just index), and ensure a previously established production session cannot unlock staging.
5. Only after a separate account-testing authorization, use disposable **adult** stage accounts to check live login, recovery/invitation link redirects, signed-in A-versus-B RLS/storage read/write denial and no cross-account photo visibility. Never use children or family photos for early security tests.
6. Obtain an independent Family Alpha GO approval before family invitations. A successful owner login is **not** permission to invite family or activate the avatar.

## Explicit STOP points

Abort immediately on production project ref `hlkgymugtfbirlpunsra`, production Pages project `closet-current`, wrong redirect, unknown preview, missing Access protection, real key in logs, client service role/secret, public signup enabled, or altered staging bundle outside audited files.

**Current release decision: HOLD.** The change to Supabase Site URL alone does not activate live app login. No provider settings, deployments, accounts, secrets, customers' photos, expenses or Drive Duel changed by this documentation and synthetic test.
