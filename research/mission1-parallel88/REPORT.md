# Closet Current — Parallel Mission #88, M1 disconnected garment review evidence

**FAMILY ALPHA HOLD #255 OPEN.** Isolated DRAFT / UNMERGED / UNDEPLOYED research. No production, staging, hosted Supabase, private family photos, accounts, wardrobes, or other mission branches.

## Immutable source and scope
Assignment [#1172](https://github.com/nickhaney916-lang/Closet-Current/issues/1172), master [#1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054). Branch `research/mission1-parallel88-instance-conservation-HOLD`, based on independent green Mission 1 P886 draft [#1134](https://github.com/nickhaney916-lang/Closet-Current/pull/1134) **exact immutable parent `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c`**. P886's 2/2 completed no-deploy CI [#43551341271](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551341271) is INHERITED evidence only, not acceptance for this child commit.

Changes are limited to the existing **off-by-default** `public/outfit-instance-review-840.mjs` native same-class review proposal, one new adversarial Node test file, this report, and the branch-specific, read-only GitHub Actions workflow. Actual production/default outfit capture still requires `?outfitInstances840=1`; no classifier, model weights, original photos, adult/child accounts, owner save transaction, runtime worker or source hash code is changed.

## Source-verified defect and targeted repair
Native `clothingMaskGroups` unions every disconnected accepted component of a semantic clothing class (e.g., two shirts), and the existing P840 opt-in instance split was limited to footwear. In genuine multi-item photographs this can hide distinct same-class drafts from their owner; it does NOT establish a verified recognition label, as semantic masks may split one garment or combine overlapping items.

The new opt-in adapter performs four-neighbor connected-component extraction for all accepted garment semantic groups (including tops, bottoms, dress, outerwear and accessories), retains original class/bounds/category without inventing subtype, and produces distinct **review-required** masks for disconnected sufficiently supported components. For any low-area/low-confidence islands or excessive fragmentation, it **retains the full original accepted combined group** flagged `unresolved_fragments_keep_source_mask` rather than silently deleting source pixels. Shoe-pair components retain existing P840 method and require separate owner physical-unit decisions. All outputs continue through source-photo crop, mask ownership, owner Adjust, original JPEG and duplicate/pair review; NONE grants automatic wardrobe or 3D admission.

**Limit:** This adapter only partitions the pixels already accepted by the original segmentation threshold. Pixels discarded by the upstream model, overlapping/touching garments, false-positive masks, segmentation recall and instance-identity correctness are NOT repaired or scored. The new groups are proposals, not verified distinct physical clothes.

## Baseline/candidate checks (synthetic controlled semantic mask fixtures, NOT independent photo accuracy)

| Diagnostic fixture | Baseline class-level proposal | Candidate proposals | Conserved accepted source pixels | Owner approval |
|---|---:|---:|---:|---|
| Two disconnected tops | 1 | 2 | 72/72 | Required |
| Two disconnected dresses | 1 | 2 | 84/84 | Required |
| One top + tiny detached fragment | 1 | 1 unresolved | 54/54 | Required |
| Two shoes (existing P840) | 1 | 2 | 50/50 | Required |
| Background-only | 0 | 0 | 0/0 | No proposed item |

All above are **test expectations** until exact-head CI runs, not claimed passing observations. The semantic-class test masks are synthetic; no pixel mask from a genuine JPEG was newly evaluated in #88. No human labels, real FashionCLIP/FashionSigLIP inference, device acceptance, or measured recall improvement is claimed.

## Acceptance ledger
- Native class-mask component conservation and owner-review flags: TEST PENDING exact-head no-deploy CI.
- Shoe-pair and original-crop inherited source contracts: TEST PENDING exact-head no-deploy CI.
- T-shirt/sweatshirt, sneakers/boots, dress/long-top cross-family **classification accuracy**: **BLOCKED** independent source-disjoint human-verified genuine photos and baseline/candidate inference.
- Original multi-garment detection recall, false positives, source-faithful color and owner-corrected zero-wrong-save denominators: **BLOCKED** independently sealed labels and genuine original-photo runs.
- Two-pretrained-model desktop browser stability: inherited research only; continuous WebKit reliability still unresolved in separate master M34 [#1169](https://github.com/nickhaney916-lang/Closet-Current/pull/1169). No inference model or runtime changed here.
- Native owner review/default no-auto-save and original custody: inherited protective contracts, to be rerun; physical phones, independent operators and authorized 2-account cloud: **BLOCKED**.
- Source-to-outfit/private index: coordination remains with master #1054 M33 [#1167](https://github.com/nickhaney916-lang/Closet-Current/pull/1167); this branch does not integrate with its different branch or enable 3D.
- Mobile per-photo p50/p95, device memory: **UNMEASURED**; no hardware available. Synthetic 5-fixture proposal diagnostics are never model recognition precision/recall.

## Reproduction and master consumer handoff
```sh
node --test tests/mission1-parallel88-instance-conservation.test.mjs tests/outfit-instance-review-840.test.mjs tests/outfit-segmentation.test.mjs tests/outfit-unit-reconciliation-70.test.mjs
node --test tests/mission1-release-evidence-851.test.mjs
node scripts/m1-release-evidence-851.mjs   # must remain BLOCKED, never release
```
CI also runs the inherited full native Node/build and desktop Chromium/WebKit original photo/owner safety suite. **Do not independently cherry-pick this on a consumer branch** until master verifies exact source compatibility and real-photo over-/under-segmentation on source-disjoint originals. Keep owners' review and same-source mask receipts mandatory and preserve the original JPEG/2D fallback. Next priority is blind public/legal real-photo two-human ground truth and before/after mask/recognition/owner-save measurement, separate from mocked safety.
