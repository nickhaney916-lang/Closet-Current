# Closet Current Mission 1 P850 — one-photo-at-a-time protected batch review

**FAMILY ALPHA HOLD #255 OPEN. RELEASE NO-GO.** This work is a DRAFT, UNMERGED, UNDEPLOYED research integration. No changes to production, staging, protected main, hosted Supabase, signed-in private wardrobes, any user or family photos, or concurrent research branches.

## Exact compatible predecessor and research scope

- **Pinned main Mission 1 parent:** [P849 Draft PR #964](https://github.com/nickhaney916-lang/Closet-Current/pull/964) HEAD `d6d339c30eecf9de867c5a266fb75f2f0720078d`, [NO DEPLOY GitHub Actions #43347138122](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43347138122): 3/3 jobs SUCCESS, 406/406 native tests, 6/6 original browser cross-photo compare cases, and 11/11 SHA-verified lawfully sourced public originals.
- **Parallel #74 Issue #945** defines multi-photo human review ergonomics but has **no completed, independently verified draft PR to import**. P850 builds a conservative, isolated owner-bound queue without modifying #74's workspace, modifying existing protected transaction logic or bypassing the current original-photo Adjust editor.
- P850 does not change FashionCLIP recognition, SegFormer segmentation, garment photo cropping/quality, the original-JPEG evidence, category/type/color estimates, owner corrections, P846 shoe-pair reconciliation, P847 source-bound consent or P849 cross-capture owner-candidate decisions.

## Implemented P850 behavior

1. **OFF by default, explicit user opt-in:** a checkbox on the Review photos page opens a single-photo panel. Existing full-grid cards remain available by unchecking the option or pressing **Show all photos**. The existing camera Add screen, photo cards and category/type/color adjustment stay unchanged.
2. **One unsaved original at a time:** image preview, bounded position progress, recognized category/subtype/color hypothesis and human-readable uncertainty are shown; controls are 48px minimum and fit 320/390/430 CSS px. Pending scan and shoe-unit constraints disable unsafe crop/review shortcuts.
3. **Only navigation and handoff to existing protected code:** Previous, Next, Keep for later, Review selected photo, Crop photo, Take another photo, Show all photos. **Review** invokes the existing owner-checked P843/P844/P849 Adjust, which requires individual category/subtype/color acknowledgement and enforces single private write. P850 never submits a form, automatically confirms an item, silently saves a garment, pairs shoes, links a possible cross-capture duplicate or creates correction-learning evidence. To remove, the user opens the existing Adjust and chooses its explicit Remove photo action.
4. **Skip/keep is non-destructive:** the draft remains in the existing private pending batch; skipped status is ephemeral in browser memory, never a reason to delete images or move them to a different account. There is no persistent “skip” receipt to restore; a reloaded session can review the same original again. The queue does not hold a second copy of image pixels.
5. **Owner/session/source boundaries:** `ReviewQueue850` records the live signed-owner *object reference*, checks account-bound IndexedDB name in the main controller and drops the entire queue on owner switch, sign-out or changed user object. Replaced draft objects, changed source bytes/crop and deleted saved drafts revoke skipped/current identity. Duplicated or foreign-owner draft IDs are rejected. This is owner-bound local UI, **not proof of live cloud RLS/cross-tab transactions**.
6. **Performance containment:** when enabled, the Review-page full-card grid is not built, avoiding additional large-image DOM nodes; the existing Add page remains unchanged. There are no new model requests, uploads, photo-decodes or indexedDB writes attributable to queue navigation.

## Tests and evidence interpretation

- `tests/mission1-review-queue-850.test.cjs`: source-executed 1-, 10-, 25- and 60-photo queue state/skip, deletion and source revision, owner/account change, bounded navigation and no-save invariants. No human-time or model accuracy claim.
- `scripts/test-m1-batch-review-850.mjs`: real desktop Chromium+WebKit at **320/390/430 CSS px** with generated **synthetic clothing-card SVGs**. Exercises default-off toggle, 25 draft progress, next/previous, skip while preserving 25 pending drafts, Adjust delegation with **zero** attempted wardrobe writes from navigation, crop re-render, manual removal simulation, fallback to all photos, and new signed owner rejecting the previous selection. This is a live browser DOM test, **not a physical iPhone/Android test** or real cloud session.
- Inherited actual P849 cross-capture comparisons, P848 source/mask color, P847 learning consent, P846 footwear ownership, P844 real Adjust write lock+failure retry, P843 owner review and P845 photo-quality browser tests must remain green.
- A pinned-parent strict scope no-deploy GitHub Actions workflow runs full Node tests and builds, original-photo SHA checks and real browser-engine checks. Do not upload private photographs or model embeddings into CI artifacts.

### Release blockers — do not suppress

- **Real-photo accuracy UNKNOWN:** independent source-disjoint real clothing photos with genuinely independent dual-human category/subtype/color/instance/footwear/duplicate ground truth still unavailable in sufficient numbers. Synthetic queue navigation does not improve FashionCLIP recognition accuracy or establish a 10/10 metric.
- **Human usability speed UNKNOWN:** click count, simulated DOM performance and user navigation are not independent adult/child timed usability measurements. Independent review of 10–25 genuine photos on physical devices remains required.
- **Actual device acceptance NOT EXECUTED HERE:** physical Android Chrome and iPhone Safari; camera/gallery interruption; large batches under memory pressure; verified real two-account cloud backup/restore and cross-tab restore safety; all must pass before release.
- **Atomic multi-view photo linkage NOT PROVEN:** #77 / P849 intentionally leave same-item decisions unlinked until a safe atomic owner-private cloud adapter exists.
- **Family Alpha HOLD #255 stays OPEN**; no production/staging changes, unapproved tester invitations, merge or deployment.

**P850 CI STATUS: PENDING.** The report will be amended with exact-head numerical evidence after GitHub Actions verification.
