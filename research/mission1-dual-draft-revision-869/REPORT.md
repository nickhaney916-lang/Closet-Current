# Mission 1 P869 — Reject stale dual-model suggestions after silent photo-detail changes

**Family Alpha HOLD #255 OPEN. Draft-only, unmerged, undeployed.** Exact parent: [Mission 1 P868 PR #1048](https://github.com/nickhaney916-lang/Closet-Current/pull/1048) HEAD `d2b7fcb5b22511742cac8c4586d544ab6f049219`; [NO DEPLOY CI #43507716051](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43507716051) successful, 580/580 native tests. This research branch never modifies main, staging, production, hosted Supabase, accounts or private JPEGs.

## Source-verified mechanism
The optional panel `public/dual-panel-82.mjs` invalidated model suggestions only from bubbled `form` `input` events, the immutable photo evidence, and owner/unit checks. But `public/app.js` `clothingFields()` has asynchronous `fillPhoto` and source-image color-estimation paths that update `draft` fields programmatically and call the editor's `onChange` callback without dispatching a DOM `input` event. Such edits could preserve an older in-flight/result model suggestion for the same JPEG while its *reviewed draft category, subtype or color* had changed. This is a UI provenance weakness, **not** evidence of a previously observed wrong owner save.

## Exact fix
- `mountDual82()` now accepts an immutable per-comparison `getDraftRevision` callback. The host supplies a stable JSON string of current category, item type, color, source color, pattern, sleeve length and fit.
- Reject if the draft revision differs after evidence capture/source hashing, after model inference, immediately before owner choosing a suggested category/type, or after the final awaited evidence check. On a stale choice, revoke model result, reset consent and require a fresh comparison.
- Existing exact signed-owner object, original JPEG SHA, crop/mask/unit revision, manual Adjust, separate photo review checkbox, no auto-admission, WebKit gate, and 2D fallback remain unchanged.

## Reproducible acceptance
The existing **real desktop Chromium/WebKit harness** is extended at 320, 390, 430 CSS widths. For each profile it silently changes the rendered Color input mid-inference (no input event) and the Item type selection *after* a suggestion is shown but before owner approval; both must result in 0 suggestion applications, 0 writes and no retained stale suggestion buttons. Normal owner-confirmed one-save, stale owner/crop/mask/unit, explicit consent, cancellation, blocked non-clothing and worker policy tests must also remain green. This uses **synthetic owner/storage/model observations**, not new real FashionCLIP/FashionSigLIP accuracy or physical phones.

Exact-head no-deploy CI independently verifies source-scope, build, full native Node suite, genuine-original JPEG desktop browser persistence and these policy regressions. Do not claim passing tests until GitHub Actions final-head confirms them.

## Outstanding release blockers
The donor's 48 public historical development JPEG labels are neither independently blind human truth nor evidence of 10/10 accuracy. Continuous-session WebKit crash investigation #83, real physical Android/iPhone acceptance #78, independently human-reviewed source-disjoint labels #75/#79/#80 and real signed two-owner cloud acceptance remain BLOCKED. Family Alpha #255 must not be lifted by this fix.
