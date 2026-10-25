# Closet Current — Family Alpha v0.1 protected staging JWT A/B preflight

**2026-10-25 · Issue #255 · DEVELOPMENT-ONLY · NO STAGING CHANGES, NO INVITES, NO DEPLOY**

## Read-only staging metadata observed today

Project `fbnplztkbsteuzrmbgib` (staging only, not production `hlkgymugtfbirlpunsra`) returned:

| Check | Observed |
| --- | --- |
| Exact `auth.users` count | **1** (the existing owner; do not list personal addresses) |
| `public.closet_backups` RLS | **ON** |
| `closet_backup_owner` policy | `FOR ALL TO authenticated` with `USING` and `WITH CHECK` matching `auth.uid()` against `owner_id` |
| `closet_backup_writer_owner` | Separate, owner-scoped restricted writer role policy |
| `closet-private` bucket | **Private** |
| `storage.objects` policy names | `closet_photos_read`, `closet_photos_insert`, `closet_photos_delete`, each owner-folder restricted |
| `closet_photos_update` policy | **Absent**. This does **not** grant unauthorized UPDATE access. App currently uploads immutable content-addressed JPEGs by POST and reads by GET; it does not require overwriting existing objects. Review only if future upsert/replacement becomes a requirement. |
| `anon` SELECT permission on closet backup table | **False** |
| `authenticated` TRUNCATE permission on closet backup table | **False** |
| Supabase security advisor | **WARN: leaked password protection disabled**, see https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection |

These are **metadata observations**, not successful JWT A/B cross-user denial probes. No actual backup documents, users' emails, photos, tokens, or secrets were retrieved. A prior owner screenshot confirmed signup disabled, staging custom Resend SMTP entered, main staging root added to Auth redirect allowlist, while **Site URL still points to pilot-access-check**.

## New testing utility

`scripts/family-alpha-live-jwt-readonly-gate.mjs` exports a future **import-only**, no-default-network probe. It has no live executable CLI path. Synthetic tests are run inside GitHub Actions without provider credentials or external requests.

For a separately authorized executor after a proper staging deployment:

1. Require **explicit owner approval** to use real staging JWTs; use only two disposable adult test identities, no minors or real customer data.
2. Confirm the supplied bearer identity separately against `GET https://fbnplztkbsteuzrmbgib.supabase.co/auth/v1/user` for A and B; abort further reads on any failure.
3. Query only `owner_id,revision` from `public.closet_backups` for each account's owner ID. Expect one existing synthetic backup for its owner and zero rows for the other account. Missing fixture rows are **INCONCLUSIVE**, not a pass.
4. Run **HEAD only** for the two known synthetic `closet-private/<owner-UUID>/<sha256>.jpg` fixtures. Own path 2xx plus other account 401/403/404 is **preliminary** evidence. If HEAD is unsupported, treat results as **INCONCLUSIVE**, not pass. No image body is downloaded.
5. Never print tokens, publishable key, private photo paths, account email, or backup contents; never issue HTTP methods other than GET or HEAD, no anonymous signup, invite, RPC, upload, delete or config change.
6. The utility's only green outcome is `PRELIMINARY_READ_ONLY_PASS`, and **even that maintains `releaseGate:'HOLD'`**. It does not cover row INSERT/UPDATE/DELETE, private JPEG writing/upsert/delete, server backup RPC write ownership, signed URLs, actual staging full-app sign-in, link callbacks, or Android/iPhone capture.

## Mandatory later family release gates

- Owner-approved full-app staging upload with Stage Auth correctly activated only at `https://closet-current-staging.pages.dev/`, root Site URL/callback verified and no production endpoints or service-role key in client.
- Completed unapproved-identity denial test, full uploaded static asset route checks and approved owner login.
- Actual JWT A/B positive **and** negative signed-in tests with disposable backup/JPEG data; write and RPC tests only after a separate explicitly approved safe staging data-write plan.
- Verify password invite/reset links, no direct self-registration, session switching and valid email delivery; enable leaked password protection if supported/approved and appropriate.
- On physical Android and iPhone devices with consent, verify original captured photo → category/color correction → saved closet → visible photo cutouts on layered 2D human → three outfit suggestions and one-piece swap.
- Evaluate children's privacy and safe feedback before invitations. Record a **separate explicit GO decision**.

**Everything in this pull request is code/documentation for a future checkpoint only. No Auth users were created, no provider settings were changed, no real photo, secret, staged JWT, or account data was accessed, and no deployment, merge, production or Drive Duel change occurred.**
