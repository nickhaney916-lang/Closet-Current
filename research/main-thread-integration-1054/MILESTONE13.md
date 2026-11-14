# MAIN1054 Mission 4 M13 — Native Outfit Board revision/cancellation handoff (HOLD)

## Verified upstream source and race condition
The exact Research M12 adapter parent `edc486c36fe6194fa30c89690c850306ceadfe92` (draft [#1105](https://github.com/nickhaney916-lang/Closet-Current/pull/1105)) binds private photo/outfit preflight to owner, signed auth object, private database object and capture generation across asynchronous IndexedDB reads and original-JPEG SHA digests. **M12 exact-head CI was pending when this M13 branch was cut; no inherited M12 success may be inferred.**

The actual `public/outfit-board-engine.js` `cleanOutfitBoard()` accepts `currentBoard.slots` and native `name, occasion, season, audience, size, budget, layerCount, ideas`. M12 snapshots the selected slot IDs but never rechecks that input after awaiting private wardrobe reads and SHA-256 image digests. Example: a user changes selected `top:shirt` to another shirt during a pending `readOwnerItems()` or just before the final verification. The old selection could still be represented as current. This is a **source-observed acceptance gap**, not an observed real privacy leak.

## Minimal M13 research correction
- Snapshot exact native slot key/item-ID pairs and all normal board context/ideas before reading private wardrobe data. Sort slot keys to avoid falsely rejecting cosmetic insertion-order changes.
- Require strict serializable, bounded native board metadata. Reject malformed, ambiguous/repeated item IDs, cyclic/unavailable or overlong metadata. Never include JPEG pixels, token, signed auth reference, IDB connection or model scores in this revision.
- Check that original board revision still matches after each asynchronous private read, after native normalizer call, around each original JPEG SHA await and just before publishing the **unchanged 2D-only** result. This detects replacement/deletion/in-place edits to slots as well as changes in occasion, audience, budget or shopping ideas.
- Fail closed with explicit `outfit board changed during source verification` (no stale owner clothing ID handoff); never mutate or re-save originals, board, owner records or any private environment.
- Eight additional synthetic adversarial tests (first/second owner-read mutations, source swap, omitted garment, style/ideas changes, intentionally mutating normalizer, semantically identical slot insertion-order, cyclic/oversize metadata), stacked on the original 17 and M12's seven cases. Test assertion target **32 focused source tests**, *not verified until CI completes*.
- All methods still source-execute true native `cleanOutfitBoard`, real native owner index and actual JPEG digest; synthetic photographed pixels/owner sessions are fixtures. The library remains **research-only**, not wired into production.

## Branch, CI and release boundaries
Isolated strict four-file change on M12 exact commit; files restricted to `source-to-outfit.mjs`, its tests, this report and no-deploy workflow. Zero change in `public/`, photo records, 3D geometry, WebKit model worker, hosted Supabase, staging, production or sibling mission branches.

Two independent no-deploy CI jobs check immutable M12 parent/path allowlist and P880 untouched panel source, offline PWA build, 32 planned source tests, all inherited private original/source/pair/backup/wardrobe Node regressions, native desktop Chromium/WebKit 320/390/430 model owner-policy (54) and original 2D browser fallback (12). **No exact-head pass asserted until corresponding run finishes successfully.**

Mission 2's photographed 163-bone dress already has 196 strict anatomical body/cloth crossing pair witnesses at neutral and each sampled articulated pose [P2-C59 #1098](https://github.com/nickhaney916-lang/Closet-Current/pull/1098); real-photo 3D collision release **BLOCKED**, regardless of this 2D gate. Independent human-blind recognition accuracy, actual physical iPhone/Android, authorized hosted signed two-owner Auth/Storage RLS and cloud backup acceptance remain unverified.

**Family Alpha #255 remains OPEN/HOLD; DRAFT, UNMERGED, UNDEPLOYED.** No automatic model suggestions saved and no claimed end-to-end family test completion.
