# Mission 3 — saved-photo Style UI callbacks bound to initiating owner session

**Family Alpha HOLD #255 remains OPEN.** Research-only change stacked on [Mission 3 PR #1036](https://github.com/nickhaney916-lang/Closet-Current/pull/1036) exact parent `7329b25b353210a9c06452a87ba4b5e824903946`. Not merged or deployed. No hosted Supabase, production, staging, private accounts or customer photos accessed.

## Source-verified hazard

The Photo results **Get 3 outfits with this piece** shortcut and the saved My Closet **Style this piece** control asynchronously called the native private style system. Both click handlers then wrote `message(...String(error.message||error))` **unconditionally** if the operation failed, including after a sign-out or a same-ID new sign-in, potentially exposing previous-owner photo/controller details into the newer account's UI. The saved card handler also always enabled the old button in its finally block. This is a source-observed race and disclosure risk; no observed personal-data incident is claimed.

The underlying SHA-256 / owner-reviewed garment validation and style controller still own persisted private data; the new guard protects these two *caller callbacks*. No claim that a test of the wrapper proves all internal style-controller behavior.

## Fix

- `ownerStyleCardActionLease(item)`: captures the exact auth object, owner ID, private DB handle, session epoch and **displayed item object**, and checks actual signed-in state. Same-ID re-login and same-ID newer-card hydration fail closed.
- `withOwnerStyleCardAction(item, button, work)`: checks the owner lease before and after every asynchronous card action. If an operation rejects, report a **generic owner-safe message** only to the same still-valid account and connected control; never interpolate opaque errors with original photo identifiers.
- Photo results reviewed-source styling and My Closet existing reviewed/cutout styling now call the wrapper without weakening any source SHA, human confirmation, cutout restrictions, or fallback behavior. General source styling selects the captured panel, with owner checks before and after its await.
- Late old-owner callbacks cannot restore a detached/replaced UI button or write messages to the new account. No database rows, originals, model behavior, cloud backups, hosted services, schemas or release policy changed.

## Reproducible testing

`tests/mission3-style-card-owner-session-lease.test.cjs` executes the actual source of both lease functions against **synthetic signed sessions**. Thirteen cases check current completion, safe generic failures, delayed success and rejection after owner switch, same-ID re-login success/failure, auth assertion revocation, same-ID rehydration, wrong DB or signed-out user, removed button, and source-level wiring/no-sensitive-error strings.

A strict four-file exact-parent **NO DEPLOY** workflow includes the source regression suite in both pinned offline and full native jobs and inherits the PR #1036 Node, real Chromium/WebKit **desktop-emulated mobile viewport** checks, original-photo preservation/restore, and signed disposable two-owner PostgreSQL tests. **Verify the exact-final-head CI run and logs before claiming success.**

## Remaining blockers

Physical Android Chrome and iPhone Safari cameras, hosted Supabase multi-owner Auth/RLS/storage and private backup restore, legally usable independently human-labeled real-photo clothing accuracy, real garment-to-3D surface fitting and drape, end-to-end Mission 1/2/3 integration and explicit owner acceptance. Do not lift #255 or deploy.
