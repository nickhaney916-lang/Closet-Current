# Closet Current — Mission 1 P848: opt-in owner-bound garment color integrated with P847 learning

**RELEASE VERDICT: NO-GO. FAMILY ALPHA HOLD #255 OPEN.** Research-only DRAFT, UNMERGED and UNDEPLOYED. No production, staging, hosted Supabase, private wardrobes, login secrets, family photos or parallel research branches modified.

## Exact source parent and why it is compatible

- Parent Mission 1 P847 [Draft PR #957](https://github.com/nickhaney916-lang/Closet-Current/pull/957) at immutable `bb524ab4b52437f97db30ba9030c69fbcf0f4835`: [NO DEPLOY CI #43338955854](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43338955854) SUCCESS, 3/3 jobs, 369/369 native tests, 6/6 original-confirmed corrections, 6/6 saved-item consent in real Chromium/WebKit CSS 320/390/430.
- Research source Parallel #76 [Draft PR #958](https://github.com/nickhaney916-lang/Closet-Current/pull/958), at immutable `e290add6c9eb2af33eb5186d7b50bf0e4f2ed72f`: [NO DEPLOY CI #43340682558](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43340682558) SUCCESS. That PR was based on P846 and modifies only `public/outfit-capture.js`, `public/outfit-worker.mjs` plus its own module/tests/research artifacts. These two application files are **byte-identical in P846 and P847 before this integration**, permitting source-compatible import into P847 without overwriting P847's owner-consent/photo editor code.
- P848 ports only the independently tested module, outfit-capture and worker changes, and color evidence scripts/tests; it does **not merge parallel branch history**. It adds source-executed tests that actively verify P843 review-first, P844 duplicate-save guard, P845 photo receipt cleanup, P846 source-mask shoe unit ownership and P847 separate learning consent remain intact.

## What P848 implements

1. **Strict OFF-by-default experiment:** color suggestions only when `?outfitInstances840=1&outfitUnits70=1&color76=1`. No changes to normal scanner, default FashionCLIP, the legacy `public/photo-color.js` or normal clothing color entry.
2. **Non-destructive bounded masked color:** `public/garment-color-76.mjs` samples at most 1,024 already-decoded original garment pixels inside independently available selected mask, checks mask dimensions and border alpha, tolerates shadows/highlights and abstains when too small or untrustworthy. It proposes primary and optional secondary or Multicolor, never writes to the closet and never assumes the color was owner-approved.
3. **Original JPEG and exact mask receipt binding:** worker emits owner ID, request ID, SHA-256 of original input and exact selected mask. Browser independently hashes the *actual original JPEG passed to the worker*, then checks all four bindings and allowed named colors. Mismatch or abstention becomes manual review with no worker palette fallback. On-source and same-owner research advice is read-only; user must choose garment color in existing Adjust before storage.
4. **Owner confirmation and correction learning remain separate:** P847 photo-review/consent guards are unchanged, P846 paired shoe evidence remains owner-only. Suggestions cannot authorize shoe merges, title/type/color storage, field confirmation or learning; old signed scopes and cross-owner evidence never become active without current authenticated owner.
5. **Non-destructive failure:** original JPEGs/crops, unfinished drafts and owner confirmation are retained on failed/stale image/mask/owner verification. No new Supabase schema or production remote data mutation.

## Scientific evidence: why 100% Mission 1 is not yet true

Parallel #76 demonstrates constructed *synthetic* RGB/mask fixture improvements, such as dark navy no longer always classified Black and warm off-white not always White. Its 12 constructed numerical fixtures include one deliberate tiny-mask abstention; this is **not** real-photo measured accuracy. Exact lawful public JPEG SHA digests were checked as provenance but have no independent per-instance human color label or perfect segmentation ground truth. **New sealed blind human-rated garment color examples: 0**; genuine primary/secondary/multicolor recognition accuracy gain: **UNKNOWN**.

Historic independent recognition results are not a release pass. Earlier #71 source-visible 13 garment images had 8/13 Chromium and 7/13 WebKit category match, supported subtype 4/10 each; #67 supervised M4 performance worsened vs its internal zero-shot comparator on an exposed study. Do not claim 10/10 from feature tests or cherry-pick favorable synthetic improvements.

**Still blocking Mission 1 completion:**
- Independent legally licensed, source-disjoint new genuine clothing photographs with verified dual-human category/type/color/mask and physical pair-label truth (#75). Dataset custody and blind evaluation must remain independent of algorithm developers.
- #71 prospective recognition/segmentation/footwear/color accuracy, coverage/abstention and error evidence on that frozen set, plus an actual model candidate clearly better than existing FashionCLIP; no blind evaluations or threshold tuning from exposed data.
- Completed owner-review queue research (#74), cross-photo same-owned-item duplicate decision (#77) and any safe #69 mobile performance work, all integrated through independently compatible PRs and acceptance.
- Real signed two-owner private cloud/auth/backups/restore E2E across Mission 3, and physical Android Chrome + iPhone Safari camera/photo→review→one-owned-unit flow. Desktop Chromium/WebKit synthetic photo browser cases are **not** real phones or genuine authenticated accounts.
- Release hold #255 may only be lifted after independently demonstrated acceptance; do not merge/deploy without that.

## Verification

Dedicated exact-P847-parent **10-path allowlist**, full native tests+builds, actual headless Chromium and WebKit at 320/390/430 widths for #76 color binding and P847 signed-owner correction consent, P846 one-unit shoes and P844 review-save double-submit protections, and original lawful real-JPEG SHA receipt. Run frozen synthetic baseline/candidate comparison but never call it photographic accuracy.

**P848 exact-head CI: PENDING**; after passing, document the final commit/run. This report is not a license for launch or any recognition accuracy claim.
