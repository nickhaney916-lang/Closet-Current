# Mission 3 — native saved-wardrobe index refresh must not cross private account sessions

**Family Alpha HOLD #255 stays OPEN.** This is a no-deploy, unmerged research PR stacked on verified [Mission 3 PR #1026](https://github.com/nickhaney916-lang/Closet-Current/pull/1026) HEAD `ddd7f48bbe2bcfc6c472676d5dd6292eeb50720a`.

## Source-level risk

In `public/app.js`, `nativeIndex07Refresh` starts an asynchronous post-commit wardrobe indexing operation. Before this fix, the function **did not bind itself to the invoking owner session**. Once the bridge resolves, it fetched the then-global `styleOwnedLive03Bridge` and might refresh a newer owner's outfit screen. On failure, it unconditionally wrote `boardSaveStatus`, including arbitrary `error.message` details that could belong to the previous owner's JPEG/source. These were potential races found directly in source; no actual account leakage is claimed.

This happens *after* the original saved garment already committed. Returning to the caller's `assertLease` alone is not enough to prevent UI mutations and dispatch already performed inside the stale index refresh.

## Change

- `nativeIndex07Refresh` captures the exact `window.closetAuth` object, owner ID, owner-private IndexedDB handle, and `captureOperationEpoch` **before** starting the bridge.
- If the lease is absent, it starts no bridge. After each await, recheck exact owner/session/DB before touching a style viewer or dispatching inventory-committed events.
- Suppress errors and status messages from old sessions, including same-ID re-login. For a valid current owner, retain a generic actionable safe-reload notice **without untrusted error text**. Do not report a false "saved" state when the caller's primary database transaction failed.
- Preserve no-flag behavior and normal same-owner refresh; do not touch original JPEG, wardrobe records, cloud code, login, or database schema.

## Synthetic repeatable tests

`tests/mission3-native-index-refresh-owner-fence.test.cjs` extracts the real function from `public/app.js` and runs it in a minimal VM with fake signed owners/controllers, without rewriting production logic. Ten tests cover: normal same owner; old native bridge completion and owner switch; stale failed bridge error; same-ID login revocation; generic current-owner failure; switch during style refresh; absent/mismatched owner; valid no-style fallback event; disabled research flag; source-level exact lease assertions.

**Release evidence requires an exact-head SUCCESS of the new no-deploy GitHub workflow**, including full serial Node regression, source tests, Chromium/WebKit at mobile CSS widths, and ephemeral signed two-owner/Postgres checks. Do not claim validation until logs confirm.

## Remaining blockers

Physical Android Chrome and iPhone Safari, independent legally acquired human-reviewed real clothing images and accuracy, hosted cloud Supabase two-owner recovery/privacy, source-derived fitted 3D fabric and drape, end-to-end Missions 1/2/3 integration, explicit owner approval. Keep Family Alpha HOLD #255 active.
