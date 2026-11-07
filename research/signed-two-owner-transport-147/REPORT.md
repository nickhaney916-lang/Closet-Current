# Closet Current — MAIN Priority #147 / SIGNED-TWO-OWNER-TRANSPORT-147

**FAMILY ALPHA ISSUE #255 HOLD · RESEARCH ONLY · DRAFT UNMERGED · NO PRODUCTION OR EXISTING STAGING MERGE/DEPLOYMENT · NO LIVE SUPABASE AUTH, DATABASE OR STORAGE CHANGES.**

## Provenance and why this priority exists

Main P146 [draft PR #700](https://github.com/nickhaney916-lang/Closet-Current/pull/700) exact verified HEAD `8b2975a4529b0cf88572261d1bdf9ea3873ca68c` had successful dedicated [2/2 no-deploy GitHub Actions #42408045172](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42408045172), 1,219 Node tests and six real app mobile viewport browser cases. P146 added the functioning native My Account backup/restore controller but deliberately **refused real account tokens**, using fake unsigned local bearer strings. Its P134/P137/P129/P128/P126 source-integrity and consent protections remain unchanged.

P147 tests a stronger integration boundary: cryptographically verified **ephemeral RS256 JWT owner identity**, dual-account isolation in real browser sessions and the actual unchanged PostgreSQL RLS/CAS/Storage policies.

## Implemented

- New `research/signed-two-owner-transport-147/ephemeral-signed-identity.mjs` generates a fresh RSA-2048 private key in the disposable test process, issues RS256 compact JWTs, verifies the signature and exact issuer, audience, role, UUID subject, session identifier, iat/nbf/expiry and active-session revocation. No private signing key is checked in, exported to clients, or uploaded as a test artifact. Untrusted user_metadata is explicitly ignored for authorization.
- An intentionally P146-prefixed signed-JWT **test envelope** is used because the unchanged P146 native research adapter only accepts `p146-synthetic-local-only-` and a loopback host. The server verifies the enclosed actual RSA signature on every private API request; neither the prefix nor caller-provided owner IDs constitute authorization.
- Actual existing P146 native UI and unchanged P134/P137 owner-cloud modules are tested using independently signed owners A and B with separate IndexedDB browser contexts and one local private HTTP/Storage server.
- The two private Cloud document names and JPEG object namespaces are bound to the **verified JWT sub**, not URL, metadata, or user input. Cross-owner reads, tampered JWT, unsigned fake token, wrong audience, expired token and revoked session are blocked. Both owners independently back up, restore, and preserve their own saved outfits and reviewed original+cutout SHA identities.
- Real disposable PostgreSQL 17 receives unchanged project `supabase/cloud-backup.sql` via existing P128 bootstrap. `scripts/test-signed-jwt-postgres-147.mjs` injects the owner ID into `auth.uid()` **only after cryptographic RS256 verification** and tests actual SECURITY INVOKER backup RPC, CAS, private Storage RLS and cross-owner denies. This is stronger than P128's unverified injected GUC but remains a *local trusted bridge*, not production Supabase PostgREST verification.
- `tests/signed-two-owner-transport-147.test.mjs` independently checks signature tampering, alg:none, unauthorized metadata, wrong issuer/audience, premature or expired JWT, unissued keys and revocation.
- Dedicated three-job GitHub Actions workflow: exact P146 parent and six approved research-only paths; focused + inherited Node and unchanged app build; signed-JWT + real disposable PG17 RLS; 6 dual-owner Chromium/WebKit native app scenario pairs at 320/390/430 CSS px, with screenshots and JSON artifacts. No deployment.

## What this is *not*

Cryptographically signed tokens are **generated locally for testing**. They are not hosted Supabase Auth JWTs, do not establish actual hosted PostgREST sign-in, email delivery, refresh/session invalidation or public/private HTTP Storage policy behavior, and are explicitly refused outside the isolated local research fixture. A local JWT verifier is not a replacement for checking hosted auth sessions or a real server JWT signing key.

Also not independently certified: physical Android/iPhone camera, 1,000-garment heap use with real photographs, model garment recognition accuracy, photo-realistic arbitrary 3D clothing fit, or end-to-end transaction atomicity across separate cloud and local stores.

## Acceptance and release

**Only call P147 verified after dedicated final exact-head three-job no-deploy CI passes.** Include actual node counts, PostgreSQL results, mobile scenario pairs, photo hashes and artifact locations in PR final report.

Maintain Family Alpha **HOLD**, keep this PR draft and unmerged, and never deploy to production or existing staging.

**Next release gate:** independently provision owner-authorized disposable hosted Supabase test project (not current production or staging), execute actual hosted issuer-backed two-account JWT/Storage/RLS tests with approved test credentials, and separately complete real-phone acceptance before release review.
