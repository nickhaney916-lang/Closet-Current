# BOARD-PRESERVE-01 — Exact native saved outfit normalizer, non-destructive compatibility gate

**Main-controller research only. Draft HOLD, NO MERGE OR DEPLOY.**

Parent: verified PR #547 E2E source at exact SHA `e3dce3658d570bc555e8027cc75c13793b857c7b` (dedicated Actions #41718209162 SUCCESS). Exact detached PR #541 owner private outfit IndexedDB donor SHA `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`. Compatible with pending native-auth research PR #550 without modifying it. No overlap with footwear #17 PR #549.

## Confirmed real source defect

Unchanged `public/outfit-board-engine.js::cleanOutfitBoard(value,closet)` removes unrecognized or now-missing saved IDs, strips `layer2` and `layer3` outerwear from *every* dress, discards donor `outfit3dId` metadata and may erase a shopping idea. The native app calls cleanup at initial read, render, reopening a saved outfit, import, and cloud-board restoration. A subsequent native save can persist the already-stripped data.

PR #541 correctly keeps missing owned references as review placeholders and supports one-piece dress plus approved outerwear/coat, with durable 3D outfit IDs. The two source formats are not safe to silently merge.

## Implementation and scope

- `native-outfit-loss-audit.mjs` calls the **actual unchanged native normalizer**, not an invented approximation; compares each current/saved original ID, outfit3dId, and ideas with its returned representation.
- Distinguishes deleted saved piece, recategorized piece, dress outerwear erasure, duplicate reference, lost 3D saved identity and lost idea. Original private board state is `structuredClone`-retained for research review.
- `createBoardPreserveReview01` uses existing account-bound donor reads, checks a verified owner and monotonic generation before and after each awaited read, and refuses stale owner session or destructive conversion. This module **does not expose database write, migration or automatic repair operations**.
- Reversible read-only source audit only. No fabric, source photo, category, user data or model geometry changes. `safeForNativeWrite` is a diagnostic of whether comparison lost anything; even true does NOT grant storage write authorization.
- Live account authentication and Supabase RLS remain unverified. This branch does not modify `public/outfit-board.js` or `public/outfit-board-engine.js` and therefore does NOT fix production UI's lossy behavior. Human confirmation and a separate approved write-path migration are required.

## Genuine acceptance

- New Node tests run unchanged native `public/outfit-board-engine.js` through node:vm, proving real data loss and no original mutation, user/session invalidation and no write authority.
- Genuine `public/index.html`, unchanged original native cleaner, donor PR #541 exact private IndexedDB adapter in Chromium and WebKit at widths 320/390/430, two synthetic owner accounts in each same-origin browser context: 12 browser scenarios/snapshots. The module must reject cross-owner reads, detect losses and preserve the original `state['outfit-board']` byte-equivalent JSON.
- All 12 original screenshot SHA-256 values verified, six independently labeled comparison strips. The temporary diagnostic overlay on screenshots is explicitly **RESEARCH ONLY**, not an app UI feature.
- Strict no-production-change GitHub Actions must PASS on the final exact head. Older inherited scope guards may reject newly added research files; do not describe those as success.

## Remaining product blockers

1. Consumer-facing native edit/save flow still strips dress jackets, coat layers, deleted/recategorized ID placeholders and durable donor outfit IDs: HOLD until explicitly authorized lossless migration / non-destructive UI merge.
2. Native auth generation PR #550 dedicated CI still queued at start of this priority; account fixture does not prove live Supabase RLS.
3. Photo-to-3D for arbitrary saved wardrobe items, photorealism, physical Android/iPhone testing and complete Family Alpha #255 are NOT approved.
4. No production app/deploy, branch merge, real cloud storage change, or unrelated apps touched.

Completion requires exact SHA, dedicated CI evidence and audited browser artifacts. Until those exist, report IMPLEMENTED / VERIFICATION PENDING, not PASS.
