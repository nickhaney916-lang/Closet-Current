# Working-draft conflict recovery continuation

Family Alpha #255 HOLD. Separate isolated branch stacked directly on verified PR777 `c4268d30f02ca8e493cd5983128fedf0f9d2e8cf`. No merge, deploy, production/staging, hosted services, private customer photos or recognition/3D mission modifications.

## Reproduced problem

Two real browser pages sharing one owner IndexedDB can load the same draft. When the first page commits a new name, the second page's stale autosave silently replaces it. The previous verified parent reproduces this at 320/390/430 in Chromium. PR776 protected saved-list appends but deliberately left the shared working draft as last-write-wins.

## Implementation

- Normal draft writes compare the exact previously observed stored `current` value with the value read inside the same IndexedDB readwrite transaction. Changed or deleted state causes a conflict without overwriting the newer draft. Successful earlier writes in the same page advance the expected value before later queued writes compare; ordinary typing remains supported.
- Conflicting local inputs stay visible and unsaved-warning tracking remains active. The normal app offers Load latest draft and Save my draft instead. Status text explains that loading latest replaces unsaved local changes.
- Load latest waits behind earlier queued writes, is read-only and owner/database-bound, and refuses to apply if the local draft changes while the read is pending. It updates the expected stored value only after applying the explicitly selected current version.
- Save my draft instead is bound to the owner, database and exact version observed in the conflict. If the other tab writes again before this action executes, the first action refuses the unseen version and presents a refreshed conflict; a new explicit action is required.
- Appending a separate saved outfit from a stale tab still succeeds without replacing the newer shared working draft. Deleted shared state is retained as a null current draft rather than resurrected by the saved-list append. Saved outfit capacity/owner restrictions remain intact.
- Automatic board refresh retains a dirty local draft instead of replacing it; when stored state differs, it exposes the same resolution controls. Shipping cloud/auth clients and schema are unchanged. Existing explicit backup replacement retains its deliberate replacement semantics.
- Exact stored JSON is tracked separately from the locally normalized draft signature, so loading a legacy or filtered draft does not fabricate a match against altered data.

## Verification

Ten new tests execute the actual persistence/loading/refresh functions with fake-indexeddb: stale default refusal, same-page queue advancement, saved append preserving remote draft, unseen-version replacement refusal, explicit latest load, owner/database-bound replacement receipt, deleted state, local typing during asynchronous read automatic refresh preservation, and a paused older local write that must not undo Load latest.

Actual-browser matrix uses two independent pages in each engine at 320/390/430: parent silent overwrite reproduction, revised refusal/local input preservation, automatic refresh preserving input, separate saved-outfit append, explicit latest load, a second remote change invalidating an earlier replacement decision, refreshed explicit replacement reload with saved outfits retained, and Load latest while an older save is deliberately paused. Resolution targets are at least 44px; failed/conflict-resolved screens receive WCAG 2.1 A/AA axe scans. Auth/photos/backend fixtures remain synthetic.

Initial local full serial Node suite: 1,348/1,348 PASS, zero failures/skips. The final tenth regression passes separately and the full suite is repeated on the final exact head. Local Chromium passes at all three widths. Dedicated exact-head pinned-container NO DEPLOY CI repeats Chromium/WebKit baseline and revised cases, all Node tests, inherited PR777 draft recovery, PR776 separate-tab/owner-switch behavior, PR775 mobile reliability, P167 native original photo/review/styling/reload and bounded saved-outfit backup/restore. Final exact-head result/counts/artifact receipts are recorded in the PR after completion.

Existing test fixtures only gain the stored-draft/conflict tracking globals. No original ownership/recognition assertion is weakened. Full Node uses one file at a time as in PR777 to avoid the unrelated PHOTO116 bounded WebCrypto polling assumption under heavy parallel load.

## Limits

This is browser-local optimistic comparison on the current draft value, not collaborative merging, a distributed cloud transaction or cryptographic revision signing. Byte-equivalent state restored to a prior value is indistinguishable from that value; no edit-history/revision-counter guarantee is claimed. Explicit backup replacement is still a replacement operation. Mobile process termination can bypass beforeunload; the last 250ms of typing can remain unsaved. Physical Android/iPhone, real mobile keyboards, assistive-technology users and live signed-account/cloud acceptance remain unverified. Full historical backup harness's unrelated color-provenance expectation remains documented and is not counted as passed. Family Alpha stays HOLD.

Reproduce using the pinned dependencies and scripts in the dedicated workflow:

```
node scripts/build.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
git worktree add --detach /tmp/closet-conflict-baseline c4268d30f02ca8e493cd5983128fedf0f9d2e8cf
APP_SOURCE_ROOT=/tmp/closet-conflict-baseline EXPECT_BASELINE=1 CONFLICT_OUT=benchmark/outfit-draft-conflict-baseline node scripts/test-outfit-draft-conflicts-browser.mjs
node scripts/test-outfit-draft-conflicts-browser.mjs
```

Final review reproduced an additional queued-write ordering defect in the first candidate: Load latest could return before an older paused draft write and refresh its comparison baseline, allowing that old write to undo the selected latest version. The added adversarial test first failed with a missing expected rejection. Loading is now serialized behind earlier queued work and checks the owner again when that work executes. The final exact-head suite must include this tenth regression.
