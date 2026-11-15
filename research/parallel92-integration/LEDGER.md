# Parallel Assignment #92 — Immutable Mission 4 acceptance (HOLD)

Tracking: [#1215](https://github.com/nickhaney916-lang/Closet-Current/issues/1215); controller [#1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054); Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) remains OPEN/HOLD. This is independently owned **test code only**; no app/owner/cloud/production changes.

## Frozen exact source

- Mission 4 [#1210](https://github.com/nickhaney916-lang/Closet-Current/pull/1210) baseline `3f456c893643e071aa3dd37acc6d766479a285df` on `research/main1054-m58-real-p88-browser-worker-HOLD`. New P92 native acceptance script refuses modifications to pinned consumer, research data contract, and pre-existing test source blobs. Test workflow explicitly checks out actual SHA, never GitHub's synthesized PR merge ref.
- Native `public/outfit-board.js` stores `currentBoard.slots` with saved `item.id` values, and persists `outfit-board` state. A speculative adapter with `items: [{accountId,...}]` does not represent this native shape.
- `public/app.js`: native manual `savePiece` and automatic `saveIndexed` use owner/session/source and durable IndexedDB controls, prevent duplicated originals sharing SHA or original image despite distinct displayed crops. Saved source fields include `ownerId`, `sourceSHA256`, `originalPhoto.image`, `originalPhoto.sha256`, review/crop status, source and row identity.
- `research/main-thread-integration-1054/source-to-outfit.mjs` owner/private source preflight returns **2D only**, `renderAuthorized3D:false`. Model or synthetic owner review never independently establishes physical garment geometry.
- Real M58 source browser test is already genuinely integrated: actual pinned P88 browser WASM model on legal public original, **unverified region proposals with zero automatic saves**, separate *synthetic* human-approval action through native review/crop and save, actual native Outfit Builder saved ID, source-safe original 2D, v4 export/restore/tamper/rollback, A→B→A, actual source rehash. This is ONE existing uninterrupted local synthetic-owner browser journey, and P92 runs it unmodified.
- M51 native separate Chromium/WebKit 320/390/430 JPEG 2D, original owner source and denied B; native two-IDB-writer duplicate-source test; native v4 six cross-engine import atomic-recovery cases; P91 IDB/document-navigation guard. These are distinct supplemental regressions, not additional proof of blind category accuracy or actual cloud/phones.

## Current compared donor heads (inspection at assignment start)

| Donor | SHA | Relative to M4 |
| --- | --- | --- |
| M1 [#1175](https://github.com/nickhaney916-lang/Closet-Current/pull/1175) | `bec1ae8eba2a3979ec0581cb93a91b1ec3ad231c` | diverged; `public/app.js` touched |
| M2 [#1177](https://github.com/nickhaney916-lang/Closet-Current/pull/1177) | `569a1b90780ab25651b6c9adf98cc1b078b501c0` | diverged; `public/app.js` touched |
| M3 [#1135](https://github.com/nickhaney916-lang/Closet-Current/pull/1135) | `4d9a28bba60c7f17f934848fc36d4bd478ffea55` | diverged; `public/app.js` touched |
| P91 [#1214](https://github.com/nickhaney916-lang/Closet-Current/pull/1214) | `9b353a5099c018cc252f17ae43ba8a02af314f7c` | direct +1 commit; 3 test/workflow paths |
| P90 [#1206](https://github.com/nickhaney916-lang/Closet-Current/pull/1206) | `63151a04a03f330bee683bdaf3c2d117a759cb0f` | diverged viewer research |

No donor is cherry-picked. M1/M2/M3 `app.js` conflicts must be individually audited by main; P91 final fix is not present in base, and remains its separate draft. P90 authentic source-verified 163-bone viewer remains **separate research**, not this photo-to-3D integrated acceptance.

## How to run / strict acceptance

No hosted Supabase, private accounts/photos, paid AI, or deploy. Install the exact pinned dependencies from the workflow and run:

```sh
P92_CHECKOUT_SHA="$(git rev-parse HEAD)" P92_ENGINE=chromium P92_TRIAL=1 node scripts/test-parallel92-exact-head.mjs
P92_CHECKOUT_SHA="$(git rev-parse HEAD)" P92_ENGINE=webkit P92_TRIAL=2 node scripts/test-parallel92-exact-head.mjs
```

CI runs **trial 1 then trial 2 sequentially in fresh browser processes on the SAME checked-out SHA for each engine**, plus the complete serial native Node suite after offline build. An absent or failing upstream actual model, an IDB commit issue, navigation error, owner source mismatch, cross-owner photo leakage, duplicate SHA, invalid/tampered backup, bad rollback, untrusted 3D admission, omitted viewport or unexpected outbound request is a failure. Do **not** turn failed assertions into skips. Each `benchmark/parallel92/<engine>/trial-<n>/receipt.json` is created only after all required checks succeeded; CI archive includes **safe JSON only**. Never claim two passes until exact-head run and job receipts are verified.

| Step | Verification mechanism | Truth boundary |
| --- | --- | --- |
| Actual native original JPEG and real P88 worker | M58 real browser WASM/Source SHA and no-auto-save JSON | Model proposal is UNVERIFIED |
| Owner edit, private save, saved wardrobe and Outfit Builder | M58 actual app synthetic-owner action, durable ID, saved outfit | Explicit simulated approval is NOT independent ground truth |
| Original-photo fallback, no unverifiable 3D | M58 same-session 2D + M51 320/390/430 per engine | Fitted 3D NOT approved |
| Owner A→B→A, JPEG tamper/refusal and recovery | M58 original native UI, P91 lifecycle | Local auth fixture, NOT hosted JWT/RLS |
| v4 export/import/cancel/tamper/rollback | M58 same-session + six M3 Chromium/WebKit cases | No full live cloud receipt |
| Concurrent identical source crop/auto/manual saves | Main native 2-writer real IDB browser regression | Synthetic sources/owners |
| Native build and full Node regressions | Offline Node CI job | Test results are not release |
| Real physical phones / 4 hosted signed accounts / independent blind labels / full layered garment 3D | **BLOCKED** | Separate authority required |

## Integration handoff

The main #1054 controller may **selectively copy this test-only P92 commit** into a newer main M4 integration branch after exact-SHA re-audit. If consumer code changes, update pins only after reviewing new source and rerunning tests; do not loosen security/identity/3D or owner-receipt assertions merely to produce green CI. Preserve Family Alpha #255 HOLD, and do not merge/deploy.
