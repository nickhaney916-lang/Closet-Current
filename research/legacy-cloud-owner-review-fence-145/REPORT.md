# Closet Current — MAIN Priority #145 / LEGACY-CLOUD-OWNER-REVIEW-FENCE-145

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · DRAFT UNMERGED · NO PRODUCTION / EXISTING STAGING / LIVE SUPABASE MODIFICATION OR DEPLOYMENT.**

## Verified input
P143 [draft PR #698](https://github.com/nickhaney916-lang/Closet-Current/pull/698) exact SHA `663d42d721881dc3b5716259c49ea89ec5681d54`; dedicated P143 [Actions #42404975908](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42404975908) completed successfully. The P143 actual app source tree coexists with the P142 research-only cloud recovery modules. P142 explicitly reports that its consent UI is **not** mounted in ordinary `public/index.html`.

## Exact gap this priority fixes
The original `public/cloud-backup.js` legacy controller starts background auto-sync from `public/cloud-backup-bridge.js`, sends automatic owner cloud backup/restore, and can use legacy merge/keep-both logic. In contrast, newer P134/P137 owner-reviewed research requires an explicit consent-bound decision with verified local and remote fingerprints. Running both controllers together could bypass owner-reviewed flow or permit dual-writer races.

**P145 creates a narrow, fail-closed prerequisite, not the actual integrated cloud UI.**

## Implemented
- Branch: `research/legacy-cloud-owner-review-fence-145-main-20261107-HOLD`, stacked directly on the P143 exact verified SHA.
- Only `public/cloud-backup.js` runtime behavior is altered, and only under `?ownerReview145=research` on `localhost`, `127.0.0.1`, or `[::1]`.
- In that local research mode, `start()` explicitly returns `{paused:true,reason:'owner-review-required'}`; status says cloud backup and restore are paused. Legacy sync and keep-both buttons become hidden and unbound.
- Every manual/automatic `sync()`, `beforeWrite()`, `changed()`, restored pageshow, and legacy `api()` access rechecks the hold. The API checks twice, before and after awaited token acquisition, to block a late legacy request in this mode.
- No automatic cloud upload, restore, merge, local photo write, authentication refresh, or storage persistence is initiated by the held controller.
- Browser control remains an explicit local-only URL mode; normal app flow on other hosts and without the precise flag is unchanged.
- Added pure Node VM regression tests of guarded startup and event paths, plus an isolated local HTTP research fixture driven by genuine Chromium and WebKit at 320, 390 and 430 CSS px. The fixture must not contact external hosts; screenshots and JSON are archived.
- Dedicated exact-parent, five-path-allowlisted, no-deploy GitHub Actions runs build, focused/full Node tests and six browser/width cases.

## Why the hold is required
P142 research backup+restore UI has not been installed in the ordinary app and cannot safely be enabled alongside the default legacy controller. Pausing the legacy writer only in an isolated local research mode prevents false claims of end-to-end owner-reviewed security and provides a safer integration boundary for the next separately tested priority.

## Verification and known limits
Dedicated final exact-head P145 CI must pass before this priority is called **verified**. On passing, report test counts and artifact URL in PR discussion without changing this pinned report.

**Not demonstrated:** signed hosted JWT A/B cloud HTTP+Storage acceptance; ordinary shipping app P134/P137 backup or restore UI; real physical phones; private garment-photo visual 3D quality; recognition-model accuracy; device-wide distributed cloud/local transaction atomicity. Existing normal-host automatic cloud controller is deliberately unchanged in this priority. These are still Family Alpha HOLD conditions.

**Security note:** An owner-review feature must not be enabled on a public/staging host merely by a user-editable query flag. A subsequent isolated research priority must integrate the real P134/P137 service into the ordinary app view, provide independent signer-backed account testing, and prevent concurrent legacy sync through a trusted app configuration and accepted release gate.

**Release recommendation: HOLD. No merge or deployment.**
