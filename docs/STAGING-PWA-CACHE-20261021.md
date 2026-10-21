# Closet Current isolated staging service worker cache QA — October 21, 2026

**Draft development only.** The user authorized isolated development without production deploy, paid Supabase resources, or Drive Duel edits. This task builds on Work's PR #152 in a NEW branch without modifying that PR branch, app original-photo recognition, real storage, customer Auth or production service worker.

## Why
The previous staging builder changed release fingerprint but inherited `closet-current-<fingerprint>` as its Cache Storage namespace. Browser Cache Storage is already separated by web origin, and the staging hostname must remain different from production, but keeping different staging cache namespaces adds defense in depth against operator misconfiguration and prevents a preview service worker from accidentally deleting production-named entries **within any single browser origin**.

## Implemented and verified behavior
- Only inside the staging copy of generated `sw.js`, replace the exact production cache name with `closet-current-staging-<fingerprint>` and scope activation cleanup to `closet-current-staging-`. Fail the entire atomic staging bundle if expected script source changes.
- Leave `public/sw.js`, `dist/sw.js`, HTML, recognition, camera, cloud backup source and other customer files unchanged. Existing stage-specific version fingerprint still pins HTML/JS/CSS.
- The mandatory synthetic-bundle verifier asserts the staging-only cache namespace and prevents a broad `closet-current-` cache deletion selector.
- `scripts/test-staging-sw-cache.mjs` executes the **actual generated staging service worker** in a Node VM with a fake Cache Storage and fake lifecycle events. Verifies install pre-cache, exact pinned home/auth script, fail-closed missing asset (503), external Supabase/private URL and write-method bypass, old staging cache deletion, preservation of a production-named cache even within the same mock storage, installer quota refusal and cache storage failure refusal.
- Only synthetic generated data and invented backend `abcdefghijklmnopqrst` are permitted. No real network, customer data or hosted systems are accessed.

## Boundaries
This is a deterministic service-worker *simulation*, not proof of actual installed browser behavior, a physical iPhone/Android, authentic Supabase security, a protected Cloudflare deployment or customer recognition accuracy. Service worker registration/lifecycle on actual phones still needs testing after genuine separate Access-protected staging is available. Browser origin isolation and Cloudflare Access policy remain mandatory. Production promotion BLOCKED.

Test locally after a synthetic build:

```
CLOSET_STAGING_APP_ORIGIN=https://preview.closet-current-staging.pages.dev/ \
CLOSET_STAGING_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co \
CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY=sb_publishable_STAGING_TEST_FIXTURE_XYZ001 \
node scripts/build-restricted-staging.mjs
node scripts/verify-restricted-staging-bundle.mjs
node scripts/test-staging-sw-cache.mjs
```

No deploy commands are included; GitHub CI also runs the full project regression suite and preservation guards.
