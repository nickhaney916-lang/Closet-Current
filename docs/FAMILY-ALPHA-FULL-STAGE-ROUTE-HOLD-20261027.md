# Closet Current — Full family avatar already inherits staging-only Auth and backup guards

**2026-10-27 · Family Alpha #255 · source-pinned development HOLD; no deploy**

## Material discovery during integration

Original `public/auth.js` and `public/cloud-backup.js` include the **production Supabase** project `hlkgymugtfbirlpunsra`. We initially suspected the latest app-integrated candidate might still include that fallback.

The first new CI attempt intentionally failed while trying to call `stageAuthSource()` on #333's compiled `auth.js`, because the function expected the **original production source** but received **already transformed staging-safe source**. Tracing the exact build dependency chain resolved this: `build-family-alpha-recognition-integrated-hold.mjs` uses `dist-family-alpha-staging-auth-hold`, then Work #29, #31, #34, and main-thread #35/#36 all inherit that disabled staged Auth/Cloud lineage. **It would be incorrect to rewrite these same files a second time.**

The corrected [draft PR #337](https://github.com/nickhaney916-lang/Closet-Current/pull/337) verifies this inheritance. It produces `dist-family-alpha-full-stage-routing-HOLD` by copying #333's **entire** compiled candidate byte-for-byte, adding **only a new metadata HOLD manifest**.

## Enforced gates

Source-aware checks verify that the real compiled `auth.js`, `cloud-backup.js` and `family-alpha-2d-auth-preflight.mjs` reference only the staging project `fbnplztkbsteuzrmbgib` and never the production project or original production publishable key. The actual compiled `index.html` must load the guarded `alpha-stage-config.js` before Auth, public signup must remain hidden, and normal PWA registration must be disabled. The inherited config must still contain `"key":""` and `"redirect":""` and `HOLD-NO-CALLBACK-OR-KEY`.

An offline Node VM test executes **the actual compiled** Auth and backup scripts under a simulated exact staging hostname with empty credentials. Sign-in/backup must fail before any network request; other origins must not allow activation. A recursive all-file SHA comparison verifies that **none** of the original 2D avatar, human-approved JPG→PNG source, garment segmentation, outfit recommendations, manual placement, single-shoe safety, favorites, or IndexedDB atomic rollback assets changed.

The dedicated GitHub Actions run rebuilds every exact source-pinned predecessor and verifies all these checks without accessing live user accounts, staging, Supabase Auth, Cloudflare or production.

## Remaining release restrictions

This result does **not** prove what the deployed staging browser currently serves. **No publishable key or approved callback is embedded in this artifact.** No real JWT ownership, four-user sessions, Android/iPhone validation or cloud restoration has happened. Work #37 [PR #334](https://github.com/nickhaney916-lang/Closet-Current/pull/334) is geometry-only, incomplete; Work #38 cutout recovery is still separate. Realistic garment fit and clean cutouts remain blocked.

**Family Alpha remains HOLD**, with no merges, staging or production deployment, Supabase/Cloudflare/Resend changes, customer photos, paid services, spending, Drive Duel changes or additional Work assignments.
