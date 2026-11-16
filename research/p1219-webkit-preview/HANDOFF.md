# P1219 native WebKit owner-original preview — source-pinned engineering handoff (HOLD)

This research-only branch **must not be merged, deployed or considered Family Alpha ready**. Issue #1219 is the source owner, coordination is #1054, and #255 stays OPEN/HOLD.

## Pinned native source and boundary

- Source parent M4 #1210: `c4e45aa684f7120d216ae4eec192d4085823b073`. Newer M4 heads require a fresh consumer compatibility diff before adoption.
- Consumer originally `public/outfit-board.js` Git blob `22e76c92dc31d8a10d8186e259a4e3784e4b3c84`; narrow patched blob `8d16533036794735a4bcf675719d2dd5b63700ab`. Exact product patch commit: `52fbc3a1029a273a1da947d12cdbe804a392a837`.
- Native verified owner viewer `research/main-thread-integration-1054/native-2d-preview.mjs` Git blob `0af20d49d87436683630d587ec0284c611cd3414`; unchanged.
- Reused actual native M51 signed synthetic local-account, original Commons JPEG and strict source/owner/backup test `scripts/test-main51-real-app-owner-original-2d.mjs` blob `63cc9da00eaecbeb2576482dcae1528b44ea8189`; unchanged.
- Other source, M1/M2/M3, Assignments #91/#92/#93, auth, original SHA, IDB, 3D, production and staging are never edited.

## Proposed causal race and minimal fix

The actual consumer `button.onclick` waits for `viewer.refresh()`, which itself can finish all signed-owner/session/DB/board and original-JPEG SHA checks, publish a valid private 2D image and return a resolved promise. A newer click can supersede that old pending promise while sharing the single viewer instance. Under the original consumer:

```js
if (!live() || mission4Preview1054Viewer !== viewer) {
  viewer.clear();
  return;
}
```

the old promise continuation `viewer.clear()` can then revoke a **newer** verified preview it does not own, leaving the valid owner, board and SHA present but zero images and a revoked viewer. The patched stale-only branch simply `return;`; the existing synchronous source, session, DB, focus and signed-owner revocation code, newer viewer ticket and negative tests remain intact. The change never restores stale pixels or bypasses a failed proof.

### Event-controlled actual-app reproduction

The dedicated `scripts/test-p1219-webkit-native-preview-reentry.mjs` imports the native M51 test; at each 320/390/430 viewport it intercepts the verified viewer module **only in the disposable browser fixture**. It adds an event-controlled pause strictly *after* the genuine verifier's final board/session/SHA/presentation checks and *before* its return value settles. No identity, JPEG, token, DB reference or proof is replaced. The sequence is:

1. Valid synthetic signed owner A + persisted original JPEG, real native board slot, prior image shown.
2. An old user click begins a fresh signed original-photo recheck; its verifier publishes one verified original and pauses at final return.
3. Actual board occasion changes to Dinner. The app correctly revokes the prior owner photo synchronously, with **zero stale original pixels**.
4. Original occasion is restored to Casual. A new click independently verifies the same legitimate source and displays precisely one original.
5. The old already-verified promise is released. Its stale click continuation must neither clear the newer image nor corrupt the newer UI status. Require `viewerPhase=visible`, one image, owner lease current, no 3D grant.
6. The rest of the unchanged native M51 flow continues through same-source redraw, source tamper, auth-ref and DB-ref replacement, operation epoch, logout and cross-owner privacy controls. No manual retries or arbitrary sleeps.

A strict **pre-fix red** witness is defined in `.github/workflows/p1219-webkit-photo-soak-no-deploy.yml`. It restores ONLY the original consumer blob inside an ephemeral GitHub Actions checkout (not a branch), runs the same controlled test and requires the precise `stale async click erased newer verified owner photo` failure; any other failure is **BLOCKED**, not a red proof. The separate patched Chromium/WebKit matrix and full Node suite run in `.github/workflows/p1219-webkit-photo-reentry-no-deploy.yml`; the independent full-process WebKit 12x3 and Chromium 6x3 soaks fail immediately, with no retry masking.

## Early evidence and limits

- Confirmed historic same-class native WebKit failures: P92 run 43947511160 at 430px; later P92 run 43955396500 at 430px after four clean full browser processes; P93 43951781548 at 320px. These are **not** a deterministic proof of this cause.
- On patched code and corrected timing gate, at exact test-only commit `2afd002a5390d251bb2efebf25c0c37409d4f2cb`, [WebKit native test job from #43959535003](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43959535003) passed all three widths with status `visible`, one original, current owner lease and 3D denied. This is **initial** evidence, not the complete acceptance bar.
- The first diagnostic test jobs had test-instrumentation source string and syntax mistakes. Those were corrected without changing product fix. **They do not count as valid pre-fix red evidence.**
- Full exact-head repeated CI, pre-fix causal red, entire fresh WebKit/Chromium soak and inherited Node results remain subject to actual completed workflow logs; do not fill their outcomes from expectation. Any future WebKit failure may reveal a *separate* revocation cause requiring its own verified trace.

## Safe integration

After accepting the actual completed CI evidence, main #1054 owner should re-fetch its newest M4 SHA and consumer blob and check overlap. Select only consumer patch `52fbc3a1029a273a1da947d12cdbe804a392a837`, not the branch's test/workflow ancestry, e.g. a disposable cherry-pick rehearsal. Do not bypass real source revocation or adopt the research CI browser fixture as a released app feature. **NO MERGE / NO DEPLOY / #255 OPEN HOLD.**
