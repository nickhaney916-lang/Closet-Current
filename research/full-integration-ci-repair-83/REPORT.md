# Priority #83 — independent FULL-INTEGRATION-CI-REPAIR-83 findings

**Starting exact independently verified source:** Priority #84 research draft PR #638 at `fb624d93eb0dc22f216f977eddefc8bc8b2adb8d`. Its own [no-deploy CI #42130927531](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42130927531) passed 801/801 Node, 18 native browser workflows, 78+72+72 screenshot evidence.

## Investigation of the sixteen failures
All sixteen failures attached to exact Priority #84 draft source were retrieved as actual GitHub Actions job logs. See `failure-matrix.json` for the exact run ID/workflow/reference SHA of each.

**15 failures**: independent HISTORICAL research workflows DETECTOR57, LABEL59, SWITCH68, COLOR46, SUBTYPE47, RACE71, BOUNDS58, RECOVERY65, INPUT49, MODEL52, NEARDUP67, SOURCE70, NATIVE12, MODEL45, LABELSYNC66. Each failed **before** running application tests because its fixed historical scope gate rejects inherited later source `.github/workflows/allowlisted-review-snapshot-78-no-deploy.yml`. They were written to enforce a small changed-file allowlist relative to their historical base, not to accept a descendant composite integration containing many other research experiments. **Do not claim these 15 suites passed on the current combined branch; they did not run.** Preserve exact old ancestor/shas and old changed-file gates.

**One independently actionable failure**: general `.github/workflows/camera-scenarios.yml` failed at full Node tests because it ran tests without installing `fake-indexeddb` and other test-only modules. Failure at [#42130927627](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42130927627) showed 677 pass/14 fail, including `Cannot find module 'fake-indexeddb'`. Fix: install pinned test-only dependencies before Node regression without editing production package manifests or disabling any test.

## Verification
New strictly exact-parent-scoped no-deploy CI builds the app, runs all inherited and 2 new CI83 Node tests and a historical gate metadata audit, then replays the independently successful CAMERA84, MIXED80, CAMERA79, SNAPSHOT78 photo-to-private-closet browser workflows with screenshot hash checks at Chromium/WebKit 320/390/430. No historical original workflows changed.

**Exact-head pass is PENDING dedicated CI.** The broad general camera scenario is separately triggered by its own workflow-file change; verify its exact HEAD separately.

**PR-WIDE RED may remain by design:** historical workflows triggered on broader unrelated paths in the PR can continue failing at their deliberately restrictive ancestor/allowlist checks even when the proper exact-integration suite and corrected broad camera-scenarios suite pass. Green status MUST NOT be claimed for them. They require a policy decision about branch-specific trigger scope; do not silently disable any security gate. Future CI workflow hygiene can fix false-positive trigger scopes without weakening original historical acceptance.

Physical Android/iPhone camera, live signed cloud auth, independent ML segmentation/category/color accuracy and realistic photographed garment 3D cloth remain unverified. This research work is not a release qualification. Family Alpha Issue #255 HOLD; no production/old staging change, merge or deployment.
