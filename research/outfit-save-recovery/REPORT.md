# Outfit save recovery continuation

Family Alpha #255 HOLD. Separate unmerged development branch, stacked on verified PR775 `d46bb5f15487cdbd6a48039efaa732c4916a05e2`. Recognition/3D Mission One, production, existing staging and hosted services are not modified.

## Actual defect

The ordinary Styling save buttons appended an outfit to the shared in-memory array before the asynchronous database write. With two overlapping saves, a failure called `pop()` and removed the other request's outfit. The second request had already captured a snapshot containing both outfits, so it persisted the failed first save too. On the verified parent, genuine Chromium at 320/390/430 reproduces this contradictory state: first card reports failure, second reports success, memory contains only option 1, but IndexedDB contains options 1 and 2.

The ordinary Outfit Builder used the same speculative push/pop pattern. An autosave captured before queue execution could also erase a successful intervening append. Ownership/database selection was not bound before the queue wait.

## Repair

- Explicit outfit appends read the latest committed saved roster inside the same IndexedDB readwrite transaction that appends the new outfit. No speculative shared-array append or rollback remains in Styling or Outfit Builder.
- Normal draft autosaves also retain the committed roster. They cannot erase an outfit saved by a queued operation or another tab. Separate tab transactions serialize through IndexedDB, independently of each page's JavaScript write queue.
- The 50-outfit limit is enforced inside the transaction, including concurrent independent tab queues.
- Caller board data is cloned before asynchronous work. Owner identity, auth object and database are bound before queueing and checked again before the transaction/write and before publishing in-memory results. Old-owner queued work cannot write into a newly selected owner's database.
- In-memory saved outfits are published only after the transaction commits. Existing lossless research mode still refuses these ordinary writes.
- Styling cards announce Saving/success/failure through one reusable status region. Failed card retry cannot leave contradictory older status paragraphs.
- Explicit backup replacement remains supported with `replaceSaved`; the existing synthetic backup regression's fixture uses that explicit operation rather than relying on arbitrary shared-array mutation. No shipping cloud/auth client, hosted configuration or storage schema changed.

## Verification

Local complete suite: 1,333 tests pass, zero skips/failures. Eight new tests execute the actual persistence function with fake-indexeddb: overlapping failure, autosave ordering, two independent tab queues, concurrent limit enforcement, queued account/database switch, snapshot freezing, explicit replacement and retained research gate.

Actual Chromium local tests at 320/390/430 reproduce the parent defect and verify revised overlap failure/retry/reload. Revised cases also drive actual Save controls in two real pages sharing owner IndexedDB, then verify both saves after reload. A controlled synthetic auth/database switch during a paused queued save leaves the foreign database untouched and the original saved count unchanged. These fixtures do not establish live signed-session security.

The dedicated no-deploy CI repeats the baseline and revised matrix in Chromium/WebKit, plus full build/Node, inherited PR775 recovery/mobile accessibility matrix, unchanged P167 native photo-import/review/three-outfits/swap/reload, and a bounded saved-outfit migration/restore regression using the existing backend simulation. Evidence is actual browser PNGs, axe reports and result JSON. Final exact-head verdict/run/artifact are recorded on the PR after verification.

## Limits

No physical phones, real mobile keyboard, assistive technology user, real getUserMedia, hosted account/session/cloud RLS or arbitrary-photo 3D acceptance. Current unsaved draft selection remains last-write-wins across tabs; the protection here covers saved-roster appends/retention, not general collaborative draft editing or atomic cross-device backup. Explicit backup replacement remains a replacement operation. Family Alpha stays HOLD. No merge, deploy, paid API or private user data access.

Reproduce with the pinned dependencies from PR775:

```
node scripts/build.mjs
node --test tests/*.cjs tests/*.mjs
git worktree add --detach /tmp/closet-outfit-baseline d46bb5f15487cdbd6a48039efaa732c4916a05e2
APP_SOURCE_ROOT=/tmp/closet-outfit-baseline EXPECT_BASELINE=1 OUTFIT_SAVE_OUT=benchmark/outfit-save-baseline node scripts/test-outfit-save-recovery-browser.mjs
node scripts/test-outfit-save-recovery-browser.mjs
node scripts/test-family-reliability-mobile.mjs
node scripts/test-native-canonical-original-167-browser.mjs
node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json benchmark/photos commons-0002
node scripts/test-outfit-backup-compatibility-browser.mjs benchmark/outfit-save-mock-cloud-regression
```

## Broader legacy harness limitation

The full historical `run-cloud-backup-flow.mjs` reached an unrelated color-provenance assertion requiring `user` after only changing Main category, although the image-derived color correctly remains `photo-estimate`. The unchanged PR775 parent reproduced the exact same failure at line 92. This contradicts the preserved color-provenance regression requirements; the current product behavior and those focused tests were not weakened. The bounded saved-outfit migration/restore test runs the relevant earlier real-browser/IndexedDB/backend-simulation portion and reports only that scope. The broad legacy harness is not counted as a pass.
