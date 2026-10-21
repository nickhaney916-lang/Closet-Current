# Email link confirmation and password recovery callback safety

**October 20, 2026 — isolated development draft only.** Based on PR #98. No hosted Supabase Auth configuration was changed; no emails were sent and no production deploy occurred.

## What this closes

The app previously accepted the default Auth-hosted **implicit** `#access_token` callback but did not recognize a custom email template's direct **`?token_hash=...&type=signup|recovery|email`** callback. Users could land at the app without a usable confirmation/recovery interaction.

- Existing implicit callback behavior and existing GitHub Pages `redirect_to` setting are retained. The app verifies its bearer token using `GET /auth/v1/user` before opening the closet.
- An explicitly typed, syntactically valid `token_hash` received in the URL is verified with `POST /auth/v1/verify`. The result must have a user, an access token and refresh token. A second authenticated `GET /auth/v1/user` must return **the same user ID** before unlocking.
- A verified recovery link remains locked until the customer sets a new password via authenticated `PUT /auth/v1/user`; it refuses account-ID substitution.
- URL hash/query secrets are stripped from browser history **before the network request**, including expired, malformed, ambiguous and mismatched callbacks.
- Unknown types, malformed hashes, provider failures and an unmatched PKCE `?code=` never expose a wardrobe. This custom, dependency-free auth client has no PKCE verifier, so silently exchanging an unrelated code would be unsafe.
- No automatic resend loop, fallback to a different account, email delivery claims or service-role access.

## Verified code-level QA

`tests/auth.test.cjs` adds six synthetic link tests covering direct signup, direct recovery, malformed types/hashes, false identity, expired/rejected hash, and unmatched PKCE code. Existing implicit callback, session race, cloud backup, camera/original-photo recognition and release-blocker suites remain active.

Dedicated workflow: `.github/workflows/auth-email-callback-qa.yml`. Exact final SHA and successful CI run must be verified independently before marking this discrete code priority complete.

## Outstanding live-service checks and release veto

The documented shared app is `https://closet-current.pages.dev/`, but the current hardcoded `APP_URL` remains `https://nickhaney916-lang.github.io/Closet-Current/`. **Do not change it until the operator confirms the Auth Site URL and Redirect URLs allowlist and chooses the canonical production origin.** If the operator uses a custom `token_hash` template, its type and URL must match this handler; the existing stock `ConfirmationURL` redirect is supported without template changes.

External inbox delivery for signup/resend/reset, live SMTP sender/domain, expiration and used-link behavior, Cloudflare origin switching, physical Android/iPhone redirects and real Auth provider configuration are **not verified**. Owner consent is required for any changes to deployed settings. Nothing here constitutes an external pilot approval.

Sources: [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), and [Passwordless email / token_hash verification](https://supabase.com/docs/guides/auth/auth-email-passwordless).
