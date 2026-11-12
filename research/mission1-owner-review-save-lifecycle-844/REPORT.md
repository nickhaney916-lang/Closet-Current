# Closet Current — Main Mission 1 P844: reliable owner review and save lifecycle

**FAMILY ALPHA HOLD #255 ACTIVE — DRAFT / UNMERGED / UNDEPLOYED / NO STAGING OR PRODUCTION.** Do not modify hosted Supabase, signed owner wardrobes, private photo data, model weights, independent workstreams or release hold.

## Exact parent and scope

**Parent:** main Mission 1 [P843 draft PR #937](https://github.com/nickhaney916-lang/Closet-Current/pull/937) verified final HEAD `cc5c0640e8c2814a053807e7159a591ab3e96a3f` ([no-deploy GitHub Actions #43299355218](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43299355218), 2/2 success). P843's owner-review-first default remains active; the model cannot auto-own clothing, even with confidence or guessed color.

Source of defect: [Parallel #71 PR #933](https://github.com/nickhaney916-lang/Closet-Current/pull/933) demonstrated 2 simultaneous `savePiece` calls on a repeat native submit while waiting for IndexedDB completion; its **opt-in** guard demonstrated 1 call with actual source in Chromium/WebKit. P844 integrates the proven guard **unconditionally** into the research-first owner's Adjust editor (no opt-out, no separate #71 branch or unrelated files merged), and covers additional in-flight races.

## Implemented

- Per-editor `saveInFlight` lock established **before** any awaited save; a direct second form submit can no longer call `savePiece` twice.
- Current explicit photo-based category/color/confirmation checkbox gate still precedes lock acquisition, and no AI proposal can bypass it.
- While the actual pending storage transaction runs: disable Save, Cancel and Remove; disable inputs/selects/textareas; mark Saving; reject synthetic Cancel/Remove calls; prevent Escape's dialog `cancel` event. Thus a dialog cannot be dismissed as though the save was abandoned while data is still being committed. This prevents new accidental field edits during the IO handoff.
- After a caught write error: unlock and restore prior field disabled state and controls, show existing “Try again” message, retain original draft + checked approval state; allow a legitimate new submit. On success, existing atomic `savePiece` commits and the editor closes. A previous successful commit is not replayed.
- Existing previously owned clothing edits and P843 automatic-storage guard stay unchanged. `ClothingMemory` consent and #72 branches are untouched. Family Alpha HOLD remains open.

## Verification (status pending)

`scripts/test-m1-review-save-lifecycle-844.mjs` uses actual `public/app.js` Adjust implementation and **exact P843 parent `git show`**, unchanged taxonomy/details, actual headless Chromium and WebKit at 320/390/430 CSS widths. An intentionally deferred in-memory storage operation triggers two submits; parent must attempt **2** writes, P844 **1**. Candidate additionally verifies script-invoked Cancel/Remove/second submit, synthetic Escape cancel event, field locking, success, failure and subsequent successful retry, no page errors. These are synthetic fixture tests of real DOM code, **NOT** actual signed owner/private persistence or real-model accuracy.

A dedicated strict **NO DEPLOY** workflow pins exact P843 SHA, four allowed changed paths and full source regression/build, executes inherited P843 scanner owner-review browser cases, actual original Adjust editor manual-review cases, then **P844 before/after** browser lifecycle. Nothing merges or deploys.

### Remaining work

- Review-first increases captures requiring owner action but protects against wrong auto saves; physical iPhone Safari and Android Chrome still required.
- Source-disjoint, newly human-labeled photos to demonstrate actual category/subtype/color gain, accurate outfit-segmentation and correct footwear owned units still not complete. Parallel #67–#73 retain ownership of their respective research.
- Parallel #71 signed owner/cloud conflict and #72 owner learning must be integrated separately; P844's test harness uses a mocked in-memory pending write, not cloud.
- No 10/10, no family trial, no release approval.

**CI status:** PENDING exact-head no-deploy GitHub Actions confirmation.
