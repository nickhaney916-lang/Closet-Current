# Selected-wardrobe consistency when saving outfits

Family Alpha #255 HOLD. Isolated side mission stacked directly on verified PR778 `e3973d425d89f03c8b8b5b563e9f2d423db64437`. No merge, deployment, production/staging, hosted account/service, private photo or recognition/3D mission changes.

## Reproduced defect

An open styling result in tab A retains its cached garments after tab B deletes a selected garment. The parent app saves the deleted garment ID into the saved outfit anyway. Genuine Chromium reproduces this at 320/390/430 using the actual Delete and Save buttons in two pages sharing real IndexedDB. The state-only outfit transaction never checked the current wardrobe.

## Implementation

- Explicit outfit appends open one IndexedDB transaction covering state and items. Before the saved roster can commit, each selected garment is read from the actual item store, checked for slot compatibility and owner marker consistency, and compared with the snapshot captured when Save started.
- Snapshot facts cover the visible photo, original photo/source identity, category/subtype, primary color/provenance, pattern, sleeves, fit, material, occasion and seasons. Flat immutable values avoid copying or hashing full JPEGs merely for equality comparison. Notes-only changes and unrelated wardrobe updates do not invalidate an unchanged selection.
- A deleted, recategorized, recolored or source-changed selection aborts the whole append. The prior saved roster and garment rows remain intact. No selected ID is silently dropped to produce a different partial outfit. Legacy category normalization is applied consistently.
- Both Styling and Outfit Builder offer Refresh my closet after this refusal. The explicit refresh waits for earlier local writes, reads the captured owner's database, rechecks the account/database after the read, updates the displayed closet and clears obsolete recommendations. It does not delete or rewrite saved outfits or wardrobe photographs.
- Per-result save statuses survive normal card rebuilds through an in-memory WeakMap. Saving, saved, retryable error and changed-wardrobe states remain consistent after background renders. A completed result stays disabled, and a blocked result retains its refresh action. New recommendation generation intentionally starts new result identities.
- Existing transaction fixtures now seed actual items stores and load the real taxonomy; their original assertions remain. Shipping auth/cloud clients, recognition/model code and storage schema are unchanged.

## Verification

Eleven new tests execute the real persistence/refresh functions with fake-indexeddb: valid unchanged rows, deletion after click, recategorization, color/source change, notes/unrelated updates, all-or-nothing multi-item refusal, no silent ID dropping, foreign owner marker, account switch during refresh and immutable fact snapshots.

Initial complete serial Node suite: 1,360/1,360 PASS, zero skips/failures. The full suite is repeated on the final exact head after the persistent-card status repair. Chromium passes 320/390/430 actual two-page deletion/refusal/recovery and queued recategorization checks. The browser test forces renders after refusal and success, verifies stable status/recovery controls and no failed saved append, regenerates a valid recommendation and checks refreshed garment categories. Failed/recovered screens receive WCAG 2.1 A/AA axe and layout checks.

Dedicated pinned-container NO DEPLOY CI repeats parent/revised Chromium/WebKit cases, the complete Node suite, inherited draft/conflict/separate-tab/mobile/native-photo journeys and bounded simulated saved-outfit backup/restore. Final head, run, counts and independently downloaded artifact receipts are recorded on the PR after verification.

## Limits

This protects new saved-outfit appends at their transaction's consistency point. A later intentional wardrobe deletion or edit can still make a historical outfit incomplete; this work does not reconstruct deleted photos or automatically repair historical outfit references. It is not live signed-cloud security, distributed wardrobe transactions, recognition accuracy, garment-fit acceptance or human ground truth. Physical phones, keyboards, assistive-technology users and live accounts remain unverified. Existing explicit backup replacement, best-effort beforeunload limits and the historical full backup harness's unrelated color-provenance expectation remain documented. No whole-repository-green or release-readiness claim.

Reproduce with the pinned tools in the dedicated workflow:

```
node scripts/build.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
git worktree add --detach /tmp/closet-wardrobe-baseline e3973d425d89f03c8b8b5b563e9f2d423db64437
APP_SOURCE_ROOT=/tmp/closet-wardrobe-baseline EXPECT_BASELINE=1 WARDROBE_OUT=benchmark/outfit-wardrobe-baseline node scripts/test-outfit-wardrobe-consistency-browser.mjs
node scripts/test-outfit-wardrobe-consistency-browser.mjs
```
