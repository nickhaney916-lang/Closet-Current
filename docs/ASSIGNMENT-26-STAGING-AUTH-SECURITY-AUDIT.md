# Assignment 26 — independent staging security audit

Observed 2026-10-25 Pacific. **Family Alpha HOLD.** No deployment or settings changes.

## Scope and provenance

Staging only: `fbnplztkbsteuzrmbgib`. Production `hlkgymugtfbirlpunsra` was neither queried nor modified. No user table rows, object metadata rows, private photos, emails, tokens or backup documents were accessed. Queries read PostgreSQL policy/function/privilege catalogs and bucket configuration only. No SQL role impersonation, accounts, live write tests or email sends.

Reviewed PR #289 (`16508ec4676105a22bfc3df27cbc1fe386f6ff0e`), #292 (`ea1288bbb26ced04c71944c4ecc753c24bdaa664`) and #293 (`58f14a3cad08a2f1e1ffa8385b68649be635e694`). This audit branches from #293; only this report and one isolated characterization test are added. No staging-auth integration changes. Existing #289 role simulation and #292/#293 artifact tests are not duplicated.

## Fresh live evidence

| Surface | Observation | Limit |
| --- | --- | --- |
| Root host | Cloud Browser navigation to `https://closet-current-staging.pages.dev/` presents Cloudflare Access email/code challenge | No code requested. Does not prove unauthorized-email denial, asset routes, preview aliases, custom domains or direct Supabase restriction |
| Supabase dashboard | Staging Auth providers URL redirected to dashboard sign-in | Current signup/confirmation/recovery/redirect/session/hook settings unavailable through this browser; connector lacks Auth configuration reader |
| Public relations | `closet_backups` is the sole public table/view/materialized-view relation returned; RLS enabled, FORCE RLS false | Catalog scope is public, not proof of all configured exposed schemas |
| Backup policies | authenticated ALL: `auth.uid() = owner_id` for USING and WITH CHECK; separate writer ALL with request-sub owner predicate | Policy review, not signed-JWT behavior |
| Backup privileges | authenticated SELECT only; writer INSERT/SELECT/UPDATE | Do not widen grants to fix apparent client write absence; RPC is intentional |
| RPC | public `save_closet_backup` is invoker, empty search path, EXECUTE authenticated/service_role; delegates to private `save_checked` | No execution performed |
| Private writer | `save_checked` is SECURITY DEFINER owned by closet_backup_writer; empty search path, EXECUTE writer/authenticated, schema USAGE authenticated; owner derived from request claims, null rejected, document validation, revision guard, owner-constrained insert/update | Writer role is NOLOGIN, not superuser, no BYPASSRLS. No membership granted to authenticated observed. Catalog review only |
| Storage | `closet-private` private, JPEG only, 8 MiB limit; storage.objects RLS enabled | Bucket restrictions are not content-safety validation |
| Photo policies | authenticated SELECT/INSERT/DELETE restricted to closet-private and first path folder equal auth.uid(); no UPDATE policy | Covers stored objects by path, without reading any object or proving signed/download endpoints |
| Advisor | `auth_leaked_password_protection` WARN: disabled | Owner reviews availability/cost; no setting changed |

No observed policies authorize from user-editable user_metadata. No public-schema SECURITY DEFINER routine observed; the deliberately privileged helper is in the private schema with owner validation. FORCE RLS false alone is not a finding: ordinary authenticated role still encounters RLS; privileged owner roles require separate review.

## Registration conclusion

**Current unauthorized direct signup is unresolved, not proven denied.** Cloudflare Access protects its app host, not the separate Supabase Auth host. If signup remains enabled without an effective server-side enrollment hook, an outside visitor with the public project key can submit directly to Auth without loading the Pages app. Email confirmation proves mailbox control, not membership of the four-person pilot. Historical #289 signup-enabled observation is not a current setting read. Do not perform a live signup probe in this assignment.

Owner must verify signup enablement, all enabled identity providers/anonymous auth, Before User Created hook and intended four-account enrollment. Prefer an approved invite-only process enforced at Supabase, independent of Cloudflare. Do not treat CORS or redirect allowlisting as registration authorization.

## New offline finding: stale local session blocker

The new test executes the actual `stageAuthSource(public/auth.js)` in a VM with a synthetic stage configuration and fake fetch responses. It logs in a synthetic owner and forces refresh to fail with `refresh_token_not_found`.

Observed: getAccessToken rejects, but `closetAuth.user`, session generation, stored auth entry and unlocked appShell remain unchanged. The module has no storage-event listener for cross-tab sign-out. This confirms failure to revoke local UI identity on terminal refresh rejection in this module. It does **not** prove a server authorization bypass, cross-account disclosure or every avatar/wardrobe view remains visible: those components have additional guards. No actual closet data is used.

Recommended integration follow-up: on terminal refresh rejection, synchronously lock the shell, clear local session/identity, increment generation and invalidate pending cloud/avatar work; synchronize sign-out across tabs. Distinguish transient network failure from terminal session invalidation. Add release acceptance tests that assert locking, plus stale asynchronous-work and multi-tab tests. The audit test intentionally characterizes the OPEN defect; its passing result is not a security pass. Replace/invert it when fixed.

Database policies and writer validate owner identity, but do not check session_id against auth.sessions. Previously issued access JWTs may therefore remain usable until expiry after sign-out/revocation. This is normal JWT behavior, not a newly demonstrated exploit; determine acceptable expiry and whether immediate revocation is required. Current JWT lifetime/session configuration was not read.

## Original and derivative boundaries

Current cloud-backup code accepts JPEG data, owner-scopes object paths and uses immutable hash POST with conflict integrity verification. It retrieves objects with authenticated requests, not public URL construction. No broad UPDATE policy should be added just for upsert. Metadata policy evidence cannot prove safe rendering, sanitization, signed URL expiry or absence of sensitive cached images. A transparent PNG derivative is not supported by this bucket's JPEG-only MIME allowlist or current backup image encoder; do not assume masked derivatives are cloud-backed. Trace exact original/crop/mask persistence in the integrated artifact before launch. No MIME/storage changes authorized here.

## Actionable release blockers — main thread owns remediation

- [ ] Independently read current signup, confirmation, enabled providers/anonymous sign-in and enrollment-hook settings; establish direct Auth enrollment restriction before four-account onboarding.
- [ ] Read exact Site URL and redirect allowlist, recovery template destination and expiry, refresh rotation/reuse, JWT expiry and session controls. Record nonsecret values; no callbacks/keys changed by this audit.
- [ ] Resolve terminal refresh local-lock gap and cross-tab sign-out behavior; validate cached photos/IndexedDB reopening, bfcache and pending cloud/avatar operations.
- [ ] Verify all active hosting aliases and asset/API paths against Cloudflare policy inventory. Root challenge alone is insufficient. Do not probe production or guessed hosts.
- [ ] Main owner separately authorizes disposable JWT A/B read/write/delete/download-denial tests, signed URL behavior and revocation; this assignment forbids them. Four-account isolation is NOT verified by this metadata audit.
- [ ] Trace original JPEG plus cropped/masked derivatives through backup/restore, with owner identity and no public photo URLs.
- [ ] Review leaked-password warning without activating paid services.
- [ ] Verify email confirmation/recovery/callback and physical phones under separate authorization. #293 reports earlier SMTP delivery; not independently verified here and not a login proof.

## Validation

`node --test tests/assignment-26-session-audit.test.mjs tests/auth.test.cjs tests/cloud-backup.test.cjs`

45/45 passed locally: 1 OPEN-defect characterization plus 44 existing Auth/backup regressions. No live traffic from tests. No full integration suite rerun: application code untouched. These results cannot change release HOLD.

## Provider references

- https://supabase.com/docs/guides/auth/general-configuration
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Current official configuration/session docs were retrieved. Changelog markdown fetch was attempted but the retrieval service rejected text/markdown; no implementation or settings changes were made on undocumented assumptions.
