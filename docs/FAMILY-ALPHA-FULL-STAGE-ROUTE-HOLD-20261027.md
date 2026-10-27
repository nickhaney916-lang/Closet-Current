# Closet Current — latest avatar/styling pipeline and production-safe staged Auth routing (HOLD)

**2026-10-27 · Family Alpha issue #255 · developer-only immutable offline comparison; NOT DEPLOYABLE**

## Why this is essential

The existing polished development preview ([draft PR #333](https://github.com/nickhaney916-lang/Closet-Current/pull/333)) integrates real user-confirmed JPEG source, manual alpha eraser, single-shoe reference, neutral 2D humanoid, 3 new-with-existing wardrobe outfits, nonstretch manual shoulder/waist alignment, favorites, and atomic rollback. But original Closet Current `public/cloud-backup.js` references production Supabase **`hlkgymugtfbirlpunsra`** and original `auth.js` also defaults to production. A careless copy of the demo into the staging website could incorrectly send a protected family photo/backup to the production tenant.

Previous stage-only [Auth builder](https://github.com/nickhaney916-lang/Closet-Current/blob/main/scripts/build-family-alpha-staging-auth-hold.mjs) defines exact source-shape transforms to use **staging `fbnplztkbsteuzrmbgib`**, but the latest styling candidate did not include those transformations. This PR **combines them offline** to identify drift and prevent unsafe publication. It does NOT turn the configuration on.

## Exact change boundary

From `dist-family-alpha-36-rigid-align-HOLD`, copy every compiled file byte-for-byte to a new disabled `dist-family-alpha-full-stage-routing-HOLD`, replacing only the existing stage Auth transform's five audited targets: `auth.js`, `cloud-backup.js`, `family-alpha-2d-auth-preflight.mjs`, `index.html`, `pwa.js`; plus an inert `alpha-stage-config.js` and SHA-verified HOLD manifest. The transformation functions are imported and reused from `scripts/build-family-alpha-staging-auth-hold.mjs` unmodified.

The config remains `"key":""`, `"redirect":""`, `intent:HOLD-NO-CALLBACK-OR-KEY`, `releaseGate:HOLD`. Auth denies sign in even if the compiled files are served under the legitimate staging hostname, cloud backup denies start/sync and the PWA intentionally does not register the ordinary service worker. The API URL for the staged modules is staging only. The build must fail if any transformed file contains the production project URL, original production key, or previously approved source hash changes; **every other outfit/photo/storage/recognition file must match the source exactly**.

A Node VM regression executes the generated Auth and backup scripts under a fake exact staging hostname with intentionally empty credentials, checks they reject with no network call, and confirms mismatched domains never permit Auth. Falsified release/approval metadata or transplanted production URLs are rejected. GitHub Actions runs only local builds and tests; **no live Supabase, secrets, user records, staging deployment or production access**.

## Exclusions and release blocks

- Work #37 [draft #334](https://github.com/nickhaney916-lang/Closet-Current/pull/334) is an incomplete landmark planner, **no source-backed demonstrated drape**. Work #38 cutout/isolation improvements have not been delivered or evaluated in this candidate. Neither branch is modified.
- A safe production routing fence does NOT certify staging Cloudflare Access, a signed-in user, real JWT ownership, four real distinct family accounts, real cloud backup or ready garment visuals. Currently only **one staging Auth user** observed, and a Supabase advisor reported leaked-password protection disabled.
- No Auth keys are embedded; therefore this output **cannot sign anyone in**. It is a release-blocking audit artifact, not a version that should be uploaded to staging.
- Real apparel fit/segmentation still lacks owner visual acceptance. Retain release HOLD until source-clean cutouts, believable fit, safe live staging Auth, verified four-account isolation, and physical phones pass.
- No merges, deployments, provider settings changes, extra Work assignments, real user/family images, spending or Drive Duel changes.
