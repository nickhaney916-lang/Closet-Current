# Priority #111 — Independent mobile 3D outfit integration

**Research only. Family Alpha Issue #255 remains HOLD. No production, staging, account, Supabase, or customer data changes.**

## Exact integration source

The research branch starts at Priority #109 / PR #663, commit `c5930d200b8bbd1632b188fb5216bc233cffae8d`. It integrates both sibling research heads based on that commit:

- PR #664 lifecycle gate: `8a59e9f0b05f7648eb0261619599509177bc2e8f`.
- PR #665 reviewed saved-look handoff: `5b270b651e1926a101c31e1822fa82883b12b0cc`.
- PR #661 independent visual acceptance was reviewed at `80faa003c8e73d7aea51995545bac5679c1b32cc`. It is based on a separate PHOTO106 line and is not merged into this branch.

Both #110 branches changed the same PHOTO109 controller and browser-test files. Git merged the changes without textual conflict; independent green reports did not prove runtime composition, so this branch adds a combined browser test against a temporary detached PR541 original humanoid donor (`df6885d6011cb33fb22dceb81a08f35a0ac4dd61`).

## Integration defect and repair

The initial combined run found that the saved-look research panel did not consult the PHOTO110 sticky lifecycle revocation. After the source pose session was revoked, the panel could leave a saved look enabled for another reopen attempt. The panel now checks the live PHOTO109 lifecycle state, clears the ephemeral saved-look token, disables save/reopen, and only becomes usable again after a new document load and a fresh reviewed source.

The existing PHOTO110 browser test also assumed an untrusted DOM click should clear a previously saved look. That expectation was incorrect: a rejected untrusted click must leave the previous source identity untouched. The test now asserts that the saved SHA values remain unchanged until a trusted user click explicitly replaces the look, and checks the current source SHA after the trusted save.

## Evidence produced

The strict no-deploy workflow builds the unchanged app, runs the full Node suite, reconstructs the original licensed sources and 163-bone donor in a detached worktree, and runs the PHOTO110 source-bound WebGL tests plus the combined Priority #111 mobile browser test. The combined test records actual Chromium WebGL screenshots at CSS widths **320, 390, and 430 px**, from **0°, 90°, and 180°** views. Its independent audit hashes each PNG, checks dimensions and nonblank pixels, and confirms the original shirt and jeans SHA values and 163-bone rig.

The combined scenario covers a reviewed saved look, swapping and reopening the verified source, independent left/right and bilateral knee poses, reset, freeze-event source revocation in the live WebGL document, concealed stale rendering, blocked same-document review/reopen attempts, reload, fresh source review, and a new successful save/reopen. The inherited PHOTO110 browser suite exercises the hidden-document visibility event path, private-photo 2D fallback and synthetic owner-switch revocation. The known licensed source photographs remain the only genuine source that is rendered as 3D.

## Acceptance limits

- **PASS in the browser harness:** source JPEG SHA validation, saved metadata source identity, category/subtype source policy, 163-bone source model, front/side/rear screenshots, responsive CSS viewports, pose and reset, lifecycle lock + fresh review, fail-closed unsupported-source 2D fallback, synthetic owner isolation, build and automated regression suite.
- **NOT VERIFIED:** physical Android Chrome or iPhone Safari; signed real-account RLS; arbitrary customer-photograph 3D reconstruction; independently scored realism; genuine photographed rear surfaces; physical cloth simulation; Family Alpha.
- Browser rendering uses Chromium with software WebGL (SwiftShader). It is not physical-device GPU acceptance.
- The local headless runner did not emit `visibilitychange` when switching focused tabs. The automated test emulates a hidden document and dispatches that event in Chromium, and separately covers a freeze event. A physical browser background/foreground transition remains **NOT VERIFIED**.
- No supported clothing is assigned invented geometry. Private-like test records use metadata only and stay on the original-photo/2D fallback.

## Reproduction

Run `.github/workflows/independent-mobile-3d-outfit-integration-111-no-deploy.yml` on the named research branch. The workflow verifies the source baseline and allowed file set, runs `node scripts/build.mjs` and `node --test tests/*.test.cjs tests/*.test.mjs`, assembles the exact pinned donor with the source installers, executes the saved-look and combined WebGL browser suites, runs both screenshot audits, and uploads only the licensed benchmark PNGs and JSON receipts. It contains no deploy, merge, cloud write, or private-photo step.
