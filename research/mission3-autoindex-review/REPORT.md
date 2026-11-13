# Mission 3 — refuse to acknowledge a closet save when automatic indexing returns false

**Family Alpha HOLD #255 remains active. Research only. No merge, production or staging deployment, hosted Supabase, or family wardrobe access.**

## Source-verified gap
Stacked on exact Mission 3 PR #1012 HEAD `67162236613c6fda8f2717522562c26ba9f25fb9` (its owner-private durable recognition status acknowledgement remains unchanged). The production `public/app.js` source sets `savingIndexed=true` immediately before `saveIndexed`. If `saveIndexed` returns `false`, the existing completion path can return a successful recognition result without inserting the garment in the saved-items store. With `savingIndexed` still true, `finally` skips the otherwise durable pending-review status CAS. With INDEX-04 enabled this left a noncommitted fallback message; with it disabled the UI could still display “Recognized. Saving to your closet…” after no saved write.

## Minimal fix
For `wasSaved===false`, retain the pending owner-original JPEG, explicitly set `savingIndexed=false` and a “NOT saved” owner-review message, mark save failure, then return false. The inherited `finally` now awaits `persistDraft({required:true,mode:'update',expected:expectedDraftForRecognition,record:outcome})` before any status can be acknowledged. A stale correction, owner switch, session revocation, storage error, or same-owner tab collision cannot bypass the source-CAS guard. On `wasSaved===true`, the existing successful saved-item path is unchanged.

## New reproducible test coverage
Source-executed `tests/mission3-pending-capture-status-cas.test.cjs` adds a strong synthetic-recognition scenario where `saveIndexed` refuses to save. It checks non-success return, native fake IndexedDB pending-row durability, original full JPEG and SHA retention, no invented saved garment, and explicit review status. Another test simulates a failing review-status CAS after refused save and checks non-success with intact original and warning. Exact source assertions guard against reinstating the prior skipped persistence branch.

## Independent validation status
This report describes the implementation and its intended tests, **not a claim that all new CI has passed**. The new exact-parent NO DEPLOY workflow must finish green at the final PR head before the milestone is accepted. Prior parent PR #1012's dedicated two-job no-deploy workflow had passed 1,774 source tests and native Chromium/WebKit checks. Multiple *older*, unrelated narrow-scope workflows fail their own branch-parent allowlist gates on this stacked branch, which does not by itself identify test regressions.

## Release blockers unchanged
Independent legally usable real clothing-photo labels and accuracy; physical Android Chrome and iPhone Safari; hosted two-signed-owner Auth/Storage recovery/revocation; photo-to-humanoid cloth quality; integrated Mission 1/2/3 acceptance and explicit owner signoff. **Keep HOLD #255 and all research draft PRs unmerged and undeployed.**
