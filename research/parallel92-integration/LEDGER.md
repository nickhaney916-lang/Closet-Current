# Parallel Assignment #92 — Immutable Mission 4 acceptance (HOLD)

Tracking: [#1215](https://github.com/nickhaney916-lang/Closet-Current/issues/1215); controller [#1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054); Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) remains OPEN/HOLD. This is independently owned **test code only**; no app/owner/cloud/production changes.

## Frozen exact source

- Mission 4 [#1210](https://github.com/nickhaney916-lang/Closet-Current/pull/1210) baseline `ebb8185dba7dcd54f026dd995f82b6238164be3b` on `research/main1054-m58-real-p88-browser-worker-HOLD`. New P92 native acceptance script refuses modifications to pinned consumer, research data contract, and pre-existing test source blobs. Test workflow explicitly checks out actual SHA, never GitHub's synthesized PR merge ref.
- Native `public/outfit-board.js` stores `currentBoard.slots` with saved `item.id` values, and persists `outfit-board` state. A speculative adapter with `items: [{accountId,...}]` does not represent this native shape.
- `public/app.js`: native manual `savePiece` and automatic `saveIndexed` use owner/session/source and durable IndexedDB controls, prevent duplicated originals sharing SHA or original image despite distinct displayed crops. Saved source fields include `ownerId`, `sourceSHA256`, `originalPhoto.image`, `originalPhoto.sha256`, review/crop status, source and row identity.
- `research/main-thread-integration-1054/source-to-outfit.mjs` owner/private source preflight returns **2D only**, `renderAuthorized3D:false`. Model or synthetic owner review never independently establishes physical garment geometry.
- Real M58 source browser test is already genuinely integrated: actual pinned P88 browser WASM model on legal public original, **unverified region proposals with zero automatic saves**, separate *synthetic* human-approval action through native review/crop and save, actual native Outfit Builder saved ID, source-safe original 2D, v4 export/restore/tamper/rollback, A→B→A, actual source rehash. This is ONE existing uninterrupted local synthetic-owner browser journey, and P92 runs it unmodified.
- M51 native separate Chromium/WebKit 320/390/430 JPEG 2D, original owner source and denied B; native two-IDB-writer duplicate-source test; native v4 six cross-engine import atomic-recovery cases; P91 IDB/document-navigation guard. These are distinct supplemental regressions, not additional proof of blind category accuracy or actual cloud/phones.

## Current compared donor heads (inspection at assignment start)

| Donor | SHA | Relative to M4 |
| --- | --- | --- |
| M1 [#1175](https://github.com/nickhaney916-lang/Closet-Current/pull/1175) | `bec1ae8eba2a3979ec0581cb93a91b1ec3ad231c` | diverged; `public/app.js` touched |
| M2 [#1177](https://github.com/nickhaney916-lang/Closet-Current/pull/1177) | `569a1b90780ab25651b6c9adf98cc1b078b501c0` | diverged; `public/app.js` touched |
| M3 [#1135](https://github.com/nickhaney916-lang/Closet-Current/pull/1135) | `4d9a28bba60c7f17f934848fc36d4bd478ffea55` | diverged; `public/app.js` touched |
| P91 [#1214](https://github.com/nickhaney916-lang/Closet-Current/pull/1214) | `9b353a5099c018cc252f17ae43ba8a02af314f7c` | direct +1 commit; 3 test/workflow paths |
| P90 [#1206](https://github.com/nickhaney916-lang/Closet-Current/pull/1206) | `63151a04a03f330bee683bdaf3c2d117a759cb0f` | diverged viewer research |

No donor is cherry-picked. M1/M2/M3 `app.js` conflicts must be individually audited by main; P91 final fix is not present in base, and remains its separate draft. P90 authentic source-verified 163-bone viewer remains **separate research**, not this photo-to-3D integrated acceptance.

## How to run / strict acceptance

No hosted Supabase, private accounts/photos, paid AI, or deploy. Install the exact pinned dependencies from the workflow and run:

```sh
P92_CHECKOUT_SHA="$(git rev-parse HEAD)" P92_ENGINE=chromium P92_TRIAL=1 node scripts/test-parallel92-exact-head.mjs
P92_CHECKOUT_SHA="$(git rev-parse HEAD)" P92_ENGINE=webkit P92_TRIAL=2 node scripts/test-parallel92-exact-head.mjs
```

CI runs **trial 1 then trial 2 sequentially in fresh browser processes on the SAME checked-out SHA for each engine**, plus the complete serial native Node suite after offline build. An absent or failing upstream actual model, an IDB commit issue, navigation error, owner source mismatch, cross-owner photo leakage, duplicate SHA, invalid/tampered backup, bad rollback, untrusted 3D admission, omitted viewport or unexpected outbound request is a failure. Do **not** turn failed assertions into skips. Each `benchmark/parallel92/<engine>/trial-<n>/receipt.json` is created only after all required checks succeeded; CI archive includes **safe JSON only**. Never claim two passes until exact-head run and job receipts are verified.

| Step | Verification mechanism | Truth boundary |
| --- | --- | --- |
| Actual native original JPEG and real P88 worker | M58 real browser WASM/Source SHA and no-auto-save JSON | Model proposal is UNVERIFIED |
| Owner edit, private save, saved wardrobe and Outfit Builder | M58 actual app synthetic-owner action, durable ID, saved outfit | Explicit simulated approval is NOT independent ground truth |
| Original-photo fallback, no unverifiable 3D | M58 same-session 2D + M51 320/390/430 per engine | Fitted 3D NOT approved |
| Owner A→B→A, JPEG tamper/refusal and recovery | M58 original native UI, P91 lifecycle | Local auth fixture, NOT hosted JWT/RLS |
| v4 export/import/cancel/tamper/rollback | M58 same-session + six M3 Chromium/WebKit cases | No full live cloud receipt |
| Concurrent identical source crop/auto/manual saves | Main native 2-writer real IDB browser regression | Synthetic sources/owners |
| Native build and full Node regressions | Offline Node CI job | Test results are not release |
| Real physical phones / 4 hosted signed accounts / independent blind labels / full layered garment 3D | **BLOCKED** | Separate authority required |

## Integration handoff

The main #1054 controller may **selectively copy this test-only P92 commit** into a newer main M4 integration branch after exact-SHA re-audit. If consumer code changes, update pins only after reviewing new source and rerunning tests; do not loosen security/identity/3D or owner-receipt assertions merely to produce green CI. Preserve Family Alpha #255 HOLD, and do not merge/deploy.

## Concurrent M87 source advancement

M4 advanced from the initial frozen 3f456c89 to verified-read HEAD `ebb8185dba7dcd54f026dd995f82b6238164be3b` (M87) while P92 work was in progress. GitHub comparison confirmed exactly one forward commit: `public/native-default-atomic-import-m3.mjs`, its source-fence test, and M58 no-deploy workflow. P92 incorporated this **whole new M4 commit unchanged via a two-parent ancestry-preserving merge on P92 alone**. New full-suite tests cover M87 import; native M58 original/owner/source remains pinned. No files were written on the M4 branch. Older P92 runs prior to this updated head are not valid final-head evidence.

## P92 browser isolation refinement

The existing genuine-worker M58 test fails closed if its source-locked P88 model never produces proposals. This was observed in two superseded P92 CI attempts that timed out after 420 seconds on that step (with no external model receipts). P92's own runner and workflow now prepare the **exact P88 four-file immutable import graph** by byte/hash before invoking the actual browser and clear prior receipts to prevent stale PASS. No synthetic predictions, fallback fake labels or skipped inference can satisfy the full strict gate.

To complete every **independently feasible** native regression even if genuine model startup is unavailable, a separate new `scripts/test-parallel92-independent-browser.mjs` runs two fresh original-photo Chromium and WebKit journeys at 320/390/430; source/owner 2D fallback, P91 document+IndexedDB lifecycle, manual/automatic duplicate original two-writer transaction, and six browser v4 snapshot/tamper/rollback/owner acceptance cases. It writes clearly labeled **NON-MODEL** receipts and must NEVER be presented as model-to-private-outfit integrated acceptance. The full actual genuine-worker replay remains mandatory and red until proven independently. All five P92 additions are testing/reporting-only, and none change `public/`, hosted cloud, M4 main, or other parallel branches.

## M87 WebKit 320px strict preview re-entry reliability follow-up

Main M87 workflow run [#43772518090](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43772518090) completed **6/7 PASS and overall FAIL**; its unchanged M51 native WebKit job #132991367017 failed at the second 320px preview after a focus-triggered board occasion change/restore. Its first original JPEG preview had passed; subsequent owner source preview returned a generic refusal. M87's only consumer-adjacent code change concerned legacy private import, not this read-only preview. P92 exact M87 parent passed eight genuine-model and independent native Chromium/WebKit trials, including M51 at 320px, but those successes do not prove the historical failed run's cause, timing or absence of an intermittent bug.

New `scripts/test-parallel92-m51-webkit-reentry.mjs` runs the **unchanged SHA-pinned M51 real-native-app WebKit acceptance** eight times with fresh browser processes, at all 320/390/430px widths. An ephemeral generated copy injects a read-only *failure-only* diagnostic at the pre-existing preview assertion; it records only safe booleans, research viewer phase, board occasion, and a second independent native read-only source preflight result. The same original assertions, original public JPEG, signed synthetic account, owner database, app consumer bytes and model/2D gates remain unchanged. A single failed trial fails CI immediately; it is never hidden by retry-masking. The temporary instrumented test is unlinked and only JSON diagnostic metadata is archived, never wardrobe photographs or screenshots. This diagnoses the actual M87 failure boundary without inferring root cause from one intermittent event. The independent output must never be mistaken for host RLS, physical-phone or source-fitted 3D acceptance.

## M88 concurrency handoff

During isolated P92 diagnosis the main #1210 branch independently advanced to exact `ebb8185dba7dcd54f026dd995f82b6238164be3b` (M88) with source-safe reason-category capture in the unchanged consumer's **existing M51 test runner** and its main no-deploy workflow. P92 no longer injects overlapping diagnostic code: it directly runs the exact M88 M51 script *unchanged*, eight fresh WebKit browser processes (320/390/430 each), propagating the M88 research-only refusal category without retries. P92 reverified the two changed M88 files and grafted its four other test/ledger paths onto the untouched M88 tree; the proposed PR remains exclusively five P92 testing/reporting paths. Historical M87 CI #43772518090 still failed 6/7 and must not be overwritten by a green historical inference. Exact-head P92 CI on the revised M88-ancestry commit, not previous P92 runs, governs the new re-entry claim.

## M90 exact-head adoption (continued P92 source fidelity)

Independent M88 P92 six-job [#43775418739](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43775418739) is **COMPLETE SUCCESS**, with **8/8 consecutive** actual native M51 WebKit runs covering **24** 320/390/430 viewport journeys, **2,803/2,803 Node tests**, real P88 model in both browser engines, and zero inferred physical/mobile/hosted/photorealism authority. The old M87 single failure remains historically real and not causally attributed.

Main subsequently advanced to M89 (additive test-only, source-safe internal preview lifecycle category) and M90 (default legacy import cross-ID verified-original anti-duplication safeguard, plus four dedicated atomic positive/negative Node regression cases). P92 now takes current M90 `ebb8185dba7dcd54f026dd995f82b6238164be3b` as its exact unchanged consumer base; protects main-owned M89 M51 blob `16cd06bcc1b1ef6bf8a6df3e3790c9abe2785167`, M90 importer blob `0a4b37751c5a46def7ae14676110a239ca6f34f8` and all remaining prior source pins. P92 stress consumes M89 internal reason categories without modifying main M51 script or application; all six jobs require fresh exact-P92-HEAD proof, no old successes substituted. No app code or donor changes relative to M90. #255 remains OPEN/HOLD.

## M91 independent actual-native import acceptance (source-locked)

Main #1210 moved to M91 exact ebb8185dba7dcd54f026dd995f82b6238164be3b, modifying only public/app.js owner-facing duplicate original refusal wording, the six-case Chromium/WebKit default native import browser test, its companion Node regression and its own workflow. P92 now preserves these main source bytes with independent exact blob pins app 991c00457799f8e2b8ae958d5ace85cc9914aece, native browser script 0cccb843a4ae0101cca8f242ee7c7410ec4f0e5d, Node test dbd0b0b6c6db2e1d49560d0d65b22d68dcd69fb9. P92 introduces a **seventh** strict CI job without extra test source files: unchanged main browser test is executed twice in both real Chromium/WebKit at 320/390/430 px, with assertions for refusal explanation, same original/different-ID refusal, no partial owner private IDB write, original-ID collision, foreign user, cancellation, 3D unchanged and staged multi-store atomic rollback. Independent accounts here are locally synthetic; this does not establish hosted signed JWT/RLS or a real physical smartphone. All six previous real-model/independent/8x WebKit/inherited test CI jobs remain unchanged except for M91 exact source pins. Exact P92 HEAD CI after this update is mandatory before accepting M91. Family Alpha #255 HOLD; no merge/deployment.

## M92 source-accurate additional duplicate-JPEG original fence

Main independently advanced to M92 exact SHA ebb8185dba7dcd54f026dd995f82b6238164be3b. Its own legacy native import source now rejects an unverified legacy JPEG alias across distinct garment IDs even with no SHA receipt. The unchanged M92 Chromium/WebKit native backup import regression introduces `unverifiedLegacyJPEGAliasBlocked`, plus distinct source JPEGs for staged transaction rollback. Its M92 Node suite adds focused negatives for unverified same-JPEG alias and shared-original cropped images plus positive independently different original and same-ID metadata changes. P92 pins M92 importer b4b7245686d81d47181f0795e9b9890bdb1642bc, browser 20f85d5eeda42f2acd921f1393c10cc7522d22df, Node 041f4e6b25f495b86a4d4828da6c622d0c9b0192; seventh independent cross-engine job now requires unverified alias denial for both engines at 320/390/430px twice, in addition to preserved M91 full rollback and owner notice. The six other original/P88/browser/8x WebKit/Node jobs remain strict. No source consumer write to main, no merge/deploy; Family Alpha #255 HOLD. New exact-head CI mandatory before accepting M92.

## M93 fixture integrity checkpoint — M92 duplicate source semantics upheld

Main advanced from M92 to M93 exact `ebb8185dba7dcd54f026dd995f82b6238164be3b` with only updated main no-deploy CI and corrected `tests/mission3-default-atomic-backup-source-guard.test.mjs` synthetic fixtures. The older fixture helper reused the same synthetic JPEG across separate distinct IDs, which M92's correct unverified duplicate-original fence refuses. M93 gives distinct synthetic originals to independent garments while keeping collision-negative fixtures intentional; M92 application/source enforcement is **unchanged**. Main M93 unit blob is `ece2954bc16c3c450ff7b3e1acd9cfa813bbaece`. P92 now uses exact M93 base with same seven-job Chromium/WebKit/8x WebKit/M92-alias/Node test-only gate, no application or hosted changes. The prior P92 M92 run's results remain tied to its older exact commit and are NOT substituted as M93 proof. No merge or deploy; #255 remains HOLD.

## Strict M93 genuine WebKit SegFormer failure diagnosis, no acceptance downgrade

Exact P92 M93 CI #43778460627 at HEAD `0d94863ea0281cafe5b1190706e62119fe4676b8` **FAILED** its actual native WebKit model job: immutable P88 module Worker and licensed public JPEG/real network responses (200 including model weights) loaded, but M58's unchanged line-194 source-verified assertion saw zero proposal cards after the status moved to finished. This failure is not a pass, nor evidence that the M92 legacy importer caused it. It occurred before synthetic owner approval/closet/3D steps; no leak, unexpected outbound or page crash appeared. P92 now copies the exact Git-SHA-pinned M58 test into a **temporary CI-only JS test file** next to the original and inserts **only** failure-only whitelisted status class, real-model successful HTTP-response count, boolean Worker state and fixed browser console-error categories. The original real Worker, public JPEG, all assertions, zero silent autosave and security restrictions remain completely unchanged; one failed trial still exits red immediately, with **no hidden retries or fallback logits**. This improves reproducibility/attribution only and does not establish a runtime reliability fix. Original M58 file and main/consumer branches stay untouched. Must rerun exact P92 HEAD acceptance and classify any new red genuinely. HOLD #255 remains open.

## M51 source-safe first-preview success-text but no owner JPEG diagnosis

Current P92 CI #43779235903 at exact SHA `20f6b07b189f03ef9571cbbdeead32af52aebe4d` showed **independent native WebKit M51 320px fail** after the first approved original-photo preview reported success: the actual `#mission4Preview1054Photos img` count was **0**, expected 1; no browser page errors or unexpectedly outbound network. This is distinct from the earlier genuine-model zero-proposal failure and the historical main M87 later re-entry refusal. It may indicate asynchronous owner/source viewer revocation after success, but attribution is **UNVERIFIED**. The P92 test-only script now runs a disposable same-directory copy of exact SHA-pinned main M51 source, replacing the single original image-count assertion with an equivalent **same-one-count** assertion and only failure-path read-only categorical observations (viewer phase, success/refusal class, visibility, document focus, owner-DB and board booleans). No photo content, owner identifiers, JPEG URL, auth token or screenshot is printed; no retry, sleep, extra render, or fake positive. The actual M51 main script and product remain unchanged. A new exact-head CI is needed to classify recurrence; green runs alone cannot establish a permanent lifecycle repair. Family Alpha #255 stays HOLD.

## M94 canonical JPEG original-byte identity handoff

Main Mission 4 advanced to M94 `93696bfa890f573fbbb23da3530da27c45d4b890`. Main changed only its atomic legacy importer, its Node source-guard regressions, and its own no-deploy workflow. The M94 import module blob is `3a83e3336ce36334a49708d1c7b90cc27194c7b9` and source-guard test blob is `5220f1a483604065446ce5fb07f8d1074e18df80`. M94 refuses a padded Base64 spelling that decodes to an already-owned original JPEG, while allowing genuinely distinct JPEG bytes. P92 preserves the exact M94 main tree and five P92 test/CI/report paths only. The native Chromium/WebKit import CI job additionally runs M94's exact native Node original-byte identity suite; all genuine P88 model/2D/owner-v4/8x WebKit checks remain unchanged and fail-closed. Historical intermittent native WebKit original-photo loss and model no-proposal failures remain authentic, not declared fixed by a later green run. Family Alpha #255 OPEN/HOLD; no merge or deployment.
