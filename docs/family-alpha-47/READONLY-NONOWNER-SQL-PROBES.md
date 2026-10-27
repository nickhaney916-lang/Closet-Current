# Family Alpha #47 — Staging RLS two-synthetic-nonowner SQL probes

**Observed:** 2026-10-27, staging Supabase project `fbnplztkbsteuzrmbgib` only. Read-only transaction-scoped SQL role emulation, not a production request, not actual user sign-in, and not a JWT signature verification.

## Results verified against the live staging policy engine

| Test | Synthetic user A | Synthetic user B |
| --- | --- | --- |
| `current_user = 'authenticated'` | `true` | `true` |
| `auth.uid()` equals that transaction's **synthetic** claim | `true` | `true` |
| `count(*)` of visible `public.closet_backups` | `0` | `0` |
| `count(*)` of visible `storage.objects` in `closet-private` | `0` | `0` |
| Transaction mode | `READ ONLY` | `READ ONLY` |
| Transaction outcome | `ROLLBACK` | `ROLLBACK` |

The original metadata snapshot reported **one** backup row and **one** photo object in staging. Thus, for these two synthetic non-owner claims, RLS hid all existing rows. The exact source owner identifier was **not read**, no clothing/photo/backup contents were viewed or returned, and no staging rows, accounts, storage objects, passwords, settings, or policies were modified.

## Exact reproducible query template

Use two separate transactions with **only fixed synthetic UUIDs**, such as the examples below. A test account is **not** created. This is a privileged SQL-console role simulation; it does not exercise Auth, PostgREST, Cloudflare Access, real user JWTs, signed HTTP requests, or app persistence. Never paste real JWTs into SQL, logs, GitHub or issue comments.

```sql
BEGIN TRANSACTION READ ONLY;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
SET LOCAL ROLE authenticated;
SELECT
  current_user = 'authenticated' AS role_verified,
  auth.uid() = '11111111-1111-4111-8111-111111111111'::uuid AS synthetic_claim_verified,
  (SELECT count(*) FROM public.closet_backups) AS visible_backup_count,
  (SELECT count(*) FROM storage.objects WHERE bucket_id='closet-private')
    AS visible_photo_object_count;
ROLLBACK;
```

The second transaction substitutes `22222222-2222-4222-8222-222222222222` for the first fixed UUID in both places. **Expected:** `role_verified = true`, `synthetic_claim_verified = true`, both row counts zero. If the role cannot be assumed or either assertion fails, the test is **not** a valid pass.

## Interpretation and next gate

**Positive evidence:** Two independent transaction-local `authenticated` SQL role simulations with different synthetic user claims were unable to see existing backup or photo rows. This supports the current non-owner RLS `SELECT` policy on the actual staging Postgres tables.

**Not established:** The test does not prove that a real owner can read their own row; does not prove cross-user read/write/delete denial using two actual JWT-authenticated accounts; does not exercise the authenticated Storage REST endpoints or backup writer server functions; and cannot verify safe Cloudflare protected staging or real physical phone sessions. The staging leak-password protection advisory remains disabled. It cannot authorize Family Alpha.

The next live test requires two deliberately controlled and approved adult staging test accounts and a separately verified protected staging site. Test actual owner A/B requests with legitimate isolated sessions. Use only synthetic garment records, record only pass/fail and counts, and never put passwords, access tokens, real JPEGs, backup contents or family identifiers in public PRs.

**Family Alpha decision remains HOLD.** Work #44 independently owns photo-board visual improvement. No merge, deployment, staging/production settings, real account creation or costs authorized by this evidence.
