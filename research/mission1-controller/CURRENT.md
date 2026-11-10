# Closet Current — primary conversation controller checkpoint (Mission 1)
<text version="1" generatedFrom="verified GitHub evidence, not owner approval"/>

**READ THIS FILE FIRST when resuming from the chat.** It is a compact source-controlled pointer, not a claim of ChatGPT background execution or a replacement for GitHub CI. The user wants to run engineering from one ChatGPT conversation without relying on an exhausted separate Work workspace.

## Authority and boundaries
- Repository: `nickhaney916-lang/Closet-Current`.
- Mission 1 objective: real photographed garment recognition, source integrity, actual instance masks, category/subtype/color, camera→manual review→private owner closet, genuine independent accuracy acceptance.
- **FAMILY ALPHA HOLD #255. NEVER merge or deploy staging/production without explicit acceptance.** Research PRs are stacked drafts. Keep Mission 2 independent.
- Development controller only acts during interactive turns. Use GitHub connector to inspect/modify files, GitHub Actions for actual heavy model tests; never promise background work or fabricate real human/phone acceptance.

## Last independently VERIFIED baseline
- P796 draft <https://github.com/nickhaney916-lang/Closet-Current/pull/795>, HEAD `64fdfb398ccfaf9966f0ac1fa64223d33fe9518a`.
- Actual GitHub Actions <https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42902792723>: 2/2 passed, complete **1,637/1,637 Node tests**, real SHA-pinned SAM2.1 Hiera-tiny ONNX encoder+decoder, 10 already development-exposed genuine publisher-original JPEG photos, **23** original publisher garment polygon masks.
- SAM2.1 **one known-mask-derived positive ORACLE point per garment**: model-chosen multimask original source-pixel IoU ≥.50 on **15/23** (mean IoU **0.600273**, 8 failures, 0/3 coat category). These are **NOT independent human taps, automatic clothing detection or a blind heldout**.
- Unprompted frozen SegFormer B0 P792 on 23 published garment polygons: growth 8 TP, 20 FP, 15 FN Chromium; 8 TP, 17 FP, 15 FN WebKit. P794 unseeded region recovery generated **0 TP / 11 FP**, rejected. Do not promote any automatic result.
- Source contamination controls: 83 original SHA-exposed research image ledger, all 83 real original JPEG crop fingerprints with seven source-view hashes each (P793 PR #791). New human prospective cohort must not reuse known/exposed/recompressed images.

## Current IN-PROGRESS engineering mission
- **P797 memory-bounded SAM2** development branch `research/mission1-bounded-sam2-memory-checkpoint-797-HOLD` based on exact P796 head.
- Goal: stream verified 130MB public model ONNX files in 1MiB chunks instead of buffering whole files, bound download sizes, decode each original photo once for all instances, release source and model feature arrays per photo, measure process peak RSS. Preserve identical actual 23/23 publisher evidence and no owner auto-save.
- Research PR and exact CI SHA must be updated here ONLY AFTER they pass; this document deliberately does not pretend a pending test is already verified.

## How to resume without costly context
1. Fetch latest `research/mission1-controller/CURRENT.md` from the **latest verified applicable draft PR head** and fetch that PR's HEAD and GitHub Actions statuses; do not assume a previous chat assistant result is still current.
2. Inspect latest separate Mission 1 research branches/PRs for conflicts or new independent acceptance; keep compatibility parent pinned.
3. Finish P797 and verify exact GitHub Actions job including a genuine 10-photo/23-mask model run, actual RSS evidence, complete Node suite and artifact evidence. Patch defects and rerun; never certify pending runs.
4. Next substantive independent engineering: capture a **real owner tap** to select a garment source region and keep original JPEG private; plug a source-bound **review-only** segmentation mask into the Adjust path without auto-confirming category/subtype/color. Actual CPU/browser memory performance and Samsung/Android + iPhone Safari physical tests remain unknown. Explore mobile-specific model performance independently before any product adoption.
5. Complete remaining human-blind new rights-cleared, commercially usable and model-training-disjoint photo benchmark, independent two-human adjudications, stringent category/subtype/color/instance quality, two real signed-owner cloud/RLS/privacy restoration and physical devices, explicit release decision. Human and physical acceptance CANNOT be simulated by unit tests.

## Honest completion status
- Multiple scoped research engineering PRs are complete, but **ENTIRE MISSION 1 IS NOT COMPLETE**; full release and alpha remain **HOLD**.
- Other mission branch (3D garment realism) is separate. Do not merge or rewrite its PRs.
- Do not store source JPEGs/ONNX weights or user-owned private photos in GitHub code or artifact outputs; numeric research receipts only.

*After exact P797 verification, replace the checkpoint with the new SHA, PR and CI URL. Nothing in this file gives authority to deploy or work unattended.*
