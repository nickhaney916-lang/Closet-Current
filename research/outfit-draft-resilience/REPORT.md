# Outfit draft resilience continuation

Family Alpha #255 HOLD. Separate isolated development branch, stacked directly on PR776 `662b02a7ebe2b7a157032c00516824d45f11c47a`. No merge, deployment, production/staging, hosted service, recognition or 3D mission changes.

## Reproduced failure and repair

On the verified parent, typing an outfit name without leaving that text field does not update `currentBoard` or persist the input. Reload loses it, with no unsaved-change warning. Genuine Chromium at 320/390/430 reproduces both observations. A draft-save failure also offers no dedicated draft retry; using Save outfit to retry can create another saved-list entry instead of simply committing changes.

Normal text fields now update the in-memory draft on input and schedule a 250ms coalesced save. Leaving a field flushes immediately. Select changes retain immediate save. Existing lossless research-mode field handling remains unchanged.

The app tracks the committed draft signature and pending writes. Beforeunload requests the browser's native warning while a normal draft is unsaved or its writes are pending, and clears after commit. A dedicated Retry saving changes button writes only the current draft; it does not append a saved outfit. The input stays intact after storage failure. Retry returns keyboard focus to Outfit name after successful save.

Save-status serials prevent an older asynchronous completion from replacing a newer failure message or announcing success while newer changes are waiting. Delayed saves are bound to the database/auth identity present when typing started; account/database changes refuse the delayed save. The existing session-lock event cancels pending debounce timers and invalidates late status updates. Shipping auth/cloud clients and IndexedDB schema are unchanged.

## Verification

Six new focused tests execute the actual draft helper/status functions, covering dirty/pending/committed distinction, timer coalescing, delayed actor/database changes, session-lock cancellation, out-of-order status completion and draft retry. Existing transaction test fixtures supply the new tracking globals. The closet-placement VM supplies a browser event-listener stub; its original garment/layer assertions remain unchanged.

New actual-browser matrix: parent unblurred-name loss/no-warning reproduction; revised normal app typing without blur, real IndexedDB persistence/reload, quota failure with preserved fields, native-warning event cancellation, retry without saved-outfit duplication, older success versus newer failure, portrait/landscape width checks and axe scans on failed/recovered draft states. Synthetic auth and garment fixtures only.

Local Chromium passes at 320/390/430. Dedicated pinned-container no-deploy CI verifies the final exact head in Chromium/WebKit, plus inherited PR776 overlapping saves/two independent pages/queued account swap, PR775 mobile recovery, P167 native original-photo import/review/styling/reload and bounded saved-outfit backend-simulated backup/restore. Final exact-head counts and artifact receipts are recorded in the PR after verification.

## Limits

Beforeunload is a best-effort browser warning: mobile operating-system termination, battery loss and browser process crashes can bypass it. No guarantee is made that text entered in the last 250ms survives such termination. No private draft is copied into a separate cross-account store. Physical Android/iPhone, real mobile keyboards, assistive-technology users and live signed-account/cloud acceptance remain unverified. Shared current drafts remain last-write-wins across tabs; PR776's saved-roster protections remain in place.

The historical full backup harness's unrelated estimated-color-versus-user provenance assertion remains documented in PR776; it is not counted as passed here. The bounded saved-outfit migration/restore test is used for this scope. No whole-repository-green or full release-readiness claim.

Reproduce with PR776's pinned dependencies:

```
node scripts/build.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
git worktree add --detach /tmp/closet-draft-baseline 662b02a7ebe2b7a157032c00516824d45f11c47a
APP_SOURCE_ROOT=/tmp/closet-draft-baseline EXPECT_BASELINE=1 DRAFT_OUT=benchmark/outfit-draft-baseline node scripts/test-outfit-draft-resilience-browser.mjs
node scripts/test-outfit-draft-resilience-browser.mjs
node scripts/test-outfit-save-recovery-browser.mjs
node scripts/test-family-reliability-mobile.mjs
node scripts/test-native-canonical-original-167-browser.mjs
node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json benchmark/photos commons-0002
node scripts/test-outfit-backup-compatibility-browser.mjs benchmark/outfit-save-mock-cloud-regression
```

The first fully parallel local Node run hit the unchanged PHOTO116 test's 100-`setImmediate` polling bound while awaiting WebCrypto under load. Its focused run passes. The final full suite uses one file at a time, with every original assertion retained; no recognition or ownership test was modified to bypass that timing assumption.
