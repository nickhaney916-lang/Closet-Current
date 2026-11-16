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
# The P93 test files must be checked out; never run the harness on BASE alone.
P93=research/parallel93-source-convergence-HOLD
git worktree add --detach /tmp/p93-check "origin/$P93"
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

The disposable worktree starts at the isolated P93 branch; the scripts themselves create and remove additional detached worktrees from pinned BASE. Never adopt a whole donor branch automatically. Refresh moving branches first, and repin/retest before any proposed owner change. Only the main controller may assess/port a carefully reviewed version of the owner import patch to #1210.

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

## Continuation — M97 paired native v3 export/import compatibility (Nov 16, 2026)

**Correction to the initial importer-only recommendation:** native v3 **export** also caps each preserved original JPEG at 3,000,000 encoded characters. Widening import alone leaves large-source owner recovery broken at export. The required correction is an exact-reviewed **two-module pair**. The ordinary v4 research backup path, native owner CAS, model/3D and account/session rules must remain unchanged.

**Frozen source:** M4 M97 commit 238577c7fc61c4c3dcb9cea11483a00ebdb9ea1b; native importer blob 3a83e3336ce36334a49708d1c7b90cc27194c7b9; v3 exporter blob 3b25748f750f30f4b70b3c5daaf5bc83042f2804; M97 app blob 991c00457799f8e2b8ae958d5ace85cc9914aece.

**P93 proposed patch only:** [proposed-v3-pair-adapter.mjs](./proposed-v3-pair-adapter.mjs) requires both exact Git blob SHA pins before altering a disposable source copy. It substitutes the nested Base64 regex with a linear character class and explicit modulo-four/predicted-decoded-length checks. The preview limit stays 3M encoded / 2.25M decoded; only separate preserved originalPhoto.image permits up to 11.2M encoded / 8MiB decoded. No P93 production-file changes; all original owner, SHA, duplicate-source, saved-outfit and atomic write guards remain.

**Real source integration tests:** [parallel93-v3-roundtrip.test.mjs](../../tests/parallel93-v3-roundtrip.test.mjs) proves exact native exporter and importer both reject a >3M SHA-verified public JPEG without writes; test-only patched source successfully exports/imports that original between fresh owner-private fake-IndexedDB stores losslessly, preserving SHA, wardrobe item, saved outfit selection and cloud dirty revision. Strict negatives preserve state for duplicate source under a second garment ID, altered SHA, foreign owner, malformed encoding, >8MiB decoded original, revoked session and injected write failure. These are synthetic accounts, not hosted signed RLS.

**Latest-M4 disposable browser test:** [test-parallel93-m97-disposable.mjs](../../scripts/test-parallel93-m97-disposable.mjs) stages byte-verified M1 review, M2 geometry research and M3 importer research into a fresh detached M97 worktree, patches only the v3 exporter/importer there, checks that main app/board/v4 source blobs remain untouched, builds the native app and runs inherited tests plus the unchanged real native Chromium/WebKit default legacy import journey at 320/390/430. [No-deploy CI #43783081405](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43783081405), new dedicated M97 job, passed six actual-browser synthetic-account cases. This is NOT normal-mode physical garment 3D acceptance or the final merged four-mission app.

**Independent real failure remains:** [earlier P93 run #43783019125](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43783019125) failed unchanged M94-era native original-photo WebKit 320 preview with a revoked verification ticket even though the read-only source preflight passed. It happened without the proposed v3 pair in that baseline browser job. This is a real intermittent browser lifecycle issue for main/P92 owners, not proven attributable to the P93 backup seam; later green runs do not erase it.

**Safe adoption sequence, only M3/M4 owners:** review and port the exact two-file proposed patch together; do not substitute M3 research importer wholesale; run the 3MB+ v3 roundtrip test, default v3 native browsers, original SHA duplicate, cross-owner reject, 2D outfit, v4 lossless, transaction rollback and complete exact-head M4 7-job no-deploy gate. The current M97 consumers may have moved since this pin; recheck before any adoption. Do not lift Family Alpha HOLD #255.

## Final owner handoff after main independently adopted M98 import validation (2026-11-16)

**M98 current main adoption is independent of #93.** Main #1210 at exact M98 commit c387be237600bb93ce86f7955c2bb86692f80a26 already changed native default IMPORT verification: importer SHA **085abb27e83ca21504b3408ee6f276479384295a**, 11.2M encoded and 8MiB decoded source, linear Base64, small previews unchanged. Its source SHA/owner/duplicate/atomic protections are main-owned and should NOT be overwritten by #93's historical M97 paired importer research patch.

**Precisely one M98 product file remains incompatible with this new importer:** native default v3 exporter public/native-default-verified-backup-export-m3.mjs is still unchanged at Git blob **3b25748f750f30f4b70b3c5daaf5bc83042f2804**. It incorrectly rejects the exact >3MB source now accepted in M98. First fix EXPORT only, not another importer edit. Preserve the separate 3M encoded display preview bound, allow up to 11.2M encoded and 8MiB decoded for the preserved original only, use linear Base64 + modulo-four/decoded-bound validation BEFORE atob, and continue WebCrypto SHA, signed-owner locks, saved outfit and no-pending-drafts v3 rules.

**P93 exact-M98 non-invasive engineering proof:** [test-parallel93-m98-export-only.mjs](../../scripts/test-parallel93-m98-export-only.mjs) builds a disposable M98 worktree with exact-source M1/M2/M3 research overlay, confirms original M98 app/board/native importer/v4 modules byte-for-byte unchanged, and applies [proposed-v3-pair-adapter.mjs](./proposed-v3-pair-adapter.mjs) to **only the exporter** inside scratch. The SHA-pinned original M98 importer remains unmodified; M1/M2 research is not promoted into normal 3D. It runs M98's strict existing actual native default importer Chromium/WebKit source, account, duplicate and rollback journey at widths 320/390/430, plus P93's **real UI export and import of a >3MB SHA-bound original photo** across the same two engines and all three widths. Both groups of six journeys passed in the dedicated M98 scratch CI job under [#43783989630](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43783989630), without original photo bytes or credentials in receipts. This establishes an **isolated one-file compatible exporter patch**, NOT combined four-mission consumer adoption or any release.

**Exact main owner adoption sequence:** Review M98 importer SHA 085abb27e83ca21504b3408ee6f276479384295a alongside unchanged exporter SHA 3b25748f750f30f4b70b3c5daaf5bc83042f2804; port **only the exporter-specific half** of P93's candidate patch (do not cherry-pick M97 importer), apply main owner source/test workflow pins as necessary, run actual v3 export→fresh-owner-local restore on Chromium/WebKit 320/390/430, private SHA/owner/source duplicate/8MiB/no-drafts/rollback, v4 no-regression and full seven-job exact-head main no-deploy acceptance. Keep the original 2D fallback and 3D veto. Family Alpha HOLD #255 stays open; no merge or deployment is authorized.
