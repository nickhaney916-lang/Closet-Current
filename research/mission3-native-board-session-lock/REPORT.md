# Closet Current Mission 3 — clear private native Outfit Builder immediately at session lock

**Family Alpha #255 OPEN/HOLD — research-only, isolated draft, unmerged, no-deploy.**

## Exact source baseline
Parent: [Mission 3 verified PR #1086](https://github.com/nickhaney916-lang/Closet-Current/pull/1086), exact `1f381ddbf9cb43e4a525f746c258c3e5f850db68`, [GitHub Actions #43531173505 green](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43531173505), 1,994 / 1,994 serial Node tests and 66 / 66 new native mount Chromium/WebKit synthetic owner-session cases, plus signed two-owner disposable PostgreSQL RLS, original JPEG recovery and photo-to-private-2D outfit checks. No other mission branch modified.

## Verified source-level gap
- In `public/outfit-board.js`, the pre-patch `window.addEventListener('closet:session-locked')` handler canceled its autosave timer, cleared draft conflicts and hid retry controls but did **not** scrub the research-only `nativeLossless04=research` viewer's `currentBoard`, `savedOutfitBoards`, editable board name/size/occasion fields, saved-photo thumbnail grids, preview dialog, status string or optional private research viewers.
- Previous PR #1086 correctly fences late native controller callbacks and disposes late optional dynamic mounts; without synchronous screen clearing, however, the **last valid** old-owner view could remain in the DOM and cached page controller at lock, potentially reappearing after an account switch. This is a source-observed risk, not an observed user-data incident.
- [Independent PR #1083](https://github.com/nickhaney916-lang/Closet-Current/pull/1083) also identified basic session-lock clearing on its own overlapping `public/outfit-board.js` branch. Rather than overwrite PR #1086's more complete native mount and optional viewer guards, this patch adds the needed synchronous cleanup on top of the exact verified PR #1086 source.

## Change and safety
Inside the existing **synchronous** `closet:session-locked` event, only when the explicit research-only native mode is on:
1. Retire `nativeLossless04` before invoking any controller `dispose`; even a disposal-time late `onChange` or `onStatus` now fails the exact controller lease.
2. Reset the current outfit to an empty clean draft, clear saved outfit roster, synchronize visible form values, empty source photo/render/suggestions grids, and close preview dialog.
3. Clear and safely dispose cached private 3D, source-readiness, Style, mobile-comfort and native BOARD04 bridges independently, including when any `dispose` throws.
4. Replace any residual private status with a static generic signed-out message. Never reveal raw exception text. No change to private IndexedDB, original JPEG source identities, cloud backup, CAS, owner confirmations or normal non-native Outfit Builder.

## No-deploy acceptance
- Strict exact-parent five-path allowlist in `mission3-native-board-session-lock-no-deploy.yml`, new production-source VM tests, and 66 controlled Chromium/WebKit browser test scenarios over CSS widths 320/390/430 plus original screenshots/JSON receipts. Source tests verify mandatory synchronous field clearing, independent disposals, idempotence and no storage writes, as well as cross-owner and same-ID replacement.
- Inherit the complete PR #1086 full serial Node suite, authentic original JPEG/photo acceptance, native outfit/pending photo safeguards, and disposable signed two-owner PostgreSQL/Storage RLS. **No combined result may be called PASS until both exact-head CI jobs complete successfully**.

## Unresolved release blocks
Physical Android Chrome/iPhone Safari acceptance, authorized live signed hosted Supabase/cloud privacy acceptance, independent genuine-photo garment-recognition accuracy and authentic photograph-derived fitted 3D remain BLOCKED. No production, staging, hosted cloud or private wardrobe touched; no deployment or merge. Keep Family Alpha #255 OPEN/HOLD.
