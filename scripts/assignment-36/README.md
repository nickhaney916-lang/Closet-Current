# Cumulative owner recovery acceptance

Assignment #1736 covers the isolated cumulative candidate descending directly from
`bba97ce9b6535ed3fd5882501464806560585cdb`. It retains the exact tree of
the accepted baseline and allows only the additions enumerated by
`check-scope.sh`. Existing historical workflows, runtime scripts, policies,
and application code are part of the pinned tree.

| Historical acceptance | Cumulative runtime lane | Required evidence |
| --- | --- | --- |
| AUTH36 | `auth` | Original browser test and independent audit of six IndexedDB owner/session cases, both confirmed and unconfirmed logout paths, and 24 PNG hashes and nonblank pixels. |
| AUTH36 signed HTTP | Baseline run 45917252927, job 140239342905 | Real disposable Supabase Auth, RLS, Storage and refresh/expiry. It belongs to the accepted baseline. The new `signed-postgres` lane exercises the actual browser/cloud controller with disposable signed RS256 credentials and PostgreSQL RLS and Storage policies. |
| RESTORE-ATOMIC-01 | `backup` | Existing restore repro, two-engine native atomic restore, and independent audit. |
| INDEX-02, INDEX-04 | `index` | Existing native owner closet/index tests and both original inline evidence audits. |
| CAPTURE-PROOF-01 | `capture` | Original camera/gallery source proof and audit, plus cumulative native JPEG and camera-to-closet acceptance. |
| COLOR41, CONFIRM44 | `review` | Original source/save/worker finality and human color/type correction runtime, plus original independent screenshot audits. |
| LABELSYNC66 | `review` | Original tests run in normal and NAME66 modes and the independent label-sync audit. |
| MODEL45 | `review`, `model` | Color/type safety prerequisites and the genuine model-enabled runtime and original independent audit. A missing model or execution provider fails the model lane. |
| NATIVE-CONSUMER-BOARD-04, NATIVE-RESTORE-3D-06, NATIVE-INDEX-LIVE-07, NATIVE-PHOTO-READINESS-08, MOBILE-NATIVE-09 | `native` | Original source builders, original runtime suites, and independent browser evidence audits. |
| INDEX-CORRECTION-10, STYLE-OWNED-LIVE-03, NATIVE-INTEGRATION-11, NATIVE-STYLE-CORRECTION-INTEGRATION-11 | `native`, `backup` | Original source correction, current-owner styling and restore runtime/audits. |

The new `chromium` and `webkit` jobs exercise 320, 390 and 430 CSS px.
They run the built application's normal UI and native IndexedDB with fixture
HTTP auth. Each case checks a saved outfit through the builder, a default
download/import round trip, foreign backup rejection, cancellation, fresh
browser recovery, stale pending save rejection after account switch, and
independent SHA-256 verification of the retained originals. The `interrupt`
job reuses Assignment 31's committed-write, interrupted-write and retry
assertions without changing that assignment.

Historical branch preflights remain authoritative for their historical
branches. The cumulative gate runs the runtime behind those guards and
records each command's result. Historical workflow artifact metadata,
their branch-specific negative controls and exact donor-parent checks
remain covered by the original definitions. Physical devices, hosted
Supabase, and the Mission 4 native ONNX root cause require separate evidence.
Family Alpha #255 remains OPEN/HOLD.
