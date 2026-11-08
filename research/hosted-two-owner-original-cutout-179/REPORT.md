# Closet Current — MAIN Priority #179 — authenticated hosted two-owner ORIGINAL + reviewed CUTOUT security acceptance

**FAMILY ALPHA #255 HOLD. Draft research only, never deployed or merged.**

## Environment safety determination

Connected Supabase projects were inspected read-only on November 8, 2026. The ONLY available Closet Current account projects are production `hlkgymugtfbirlpunsra` and existing staging `fbnplztkbsteuzrmbgib`. Both must remain entirely unmodified. **There is NO available separately owner-approved disposable Supabase test project. No genuine hosted Auth JWT, live PostgREST or live Storage operations have been performed.**

## Implemented

Building on exact independently verified main P178 PR #739 HEAD `0c36f8510b5dfb2f4b4b372ca3931d1e2c30d040`, main P179 adds exactly five isolated research files and a MANUAL ONLY test against a future separately-approved disposable hosted project: `research/hosted-two-owner-original-cutout-179/hosted-acceptance.mjs`, `scripts/run-hosted-two-owner-original-cutout-179.mjs`, `tests/hosted-two-owner-original-cutout-179.test.mjs`, this report, and a four-job no-deploy CI workflow.

P179 extends the prior P169 single fake-image hosted acceptance: it now uses real independently pinned licensed Commons original photo plus a separately reviewed crop. Before any cloud IO, it runs the ACTUAL P126 full owner/source provenance verifier and P128 dual SHA JPEG packager. The two real isolated Auth users must supply independently server-validated `/auth/v1/user` bearer identities, matching JWT issuer, session, audience, role and subject. It then uploads **four immutable owner-scoped JPEG objects** in two distinct accounts, creates each backup via actual private PostgREST `save_closet_backup` revision-one CAS, checks owner A/B records under each original token, and re-fetches both originals/crops with SHA and genuine P126 review verification and saved outfits before accepting restore-readiness. Also tests cross-account Storage GET and POST refusals, foreign backup SELECT denial, stale CAS refusal, anonymous metadata denial, and genuine Auth refresh-token revocation after logout. A signed access JWT may remain valid until expiry; never claim immediate access-token invalidation.

Preflight rejects any request lacking explicit `I_OWN_THIS_DISPOSABLE_TEST_PROJECT` consent, two disposable credentials, a matching 20-letter HTTPS Supabase project reference, or public-only publishable key. Production and staging project references are *always denied*, even if consent is supplied. The manual runner never logs passwords, JWTs, refresh keys or private source data, and it is never scheduled or called by CI with hosted secrets.

## Independent CI

1. Exact P178 ancestry, five research-only paths, complete Node regression suite, all P179 focused malicious server tests. The hosted runner must *fail-closed without the manual environment*, and runs no remote traffic.
2. Actual unmodified owner-private RLS/CAS SQL against **disposable PostgreSQL 17** with cryptographically signed and server-verified local RS256 JWT harness P147 plus independent P128 read/write tests. This is not Supabase-hosted Auth.
3. Existing P167 true Closet Current mobile original-photo-to-saved-three-owned-looks Chromium/WebKit acceptance at 320/390/430 with 12 genuine PNG SHA checks.
4. Existing P178 native real account-menu original PLUS reviewed cutout backup/restore Chromium/WebKit at 320/390/430 with 30 independently hashed real browser screenshots and owner isolation; synthetic local tokens only.

Tested local HTTP fixtures in P179 independently validate RS256 signatures server-side before returning owner data. They prove that the *hosted runner's client logic* rejects malicious two-owner RLS leaks, foreign Storage reads/writes, wrong token identity and missing refresh revocation. **This remains an impersonated local test server, not hosted acceptance.**

## Hosted release blocker / explicit deliverable

**Do not declare actual hosted signed-account acceptance complete on the basis of passing CI.** The separately isolated disposable Supabase project must first be provisioned and authorized, initialized with reviewed `supabase/cloud-backup.sql` and two fresh test users, then manually run `node scripts/run-hosted-two-owner-original-cutout-179.mjs` with the existing P169 environment variables. Only a report of `P179_GENUINE_HOSTED_AUTH_TWO_OWNER_ORIGINAL_AND_CUTOUT_PASS` from that actual HTTPS project can clear this specific acceptance condition. Do not apply changes to production or current staging or reuse real user photos. Independently verify mobile hardware and privacy before lifting Family Alpha HOLD.
