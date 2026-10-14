# Authentication email readiness

Reviewed October 14, 2026. Only Closet Current project `hlkgymugtfbirlpunsra` was accessed. Drive Duel was not accessed or modified.

## Verified read-only facts

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

Verify custom sender/domain settings, sending limits and the exact redirect allowlist. Add the Cloudflare destination only if the owner chooses to migrate the existing canonical authentication URL. Confirm behavior separately on both deployed origins because browser wardrobes are stored per origin and are not cloud-synchronized.

Once configured, run explicitly authorized real inbox tests for signup, newest confirmation link, resend and password recovery for an address outside the project team. Confirm expired/used links, password update and subsequent login. A successful API response alone is not evidence of inbox delivery.

## Sources reviewed

- https://supabase.com/changelog.md and the October 12 TLS cipher change: modern browser requests use current HTTPS; no auth request-body migration applies to this client change.
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/debugging/error-codes

The default sender is intended for limited testing, restricts recipients to organization members and currently allows two messages per hour according to the reviewed official documentation. Sender activation is still open. Camera resolution, simplified navigation, recognition assets and per-account local storage are unchanged.
