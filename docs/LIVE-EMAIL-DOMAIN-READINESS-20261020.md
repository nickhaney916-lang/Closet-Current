# Live email and domain release preflight — October 20, 2026

**Read-only development evidence; do not use this as a pilot or production release approval.**

## Decision

The documented shared app origin is `https://closet-current.pages.dev/`. The current source hardcodes signup, resend and recovery links to `https://nickhaney916-lang.github.io/Closet-Current/`. These are distinct browser storage origins. This audit does not choose or silently switch the canonical URL; it records the mismatch.

The Supabase project `hlkgymugtfbirlpunsra` was inspected through its read-only project metadata and was reported `ACTIVE_HEALTHY`. This does **not** verify Auth SMTP, sender verification, URL allowlist, inbox delivery, confirmation requirement or receipt on a real device. The available Supabase connector does not expose the necessary hosted Auth management settings in the current session. Earlier Auth readiness notes are historical, not current sender evidence.

The model-side HTTP/network tools could not retrieve the two public app origins or public Auth settings endpoint on this date. That result is **not proof the websites are down**. Instead a dedicated GitHub Actions network runner records an independent public-HTTP probe and exposes the result in build logs.

## Added verifiable, non-mutating audit

- `scripts/audit-live-auth-email-domains.mjs` makes **GET requests only** to the documented Cloudflare and GitHub Pages origins (landing page and deployed `auth.js`) and to the matching **public** Supabase Auth `/auth/v1/settings` endpoint.
- Any public Auth API key extracted from the current client is sent only as an API-request header, never printed. The response is whitelisted down to the typed booleans `external.email`, `disable_signup` and `mailer_autoconfirm` if provided. Missing fields remain **unknown**, not guessed.
- Check HTTPS destinations and response codes without following cross-site redirects; mark inaccessible, malformed or stale public deployments unknown/failed. Log neither response body, user identifiers, customer content, tokens nor SMTP/private management metadata.
- Diagnostic: `CLOSET_EMAIL_DOMAIN_READONLY { ... }` showing exact known URLs, deployed public client redirect values where found, HTTP statuses and `releaseDecision=BLOCKED`. A green probe job is evidence the audit *ran*, not proof emails work.
- The service **does not** create an account, resend/recover, use an inbox, change Auth policies or apply SQL. Unit tests exercise denial, timeouts, malformed settings, GET-only and redaction. Full Node regression and camera/human-mask source gates also run in `.github/workflows/live-auth-domain-readiness-qa.yml`.

## Owner/operator-controlled final live checks (not completed here)

1. Confirm which app URL is canonical, and use Supabase **Authentication → URL Configuration** to inspect Site URL and exact Redirect URLs (not inferred from `/settings`). Any change requires separate owner authorization. Do not assume Cloudflare is allowlisted because the site exists.
2. Inspect **Authentication → SMTP Settings / Email Templates**; verify sender identity/domain, provider quotas and sender restrictions. Keep secrets out of GitHub, chat and logs. Review actual confirmation and recovery templates for `ConfirmationURL` or supported `token_hash` callback types.
3. With approved test identities and existing email service, test full signup → delivered confirmation → opened link → close/reopen → log in; resend an unused newest link, verify used/expired failures, reset password, then authenticate again. Verify on actual iPhone Safari and Android Chrome, including origin-specific private-closet synchronization.
4. Compare canonical links in invitation emails, reset emails, install instructions and privacy/support pages. Document external Gmail/Outlook/iCloud inbox outcomes with no user emails/identifiers in published logs.
5. Only then propose a **separately reviewed**, rollback-safe change to the canonical redirect; do not migrate browser-local wardrobes across origins unless the private backup is current.

## Release scope

This work remains in an isolated draft PR, does not merge or deploy, and does not modify Closet Current live accounts, hosted Supabase, paid AI, Drive Duel, photo recognition or customer content. Real human mask approvals, licensed figures, account deletion/retention and staged database privilege fixes also remain broader pilot blockers.

Official references: https://supabase.com/docs/guides/auth/redirect-urls and https://supabase.com/docs/guides/auth/auth-smtp and https://supabase.com/docs/guides/auth/auth-email-templates.
