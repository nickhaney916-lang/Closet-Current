# Mission 3 — research BOARD04 async controller callbacks pinned to initiating signed owner

**Family Alpha HOLD #255 OPEN.** Independent research branch stacked on [PR #1074](https://github.com/nickhaney916-lang/Closet-Current/pull/1074), exact green parent HEAD `9c119b334eaa09766760151cc67d6c39d01d75d6`. No merges, no hosted Supabase, no private wardrobes, no production/staging, no real devices, no 3D release claims.

## Source-observed risk

The prior research-only `?nativeLossless04=research` Outfit Board correctly fenced button Save/Cancel/Delete writes to an exact user/controller (PR #1074), but its **asynchronous controller initialization and change/status callbacks** were not fenced at the UI boundary:

- `nativeLossless04=await createNativeConsumerBoard04(...)` immediately published its result without rechecking a new account/session after the awaited controller creation.
- `onChange(value,{revoked})` mutated global `currentBoard`, `savedOutfitBoards`, readiness/photo previews, and card render state unconditionally, even when a late prior-owner callback arrived after sign-in replacement.
- `onStatus(message)` wrote the prior owner's controller status into the active Outfit Board. Related 3D preview/readiness panels used unguarded callbacks on the same status element.
- A blanket decision to ignore obsolete callbacks would remove the old revocation path for clearing private previews. We therefore also clear the prior signed owner's native preview in the authoritative `closet:session-locked` handler. A later revoked callback cannot erase a new owner's screen.

These are **source-verified potential privacy and correctness races**, not documented incidents. The existing `research/native-consumer-board-04/consumer-board-controller.mjs` signed-owner generation, original-source custody and compare-and-swap storage checks are unchanged.

## Implementation

`beginNativeBoard04OwnerCallbacks()` captures a fresh `beginOwnerBoardUiLease()` after `closetReady`. It provides `onChange`, `onStatus`, `current`, and `attach` methods, requiring exact initiating auth object, owner ID, private DB handle/name, capture epoch and authenticated gate, and—once attached—the same controller object.

Before and after the imported controller's awaited construction, the parent initialization requires the initiating lease to remain current. A controller returned after an account change is disposed instead of assigned to the shared global or bridge. Invalid old-owner `onChange` and `onStatus` events are silent; legitimate same-owner callbacks continue showing saved outfit previews. Non-string status objects get generic safe messages rather than exposing arbitrary values. Status callbacks passed to native 3D photo preview/readiness panels reuse the same lease. On session lock, the original wardrobe preview is cleared immediately before any new account uses the screen.

The core Save/Cancel/Delete controller, source JPEG, 2D fallback, cloud backup, local persistence, and collision safeguards are preserved. This task does not establish photo-derived 3D realism or release authorization.

## Reproducible checks

- `tests/mission3-native-board04-owner-callbacks.test.cjs`: **24 planned** source-executed tests using mock signed owners and synthetic garment IDs; regular events, same-account re-login, account switch, revoked auth, wrong DB, epoch rotation, old controller replacement, stale initialization disposal, deliberate revocation, authoritative lock clear, and source structure.
- `scripts/test-mission3-native-board04-owner-callbacks-browser.mjs`: **114 planned** real Chromium/WebKit synthetic browser cases, 19 scenario types × 2 engines × 320/390/430 CSS mobile viewport widths. These are **not** physical Android/iPhone tests.
- `.github/workflows/mission3-native-board04-owner-callbacks-no-deploy.yml`: strict pinned-parent five-file allowlist, focused source/browser tests and inherited full serial Node, original-photo capture/recovery, native photographed wardrobe→outfit styling, disposable signed two-owner PostgreSQL/Storage RLS and browser receipts.

**Do not call the final HEAD green until both no-deploy CI jobs and evidence receipts pass.** Keep HOLD #255 active.

## Remaining release blockers

Physical Android Chrome/iPhone Safari, authenticated real-owner hosted Supabase two-owner Auth/RLS/Storage recovery, independent genuine photo recognition acceptance, actual photo-to-3D garment reconstruction/drape, and integrated Missions 1/2/3 owner-approved release criteria.
