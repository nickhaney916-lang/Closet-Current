# MAIN INTEGRATION-11 — independently source-verified clothing corrections + actual Style My New Clothes

Research-only isolated integration. **No production changes, no merge/deploy, Family Alpha Issue #255 HOLD.**

## Exact immutable parent and sources
- Parallel #23 STYLE-OWNED-LIVE-03 PR #566 original pinned SHA `120d2b2640b02c4870c20557e0d3e565a320bdf7`. This build uses an isolated snapshot; it does NOT change #566.
- Main correction #565 verified green SHA `f3bf920ef95c35d2b990dd2a852c20d9a9f71c5e`, dedicated run #41771009274 SUCCESS; correction source module, unit test, real browser and audit are copied without rewriting original JPEG donor data.
- Actual original clothing photo `benchmark/fixtures/commons-0002.jpg` exact CC BY-SA SHA `fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667`. Original-byte protections from PR #545/562 untouched. Original photographed 163-bone anatomical preview donor PR #541 unchanged.

## Cross-feature problem now blocked
Native saved wardrobe corrections previously used unconditional IndexedDB PUT, and human edits could overwrite a concurrent tab or wipe source metadata. Main PR #565 corrected these with owner/private complete-record CAS, actual JPEG hash verification, review status on saved outfits, and mobile Save/Cancel controls.

A more subtle problem appears once the user starts **Style My New Clothes**: if an actively pinned top is reclassified from **Tops/T-shirt** to **Outerwear/Jacket**, the original source SHA remains unchanged, but the *outfit eligibility does not*. A previously generated three-owned-looks proposal or unsaved style draft could otherwise be saved using the stale category. Integrator #11 adds a source/photo/category/owner roster signature and revalidates slot compatibility; any new human correction invalidates old style proposals. It **does not silently discard unsaved drafts**: the native CAS draft remains visible, but swap/undo/save are blocked until the user deliberately Cancels and regenerates. Reverting the category restores eligibility and three distinct real owned outfits without rewriting saved outfits or original JPEG source. The default app URL and production path remain untouched.

## Actual test plan
- Existing STYLE-OWNED-LIVE-03 real native app Chromium+WebKit 320/390/430: original licensed imported red photo, user verified Tops/T-shirt/Red and one-item source confirmation (session-only), three complete owned outfits, pin/swap/undo, lossless native BOARD04 CAS save/reopen, v4 backup/recovery, owner A/B isolation, 51 screenshots.
- Existing CORRECTION10 actual source editor Chromium 320/390/430: original SHA, category change and reversal, no overwritten saved original, stale concurrent tab guarded, authentic 163-bone read-only WebGL 42 screenshots.
- New INTEGRATION11 real native app Chromium+WebKit 320/390/430: same source and styling flow, **in-progress unsaved styled outfit**, recategorize original source Top to Jacket through real My Closet UI, private wardrobe index auto-refresh, preserved unsaved CAS board and original JPEG ID, refuses stale style save without altering any saved outfits, shows original **Review category** in actual builder, user cancels, reverts category to Tops, three outfits are again genuinely selectable. 60 SHA-audited mobile screenshots (51 inherited + 9 real cross-feature). Includes 3 stitched before/during/after 320/390/430 galleries.
- Full tests: Node suite, original native backup and WebKit, 163-bone source donor worktree, genuine inherited current mobile 3D, photo readiness, source preservation and fixed 15-photo benchmark. Dedicated locked workflow forbids unrelated files, no deploy.

## Honest remaining limitations
Research UI uses synthetic Supabase auth HTTP responses with owner-private browser IndexedDB; no real signed two-account Supabase RLS or physical Android/iPhone hardware approval. Single-garment review is explicit and session-only; no arbitrary multi-garment image is auto-approved. The original 15-source benchmark remains 0 newly approved 3D Ready. Photorealistic shirt fitting PR #564 and multiple garment separation PR #567 stay independent. Production/Family Alpha remain **HOLD** even when dedicated Actions succeeds. Exact final HEAD green CI and independent screenshot inspection required before describing this integration as completed.
