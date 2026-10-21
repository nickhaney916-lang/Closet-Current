# Disposable real Auth email-link and recovery acceptance — October 20, 2026

**Scope:** Synthetic localhost development test only. No hosted Supabase email, account, redirect or domain settings changed.

## Purpose

PR #99 covers token-hash and implicit-link client callbacks, and PR #100 recorded that both public Closet Current deployments serve an Auth client returning email callbacks to GitHub Pages. A real password-confirmation → delivered email → verified link → authenticated sign-in → password recovery acceptance flow still needed evidence beyond mocked browser interactions.

The new workflow `.github/workflows/disposable-auth-email-integration.yml` starts an isolated Supabase CLI v2.121.0 stack with **Mailpit enabled**. It alters **only** freshly initialized `$RUNNER_TEMP/cc-auth-mail/supabase/config.toml` to require email confirmations, allowlist the known GitHub Pages and Cloudflare Pages destination URLs and permit enough synthetic email requests. Both redirect hosts are **test-only values**; this does not prove either is allowlisted on hosted Supabase.

The script `scripts/test-disposable-auth-mailpit.mjs` uses actual local GoTrue email/password API, Mailpit's local REST inbox and the real generated verification URLs (but **never follows their redirect into external public websites**). It tests:

1. A synthetic unconfirmed signup is denied password login before email confirmation.
2. Mailpit captures the actual confirmation message; the one-time verification link redirects to the expected explicit GitHub Pages destination and returns usable tokens.
3. Real `/auth/v1/user` and subsequent password login identify the same owner; reusing the consumed link cannot mint another session.
4. A second synthetic account confirms through a local generated link to the independently allowlisted Cloudflare Pages destination, without sharing an account identity.
5. Local recovery mail for the original account redirects to Cloudflare Pages with a verified recovery session. An authenticated password update invalidates the old password and accepts the new one.

`scripts/configure-disposable-auth-email.mjs` refuses a config outside the fresh CI runner temp directory. The email test refuses Auth API URLs outside local loopback, never prints keys, email addresses, JWTs, raw one-time links or message bodies, and only prints generic pass/fail flags. A separate test asserts that hosted URL invocation is rejected. GitHub Actions destroys the entire local Supabase volume and synthetic messages. No local Auth emails are delivered to actual external inboxes.

## Verification and release boundary

Check **the exact final PR head and GitHub Actions run** for this integration before treating the development scope as finished. The workflow also runs the full app build, Node suite, original-resolution garment-source/camera lineage verification and hard customer-release veto.

Even green localhost SMTP/Mailpit evidence cannot establish current hosted **Auth Site URL**, live **Redirect URLs allowlist**, verified sender/domain, hosted SMTP capacity, Gmail/Outlook/iCloud inbox delivery, physical-device redirects, production legal consent or device-specific wardrobe restoration. Do not switch canonical app origin or enable public invitations until separately approved and independently verified.

The hosted project and all real accounts/photos were left unchanged. No paid AI, Drive Duel edits, merge, live deployment or actual delivery/production readiness claim.

References: https://supabase.com/docs/guides/local-development/cli/testing-and-linting and https://supabase.com/docs/guides/auth/passwords and https://mailpit.axllent.org/docs/api-v1/.
