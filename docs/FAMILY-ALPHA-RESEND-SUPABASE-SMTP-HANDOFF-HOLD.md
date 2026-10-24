# Closet Current — Family Alpha v0.1 staged email & Resend handoff

**Recorded October 23, 2026 Pacific.** Staging Supabase project `fbnplztkbsteuzrmbgib` **ONLY**. Draft development PR. No app deployment, Auth config change, live email transmission, production change, family accounts or paid services.

## What is already complete

Owner screenshots show Cloudflare DNS zone `closet-current.com` has three saved records for Resend sending subdomain `mail.closet-current.com`:

| Record type | Host/Name (relative to closet-current.com) | Intended value | Source |
| --- | --- | --- | --- |
| TXT (DKIM) | `resend._domainkey.mail` | Full public DKIM `p=...` from Resend, not retained in this repo | Cloudflare screenshot |
| CNAME | `rsend.mail` | `rsend.forge.rmta.net` — DNS only | Cloudflare screenshot |
| CNAME | `send.mail` | `send.forge.rmta.net` — DNS only | Cloudflare screenshot |

The initial second CNAME incorrectly matched the first and was corrected, as verified by later owner screenshot. No other domains, website records, A records or existing routing were changed as part of this work.

**Important: Resend still showed `Pending` with a “Looking for DNS records” warning. Do not claim DNS or SMTP verification until its dashboard reports `Verified` and a test message succeeds.**

## Next staging SMTP configuration, after Resend verifies the domain

Per [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) and [Resend SMTP](https://resend.com/changelog/smtp-service):

| Supabase Authentication → Emails → SMTP Settings | Value |
| --- | --- |
| Enable custom SMTP | **OFF until verification and owner-approved setup** |
| Sender email | `accounts@mail.closet-current.com` (sending address; inbound mailbox not required) |
| Sender name | `Closet Current` |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) |
| Username | `resend` |
| Password | Dedicated Resend **sending API key**, create/enter only in Resend and Supabase staging dashboards |
| Project | `fbnplztkbsteuzrmbgib`, NOT production `hlkgymugtfbirlpunsra` |

**DO NOT paste the Resend API key, Supabase service/secret role keys, SMTP password, OTP codes, or other credentials into GitHub, ChatGPT, source files, screenshots or browser console.** These secrets belong only in the appropriate provider's private secret/password field. A publishable Supabase key is different from Resend's SMTP sending key.

This configuration would affect actual staged Auth email delivery, so it is NOT enabled here. Do not flip the switch until the domain is verified and the sender/configuration has been approved.

## Existing live Auth configuration requires a distinct decision

Owner screenshots of **Supabase Staging → Authentication → URL Configuration** show:
- Site URL: `https://pilot-access-check.closet-current-staging.pages.dev/`
- Only observed allowed redirect: same `pilot-access-check` URL.
- That URL serves a harmless access-check page, **not the Closet Current Family Alpha application**.
- Main protected root hostname `https://closet-current-staging.pages.dev/` is not present in the observed allowed redirect list.

The current draft app has a **separate, default-disabled staging Auth candidate** from PR #273. It does not switch on automatically when a domain is verified. When the actual protected app is approved for deployment, its exact callback must be registered in the staging project and tied to the built staging artifact. Until then, do not change the Site URL from the harmless preview check or assume the root app is live.

From the email provider screenshots: staged Email provider/confirmation on, anonymous sign-in off, **general public signups on**. **Cloudflare Access does not protect Supabase’s direct `supabase.co/auth/v1/signup` endpoint**; test or restrict potential unauthorized external signups before family enrollment. Registration control is separate from confirmed user email and RLS.

## A safe post-verification test, not yet performed

After approved exact staging app URL, protected Cloudflare Access, correct callback and SMTP configuration:

1. Use **one disposable staging test email account**, not a family/minor or production customer identity. Test signup confirmation deliverability in Resend, the Supabase recovery/auth flow, and correct return to the protected host.
2. Verify invalid, expired, and resent confirmation links produce understandable behavior and that the reset link cannot return users to the wrong host.
3. Verify regular login/logout account scoping and password recovery without retaining JWT or OTP in screenshots or logs.
4. Use **two separate disposable identities** to test actual signed-in Supabase REST/JWT positive (own backup/photo) and negative (foreign backup/photo) authorization and Storage/signed URL expiry. Do not claim the previous synthetic four-account browser tests equal live RLS proof.
5. Only then invite four approved family testers and test physical Android/iPhone camera and original garment photo workflows privately.

No purchased plan, production SMTP change or real family data is part of this work.

## Offline reproducibility and assurance limits

```sh
node scripts/family-alpha-resend-staging-email-readiness.mjs
node --test tests/family-alpha-resend-staging-email-readiness.test.mjs
```

The offline checker reads `research/family-alpha-email/staging-resend-observed-20261023.json` and the existing production `public/auth.js` source as a *regression guard*. It does **not** make DNS lookups, send SMTP messages, create Resend credentials or authenticate any user; the staged Auth build remains disabled. The test suite fails closed if a historical Pending is relabeled as Verified, the two CNAMEs regress to one target, private keys appear in the evidence, Auth redirect source changes, or any live deployment is claimed.

**Release verdict: HOLD.** Recheck the Resend UI for Verified and secure the actual staging Auth callback before enabling SMTP or testing family data.

## October 24 read-only live staging update — Resend Verified; security metadata inspected

The original October 23 snapshot, and its **Pending** field, are historical and intentionally unchanged. Owner subsequently shared a **Resend dashboard screenshot explicitly showing `mail.closet-current.com` Verified**. This confirms provider sending-domain validation, **not** that SMTP is configured or that any email was delivered. No SMTP/API key was created or retained in this repo or ChatGPT. The public CNAME targets in the earlier historical snapshot were corrected before the Verified screenshot.

A new, separate evidence file `research/family-alpha-email/staging-live-security-resend-20261024.json` summarizes current **read-only** connected Supabase inspection. It contains no client rows, secret keys, personal photos or JWTs.

### Verified LIVE staging metadata (Supabase project `fbnplztkbsteuzrmbgib` ONLY)

- Staging project is **ACTIVE_HEALTHY**, distinct from production `hlkgymugtfbirlpunsra`.
- `public.closet_backups` has RLS enabled, with `authenticated` SELECT gated on `owner_id=auth.uid()`; there is no `anon` table grant. A no-login `closet_backup_writer` role holds constrained INSERT/SELECT/UPDATE privileges.
- `public.save_closet_backup` is an invoker-level authenticated-only RPC, not available to `anon`, delegating writes to `closet_rpc_private.save_checked`, a private-schema `SECURITY DEFINER` function owned by that no-login writer role. That function validates the caller's JWT subject and owner-specific versioned record writes, checks the JSON shape and applies a size limit; it is not a generic table-write bypass.
- Storage bucket `closet-private` is **nonpublic**, max size **8,388,608 bytes**, with only `image/jpeg` accepted. `storage.objects` SELECT/INSERT/DELETE policies for `authenticated` require `bucket_id='closet-private'` and the path's first folder to equal `auth.uid()`. No UPDATE policy was observed, consistent with the app's immutable content-hash JPEG upload (no upsert).
- Supabase Security Advisor reported **one Auth warning: leaked password protection disabled**. Supabase documentation says that feature may require Pro or above; **do not purchase an upgrade** or report this warning as fixed. Use long unique passwords, verify current Auth minimum length and account enrollment rules first.

**Important limits:** Inspecting RLS definitions is **not** the same as proving cross-owner denial with two valid account JWTs. There has been no live staged login, no private-storage download/upload authorization probe, no hosted callback validation, no mail send and no actual family-account enrollment. The historical owner screenshot showed public signup enabled and anonymous sign-ins disabled; those toggles have **not been re-read live** through the available connector.

### Exact next staging steps (owner-controlled)

1. Review the actual **Authentication → URL Configuration** in project `fbnplztkbsteuzrmbgib`: Site URL and allowlisted redirect must reference the **approved Access-protected staging app**, not the old disposable `pilot-access-check.closet-current-staging.pages.dev` check or production. Confirm the application is actually staged and protected before activating callbacks; don't guess URLs.
2. Review **Authentication → Providers / Signups**, keeping confirm-email on and anonymous sign-ins off. If using pre-invited four-person access, avoid unprotected open signups while provider email sending is enabled; direct `supabase.co/auth/v1/signup` is outside Cloudflare Access. Supabase offers optional CAPTCHA/Turnstile for the full Auth form but **it requires a frontend token workflow**, not just a dashboard flip.
3. Create one new **sending-only** Resend API key, restricted to the verified sending domain if possible. Keep the key entirely in the provider dashboards; never paste in chat, a GitHub file, screenshot or browser console.
4. Once the callback/Access and signup decision are correct, enable custom SMTP **staging project only** using host `smtp.resend.com`, port **465**, username `resend`, password the **dedicated Resend key**, sender `accounts@mail.closet-current.com`, name `Closet Current`. Production untouched. Actual stage SMTP state since the last disabled screenshot has not been reverified, so inspect it first.
5. Use a disposable staging address to verify confirmation, newest-link resend, password recovery and callback. Supabase's default SMTP is for project team members only; a verified Resend domain without configured SMTP is not sufficient.
6. Run two disposable staging identities against actual JWT-authenticated REST/RPC and Storage APIs to confirm: each can access only their own backups/photos, cannot read/update the other's data, and logout/session changes clear local images. Verify with redacted **outcome codes only**, never report tokens/addresses/photo contents in PRs.

**Current decision: HOLD.** Today's work used only read-only database metadata and revised no-secret draft documentation. No production/staging settings, family identities/photos, paid plans or Drive Duel were modified. The Family Alpha protected staging app and SMTP delivery remain unverified.

**Documentation checked:** [Supabase Auth custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [redirect allowlist](https://supabase.com/docs/guides/auth/redirect-urls), [password security](https://supabase.com/docs/guides/auth/password-security), [Resend SMTP](https://resend.com/changelog/smtp-service).
