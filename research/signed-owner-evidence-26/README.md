# SIGNED-OWNER-EVIDENCE-26 — Work #29 independent security receipt and controller handoff

**Status:** Strictly read-only research. Stacked on verified main-controller PR #582 exact `ed7abb0ada27501ad545975f13c8bc2ed59ffa90`. Original Work #29 [draft PR #581](https://github.com/nickhaney916-lang/Closet-Current/pull/581) exact `2dd3ea96725aa1bcb797727ea31a7f99167ad3f5` and [dedicated Actions #41888655925](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41888655925) both succeeded. This audit does not touch Work #29's branch, application logic, auth, private photos, cloud, 3D, staging, production or Family Alpha Issue #255 (OPEN/HOLD).

## Actual Work #29 result that must be preserved

Downloaded and independently read Work #29's GitHub Actions evidence:

- Signed HTTP artifact [#13351329641](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41888655925/artifacts/13351329641): two distinct real server-password-authenticated identities in disposable **loopback Supabase**, **56 signed API checks** including owner positive access, backup write, synthetic JPEG SHA, mutual foreign-account row/photo/list/modify/delete/signed-link denial, anonymous access denial, bad JWT, expired JWT, refresh and logout. The JSON explicitly reports `logoutAccessTokenRemainsUsable: true`: a still-unexpired JWT bearer can remain valid after logout. The client revokes local state and refresh; no claim of instant server JWT invalidation.
- Browser artifact [#13352638055](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41888655925/artifacts/13352638055): six Chromium/WebKit browser tests at 320/390/430 using actual application + real IndexedDB **but fixture authentication**, not real signed browser-to-cloud. Original PNGs are separately SHA-256 hashed and screenshots visually inspected. Delayed stale writes rejected. No customer photos or hosted accounts.

Both dedicated jobs `signed-http` and `browser` completed SUCCESS. The exact SHA remains on an open draft. The fact that separate Work usage is exhausted does not change the GitHub research: it is preserved independently, without any claim that the separate Work session remains accessible.

## Next main-controller priority

The next priority is independently accepting this **narrow signed-local research evidence** while leaving real hosted staging A/B security, signed browser-to-cloud end-to-end, real physical phones, legal/privacy consent, production configuration and final Family Alpha release distinctly UNVERIFIED. This prevents two opposite errors: losing Work #29's completed 56 genuine signed checks, or falsely treating disposable loopback security success as production authorization.

## Implementation

`research/signed-owner-evidence-26/manifest.json` pins PR #581 exact SHA, dedicated run, signed/browser artifact IDs, nine outstanding Family Alpha release requirements, and scientific/security scope limits. `scripts/audit-signed-owner-evidence-26.mjs` independently calls **only read-only GitHub GET** endpoints to verify PR SHA/head/base/draft/merge, both actual dedicated CI jobs, exact artifacts, Issue #255, and original source-locked `signed.json`, `browser.json` and six genuine PNG byte SHA-256 digests. It checks 56 adversarial signed HTTP cases and real browser flag/dimensions. Missing or changed proof fails closed. It never logs credentials, actual user IDs, signed URLs, or original photo bytes in the sanitized report.

`tests/signed-owner-evidence-26.test.mjs` supplies synthetic fixture records for more than a dozen adversarial negative tests: wrong SHA, forged CI, failed job, missing artifact, missing cross-owner controls, anonymous access, invalid JWT claims, fake logged-out bearer revocation, fake signed cloud browser, tampered PNG, duplicate viewport, invalid Family Alpha release status and untested hosted environment claims.

Dedicated `.github/workflows/signed-owner-evidence-26-no-deploy.yml` locks source changes to four new research paths, verifies parent PR #582 exact ancestry, runs the entire inherited build/Node suite and the new fail-closed tests, retrieves the pinned original GitHub Actions fixture ZIPs **read only**, independently verifies original evidence and uploads only sanitized report JSON/Markdown. ZIPs are deleted before upload. Never opens Work, never edits signed users, never touches staging, never merges or deploys.

## Scientific and security boundaries

- Local signed HTTP two-account RLS/Storage isolation: **NARROW RESEARCH VERIFIED**, subject to independent exact-head artifact audit.
- Browser with fixture auth and real application IndexedDB: **NARROW RESEARCH VERIFIED**, NOT a genuine browser-to-hosted-cloud signed journey.
- Real staging/production signed account and cloud storage privacy: **UNVERIFIED**.
- Real Android/iPhone: **UNVERIFIED**.
- Account-specific media access under a stolen still-valid JWT after logout: remains possible until token expiry; documented, not concealed.
- Safe category/color recognition, multi-garment instance accuracy, original-photo-realistic 3D: separate quality **NEEDS REWORK** streams. No release claim.
- Family Alpha Issue #255 OPEN/HOLD, nine release requirements unresolved; **NEVER MERGE OR DEPLOY** without explicit user/controller approval.

## Reproduction

Run `node --test tests/signed-owner-evidence-26.test.mjs`, then `node scripts/build.mjs && node --test tests/*.test.cjs tests/*.test.mjs`. With an authorized read-only GitHub token, fetch exact pinned artifacts #13351329641 and #13352638055 as ZIPs (see workflow), then execute `node scripts/audit-signed-owner-evidence-26.mjs research/signed-owner-evidence-26/manifest.json benchmark/signed-owner-evidence-26 signed.zip browser.zip --live`. This verifies the exact completed Work #29 receipts and emits a HOLD report.

**Final acceptance:** Research-scoped signed-owner evidence is accepted only with exact final PR HEAD dedicated green CI and independently validated actual artifact; production/staging still untouched and Family Alpha still on hold.
