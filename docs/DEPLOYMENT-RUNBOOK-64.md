# Closet Current — Isolated Deployment Runbook 64

This runbook prepares a release candidate without changing production, existing staging, Supabase, or the Family Alpha HOLD. The production Pages workflow currently deploys from `main`; do not merge or dispatch it as part of this candidate.

## Build and package

Requirements: Node.js 22, GitHub Actions pinned test dependencies, and no application secrets for static packaging.

```sh
npm install --no-save --no-package-lock --no-audit --no-fund \
  playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 \
  three@0.180.0 three-mesh-bvh@0.9.2 axe-core@4.10.3
node scripts/build.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
```

The generated `dist/` is static output. The candidate workflow produces a SHA-256 manifest and uploads `dist/` as a non-deployable Actions artifact. The artifact must not be manually published while Issue #255 is HOLD.

## Isolated hosting gate

Before hosting, the owner must provide or authorize a new disposable project and fresh credentials. The project must have a new unique URL, access restrictions, synthetic-only data, HTTPS, and no connection to the existing production/staging or live Supabase projects. Do not copy any live database, storage bucket, API key, user record or wardrobe photograph.

Configure only the disposable project's public client settings. Keep server keys in the hosting provider's secret store; never place them in repository files, build logs, Actions artifacts or the browser bundle. Apply schema and bucket policy changes only to the disposable project after reviewing the migration and access policies. Test independent synthetic owners and denial cases before loading any non-synthetic content.

The current assignment does not contain an authorized target or credentials, so no hosted deployment or live account verification is claimed.

## Smoke test after separate deployment authorization

1. Confirm TLS/HTTPS, routing, static asset cache headers, service-worker versioning and no console/build errors.
2. Create two disposable accounts; verify sign-up, confirmation, sign-in, sign-out, session restore, password reset and session revocation.
3. Use synthetic JPEGs to capture/import, correct recognition, save, edit, delete, duplicate-check, reopen and retrieve originals.
4. Create, swap, save and reopen outfits; verify owned-item recommendations never introduce generic garments.
5. Verify private storage and database access with both valid-owner reads and wrong-owner/expired-token denials.
6. Interrupt uploads, network and restore; confirm atomicity and unchanged data after failure.
7. Run Chromium and WebKit at 320/390/430 CSS px, then repeat capture and lifecycle checks on physical Android Chrome and iPhone Safari.
8. Record URL, build SHA, workflow IDs, synthetic test identities (never credentials), screenshots and failures in the candidate record.

## Rollback

For a disposable static host, retain the previous artifact and deployment identifier. Roll back by restoring the previous artifact through that host's documented rollback action, then verify HTTPS, app shell and login denial/restore behavior. For a disposable backend, use its tested snapshot/restore procedure; do not run destructive restores against production or existing staging. Rotate only disposable credentials if exposed. No rollback has been exercised because no deployment was authorized or created.

## Release gate

Do not merge protected branches, dispatch the `main` Pages workflow, change live Supabase, invite family testers, or remove Issue #255 HOLD without separate owner approval. Before that approval is requested, close the blockers listed in [Release Candidate 64](RELEASE-CANDIDATE-64.md) and verify the final commit SHA end to end.
