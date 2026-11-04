# Authentication email readiness

Reviewed October 14, 2026. Only Closet Current project `hlkgymugtfbirlpunsra` was accessed. Drive Duel was not accessed or modified.

## Current checkpoint review — October 14, evening Pacific

The application now has 237 passing Node checks plus passing private-backup and mobile workflows. This is not evidence of email delivery. This checkpoint review changed documentation only; it did not change SMTP settings, send email or reread current management settings.

The shared production URL is `https://closet-current.pages.dev/`, but `public/auth.js` still directs signup, resend and recovery to GitHub Pages. Before external invitations, verify the allowlist and align all confirmation, recovery, welcome and install links with the chosen primary app origin. Current sender verification, SMTP configuration, delivery limits and templates remain unverified.

PWA installation help already exists under My account → Add to phone. A proposed post-confirmation welcome can link to the app and explain installation; the person must choose to install. Welcome automation, privacy/terms acceptance and account/data deletion remain open requirements in [PILOT-READINESS.md](PILOT-READINESS.md).

## Earlier verified read-only facts

- Supabase reports Closet Current as ACTIVE_HEALTHY.
- The public Auth settings endpoint reports email/password enabled, signup enabled and automatic email confirmation disabled.
- Signup, resend and password-reset requests explicitly target `https://nickhaney916-lang.github.io/Closet-Current/`. This configured destination is preserved. A Cloudflare redirect must be verified in the project's allowlist before changing it.
- The management connection requested reauthentication during the review; no management access token was available locally. Current SMTP credentials, sender verification, templates and redirect allowlist could not be reread or changed. The roadmap's earlier record says custom SMTP was not configured; this review does not independently confirm that setting remains unchanged.

## Validated client improvements

Blocked email delivery, email/request rate limits, disabled email signup and invalid email domains now produce plain user guidance rather than raw provider details. Controls recover and the wardrobe remains locked. The client does not automatically retry or generate additional mail requests.

Previously a successful HTTP response containing unreadable JSON, null or an array was treated as an empty object and could falsely report a confirmation/reset request as successful. These responses now produce a retry message. Legitimate empty JSON objects returned by recovery/resend remain supported.

All 170 Node checks passed, including signup, reset and resend error handling, malformed responses, throttle fallback, recovery callbacks, session refresh and existing camera/recognition tests. Tests mock requests and use synthetic identities. No real signup, resend or reset email was sent, and inbox delivery has not been validated.

## Remaining SMTP setup

Reconnect Supabase management access and choose an existing transactional email provider and verified sender/domain (or create one). Configure SMTP host, port, username, password and sender identity in the project's Authentication settings; keep credentials out of the repository and conversation. Preserve confirmation requirements and project isolation.

Verify custom sender/domain settings, sending limits and the exact redirect allowlist. Add the Cloudflare destination only if the owner chooses to migrate the existing canonical authentication URL. Confirm behavior separately on both deployed origins: local browser storage remains origin-specific, while the subsequently implemented private account backup can restore synchronized clothing after sign-in. Confirm backup is up to date before switching origins.

Once configured, run explicitly authorized real inbox tests for signup, newest confirmation link, resend and password recovery for an address outside the project team. Confirm expired/used links, password update and subsequent login. A successful API response alone is not evidence of inbox delivery.

## Sources reviewed

- https://supabase.com/changelog.md and the October 12 TLS cipher change: modern browser requests use current HTTPS; no auth request-body migration applies to this client change.
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/debugging/error-codes

The default sender is intended for limited testing, restricts recipients to organization members and currently allows two messages per hour according to the reviewed official documentation. Sender activation is still open. Camera resolution, simplified navigation, recognition assets and per-account local storage are unchanged.


## October 18 pilot-auth stability checkpoint

On draft PR #7 only, transient offline/session refresh failure now preserves
the stored refresh token **without unlocking the private closet**. A visible
"Retry saved login" control appears only when a saved refresh session cannot
be restored due to an HTTP 5xx, 408/429, timeout or network outage; verified
revoked sessions still require fresh login. Malformed successful Auth JSON
cannot unlock the closet without a nonempty access token, and recovery
cannot switch to an unexpected account.

The [controlled browser run 39173979696](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39173979696)
verified a 390×844 touch viewport, offline token preservation, successful
retry, rejection of tokenless 200 responses and mismatched recovery, as
well as the existing private cloud recovery suite. 767 Node tests passed,
0 failed, 3 skipped. No live email was sent, and this does not verify a
physical phone or actual email inbox.

**Invitation blocker:** The app's existing `redirect_to` still points to
GitHub Pages, whereas the documented deployed Cloudflare Pages origin is
different. Before inviting external testers, verify the actual
`Authentication > URL Configuration` allowlist, canonical domain,
email templates using `RedirectTo`, sender SMTP/restrictions, and
deliverability; only then consider updating the callback URL.
No sender, email provider or billing settings were modified. Supabase
current redirect guidance: https://supabase.com/docs/guides/auth/redirect-urls



## Pilot data notice — October 18, 2026

Draft PR #7 now links to a factual pilot notice from signup and the My
account menu. New signups must acknowledge reading that specific version;
Auth user metadata records its version/time but **cannot serve as a
tamper-proof legal consent log**. No marketing consent is collected, no
terms have been approved, and no real signup email was sent. The
authentication callback still points at the existing GitHub Pages URL
until Supabase redirect allowlist, sender setup and the canonical
Cloudflare origin are verified. This is not a release authorization.

