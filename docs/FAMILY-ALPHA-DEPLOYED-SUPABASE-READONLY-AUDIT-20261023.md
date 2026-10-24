# Closet Current — Family Alpha deployed Supabase metadata audit

**Date:** October 23, 2026  
**Project:** Family Alpha v0.1, [tracking issue #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255)  
**Mode:** Actual connected Supabase **READ-ONLY schema/security metadata**. No deployment, SQL writes, user profile queries, Auth tokens, individual backup records, Storage objects, photos or production settings changed.  
**Verdict:** **HOLD**. This report verifies deployed *policy definitions and privileges* but NOT four-account API permission behavior.

## Sources and environments

Connected Supabase project metadata for **Closet Current** (`hlkgymugtfbirlpunsra`, production) and **Closet Current Staging** (`fbnplztkbsteuzrmbgib`, separate project). Both report `ACTIVE_HEALTHY` on the audit date.

Queried Postgres catalogs for `public.closet_backups`, its RLS policies, function identity/security/EXECUTE privileges and storage.objects bucket policies; queried `storage.buckets` only for the private bucket's public flag, JPEG type and size. Inspected **actual staged** `closet_rpc_private.save_checked` function definition and schema/role permissions. Consulted each Supabase project security advisor. This file's sanitized observed metadata is in `research/family-alpha-live-readonly/metadata-2026-10-23.json`; no user-specific data was read or saved.

**No JDBC/REST authenticated-user cross-owner requests were attempted.** Read-only admin inspection is not a substitute for normal-JWT RLS testing. Neither project is approved for family rollout based on this audit.

## Observed database/storage results

| Check | Production | Separate staging | Interpretation |
| --- | --- | --- | --- |
| `public.closet_backups` RLS | Enabled | Enabled | Deployed catalog verified |
| Authenticated `closet_backup_owner` | `auth.uid()=owner_id` USING & WITH CHECK | Same | Owner predicate observed |
| Anonymous table SELECT | None | None | Catalog checked |
| Authenticated direct table write | SELECT, INSERT, UPDATE, DELETE and more | SELECT only | Different authorization design, not automatically a staging bug |
| Public `save_closet_backup` RPC | SECURITY INVOKER; anon EXECUTE denied | SECURITY INVOKER; anon EXECUTE denied | Catalog checked |
| Staging private writer | N/A | Invoker wrapper calls SECURITY DEFINER `closet_rpc_private.save_checked`, owned by `closet_backup_writer` | Dedicated role has owner policy, INSERT/UPDATE/SELECT, **does not BYPASS RLS**; private function validates caller JWT subject |
| `closet-private` bucket | Private, JPEG only, 8 MiB | Same | Catalog checked; signed URLs not audited |
| Owner-bound Storage policies | SELECT, INSERT, UPDATE, DELETE | SELECT, INSERT, DELETE | Staging deliberately excludes UPDATE/upsert; immutable content-hash uploads via POST+GET may work, needs functional test |
| Additional Storage policies for bucket | None observed | None observed | Checked `storage.objects` policy catalog |
| Supabase security advisor | Leaked-password protection disabled | Leaked-password protection disabled | Harden before family exposure |

### Important production least-privilege finding

**Production `authenticated` has table privileges `TRUNCATE`, `TRIGGER`, `REFERENCES`, `DELETE`** (as well as SELECT, INSERT, UPDATE) on `public.closet_backups`. The currently reviewed client uses backups via read and save RPC, not TRUNCATE or TRIGGER. PostgreSQL RLS does **not apply to TRUNCATE**.

This does **not** demonstrate a remotely exploitable API endpoint, and the standard PostgREST data API does not automatically surface TRUNCATE. It is a meaningful unnecessary privilege that should be reviewed for least privilege and removed **only after approval and appropriate functional/RPC tests**. Never perform revoke/grant or modify policy during this audit. See Supabase [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) documentation.

### Staging writer path is intentionally different

A first-pass comparison found no direct authenticated INSERT/UPDATE grants and no photo UPDATE policy in staging. **Further live read-only inspection established that the missing table grants are intentional** in the observed design:

- public `save_closet_backup(bigint,jsonb)` is SECURITY INVOKER and callable by authenticated, not anon;
- its body delegates to a separately named private-schema RPC;
- `closet_rpc_private.save_checked` is SECURITY DEFINER **owned by dedicated `closet_backup_writer`**, with `rolbypassrls=false`;
- the writer has SELECT/INSERT/UPDATE grants and an owner-scoped RLS policy; ordinary authenticated role is not a member;
- private function checks request JWT `sub` as owner, requires schema/version/size constraints and uses owner-scoped revision updates.

This **looks deliberate and internally coherent from metadata**; it is **NOT** a demonstration that a signed-in user can save, restore and prevent a foreign-account write. Verify actual authorized REST/JWT behavior in an explicitly approved protected staging session. Staging Storage UPDATE is absent; current immutable content-addressed POST upload and GET-on-conflict client may not require it, but upsert is not supported without further policy and intended-product review.

## The immediate staging routing blocker

The development application still contains:

- `public/auth.js` API base URL `https://hlkgymugtfbirlpunsra.supabase.co` — **production**;
- `public/auth.js` Auth callback `https://nickhaney916-lang.github.io/Closet-Current/` — **GitHub Pages**;
- the isolated Family Alpha artifact is **hard-disabled on all non-localhost hosts**; it has not been configured for an approved protected preview origin.

An app deployed to a Cloudflare staging website without changing these pieces could authenticate to the wrong backend or return to GitHub Pages. **Do not activate Family Alpha staging with current live routing.** A future staging-only build needs explicit environment binding of the stage project, correct registered redirect allowlist, private access, and authorized test accounts. Never modify the production `dist` build or production Auth configuration without approval.

## What remains NOT VERIFIED

1. A real low-privilege signed-in staging Account A can save, reload, and retrieve only its own backup/photo.
2. A separate synthetic staging Account B cannot read/write/delete Account A's row or photo, cannot guess object paths, and cannot reuse signed URLs longer than intended.
3. The private writer allows correct same-account revision handling and rejects forged owner fields; no other permissive policies or privileged alternate endpoints permit bypass at REST layer.
4. Cloudflare Access genuinely protects the test site before Auth, is configured separately from production and grants only approved testers; correct Auth redirect/SMTP delivery and logout tested.
5. Real hardware camera/photo cutout/retake/session behavior on Android/iPhone, four consented family users, photo privacy and feedback collection.
6. Whether leaked-password protection will be enabled for each environment and the production excessive backup-table grants narrowed safely.

**Next phase requires explicit approval** for staging deployment and test-account setup, then test with **disposable synthetic Auth identities and synthetic JPEGs first**. Do not query real family records or photos. Do not merge/deploy, change schema/grants, activate paid features or spend money, or touch Drive Duel.

## Reproducing the checked-in static evaluation

`node scripts/family-alpha-readonly-supabase-snapshot-check.mjs` evaluates **the dated sanitized snapshot OFFLINE**, checks source routing and prints HOLD findings. `node --test tests/family-alpha-readonly-supabase-snapshot.test.mjs` mutates synthetic copies to prove that a missing owner predicate, public photo bucket, unreviewed private writer, or false authorization claim fails closed.

These CI tests **do not reconnect to Supabase** and must never be labeled an up-to-date live RLS test. Repeat the deliberate read-only catalog inspection through authorized Supabase tools to refresh this report when live configuration changes. No customer data collection is necessary.
