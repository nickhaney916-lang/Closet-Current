# Mission 3 — research-only native lossless outfit BOARD04 UI session lease

**Family Alpha HOLD #255 stays OPEN.** Independent research branch stacked on verified [Mission 3 PR #1069](https://github.com/nickhaney916-lang/Closet-Current/pull/1069), exact green HEAD `9a8a5fe8de82dd7ecaf8437e2a6f343cc1915066`. No merge, staging/production deployment, private owner wardrobe interaction, hosted Supabase change, or physical phone testing.

## Source-observed gap

`public/outfit-board.js` has two paths: normal private Outfit Board and `?nativeLossless04=research` 3D-first lossless consumer mode. PR #1069 already protects the **normal** main Save/Draft UI path. The research-only native Save button and dynamically installed **Save changes**, **Cancel changes** and **Delete saved outfit** callbacks still unconditionally reenabled their old buttons after awaited controller work and rendered raw error messages, including possible storage/owner-photo exception details. A switched or revoked login could finish a stale UI action in a newer account. This is a source-verified potential race, not a reported privacy breach.

The underlying `research/native-consumer-board-04/consumer-board-controller.mjs` already checks the authenticated owner, authorization generation, and compare-and-swap storage writes. This patch does **not** change its controller or permit any additional writes.

## Implementation

- The native main Save Outfit path now pins `beginOwnerBoardUiLease()`, the exact research consumer object and its active status, and only reenables/displays errors for that exact signed account and controller after `await consumer.persist({asNew:true})`.
- The dynamically created buttons bind the controller identity and signed owner at click time, require a connected button before starting, and re-check session/controller before showing errors or reenabling. They pass the pinned controller directly to Save Changes/Cancel Changes/Delete, rather than reading a potentially replaced global controller.
- Native quick-edit exceptions are also fenced to the initiating owner/controller. `nativeLossless04Notify(Error)` now redacts error object details, but retains the existing predefined safe UI message strings.
- Confirmation remains mandatory before deleting a saved outfit; no source photographs are deleted.
- The normal persistent board, IDB transaction/CAS, private JPEG originals, reviewed closet, 2D fallback and existing collision constraints are unchanged.

## Reproducible checks

- `tests/mission3-native-board04-ui-lease.test.cjs` executes the real native research UI source via Node VM in **24 synthetic** scenarios, including signed owner Save/Cancel/Delete, same-ID relogin, account switch, revoked auth, wrong private DB, detached control, stale controller replacement, pending async success/failure, confirmation and source error redaction.
- `scripts/test-mission3-native-board04-ui-lease-browser.mjs` extracts and runs these same source callbacks in **real Chromium and WebKit** at 320/390/430 CSS-pixel mobile viewports: 14 modes × 6 configurations = **84 planned synthetic browser assertions**. These are *not* physical phone, real account, or end-to-end real photograph tests.
- Strict exact-parent **six-file** no-deploy GitHub Actions plus inherited 31 normal Outfit Board tests, 114 normal Board mobile browser scenarios, complete serial Node suite, native photographed-original-to-saved-outfit browser flow, signed two-owner disposable PostgreSQL/Storage checks and browser evidence receipts.

## Two inherited test-reconciliation findings

The first exact-head run [#43518362343](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43518362343) failed three new VM cases because the simulated consumer remained `active` across owner switch/relogin; the real BOARD04 controller's `status()` checks the pinned native auth epoch and becomes inactive. The focused fixture now models this revocation, without relaxing the production UI lease.

The second run [#43527123205](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43527123205) passed all **24** focused source tests and **84** Chromium/WebKit synthetic cases, but full serial Node had **one failure out of 1,954**: `tests/native-consumer-board-04.test.mjs` still asserted the old mutable global `nativeLossless04.persist(...)` call text. That expectation contradicts this security fix, which uses the pinned `consumer.persist(...)` captured at click time. The inherited source test now positively asserts the exact pinned control/writer and controller identity; it does not weaken BOARD04 CAS or allow unsafe writes. The strict no-deploy diff is expanded from five to **six** files, and the inherited test is run explicitly. Only the **new final exact-head** workflow can establish green acceptance.

**Do not claim tests passed until the final HEAD's no-deploy jobs are fully green.** Physical Android/iPhone, authorized hosted Auth/RLS/Storage, genuine human-recognition evidence and Mission 2 photograph-to-3D realism still block the Family Alpha release.
