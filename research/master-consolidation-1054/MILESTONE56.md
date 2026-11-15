# MAIN1054 M56 — Genuine licensed original JPEG → pinned P88 model/masks → source-bound private review gate

**Family Alpha #255 OPEN/HOLD. DRAFT research only; NO MERGE, DEPLOY, prod/stage, hosted Supabase, private user photos, or modification to original default app / P88 / P89 / P90 branches.**

## Why this milestone exists

M54 source-negative status veto can block a multi-physical-garment semantic aggregate at last atomic private-save. M55 added source-bound mask identity, but its original 11 cases used synthetic P88-style worker messages on a genuine photo and did **not** exercise genuine inference-generated mask pixels. Therefore M55 alone could not establish that the real pinned model / P88 grouping would deliver any real photo-region source receipts to the protected owner review.

## Exact pinned source, no merge

- Parent: M55 exact `c22b0f8f654a15d37415cbbdaaef7cb0d0ea2657`, draft PR #1205.
- Independent P88: `cc4554ef0104506a72bf0a28423fee52b6e4fff2`, draft PR #1175.
- Exact immutable donor blobs: `public/outfit-worker.mjs` = `ab7d3837139c5b7d693383f9d6617e199ec8de4f`, `public/outfit-segmentation.mjs` = `d357955dd8fdab7c0cb727ea597c270edd9309ac`, `public/outfit-instance-review-840.mjs` = `6324d8eda33024f166311f424392ed83363e4942`.
- The dedicated CI runs `git show` to extract donor blobs into the untracked scratch path `.m56-exact-p88-donor/public/`, verifies Git object hashes, and NEVER overwrites the default app `public/` or deploys anything.
- Pinned genuine CPU model: `Xenova/segformer_b0_clothes` revision `a2489ea8e7ec1ee912190546bad31a4906ccca76`, `@huggingface/transformers@3.8.1`, CPU fp32. Model asset binary hash is **not independently verified** by the new code; this revision pin is not an independently witnessed model-weight checksum.
- Genuine legally registered checked-in originals: `commons-0003.jpg` (CC BY-SA 3.0 shirt photograph) and `commons-0090.jpg` (CC BY-SA 4.0 real outdoor/person photograph). At execution each original's actual JPEG bytes MUST match `benchmark/locked-photo-sources.json`; original-size P88 worker budgets and source unchanged are enforced. These source images were already public and developer exposed; NOT new sealed blindness or prospective independent ground truth.

## Engineering change

1. `research/master-consolidation-1054/p88-source-mask-ledger-56.mjs`: independently walks the exact accepted binary P88 mask bytes, refuses nonbinary flags, class-escaping selected pixels, empty/missing/duplicated region counts, invalid source SHA or geometry; rehashes all selected mask bytes with SHA-256. Delivers only source SHA, full mask SHA, ordered instance ordinal, exact P88 method, category hints, crop bounds, and unverified confidence for final bounded M55 intake. No raw mask bytes or photos retained in result.
2. `tests/main56-source-mask-to-owner-intake.test.mjs`: seven **synthetic painted-label** tests check mask conservation, tamper detection, M54 unresolved same-class veto, same-mask replay, spoofed receipt, live owner database switch and absence of automatic-save or 3D authority. They do not claim real model accuracy.
3. `scripts/run-main56-p88-licensed-inference.mjs`: actual native CPU SegFormer inference on the unchanged checked-in photos; the model output passes through the exact P88 segmentation + conservative `clothingReviewInstances840` modules, then actual accepted mask bytes are hashed and fed to M55's live owner/session/source-bound intake. Logs whether there were zero/one/multiple source proposals, negative unresolved tags, supported taxonomy refusal, and whether admission to *manual review only* succeeds. A checked source mask is never silently marked as one physical garment, never saved to IDB, and never considered 3D-ready. Honors P88's person-detection gate; no fake positive proposals when a flat-lay photo lacks a person.
4. The separate real-model GitHub job MUST fail if both photos yield zero proposals, rather than reporting a vacuous successful integration. It archives **JSON metrics only**, not original photos, crop pixels, model logits, or mask bitmaps. A negative/zero result should be investigated, not relabeled as success.
5. Inherited exact M54 + M55 owner safety tests, original PWA build, full no-deploy Node suite, and allowlisted source tree checks remain required in the first CI job. No default consumer source change.

## Truth/acceptance matrix (before running new HEAD CI)

| Contract | Status | Limit |
|---|---|---|
| Current source paths frozen and GitHub commits created | IMPLEMENTED | Exact GitHub job receipt still pending |
| Binary mask digest + source-class conservation and forged receipt guard | IMPLEMENTED / NOT YET CI VERIFIED | Unit labels are synthetic |
| Authentic checked-in licensed originals + exact SHA verified at runtime | RUNNER IMPLEMENTED / PENDING REAL EXECUTION | Two public photos, not a blind cohort |
| Actual pinned SegFormer logits → P88 review group methods | RUNNER IMPLEMENTED / PENDING REAL EXECUTION | Not literal browser Web Worker process |
| P88 real-mask receipt → M55 conservative owner-review eligibility | RUNNER IMPLEMENTED / PENDING REAL EXECUTION | Does not prove physical garment count |
| Authoritative independent human mask / instance accuracy | BLOCKED | 0 new source-disjoint human review |
| Native default browser worker integration | BLOCKED | No consumer app source modified |
| Actual signed two-account hosted RLS, physical phones | BLOCKED | Synthetic identity only |
| Photo-derived accurate layered 3D clothing / photorealism | BLOCKED | 2D source fallback remains |
| Family Alpha #255 | HOLD | No release or staging authorization |

## Exact no-deploy commands

```sh
node --test tests/main56-source-mask-to-owner-intake.test.mjs tests/main55-p88-source-key-lease.test.mjs tests/main54-unresolved-multi-mask-owner-veto.test.mjs
node scripts/build.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
# CI separately installs real public model dependencies and checks donor Git blob hashes:
node --expose-gc scripts/run-main56-p88-licensed-inference.mjs
```

The real-model command requires CI's previously assembled `.m56-exact-p88-donor/public/` **disposable** exact source modules and the pinned `@huggingface/transformers` runtime.

## Decision and next blocker

This closes the **engineering implementation of the source-honest real-photo masked-owner-admission experiment**. It is **NOT complete as a verified real-model result** until the exact M56 CI jobs finish successfully. A genuine inferred mask hash proves repeatable bytes, not correctness, correct garment boundaries, one physical garment, subtype/color accuracy, owner ownership, or signed cloud security. The true full worker → native app behavior, rights-cleared new human-labeled source-disjoint photos, quantified recall/precision, and physical-phone acceptance remain separate milestones.

No older M54/M55 green CI may substitute for M56 exact-head CI. Keep #255 HOLD and draft unmerged until evidence passes and owner authorizes release.
