# Mission 3 — failed source-JPEG retry must stay in its originating signed session

**Family Alpha HOLD #255 remains OPEN.** Research-only stacked on [Mission 3 PR #1039](https://github.com/nickhaney916-lang/Closet-Current/pull/1039) at pinned parent `9439e9afd757075a2a445a6bfeac581f408a7469`. No merges, deployments, production, staging, hosted Supabase, private accounts or customer photos.

## Source-verified gap

The visible **Retry saving photo** button was presented only after a required original-photo IndexedDB draft commit failed. The retry did re-hash the original source JPEG and check the owner ID/private DB, but its caller unconditionally set the button back to enabled and printed `String(error.message||error)` whenever `item.ownerId===captureProofOwner()`, including potentially a newer same-ID login. The *internal* post-commit path also checked account identity by ID and DB rather than the auth-object identity and session epoch before writing a global `render()` and successful-save `message()`.

The existing native `candidate(... requireDraftCommit:true)` and per-photo IndexedDB CAS transaction remain authoritative. This change addresses only the missing exact-session checks around that transaction and its UI notifications. No actual cross-account loss or disclosure is asserted.

## Fix

- `retryUncommittedCapture(item)` now binds the initiating signed auth object, owner-private DB, owner ID, and `captureOperationEpoch` before any async photo module load, SHA verification, or required photo-draft transaction. It rejects old sign-ins, including a new login with exactly the same owner ID, on each existing preflight and post-commit guard. A revoked current auth assertion is also treated as stale.
- `ownerFailedPhotoRetryLease(item)` retains the original visible item object and signed owner during retry. It requires visible signed-in state and the same pending photo instance, never just a matching ID.
- `retryFailedPhotoFromCard(item,button)` wraps the existing button with exact-owner checks. Late revoked-account completion/error may not mutate the new owner's controls, render its gallery, or interpolate a private error. Current failures receive generic useful instructions and **never imply the photo has been saved**.
- Preserve the original JPEG, source SHA-256, `verifyStoredCanonical`, `requireDraftCommit:true`, explicit owner review, photo-by-photo persistence, quota handling, and Family Alpha hold. No model or cloud schema changes.

## Test evidence

1. `tests/mission3-photo-retry-exact-session-lease.test.cjs`: 14 source-executed synthetic cases including valid retry, genuine re-hash preflight, current error sanitization, old-account and same-ID re-login before module completion, old-owner completion of candidate, revoked auth, same-ID rehydrate, wrong DB, JPEG identity mismatch, detachment and verification refusal.
2. `scripts/test-mission3-photo-retry-exact-session-browser.mjs`: production callback source executed within Chromium and WebKit browser contexts at 320/390/430 CSS-pixel mobile viewport widths. Ten synthetic modes × six browser/viewport environments = **60 planned cases**, with a machine-readable `results.json`. These are not full-application or physical-phone tests.
3. Strict exact-parent eight-file no-deploy GitHub workflow plus inherited serial Node, native browser, local IDB, source SHA-256 and disposable signed two-owner PostgreSQL checks. The inherited PHOTO122/PHOTO123 tests now assert the safe signed-owner Style contract rather than outdated inline callback strings, and the inherited private-photo retry VM fixture now provides a real synthetic auth object and session epoch as required by the source.

**Do not claim final exact-head SUCCESS or 60/60 until actual workflow jobs and receipts pass on the final SHA.**

## Remaining Mission 3 release blockers

Real Android Chrome/iPhone Safari original-photo capture and failure recovery, authorized hosted Supabase two-owner Auth/RLS/private Storage recovery, independent legally usable labeled clothing-photograph recognition evidence, genuine photograph-to-3D garment fit and drape, integrated Mission 1/2/3 QA and explicit release approval. HOLD #255 stays OPEN.
