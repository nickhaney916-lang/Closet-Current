# SIGNED-BROWSER-CLOUD-E2E-37 — Parallel #30

Research only. Family Alpha Issue #255 remains HOLD. Never merge or deploy production or existing staging.

## Starting point and isolation

- Exact verified parent: PR #594, SHA 77d5c760c847d6e2f544512e80fd8598fd610dad.
- Branch: research/signed-browser-cloud-e2e-37-parallel30-20261104-HOLD.
- Dedicated workflow: .github/workflows/signed-browser-cloud-e2e-37-no-deploy.yml.
- No production or staging application or SQL modifications.
- Two random accounts per scenario, synthetic photos only, one disposable local Supabase stack, repository cloud-backup.sql, private Storage bucket and owner-row RLS.
- Embedded hosted Supabase URLs in public/auth.js and public/cloud-backup.js are intercepted only inside this Playwright research test. route.fetch forwards actual requests and genuine server responses to loopback and swaps only the publicly embedded hosted apikey for the disposable local public key. It never manufactures a successful Auth response or substitutes a cloud storage stub.
- Every other external request is blocked. No hosted account, photo, API or production database is touched.

## Browser-to-cloud path

Each of Chromium and WebKit at 320, 390 and 430 px runs a continuous two-owner scenario: real local password Auth; verify signed account identity; import an unchanged three-region synthetic JPEG; manually crop and confirm Tops/T-shirt, Bottoms/Jeans, Shoes/Sneakers in the real application; save three independently reviewed items to owner-private IndexedDB; verify genuine app cloud upload, server-side backed-up document and original image SHA-256; logout and immediately revoke a stale second tab with an unfinished photo; authenticate a distinct user B; verify no owner A records in B; save and back up B's distinct three items; attack both owner records and private Storage objects with genuine signed requests in both directions; and recover A and B separately in fresh browser contexts from actual cloud data.

Reports explicitly distinguish real signed browser-to-cloud work from automatic segmentation accuracy and actual phone testing. The model is intentionally blocked; crops are human-operated through actual UI controls. Ten screenshots per scenario are intended (60 across six), audited for format, size, SHA-256, nonblank content and absence of credentials in structured evidence. Generated photos are synthetic.

## Reproduction

Requires a Linux runner with Docker, Node 22+, Playwright 1.56.1, sharp 0.34.3 and Supabase CLI 2.48.3. The latter is pinned because Supabase CLI 3.0.0 (November 2, 2026) changed command defaults. Use the exact workflow steps on an isolated disposable local project. CLI help should be checked before any CLI changes.

Set up a disposable local Supabase project named closet-signed37, set local jwt_expiry to 3600, start it, and apply supabase/cloud-backup.sql to its Postgres database. Export only the local CLI status credentials to a temporary private file outside the repository, then run:

    SUPABASE_TEST_ENV=/path/to/disposable-only.env node research/signed-browser-cloud-e2e-37/browser-cloud.mjs
    node --test tests/*.test.cjs tests/*.test.mjs

No actual test passwords, refresh tokens, bearer JWTs, local API keys, email addresses or service-role credentials belong in committed code or uploaded evidence. Always terminate the disposable Supabase stack without a backup afterward.

## Acceptance boundaries and open work

Do not call PASS without checking the final exact-head successful dedicated GitHub Actions and independently inspecting actual PNG screenshots, as well as demonstrating all requested failure/race cases. The initial harness covers real identity, UI, owner-local privacy, app cloud adapter, server-side original-photo hashes, cross-account RLS denials, fresh-context recovery and cross-tab logout. Expanded cases for logout during photo decode, crop editor, IDB preflight, cloud upload/commit, interrupted upload retry, corrupt recovery, token expiry, refresh failure, conflicting revision and duplicate region submission still require independent evidence. A successful local signed test is never proof of hosted Supabase security. Neither Chrome/WebKit simulation nor screenshots are physical Android/iPhone acceptance. Family Alpha stays HOLD.
