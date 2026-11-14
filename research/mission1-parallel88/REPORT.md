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

All five above are **verified passing synthetic test observations** in the new source-conservation suite; they are NOT a real-model or independently human-labeled recognition result. The semantic-class test masks are synthetic; no pixel mask from a genuine JPEG was newly evaluated in #88. No human labels, real FashionCLIP/FashionSigLIP inference, device acceptance, or measured recall improvement is claimed.

## Acceptance ledger
- Native class-mask component conservation and owner-review flags: **PASS**, 5/5 new synthetic fixtures, plus retained original 20 targeted native instance, segmentation and pairing regressions, 25/25 targeted combined; no user-photo instances were scored.
- Shoe-pair, original-crop, duplicate owner and original JPEG custody contracts: **PASS** inherited no-deploy synthetic/native/browser checks; see exact receipts below.
- T-shirt/sweatshirt, sneakers/boots, dress/long-top cross-family **classification accuracy**: **BLOCKED** independent source-disjoint human-verified genuine photos and baseline/candidate inference.
- Original multi-garment detection recall, false positives, source-faithful color and owner-corrected zero-wrong-save denominators: **BLOCKED** independently sealed labels and genuine original-photo runs.
- Two-pretrained-model desktop browser stability: inherited research only; continuous WebKit reliability still unresolved in separate master M34 [#1169](https://github.com/nickhaney916-lang/Closet-Current/pull/1169). No inference model or runtime changed here.
- Native owner review/default no-auto-save and original custody: **PASS** inherited 668/668 Node plus desktop synthetic-owner/source-bound policy. Physical phones, independent operators and authorized two-account cloud: **BLOCKED**.
- Source-to-outfit/private index: coordination remains with master #1054, including later M34 [#1170](https://github.com/nickhaney916-lang/Closet-Current/pull/1170) durable owner-row research; this branch does not integrate with that different ancestry or enable 3D.
- Mobile per-photo p50/p95, device memory: **UNMEASURED**; no hardware available. Synthetic 5-fixture proposal diagnostics are never model recognition precision/recall.

## Reproduction and master consumer handoff
```sh
node --test tests/mission1-parallel88-instance-conservation.test.mjs tests/outfit-instance-review-840.test.mjs tests/outfit-segmentation.test.mjs tests/outfit-unit-reconciliation-70.test.mjs
node --test tests/mission1-release-evidence-851.test.mjs
node scripts/m1-release-evidence-851.mjs   # must remain BLOCKED, never release
```
CI also runs the inherited full native Node/build and desktop Chromium/WebKit original photo/owner safety suite. **Do not independently cherry-pick this on a consumer branch** until master verifies exact source compatibility and real-photo over-/under-segmentation on source-disjoint originals. Keep owners' review and same-source mask receipts mandatory and preserve the original JPEG/2D fallback. Next priority is blind public/legal real-photo two-human ground truth and before/after mask/recognition/owner-save measurement, separate from mocked safety.

## Actual no-deploy CI receipt — exact implementation tree

[Actions #43622320025](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43622320025) **COMPLETED SUCCESS, 2/2 jobs** on implementation SHA `a5a6736216ca53397eee84155f2eec798685d26e` (parent P886 `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c`). Exact four path allowlist and no cloud/app/worker/model/original-corpus edits PASS. Focused source-mask/footwear/owner unit suite **25/25 PASS**; signed independent evidence adversarial gate **33/33 PASS** and release evidence correctly `BLOCKED` with `shouldLiftFamilyAlphaHold:false`. Inherited full native Node/build **668/668 PASS, zero fails/skips**. Chromium and WebKit 320/390/430 original-JPEG source/custody/reload profiles **6/6 PASS** (source SHA preserved); optional dual-model owner review/consent/stale/conflict safeguards **6/6 PASS**; owner pair-unit duplicate and cross-owner browser guards **6/6 PASS**. These are scripted desktop/synthetic owner safety tests, NOT new genuine model classification accuracy, physical phones, legally source-disjoint human masks, real cloud owner authentication or live release approval.

The above CI run is pinned to the immutable **implementation tree**. A later documentation-only report update leaves executable files unchanged but requires its OWN final exact-head CI before a whole-current-HEAD green claim. The draft PR records the final checked SHA. For independently verified multi-garment masks, the next operator must run genuine source-JPEG segmentation with two independent human instance annotations and report false positives, missed overlapping garments, class confusion and owner-corrected saves; the 5 synthetic cases must never be presented as such evidence.
