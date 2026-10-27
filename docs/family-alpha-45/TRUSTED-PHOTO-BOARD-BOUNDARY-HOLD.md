# Closet Current #45 — verified private wardrobe original-photo boundary (HOLD)

**2026-10-27 • Work #43 integration assistance / independent account-source security verification • NOT a new app feature**

## Verified problem

Work #42 [draft #345](https://github.com/nickhaney916-lang/Closet-Current/pull/345) has a legitimate attractive-but-**REVIEW** original-photo outfit board. Its policy checks source SHA and account/session, but its own README says the *caller* supplies `ownerId`, `sessionId`, and `trustedSourceSha256`; self-asserted values are not authorization. Work #43 owns integrating that research with existing 3 recommended looks, garment swaps and favorites; this branch **does not modify any UI, Work #42 code, Outfit Builder, account login, storage schema, cloud sync or 2D fitting**.

This QA branch adds `research/family-alpha-45/trusted-photo-source-boundary.mjs` as a reusable read-only, fail-closed source-handoff reference for Work #43.

## Actual, trustworthy source flow

1. Obtain current app-owned signed-in context (same `authenticatedUserId`, `currentUserId`, `cloudOwnerId`, database identity and session generation already checked in protected #344/#346).
2. Call the existing `verifyAlphaAuthUser` equivalent through a supplied `verifySession` provider. The QA tests use a synthetic stub, **not real JWT verification**.
3. Ignore any caller-provided owner/hash/image/visual-approval fields in the outfit. Accept only known slot names and distinct canonical saved garment IDs.
4. Read **the saved garment row by ID** in a readonly `items` IndexedDB transaction on the exact authenticated user's private database; never trust a UI-owned array or a display cutout.
5. Use `recognitionPhoto.image` when available. For a multi-item `outfitSourceId`, **reject** if the original unmasked garment crop is missing rather than silently reusing `item.image` (which may be clipped/AI-restored). For ordinary single garments, `item.image` is the source.
6. Require small, well-framed **JPEG data URIs**. Recompute SHA-256 from actual stored JPEG bytes, not a hash supplied by an outfit request. Package those bytes into a local `Blob` for Work #42. Item metadata, source hashes, and returned list are frozen.
7. Reconfirm owner, database handle, session generation and wardrobe-revision token at every async boundary and after authenticated session verification. Expose `invalidate()` so real app owner/logout/wardrobe mutations explicitly revoke earlier snapshot `getContext()`. A matching original SHA alone cannot establish authorization.

This bridge **does not automatically catch a same-session database mutation by an unrelated code path**: Work #43 must call `invalidate()` on garment edits, swaps, deletes, import, restore and account events, and use the actual app's authenticated database for `getDatabase` and certified `verifySession`. Until then, it is a *testable reference contract*, not deployed or integrated.

## Evidence, limits and restrictions

- Work #42's `research/work42-presentation/policy.mjs` was copied byte-for-byte from PR #345 exact `61cf651e6b18b0f82c1242a7017e73c85e685128`; GitHub Actions validates identity with immutable `git show | cmp`.
- Synthetic `fake-indexeddb` tests check genuine saved row and SHA, multi-item original source crop, forged owner/hash/approval, changed account/session, readonly absence of new writes, bad JPEG/PNG/remote URLs, duplicate/swap IDs and stale wardrobe revision.
- A `PHOTO PREVIEW` decision is only an honest original-photo presentation for the caller; it is **not** a human visual PASS, an approved worn avatar, a recommendation engine, or proof of live staging RLS. No user photos or server network calls.
- Other work remains independent: Work #43 integrates the UI; Work #42 source board is grade REVIEW; Work #41 worn compositing FAIL; Work #37/#38 fitting/isolation incomplete. Real four-user live JWT privacy, owner visual approval and physical phones are not verified.
- **No deploy, merge, staging/production change, Auth/provider settings, account creation, spending, real family photos or Drive Duel changes. Family Alpha HOLD.**
