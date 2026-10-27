# Work #45 — staging authentication and backup readiness: HOLD

Source: PR #352 head 12dcc0bd7ee35eadad86503ae26cc9496a251b4a. This is a read-only inspection and offline verification, not authorization to deploy or begin Family Alpha. Staging project fbnplztkbsteuzrmbgib only; no accounts, backup records, photos, settings or production were modified.

## Evidence (2026-10-27)

| Check | Result | Scope / remaining work |
| --- | --- | --- |
| Stage identity | PASS | Connected project inventory identifies staging as ACTIVE_HEALTHY. |
| Backup policy structure | PASS | RLS enabled; authenticated owner predicate on USING and WITH CHECK. Authenticated SELECT only; dedicated writer has INSERT/UPDATE. No grants changed. |
| Restricted writer structure | PASS | Live metadata shows private SECURITY DEFINER save_checked validates authenticated claim, JSON shape, size and expected revision; public wrapper is invoker, search path empty. This is structural evidence, not live write proof. |
| Private photo policy structure | PASS | closet-private bucket is private; objects RLS and owner-folder SELECT/INSERT/DELETE policies exist. No live object bytes or user records inspected. |
| Leaked-password protection | FAIL | Live Supabase security advisor reports disabled. [Official remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Supabase documentation says feature is Pro plan or above; plan eligibility/cost not verified. Do not change configuration or incur costs without approval. |
| Offline staged routing and HOLD | PASS | Local build plus 37 targeted Node tests passed. Staged candidate lacks configured callback/key and fails closed. First execution had 2 missing-build-artifact failures; after building, 37/37 pass. Offline checks do not certify the deployed site. |
| Synthetic cross-owner client and account switch | PASS | Mock tests cover foreign-row, foreign photo pointer and account change while request pending. Not live RLS or login proof. |
| Revisions, duplicates, interrupted upload, retry | BLOCKED | Writer source shows revision guard; comprehensive live write/duplicate/interruption/recovery scenarios were not performed. Existing offline merge tests are not a substitute. |
| Staging root Cloudflare challenge | PASS (limited) | Cloud Browser navigation to the named staging root reached a Cloudflare Access email-code sign-in page without signing in. This does not verify allowlist rules, assets, alternate deployment hostnames or access from all network paths. |\n| Cloudflare Access coverage | BLOCKED | Alternate hostnames, assets, allowlist and origin bypass remain unverified. |
| Invitations, confirmation, recovery, session persistence | BLOCKED | Current live settings and end-to-end email flows not verified. No invitations or accounts created. |
| Production endpoint exclusion | BLOCKED | Offline staged candidate checks passed; deployed build and every deployment hostname not independently inspected. |
| Two real adult accounts / RLS and four family accounts | BLOCKED | PR #352 reports one registered staging user at its audit time. Its optional read-only two-token preflight has not been run here. Real positive controls and cross-owner reads/writes/downloads, physical phones and eventual owner approval remain outstanding. |

## Safest future procedure

1. Owner approves any configuration changes, paid features, account creation, invitation and live writes separately. Confirm stage project and hostnames and inspect Cloudflare Access including alternate deployment hostnames; ensure anonymous traffic cannot reach protected assets.
2. Owner verifies invitation-only signup, email confirmation, recovery redirect allowlist, session expiry/revocation, sender delivery and password policies in staging. Resolve the leaked-password warning only with explicit approval and cost/plan review.
3. Establish two distinct authorized adult staging sessions with synthetic-only garment JPEGs. On a trusted device use the opt-in read-only procedure in [PR #352's preflight](../family-alpha-48/EXPLICIT-READONLY-TWO-JWT-PREFLIGHT.md). Never share passwords, JWTs or photo contents in issues or logs. Require each owner’s backup and photo positive controls and denial in both cross-owner directions.
4. With separate explicit approval for live mutations, use two isolated synthetic wardrobes and known synthetic photos to check own create/read, optimistic revision conflict, duplicate upload behavior, interrupted save and retry, account switching/logout, restore and direct foreign backup/photo denial. Record only sanitized results. Do not grant direct authenticated writes to closet_backups; the restricted writer is intentional.
5. Repeat with four independently authorized accounts, physical Android and iPhone devices, owner visual acceptance and rollback/recovery procedures before a separate release decision.

No result here changes release authorization: **Family Alpha HOLD**.
