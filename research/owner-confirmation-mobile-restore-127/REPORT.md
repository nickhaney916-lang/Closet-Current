# Closet Current — Priority #127 / OWNER-CONFIRMED-MOBILE-RESTORE-127

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · NEVER MERGE OR DEPLOY production or existing staging.**

## Baseline

Pinned exact green P126 draft [PR #681](https://github.com/nickhaney916-lang/Closet-Current/pull/681) commit `c69681a6d45c5b3c5492a9a5a8d2c669f116a394`, [GitHub Actions #42330717743](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42330717743), 1,133/1,133 full Node and 6/6 actual Chromium/WebKit 320/390/430 mobile-viewport app workflows with 75 screenshots. P126 cryptographically verified both original and distinct cutout JPEG bytes before a pinned atomic owner-private V4 restore.

## Concrete priority and security defect

The research-only native `createNativeRestore01.importBackup` bridge called `confirm({...})` synchronously and tested its truthiness. A genuine asynchronous UI confirm function returning `Promise<false>` would be **truthy**, allowing it to proceed to `restoreOwner01(..., confirmed:true)` **even though the owner's decision resolves to no**. Likewise, an object `{approved:true}` could accidentally count as a confirmation. Existing leases checked before and after the confirmation *call*, but not after the actual asynchronous consent decision.

After an atomic save, `await onRestored()` could yield to a logout/owner change before the unconditional cloud dirty notification. Without a final owner lease check, this may notify another account's cloud coordinator. We explicitly do not claim post-commit rollback after a session change; data is atomic and the private view must be invalidated.

## Actual implementation

Only the existing research `research/restore-atomic-01/native-restore-bridge.mjs` changes:
- `const approved=await confirm({...});` and accept **only** `approved===true`; `false`, resolved-false Promise, arbitrary truthy objects/strings or no approval are cancellations with zero data writes.
- Recheck active authenticated owner, native auth epoch, IndexedDB account, no dirty outfit, and closed 3D preview **after** awaiting confirmation and before calling the independently double-JPEG-verifying P126 CAS restore.
- After atomic restore and `await onRestored()`, **recheck the live owner/session lease before calling `win.closetCloud?.changed?.()`** so a post-commit logout cannot notify a new owner's synchronizer. Restore completion that has already committed remains atomic, but stale presentation/notification is denied.

No modifications to public application/default UI, production or staging, native cloud server, P126 original/cutout byte verifier, model/segmentation, humanoids or other projects.

## Independent Node bridge test

New `tests/owner-confirmation-restore-127.test.mjs` uses genuine licensed original JPEG bytes and a separately re-encoded cutout with independent actual SHA-256, a real P119 owner-reviewed atomic IndexedDB private save, and the genuine research `createNativeRestore01` import bridge with a controlled native AUTH01 session fixture. Positive tests accept asynchronous explicit true, preserve both JPEGs + review provenance and saved outfit references and trigger one local cloud-dirty notification. Negative tests reject async false, arbitrary truthy nonboolean results, owner change during pending confirmation, token rotation during pending confirmation, changed visible 3D preview, and ensure a logout during asynchronous `onRestored` **suppresses the cloud notification** even though an already-committed atomic restore cannot be undone. This tests source and flow, not real signed JWT/RLS or real cloud.

## Independent real app browser/mobile-viewport verification

New `scripts/test-owner-confirmation-mobile-restore-127-browser.mjs` derives from the exact verified P124 real-app native mobile test while adding **three fresh evidence screenshots per viewport** and active P127 checks. It runs real Playwright Chromium and WebKit touch/mobile-style viewport cases at **320/390/430 CSS px** on the actual `public/index.html` and full native `public/app.js`, existing auth/camera/save/Style/BOARD04/RESTORE01 logic. The synthetic authentication HTTP endpoints and offline cloud stub remain explicit; local WebCrypto and IndexedDB are real browser implementations.

Each of six browser scenarios imports an independently licensed JPEG using the actual camera/photo input, requires human Adjust category/type/color and explicit confirmation, creates and commits a **separate P119-reviewed genuine JPEG crop** from another licensed original, sees verified 2D My Closet and three existing owner outfits, exports native V4 via `restoreAtomic01Bridge.exportJSON()`, and tests:
- **Awaited false** and **truthy nonboolean confirmation** yield cancellation with unchanged owner closet, saved outfit IDs and source bytes.
- A different **genuine secondary JPEG** with stale expected SHA is rejected before replacing owner state.
- Simulated deletion of the reviewed cutout from owner IndexedDB followed by **actual native `importBackup(...,{confirm:async()=>true})`**, independent original+crop SHA validation, atomic restoration and preservation of existing saved outfits.
- **Full browser reload**, reopen My Closet, display exact original-bound cutout JPEG (2D only), regenerate three source-honest pinned owner-owned looks with no fabricated garment geometry.
- Account A logout, private UI clear and account B isolation. No unexpected outbound third-party or private-photo network requests and no horizontal overflow. Existing 75 screenshots + 18 new genuine browser captures = **93 expected**.

This is the actual native bridge call from a browser, **not** an end-user file-picker upload visual acceptance nor a physical Android/iPhone hardware test. No authentic remote signed JWT/RLS, true cloud provider backup/restore or account security can be inferred from mocked auth.

## CI and release boundary

The dedicated registered strict **no-deploy** workflow must pin exact green P126 parent, enforce **exactly five** changed research files (native restore bridge, P127 Node test, real app P127 browser harness, this report, research workflow), execute P127 focused + all inherited Node, and actual six-width/engine mobile browser suite on the **final exact HEAD** with screenshots and JSON evidence archived as artifacts. An initial failing test must be fixed rather than weakening validation. Do not mark the priority verified until both dedicated jobs are green.

**Family Alpha Issue #255 HOLD · Draft PR only · production/existing staging untouched. No merge or deploy.**
