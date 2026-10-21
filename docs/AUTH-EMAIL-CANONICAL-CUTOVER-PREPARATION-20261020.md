# Canonical Auth email-link transition readiness — October 20, 2026

**Scope:** Isolated code preparation, not a hosted email/URL migration or an external pilot release approval.

## What is verified from recent PRs

The existing, documented shared site is `https://closet-current.pages.dev/`. Both deployed Closet Current versions were independently checked in PR #100, and each served a client whose three email actions — signup, resend confirmation and reset — send an explicit redirect to `https://nickhaney916-lang.github.io/Closet-Current/`. The Supabase public Auth settings endpoint confirmed signup/email enabled and mail confirmation required on October 20. These public facts **do not prove** that a Cloudflare callback is allowlisted or that any external inbox receives messages.

Draft PR #101 verified disposable Supabase Auth and Mailpit email links using both destinations **only in an isolated local Supabase redirect allowlist**. Draft PR #102 tested eight signup/recovery/error scenarios each in Android-like Chromium and iPhone-like WebKit. Neither is an actual hosted provider or physical phone.

## New customer-facing improvement (without changing redirect)

On the shared Cloudflare origin, successful *signup*, *resend confirmation* and *password reset* request messages now explain that the confirmation/recovery email opens the existing GitHub Pages site. That website has **separate device-local storage**, so customers should verify cloud backup before changing websites. Visitors already on GitHub Pages do not see the cross-origin note.

This does not transfer locally stored clothes, pretend that two browser origins share a login session, or silently change the canonical URL. The final authorized URL selection is still pending.

## Release-side cutover guard

`scripts/check-auth-email-cutover.mjs` is a hard-fail, no-network check for the literal `APP_URL` in `public/auth.js`:
- Reject any destination other than the **exact** known HTTPS GitHub Pages and Cloudflare Pages URL, including unknown subdomains, query strings, fragments and unexpected paths.
- Confirm that signup, resend and recovery consistently use the same `EMAIL_REDIRECT` encoded parameter; reject accidental independent per-endpoint URLs.
- **Do not allow switching to Cloudflare on a production/ordinary CI run** without deliberately updating and approving the cutover policy in a separate human-reviewed PR. An explicit test-only `approvedCutover` option can simulate future logic; it never activates or authorizes a deployment.
- Never infer dashboard redirect allowlisting or sender deliverability from a successful HTTP response. `productionReleaseApproved` remains false.

Isolated regression tests cover the current legacy behavior, all three exact query strings, Cloudflare versus GitHub Pages explanations, invalid destinations, the simulated Cloudflare alternate and continued pilot release veto. Dedicated CI workflow: `.github/workflows/auth-email-cutover-guard-qa.yml`.

## Before anyone activates the Cloudflare callback

1. Choose and approve the real canonical domain (Cloudflare `.pages.dev` or the already-owned custom domain). **The custom domain's exact address is not known** here; never guess it.
2. In hosted Supabase `Authentication → URL Configuration`, inspect and explicitly allowlist that exact fully qualified Auth email callback. Confirm Site URL and login templates actually use that redirect, and preserve the old GitHub Pages entry for rollback during any migration.
3. Verify and approve SMTP sender, verified domain and delivery policy in `Authentication → SMTP Settings`; complete external inbox acceptance for signup/confirmation, resends and recovery on real devices.
4. Check users' actual cloud backup status before asking them to change origins — localStorage/IndexedDB and stored sign-ins do not transfer. Test fresh sign-in and private cloud wardrobe recovery on real Android and iPhone browsers. Avoid open redirects and silent cross-account imports.
5. Only after these checks, change the single literal `APP_URL` plus cutover guard together in a **separately reviewed, rollback-ready PR**. Never automatically commit, merge or deploy a new callback target based on a public-page check.

This PR has **not** changed any hosted Supabase project configuration, sent external emails, modified real user data or mailboxes, merged to production, enabled paid AI or edited Drive Duel.

Official docs: https://supabase.com/docs/guides/auth/redirect-urls and https://supabase.com/docs/guides/auth/auth-smtp.
