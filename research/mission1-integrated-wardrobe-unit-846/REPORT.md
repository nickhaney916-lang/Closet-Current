# Closet Current Main Mission 1 — P846 real-photo footwear owned-unit reconciliation

**FAMILY ALPHA HOLD #255 OPEN. RELEASE NO-GO.** Isolated DRAFT / UNMERGED / UNDEPLOYED research. No main/staging/production branch, hosted Supabase, real wardrobe, login, family photo or sibling mission changes.

## Origin and integration scope

- **Exact P845 main Mission 1 parent** `6aad19ae0705aa42e75b80583720210ce9d7e1ef`, [Draft PR #947](https://github.com/nickhaney916-lang/Closet-Current/pull/947), [NO DEPLOY Actions #43331221399](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43331221399) 3/3 jobs passed, 333/333 full Node, Chromium/WebKit mobile widths, 11/11 SHA-verified lawful original photos.
- **Sourced bounded owner-review research:** [Parallel #70 PR #928](https://github.com/nickhaney916-lang/Closet-Current/pull/928) exact verified `306813d14679196d4124a21aa8977bdf07e9bf0d`, [NO DEPLOY Actions #43288183176](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43288183176) 2/2, 313/313 native Node, 11/11 targeted and 6/6 Chromium/WebKit owner-action cases. That branch is stacked on P840 not P845; P846 **ports compatible source and tests without merging sibling history or overwriting P842–P845 changes**.
- P846 only activates pairing with **BOTH** `?outfitInstances840=1&outfitUnits70=1`. Default single-photo, whole-outfit and existing saved-item behavior remains unchanged.

## Source code integrated

1. `public/outfit-worker.mjs`: when opt-in specifically requested, computes cryptographic SHA-256 of the **original captured JPEG bytes** and a distinct SHA-256 receipt for each selected garment mask. A worker suggestion without these does not authorize new saved items.
2. `public/outfit-capture.js`: carries source, mask, crop, owner and per-region original photo evidence into **unsaved** garment drafts; reviewer can choose same-pair, keep-separate, combine fragments, reject false instance, undo grouping. No silent paired closet insert or automatic merging, even for visually similar shoe masks. Async worker identity and owner check preserved from #70.
3. `public/outfit-unit-reconciliation-70.mjs`: conservative category, color, bounds and source-identity shoe-pair candidate proposals. Orphan shoes, multiple same-looking shoes, differing types/colors and near-duplicates remain unresolved until independent user action; human confirmation is required for actual **one owned pair = one wardrobe item**.
4. `public/app.js`: integrates source-mask receipt and owner-bound admission check inside existing P845/P844 photo-based Adjust. Invalid/unresolved grouping, cross-owner evidence, repeated mask or a mask already owned in closet **cannot save**; a confirmed pair displays both real source cutouts and permits exactly **one reviewed item**. Verified pair photo cannot be silently re-cropped into a different mask and duplicate physical units are refused. Still requires explicit category/type-or-Unknown/color acknowledgement and keeps existing P844 per-dialog active-write lock / failed retry.
5. Existing P845 review-first `const reviewFirst836=true`, 256px advice OFF by default, original JPEG retention, and P844 duplicate-write safety remain. P846 strengthens automatic indexing boundary for all evidence with unit reconciliation status. The UI's old misleading “recognized items save automatically” text is replaced with an honest owner-review instruction.

## Exact tests, limitations and release decision

- Reuse unchanged #70 `tests/outfit-unit-reconciliation-70.test.mjs` and `tests/outfit-unit-worker70.test.mjs`, module and browser UI from verified PR #928.
- Add `tests/mission1-integrated-owner-units-846.test.cjs` actual-source verification of category/origin/mask/owner integrity, changed receipt, unresolved status, correct physical unit, duplicate masks across closet, source identity, review-first/no-auto-save.
- Add `scripts/test-m1-owner-pair-admission-846.mjs` to execute actual P846 Adjust DOM in **genuine Chromium and WebKit at 320,390,430 CSS px**, with synthetic in-memory photographs and deferred storage: unresolved pair, cross-owner, already-saved companion masks all blocked; correct owner-approved pair yields **one** saved item with both component receipts retained, even after repeated submit. No physical phones, private photos, actual hosted Supabase or real model inference in these DOM tests.
- Dedicated strict **NO DEPLOY** workflow pins P845 immutable parent, 13-file changed-path allowlist, full Node suite/builds, #70 original unit worker and UI browser tests, inherited P845/P844 review and photo-quality tests, original 11 SHA-verified real-photo diagnostics **for description only**, not validated pair/category/color ground truth.
- Family Alpha remains HOLD #255. The validated synthetic source/unit mask receipts and conservative review logic do **NOT** prove actual Mask IoU, shoe-pair identification accuracy on independently human-marked real images, owner-approved real phone capture, 10/10 recognition, original-photo 3D fabric fidelity, or production readiness.

## Remaining completion blockers

- Actual blind independent human garment, color, mask and physical owned shoe-pair labels in new source-disjoint real originals (#75).
- Demonstrated model improvement vs current FashionCLIP and zero-shot fashion classifier on those new blind originals (#67/#71). Prior M4 small supervised baseline worsened category and subtype; do not promote.
- Integrate separately reviewed #72 owner learning, #74 batch review and #69 worker performance into one protected Mission 1 branch after compatibility checks.
- Actual signed two-owner cloud/restore isolation and Android Chrome/iPhone Safari physical capture→review→private closet end-to-end tests (#3 and real device QA).

**NO-GO** to merge/deploy or lift Family Alpha HOLD. No percent or 10/10 claim.

**P846 CI STATUS: PENDING executable-head verification**.
