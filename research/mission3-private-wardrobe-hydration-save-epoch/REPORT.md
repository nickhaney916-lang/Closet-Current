# Mission 3 — Owner-private startup hydration and delayed saved-clothing write isolation

**Immutable verified parent**: draft PR #908 HEAD `fcfe88b69a929fab0e175ea1c5fa311c2143a149`. NO DEPLOY Actions #43156993822 completed green: full serial Node **1,568/1,568**, Chromium/WebKit synthetic browser at 320/390/430 CSS widths, signed disposable PostgreSQL 17 RLS. Parent and candidate remain unpublished under Family Alpha HOLD #255.

## Source-level privacy defects

1. **Delayed initial wardrobe hydration.** The app formerly assigned `db=connection`, then assigned `items=(await readAll()).map(...)` before rechecking the authenticated account. If an old owner's IndexedDB `getAll()` finished after signout, its clothing photos could overwrite new-session shared `items` before the auth assertion and, on error, render the old roster. Its later `readDraft()` also selected a mutable global `db`, allowing old and new owners' startup data to mix after an account transition.
2. **Delayed garment edit/save.** `savePiece(value,nextBatch)` entered an asynchronous work queue and awaited original JPEG verification. It then opened `db.transaction(['items','state'])` against the mutable global DB, without binding the initiating authenticated account/session/DB. A former owner's editor save could write into another account's currently active private local wardrobe if signout occurred before its queued work or verification settled. Its completion and index refresh could also report success to the new owner.

## Implementation

- `readAll(ownerDB=db)` and `readDraft(ownerDB=db)` accept an explicit frozen owner-DB handle, keeping existing callers backward compatible.
- Startup `closetReady` captures the initiating auth object, signed owner ID and monotonically increasing capture/session epoch. It opens and reads **both** private stores from the same connection, verifying the session after each `await`. Only after the full roster and draft are ready and still authorized does it publish `db`, `items` and `batch` to the interface. It closes abandoned connections and suppresses old-owner error UI/recognition scans after revocation.
- `savePiece` captures the initiating auth identity, signed owner, DB and epoch; validates before work, after async SHA verification, before transaction start, at IDB transaction completion, and around native index refresh. It binds the transaction to the **original** DB rather than a new owner's mutable global, and preserves the optional separately CAS-protected correction path.

## Reproducible acceptance

New actual-code extraction: `tests/mission3-private-wardrobe-hydration-save-epoch.test.cjs`, 10 deterministic tests:
- Old owner source verification awaiting while new owner signs in with identical ID/JPEG.
- Prior owner's queued save starting only after signout.
- Same owner ID re-login epoch revocation.
- Old IDB commit completing after a different owner signs in.
- Normal same-owner atomic saved garment and draft, with subsequent native index refresh.
- Nothing writes before SHA verification finishes.
- Old startup items.getAll completing after account switch.
- Old draft store read completing after account switch.
- Same owner ID re-login revokes old startup.
- Normal local saved roster + unfinished review draft restore.

Dedicated strict diff-scope NO DEPLOY GitHub Actions runs source-extracted tests **against immutable parent with known-bad expectations** and against the patched app with safe expectations, then full Node, disposable signed PostgreSQL JWT/RLS, and actual Chromium/WebKit synthetic mobile at 320/390/430. Status **pending final exact-head GitHub Actions**.

## Restrictions and remaining acceptance

**DRAFT, UNMERGED, UNDEPLOYED. Family Alpha HOLD #255.** No modifications to Supabase Auth/Storage, hosted accounts, actual garment/user photos, protected main, existing staging/production or model weights. Runtime proof is local synthetic data; actual iPhone Safari and Android Chrome camera/restore behavior and hosted authorized two-account Supabase remain unverified. Independent real-garment category/color/segmentation and photographed-clothing-to-3D accuracy remain separate release blockers.
