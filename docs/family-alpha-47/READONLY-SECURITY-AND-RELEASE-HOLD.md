# Closet Current Family Alpha #47 — fresh staging policy + owner-private photo board

**Date:** October 27, 2026
**Scope:** Development-only, read-only Supabase staging inspection and source-locked offline Family Alpha assertions.
**Final status:** HOLD — no merge/deployment, live account creation, credential access, production changes or invitation.

## What was independently verified today

Only the **staging** project `fbnplztkbsteuzrmbgib` was inspected through read-only project metadata and SQL. No user row contents, email addresses, actual JPEGs, account tokens, private backups, paid services, Auth settings or production resources were read/modified.

| Item | Observed read-only result | Meaning |
| --- | --- | --- |
| Staging status | ACTIVE_HEALTHY | Infrastructure exists; this is not a release |
| Registered auth users | **1** | Four distinct verified people are **not** present |
| Accounts with unexpired sessions | **1** | Does not prove the session works on a current browser |
| Cloud backup table | 1 row / 1 distinct owner | Only count metadata obtained; actual backup contents not accessed |
| `public.closet_backups` | RLS enabled; owner-matching USING and WITH CHECK | Policy shape is encouraging; separate-owner test still needed |
| Backup grants | `authenticated`: SELECT; `closet_backup_writer`: SELECT/INSERT/UPDATE | Frontend is not directly granted backup writes. Read-only function-ownership check now confirms the restricted private definer helper; direct writes are intentionally denied |
| Private photo bucket | `closet-private`, private | Not publicly listed |
| Photo format/limit | JPEG only; 8,388,608 bytes | Photo upload constraints checked |
| Photo storage | 1 object (count only), RLS on | Photo contents NOT viewed |
| Storage policy | SELECT/INSERT/DELETE owner-folder-scoped; no UPDATE policy | Compatible with immutable content-hashed object approach; not proof for upsert/overwrites |
| Auth security advisor | **Leaked Password Protection Disabled** | Active warning; do not enable pilot until remediated and rechecked |
| JWT owner A/B read/write isolation | NOT TESTED | One registered user cannot prove cross-owner protection |
| Cloudflare stage access, simultaneous family sessions, Android/iPhone devices | NOT TESTED | No live validation was performed |

**Backup RPC correction (2026-10-27):** The previous provisional staging cloud-backup write-permission blocker has been retracted after tracing the public `SECURITY INVOKER` wrapper into the private `SECURITY DEFINER` helper owned by the no-login, no-RLS-bypass `closet_backup_writer` role. The private helper enforces owner and revision checks under RLS. This structure explains the lack of direct authenticated write grants. This does not establish that a real signed-in backup RPC has succeeded; that live API test is still pending. See [correction and role details](STAGING-BACKUP-RPC-PERMISSION-BLOCKER-HOLD.md).

Supabase advisor remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Exact integration boundary

The tested photo-board source is draft [#349](https://github.com/nickhaney916-lang/Closet-Current/pull/349) pinned at `b771329a5502cf53e495c860fe8c342d7ca3443a`. It reads a selected item by ID from the current private local IndexedDB, binds original JPEG crop SHA to the signed-in account and session, and fails closed on mismatched originals, owners and sessions. This remains an **offline synthetic test**, not real JWT/API proof.

The existing [#346](https://github.com/nickhaney916-lang/Closet-Current/pull/346) release gate still reports visual FAIL for worn garment overlays, 0 approved cutouts, missing real four-account tests and no physical phone approval. The independent [#350](https://github.com/nickhaney916-lang/Closet-Current/pull/350) 15-photo screenshot gallery passes technical browser rendering but is visually REVIEW, not owner accepted. Work #44 has separate responsibility for future style improvements.

This branch adds only a **new evidence record**, **negative-case tests**, **new release checker** and **dedicated no-deploy CI**. It does not alter source photo decoding, styling, recommendation, Auth, Supabase or actual storage. Existing checkers are called, not weakened or rewritten. The successful release result is deliberately `HOLD`.

## Required next independent real-world gates

1. Remediate the staging leaked-password warning through a separately approved settings change; inspect stage access and redirect restrictions.
2. Establish at least two distinct safely controlled adult staging test accounts; validate owner A/B read, write, delete and object-storage denial with **real JWTs** while monitoring unauthorized signups. Extend to four separately authorized accounts only when appropriate.
3. Validate the exact approved candidate on physical Android and iPhone with newly captured original garment photos, sign-in and sign-out, three outfits, source correction, one-piece swap, favorites and secure recovery.
4. Have the owner examine and explicitly approve attractive **photo-only** outfits if treating 2D on-avatar compositing as a separate future objective.
5. Refresh the read-only metadata snapshot and rerun the unchanged Family Alpha gate before any staging release decision.

The project remains development-only and **cannot automatically deploy** regardless of whether these checks pass.
