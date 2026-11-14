# Closet Current — Parallel Mission #88, M1 disconnected garment review evidence

**FAMILY ALPHA HOLD #255 OPEN.** Isolated DRAFT / UNMERGED / UNDEPLOYED research. No production, staging, hosted Supabase, private family photos, accounts, wardrobes, or other mission branches.

## Immutable source and scope
Assignment [#1172](https://github.com/nickhaney916-lang/Closet-Current/issues/1172), master [#1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054). Branch `research/mission1-parallel88-instance-conservation-HOLD`, based on independent green Mission 1 P886 draft [#1134](https://github.com/nickhaney916-lang/Closet-Current/pull/1134) **exact immutable parent `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c`**. P886's 2/2 completed no-deploy CI [#43551341271](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551341271) is INHERITED evidence only, not acceptance for this child commit.

The final research diff is exactly **seven paths**: `public/outfit-instance-review-840.mjs`, `public/outfit-capture.js`, `public/app.js`, two focused Node test files, this report, and the branch-specific read-only GitHub Actions workflow. Actual production/default outfit capture still requires `?outfitInstances840=1`; no classifier, original image, model weights, owner private account/wardrobe, hosted cloud, staging or production was changed. Critically, the pinned `public/outfit-worker.mjs` **remains byte-for-byte unchanged**, as demanded by existing P82 model/source custody tests.

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
- Native class-mask component conservation and owner-review flags: **PASS**, 5/5 synthetic instance fixtures, five new owner-source/worker/draft/security cases, plus 20 inherited instance, segmentation and pairing regressions, **30/30 targeted combined**; no user-photo instances were scored.
- Shoe-pair, original-crop, duplicate owner and original JPEG custody contracts: **PASS** inherited no-deploy synthetic/native/browser checks; see exact receipts below.
- T-shirt/sweatshirt, sneakers/boots, dress/long-top cross-family **classification accuracy**: **BLOCKED** independent source-disjoint human-verified genuine photos and baseline/candidate inference.
- Original multi-garment detection recall, false positives, source-faithful color and owner-corrected zero-wrong-save denominators: **BLOCKED** independently sealed labels and genuine original-photo runs.
- Two-pretrained-model desktop browser stability: inherited research only; continuous WebKit reliability still unresolved in separate master M34 [#1169](https://github.com/nickhaney916-lang/Closet-Current/pull/1169). No inference model or runtime changed here.
- Native owner review/default no-auto-save and original custody: **PASS** inherited **673/673 Node** on the continuation code tree, plus six Chromium/WebKit owner/photo, six optional two-model and six footwear owner-source profiles. Physical phones, independent operators and authorized two-account cloud: **BLOCKED**.
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

The previous CI is pinned to its earlier immutable implementation tree. A later documentation-only report update leaves executable files unchanged but still requires its OWN final exact-head CI before a whole-current-HEAD green claim. The draft PR records the final checked SHA. For independently verified multi-garment masks, the next operator must run genuine source-JPEG segmentation with two independent human instance annotations and report false positives, missed overlapping garments, class confusion and owner-corrected saves; the 5 synthetic cases must never be presented as such evidence.

## Parallel #88 continuation — native source-to-owner unresolved-mask veto

A second **source-executed defect** was identified: although the new opt-in source grouping tagged `unresolved_fragments_keep_source_mask`, the original worker's normal `piece.hint` omitted that status, so ordinary owner Adjust could accept a large combined mask even after its segmentation had detected small unresolved fragments. A first implementation incorrectly modified the P82 **byte-pinned** `public/outfit-worker.mjs`; exact inherited Node exposed a genuine frozen-SHA failure, and that attempted edit was **fully reverted**. Its final Git diff is zero.

The compatible solution keeps the original worker untouched: the opt-in segmentation adapter marks an unresolved aggregate with the already-supported `piece.instanceMethod = native_semantic_group_unresolved_fragments`. Only the explicit `?outfitInstances840=1` `public/outfit-capture.js` maps that exact method into the pending `segmentHint.componentReviewStatus`, retains the owner original JPEG and review-required draft, while `public/app.js` displays the unresolved warning and rejects Adjust saves even when a user has entered a plausible category/color and checked the approval checkbox. The original image remains pending until recapture or removal.

The opt-in capture also binds worker delivery to the signed owner's original ID and object reference; both a different-account switch and a replaced same-ID signed session revoke further emitted pieces rather than placing them in another owner's draft. The legacy default worker and published model asset/baseline hashes remain immutable. The safety tests use mock segmentation logits and synthetic owner sessions; this is not real hosted JWT/RLS evidence or actual mask precision/recall.

**True historical genuine-source reference, NOT measured #88 improvement:** Parallel #68 [donor PR #919](https://github.com/nickhaney916-lang/Closet-Current/pull/919), in its already-exposed public Fashionpedia validation data, recorded baseline `19/53` matched independently annotated garment instances, `33` predicted, recall `35.85%`, precision `57.58%`. The **different prior connected-footwear donor** recorded `27/53` matched, `40` predicted, recall `50.94%`, precision `67.50%` (same 16 developer-exposed images, IoU>=0.5). #88's *new all-category* component candidate has **NOT** been run against those original photo/model masks; these donor metrics must NEVER be quoted as #88 baseline-to-candidate accuracy. Fashionpedia pretraining overlap is unknown, and this set is not new sealed source-disjoint blind data. Independent category/subtype/color human scoring and physically authorized owner zero-wrong-saves remain BLOCKED.

### Exact continuation code verification
- **Immutable verified continuation code commit:** `9873a847990cd8165c213c7b028d5a9f64af3f83`, immediate inherited P886 base `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c`; strict Git diff **seven paths**, no frozen worker, hosted/cloud/model/original JPEG modifications.
- [NO DEPLOY Actions #43625935186](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43625935186) **2/2 jobs COMPLETED SUCCESS**: **30/30** focused synthetic component/worker-original/captured-draft/owner switch/replaced session tests, **33/33** signed evidence adversarial gates, **673/673** inherited full Node (0 failed, 0 skipped), normal plus no-account builds, desktop Chromium+WebKit original JPEG source/reload/custody **6/6**, dual-model owner/consent/late response safety **6/6**, and owner footwear/pair/duplicate browser policy **6/6**, at 320/390/430 CSS widths. Zero genuine source-disjoint new human accuracy scored; physical devices = 0. Baseline real pretrained models still have intermittent WebKit failures researched separately in #1169.
- An additional unmodified `Camera and indexing scenario tests` workflow on the same code SHA [#43625935214](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43625935214) **SUCCESS**.
- **No merge, deploy or hosted/private changes; #255 OPEN/HOLD.** This report-only commit must pass its OWN subsequent exact-HEAD CI before finalizing a green-current-source receipt.

**Next highest-priority Mission 1 evidence:** the operator must retain legally reusable original JPEG source SHA and independent double-human mask annotations; run this exact new candidate and unchanged SegFormer/FashionCLIP/FashionSigLIP on the **same** formerly unseen photos (including touching/overlapping two-of-a-kind garments); measure matched IoU, instance FP/FN, per-subtype and color correctness, abstentions, owner corrections and 0 wrong saves. Without that, do not promote this opt-in branch or lift release HOLD.
