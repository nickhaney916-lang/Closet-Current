# Parallel #93 — executable cross-mission source convergence handoff (HOLD)

Tracker: [#1217](https://github.com/nickhaney916-lang/Closet-Current/issues/1217) · Master [#1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054) · Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) OPEN/HOLD. Dedicated [draft PR #1218](https://github.com/nickhaney916-lang/Closet-Current/pull/1218). No merge, production/staging, hosted Supabase, private account, original source alteration, deployment, or changes to PR #1210/#1216.

## Immutable input pins, no extrapolation

| Component | Frozen Git commit | Required source file/blob |
|---|---|---|
| M4 main consumer | `93696bfa890f573fbbb23da3530da27c45d4b890` | `public/app.js` `991c00457799f8e2b8ae958d5ace85cc9914aece`; `public/outfit-board.js` `153455379b0b6d777eff8c1c508c129208c7fadc` |
| M4 native importer | same M4 commit | `public/native-default-atomic-import-m3.mjs` `3a83e3336ce36334a49708d1c7b90cc27194c7b9` |
| M1 #1175 | `bec1ae8eba2a3979ec0581cb93a91b1ec3ad231c` | `public/outfit-instance-review-840.mjs` `6324d8eda33024f166311f424392ed83363e4942` |
| M1 dependent segmentation | M1 | `public/outfit-segmentation.mjs` `d357955dd8fdab7c0cb727ea597c270edd9309ac`, identical to M4 |
| M2 #1177 | `569a1b90780ab25651b6c9adf98cc1b078b501c0` | `research/parallel89/skirt-rigid-registration89.mjs` `73177ed4645633ca060e7185eab881fa75d3a2bf` |
| M3 #1135 | `4d9a28bba60c7f17f934848fc36d4bd478ffea55` | `research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs` `2d9ad8a5309a2f2392bd35ccfd1b0b2ad0ce7491` |
| M4 owner Board contract | M4 | `public/outfit-board-engine.js` `787df8a770d900b56aee25bb2987c420a5e11778` |
| P92 independent tester | `5f8ce4240c69fc3847d7922c44da20fa15a9d768` at audit | Separate from this branch; independently moving |

## Actual Git merge-tree rehearsal (first P93 CI #43780887745)

Each full merge attempted with `git merge-tree --write-tree <M4> <donor>` and a *single tip commit* `git cherry-pick --no-commit <donor>` in disposable worktree, immediately reset and removed. None applied or pushed to persistent branches.

- **M1: CONFLICT**; merge-base `39deed987afe2e5668d64e145835ad43ad14c7be`. Conflicts in `public/app-theme.css`, `app.js`, `dual-core-82.mjs`, `dual-worker-82.mjs`, `index.html`, `outfit-capture.js`, `outfit-worker.mjs`, `tests/automatic-indexing.test.cjs` and `tests/mission1-release-evidence-851.test.mjs`. Tip cherry-pick conflicts in `public/app.js` plus donor report/owner-mask scripts/tests.
- **M2: CONFLICT**; merge-base `faac51857d57356fb5568f035566a171cadaa418`. Conflicts in `public/app.js`, `public/cloud-backup.js`, `research/native-3d-05/native-preview-bridge.mjs`, core source geometry files and geometry tests. Tip commit conflicts in `scripts/test-parallel89-real-skirt-browser.mjs`.
- **M3: CONFLICT**; merge-base `6574fa71e9bbda501e161556dc2aa872920a4eb6`. Conflicts in `public/app.js` and `tests/mission3-edit-backup-owner-lease.test.cjs`; tip test conflict in `tests/mission3-private-import-locked-gate-v4-bridge.test.cjs`.
- **P92: CLEAN MERGE-TREE**, exact M4 was ancestor, but the tip commit did not apply as a nonempty standalone cherry-pick; this is *not* an instruction to adopt or alter #92.

## Minimal compatibility rehearsal and source truth

The disposable combined-source tree imported **only** the three pinned donor files above, retaining all M4 app and board/owner/import consumer blobs. Actual local native build and three inherited source tests passed in first P93 exact-head CI. M1 disconnected same-class synthetic mask: **144/144 selected pixels retained**; two research proposals require explicit review. That does not prove separate real physical garments or their identity. M2 research geometry file was staged and SHA-checked but NOT mounted into native consumer, executed on a fitted avatar or accepted as physically draped. M3 research importer is tested separately; it does not replace M4's duplicate CAS, private owner or v4 backup.

**Canonical bridge:** `capture/source SHA + owner/crop/mask instance → explicit owner decision → genuinely signed saved item.id → currentBoard.slots[slot] = saved item.id → original-photo 2D; 3D denied without independent geometry → owner-private atomic restore`. M4 `boardHasMatchingOwnerSourceReview88()` currently changes disclosure wording, never confers independently verified physical unit or 3D admission. Existing P119 owner review uses actual owned original JPEG and preserves unknown/denied state.

## Reproduced first blocking import contract; proposed minimal owner patch

1. M4 `public/native-default-atomic-import-m3.mjs` at frozen blob `3a83e...` caps **both preview and preserved camera original** at `3_000_000` Base64 characters. M3 donor limits previews to 3M, but intends `11_200_000` encoded / `8 * 1024 * 1024` decoded for *separate originalPhoto.image*.
2. The exact M3 donor's `img` regex has repeated nested quantified Base64 groups. An authentic checked-in JPEG plus benign APP15 synthetic metadata yielded `RangeError: Maximum call stack size exceeded` in M3 `verifyImage() -> RegExp.test()` before imported item or source custody review. M4 rejected the same original with `LEGACY_ATOMIC_INVALID_JPEG` without writes. This is a real code contract mismatch, not successful large-original import.
3. Test-only P93 adapter extracts the exact SHA-matched donor into a disposable temporary module, replaces the **quadratic/deep-stack regex implementation** with a single linear class and an explicit modulo-four padding/length guard, and runs original SHA, malformed bytes, foreign owner, actual `fake-indexeddb` and no-write tests. **Nothing is committed to M3 or M4 consumer.**
4. Recommended M3 owner fix: adopt validated linear base64 guard and exact byte caps; retain existing SHA, owner, approval and transactional fences. Recommended M4 owner fix: extend **only** `verifyImage` for `originalPhoto.image` with max encoded=11.2M, max decoded=8MiB; leave previews at 3M, copy the validated linear regex and `encoded.length % 4 === 0` logic, verify actual SHA and reject malformed/foreign originals **before** snapshot/CAS; retain all M4 duplicate original and crop-source protections. **Never replace M4 importer wholesale with the divergent M3 research module.**
5. Owners must rerun legacy v1/v2/v3, protected original SHA, source duplicate/pair/instance, foreign account, late owner revocation, v4 backup, 2D outfit, absent original, malicious metadata, rollback and both engines; do not soften existing source safety to make a large photo import.

## Execute safely in a fresh disposable checkout

```bash
git fetch origin --prune
BASE=93696bfa890f573fbbb23da3530da27c45d4b890
M1=bec1ae8eba2a3979ec0581cb93a91b1ec3ad231c
M2=569a1b90780ab25651b6c9adf98cc1b078b501c0
M3=4d9a28bba60c7f17f934848fc36d4bd478ffea55
git worktree add --detach /tmp/p93-check "$BASE"
cd /tmp/p93-check
for other in "$M1" "$M2" "$M3"; do
  git merge-base "$BASE" "$other"
  git merge-tree --write-tree "$BASE" "$other" || true
done
# From P93 branch only, with full history, pinned Node 22 and local test dependencies:
node scripts/test-parallel93-convergence.mjs
node --test tests/parallel93-import-contract.test.mjs
node scripts/build.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
# Never merge/push from the disposal worktree.
```

Use a disposable worktree from **P93** rather than the base commit when running P93 scripts. Treat the above commands as the SOURCE and conflict reference recipe; checkout full P93 commit in a separate test worktree before running scripts, then let them create their own short-lived scratch sub-worktrees. Only the main controller may assess/port a carefully reviewed version of the owner import patch to #1210.

## Acceptance statuses

- Source ancestry / full-merge feasibility: **PASS (reproduced conflict proof)**, full branch integration **FAIL**.
- Exact three donor path overlay, M1 mask conservation and native offline build: **PASS (synthetic/source-only)**; not normal-mode four-mission app completion.
- Genuine model proposals: **NOT_RUN in P93**; verified separately only under M4/92 (do not reuse those as combined donor test).
- Synthetic owner review / saved private wardrobe / original 2D: **PASS only for unchanged inherited M4 native browser baseline** (Chromium/WebKit, 320/390/430), NOT combined donor admission.
- Large original M3 import: **FAIL exact donor**, P93 test-only proposed repair must pass separately before any owner adoption. M4 import is intentionally fail-closed at 3M.
- Real independent sealed garment labels and categorization accuracy: **BLOCKED external reviewers and frozen photo truth**.
- Photo-derived multi-garment fitted 3D, drape, accepted human realism: **BLOCKED**. M2 research donor source staging is not a completed garment.
- Hosted signed two-account RLS, real accounts, cloud proof: **BLOCKED**.
- Physical Android Chrome / iPhone Safari: **BLOCKED**.
- Merge, deployed Family Alpha, release: **NO / HOLD #255**.

Only one P93 draft PR; all new writes in `research/parallel93-convergence/**`, `scripts/test-parallel93-*.mjs`, `tests/parallel93-*.test.mjs` and `.github/workflows/parallel93-*.yml`.
