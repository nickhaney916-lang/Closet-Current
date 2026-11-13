# Mission 3 — Saved closet card Delete must not mutate a replacement signed owner's UI

**Family Alpha HOLD #255 remains OPEN.** Independent no-deploy research branch stacked on verified [Mission 3 draft PR #1032](https://github.com/nickhaney916-lang/Closet-Current/pull/1032), exact parent `144506fcf5e2522d28797ac0d5d7d1a14b62860b`. No production, staging, hosted Supabase, private wardrobes, merges or deployments.

## Source-verified race

In `public/app.js` the saved `My Closet` card's `Delete` callback awaited `removeItem(item.id,item)` and then, without checking the initiating login/session, filtered the global `items` array and called `render()`. It also displayed any later rejection via the globally active `message()`. The `removeItem` transaction already validated the exact saved record and owner DB inside IndexedDB (so this was NOT an unguarded cross-account durable delete). However, if a signed owner changed or the same ID re-logged in before the old callback completed, old-session UI deletion or error reporting could run against the new owner's screen. This is a source-verified race, not a claim of observed account leakage.

## Focused correction

- Capture the existing `ownerWardrobeMutationLease()` at Delete click, before confirmation. This binds the exact auth object, signed owner ID, DB handle and capture session epoch.
- Verify the current card object is still in the signed owner roster. Freeze the original saved row via `structuredClone(item)` **before confirmation**, and pass that immutable source to the pre-existing durable `removeItem` compare-and-swap, not a mutable card reference.
- Check the lease after confirmation and **after** the awaited delete, before editing `items` or rendering; remove only the exact referenced card object on a successful current session.
- Suppress all old-account and same-ID re-login error notices. A still-current owner sees the existing stale-editor reload guidance or generic deletion error. Confirmation cancellation, original photo preservation, cloud backup/restore, and existing native photo-delete protections remain unchanged.

## Tests and evidence

New `tests/mission3-saved-card-delete-session-cas.test.cjs` extracts the **real** saved-closet Delete callback and existing `ownerWardrobeMutationLease` function from `public/app.js`. Twelve synthetic, deterministic cases cover successful current-owner delete with immutable source, same-owner duplicate-ID roster reconciliation, late success after owner switch, same-owner re-login, both late failures, same-owner CAS conflict, same-owner storage error, canceled confirmation, orphaned card, signed-out page, and source guard assertions.

**Do not claim CI success until the final exact-head strict-parent NO DEPLOY workflow passes** full serial Node, browser Chromium/WebKit mobile viewport tests, native local storage, private owner backup/recovery and signed two-owner disposable PostgreSQL checks.

## Remaining mission blockers

Actual authorized Android Chrome and iPhone Safari physical testing, hosted Supabase/Auth/Storage two-owner validation, independently evaluated legally usable real clothing photos for reliable category/subtype recognition, real original-photograph garment-to-3D fit/drape, combined Missions 1/2/3 integration and owner-authorized family release.
