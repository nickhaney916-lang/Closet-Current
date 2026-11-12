# Mission 1 P843 — Default owner-reviewed garment admission (research-only)

**FAMILY ALPHA HOLD #255 ACTIVE — DRAFT / UNMERGED / UNDEPLOYED.** No production/staging, hosted Supabase, signed personal wardrobe, camera permissions, AI weights or separate mission branches have been modified.

## Exact immutable parent and ownership

[Main Mission 1 P842 PR #932](https://github.com/nickhaney916-lang/Closet-Current/pull/932) verified exact parent **`0de0b712f5c02feb5fc173194eec775f068f499b`** (P842 no-deploy CI [#43294490409](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43294490409): 2/2 jobs success, 310/310 native tests, 6/6 Chromium/WebKit owner review cases).

P843 is stacked on that exact source without touching sibling PRs or main. [Parallel #71 PR #933](https://github.com/nickhaney916-lang/Closet-Current/pull/933) independently replayed the currently implemented model on **13 historically development-exposed original garment photos**: Chromium category 8/13, WebKit 7/13, exact supported subtype 4/10 in each; nonclothing 3/3 rejected. These are **not blind** human-labeled test results and the remaining category/type inaccuracies are sufficient reason to prioritize owner approval instead of automatically interpreting a strong classification as ownership evidence. P843 does **not** claim to improve model accuracy.

## Intervention

- Change top-level `reviewFirst836` in the **isolated research code only** from URL opt-in to literal `true`, so no URL override, forged query string or model `strong`/estimated color is sufficient to reach automatic indexing.
- Existing `recognizeItem` continues to compute useful on-device suggestions, including category/subtype/color, and marks a pending original-image draft `requiresOwnershipConfirmation=true`. This enables the existing photo-based Adjust editor from P841: category/color required, explicit checkbox, edit revokes approval, honest `Unknown` type allowed and previously saved items remain editable.
- Existing P842 transaction gate `saveIndexed()` independently checks `reviewFirst836` and rejects direct storage attempts, even when a caller supplies complete-looking garment details and category/color.
- Uncertain/partial and risky classifications are still held; failed inference keeps an unsaved, retryable photo. No owner auto-approval and no photo metadata copied to public CI.
- This does **not** integrate sibling #71's new reentrant editor lock; that remains a distinct draft for the controller to reconcile. New research branch alone is not authorized to merge or deploy.

## Source-level validation

`tests/mission1-review-first-default-843.test.cjs` executes the literal top-level declaration and actual P842 `saveIndexed` / `recognizeItem` functions under simulated AI/store errors. Strong complete results, broad category results, unusual query params, direct storage invocation, missing color, classifier failures, and existing stored items must preserve owned-inventory boundaries.

`scripts/test-m1-review-first-default-843.mjs` executes the actual scanner and transaction code in genuine **Chromium + WebKit** at 320/390/430 CSS px using synthetic model responses and an in-memory store. Each engine/viewport verifies strong and broad category held, direct save refused, zero saved items, pending photo retained, and no page exceptions. The inherited `scripts/test-m1-owner-review-editor-839.mjs` separately verifies actual owner manual approval and successful save in the same browsers/widths.

The scoped no-deploy GitHub workflow pins parent, strictly validates changed files, runs focused and full Node regressions, research builds, and both genuine browser suites. The proof is **not physical Android Chrome/iPhone Safari**, signed-owner cloud E2E or genuine model recognition accuracy.

## Integration and release blockers

The current published/staging app is unchanged. Promotion of P843 for even four-owner Family Alpha must await independent photo recognition/instance/color acceptance; Mission 3 signed owner storage, privacy and account switching; a clean integration branch reconciling Parallel #67-#72 work; real Android/iPhone capture→review→save tests; performance; and explicit owner release approval. User experience impact: additional intentional review for every first-time scan, reducing silent wrong saves but increasing capture effort. A phone walkthrough must verify this friction is acceptable.

## Exact executable-head evidence (verified November 12, 2026)

**Verified source HEAD:** `0916c6c490ec870ec5d7fe4017c921da5763cd48`. [NO DEPLOY Actions #43298931796](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43298931796) **COMPLETE SUCCESS — 2/2 jobs**. The strict pinned P842 parent and five-path scope check passed. **8/8 focused P843 source-executed tests** and **318/318 full native Node tests** passed, zero skips/failures; normal and owner-independent research builds passed. Browser test logs prove **6/6** genuine Chromium and WebKit executions of the actual P843 scanner at CSS viewport widths 320, 390, 430: all strong predictions and category-only predictions remain unsaved; direct `saveIndexed` fails; no page exceptions. Also **6/6** P841 inherited actual editor scenarios passed in the same engines/widths: explicit user approval permits saving, missing/Unknown core values reject, editing revokes approval, existing saved items remain editable. These are browser engines with synthetic model results, **not independent photo-accuracy or physical device acceptance**.

A subsequent documentation-only report commit does not change executable code; it will trigger a fresh no-deploy job. The verified functional result above is pinned to the exact executable head. This does not establish a mobile family-trial release gate.

**No benchmark/accuracy numerator is inferred from scripted stubs. Family Alpha HOLD #255 remains OPEN.**
