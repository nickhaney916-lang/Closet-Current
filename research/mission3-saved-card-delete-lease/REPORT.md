# Closet Current Mission 3 — saved closet card deletion must stay in its initiating owner's session

**Family Alpha HOLD #255 stays OPEN.** Research-only stacked on [Mission 3 PR #1032](https://github.com/nickhaney916-lang/Closet-Current/pull/1032) exactly at parent `144506fcf5e2522d28797ac0d5d7d1a14b62860b`. No merge, deployment, production/staging changes, hosted Supabase, or private wardrobes.

## Verified source-level gap

The My Closet saved-item Delete action used the existing persisted-row CAS implementation `removeItem`, but its **caller** had an unleased `await removeItem(item.id,item)` followed by global `items=items.filter(x=>x.id!==item.id);render()`. If a prior session's callback later continued after sign-out/re-login, the continuation could act on a later owner's in-memory wardrobe, including when the new owner had an identical item ID. The catch also unconditionally displayed an old error in the new owner's interface. These are source-observed asynchronous race paths; no real-data incident is claimed.

## Change

- New `deleteSavedClosetCardOwnerSafe(item)` binds `ownerWardrobeMutationLease()` before confirmation. The exact owner/auth/epoch/DB is checked again after confirmation and after the awaited CAS deletion, before mutating UI.
- Require the exact displayed garment **object** to remain in the active owner wardrobe before deletion and before finalizing. On same-owner hydration replacing an old row object (even with the same ID), refuse to touch the replacement.
- On stale old-owner errors (including a same-ID new login), report nothing in the new session; on current-owner CAS conflict, retain an actionable reload message. Never render exception source or original-photo details.
- Keep the original destructive operation's persisted-row CAS in `removeItem`; do not widen database privileges, change backing stores, delete source JPEGs outside existing owner-confirmed semantics, or alter the legacy editor/draft deletion path.
- Saved-clothing card Delete now calls the owner-safe helper. No production toggle or new user-facing feature.

## Deterministic synthetic regression coverage

`tests/mission3-saved-card-delete-owner-lease.test.cjs` executes the **actual extracted app handler** in a VM. Twelve tests include confirmed same-owner delete, cancel, replaced card before click, account switch during confirmation, switched account before resolved/failed delete, same-ID re-login success/failure, same-owner hydration replacement, current-owner stale CAS guidance, generic private-safe error, and source wiring. Synthetic private photos and owners only.

Strict pinned no-deploy workflow inherits all prior saved garment/capture/backup/restore/Chromium/WebKit and signed disposable two-owner PostgreSQL regressions from PR #1032 and adds the new test in both offline and full native jobs. It permits only these changed paths relative to exact parent:

- `public/app.js`
- `tests/mission3-saved-card-delete-owner-lease.test.cjs`
- `research/mission3-saved-card-delete-lease/REPORT.md`
- `.github/workflows/mission3-index-refresh-owner-no-deploy.yml`

**Test status:** Do not infer exact-head CI success from the code changes alone. Verify the workflow status and logs for the final SHA before marking passing. Unit tests use synthetic contexts and do not establish actual physical-device behavior or hosted account acceptance.

## Remaining release blockers

Physical Android Chrome and iPhone Safari camera/restore/delete acceptance, authorized hosted Supabase two-account original-photo backup/restore/privacy testing, independent legally sourced real-photo recognition accuracy and human labels, genuine garment→3D fitting and honest 2D fallback, full Missions 1–3 integration and owner acceptance. No Family Alpha release until issue #255 is explicitly lifted.
