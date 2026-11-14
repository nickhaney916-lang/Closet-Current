# Mission 3 — exact signed owner/session for normal Style original-photo preview

**Family Alpha HOLD #255 OPEN.** Isolated research branch stacked on fully verified [PR #1095](https://github.com/nickhaney916-lang/Closet-Current/pull/1095), pinned HEAD `af08726fc217578ebabada76a3809849645fc210`. This is no-deploy development only: no merges, production, staging, hosted Supabase, private owner wardrobes or physical phones.

## Audited source and source-observed weakness

The normal (flag-free) native Style My New Clothes screen uses `public/closet-stylist.js` `currentPhotoOwnerSession167()`, `signedOwnerSavedRows167()`, and `public/style-photo-preview-gate-165.mjs` to display the **real owner-reviewed saved original** in **2D only**, with SHA-256 and original-photo provenance verification.

Previous code compared `ownerId`, persisted local token `epoch`, and private database **name** before/after asynchronous JPEG digest and IndexedDB reads, but not the **actual signed auth object, IndexedDB handle or capture generation**. A same-account sign-in refresh or replacement of a private DB connection with the same name could preserve those three strings even after the operation was initiated in another session.

The original-photo preview `render()` catch also printed arbitrary `error.message` onto an attached card without proving the initiating owner session was still current, and its Save Photo (2D) preview button was re-enabled after await without an owner/session check. These are **source-verified potential state/privacy races**, not demonstrated cross-account leaks.

## Implementation

- `currentPhotoOwnerSession167()` now adds `authRef` (exact authentication object), `privateDbRef` (exact owner IndexedDB object) and `operationEpoch` (capture/session generation) to its existing signed-gate owner ID, local persisted token epoch, and private DB name snapshot.
- `signedOwnerSavedRows167()` snapshots and rechecks **all** identity fields immediately after awaited private `readAll()`. No old session may return its saved private garment rows after same-ID login replacement or DB handle rotation.
- `style-photo-preview-gate-165.mjs` carries exact identity fields through `requireLive` and `same`, so **both canonical SHA-256-verified photo** and **legacy saved-photo-unverified-original** paths reject mid-operation owner/session changes even if the user ID and token epoch are unchanged. Synthetic/legacy test interfaces that omit the optional identity fields continue to work; the actual native app always provides them.
- The preview's asynchronous catch shows only an actionable generic message **in the original still-active signed owner and unchanged card/result**, never arbitrary old-owner exception details or errors on a new login.
- The preview button's async finalizer only re-enables itself when the original owner/session, visible card and original result remain current; revoked/session-switched callbacks are silent.
- Existing original-JPEG SHA attestation, owner-reviewed flags, private source provenance, strict 2D no-fake-3D presentation, no automatic wardrobe writes, 2D fallback, two-owner RLS and collision safeguards are unchanged.

## Tests

- `tests/mission3-styled-original-photo-exact-session.test.mjs` directly executes the source-connected native Style saved-row reader through Node VM, and imports the real P165 canonical/legacy 2D photo verification module. Genuine SHA-256 is computed over **synthetic bytes**, with explicit same-ID re-login, changed auth object, replaced DB object, capture-epoch rotation, signed-out gate, private read failure, review flag withdrawal and source identity tampering cases. **Do not claim counts until actual run.**
- `scripts/test-mission3-styled-original-photo-exact-session-browser.mjs` executes the actual P165 production photo-preview source in **real Chromium/WebKit** on a secure loopback test origin at 320/390/430 mobile CSS widths. **108 planned synthetic scenarios** (18 modes × 2 engines × 3 widths) cover visible canonical/legacy 2D original proof, owner/session replacement, stale private errors/button finalizers, inventory/lock events, source tampering. No physical device or genuine personal data involved.
- `.github/workflows/mission3-styled-original-photo-exact-session-no-deploy.yml`: exact pinned-parent six-file diff gate; new source and browser tests; inherited all Mission 3 no-deploy checks, full serial Node, native original photographed clothing→owner-private wardrobe→outfit styling, disposable signed two-owner PostgreSQL/Storage RLS and browser receipts.

**Acceptance requires final exact-head green CI.** Not authenticated live-cloud, actual owner original photo evaluation, independent human-labeled 10/10 recognition, photographed-garment 3D fitting, physical iPhone/Android or release approval. Family Alpha HOLD #255 stays OPEN.

## Focused CI receipt and final-head restriction

At intermediate workflow commit `e414d5766aba887e0a85019ffa88f48d7901aea2`, [run #43536354028](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43536354028) passed its strict offline gate, actual-source SHA/private-photo owner-session tests and all **108 real Chromium/WebKit synthetic mobile-viewport original-photo preview scenarios**. The inherited serial/photo/privacy suite was still in progress when this entry was written. Because the engineering report was committed afterward, **the intermediate run is not an exact-final-head approval**; the latest commit requires its own two-job no-deploy pass. Never claim real physical phones, a live cloud, or independent photographic accuracy from this receipt.
