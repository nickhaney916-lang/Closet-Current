# Mission 3 — Photo results Discard and Refresh must not cross account sessions

**Family Alpha HOLD #255 remains OPEN.** This independent, unmerged, undeployed research milestone is stacked on verified [Mission 3 PR #1049](https://github.com/nickhaney916-lang/Closet-Current/pull/1049) HEAD `12472bab696ca3ec006dc05a54f230982798b695`, already combining signed owner Style/Retry/Delete/bulk review and complete original-JPEG backups.

## Source-verified bug
`public/app.js` bound pending Photo results **Discard** to a per-original owner-private IndexedDB readwrite compare-and-swap but, after its `await`, unconditionally cleared global `batch`, original pending-session capture IDs, failed-draft receipts and `session`, then re-rendered. If an old owner switched to another account or re-logged into the same account ID while a pending transaction completed, this old callback could mutate the new owner's in-memory screen. Its error handler also always showed the *new owner* a misleading promise that all originals were preserved even when an old committed write's acknowledgement could have been lost. `Photo results → Refresh` used the correct signed-owner read guard internally, but its outer button handler unconditionally re-enabled a possibly reassigned new-session button after the old async read.

No actual account disclosure is claimed; these are source-observed asynchronous UI safety gaps. The durable CAS was already owner-bound; the fix protects the UI and exact source action.

## Correction
- Capture the original `ownerWardrobeMutationLease` (auth object, owner, database handle, capture epoch) before the destructive Discard confirmation and before Refresh's asynchronous read. Refuse a signed-out or mismatched private DB.
- For Discard, clone the **exact** original photo review set before consent. Refuse ambiguous duplicate IDs and a changed photo set during confirmation. Revalidate source object identity, normalized owner review contents, batch membership/order and scanner idle state inside the native CAS *and again after its awaited completion*.
- After a successful current-owner committed delete, only then clear the exact selected Photo results rows, session IDs, failed-capture markers, and redraw. If new photos/edits appear after the commit but before the callback, leave the current UI untouched and explain that the selected originals were discarded from private device storage but Photo results need refreshing.
- After same-owner transaction rejection, use an **acknowledgement-neutral** status rather than incorrectly claiming committed originals were definitely preserved. Old-owner late success, late failure and same-owner re-login never manipulate or print the newer account's UI.
- Refresh's button is re-enabled only when exact original signed auth/DB/epoch remains current and its button is still connected. The read-only `refreshOwnerDraftFromDevice` retains its existing source-integrity/unsaved-JPEG protections.

## Reproducible verification
- `tests/mission3-review-discard-refresh-exact-session.test.cjs`: **21** source-executed synthetic cases for current owner success, consent cancellation, scanner busy, duplicate IDs, changed source/owner at consent and transaction time, different-owner or same-ID re-login success/failure, uncertainty notices, new capture/edited review post-commit, source receipt tracking, and Refresh button lifecycle.
- `scripts/test-mission3-review-discard-refresh-owner-browser.mjs`: **54** source-executed cases (9 modes × 3 widths × Chromium and WebKit) using synthetic original JPEGs and auth sessions, without network access. Records a `results.json` and SHA256 receipt.
- Dedicated no-deploy strict five-file exact-parent workflow additionally re-runs inherited full serial Node suite, native Chromium/WebKit mobile viewport original-photo and recovery tests, signed disposable two-owner/PostgreSQL checks, and v3/v4 pending JPEG recovery acceptance. **Do not claim acceptance until the final exact-head CI run passes.**

## Still blocked — not release-ready
Physical Android Chrome and iPhone Safari repeated camera/PWA testing; authorized hosted Supabase two-account signed Auth, private Storage/RLS and full-cloud restore; independent legally usable real clothing recognition human labels/accuracy; genuine photo-derived fitted 3D garments and drape on both avatars; complete end-to-end integrated Mission 1/2/3 owner acceptance; explicit family release approval. No production/staging, hosted services or private wardrobes changed, no branch merged, and Family Alpha HOLD #255 remains OPEN.
