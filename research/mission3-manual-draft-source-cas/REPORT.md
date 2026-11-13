# Mission 3 — human-reviewed draft CAS and photo preservation

**Family Alpha HOLD #255. Isolated research, not merged, not deployed. No production/staging/hosted Supabase or private family photographs accessed.**

## Parent and scope
Exact parent: Mission 3 PR #974 HEAD `2c882d7f7b0a925ba78a5408b2481f1c5a762eb5`.
Seven changed paths only: `public/app.js`, three existing private save/color provenance regression test suites, one native two-tab browser fixture, this report, and no-deploy Actions workflow.

## Data-loss hazard and fix
Previously the ordinary Adjust → Save action could persist the current tab's stale whole pending-photo `nextBatch` after writing a garment. If another tab with the same signed owner captured a second original meanwhile, that original could disappear. Saved-row Adjust also unnecessarily replaced all draft rows.

- Freeze the exact captured draft row at Adjust-open, before UI edits or asynchronous SHA validation.
- Existing saved-row edits CAS-verify the reviewed row and update only the garment; leave draft store untouched.
- A new garment must reference a persisted owner-private draft. The transaction checks saved-ID vacancy, exactly one draft row with matching ID, exact reviewed draft snapshot, source JPEG, source SHA-256 and original-photo SHA.
- Under the same `items`+`state` readwrite IndexedDB transaction, insert the reviewed garment using `add`, then remove just its verified draft from the **current persisted** batch. Other-tab drafts remain unchanged.
- Reject collisions, stale/replaced/deleted drafts, duplicate IDs, source swaps and owner-epoch revocation. Failure aborts both item and draft mutations; the editor reports a reload/review instruction.
- Do not run the prior blind `persistDraft` after a successful ordinary manual save.

## Verification and limits
The exact-head no-deploy CI is the acceptance criterion; do not claim success until GitHub Actions confirms it. Tests cover source-executed saved/unsaved writer cases, concurrent second-tab originals, stale photo/source/color changes, duplicate pending ID, source substitution, session-switch fences and inherited private-wardrobe loading. Workflow also requires full serial Node, native Chromium/WebKit mobile viewport cases, disposable signed two-owner PostgreSQL Storage RLS and browser evidence.

This protects **manual Save**, not the other independent `persistDraft` call sites (crop of an unsaved draft, batch category/discard and routine recognition-status updates). The broader cross-tab draft synchronizer remains unresolved. Other release blockers: physical Android/iPhone camera/PWA acceptance; authorized real two-owner hosted Supabase backup/restore; owner-controlled integration with Missions 1 and 2, independently labeled real-photo recognition, photographed garment 3D acceptance and owner release sign-off. All remain BLOCKED / review.

Never lift Family Alpha HOLD #255 or merge/deploy this branch without explicit owner acceptance.

CI compatibility fix: inherited `review-color-provenance-23.test.cjs` now supplies an explicit opening-row draft snapshot to the isolated mock Adjust handler. The inherited test had mocked the save writer and did not provide this newly required input; color provenance assertions stay unchanged.

CI browser compatibility fix: the real native same-owner browser collision probe now supplies an explicit would-be reviewed draft when testing an attempted new-item ID collision. This preserves the original collision test goal under the new required draft precondition.
