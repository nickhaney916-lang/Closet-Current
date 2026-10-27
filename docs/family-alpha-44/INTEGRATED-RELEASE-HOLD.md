# Closet Current — exact full Family Alpha preview + human visual + four-account privacy HOLD

**2026-10-27 · Issue #255 · main thread #44 · no deploy**

## Why this check exists

Technical success is not equivalent to visually successful clothing. The exact latest complete protected offline preview [PR #344](https://github.com/nickhaney916-lang/Closet-Current/pull/344) passed 601 base tests, atomic IndexedDB recovery, staged Auth source guards, original JPEG recognition, review tips, 2D avatar and synthetic camera on Chromium/WebKit, but still **no real garment has been approved on the 2D humanoid**. Source-backed Work #33 reviewed 15 licensed original photographs: seven provisional transparent cutouts, eight unavailable and zero final owner-approved cutouts. Work #37 anatomical fitting #334 and Work #38 isolation #336 are incomplete. Work #41 [PR #343](https://github.com/nickhaney916-lang/Closet-Current/pull/343) reports an actual **FAIL** for blouse-over-shirt/hand overlays. Work #42 photo-based presentation has not delivered verified user acceptance and must not be assumed integrated.

Read-only staging [PR #335](https://github.com/nickhaney916-lang/Closet-Current/pull/335) found **one** staging Auth account, not four. That same read showed source-backed RLS/private-photo policy presence, but no real distinct JWT owner-A/owner-B read/write test, no four concurrent family account test, and leaked-password protection disabled. This is a historical snapshot from October 27, not a current deployment test.

## New integrated release review

`scripts/check-family-alpha-44-integrated-readiness-hold.mjs`:
1. Calls **`assert43HOLD()`** against the complete protected 3-outfit/2D/manual fit/source-photo/staging-route offline build. This must be compiled from pinned ancestors, not ordinary production-default JS.
2. Reuses **byte-for-byte** the twelve Family Alpha gate checker and the separate [PR #335](https://github.com/nickhaney916-lang/Closet-Current/pull/335) staging metadata/actual-JWT gate. Copies are pinned to its exact commit, `43f56d98f8fd69bc17af79230d532bd2ccd5bf82`, verified in CI using `git show ... | cmp -`.
3. Evaluates the explicit visual benchmark findings in `docs/family-alpha-44/integrated-release-evidence-20261027.json`: 15 licensed, seven provisional, eight missing, zero human-reviewed final cutouts; Work #41 real-photo compositing FAIL, Work #37/#38 incomplete, Work #42 fallback not validated; no approved family outfit preview.
4. Does **not** force every outfit to be worn realistically to progress in future. If a genuine photo-only board is independently human-reviewed and accepted by the owner, a truthful **PHOTO_ONLY** experience can qualify for main-thread *review* even if fitting/draping research remains incomplete. That fallback can never label provisional masks as worn, award their visual PASS, create an artificial clothing approval, or bypass authorization.
5. Real Android **and** iPhone, four distinct valid JWTs, adult A/B live read/write isolation, one simultaneous four-person test session, a safe deployed staging build, and an explicit owner decision remain necessary for Family Alpha review.

The combined report returns **HOLD** for the actual grounded snapshot. Even synthetic all-PASS yields only `READY FOR MAIN-THREAD REVIEW`, with `deploymentAuthorized:false`. Neither output may merge, deploy, invite accounts, enable paid services or contact staging/production.

## Verified/Not verified distinctions

This is **an offline read-only provenance and release-governance check**, not an actual visual detector, preview renderer, cloud access audit, or a new Work assignment. JSON evidence is editable and cannot serve as cryptographic proof of a human review; the owner must independently inspect visual artifacts and real signed-in session results. Work #42 owns the photo-based fallback UI; Work #41 owns compositing; Work #37/#38 own drape and segmentation.

No Supabase/Cloudflare/Resend changes, no family photos, no private user data, no merges or deployments, no Drive Duel changes. **Family Alpha HOLD.**
