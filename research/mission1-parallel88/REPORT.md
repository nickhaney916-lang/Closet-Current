# Closet Current — Parallel Mission #88, M1 disconnected garment review evidence

**FAMILY ALPHA HOLD #255 OPEN.** Isolated DRAFT / UNMERGED / UNDEPLOYED research. No production, staging, hosted Supabase, private family photos, accounts, wardrobes, or other mission branches.

## Immutable source and scope
Assignment [#1172](https://github.com/nickhaney916-lang/Closet-Current/issues/1172), master [#1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054). Branch `research/mission1-parallel88-instance-conservation-HOLD`, based on independent green Mission 1 P886 draft [#1134](https://github.com/nickhaney916-lang/Closet-Current/pull/1134) **exact immutable parent `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c`**. P886's 2/2 completed no-deploy CI [#43551341271](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551341271) is INHERITED evidence only, not acceptance for this child commit.

The **initial source-conservation milestone** changed seven files, but the **current cumulative P88 research branch diff is exactly 17 allowlisted paths**, including original opt-in source-review and three consumer-source safety files, two focused Node suites, source-preserved public Fashionpedia benchmark metadata and scripts, independent licensed ONNX accessory model research, the new strictly offline signed-blind-custody preflight module, this report and the branch-specific NO-DEPLOY workflow. The current cumulative count supersedes any earlier progress checkpoint below; see exact-head GitHub CI for the authoritative allowlist. Actual production/default outfit capture still requires `?outfitInstances840=1`; no classifier, original image, model weights, owner private account/wardrobe, hosted cloud, staging or production was changed. Critically, the pinned `public/outfit-worker.mjs` **remains byte-for-byte unchanged**, as demanded by existing P82 model/source custody tests.

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
- Native class-mask component conservation and owner-review flags: **PASS**, 5/5 synthetic source-mask fixtures, 15 source-executed owner/draft/session/physical-unit cases, plus 20 inherited instance, segmentation and pairing regressions, **40/40 targeted combined**; no user-photo instances were scored.
- Shoe-pair, original-crop, duplicate owner and original JPEG custody contracts: **PASS** inherited no-deploy synthetic/native/browser checks; see exact receipts below.
- T-shirt/sweatshirt, sneakers/boots, dress/long-top cross-family **classification accuracy**: **BLOCKED** independent source-disjoint human-verified genuine photos and baseline/candidate inference.
- Original multi-garment detection recall, false positives, source-faithful color and owner-corrected zero-wrong-save denominators: **BLOCKED** independently sealed labels and genuine original-photo runs.
- Two-pretrained-model desktop browser stability: inherited research only; continuous WebKit reliability still unresolved in separate master M34 [#1169](https://github.com/nickhaney916-lang/Closet-Current/pull/1169). No inference model or runtime changed here.
- Native owner review/default no-auto-save and original custody: **PASS** **683/683 full Node** on the latest verified research code, plus six Chromium/WebKit original-JPEG custody, six optional two-model owner review and six footwear owner-source browser profiles. Physical phones, independent operators and authorized two-account cloud: **BLOCKED**.
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

## Parallel #88 continuation — source-bound photo retry, unit identity, SHA race hardening

**New engineering defect found and fixed:** A prior opt-in capture could terminate after an account change while leaving `lastOutfitPhoto` and the Retry control available. Clicking Retry under another owner could create a new worker task using the previous user's unsaved original JPEG, because `startOutfitSplit` then rebound the work to the *new* user. Separately, asynchronous `photoToJPEG()` could begin under owner A and resolve after owner B signed in, at which time a fresh capture would incorrectly use B's session for A's file.

- The isolated off-by-default `?outfitInstances840=1` pathway now leases retry memory to the exact original signed user **object reference AND ID**, cancels replay and clears the old JPEG retry cache on either different-ID or replaced same-ID session. A legitimate unchanged-owner retry still works. Asynchronous JPEG decode records the original signing reference and discards the decoded result before worker creation if that session changes. The regular no-flag capture is unchanged.
- Additional race: experimental source-bound color analysis `?outfitInstances840=1&outfitUnits70=1&color76=1` awaits the source SHA-256. A same-ID new owner object could previously pass a textual ID-only check **after** the await. We now revalidate exact owner/session identity before accepting the result, cancel the worker and clear any cross-session retry JPEG.
- Separate garment class components (including shoes) are only **review proposals**. P88 now maps exact frozen `instanceMethod` values `connected_semantic_component_unverified` and `connected_footwear_component` to `segmentHint.componentReviewStatus='owner_must_confirm_garment_units'`; native Adjust cannot save them on category/color checkbox alone. A physical-unit owner decision must first yield **source/mask SHA-bound** reconciliation (paired, fragments combined or explicitly kept separate), and the inherited P846 signature/owner/duplicate gates must also pass. Without opt-in `outfitUnits70=1`, this split research view can be inspected but **cannot** admit an isolated component into the closet. A single-garment recapture remains possible. Unknown component statuses always fail closed; direct model auto-admission rejects any unresolved source status regardless of apparent confidence. The original pinned `outfit-worker.mjs` is still byte-identical.
- Synthetic source-executed tests exercise wrong owner retry, same-ID replaced session, legitimate retry, cross-owner and same-ID asynchronous decode cancellation, owner-verified SHA await race, shoes vs physical pairs, two disconnected tops, direct strong-classifier admission denial, and original JPEG draft retention. No user account/photo/backend was touched.

### Verified continuation code SHA and evidence

**Exact executable source SHA** before this documentation-only commit: `ae550fa99d424ba2dbd5db1c5f9db5a5e71b9126`. [GitHub Actions #43627639383](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43627639383) **COMPLETED SUCCESS, 2/2 jobs**:
- **40/40** focused native synthetic mask/worker/draft/owner/physical unit/race/pair tests; **33/33** precommitted adverse source/release evidence gates.
- **683/683** complete native Node tests (0 fails, 0 skips), native and no-account research builds PASS; actual desktop Chromium + desktop WebKit at 320, 390, 430 CSS widths original-JPEG source identity/reload **6/6**, dual-model review/consent/stale message safety **6/6**, and footwear owner/pair/duplicate guards **6/6**.
- All changes remain seven allowlisted files atop immutable green P886 base. **No model bytes, original JPEG benchmark, P82 pinned outfit worker, auth backend, Supabase, production, staging or private family wardrobe** modified.
- This is a **native-safety and source-conservation improvement**, not new FashionCLIP/FashionSigLIP/SegFormer human-annotated accuracy. The historical P68 19/53→27/53 remains exposed donor research; there are **zero** new #88 genuine photo precision/recall claims. Physical phone and independently witnessed private two-owner cloud acceptance are **NOT RUN**.

**Remaining blockers:** locked legally reusable source-disjoint new genuine photos with two independent human instance/type/color annotations, before/after authentic model IoU and class-confusion/FP/FN scoring, human owner correction and no-wrong-save denominator; actual Android/iOS and authorized two-user RLS/JWT/restore acceptance, and separate intermittent WebKit model runtime M34 #1169. Master #1054 must reconcile diverged ancestry and integrate actual source→private save contract before promotion. **FAMILY ALPHA HOLD #255 OPEN; do not merge/deploy.**

*This documentation-only commit triggers another exact-head no-deploy CI. Treat #43627639383 as the immutable **executable tree** receipt until the report-head run is verified independently.*

### Continuation — independently verified source identity in P70 without color76

**Source-verified defect:** The experimental capture path `?outfitInstances840=1&outfitUnits70=1` trusted `piece.reconciliation70.sourceSha256` from its own worker; independent SHA-256 recomputation of the original camera JPEG was previously switched on only with the separate `color76=1` research flag. Two syntactically valid but inconsistent worker source receipt fields could be presented for a source photo without local independent verification. The owner/mask receipt format checks are NOT proof of the source bytes unless the page independently hashes the **exact original JPEG**.

**Implementation:** `public/outfit-capture.js` now computes `SHA-256(atob(original JPEG data URI))` in the browser for any enabled `outfitUnits70` session, preserving P848/P76's exact original color source-digest and `originalSha256ForColor76` function contract. The non-color P70 path uses a separate `unit70SourceDigest`; with color76 the existing digest is reused rather than duplicate hashing. For every unit70 piece, before `candidate()` can introduce an unsaved owner draft, the page verifies:
- Live exact original signed owner user ID **and user object reference** again after any digest await, and the exact still-active capture job;
- Canonical 64-character lowercase hexadecimal source and mask hash receipt shapes;
- The worker's `sourceSha256` **equals** the independently calculated original JPEG SHA-256;
- A missing `crypto.subtle`, failed digest, mismatch, malformed receipt or changed owner terminates the job safely. Already accepted unsaved drafts remain pending; no unverified new piece is admitted; the same original owner's retry remains available.

**Message-order correction:** P70 piece/done/error worker events now share one ordered promise chain (previously only P76 did), preventing a fast `done` signal from finishing/terminating the worker while an earlier piece is waiting for the browser SHA digest. The unchanged default capture remains synchronous, and the signed-owner/reconciliation/physical garment approval gates remain unchanged. The pinned `public/outfit-worker.mjs` is still byte-for-byte identical to the donor.

**Reproducible tests:** Six new source-executed VM tests compute an actual SHA-256 over decoded **synthetic JPEG-form** input bytes, then exercise exact valid-receipt acceptance to an **unsaved review draft**, valid-format but wrong source hash rejection, absent/invalid mask SHA rejection, deliberate delayed digest with queued `piece → done`, preservation of earlier verified unsaved draft after a later mismatched source receipt, and digest-unavailable fail-closed behavior. Tests do **not** run fresh SegFormer/FashionCLIP/FashionSigLIP model inference or genuine human-labeled photo accuracy. They verify **original-source receipt SHA equality only**; mask SHA bytes are worker-issued and not independently rederived in the parent capture because raw mask bytes are not sent, and no human unit judgment is inferred.

**Exact tested implementation SHA:** `57dfcd9e2f46e920536c81069bd93f73cf776bd2`. [No-deploy Actions run #43628677345](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43628677345) **2/2 successful jobs**, **46/46** focused mask/source/owner tests, **33/33** release negative gates, **689/689** full inherited Node tests (zero fail/skip), native/no-account builds, original JPEG custody **6/6**, dual-model owner-consent browser checks **6/6**, and shoe physical-unit owner browser checks **6/6** across desktop Chromium/WebKit at 320/390/430 CSS widths. A deliberate intermediate change renamed the earlier P76 hash-helper contract and caused two inherited source-contract failures; the implementation **restored the original P848/P76 code signature**, retained the new P70 proof separately, and exact-tree full CI passed. The report-only commit after this code SHA must itself be checked at exact HEAD.

**Not completed:** independent actual mask pixel hash attestation, real-source human-labeled multi-garment instance precision/recall, exact mobile p50/p95, physical iOS/Android tests, source-disjoint dual-model subtype score, private two-account Supabase/cloud/backup/restore, and native master #1054 integration are still **BLOCKED/UNMEASURED**. No automatically saved items, private accounts or production deployment. **Family Alpha #255 remains OPEN/HOLD.**

## Continuation — prevent stale P70 mask receipts during owner crop

**Source-confirmed defect:** The native `cropClothingPhoto` editor can replace `item.image` with a new owner-selected crop while the existing `item.reconciliation70.maskSha256` and source/physical garment confirmation metadata remain untouched. The original P846 crop button blocked completed shoe pairs/combined fragments but not `reconciliation70` separate/unresolved pieces or explicit P88 mask-review statuses. Thus a changed displayed garment could retain an old worker-issued mask receipt. No evidence justifies claiming that newly cropped photo pixels represent the previously hashed selected mask.

**Isolated fix:** `public/app.js` now treats any `reconciliation70`, `reconciliation70Status`, `shoePair`, `combinedFragments70` or explicit `segmentHint.componentReviewStatus` as a source-bound mask. A self-contained `Crop photo` button disabled-state check prevents the normal UI from opening that edit and keeps inherited standalone photo-result test integration compatible. The `cropClothingPhoto()` handler itself repeats the guard, so direct invocation bypassing the disabled button cannot open a stale-mask edit. The editor's optional async `save()` callback additionally tests **at invocation**, **after awaited photo-quality estimation**, and **before storage**, with another check inside the queued pending-draft write. Attempts to attach a P70 mask while an earlier crop is awaiting photo quality abort the crop **without an IDB write or changing the original JPEG**. The owner can capture a new *single-garment* photograph and review it afresh; ordinary nonsegmented photo cropping still works.

**Reproducible evidence:** Four new source-executed synthetic Node tests cover P70 unresolved/separate/paired/combined and P88 source statuses, programmatic disabled-button bypass, normal saved single-photo crop success, and a late P70 mask receipt added both before and during asynchronous quality analysis. No new external user photographs, independent pixel hashes, hosted cloud, private owner accounts or physical phone sessions were used. The immutable P82 outfit worker and SegFormer/FashionCLIP/FashionSigLIP pretrained assets are untouched. This is protection against **stale mask-to-displayed-photo associations**, not a proof of raw segmentation mask validity or a new model accuracy measurement.

The tested implementation commit is `4073f2b5e03d53010b60136e23565841d2b2ba48`. Its focused [no-deploy Actions #43629879633](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43629879633) source job showed **50/50** focused tests and **33/33** release-evidence checks passed. The entire native and browser test job was still running when this report section was authored and must be checked against its immutable SHA. The report-only commit itself must independently pass exact-HEAD CI before claiming a whole-branch green status.

**Unchanged Family Alpha requirements:** real human-confirmed source-disjoint multi-garment instance/label/color accuracy, independently verifiable actual raw mask pixels, actual Android Chrome and iPhone Safari session behavior, hosted signed two-account RLS/restore/cloud writes and master integration remain BLOCKED. No merge, deployment or private data work. **FAMILY ALPHA HOLD #255 OPEN.**

## REAL PUBLIC-HUMAN VALIDATION — 16 PHOTOS, 53 INSTANCE POLYGONS

**This new measured result supersedes earlier sections saying #88 lacked genuine-photo instance metrics.** Source constraints, human labels and model assets were actually processed in [no-deploy workflow #43632277038](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43632277038) at executable source SHA `e29ffae4fb2b2ef384cdba628d4e83d0a8d8ff5d`: **COMPLETED SUCCESS 3/3 jobs** (native/policy, browser and real-photo). **51/51** focused native tests, **33/33** independent negative evidence checks, **694/694** complete Node tests with 0 fail/skip, two no-account/native builds, and desktop Chromium/WebKit original-JPEG, dual-model owner review and shoe-pair policies at 320/390/430 CSS width (6/6 each). The exact report-only HEAD after this source receipt must also be checked separately. **Family Alpha issue #255 is still OPEN/HOLD.**

### Genuine source, model and evaluation protocol

- **16 official unmodified Fashionpedia public validation JPEGs** with **53 independently human-annotated garment instance polygons**; official annotations Fashionpedia Consortium **CC BY4**, individual photograph creator and CC BY2 / BY-SA2 primary Flickr rights retained in frozen `research/mission1-parallel88/frozen-public-validation-68.json`. The manifest is byte-identical to the previously examined Parallel #68 frozen validation source: **SHA-256 `b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd`**. Photos verified by SHA against the official Fashionpedia dataset ZIP, fetched through bounded HTTP byte ranges. **16/16 original JPEG SHA verified.** Photos and original masks remain local to ephemeral CI and are not uploaded or committed to GitHub; only analysis JSON artifacts are uploaded.
- This is **P68's ALREADY EXPOSED validation cohort**, photo/source/photographer-disjoint from P68 development, but public dataset pretraining exposure is **unknown**. It is **NOT sealed, newly blind or prospective foundation-model generalization**. Only 16 images; the intended 200-photo and family/mobile-distribution acceptance cohorts remain unavailable.
- Actual `Xenova/segformer_b0_clothes`, pinned revision `a2489ea8e7ec1ee912190546bad31a4906ccca76`, fp32 CPU with `@huggingface/transformers@3.8.1`, produced the **SAME segmentation logits per image** for four alternative grouping methods. The model revision is pinned; an independent model-binary hash receipt is **not established**, so the benchmark must not be presented as complete artifact attestation.
- `research/mission1-parallel88/run-public-validation-88.mjs` computes original-resolution binary masks, source/model/mask receipts and all grouping proposals; `score-public-validation-88.py` verifies mask SHA and performs maximum-cardinality one-to-one COCO-mask IoU matching at **IoU ≥ 0.50**, following P68's category compatibility collapse. Raw JPG or private owner data never appear in output artifacts.
- The evaluator returns **actual visible garment instance-mask metrics**, **not subtype, primary-color, automated-save accuracy, 2D→3D correctness, or iPhone/Android performance**. These additional truths were not independently annotated and must remain **UNKNOWN**, not scored as correct.

### Measured all-grouping comparison, identical original photos and logits

| Grouping method | Human instances | Model proposals | IoU-matched | Instance recall | Instance precision | False positives |
|---|---:|---:|---:|---:|---:|---:|
| Native class semantic grouping | 53 | 33 | 19 | 35.85% | 57.58% | 14 |
| Existing P68 **shoe-only** split | 53 | 40 | 27 | **50.94%** | **67.50%** | **13** |
| New P88 **conservative shoe-only trial** | 53 | 40 | 27 | **50.94%** | **67.50%** | **13** |
| P88 unrestricted **all-class research** | 53 | 46 | 27 | 50.94% | 58.70% | 19 |

All four modes use the same 53 human instances and exactly the same logits. **P88 all-class research created SIX extra false positives with ZERO net new true-positive matches compared with the P68 shoe-only method**, lowering instance precision by **8.80 percentage points** without recall gain. The P88 conservative trial retained P68's true matches while avoiding that extra false-positive inflation. Human-category-compatible matches: native **15**, P68 shoes **23**, P88 conservative **23**, P88 all-class **23** (these are not true broad-category classifier accuracy rates).

Per-category compatible instance matches on the conservative trial: **Shoes 10/16** (native 2/16), **Dresses 9/12**, **Tops 1/4**, **Bottoms 1/6**, **Outerwear 2/2**, **Accessories 0/13**. The subset is tiny and selection-biased; extrapolated population class accuracy and 10/10 recognition are explicitly **NOT ESTABLISHED**.

### Evidence-supported engineering disposition

**DO NOT promote unrestricted all-class splitting.** `public/outfit-instance-review-840.mjs` now takes explicit `{splitNonFootwear:true}` **only in the research runner**, while the frozen native `public/outfit-worker.mjs` continues to invoke its default conservative path. Under the default P88 opt-in trial, footwear components can be proposed separately for physical-unit owner review. **Two or more disconnected same-class NONshoe islands stay in one exact source-conserving unsaved group marked `native_semantic_group_unresolved_fragments`**; they cannot silently save as one owned garment or two unsupported garment copies. The owner can photograph a single garment separately. Neither P88 mode automatically admits wardrobe inventory. The existing cropped-photo original-JPEG and owner-draft SHA/owner/session protections remain enforced.

The unrestricted nonshoe algorithm is preserved for reproducible research, with synthetically source-conserved tests explicitly selecting that research option. Tests also verify that default unsafe nonshoe grouping does not create owned physical-unit proposals and every accepted mask pixel occurs once. Legacy P840 shoe grouping behavior, P82 original worker, model bytes, authentication, clouds, private owner photos and production/staging files remain unchanged. Diff scope is the original seven allowlisted files **plus four isolated research-only manifest/evaluation scripts (11 files total)**.

**Reproduction (no private credentials):** run `python research/mission1-parallel88/recover-public-validation-88.py` to recover frozen, properly licensed original sources, install pinned `@huggingface/transformers@3.8.1`, `numpy==2.2.6`, `pycocotools==2.0.10`, then `node --expose-gc research/mission1-parallel88/run-public-validation-88.mjs` and `python research/mission1-parallel88/score-public-validation-88.py`. The dedicated no-deploy GitHub CI job runs these reproducibly and uploads only aggregate per-photo analysis JSON (artifact **expires after 14 days**, GitHub run #43632277038). Never commit source JPEGs or unmasked images. Re-evaluating on this exposed validation set does not restore blindness.

**Next missing acceptance evidence:** independently collected source-disjoint genuine owner-phone photographs with per-instance human category, **fine subtype, and color labels**, including T-shirt/sweatshirt, blouse/tunic, dresses, sneakers/boots, multigarment and ambiguous footwear, plus human-verified no-silent-wrong-saves; two authorized real account RLS/cloud save/restore; physical Android Chrome and iPhone Safari endurance; WebKit pretrained runtime #1169; native master #1054 integration and 2D fallback. Until these exist, **PR #1175 remains DRAFT/UNMERGED/UNDEPLOYED; FAMILY ALPHA HOLD #255 OPEN.**

## P88 CONTINUATION — EXPOSED HUMAN ACCESSORY ONTOLOGY AND OWNER COMPLETENESS HANDOFF

**Actual source-verified issue:** The 16-photograph, 53-human-instance, already-exposed public validation study in [actual model CI #43632277038](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43632277038) found **0/13 accessory instances** correctly matched at IoU ≥0.50, despite two accessory mask proposals. Lowering a threshold or splitting more islands does not address unsupported classes. Before this continuation the opt-in capture's completion text could describe `N individual clothing photos cropped`, potentially implying complete physical wardrobe inventory. Its `outfitSplitStatus` is inside the Add clothes/scan view, but a successful capture navigates to the separate Review screen and the warning would be hidden unless repeated there.

**Exact frozen human-subtype audit:** `research/mission1-parallel88/recover-public-validation-88.py --audit-accessory-ontology` reopens the SHA-verified frozen P68 public manifest `b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd` and asserts the source-bound classifier's five dedicated accessory SegFormer labels remain Hat(1), Sunglasses(3), Belt(8), Bag(16), Scarf(17). Of the 13 official human accessory instances in that cohort:
- **5 lack a direct SegFormer output class:** 3 headbands/head coverings/hair accessories and 2 watches.
- **1 has only a partial proxy:** Fashionpedia "glasses" is broader than the SegFormer "Sunglasses" class.
- **7 have directly named region classes:** 4 belts, 2 bags/wallets, 1 hat. Even those seven had no successful category-compatible human mask matches on this cohort.
- These are static annotated **ontology coverage counts**, not independently measured category classification accuracy, not human fine subtype/color truth, and not evidence about new unseen family clothing photographs.

**Specific geometric/category ambiguity in prior 27/53 measured cohort:** Four one-to-one class-agnostic true mask overlaps failed the human category-compatibility check: fashionpedia-val-15851 Dress aligned with a broad Upper garment (IoU .527); val-13339 and val-13049 Bottoms aligned with Dress (.671 and .513); val-16820 Dress aligned with Bottoms (.682). This is consistent with a need for owner correction and hard subtype uncertainty; it does not justify silently relabeling existing model outputs. The same corpus remains **P68 already exposed public validation**, pretrained model overlap unknown; there is no blind accuracy claim.

**Engineering change, opt-in only:** `public/outfit-capture.js` now renders P88 finished-scan outcomes as `N tentative clothing regions`, **not a verified garment count**, and instructs the owner to compare these regions against the source image; watches, belts, headwear, bags, glasses, some tops and bottoms can be missed. The explicit next action is to photograph missed items **individually**, then confirm true category, fine subtype and color. The reminder also appears in `outfitSaveStatus` on the **actual Review screen**, because `finishOutfitSplit()` can switch away from Add clothes when drafts are available. An empty scan shows a matching explicit "no confidently separated regions" notice instead of claiming the owner's outfit contains no items. No model confidence, original JPEG, mask, worker, pairing, category, auto-save, 2D fallback, account, cloud or default no-flag capture behavior was modified.

**Reproducible safety tests:** 3 new source-executed VM cases cover partial photo -> owner drafts remain unsaved and visible Review reminder; zero-piece capture -> not mistaken for complete empty inventory; no trial flag -> old completion behavior and no new text. A fourth check proves the Review notice survives navigation and no-flag mode remains unchanged. Static frozen taxonomy audit checks 13/13 annotated accessory identities with 5 no-direct classes and no inference/privacy side effects.

**Exact verified executable commit:** `d7ceddd533e8aff922fa5b98e3aad4f69057c3ec` — [Actions #43633621344](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43633621344) **COMPLETED SUCCESS: 2/2 jobs**, **54/54** focused native source-executed tests, **33/33** adverse release-policy tests, **697/697** inherited native Node tests (0 fails/skips), both app/no-account builds and six each desktop Chromium/WebKit original JPEG custody, owner two-model and physical-shoe-unit browser policy profiles at 320/390/430 CSS widths. The expensive genuine-source runner was intentionally SKIPPED on this non-research code push; its previous immutable four-way measured run remains #43632277038. The report-only final HEAD must receive independent no-deploy verification.

**Concrete next engineering handoff to original recognition teams:** #67 model alternatives (#892) should investigate a separate small-accessory instance detector for watches/headwear and improve named Belt/Bag/Hat positive matching using **new independent source-disjoint human labels**, not overfit this 16-photo exposed cohort. #80 fine-subtype ambiguity and owner confirmation remain responsible for T-shirt vs sweatshirt and sneakers vs boots. In P88 a documented owner workflow is **mitigation**, not a new automatic-recognition score or a completed family trial. **Family Alpha HOLD #255 remains OPEN; PR #1175 DRAFT/UNMERGED/UNDEPLOYED.**

## P88 CONTINUATION — AUTHORIZE PHYSICAL GARMENT DECISIONS BY EXACT SIGNED SESSION AND SOURCE

**Source-confirmed P70 race in the opt-in native owner review:** Prior `updateUnit70()` awaited the dynamic import of `outfit-unit-reconciliation-70.mjs`, **then** read `window.closetAuth.user.id`. A previously rendered Review button did not retain the exact owner user-object reference or original outfit source. Thus a replaced signed-in user/session could potentially reuse an older pairing, keep-separate, discard or unpair action if the textual owner ID still agreed, or if an imported review module returned after the source/owner changed. A regular `persistDraft()` also snapshots a draft and queues an IDB write **after** `window.closetCloud?.beforeWrite(db)` can yield, so guarding before calling persistence alone cannot guard the eventual write. This defect is independent of SegFormer detection precision, the frozen worker, and P70's correct source/mask matching contracts.

**Opt-in conservative engineering fix (`public/outfit-capture.js` only):**
- `unit70OwnerLease88()` captures **the exact signed `window.closetAuth.user` object**, owner ID and original `outfitActiveId` source at the time the panel/action is created. `sameUnit70OwnerLease88()` compares object identity, ID and source; string ID alone is insufficient.
- `renderUnit70Panel()` refuses to display source-bound drafts when a receipt in that original source names another owner. A delayed dynamic module import cannot paint an earlier owner's image or attach active callbacks to a replacement session; every rendered callback closes over the actual panel lease. On a same-ID replacement or source switch, those callbacks cannot mutate a draft.
- `updateUnit70()` checks the lease **before and after** the async import, validates **every selected draft's source ID and receipt owner**, and rejects an unrecognized decision. Pair/combine/keep continue to use the original P70 source/mask/status validation, and discard is restricted to currently **unresolved, unsaved** detections. Old discard buttons cannot delete an owner-confirmed physical garment later.
- `persistUnit70Decision88()` snapshots the exact local draft, retains the database handle, and checks both the exact lease **and database identity inside** `queued()`, **after** its `closetCloud.beforeWrite(db)` await and immediately before the IDB `state` transaction is created. A revoked queued decision cannot commit its prior-session snapshot. If a queued write fails/revokes before committing, the old in-memory decision is rolled back only if the `batch` is still the very same local decision array, never overwriting a newer session's replacement draft. Unmodified `persistDraft()` stays in place for all unrelated app flows.
- A session revoked **after** an IDB transaction has already started cannot necessarily be rolled back by this gate. This is **not** a full two-account hosted Supabase/RLS/cloud privacy certification or test; those still require authorized genuine-account acceptance. No automatic model-to-closet save authority was added.

**Source-executed adversarial tests (`tests/mission1-parallel88-owner-mask-lease.test.mjs`):** Nine new Node/VM scenarios cover (1) valid exact-owner original source keep decision, IDB snapshot and render; (2) replaced same-ID owner while the P70 import is awaiting; (3) stale rendered callbacks after a replaced same-ID sign-in; (4) callbacks after changing original outfit; (5) delayed render never painting prior owner garment photos; (6) owner change **inside** a queued cloud-beforeWrite pause, with **zero transaction writes** and local rollback; (7) selected item with different source/receipt owner rejected; (8) foreign-owner receipt in an active source never displayed on the signed owner's panel; (9) a stale discard button after later keep-separate owner confirmation cannot erase the confirmed draft. These are deterministic source-executed synthetic local security regression checks, **not** owner cloud/RLS/browser physical-device tests.

**Latest tested source commit:** `a5af4a54b7cc54499d27551ba7557d96e8cfe2d7`, [no-deploy Actions #43635143992](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43635143992). The targeted source/release job confirmed **63/63 focused tests** and **33/33 negative release gates** (0 failed/skipped). Full inherited Node builds and desktop Chromium/WebKit job were still in progress at report authoring; inspect exact SHA's finished run before claiming whole-tree passing. The subsequent report-only HEAD also requires its own clean executed-job verification. The expensive 16-public-photo model runner is intentionally skipped on nonresearch pushes: the original [real P68-exposed four-way source/Iou run #43632277038](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43632277038) remains the sole measured model comparison, not a new accuracy lift.

**Release disposition:** P88 remains 11-path isolated DRAFT, no original worker/model change, original JPEG unchanged, no staging/production/hosted Supabase/private account access. Prospective 200-photo independent subtype/color labels, human owner no-silent-wrong-saves, real physical iOS/Android, two authorized actual cloud owner accounts, WebKit pretrained memory stability and M34 source integration remain BLOCKED. **FAMILY ALPHA HOLD #255 OPEN.**


## P88 CONTINUATION — ATOMIC OWNER-AUTHORIZED UNPAIR WITHOUT PRE-COMMIT SIDE EFFECTS

**Root cause in previous opt-in P70 "Separate regions again":** `updateUnit70('unpair')` previously invoked the generic `candidate(extra.image,...)` **before** the owner-bound `persistUnit70Decision88()` awaited cloud-beforeWrite and durably committed. Generic `candidate()` immediately appends an unsaved image, calls the unrelated `persistDraft()` (its own queued IndexedDB transaction), registers session UI counters, and starts `queueAutomatic()` recognition. The unpair handler then rewrote the original paired item and attempted its separately leased transaction. If the exact owner changed, cloud preflight failed, or unpair write later rejected, the extra unsaved companion / background recognition and generic queued snapshot could survive or cross a stale account boundary. A benign owner-approved unpair could also write **twice**, violating one physical decision → one atomic source draft update. This gap was outside the earlier exact-owner identity checks and is source-confirmed by the inherited native `candidate()` implementation.

**Fix in `public/outfit-capture.js` (the only consumer source changed this continuation):**
- New pure **`detachedUnit70Companion88()`** validates the same signed source photo ID, original and companion owner IDs, canonical source and distinct mask SHA receipts, JPEG-formatted companion payload and absence of an exact image duplicate in the owner's live drafts or saved items. It constructs a new in-memory draft through the original `normalizeClothing` defaults with `requiresOwnershipConfirmation:true`, the original JPEG, source-bound `segmentHint`, `recognitionPhoto`, `cropBounds` and **`reconciliation70Status:'separate_confirmed'`**, without calling generic `candidate`, the scanner, automatic queue or any asynchronous persistence.
- The original paired item's `unpairComponents70()` result and the restored second source region are staged **in one new `batch` array**. They are committed by the already owner-lease- and DB-bound `persistUnit70Decision88()` **as one IndexedDB `state` snapshot**, after the asynchronous cloud.beforeWrite check; no unrelated unleased generic draft write occurs. If authorization is revoked or the queued write rejects, the previous paired batch is restored only when the draft still equals this operation's own staged array.
- **After** successful durable completion and a final exact owner/source session check, the new companion receives the normal captured-ID / session counters and automatic recognition queue. Previously paired and unpaired photos remain unsaved for review and never become automatically admitted wardrobe items. Generic single-photo capture, native worker and model binaries are untouched.
- Exact original source SHA was independently verified by P88's existing page-side digest at initial P70 scan; unpair checks only stored source/mask receipts and signature **shape/equality**. The worker-issued mask SHA is **NOT independently recomputed** from raw model mask pixels; no unearned attestation claim.

**Deterministic source-executed VM tests (`tests/mission1-parallel88-owner-mask-lease.test.mjs`)** now cover: (1) genuine P70 owner-confirmed pair→unpair success with both halves in **exactly one additional** stored draft snapshot, and recognition only after verifying the companion is already durably persisted; (2) replaced same-ID signed session during queued cloud-beforeWrite leading to zero additional IDB writes, zero scans/UI counters and original pair rollback; (3) cloud preflight failure with no leaked secondary draft; (4) rejection of companion owner mismatch, repeated mask receipt and exact original image duplicate. `candidate()` in the VM is a throwing sentinel to prove no generic unleased save pathway is used. No private account, Supabase, or real phone testing is implied.

**Executable source commit:** `e3e18ba2ef4d12ca5839c2f3fc55347b0227a8b4`, [no-deploy GitHub Actions #43636456539](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43636456539). Source/release checks completed **67/67 focused synthetic tests and 33/33 adverse release gates** with 0 fail/skip. The full Node/browser jobs were not yet finished when this section was first authored; check their exact SHA status rather than relying on earlier successful runs. A report-only commit will require independent exact-head no-deploy source/native/browser confirmation. The genuine 16-photo public Fashionpedia P68-exposed SegFormer IoU results remain tied to previous [CI #43632277038](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43632277038), **not** this safety-only code.

**Remaining acceptance:** two actual signed hosted owner cloud/RLS accounts with authorized backup/restore, physical Android Chrome and iPhone Safari continuous inference/garment capture, prospective independent human photos with true subtype/color and wrong-save rate, raw mask SHA rederivation, M34 integrated source-to-closet, and WebKit pretrained endurance are still **BLOCKED/NOT VERIFIED**. Family Alpha HOLD #255 remains OPEN. Draft PR #1175 stays unmerged/undeployed; no production, staging, private photos or hosted Supabase changes.


## P88 CONTINUATION — SERIALIZE SAME-OWNER PHYSICAL GARMENT ACTIONS

**Source-confirmed overlapping owner click race:** `updateUnit70()` already guarded the exact signed user object, original photo source, queued cloud-beforeWrite and IDB handle, but **two same-owner decisions were allowed to overlap**. A first physical-unit decision could be waiting on the asynchronous owner-bound draft write while a second click independently changed `batch`, took a second whole-draft snapshot and queued its own write. A first failed operation's conditional rollback could leave the later operation's snapshot containing a logically failed decision; a quick pair→unpair sequence could also compute the next mutation against the **uncommitted** first action. The individual P70 source/receipt checks do not by themselves provide per-owner decision ordering.

**Experimental native fix:** `public/outfit-capture.js` now routes only opt-in `outfitUnits70=1` review actions through a shared `unit70DecisionTail88` Promise sequence. Every `pair`, `combine`, `keep`, `discard`, and `unpair` is evaluated **after the preceding decision has committed or rolled back**; a rejection does not poison the queue. The exact clicked list of region IDs is shallow-copied immediately at button interaction, before any asynchronous wait, to prevent a changed checkbox collection from silently applying to a different item. Each later action still must revalidate the original exact signed user object + ID, `outfitSourceId`, every selected owner receipt, physical unit status and (at queued IDB) original database handle. The previously implemented atomic unpair companion creation after successful committed draft persistence remains intact. Default unflagged single-photo capture is unchanged.

**Five new source-executed Node/VM regression cases** prove: (1) rapid two-region `keep` decisions produce exactly two ordered, correct whole-draft persisted snapshots instead of overlapping commits; (2) rapid `pair` then `unpair` commits the single pair first, both restored halves second, and runs second-half recognition only after the relevant draft is durable; (3) failed cloud preflight rolls back the first decision **before** a queued second decision calculates its successful snapshot; (4) mutable ID selection is frozen before the delayed P70 dynamic import resolves; (5) a duplicate click against a subsequently confirmed item does not produce a duplicate write or automatic admission. These tests are local source-executed synthetic transaction simulations, not hosted 2-account cloud or real-device tests.

**Verifiable code SHA:** `647cd9e003d3540924024f1f87102af7dd2c203a`, [no-deploy CI #43637485074](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43637485074). The targeted source/negative gate passed **72/72** focused tests plus **33/33** release-evidence negatives with zero failure/skip; the full inherited Node and desktop Chromium/WebKit job was still running at initial report authoring and must be checked against its exact SHA. This report-only commit triggers a separate final-HEAD CI; its run cannot be assumed green until verified.

**Scope/remaining gates:** Exactly the original eleven isolated allowlisted changed paths; no edits to frozen P82 `public/outfit-worker.mjs`, recognition models, authentication service, private owner photos, hosted Supabase, production or staging. The actual 16-public-photo / 53-human annotated Fashionpedia exposed model IoU result is unchanged and only proven by earlier [real model run #43632277038](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43632277038). Raw mask pixel independent SHA remains unverified. Real authorized 2-account hosted RLS/backup/cloud, prospective human fine subtype/color and no-silent-wrong-save, WebKit pretrained endurance, physical Android/iPhone and integrated master source→private wardrobe acceptance remain blocked. **PR #1175 DRAFT / UNMERGED / UNDEPLOYED. FAMILY ALPHA HOLD #255 OPEN.**


## P88 CONTINUATION — FENCE BACKGROUND RECOGNITION DRAFT BACKUPS DURING OWNER REVIEW

**Source-confirmed background scanner race:** The inherited `public/app.js` `recognizeItem(item)` scanner runs asynchronously through genuine photo checks and model inference, with an exact original photo/crop/owner-object `live854()` guard. However its `finally` block previously called the generic `persistDraft()` **even if the scanner's source item had been replaced by a signed owner's physical-unit `pair` / `keep` / `unpair` decision**. That generic routine takes a snapshot of the entire mutable `batch` and enqueues a separate IndexedDB write. If recognition finished **while P70 owner review was still waiting for cloud.beforeWrite**, its scanner backup could independently persist the owner decision's staged in-memory draft **before the authorized owner transaction committed**, or append a stale whole-batch snapshot that later overwrote the owner-confirmed grouping. The ordinary P854 owner/source-item guard prevented model inference from applying to a stale item, but did not prevent this final generic backup side effect.

**Narrow opt-in fix (only `outfitUnits70=1` and an original-outfit photo):**
- `public/outfit-capture.js` tracks only pending physical unit decisions with `unit70Pending88`, incremented at click time and decremented after each existing serialized owner's decision settles **whether successful or rejected**. The existing `unit70DecisionTail88` Promise completes only once all earlier physical-unit decisions have committed or rolled back; no new status or owner data is persisted.
- `public/app.js` `recognizeItem()` scanner `finally` detects a P70 in-flight decision before its draft cleanup and **awaits the already queued owner decision tail without itself enqueuing any database write**. This avoids the generic `persistDraft()` racing with cloud.beforeWrite. Once the tail settles, it reuses P854's exact owner object + IDB connection + photo/crop/mask + draft-object identity `live854()` guard. If the signed owner has replaced the scanned garment with a new owner-confirmed draft object, the scanner **does not enqueue another backup**; the authorized owner transaction has already persisted that object. A different unaffected live garment may finalize and enqueue an updated **post-decision** snapshot, preserving both the confirmed grouping and its own recognition results. A replaced same-ID account cannot cause a stale scanner write.
- Normal unflagged standalone-photo recognition takes the original `persistDraft()` path; P70 feature is **off by default**. Exact owner recognition and owner-confirmed physical unit/crop admission still require full human approval. The original `public/outfit-worker.mjs` and pinned model binaries are unchanged.

**Four new source-executed Node/VM tests** run the **actual `recognizeItem()` source** against the **actual P70 decision-controller source** (not a mock of the scanner), with a suspended photo-check Promise and a separate suspended owner cloud-beforeWrite transaction. They verify: (1) a selected/owner-confirmed region replaced while its scanner waits cannot save a staged review snapshot or a later stale shadow write; (2) an unaffected garment's scanner waits for the actual owner transaction, then persists the up-to-date grouping and model review outcome with no automatic closet admission; (3) same-ID signed owner replacement while both asynchronous flows are pending writes neither the owner's stale draft nor the scanner's backup; (4) ordinary non-outfit scanner cleanup persists normally with the experimental flag off. These tests are **deterministic synthetic JS, not pretrained inference or physical mobile/cloud account acceptance**.

**Executable evidence:** `4898b77974b1ab06007fd314ecb956c1c7f9cc37`, [no-deploy Actions #43638650178](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43638650178). The source-policy job verified **76/76** focused source-executed tests and **33/33** negative release gates (0 failures/skips). The inherited full Node/browser job was pending when first recorded; verify it against the exact SHA before claiming the whole repository is green. The subsequent report-only SHA needs its own exact-head CI confirmation. Prior four-way true licensed public SegFormer research remains [P68-exposed 16-photo / 53 human masks #43632277038](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43632277038) — **NOT** a new prospective model/subtype/color accuracy result.

**Scope and release disposition:** Still exactly 11 source/test/research/workflow allowlisted paths relative to immutable P886 donor `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c`, with original native worker, auth, model source, Supabase, production, staging and owner JPEG custody unmodified. No physical Android/iOS, authorized private two-account hosted RLS/cloud restore, browser-independent raw selected-mask SHA recalculation, sustained real WASM/WebKit repeated-photo endurance, or independently double-labeled source-disjoint owner test cohort is verified. Master #1054, assignment #1172 and **Family Alpha HOLD #255 OPEN**; PR #1175 remains DRAFT and UNMERGED/UNDEPLOYED.


## P88 CONTINUATION — EXACT OWNER/SOURCE-BOUND PRIVATE SAVE AND DESKTOP SOURCE-CRYPTO VERIFICATION

**Implementation and strict evidence:** executable+browser fixture exact commit `ea510c5c47d8757aa1647e6022e32a2dfa4d6cf9`. [NO-DEPLOY GitHub Actions #43647989015](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43647989015) **COMPLETED SUCCESS** for **both executed jobs (2/2)**; genuine public model research job **SKIPPED intentionally**. Independent camera/indexing [#43647989027](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43647989027) **SUCCESS**. Full **725/725 inherited Node PASS**, zero failed/skipped; **33/33** negative release-evidence tests PASS; app/no-account builds PASS. Desktop Chromium+WebKit at widths 320/390/430: original JPEG custody/reload **6/6**, two-model review consent/owner controls **6/6**, and original native shoe-pair source-to-owner-editor single physical-unit browser profiles **6/6** with zero page errors. These are desktop mobile-CSS tests, **not physical device acceptance**.

**Source-confirmed gap and fix:** In native `public/app.js`, an explicitly owner-adjusted segmented garment previously used generic `savePiece()` after asynchronous owner review/consent/candidate checks, without an exact signed user-object and IndexedDB handle recheck **inside the queued post-cloud-preflight transaction**, or a fresh independently recomputed SHA-256 over the captured original JPEG immediately before enqueue. A replaced same-ID signed session, mutated source/mask receipt, or switched owner DB could cross that asynchronous boundary. The opt-in **P70 source-bound** Review now snapshots the exact signed user object/ID, original source photo and mask digest values, original/review cropped JPEGs, pending garment object, physical pair state, sourceId and owner DB. It independently recalculates SHA-256 from the original JPEG bytes. After `cloud.beforeWrite()`, it checks exact original/source/mask/owner/DB leases again, validates owner-approved physical-unit category, and writes `items` and `state` in one IndexedDB transaction. No extra generic draft-backup transaction runs on this source-bound success path. The legacy non-P70 save path and its P849 candidate/owner guard are retained; pinned P82 `public/outfit-worker.mjs`, model bytes, private data and production/cloud configurations are unchanged.

**Tests:** Six additional source-executed synthetic Node cases: SHA-verified single atomic owner source save, replaced same-ID signed owner while JPEG digest is pending, switched database after cloud preflight, source JPEG or mask receipt changed before save, owner-approved footwear paired category accepted, and forged paired category denied with zero writes. The inherited desktop `scripts/test-m1-owner-pair-admission-846.mjs` fixture was made consistent with the strengthened contract (byte-derived fixture original JPEG SHA, owner-bound fake IDB transaction and preserved one-physical-pair semantics). Its insecure `about:blank` origin initially lacked Web Crypto and was changed to use the existing **loopback secure-context `server82`**, asserting `crypto.subtle` is genuinely present on each browser. No bypass/polyfill of production SHA checks. Intermediate red runs were diagnosed and **not** used as passing evidence.

**Changed-file scope:** **12 allowlisted paths** relative to immutable P886 base `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c` (original 11 P88 paths plus synthetic desktop browser test `scripts/test-m1-owner-pair-admission-846.mjs`). The no-deploy workflow explicitly validates this new 12-path scope and bans model/worker/cloud/source-corpus edits. This section supersedes earlier 11-path counts for the current P88 head; historical original receipts remain recorded as such.

**Critical limitations:** The 16 previously exposed public Fashionpedia originals / 53 existing human instance masks, 27/53 IoU correct instance matches (safe proposal), 40 predictions and 13 false positives are historical `#43632277038` evidence **not rerun or improved by this source-save fix**. No prospective novel source-disjoint independently double-human-labeled fine subtype/color/owner no-wrong-save cohort, no new real-model performance benchmark, no browser-independent raw selected-mask hash re-derivation, no physical Android Chrome or iPhone Safari, no authorized hosted two-account JWT/RLS/backup recovery, and no integrated main #1054 source→private closet acceptance. Main M36 donor `b3c6b8a9d8e45bf4e57e6912db5a88282e34a288` and this P88 source differ substantially: GitHub compare returns **diverged, 511 ahead / 2058 behind** with merge base `39deed987afe2e5668d64e145835ad43ad14c7be`; do not cherry-pick or merge wholesale. Preserve original JPEG/2D fallback, owner explicit confirmation and **FAMILY ALPHA HOLD #255 OPEN**, NO MERGE/DEPLOY/PRIVATE DATA.


## P88 CONTINUATION — NESTED PHYSICAL-UNIT REVISION AND LIVE PRIVATE-DRAFT PRESERVATION

**Verified exact executable/source HEAD:** `68b6d6bedc0f47828011c56ba5ec6ccb526f24ab`. [NO-DEPLOY GitHub Actions #43649136941](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43649136941) **COMPLETED SUCCESS 2/2 executed jobs**, **85/85** focused source-executed instance/owner/physical-unit tests, **33/33** negative release-evidence tests, **728/728** complete inherited Node (zero failures/skips), native/no-account builds, Chromium/WebKit 320/390/430 CSS original-JPEG custody, two-model owner review and physical shoe-pair acceptance **6/6 each**, zero browser page errors. Independent [camera/indexing #43649136961](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43649136961) **COMPLETED SUCCESS**. Expensive genuine pretrained public validation job **SKIPPED as designed** on owner-save code; not counted as new model accuracy evidence.

**Three real source-workflow risks addressed** in the already owner-bound *opt-in P70 source-to-closet* transaction:
1. **In-place paired-companion mutation:** the previous source-save lease pinned the shoePair/combinedFragments70 object *identity*, not its embedded companion source JPEG or mask receipt values. A pending in-place mutation (e.g. changing the companion mask SHA while retaining the same object) could pass that check. New `sourceGroupRevision88()` snapshots the entire nested confirmed physical-unit object in a stable review revision string and revalidates the live draft and owner-approved save value before the queued write. Cyclic/unserializable group evidence fails closed. No raw selected-mask pixel digest is fabricated; that independent mask attestation remains unverified.
2. **Late duplicate during queued cloud preflight:** the review screen's earlier duplicate guard might become stale by the time `cloud.beforeWrite()` finishes. Now the actual native `duplicateUnit70InCloset(value,items)` runs again immediately before the owner-bound `items+state` transaction. This checks the live owner-loaded in-memory closet; it does **NOT** prove cross-tab or hosted cloud serializable uniqueness.
3. **Unrelated draft erased by stale snapshot:** the older adapter passed `batch.filter(...)` into the queue *before* asynchronous cloud preflight. A different garment captured during that wait could disappear when the stale batch snapshot overwrote `state`. The save now recomputes the remaining `batch` **inside** the serialized authorized callback, just before the atomic native write; only the confirmed item is removed. An unrelated live draft is preserved. External tab/cloud conflict resolution remains separately unverified.

Three additional source-executed Node VM scenarios pass: companion mask changed in-place during cloud preflight is refused with **zero writes**; duplicate source mask newly present in the closet is refused with **zero writes**; independent photo draft appended during cloud preflight remains present in the saved draft state after successful confirmation. Harness executes **actual** `sourceGroupRevision88`, `sourceSaveLease88` and original native `duplicateUnit70InCloset` source rather than replacing those with a mock. Earlier intermediate red CI was from incomplete VM source extraction of those helpers and was repaired; only the exact successful SHA above is used as valid evidence.

**Scope/claims:** Still **12** allowlisted changed paths against P886 immutable parent `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c`; only `public/app.js` and `tests/mission1-parallel88-owner-mask-lease.test.mjs` changed in this continuation. No original worker/model asset, auth backend, hosted Supabase, production, staging, original JPEG benchmark sources or private family records touched. Original P68 **exposed** genuine Fashionpedia 16 original JPEGs/53 human masks: P88 safe 27/53 IoU matches, 40 proposed, 13 false positives — **UNCHANGED**, not new model inference or fine subtype/color acceptance. Still **BLOCKED** independent new/source-disjoint double-human-labeled fine subtype/color and zero-wrong-save, physical Android/iPhone, WebKit continuous pretrained endurance, real two-account hosted JWT/RLS/backup and master M1→closet integration. Master #1054 consumes exact contract only, not divergent stacked history. Preserve original-photo 2D fallback, explicit owner decisions and **FAMILY ALPHA HOLD #255 OPEN; DRAFT/UNMERGED/UNDEPLOYED**.


## P88 REAL EXPOSED SOURCE — CATEGORY LOSSES AND FIXED-MATCH CONFIDENCE RETENTION

**Actual evidence, NOT simulated:** Retrieved [GitHub Actions run #43632277038](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43632277038), artifact ID `14128851214` (`p88-exposed-validation-human-instance-metrics`). Original artifact ZIP SHA-256 `b7edeecdfc76fe66b88aaebb3894e97dcb3486f7b0fbc487624156133184c766`; the released `real-validation-measured-88.json` SHA-256 `6eba8dcac54a44bf47a5663055747f2ec1d5b86f12145fc37424002351f79f97`, `real-validation-predictions-88.json` SHA-256 `9c45e5fbc09e5c660c3e6b75f8b7e5c56f619412011eac6f7ec9056ab3bc74b9`. The original public Fashionpedia source-manifest SHA-256 remains `b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd`. These are **16 original public source JPEGs / 53 independently annotated human instances** from **already exposed P68 development/validation**, not a new sealed holdout or pretraining-disjoint sample. The 14-day original artifact is retained by GitHub until November 28, 2026; metrics and this provenance note are durable in this report.

**Correct broad-category matches (safe P88 shoe-only connected components, actual source IoU ≥ 0.50 and one-to-one category compatibility):**

| Human garment category | Correctly matched / independently human-labeled | Source-cohort recall |
|:--|--:|--:|
| Tops | 1 / 4 | 25% |
| Outerwear | 2 / 2 | 100% (tiny N; not generalizable) |
| Bottoms | 1 / 6 | 16.7% |
| Dresses | 9 / 12 | 75% |
| Shoes | 10 / 16 | 62.5% |
| Accessories | 0 / 13 | 0% |
| **Total** | **23 / 53** | **43.4%** |

The safe method produced 40 proposals, with 23 category-compatible human-instance matches, 17 unmatched/incompatible proposals (fixed original matching protocol); **57.5% category-compatible precision at the prior exact IoU protocol**. Class-agnostic matching is a distinct, weaker criterion: 27/53 matched and 13 unmatched proposals. This is not fine subtype, color, whole-owner-flow correctness or automatic-save acceptance. The accessory audit also shows five of the 13 annotated human accessories lack a dedicated or partial SegFormer class (ontology gap); the 0/13 measured result is a genuine broader category failure, not a release-success signal.

**Observational fixed-match confidence retention:** Compare frozen `p88Safe` mask mean confidences in `real-validation-predictions-88.json` to the **preexisting** one-to-one category-compatible match indices in `real-validation-measured-88.json`. Do **not** re-match masks after filtering and do **not** call this calibrated precision/recall; removing proposals can change the globally optimal matching. Numerators below are **retained previously established correct matches**, an intentionally conservative, precisely named diagnostic.

| Mean region confidence retained | Retained proposed regions | Retained prior category-compatible matches | Unmatched under frozen original assignment |
|:--|--:|--:|--:|
| ≥ 0.80 | 40 | 23 | 17 |
| ≥ 0.85 | 33 | 23 | 10 |
| ≥ 0.90 | 24 | 20 | 4 |
| ≥ 0.95 | 11 | 10 | 1 |

Even at 0.90, **four of 24** retained proposals had no originally valid category-compatible instance match, while only **20 of 53** independent human garment instances retained such a match; 0.95 retains only **10 of 53**. **No cutoff is validated for confident garment auto-admission; the source-bound owner review / manual Adjust / Unknown and no-silent-save remain mandatory.** A score above 0.9 cannot distinguish sneaker vs boot, T-shirt vs sweatshirt, or primary color without independently verified subtype/color truth. No model-accuracy improvement is claimed.

**Reproducibility and safeguards:** `score-public-validation-88.py` now includes `retained_fixed_match_diagnostic()` and preserves original numeric region confidences when scoring *genuine* model masks; future actual SegFormer public-source runs emit the retention matrix and mark `notRematchedIoU: true`, `notNovelCalibration: true`, `noAutoSaveAuthority: true`. The no-deploy source workflow source-executes this Python function on fixed illustrative data (three thresholds; rejects NaN, duplicate indices and damaged counts). A new **actual licensed-source** P68-exposed model run was requested at commit `2648c21c68234cc81c1f30a9f387f92500ed62b0` with the research trigger; its CI result must be checked separately and is not grandfathered from prior successes. Neither native production recognition thresholds nor pinned worker or model binaries changed.

**Remaining release-gate gap:** This cohort lacks independent *fine subtype* and *primary color* truth. It cannot certify 10/10 no wrong saves, signed hosted two-owner cloud, source-disjoint blind physical-device acceptance, or master M1→closet integration. Collect a genuinely novel licensed source/photographer-disjoint cohort with human double annotations for those exact attributes and seal it before any candidate threshold fitting. Preserve P886 physical 23-case requirements and **FAMILY ALPHA HOLD #255 OPEN**, draft/no merge/no deploy.


## P88 CONTINUATION — PHYSICAL-UNIT CLOUD PREFLIGHT RACE AND REAL CATEGORY ERROR ATLAS

**Current draft branch code checkpoint:** `daabf66a0a543980d5f7f6f987d151a51df6c65f` contains the P70 physical-unit draft race change, three source-executed race scenarios, correction of a cross-JavaScript-realm assertion and a new research-only source-category error atlas. `a142b9e6cd57d0aabb4ada35830a244b5bb67c07` adds actual-source-executed negative tests for the category audit. **CI for these new commits was QUEUED when inspected; NO exact-head green claim should be made without checking both no-deploy and camera/indexing jobs.** Last fully green source/owner code checkpoint before this change: `d0d58225788cb24a5acf5561d95da8e4c094b4f7`, [Actions #43658091800](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43658091800). Review the pending [no-deploy exact-head Actions](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43659074056) and [camera/indexing](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43659074058) before calling this continuation passed.

### Actual same-cohort SegFormer rerun independently observed

[Real licensed/public inference run #43658014967](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43658014967) completed SUCCESS on the **same previously exposed 16 original public Fashionpedia JPEGs**, all source SHA-locked, with **53 original independent public human mask instances**. Downloaded GitHub Actions artifact ID `14138952342`: ZIP SHA-256 `c5d41c7e7ae41112f0864c4d8f7750c1af1da3d4aac785441af9d46589a89b8f`; measured JSON SHA `90999c6c3337297a628a08b87dfda306a2cc434db8ffdeea0cb4f87f81a6feb7`; predictions JSON SHA `15964c08f828e4be3c4b0f6d4450a56e16f4eca86ecf46cea101c588a44c2691`. The new model rerun **reproduced**, rather than improved, the safe P88 **27/53 class-agnostic** and **23/53 category-compatible** mask matching (40 proposed regions, 13 unmatched under class-agnostic, 17 unmatched/incompatible under separately optimized category-aware matching). Frozen P68 original manifest SHA remains `b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd`. No newly sealed/blind set, no independent fine subtype/color truth and no safe-to-save classification.

The actual original class-agnostic one-to-one assignments, audited **without re-matching**, identify **26/53 human garment instances without a sufficient IoU match**: 13 Accessories, 6 Shoes, 3 Tops, 3 Bottoms, 1 Dress. Among the **27** geometrically matched instances, **four** lacked correct broad category support: two human Bottoms predicted as Dresses (photo IDs `fashionpedia-val-13339`, `fashionpedia-val-13049`), one human Dress given Tops/Outerwear support (`fashionpedia-val-15851`), and one Dress predicted as Bottoms (`fashionpedia-val-16820`). The remaining **23/27** class-agnostic assigned predictions do support the human broad category. The separately optimized category-compatible matcher also happens to find 23/53, but these are **different assignment protocols**, not interchangeable evidence. The proposed standalone `source_category_failure_diagnostic()` emits exact masks/match counts and corrupted-receipt vetoes; source evidence and names are research only. 13/40 proposals have no class-agnostic original human IoU match. This is evidence to prioritize **accessory object coverage, missing shoes and bottoms, and dress/bottom confusion**, not proof that any new model is accurate.

### Source-confirmed owner physical-unit draft persistence bug and fix

The opt-in `public/outfit-capture.js` P70 physical-unit decision previously cloned the **entire mutable draft** before asynchronous `queued()` / `cloud.beforeWrite`. If a different source photo entered the draft during that wait, the older owner decision could write a stale `state.draft` snapshot and erase the newly captured item. The code now snapshots the **live post-decision batch inside** the owner-authorized queued callback after cloud preflight; rechecks exact signed owner/session/DB/source and each staged physical-unit's source, mask, status and receipt identity before committing. On a failed owner decision, rollback restores the pre-action physical-unit state while retaining any newly added independent draft IDs, rather than wiping them. Three new native source-executed VM tests check (1) new photo survives successful delayed owner keep, (2) failed preflight rolls back keep but retains newly captured photo with zero durable writes, (3) altered signed mask before the queued write is vetoed with zero writes. Earlier intermediate red camera/indexing run `43658670506` exposed only a cross-realm test-array equality assertion; actual expected statuses matched. The test now normalizes observed VM arrays to ordinary host arrays rather than weakening application authorization.

**Limitations:** This is a scoped owner-bound in-memory + IndexedDB safeguard, **not** cross-tab serializable uniqueness, hosted Supabase JWT/RLS verification, source-independent selected-mask pixel SHA attestation, 2-account owner integration, or a physical Android/iOS test. Both P70 and all-model-reconstruction work remain opt-in/default-off; original photo and 2D fallback stay preserved. P82 source-pinned worker/models, authentication, hosted cloud, production, staging and private family wardrobes were not modified. Family Alpha **#255 OPEN/HOLD**, PR #1175 **DRAFT/UNMERGED/UNDEPLOYED** against immutable P886 source; changed-path allowlist remains exactly 12.


## P88 CONTINUATION — FOREIGN-OWNER QUEUED DRAFT CUSTODY AND NESTED PAIR REVOCATION

**Current implementation/testing checkpoint before this report:** `30bff70dbbdad90685568f2c0910710ec5fb2a09`; its exact-head [no-deploy workflow #43659946799](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43659946799) and separate [camera/indexing workflow #43659946807](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43659946807) were **QUEUED when checked**, so this new code is **NOT YET VERIFIED GREEN**. The previous [`c642511e42023f083ce364bbd732a0dcac07224b` no-deploy workflow #43659178486](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43659178486) is **COMPLETED SUCCESS**; do not grandfather that success onto the new physical-unit changes.

**New code, research-flag-gated P70 only:** The signed owner's `persistUnit70Decision88()` post-`cloud.beforeWrite` snapshot now checks **all** live source-bound draft receipts against the exact current owner ID and validates same-photo source and mask SHA shapes, preventing a different owner's late photo from entering this owner's private IndexedDB write. If that preflight fails, the decision rollback keeps newly captured **same-owner and well-formed** photos, but filters any late foreign-owner or malformed source receipt out of the active Review draft. The same queued snapshot now fingerprints each staged item's **exact JPEG crop, original-photo JPEG and the full nested shoe-pair/combined-fragment companion object**. These are checked again after asynchronous preflight, rejecting in-place altered companion masks/photos or changed original JPEG bytes. Cross-tab/hosted cloud transactional uniqueness is still unproven; this is an in-memory/IndexedDB evidence boundary, not server authentication.

**Additional source-executed test cases** (not classified as genuine photo accuracy): (1) a foreign owner's signed mask introduced while pending cloud preflight produces no owner-A write, no accepted owner action and is purged from rollback Review; (2) a new malformed same-source mask likewise produces no write and is purged; (3) in-place changed confirmed shoe-pair companion mask while a separate owner-confirmed region queues produces no new write; (4) original source photo JPEG mutated while preflight awaits is refused; (5) previously added same-owner late photo preservation still requires a successful queued owner decision and (6) a rejected same-owner decision must roll back only the action, not a valid new photo. Intermediate code commits `ee6ef67a` and `9647640d` had malformed **JavaScript test-string quotes** in newly authored test text (not a native worker/model failure); these were repaired at `593decf6` and `30bff70d`. Only post-repair exact-head no-deploy runs can certify this deliverable.

**Non-claims and isolation:** No model, recognition worker, thresholds, hosted auth/Supabase, production or staging paths changed; the 12-file P886 allowlist remains unchanged. The genuine-source repeat run [#43658014967](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43658014967) remained 27/53 source-agnostic and 23/53 compatible-category mask matches on the **exposed** P68 public development originals. It did not establish new blind independent photo quality, primary color or fine subtype accuracy, real two-account cloud, physical Android/iPhone, or master integrated flow. Keep explicit owner adjustments, original JPEG and 2D fallback. **PR #1175 DRAFT/UNMERGED/UNDEPLOYED; FAMILY ALPHA HOLD #255 OPEN.**


## P88 REAL SEGFORMER PIXEL-GATE SENSITIVITY — PRE-REGISTERED RESEARCH

**Purpose:** Investigate the observed **26/53 human instance misses** on the frozen, previously EXPOSED **16 original public Fashionpedia JPEGs / 53 human polygon masks** from P68. The observed P88 conservative reference was **27/53 class-agnostic mask overlaps and 23/53 broad-category-compatible overlaps**, 40 predictions/13 class-agnostic unmatched proposals. Accessories were **0/13**, with substantial shoe/top/bottom misses. A pixel-confidence gate of 0.70 and class margin 0.15 is used by the original `clothingLabelMap`; whether reducing it improves **complete original-resolution 1:1 human mask IoU ≥0.50** rather than merely fragmenting/flooding the source mask is an open empirical question.

**New isolated study code:** `research/mission1-parallel88/exposed-threshold-probes-88.mjs` reimplements the current 18-class native probability mapping, including SegFormer class 10->9 shoe fusion and existing body/person semantics, independently from the product worker. It **first rechecks exact native label IDs and Float32 confidence for every real logit pixel** under unchanged native parameters (0.70/0.15) and aborts on any mismatch. It then constructs two fixed, preregistered EXPERIMENTAL variants using the exact same original JPEG, pinned fp32 CPU model execution and native original person-detection gate:

| Research-only condition | Pixel confidence | Class margin | Remaining downstream grouping |
|:--|--:|--:|:--|
| Native P88 safe baseline (unchanged) | 0.70 | 0.15 | Original production `clothingMaskGroups` / P88 safe review |
| `researchLoose65` | 0.65 | 0.12 | Same original `clothingMaskGroups`; no auto-save |
| `researchLoose55` | 0.55 | 0.08 | Same original `clothingMaskGroups`; no auto-save |

No additional human labels, private owner photos or other model weights are acquired. The two candidates are measured by the same original-resolution source-proven COCO polygon IoU with independent **one-to-one matching recomputed per variant**, both category-agnostic and category-compatible, **matching count/53**, **number of proposals**, **false positives**, **per-category recall**, and **unmatched detection deltas**. This is genuinely different from the earlier confidence-retention filter, which *did not re-match candidates*. The experiment is permitted to show **zero gain or worse false positives**; it must not be filtered, selected, or described as prospective blind accuracy after viewing the results. Probe post-processing CPU timing is kept separate from existing native inference latency. Model overlap with this public dataset remains unknown.

**Safety and evidence gates:** The only new file is the strictly research-only module and the changed-path CI allowlist was enlarged from 12 to **13 exact research/opt-in files**. Test module `tests/mission1-parallel88-instance-conservation.test.mjs` includes native confidence/label exact-parity, synthetic weak-boundary restoration, no altered logits, nonclothing class exclusion and malformed tensor/research-threshold vetoes. No original `public/outfit-worker.mjs`, `public/outfit-segmentation.mjs`, recognition/ONNX weights, auth/hosted cloud, production/staging, or private family wardrobe code was changed by this experiment. No recognized result may enter the closet without signed owner review and saved-photo safety. **FAMILY ALPHA HOLD #255 OPEN, DRAFT PR #1175 UNMERGED/UNDEPLOYED.**

**Execution status at creation:** Real rerun was requested on exact experiment/timing implementation commit `5c73e224fcfb7c74ae2f3d599dc80b5235fb7ddb`, [real + no-deploy CI #43661104096](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43661104096), **QUEUED** when inspected. The earlier [initial trigger #43661008852](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43661008852) was also queued; **only the latest exact experiment can certify final timing and masks**. This paragraph is a preregistered plan, **not an accuracy result**. The new source/module code is unverified until CI completes. Genuine future broad-category/subtype/color/10-of-10 acceptance still requires **new source/photographer-disjoint originals, dual independent human review, blind holdout, physical iPhone/Android acceptance and signed hosted two-owner M1→closet integration**.


## P88 REAL PIXEL GATE RESULTS — LOOSER THRESHOLDS REJECTED

**Actual genuine licensed/source-proven model experiment:** [GitHub Actions #43661008852](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43661008852) **SUCCESS** (first two fixed thresholds); [exact follow-up model/source job #43661619240](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43661619240) **SUCCESS** (same logits with conservative shoe-component rescue), exact code SHA `28d962d81c9ab9b64f877641f26c3e603add0a72`. Artifact #14140885211, `p88-exposed-validation-human-instance-metrics`, ZIP SHA-256 `7a13c18fdd6d3b6f34a853d9c8318692b009ef2c3822892ed5c6b8ab54e4d38a`. Each variant ran on exactly the same **16 SHA-verified original public Fashionpedia JPEGs / 53 human polygon annotations**, the **previously exposed P68 validation set**. No blinded prospectively double-human-confirmed subtype/color benchmark, no pretraining-disjoint source proof and no release-eligible acceptance has occurred.

### Recomputed original-resolution one-to-one human-source IoU >= 0.50

Each row below uses a separately recomputed original mask assignment for **that variant** (unlike frozen-confidence-retention statistics). Broad-category correctness additionally requires the model region's proposed category support to include the independent original Fashionpedia human category. All 53 human instances are included in every denominator. Higher precision at lower recall is NOT a general garment recognition improvement.

| Exact same fp32 model logits, research-only postprocessor | IoU-agnostic matched / 53 | Correct category / 53 | Model proposals | Unmatched proposals (agnostic) | No compatible-category match among proposals |
|:--|--:|--:|--:|--:|--:|
| Existing native source-preserving P88 safe (0.70 confidence / 0.15 margin, shoe-only review) | **27/53** | **23/53** | **40** | 13 | 17 |
| Relaxed pixel gate 0.65 / 0.12, native semantic union | 19/53 | 15/53 | 30 | 11 | 15 |
| Relaxed pixel gate 0.55 / 0.08, native semantic union | 19/53 | 15/53 | 26 | 7 | 11 |
| Relaxed 0.65 / 0.12 **plus native conservative shoe-component review** | **26/53** | **22/53** | **36** | 10 | 14 |

The loosened raw semantic masks lost **eight correct category matches** relative to P88. Shoes specifically fell from **10/16 correct-category** with P88 safe to **2/16** with both unsplit relaxed variants. Reapplying the original source-preserving shoe-component separation to the 0.65-mask recovered **7 of those 8** shoes (**9/16**) and **seven correct broad-category matches overall**, but remains **one true correct-category match below** P88 safe. Tops remain **1/4**, Bottoms **1/6**, Dresses **9/12**, Outerwear **2/2** (tiny N), Accessories **0/13** across the tested candidates. The 0.65+shoe research variant has fewer unmatched/incorrect proposals than P88 safe (14 vs 17) but lower correct recall (22 vs 23); it is **NOT a proven superior detector** and cannot be deployed or used to raise auto-save coverage.

**Technical interpretation (hypothesis, not proven root cause):** Relaxed pixel masks appear to merge some shoe source regions or lower their accepted-group average confidence; splitting can recover many model-proposed shoe regions without changing pretrained logits. The native threshold and original shoe-specific physical-unit review are more protective in this small exposed source cohort. The true missed-item problem remains **26/53 human instances without an IoU match**, including **13/13 accessories** and six shoes, plus known bottoms-vs-dress category confusion. Improving category coverage will likely require better object-instance evidence and legally valid human-annotated photo diversity, not global pixel threshold loosening.

**Decision / safety:** **REJECT** both global lower thresholds and **DO NOT PROMOTE** the combined shoe rescue as production recognition. All variant code remains strictly under `research/mission1-parallel88/exposed-threshold-probes-88.mjs` and the source-verified model research/score scripts; original `public/outfit-segmentation.mjs`, frozen worker/model assets, owner review/consent, source SHA, 2D fallback, auth and private closet are unchanged by this experiment. `clothingReviewInstances840` and research variants never confer auto-save authority. The CI source/targeted job for [#43661619240](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43661619240) **SUCCESS, 96/96 focused tests and 33/33 release-policy checks**; **full inherited desktop/full Node job was IN PROGRESS when last inspected**, and its final conclusion must be verified independently before claiming exact-head full green. Real-model job completed SUCCESS; masks and measured JSON are available as limited-retention no-image GitHub Actions artifact.

**Required next path:** Stop using the exposed 16 JPEGs to select model threshold winners. Use #75/#79 for rights-verified distinct new sources and two real independent human labelers; evaluate alternative small-object/instance detectors and native source-to-mask/owner-category review against a truly held-out cohort with independent subtype/color truth. Require physical mobile and two-account hosted identity/backup tests before any release. **DRAFT PR #1175, 13 exact allowlisted files, NO MERGE/DEPLOY, Family Alpha HOLD #255 OPEN.**


## P88 SECOND MODEL — PINNED COCO ACCESSORY PROPOSAL COVERAGE

**Preregistered independent-source model-family hypothesis, before measuring actual results:** The previously exposed original 16 Fashionpedia JPEGs / 53 human mask instances contain **13 original human accessories**, of which only **2 are bags/wallets (official category 24)**. The remaining **11** are human-annotated **4 belts, 3 headbands/head coverings, 2 watches, 1 hat, 1 pair glasses**. A standard **COCO 2017** object detector has usable categories for bags (`handbag`, `backpack`, `suitcase`), ties, and umbrellas; it does **NOT** have classes for the dataset's watches, belts, glasses, hats or headbands. Therefore **a COCO-only model can at most target 2/13 accessory instances in this exact cohort** and cannot plausibly solve the 0/13 accessory recognition problem alone. A missed bag must be reported honestly; detections of unrepresented accessory types must **NOT** be invented.

**Model license/source:** [hustvl/yolos-tiny](https://huggingface.co/hustvl/yolos-tiny) is COCO object-detection trained, upstream Apache-2.0. Public ONNX model [Xenova/yolos-tiny](https://huggingface.co/Xenova/yolos-tiny) pinned exact Git revision `e2f9c7673f0fa61849efe2b56a0d7774779ebb9d`, Transformers.js v3 q4 CPU, no paid API, no private owner photos, and NO product import. The ONNX file SHA-256 is not independently verified by our runner; this limitation remains explicit even though the model revision is fixed. A future model-license and immutable-asset proof would be needed for production.

**Pre-registered evaluation:** `research/mission1-parallel88/run-coco-accessory-88.mjs` uses the same SHA-verified 16 official public source JPEGs and exact official human Fashionpedia `bbox` attributes. It scores only COCO-supported accessory proposals with independent source-category exact compatibility using a max-cardinality one-to-one **bounding-box IoU ≥0.50** per photo, with **supported human denominator 2**, unsupported denominator 11, plus false proposals and latency. **Bounding-box overlap is NOT the previously measured segmentation-mask IoU**, and no comparative performance claim may equate the two. Benchmark output is structured public source/boxes/metrics ONLY: no originals uploaded, no owner cloud access, no automatic saves or recognition authority. Existing native segmentation code, worker/models, owner review, 2D fallback and all hosted services remain unchanged.

**Tests / execution condition:** Existing research-only JS module `exposed-threshold-probes-88.mjs` now supplies an independently testable strict COCO-to-Fashionpedia accessory whitelist, fail-closed 1:1 bounding-box IoU (no double-counting one physical bag), and exclusion of unsupported class labels. Existing mission 88 source tests validate the source score. CI's exact path allowlist expands from 13 to **14**, adding only the new research runner. A deliberately triggered real-source Actions job is required for real model evidence; until that job completes SUCCESS, **do not claim any YOLOS detection counts or accuracy**. This public dataset remains P68-exposed, not a novel photographer-disjoint sealed holdout or independent color/subtype truth. The second detector may produce **zero** useful bag detections and may be REJECTED by genuine evidence.

**Remaining conditions to close Mission 1:** Rights-verified NEW originals and an independently sealed, dual-human-reviewed mask/category/subtype/color holdout (not cherry-picked once model results are seen); evaluation of fashion-trained small-object/instance recognition for the other **11/13 accessories**; mobile Android/iOS continuous real-model testing, signed hosted two-owner RLS/backup, original JPEG custody, no-silent-wrong saves, master compatible integration. **Family Alpha HOLD #255 OPEN. Mission #88 PR DRAFT/UNMERGED/UNDEPLOYED.**


## P88 COCO ACCESSORY MODEL — VERIFIED REJECTION

**Actual genuine-source result, NO simulated detection:** The pinned Apache-2.0/COCO-trained YOLOS-tiny model `Xenova/yolos-tiny` / revision `e2f9c7673f0fa61849efe2b56a0d7774779ebb9d`, CPU q4, ran on **all 16 original public Fashionpedia photos** with source JPEG SHA-256 checks and original human bounding boxes. [GitHub Actions real-model run #43663893151](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43663893151) actual public inference job **COMPLETED SUCCESS**; original public metrics/predictions artifact ID `14141112036`, `p88-exposed-validation-human-instance-metrics`, GitHub ZIP SHA-256 `6a2095ae83d1d197e28616ed491c25b60fde60e34aa2094c1cef5f0664108e60`. No originals or model asset files were uploaded to the artifact. Original public source P68 manifest SHA `b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd`; original-image rights receipts were already verified and frozen for this cohort, not independently relicensed in this model run.

### Bounding-box results — one-to-one category-matched IoU >=0.50

| Measurement | Actual observed genuine YOLOS/COCO tiny |
|:--|--:|
| Original public JPEGs measured | 16 |
| All independent Fashionpedia human accessory instances | 13 |
| Human accessory instances expressible in COCO classes (bags) | **2/13** |
| Other accessories omitted by COCO label ontology (watches 2, belts 4, headwear 4, glasses 1) | **11/13** |
| Supported human bag bounding boxes correctly matched | **1/2** |
| Total COCO accessory-class boxes proposed at research cutoff 0.10 | **9** |
| Proposals that could not match any supported human accessory box | **8** |
| Supported-bag bounding-box precision of proposals | **1/9 = 11.1%** |
| Supported-bag bounding-box recall | **1/2 = 50%** |

The matched bag occurred in `fashionpedia-val-18008` (1 supported GT bag, eight proposed accessory-class boxes in that photo); the second human bag in `fashionpedia-val-13339` had one proposed accessory-class box but **no** accepted IoU match. In the other 14 photographs, the COCO accessorized predictions (at cutoff 0.10) were zero. The 8/9 unmatched boxes do not prove every detection is visually fictitious—the official Fashionpedia ground truth may omit other boxes/instances; they are strictly **unmatched against the frozen annotations and category protocol**. This is **bounding-box IoU, not segmentation-mask IoU**, so it must **not** be called a direct accuracy increase relative to the native SegFormer 0/13 mask overlaps. YOLOS has no supported output classes for the other 11 human accesssories.

**Decision: REJECT this COCO detector for consumer accessory recognition**. One correctly matched bag plus eight unmatched detections and an ontology that cannot represent 11 of 13 human accessories is not evidence of safe, strong accessory detection. Do not use it for automatic-save, category/subtype/color assertion, threshold promotion, or production runtime addition. It remains research-only `research/mission1-parallel88/run-coco-accessory-88.mjs` and pure scoring helpers in `research/mission1-parallel88/exposed-threshold-probes-88.mjs`.

**No deploy changes:** Source & release checks on [#43663893151](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43663893151) passed with **98/98 targeted tests and 33/33 release-policy tests**. The full inherited desktop/Node CI was **IN PROGRESS at the time of documenting**; verify its final status separately. The original 16-photo SegFormer mask benchmark in the same run was separately executed and enforced its research-only constraints. No private owner, live app worker, model weights, hosted Supabase/auth, production or staging edits. The PR retains **14 exact scoped paths**, DRAFT/UNMERGED/UNDEPLOYED, **FAMILY ALPHA HOLD #255 OPEN**.

**New priority after this rejection:** Use an appropriately licensed **Fashionpedia-category-capable small-object/instance model** with direct glasses, watch, belt, headwear and bag classes. Demand independent photographer/source-disjoint genuine original photos, separate dual-human mask/category/subtype/color labels, original photo custody, safe mobile inference and no-silent-wrong-save acceptance before any promotion. This historical exposed public cohort alone cannot validate selection, or 10/10 recognition.


## P88 FASHIONPEDIA 46-CLASS ONNX MODEL — PREREGISTERED REAL SOURCE RESEARCH

**Problem confirmed by actual previous model evidence:** native SegFormer accessory mask IoU on the 16 original Fashionpedia P68-exposed photos was 0/13; the separate generic COCO-trained YOLOS-tiny produced only 1/2 correctly box-matched handbags with 8/9 unmatched boxes at score cutoff 0.10 and could not even express 11/13 human-annotated belts/watches/headwear/glasses. This finding requires an **actual fashion-vocabulary detector**, not repeated COCO confidence tuning.

**Research candidate explicitly BEFORE its real run:**
- Public pretrained source [louisJLN/yolo8-fashionpedia](https://huggingface.co/louisJLN/yolo8-fashionpedia), documented **MIT** model metadata, full 46-category Fashionpedia object/part vocabulary and 27 main object classes. Small `results/yolov8n-fashionpedia-1.onnx` is an approximately 12.3-MB **non-Pickle ONNX**; pinned remote research model download `https://huggingface.co/louisJLN/yolo8-fashionpedia/resolve/3d5c557/results/yolov8n-fashionpedia-1.onnx` MUST have exact source-published SHA-256 `6b581af3abe2b4ae97a84cbe9aef5ae37207a68ee966d22b0b8d7969d79e6920` or inference must fail closed. This is a third-party model whose provider's training/validation leakage and per-category performance we have **not independently validated**.
- Frozen human dataset remains **the exact same 16 previously exposed Fashionpedia original public JPEGs / 53 frozen independently annotated original human polygon instances**, 13 accessories in categories IDs 13 (glasses), 14 (hat), 15 (headband/head covering), 18 (watch), 19 (belt), 24 (bag/wallet); 13/13 accessory class labels are now **representable**, unlike COCO 2/13. The model was trained on Fashionpedia; dataset overlap or label leakage into model training is **UNRESOLVED**, so even a high score is NOT blind model-generalization proof.
- Experimental inference uses Node onnxruntime-node CPU, SHA-verified raw original bytes from existing P68 original photo archive; deterministic 640×640 RGB/114-letterbox preprocessing, float32 CHW 0..1, standard NMS per category at bounding-box IoU 0.50, confidence cutoff 0.10 chosen before looking at new YOLO predictions. `research/mission1-parallel88/fashion-onnx-probes-88.mjs` implements 46-channel object output shape checks, 27-main-class whitelist, accessories-only proposals and source-dimension transformation; it forbids shoe, clothing-part/zipper/rivet etc from appearing as independent accessories.
- Primary experimental metric: **original Fashionpedia human bounding-box IoU ≥0.50 with exact original category ID** and maximum-cardinality one-to-one same-photo assignments for all 13 accessory human instances. Report full number of proposals, matched original boxes, unmatched proposed boxes, missed original human accessory annotations, category breakdown, and latency. **This is a BBOX metric**, not the SegFormer original-resolution polygon mask metric; do **not** compare their recall as equivalent. Native owner-reconciliation, source JPEG custody, review, private cloud, product model and app cannot use experimental model outputs without explicit owner action and separate acceptance.
- The new model must not be promoted merely because it can represent all 13 classes, nor if it seemingly outperforms the COCO baseline on an **exposed** photo cohort. The experiment is exploratory and shall retain an unreleased, unmerged, no-deploy PR until independently sealed/source/photographer-disjoint double-human subtype/color labels, browser/mobile stability and two-account signed hosted isolation are verified. No promised 10/10 quality or photorealistic claims.
- The exact-path CI allowlist expands only to **16** source, research, test, docs and opt-in files. No new `public/recognition-engine.mjs`, real model weights, auth, hosted Supabase, production, staging or private images are changed or committed. `research/mission1-parallel88/run-fashion-onnx-88.mjs` is executable research, not a consumer bundle.

**Validation status at authoring:** experimental code and tests committed; full **real-model** no-deploy workflow [#43664749961](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43664749961) was **QUEUED** when inspected, so any detection counts must remain **UNVERIFIED** until the pinned ONNX checksum, exact owner/COCO scoring source and genuine original JPEGs finish a successful job. Last prior full green source/owner+real COCO benchmark [#43664137008](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43664137008). **Family Alpha HOLD #255 OPEN.**


## P88 FASHIONPEDIA ONNX RESULT — 8 OF 13 ACCESSORIES, NOT RELEASE-READY

**Verified real-world inference, not simulated:** Exact research executable SHA `d6733249e96dba914c8cba2fcb936efef6fd8c35`, [genuine public-model Actions run #43665157570](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43665157570), **real-model step COMPLETED SUCCESS**. All **16 original Fashionpedia public JPEGs** were independently re-read and checked against their original SHA-256 and byte length from frozen manifest `b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd`. The model loaded from third-party licensed [louisJLN/yolo8-fashionpedia ONNX](https://huggingface.co/louisJLN/yolo8-fashionpedia), pinned version, with independently enforced **model file SHA-256 `6b581af3abe2b4ae97a84cbe9aef5ae37207a68ee966d22b0b8d7969d79e6920`**. No PyTorch pickle, private owner photos, live cloud, or credentials were used. Full no-image numeric output was uploaded under 14-day Actions artifact ID `14142087131`, ZIP SHA-256 `5fec8d7873bfbd4cd6c2ef7bc468019e38486366afc1e5e1972683b2efd59f43`.

### Authentic original-annotation category-matched BBOX IoU >= 0.50

All regions below are official Fashionpedia original human bounding-box annotations on the **already exposed** public P68 photo cohort, **NOT independent prospective blind photographs**. The model used **46 classes including all 13 represented accessory human classes**, 640×640 RGB/114 letterbox, original source resolution inverse mapping, non-maximum suppression at IoU 0.50 *within the same original category*, and model confidence >= 0.10, fixed before this run. One human accessory may be matched by at most one proposed box and vice versa.

| Actual Fashionpedia original accessory class | Correct source box matches | Human annotated originals | Proposed model boxes |
|:--|--:|--:|--:|
| Glasses | 1 | 1 | 1 |
| Hat | 1 | 1 | 1 |
| Headband / hair covering | 1 | 3 | 4 |
| Watch | 1 | 2 | 1 |
| Belt | 3 | 4 | 7 |
| Bag / wallet | 1 | 2 | 1 |
| **Total** | **8** | **13** | **15** |

Exactly **8/13 = 61.5%** of original human accessory bounding boxes were correctly localized **with the correct individual Fashionpedia category** at one-to-one bbox IoU ≥0.50, with **7 unmatched model proposals** and **5 missed original human accessory objects**. At this fixed experimental threshold, supported accessory proposal precision against the frozen human source was **8/15 = 53.3%**. Some unmatched proposals could represent unlabeled real objects; treat these as *unmatched with existing ground truth*, not automatically hallucinated items. The 16 image-level CPU ONNX inference durations were **approximately 44–63 ms per JPEG**, **not including** JPEG decode/letterbox, asset download/session start, full model preloading, or physical-phone performance. No browser memory/latency or web runtime acceptability is claimed.

**Comparison and technical decision:** This fashion-vocabulary model is substantively more plausible as an **experimental auxiliary owner-review proposal detector** than the rejected COCO-only YOLOS-tiny (which could represent just two human bags out of 13 human accessory cases and recorded one correct bag match with eight unmatched boxes). Fashion model also matched one of the same two bags and **seven other human accessories that COCO could not even label**. However, the baseline SegFormer **0/13 was a different full-resolution segmentation-mask IoU protocol** and MUST NOT be compared numerically as the same metric or called a measured user-facing 61.5% recognition uplift. The data is **previously exposed Fashionpedia**, the candidate model was **trained on Fashionpedia** and any training/pretraining overlap with these exact photos is **not independently ruled out**. No independent subtype/primary color ground truth, blind dual-human owner labels, full source→owner confirmation→private saved closet acceptance, Android Chrome/iPhone Safari hardware or signed hosted cloud validation exists. Results are far below required 10/10 and include seven unmatched class proposals and five missed originals, so it is **NOT ready to promote, deploy, or silently save**.

**Engineering deliverable:** New **unshipped pure decoder/scorer** `research/mission1-parallel88/fashion-onnx-probes-88.mjs` (full 46-score + 27-main-class checks, fail-closed source geometry, no clothing-part-as-accessory, one-to-one exact class box IoU, categorywise counts) and **actual public JPEG/ONNX research runner** `research/mission1-parallel88/run-fashion-onnx-88.mjs` now have provenance-checked source and weight receipts. For third-party dependency stability, GitHub Actions CPU-only ONNX Runtime install uses `ONNXRUNTIME_NODE_INSTALL=skip` to avoid a documented GPU-NuGet installer error on Linux. The first exact executable run `0fd498d7` failed during dependency install; the next `c14007bc` passed model SHA/loading but stopped on old named metadata API. The exact successful implementation `d6733249` uses ONNX Runtime JS's `inputMetadata[0].shape` and demonstrates actual original-image inference. **Do not grandfather this run's model SUCCESS onto independent phone/hosted/owner release gates.**

**New next-stage evaluation contract:** This exact same model must be measured on a **rights-verified, genuinely new original-photo cohort**, sealed without exposure to test tuning, with two independent human annotators labeling every physical wardrobe instance, category, subtype and color; document original-image SHA, source/photographer disjointness, bounding-box and true selected-mask IoU, owner review/pairing/duplicate rejection and false-save count. Require uninterrupted physical Android Chrome / iPhone Safari on a realistic ~2-model session and two signed hosted private accounts before code/assets are considered for opt-in native consumer preview. For now, the **consumer recognizer, model file, worker, owner save, private cloud, production and staging are unchanged**. This is **research-only**; Family Alpha **#255 OPEN/HOLD**, PR #1175 **DRAFT/UNMERGED/UNDEPLOYED**, **16 exact allowlisted files**.

**CI exact-head status when reported:** Source/focused and genuine public model jobs for [#43665157570](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43665157570) were **SUCCESS**; the full inherited Node+desktop browser job was **still IN PROGRESS**. A final documentation-only head will have its own separate no-deploy CI and must be confirmed, not presumed.


## P88 RECOGNITION CANDIDATE HANDOFF — TWO-AUTHORITY BLIND CUSTODY GATE

**Why this is a distinct engineering milestone:** Public-photo model research already identified a possible Fashionpedia-vocabulary accessory proposal model, but independently approved **prospective blind human truth does not exist in this development branch**. The separate lawful acquisition/custody work in [P75 draft #953](https://github.com/nickhaney916-lang/Closet-Current/pull/953) records **0** genuinely approved dual-human labels, **0** sealed blind photos; the independently verified workstation [P79 draft #979](https://github.com/nickhaney916-lang/Closet-Current/pull/979) can generate honest, independently signed *future* private human receipt files but has **0 actual human raters/labels**. P71/#929, not this developer, owns the final independent evaluation and release decision. A public code commit or CI cannot manufacture human reviewer identities, legal owner consent, private image bytes, a sealed blind commitment or genuine acceptance. **Actual new blind correctness remains UNKNOWN; eligible sealed photos remain 0.**

**Source-verified implementation, research / no deployment:** `research/mission1-parallel88/blind-evaluator-handoff-88.mjs` provides a stable published *candidate freeze* containing exactly the studied third-party MIT-metadata 46-class Fashionpedia YOLOv8n ONNX binary SHA-256 `6b581af3abe2b4ae97a84cbe9aef5ae37207a68ee966d22b0b8d7969d79e6920`, source research commit `d6733249e96dba914c8cba2fcb936efef6fd8c35`, 640-square input, original letterbox, score cutoff .10, per-class NMS IoU .50, exact class original-bbox match IoU .50, product model `UNCHANGED`, owner review `REQUIRED` and auto-save `DISABLED`. The frozen candidate has a canonical SHA-256 digest so a blind evaluator cannot silently score an updated model or tuned threshold as though it were the same preregistered experiment. The candidate reference's known-exposed 16-photo P68 manifest digest `b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd` is explicitly quarantined, never a prospective blind dataset.

The *offline, private* handoff checker does **not access any photo, model logits, masks, item IDs, category labels, external account or human private key**. It accepts a strict small aggregate envelope only. It cryptographically verifies TWO independent Ed25519 statements against **two distinct independently pinned public key SHA-256 fingerprints from the owner's private environment**, never trusting identities or thumbprints supplied by a payload:
1. **P75 custodian independently signed audit:** exact model candidate digest; P75 full private audit commitment digest; complete historical SHA/perceptual exposure ledger digest; independent signed rights evidence digest; separate sealed blind commitment; **at least 60** independently approved new garment source groups and blind photos (P75's published planning target); source bytes/license and physical source groups accepted; two **externally verified real independent human reviewers** and dual-human verified labels for every blind photo; no unresolved annotation disagreement; zero previous model/answer exposure, verified photographer/source disjointness **AND verified disjointness from the candidate model's Fashionpedia training sources**; sealed answers and photos held entirely outside Git/CI. Curator approval expires after at most seven days.
2. **P71 evaluator independent authorization:** a second independent approved signer, separate from P75, binds the exact frozen candidate digest, the P75 **canonical signed audit payload SHA**, and the same sealed commitment; independently confirms ownership of the one-time blind evaluation and no prior exposure to model predictions/answers. Signed acceptance must occur within the P75 audit's valid time window.

**Security rules, limitations:** Every envelope object requires exactly its allowed fields: unexpected IDs/photos/answers/labels are rejected rather than echoed. Forged or edited signatures, different trusted fingerprints, same key used for both authorities, stale audits, wrong candidate digest, corrupted sealing, missing rights/dual humans, incomplete historical exposure ledger, any known public P68 digest, incomplete model-training disjointness, repeated/late approval and nonzero disagreements all return **BLOCKED**. CI refuses to open private envelope files at all. The private CLI requires an absolute external (out-of-Git) path, two separate owner-pinned environment fingerprints and never prints private source IDs, image URLs, labels, private reviewer names or keys. Even a cryptographically structurally passing envelope means **SIGNED_CUSTODY_PREFLIGHT_ONLY** with `accuracyMeasured:false`, `modelPromotionAllowed:false`, `automaticSaveAllowed:false`, `releaseApproval:false` and `familyAlphaHold:true`. Signatures attest approved source custody through *the independent P75/P71 human process*; the verifier itself cannot prove someone is human, assess lawful consent, check the actual private image pixels, or certify zero wrong saves. This is a research-side compatibility gate, NOT a replacement for P75's audit or P71's independent evaluation.

**Private operator handoff (not run or claimed here):** The independent P75 custodian must independently complete and sign the full [P75 offline source/rights/reviewer audit](https://github.com/nickhaney916-lang/Closet-Current/blob/05ad9041088804ab526effff355ec480e3d3d791/research/parallel75/CODEBOOK.md), with actual new source/photographer/training-disjointness evidence; P71's **separate** approved evaluator signs the aggregate contract binding that exact P75 source audit. Existing P75/P79 tooling does **not yet create this added two-authority aggregate cross-mission envelope automatically**; it must be produced by those authorized external custodians. Neither developer nor CI may bootstrap a registrar, fabricate a rater, use self-signed synthetic receipts as real human evidence or score the blind set. A verified owner/custodian may inspect a real private envelope **offline only**:

```bash
export P88_APPROVED_P75_REGISTRAR_FINGERPRINT="<externally approved P75 public-key DER SHA-256>"
export P88_APPROVED_P71_EVALUATOR_FINGERPRINT="<distinct externally approved P71 public-key DER SHA-256>"
node research/mission1-parallel88/blind-evaluator-handoff-88.mjs inspect /secure/external/private-blind-handoff.json
```

The command refuses to execute in `CI` or `GITHUB_ACTIONS`, or read an input under a Git checkout. Its output is only a coarse custody status plus error codes. A passing source contract would grant only restricted data handoff *to P71* for genuinely blind one-time scoring, and **does not certify recognition accuracy or permit consumer/Family Alpha release**.

**Source-executed regression cases:** The Mission #88 focused test file now includes deliberately **synthetic-only ephemeral Ed25519 keys** for signature-format/replay tests (not real human review), verifies pinned candidate digest/source manifest/zero-release flags, denies old/stale audits, adversarial altered signatures, same or untrusted registrar/evaluator, hidden extra private labels, historical exposed photo hash, fewer than 60 approved photo/group records, missing two-human coverage, unresolved disagreements, insufficient rights/consent/source disjointness or training-source overlap, and checks that private CLI access is refused in CI. The exact 17-path pinned-base no-deploy allowlist includes this new research-only module; immutable auth/recognition worker, model weights, cloud, private wardrobes, production and staging remain unchanged.

**Acceptance and constraints:** This addition is an *admission gate*, not a new human labeled dataset and not a classifier recall improvement. A candidate detected 8/13 real Fashionpedia accessory bounding boxes on a historically exposed corpus, **but** that is not an independently sealed Fashionpedia-train-disjoint blind test, color/subtype/selected-mask truth, real signed two-account private save, or actual Android/iPhone performance acceptance. **The actual sealed human-benchmark count remains ZERO, the signed P75+P71 handoff remains NOT RECEIVED, the entire Mission #88 stays INCOMPLETE, Family Alpha HOLD #255 remains OPEN, and PR #1175 is DRAFT/UNMERGED/UNDEPLOYED.** Check latest exact-head CI before claiming this new gate passed.

## P88 PRIVATE-ENVELOPE FILESYSTEM BOUNDARY — further no-deploy hardening

**Scope:** The existing P75→P71 signed-custody preflight remains strictly research-only, and actual human-approved sealed blind photos and signatures remain **ZERO**. This checkpoint does **not** improve measured recognition, add images or raters, change weights/worker/owner save, or promote the research ONNX detector.

**Actual defect closed:** The prior private CLI only checked a *lexically resolved* external absolute path with `stat` followed by `readFile`. A path under a synthetically external directory could be a symlink to a file or directory **inside the repository**. It also could point to a pipe/device or change to a symlink between metadata and read. That was inconsistent with the advertised “outside Git / bounded private regular file only” guard.

**Implementation:** `externalPrivateFile88` now resolves both the actual checkout and candidate physical path, rejects checkout escapes through symlinks, rejects symlink aliases even when they point outside Git, and rejects directories, pipes/devices and >50,000-byte files without opening their contents. Private CLI opens via `O_NOFOLLOW|O_NONBLOCK`, verifies the opened descriptor really is a regular file and size-bounded, and bounds the actual read byte count. Node regression tests create only disposable **synthetic** temporary data: ordinary external file, relative path, checkout file, external symlink, symlinked checkout parent, directory and oversize. CI still explicitly forbids invoking private CLI inspection of genuine envelopes; no photos, sealed source IDs, human labels or real keys are used.

**Known limitation, not a new claim:** This is file/path hardening, not cryptographic evidence of two actual human signers. The stateless signed-payload checker cannot independently prove human identity, lawful photographer/source training disjointness, *or one-time replay consumption*; P75 must attest the full audited custody record and the independently authorized P71 evaluator must maintain a private consumed-commitment ledger before any actual one-time blind scoring. An in-window reinspection cannot be treated as a new approval. Neither an independently collected benchmark nor real Android/iPhone/two-owner hosted account acceptance has been supplied.

**Execution status:** New source patch `1fe17dcb1e5cd597f68ba444734f268dced7a5c3`, tests patch `d3433d15c9a598cd03668f9140b1f940861d4571`, and an additional source correction `95d8fc895f2a3abb1d5469e51ec1a22925d28643` replacing unbounded `FileHandle.readFile` with an actual fixed 50,001-byte descriptor read loop. No private file can force this CLI to allocate a large read buffer after a race with its initial file-size check. [Exact test-head no-deploy Actions #43673421088](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43673421088) was **QUEUED** when this documentation was authored. Do not inherit previous HEAD green as proof of this new change; verify exact final HEAD and rerun all no-deploy checks. Cumulative branch scope remains 17 restricted paths, Family Alpha #255 OPEN/HOLD, PR #1175 DRAFT/UNMERGED/UNDEPLOYED.

## P88 ONE-TIME OFFLINE BLIND EVALUATION RESERVATION — LOCAL LEDGER ONLY

**Why:** Earlier P88 verifier cryptographically validated a P75/P71 aggregate signed handoff, but could be called repeatedly against the same sealed source cohort without recording that it had already been used. A previously exposed blind cohort is not prospectively blind again. This is a *local custody/replay safety barrier*, NOT new model recognition performance or a replacement for P71's independently administered test.

**Implementation:** `reserveBlindEvaluatorHandoff88` only proceeds after every existing source/signature/rights/disjointness/time/dual-human preflight assertion passes. With an **owner-controlled, persistent, absolute, real (not symlinked), owner-only mode 0700** directory located outside Git, it atomically creates one `O_CREAT|O_EXCL|O_NOFOLLOW` 0600 marker keyed solely to the sealed cohort commitment, not to a model or mutable evaluation threshold. Every subsequent attempt in that same directory receives `PRIVATE_LEDGER_ALREADY_RESERVED`, including simultaneous contenders; a failed signature or missing ledger creates no marker. The marker contains only the fixed `p88-offline-reservation-only/v1` version string, not actual photo identifiers, human labels, image bytes, logs, keys, user accounts or model scores. A denied ledger, unsafe symlink or too-permissive ownership fails closed. The added **`reserve` offline CLI mode** requires `P88_PRIVATE_LEDGER_DIR` plus the two existing owner-verified external P75/P71 signer fingerprints and remains categorically forbidden in `CI` and `GITHUB_ACTIONS`. Existing `inspect` mode remains read-only and cannot grant release.

**Synthetic source tests:** One concurrent O_EXCL reservation succeeds and one fails; replay fails, absent ledger fails, forged source-audit signature does not consume a cohort, symlinked ledger and 0755 ledger are rejected, exact marker filename contains only a digest, and reserve CLI refuses GitHub Actions. Tests create disposable ephemeral keys and local directories ONLY—no real signed handoffs or human/photo evidence.

**Honest scope:** This is **ONE LOCAL OWNER-MAINTAINED LEDGER**, not an authoritative distributed replay registry. Copying an envelope to a newly created ledger, deleting ledger files, a dishonest signer, compromised local operating system or a false source/photo commitment can still defeat global uniqueness. The owner must provision, control, back up, never reset and independently reconcile this private ledger and arrange the real P71 operator authorization. A structurally valid `SIGNED_CUSTODY_PREFLIGHT_ONLY` status or `oneTimePrivateReservationCreated:true` does **not** mean the photo cohort has been independently audited, scored, checked for training overlap, or passed. Product automatic save, model promotion, Family Alpha release remain denied.

**Checkpoint commits:** `e9274b541b44ebd9fdf59c264c9a4b5b0f103abc` (isolated module/CLI) and `10274f4a83f1e3b61fcb355f3398fe66252b2fea` (synthetic adversarial tests). **Exact latest-head no-deploy CI must be checked after this documentation commit; do not transfer previous green checks.** All changes remain inside the existing 17-path restricted P88 branch scope. No production/staging/hosted Supabase, real owner account, model worker, recognized weights, original family photos, merge or deploy. P75/P79 authentic human-approved labels and genuinely new sealed blind cohorts remain **0**; physical Android/iPhone and hosted two-owner release acceptance remain **BLOCKED**. Family Alpha #255 **OPEN/HOLD**; PR #1175 **DRAFT, UNMERGED, UNDEPLOYED**.

## P88 POST-RESERVATION CI TRIAGE AND CHECKOUT ROOT FIX — NO DEPLOY

**Verified real regression failure (not concealed):** Earlier new private path/symlink regression CI on commits `d3433d15`, `2fef5ef`, `95d8fc8`, and the first follow-up checkpoints FAILED focused tests. The test assumed a root `package.json` file, absent on this repository's checkout; GitHub runner reported `ENOENT .../Closet-Current/package.json` before testing the intended fail-closed path. This was **a test-fixture error**, not evidence of real photos, improved recognition or successful new private-file validation. It triggered targeted and full Node no-deploy failures. Source and fixture changed to use `research/mission1-parallel88/blind-evaluator-handoff-88.mjs`, an actual source file present on the pinned branch, including symlinked parent/path tests. The corrected test commit is `e635bcfa3aea3b50969290bfa153c61776493fa8`.

**Further source defect closed:** Private file and private ledger canonical path guards originally assumed `process.cwd()` was the repository root. Running the offline module from a different working directory could falsely classify an in-checkout file or ledger as external. Both now default to the real immutable source module's derived repository root `dirname(fileURLToPath(import.meta.url))/../..`, rather than the shell CWD; the source correction is `ee31d57f0795a9993382fe100d2365212be96558`. A source-executed subprocess test launched with a disposable external CWD verifies that an in-checkout file and ledger path are still refused; test commit `e6244d39d8c3e5ea3b5855741ae9e2334d0c5f3b`.

**Evidence honesty:** The earlier successful `a5d21d5` and `1fe17dc` runs remain valid only for their exact old commits, **not** these fixes. Subsequent observed failed runs are red; they are NOT silently treated as green. The final documentation commit must itself have fully completed no-deploy source, targeted, full Node and desktop browser CI before saying the new code is verified. Genuine model benchmark was not rerun; original pinned inference weights, source JPEGs, native default owner save, production/staging/hosted auth and every private account remain unchanged. New human-approved original sealed blind sources and actual human raters remain **ZERO**, and signed hosted two-account / physical-phone release acceptance remains BLOCKED. DRAFT PR #1175 UNMERGED/UNDEPLOYED, Family Alpha #255 OPEN/HOLD.

## P88 NATIVE RECOGNITION CLAIM GATE — REAL MODEL ONTOLOGY LIMITS

**Evidence-backed technical conclusion:** The tested independent MIT-metadata `louisJLN/yolo8-fashionpedia` ONNX network has 46 output channels but only **27 whole-garment/object labels** used by this research decoder. Three owner-critical fine-subtype distinctions are **not separate network output labels**:

| Owner wants to distinguish | Actual Fashionpedia whole-object label | Direct fine-subtype accuracy from model |
|---|---|---|
| T-shirt versus sweatshirt | `top, t-shirt, sweatshirt` (class 1) | **UNMEASURED / unsupported** |
| Sneaker versus ankle boot | `shoe` (class 23) | **UNMEASURED / unsupported** |
| Blouse versus tunic | `shirt, blouse` (class 0); no direct `tunic` whole-object label | **UNMEASURED / unsupported** |

This is independent of any model confidence score or whether a category bounding box overlaps an annotated garment. **8/13** accessory exact-category BBOX matches on the **already-exposed** Fashionpedia cohort do not convey **any** fine-subtype correctness, garment color or new photographer/model-training-disjoint acceptance. Correct **shorts vs skirt** and **dress vs top** broad labels are separately available in the 27-category model, but still require genuine new independent source-level human truth to measure performance and avoid false object proposals. Fine-subtype, masked colors, overlapping instances and wrong-save counts remain **NOT MEASURED**.

**Implemented, research-only source contract:** `FASHION_FINE_SUBTYPE_GAPS88` and `fashionFineSubtypeClaimGate88` in `research/mission1-parallel88/fashion-onnx-probes-88.mjs` now explicitly return **BLOCKED / productPromotionAllowed:false / automaticClosetSaveAllowed:false / fineSubtypeAccuracyMeasured:false** even if someone supplies a claimed 100% score for a label pair that the model vocabulary cannot independently represent. Unknown category contrasts or malformed numeric score claims also deny by default. A focused synthetic test pins the exact category names and checks all three gaps, 100% score assertion rejection, unknown contrast and invalid scores. **This does NOT fabricate any real subtype ground-truth labels and does NOT modify the live recognizer or automatic saving.**

**Practical consequence:** Do not treat this 46-category candidate as a finished remedy for T-shirt/sweatshirt, sneaker/boot or blouse/tunic confusion. The possible path is an *independently tested additional fine-subtype verifier or owner Adjust*, with calibrated Unknown, sealed human labels, and external physical mobile performance/owner private-save acceptance. No model promotion or release is authorized by this research contract. PR remains **DRAFT/UNMERGED/UNDEPLOYED**, Family Alpha **#255 OPEN/HOLD**.

**External work that source/CI cannot invent:** (1) P75 original photo creator rights and full photographer/training-source dedup; (2) two genuinely independent P79 human reviewers for every original garment, shape, mask, category, subtype, color and physical pair; (3) P71 one-time blind prospective score with source manifest, detected instances, model logits and denominators; (4) actual Android Chrome/iPhone Safari continuous capture→owner review→private saved closet; (5) two authorized signed private accounts and independently observed hosted RLS/backup. No human reviewer/photos, device or hosted account was accessed in this commit.

## P88 DEFAULT OWNER COVERAGE WARNING — USER-VISIBLE REVIEW, NO MODEL CHANGE

**Source-backed deficiency:** Independent original Fashionpedia human accessory masks and native SegFormer group research found small wearable items often omitted in a full-outfit scan; users must not infer that an apparently complete set of cropped photos is a complete inventory. Previously `ownerCoverageReminder88` was visible only under the explicitly opted-in `?outfitInstances840=1` research query flag; the default capture path instead reported `N individual clothing photos cropped`, potentially implying the photograph contained no overlooked clothing.

**Opt-in-independent, informational fix on isolated draft:** The `public/outfit-capture.js` default `done` notice now identifies crops as **tentative clothing regions**, warns that region count is **not a verified garment count** (including zero-region scans), and prompts owners to compare against the actual full original photo and individually photograph overlooked watches, belts, headwear, bags, glasses, and other garments. The same coverage warning remains on the actual owner **Review** screen after switching away from Scan. Existing opt-in segmentation mode retains its behavior. The worker request, model, segmentation thresholds, original JPEG, candidate()/owner category/color review, duplicate guard, physical pairing, private save and account authority are unchanged.

**Source-executed regression:** The existing default-path harness now checks that `instanceReview840` remains undefined, no automatic inventory save occurs, missing-garment text appears in both Scan and Review, the draft photo remains in the unsaved batch, and a zero-region scan does not assert that an outfit is empty. The public 16-photo historical source cohort is **not a prospective blind study**, and an additional explanatory message is **not** proven to improve model recall or category accuracy. **No actual human-photo accuracy gain is claimed.**

**No-deploy limitation:** Draft only; no master/staging/prod merge, hosted Supabase, owner photo upload, private account or model modification. Final commit CI must pass independently, and Family Alpha #255 stays OPEN/HOLD until actual P75/P79, P71, P78 physical, two-owner cloud acceptance.

## P88 DEFAULT SIGNED-OWNER CAPTURE LEASE — PRIVACY REGRESSION CLOSED IN DRAFT

**Root cause:** Original owner-protection code in `public/outfit-capture.js` scoped exact signed-session reference checks on the full-outfit upload decode, worker message, and saved retry original JPEG to `?outfitInstances840=1` or the dependent `?outfitUnits70=1` research flag. The normal default browser path could therefore start decoding an original file for account A, accept the finished JPEG after a user switched to B, or accept additional model-worker garments after a replaced B session while retaining the first owner's original. This is a **source-verified security boundary**, not a measured observed live-owner exposure.

**Source fix `966b291718fbd1c105f2a94786ca7c5e0abe2d19`:** Every `startOutfitSplit` now captures the exact `window.closetAuth.user` object and ID as a per-job lease and holds an owner-scoped retry lease, regardless of optional query flags. Every incoming worker message (progress, piece, done, error) checks ID **and object identity** before any new draft, scan-result or message receipt; stale old JPEG retry data is cleared when the session has changed. `readOutfitPhoto` universally verifies the same exact user object and owner ID after awaiting photo conversion; it denies transfers from a logged-out state to a freshly logged-in user, from A→B, and from a replaced same-ID session. The default retry handler no longer replays a previous owner's original photo. **No new owner, Auth module, camera model, recognition worker, model weights, hosted storage or automatic closet save code was modified.**

**Source-executed tests `5b9e9db93961db7a01ccde1dcc91b78bb8bfd002`:** Five new tests cover the nonexperimental default path: old-owner model result denied after A→B, replaced same-ID session denied, late signed-in account prevented from receiving logged-out source JPEG after decoding, old-session retry denied, and unchanged owner retry works with no automatic closet write. Existing synthetic opt-in source/mask/physical-pair and desktop tests remain in CI. The prior separate commit `f9e49bf4dfa64c04153a4c8aa980b002c394ec5d` extends truthful missed-clothing/accessory warnings to default scan and Review; tests `a9c25186398dae519be21c2f12da7173315b07b9` cover one-region and zero-region scans. All remain in the same approved 17-path isolated branch scope.

**Honest acceptance status:** This correction addresses code-demonstrable stale-session data flow; it is NOT a replacement for *two genuine users on independent authenticated devices*, hosted Supabase tenant isolation, RLS, real ONNX/SegFormer inference under sustained WebKit, or prospective blind subtype/instance/color accuracy. The output warning does NOT increase model recall. **Exact final-head CI must complete before calling new source/tests green.** No deploy/merge, no private family data accessed, Family Alpha #255 OPEN/HOLD.


## P88 NOVEMBER 15 SOURCE-REVIEW AND DEFAULT SAVE HARDENING — EXACT-HEAD CI PENDING

**Change scope:** existing draft PR #1175, same existing 17-file allowlist, no sibling
branches, no new PR, no hosted Supabase, deploy, merge, production/staging or private
owner/photo access. The starting exact head was
`640de76cbefad4e325685dc5195e8c3eee2861c4`.
This section records source implementation and synthetic regression assertions;
**do not claim the latest exact-head Node, browser, or model CI PASS until a
completed exact-commit job has been inspected**.

1. **Normal single-photo review save source/owner race fixed in code:**
   `public/app.js` `reviewedSaveLease88` now freezes the exact signed
   `window.closetAuth.user` object, owner-scoped IndexedDB, pending garment
   object, original/crop photos, source ID, segment hints and crop bounds.
   `savePiece` rejects a changed session (including same-ID replacement),
   replaced photo/crop and moved draft **inside** the queued write, after
   `cloud.beforeWrite()`. It computes remaining drafts at commit time
   instead of writing a snapshot captured before the queue; it does not wipe
   a concurrently added garment. After that single atomic items+draft
   transaction, Adjust no longer makes a redundant generic `persistDraft()`
   call that could run after another account becomes active. Source-bound
   P70 writes retain their existing separately checked identity and original
   SHA verifier. No changes to recognition weights or confidence cutoffs.
2. **Explicit original-photo physical-unit review evidence:**
   For P70 source-bound captures the native Adjust form now shows **both**
   the complete original outfit JPEG and isolated garment crop; its owner
   checkbox explicitly includes checking the physical garment/shoe-pair
   grouping, category, type (or Unknown), and color. Only after the actual
   original JPEG SHA rehash matches its worker source SHA, the reviewed
   private saved record receives nested `ownerSourceReview88`:
   `schema: p88-owner-source-review/v1`, exact owner ID, saved item ID,
   `outfitSourceId`, verified original JPEG SHA, selected source mask SHA,
   optional companion mask SHA, crop bounds, reviewed category/type/color,
   physical grouping status, `ownerReviewed:true`,
   `sourcePhotoOriginal:true`. The receipt is checked again inside the
   queued owner-scoped transaction. Crop bounds and segmentation hint
   revisions are now frozen there too.
3. **Critical non-promotion fields:** The new nested owner receipt
   deliberately has `independentPhysicalItemVerified:false`,
   `singleGarmentVerified:false` and `threeDReady:false`.
   These are **NOT** optional assertions of successful model accuracy or
   the M4 `verified-single` admission contract. Even a real-model
   segmentation mask SHA represents the selected model pixels, not
   independently proven one-physical-garment identity. The owner confirmation
   is genuine only when an actual owner conducts it on actual photos; browser
   fixtures remain simulated. Unresolved fragments/Unknown source groups
   continue to require recapture and cannot be upgraded by flags.
4. **Source-executed regression work added, not yet accepted as pass:**
   `tests/mission1-parallel88-owner-mask-lease.test.mjs` asserts normal
   reviewed save denial on A→B, same-ID session replacement, changed
   segmentation evidence and crop substitution while cloud preflight waits,
   and preservation of a concurrently added draft. The actual native Adjust
   Chromium/WebKit browser harness
   `scripts/test-m1-owner-pair-admission-846.mjs` asserts the original
   full JPEG is visible and the saved synthetic-owner pair receipt preserves
   source SHA/second mask/category/status yet has *no* certified
   single-item/3D permissions.
5. **Reproduction (no-deploy checkout on this branch):**
   `node --test tests/mission1-parallel88-owner-mask-lease.test.mjs`;
   `node scripts/test-m1-owner-pair-admission-846.mjs`;
   then run existing P88 focused/full Node and desktop Chromium/WebKit
   320/390/430 CI checks. These commands are **requested verification**,
   not claimed run receipts here.
6. **Remaining external blocker for Mission 4:** A
   `p88-owner-source-review/v1` receipt is a useful owner-attested
   original/mask/crop handoff but does not certify the independently observed
   number of physical items within the mask. Do not set M4
   `singleGarmentVerified:true` or permit 3D without an independently
   validated item identity or a separately approved physical-item review
   acceptance contract. Owner-reviewed source evidence can support
   original-JPEG 2D **only** until that gate is resolved.

**Accuracy/acceptance:** No new unseen dual-human labeled original, no
new blind subtype/color comparison, no verified real Android/iPhone or hosted
two-owner RLS test has been obtained here. Historical previously exposed
Fashionpedia ONNX accessory result is still **8/13 exact category boxes**,
not a same-metric SegFormer segmentation uplift. The 65%/35%
Mission 1 planning rubric is unchanged pending proven integrated acceptance.
Family Alpha issue #255 stays OPEN/HOLD.


## 2026-11-15 M1 native crop photo account/source lease — verified source update, release still HOLD

**Original code defect:** Outside the original P70 mask-crop veto, the native
`public/app.js` `cropClothingPhoto` callback previously awaited asynchronous
photo-quality / optional classifier work and passed the final private crop save
through generic `writeAll` or queued draft writes using mutable global `db`.
An account A→B switch or same-ID renewed login during that wait could change the
write target or let a stale crop overwrite a different owner's draft. This is
a source-observed potential race, **not evidence that live users were exposed**.

**Existing PR #1175 source fix:** `reviewedSaveLease88` now freezes the signed
user-object reference and ID, per-owner IDB handle, exact saved/draft object,
original crop, recognition source, segmentation and crop revisions *before*
opening the native crop editor. Both optional classifier and photo-quality
awaits revalidate the same object and unmasked source; the final save rechecks
**inside** `queued()` after async `cloud.beforeWrite()`. Only the captured
original owner IDB can receive a committed edit. Saved-crop edits write only
the owner-bound item; unsaved draft crops write a **live** batch snapshot to
the owner-bound draft state, preserving new photographs captured during the
preflight. After the transaction an old/replaced owner cannot repaint another
user's UI. Crops cannot supply a second item ID, physical mask receipt or
owner-source verified receipt. Any late `reconciliation70`, shoe pair, merged
fragment or unrecognized segmentation status remains blocked.

**Source-executed negative coverage:** existing P88 test file now exercises
actual native crop guards for A→B during photo-quality, same-ID renewed login
after cloud preflight, source/mask added during crop or queue wait, identity or
physical metadata forgery and stale optional worker classification. Positive
case proves a separate concurrently captured draft survives one owner's
queued crop write; the reviewed photo stays pending **unsaved in closet**
until explicit Adjust owner confirmation.

**Chromium/WebKit browser-path coverage:** existing
`scripts/test-m1-owner-pair-admission-846.mjs` now additionally executes
the actual source crop controller in browser engines at 320/390/430 CSS widths
with synthetic signed-owner/crop-editor/IDB transport. It exercises permitted
crop edits with an appended second draft and source-photo review still required,
then denies same-ID replacement account before queued crop commit. These are
**synthetic transport tests**, not mobile-device photos, genuine human crop
acceptance, hosted two-account RLS, physical phones or blind model accuracy.

**Exact commit/test policy:** starting prior green source head
`025f1a57bd5bf92185c6c0cf55dbec1600afc3ef`,
[no-deploy #43731446902](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43731446902).
Crop implementation commit `dea517b5b0c458e71347d55ec55952e3b96fe387`,
expanded source-executed crop tests `1b78e46251bea9528c0cb391ee3a8abc86adc4e6`
([no-deploy #43732238211](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43732238211)),
and browser-source test extraction correction
`9982ebe2b13e8311a4ea7f07674b3591289160a0`
([no-deploy #43732451667](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43732451667)).
The latter exact code-head check is **IN PROGRESS at this documentation
checkpoint**; do not transfer a prior green run or claim browser acceptance
until final jobs finish.

**No product promotion:** genuine prospective photographer/model-training-
disjoint double-human annotations, subtype/color/instance benchmarks,
physical garment unit identity, Android Chrome/iPhone Safari, signed hosted
RLS and M4 certified single-garment acceptance remain blocked/unknown.
The per-item `p88-owner-source-review/v1` remains **owner-attested but
`singleGarmentVerified:false`, `threeDReady:false`**. Planning baseline
still 65% complete / 35% remaining. Exactly the existing Mission 1 branch,
no merge/deploy, #255 OPEN/HOLD.


## 2026-11-15 — P88 native background learning exact-owner/source fence

Native `reviewRecognitionMemory` / `saveMemoryReview` originally used mutable
global `db` after an asynchronous model and cloud-beforeWrite; old-owner
learning could target a replaced session and the completed callback could
repaint a later owner's interface. A manual subtype edit could also conflict
with old learning metadata. Existing PR #1175 now freezes exact signed user
object, owner ID and per-user IDB, plus original/photo/mask and category/type/
color before saving review-only weekly suggestion. It rechecks after model,
inside queued preflight and inside async IDB read callback. Stale results are
not saved or shown. Seven source-executed synthetic promise/IDB cases exercise
same-owner success, account A→B, renewed same-ID login and DB switch,
preflight switch, delayed IDB read, in-memory and saved type corrections.
No model weights, thresholds, actual accuracy or physical item certification
were changed. New exact-head CI must be verified; independent human-photo,
physical Android/iOS and hosted owner acceptance remain BLOCKED.
**FAMILY ALPHA HOLD #255 OPEN — DRAFT ONLY, NO MERGE/DEPLOY.**

**CI correction:** the first post-fix commit `0c41490` failed one inherited
`tests/clothing-memory.test.cjs` fixture: that historical Node VM extracts
only `saveMemoryReview` and has no browser Window or companion function.
It exercises the original image-only *synthetic* merge contract and expects
new recognition-memory features to preserve its latest manually corrected
subtype and color. The native browser path remains strictly owner/IDB/source
fenced. The extracted *nonbrowser* fixture only keeps its prior semantics,
so the inherited source test can run without relaxing any real browser lease.
The first run's 841/842 full Node result is **FAIL**, not accepted; verify
this revised exact-head CI before claiming a green receipt.
**Targeted fixture correction:** the first corrected-source CI #43766633728
reported 196/199 focused tests passing (3 new scenarios failing). The
synthetic `memoryLearningHarness88` lacked `window.document`, so three
cases accidentally exercised the deliberate nonbrowser compatibility path,
not real native code. Add a DOM sentinel only to this existing source-executed
fixture. Do not weaken native owner/data guards. The first run is **FAIL**;
a newer exact-head CI is required.


## 2026-11-15 — native signed camera-session lease across permission and capture

**Observed source gap:** `startCamera()` originally checked camera-request
cancellation but not the exact signed owner/IDB after `AudioContext.resume`,
`getUserMedia` or `video.play`. Manual shutter, automatic timer and Done
could use an old session's still-active camera after A→B sign-in or same-ID
login renewal. The new lease is bound before permission to the exact owner
object, owner ID and private IndexedDB. It is revoked by `stopCamera()`.
Late camera permissions terminate their newly acquired tracks; delayed
play cannot enable controls; active camera shutter, automatic timer and
final fallback cannot create or display old-session originals in B. Revoked
camera failures do not paint A's error into B's UI. Non-browser test
fixtures retain their prior behavior; no model change/auto closet save.

Six new native source-executed synthetic tests cover A→B during permission,
same-ID renewed sign-in during playback, replaced DB during audio resume,
valid manual original JPEG capture to review, active auto timer cancellation
after account switch and revoked Done/review. No physical phones/accounts
or genuine independent human photo annotation evidence are claimed.

**Verification at commit creation:** new exact-head no-deploy CI PENDING.
No merge/deploy/production/staging/hosted Supabase mutation; no previously
unverified physical unit or 3D eligibility is promoted. Family Alpha #255
OPEN/HOLD. Planning baseline 65%/35%, pending independent real acceptance.
