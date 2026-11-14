# Mission 3 — P146 research owner-reviewed cloud UI fail-safe revocation

**Family Alpha HOLD #255 OPEN.** Isolated research branch stacked on [PR #1114](https://github.com/nickhaney916-lang/Closet-Current/pull/1114), exact green parent commit `11648339f297565d06792fbd27f8e7a8e5b719cc`. **No merges, production, staging, deploy, hosted cloud or private wardrobe changes.**

## Actual source weakness

The P146 research-only local backup/restore control `research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs` implements a `revoke()` called on sign-out, pagehide and stale asynchronous owner-review mount. Its previous implementation stopped as soon as either `backupService.revoke()` or `restoreService.revoke()` threw. The code would then skip disabling the old owner's buttons, removing the private owner-review section, closing/removing the replacement modal, and removing the style element. Since `revoked` had already been set, a repeated `revoke()` could not retry the skipped teardown. In addition, `settle(false)` closed its dialog before invoking the waiting consent callback, so an exception in `dialog.close()` could strand the outstanding authorization promise.

This is a **source-observed possible failure mode**, not a demonstrated incident. Both services and modal operations are local research constructs with synthetic unsigned credentials and loopback-only endpoints.

## Implementation

1. `settle(answer)` always invokes the outstanding consent resolver even if `dialog.close()` throws; a revoked session resolves **false**, never approves replacement.
2. `revoke()` marks the review session revoked first, then runs its consent cancellation, each service's `revoke()`, each button disabling/unbinding, dialog closing, owner-private DOM/style removal and both global event-listener removals as **independent best-effort cleanup operations**. One dependency failure cannot skip later cleanup.
3. Revocation is idempotent, and the original local-only two-flag research gate, signed owner identity, private DB association, synthetic token requirement, restricted same-origin HTTP transport, no-redirect policy, human review, SHA/photograph provenance, storage CAS and safe 2D/3D distinction remain unchanged.
4. The separate [PR #1114](https://github.com/nickhaney916-lang/Closet-Current/pull/1114) caller already revokes a returned P146 panel after a stale asynchronous owner change. This patch strengthens that cleanup path without modifying the caller.

## Reproducible checks

- `tests/mission3-reviewed-cloud-revoke-failsafe.test.cjs`: source-executed synthetic exact P146 consent/revoke code, including normal sign-out, backup/restore service exceptions, dialog failure, consent callback failure, individual button lookup failures, listener unsubscribe exceptions, no-pending decision and repeat revoke.
- `scripts/test-mission3-reviewed-cloud-revoke-failsafe-browser.mjs`: **72 planned** real Chromium and WebKit synthetic DOM scenarios (12 modes × two browsers × 320/390/430 CSS viewport widths). Asserts the former-owner private panel, modal and styles are removed and outstanding consent cannot authorize a restore, even if local services throw. Not physical phone testing.
- `.github/workflows/mission3-reviewed-cloud-revoke-failsafe-no-deploy.yml`: strict pinned PR #1114 **five-file** diff gate, focused Node and browser tests, inherited full serial Node, original-photo-to-owner-private-wardrobe-to-outfit browser acceptance, disposable signed two-owner Postgres/Storage RLS and evidence JSON receipts.

**Await final exact-head CI successes before declaring this work validated.** This does not verify actual hosted Supabase, physical iPhone Safari/Android Chrome, owner-authenticated real private cloud restoration, independent genuine photo recognition or real garment 3D geometry. HOLD #255 stays OPEN, draft-only.

## Remaining launch blockers

Integrated nonconflicting PR convergence across Missions 1/2/3, genuine independently reviewed photo recognition accuracy, photographed fabric/mesh reconstruction, authorized live-cloud two-account backup/restore, physical Android/iPhone acceptance and owner approval.
