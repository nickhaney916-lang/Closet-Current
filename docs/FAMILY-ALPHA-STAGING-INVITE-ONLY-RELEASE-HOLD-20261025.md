# Closet Current — Family Alpha invite-only staging UI / direct-signup gate

**October 25, 2026 · Tracking issue #255 · DRAFT / OFFLINE HOLD · No deployment**

## Why this is the next security gate

Independent Work Assignment #26 ([draft PR #294](https://github.com/nickhaney916-lang/Closet-Current/pull/294)) reviewed owner-scoped staged backup and JPEG Storage rules, but could **not verify the current staging Auth signup, enabled providers, Before User Created hook or redirect allowlist** because the staging dashboard required a new sign-in. The owner had previously observed signup enabled; that historical observation is **not** a current-state finding.

**Cloudflare Access only protects the Cloudflare application host.** Even if all HTML, JS and photo routes on `closet-current-staging.pages.dev` are restricted, Supabase Auth is separately reachable at `fbnplztkbsteuzrmbgib.supabase.co`. Hiding a registration button **does not** prevent a client from submitting `/auth/v1/signup` directly with the public publishable key. This change is safe UI friction and test-readiness, **not server-side access control**.

## Implemented offline, development branch only

`scripts/family-alpha-stage-invite-only-ui.mjs` applies a strict-source transform **only after** `stageAuthSource()` has moved all endpoints, credentials and storage to staging AND after terminal-session lock protection from draft #296. It changes only the isolated staging `auth.js` development build. The normal `public/auth.js` and `dist/` remain unchanged.

- Sign-in explains the four-account pilot is **invitation-only**.
- The visible Create account / signup mode is hidden. Even if that hidden mode is invoked through script, it resets to login mode.
- The staged Auth code has **no request to the signup endpoint**.
- Existing approved-account login, resend confirmation, and password-recovery affordances remain; none were exercised with real email.
- The staged Auth client still has an **empty publishable key and empty callback**. Its generated app is nonfunctional on live staging until a separate authorized future configuration.
- Separate avatar rollout flags remain OFF and Cloudflare staging continues hosting the existing one-file access test.

## Server-side registration gate — still OPEN

Do **not** claim Family Alpha signup safety until an owner-approved operator, independent of this UI:

1. Reads current staging Supabase Authentication settings: whether signup is enabled, email confirmation, anonymous providers, identities/providers, invitation workflow, before-user-created hook, and appropriate rate limits. Redact addresses/tokens from any public reports.
2. Chooses a **server-enforced invite-only approach** appropriate to Supabase staging (for example, deny unsolicited signups or disable public self-registration while allowing controlled invitations). Validate that four intentionally authorized tester accounts can enroll, that a fifth unauthorised new account is denied **at Supabase**, and that existing test logins/recovery still work. Cloudflare, CORS, a browser signup toggle or a Supabase callback allowlist is **not** such enforcement.
3. Registers the exact protected root `https://closet-current-staging.pages.dev/` as staged Auth callback **only after the actual staging app is approved and deployed**, validates confirmation and recovery redirect behavior, and keeps `closet-current.pages.dev` production separate.
4. Obtains explicit user permission before any setting change, disposable account creation, live signup/denial probing, new email, cloud/photo write, deployment or paid service.
5. After launch of an approved protected staging app, tests signed-in real JWT A/B own vs foreign backup/photo reads/writes; verifies static host/alias Access paths; validates four-person family original JPEG capture→corrected category/color→cloud closet→2D avatar→three outfits→one-piece swap on physical phones.

## Reproducible offline proof

```sh
# Using pinned development HEAD, not main or a live Cloudflare project
node scripts/build-family-alpha-staging-auth-hold.mjs
node --test tests/family-alpha-staging-invite-ui.test.mjs
```

Full offline no-deploy GitHub Actions builds the original-JPEG + 2D staged candidate and runs all Node tests, plus existing synthetic browser tests. **Green results prove only the staging client does not offer/call signup and the hold state is intact.**

Family Alpha remains **HOLD**. Never touch production Supabase `hlkgymugtfbirlpunsra`, production Cloudflare Pages, Resend SMTP, customer photos, paid services or Drive Duel as part of this assignment.
