# Mission 3 — async Stylist mobile browser harness repair (HOLD)

## Exact source basis
- Parent: Mission 3 draft PR #1059, immutable `85bc83dd0b806e3779dd12a4e09b846f133b191c`.
- Failed GitHub Actions run: [43511738618](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43511738618), native-signed-and-browser job `132183430768`.
- Source-executed Node owner/session tests and inherited privacy gates passed; the first new browser scenario could not start because `window.__scenario` was not defined.
- Exact failure in the run log: `page.evaluate: TypeError: window.__scenario is not a function`. This is an **unexecuted test harness**, not evidence that owner isolation or browser recognition had failed.

## Actual cause, change, and safety
The test extracted the real `public/closet-stylist.js` async Stylist form registration and inserted it with `page.addScriptTag()`, **before** there was a `#styleCollectionForm` in the test page. Production registration dereferences the form's `onsubmit`; that exception interrupted the test script before the `window.__scenario` test runner was declared.

The harness now:
1. Installs a minimal synthetic `#styleCollectionForm` before inserting the actual source handler.
2. Captures the successfully registered production handler.
3. Rebinds **that identical captured handler** to the synthetic replacement form on each reset, so all owner-switch, same-ID re-login, revocation, stale wardrobe, changed preference, success and failure cases can invoke the actual callback.

Changed path: `scripts/test-mission3-stylist-submit-owner-request-browser.mjs`, plus this report and an exact-parent guarded, dedicated no-deploy CI workflow. No `public/`, original photos, auth/storage policies, hosted services, production, staging or other branches are changed. No deploy or merge authorized. Family Alpha issue #255 remains open/HOLD.

## Evidence and acceptance
- Previous CI reached this test after passing its source-executed owner-session tests, synthetic disposable PostgreSQL/RLS checks and 48 Chromium/WebKit Style card mobile-viewport cases.
- The new workflow runs the full inherited serial Node, private original-photo, synthetic two-owner PostgreSQL/RLS and Chromium/WebKit acceptance suite on the isolated branch, pinned to PR #1059 and a three-path diff allowlist.
- **Do not mark PASS until the exact new workflow run reports success.** Chromium/WebKit are automated mobile viewports, **not physical iPhone/Android certification**.
- Live hosted cloud/real signed owner acceptance, physical phone acceptance, independent recognition accuracy, and real-photo 3D fidelity remain release blockers. Keeping Family Alpha on HOLD is intentional.
