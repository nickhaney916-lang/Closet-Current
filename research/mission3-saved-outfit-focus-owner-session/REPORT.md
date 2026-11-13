# Mission 3 — saved My Closet "Get three outfit ideas" must use original signed-owner card

**Family Alpha HOLD #255 remains OPEN.** This research change is based on [PR #1043](https://github.com/nickhaney916-lang/Closet-Current/pull/1043) exact green HEAD `4a087852de9fd9c334aa1fb4784a46a35b457d4a`. **No merges, deployments, hosted Supabase changes, production/staging updates or user-private wardrobe access.**

## Source-observed correctness/privacy risk

My Closet's original **Get three outfit ideas** button was not yet covered by the two saved-photo/Style shortcuts' `ownerStyleCardActionLease(item)`. It checked `items.some(saved=>saved.id===item.id)` rather than the original card object. Across account changes, same-ID relogins or replacement saved-roster hydration, a stale handler could select a different owner's coincidentally matching ID. The error handler also wrote `error.message` directly into the current page. These are source-derived potential races, **not a claim of observed private-data leakage**.

## Fix

`focusSavedClosetCardOwnerSafe(item,button)` in the regular `public/app.js` now:

- Reuses `ownerStyleCardActionLease(item)`: exact auth object, authenticated account, live private IndexedDB handle, capture-operation epoch, actual saved item object, signed-in gate, current assertion.
- Refuses detached old card controls; re-checks lease after the synchronous `refreshStylistFocusItems()`, immediately before opening the Stylist panel, after opening the panel, and immediately before submitting the existing outfit form.
- Preserves the existing `refreshStylistFocusItems`, outfit `select`, `switchView('stylist')`, and `styleCollectionForm.requestSubmit()` behavior, including the requirement for an eligible saved-item option.
- Does **not** interpolate untrusted error text or report errors in another account. A still-current signed owner gets a generic instruction to reopen My Closet and check garment details.
- Leaves persisted originals, SHA-256 receipts, real owner review, private shoe pairing, style-controller internals, saved outfits, 2D fallback, 3D geometry, hosted services and release gate unchanged.

## Reproducible evidence

- `tests/mission3-saved-outfit-focus-owner-session.test.cjs` executes the actual owner-style lease and outfit focus source through Node VM against 18 synthetic scenarios, including current owner, other owner/same ID, relogin, stale same-ID roster, detached buttons, auth revocation, missing option/form, safe errors, and account switches occurring inside refresh, view switching, or selection.
- `scripts/test-mission3-saved-outfit-focus-owner-session-browser.mjs` extracts and executes the same production functions in **real Chromium and WebKit** browser JS environments with 320, 390, 430 CSS-pixel mobile viewports. 17 scenarios × 6 engine/viewport configurations = **102 planned synthetic browser assertions**. These are not physical phone or hosted website acceptance tests.
- `.github/workflows/mission3-saved-outfit-focus-owner-session-no-deploy.yml` strictly pins the PR #1043 base commit and limits the delta to five research paths. It requires the focused tests and inherited full serial Node, source/recovery browser checks, and disposable signed two-owner PostgreSQL evidence. Failures must remain visible.

**No test-success claim until the exact final HEAD CI passes.** A green CI run is not evidence of real-phone camera/reconnection behavior, hosted Supabase Auth/RLS/Storage acceptance, independent true-photograph recognition accuracy or authentic photograph-derived 3D reconstruction.

## Remaining Mission 3 blockers

Physical Android Chrome and iPhone Safari original-photo capture → deliberate review → private wardrobe → cloud recovery; owner-authorized hosted two-account cloud RLS/restore; completion and QA integration with Mission 1 recognition and Mission 2 3D realism; direct owner consent and release authorization. Family Alpha HOLD #255 cannot be lifted by this change.
