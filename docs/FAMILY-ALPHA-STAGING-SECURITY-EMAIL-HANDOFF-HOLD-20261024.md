# Closet Current — live Staging account security + verified-domain email readiness

**Observed October 24, 2026 Pacific · Work done read-only · Family Alpha RELEASE HOLD**

This is the central Closet Current integration thread. No production changes, staging schema/credential/DNS modifications, real login, photo data, paid services, merge, deploy, or Drive Duel changes.

## Grounded, separate evidence levels

### 1. Connected Supabase Staging live read-only checks (CURRENT)

Staging is active, project ref `fbnplztkbsteuzrmbgib`. Production `hlkgymugtfbirlpunsra` was NOT queried or changed.

A metadata-only audit of `pg_policies`, table RLS and `storage.buckets` observed:

| Surface | Evidence |
| --- | --- |
| `public.closet_backups` | RLS ON, owner predicate for `authenticated` on all actions with `USING` and `WITH CHECK` |
| `closet_backup_writer` | Dedicated writer role also has owner-row policy; verify separate approved writer route before live launch |
| `storage.buckets` | `closet-private` is **not public**, has size and MIME restrictions |
| `storage.objects` | RLS ON, `authenticated` SELECT/INSERT/DELETE restricted by bucket and first object path folder = `auth.uid()` |
| Object UPDATE policy | No general Storage UPDATE rule observed. Current `cloud-backup.js` uses immutable content-hash `POST`, verifies already-existing hash on conflict, and does NOT use upsert. **Do not add a broad UPDATE policy** without new evidence that upsert/replace is needed |
| Security advisor | One WARN: `auth_leaked_password_protection` disabled. [Supabase remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Check plan/cost before enabling anything |

Existing staging has one Auth user, one backup row and one private object, but **no email/UUID/JWT/row body/photo file** was retrieved or committed.

### 2. Role simulation results — read-only and NOT genuine JWTs

Queries ran inside `BEGIN READ ONLY; SET LOCAL ROLE ...; SET LOCAL request.jwt.claim.sub ...; SELECT COUNT(*) ...; ROLLBACK`. Matching owner identifiers were derived **inside PostgreSQL** from a stored row/path and were never returned, copied into source, or transmitted to other tools.

| Probe | Visible rows/objects |
| --- | --- |
| Synthetic matching authenticated backup owner | **1 backup** |
| Synthetic matching authenticated private photo folder | **1 object** |
| Synthetic foreign identity A | **0 backups / 0 photos** |
| Synthetic foreign identity B | **0 backups / 0 photos** |
| Anonymous backup table | **Permission denied** |
| Anonymous private photo folder | **0 photos** |

These results are promising defense checks; **they are NOT a signed-in JWT A/B security verification** and do not prove inserts, changes to `owner_id`, overwrites, direct Storage URLs, signed URL expiry, deletion, account recovery or revocation behavior.

### 3. Resend email — NEW domain verification evidence, not SMTP completion

On October 24 the owner provided a Resend dashboard screenshot showing **`mail.closet-current.com` Verified** and Resend Forge enabled. This supersedes the historical **Pending** owner screenshot inside [draft PR #278](https://github.com/nickhaney916-lang/Closet-Current/pull/278). That older dated test snapshot MUST NOT be rewritten as though its original observation was Verified. The sanitized NEW October 24 checkpoint carries the later verified screenshot evidence.

No live access to the Resend or Supabase Auth SMTP settings dashboards is available to this audit. Last owner-observed staging custom SMTP was **OFF**, and no Resend sending credential, Supabase SMTP entry, delivered confirmation, reset email or expired-link retry has been verified.

Public, nonsecret SMTP proposal after explicit owner approval:

| Staging Auth SMTP setting | Value |
| --- | --- |
| Sender | `accounts@mail.closet-current.com` |
| Sender name | `Closet Current` |
| Server | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Restricted **Resend sending-only** API key entered directly and privately in the **staging** Supabase dashboard |

Never paste SMTP/Resend keys, JWTs, refresh tokens or magic links into chat, browser screenshots, GitHub, Cloudflare rules or public client code. No SMTP message was sent here.

### 4. Hosting/registration security decisions BEFORE family invitations

- The **previously observed** staging Site URL and single redirect still point to `https://pilot-access-check.closet-current-staging.pages.dev/`, a harmless access-test page. The actual app root candidate is `https://closet-current-staging.pages.dev/`. Neither has been rechecked live via dashboard, and app deployment remains **not authorized**.
- Supabase documented `redirectTo` must match allowed Auth Redirect URLs; update the exact protected stage URL **only when the approved app hostname and Cloudflare Access protections are ready**. Do not send user email links to pilot-only test page. See [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
- The last owner screenshot showed **public self-signups enabled** and anonymous sign-in off. **Cloudflare Access on a `.pages.dev` host does NOT gate direct requests to Supabase `/auth/v1/signup`**, so do not rely on page protection for invite-only enrollment. Review whether to pre-create intended test users then disable public self-signups, or implement/review a Before User Created hook for allowlisted invitations. Do not indiscriminately disable signup before confirming how approved tester creation will work. See [Supabase General Configuration](https://supabase.com/docs/guides/auth/general-configuration).
- Staging Auth code remains built `HOLD-NO-CALLBACK-OR-KEY`, with **empty** publishable key and callback. Auth and backup use staging project only; paid AI disabled in the combined recognition/2D avatar preview.
- Supabase now restricts custom default-SMTP email templates on **new Free projects**. Custom SMTP restores branded template editing if the plan has that restriction. [Supabase June 3, 2026 change](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier). Do not activate paid services merely to customize emails.

## Owner-controlled staged setup sequence

1. **Security choice:** Establish who may create the four Family Alpha accounts and when; verify **live** staging Email provider/self-signups and direct endpoint behavior. Decide explicit invite-only enrollment. Prefer using a disposable test identity first.
2. **Protected URL choice:** Review Cloudflare Access for the staging root **and every preview alias** (do not assume protection from another Pages host). Confirm exact app URL. Record approved Site URL and precise non-wildcard redirect destinations in **Staging only** after the app is actually deployed/protected.
3. **SMTP secret creation:** In Resend → API Keys, create a dedicated `Closet-Current-Staging-SMTP` **Sending access** key, domain-restricted where available. Enter it DIRECTLY into the **staging** Supabase Authentication SMTP password field, with the nonsecret settings above. Don't share it.
4. **Email QA:** Check Resend's send log and disposable mailbox for signup confirmation, magic-link/OTP as applicable, expired/resend behavior, password recovery and callback into the protected stage. Do not enable SMS or accidental open registration.
5. **Genuine JWT and Storage QA:** With two authorized disposable staging identities, prove each account can insert/select its OWN `closet_backups` and photos and cannot access/write/delete the other's. Verify overwrite and signed URL behavior, then revoke test sessions. Avoid any real family wardrobe data until this is green.
6. **Four-person device QA:** Only after owner approval and green protected endpoint plus email tests, invite family testers; validate real Android/iOS original-camera photo, category/color, cropping, closet save/restore, account switching and 2D outfit layering.

## Reproducible code gate

```bash
node scripts/build-family-alpha-staging-auth-hold.mjs
node scripts/family-alpha-stage-security-email-gate.mjs
node --test tests/family-alpha-stage-security-email-gate.test.mjs
```

The gate validates the **dated sanitized live read-only observations + owner Resend screenshot** and the **current disabled staging Auth build**. It deliberately fails closed if a prior screenshot is relabeled as successful SMTP delivery, simulated SQL session is misrepresented as genuine JWT security, live config or Cloudflare Access is falsely marked verified, a key is included, or production becomes the Auth target.

**Verdict: Resend domain VERIFIED by owner screenshot; RLS metadata and role-simulated access checks PASS; SMTP, exact stage callback, direct signup restriction, protected Pages host, genuine JWT cross-account Storage and physical phone readiness = NOT VERIFIED. Family Alpha remains HOLD.**
