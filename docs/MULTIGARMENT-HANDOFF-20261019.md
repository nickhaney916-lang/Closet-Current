# Two-garment rendering handoff — October 19, 2026 Pacific

Follow-up draft: [PR #14](https://github.com/nickhaney916-lang/Closet-Current/pull/14),
branch `fix/multigarment-reliability-phone-gates-20261019`, targeting
[PR #12](https://github.com/nickhaney916-lang/Closet-Current/pull/12)'s research
branch. No branch was merged and no deployment was performed.

## Fixed behavior

- A provider can report `processing` repeatedly without returning another
  signed token. Previously the second poll sent `undefined`. Every poll now
  retains the original signed token. Each top and bottom still starts once.
- Individual HTTP requests time out after 25 seconds; the complete attempt
  has a 120-second deadline, including authentication and image decoding.
  All timers/listeners are cleaned up. Neither a failed nor an uncertain
  start/continue POST is automatically retried.
- Photo, item, category, slot or model changes abort the pending client
  request/delay. The revision and complete source equality checks from PR #11
  still prevent late results from being shown. A client abort does **not**
  prove that a provider job already accepted by the server was cancelled.
- A fresh attempt hides any prior image immediately. A second-stage failure
  never leaves a previous or first-stage image labelled as a completed pair.
  The button unlocks for an explicit new attempt, which starts the chain over.
- Both intermediate and final outputs must decode as images before the next
  pass or display. The client cannot continue from undecodable bytes. Browser
  output validation now matches the server's 10,000,000-character output
  limit instead of incorrectly applying the smaller catalog-upload limit.
  Decoded images above 16 million pixels are refused without resampling.
- Original capture/classification/clipping code and garment records are
  untouched. The upload reference remains the selected catalog crop; a
  complete original outfit photograph is not substituted as a garment.
  Generated output remains transient and is not automatically saved.

## Verification

Four new behavioral regressions failed before the fix: repeated processing
poll token loss, a poll after outfit invalidation during its delay, an
unbounded request, and accepting invalid JSON as a successful response.
They now pass. Full local build and Node suite: **819 total, 816 passed,
0 failed, 3 skipped**. Focused try-on suite: **21 passed**.

The new Node handler test executes the actual staged TypeScript Edge Function
with synthetic Deno registration, Auth replies and provider transport. It
checks signed-token tampering, cross-user polling denial, Auth rejection,
origin checks, safe failure normalization, no-store output and the paid-chain
hard stop. This is not a live Supabase or AI-provider integration test.

Initial verified code `5106fd44987b66998415361f9e6006fc1fe4a41e`:
[run 39272723192](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39272723192)
passed the full Node suite, Deno check, existing single-item preview flow,
expanded two-garment synthetic browser fixture, and the complete owned-closet
Style this flow in both Chromium and WebKit. Both emulated profiles reported
zero page errors, repeated polling success, invalid-image rejection,
second-stage failure recovery, no uncertain-POST retry, stale-result rejection,
aborted pending fetch and unchanged source records. No actual provider calls.

The subsequent test-only commit `3074a1ce5c010fc06bfcb60e2aeef9f9a79782c3`
moves the two-garment fixture into the **actual built application** with real
outfit-board scripts and CSS. Final run:
[39273055299](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39273055299)
**passed every step**, including the full **819 total / 816 passed / 0 failed /
3 skipped** suite and Deno type checking. Both profiles reported
`actualBuiltApp=true`, zero page errors, seven synthetic starts and five
synthetic continuations. All recovery and source-preservation flags passed.
The complete Style this flow also passed separately in Chromium and WebKit:
owned swaps, pinned new item, explicit saves and reload persistence succeeded.
Every external request is intercepted; Auth, wardrobe and generated images
are synthetic. `two-garment-emulated-qa` (artifact `12197275145`) contains
screenshots and JSON evidence labelled as emulation. The Pixel 7 / Chromium
and iPhone 13 / WebKit profiles are Linux-hosted browser emulation, not
physical phones. **Actual provider calls: 0. Actual phone runs: 0. Actual
clothing-fidelity score: null.**

Local Playwright browser installation returned truncated ZIPs, so local
browser success is not claimed. Browser evidence comes from GitHub Actions.

Provider contract reviewed against the current primary
[v1.6 documentation](https://docs.fashn.ai/api-reference/tryon-v1-6) and
[polling documentation](https://docs.fashn.ai/api-overview/api-fundamentals).
The selected endpoint, nested inputs, category values and prefixed base64
response handling agree with that documented contract. This review is not
an actual inference result.

## Branch compatibility

- PR #11 head `5d214c9b557bce6a12e3bd71692b98e7393c4912` and PR #7 head
  `510ee14d437bbe266e2f7aa463504998ef7a75cb` are ancestors of this branch.
  Their existing source guards, indexing checks and Style this behavior are
  included in the passing suite. A calculated PR #7 integration tree is
  identical to this branch's tree; no integration commit was made.
- PR #10 head `b28708dcaf9221e99b36a8c84ca02e5e2eecbc66` is divergent.
  A read-only `git merge-tree --write-tree` compatibility calculation found
  conflicts in `public/app.js`, `tests/automatic-indexing.test.cjs`, and
  `tests/original-first-recognition.test.cjs`. These overlap original-source
  selection and classification guards, not the new try-on changes. PR #10's
  public-file diff contains no try-on edits. **Combined PR #10 compatibility
  is not verified**; reconcile the latest source guards and rerun both suites
  before integration. No PR #7/#10/#11 branch was modified.

## Remaining release blockers and next action

1. **Live two-pass garment fidelity is unmeasured.** The second real inference
   may change the earlier top. Before judging quality, define pass/fail against
   both original garments: color, print, collar/neckline, seams, sleeve/hem
   length, fit/drape, and preservation of the first garment after pass two.
   A successfully decoded image or passing synthetic test is not such proof.
2. **Physical Android and iPhone tests are unperformed.** Follow
   `benchmark/TWO-GARMENT-PHYSICAL-PHONE-RELEASE-GATE-20261018.md`; copy
   `benchmark/TWO-GARMENT-PHONE-VALIDATION-RECORD.template.json` per device.
   Leave unknown fields null and retain blocked status until actual evidence
   exists. Do not commit customer photos, faces, tokens or private account IDs.
3. **Paid second pass remains hard-disabled in source.** No environment flag
   can activate it. Durable per-user quotas/idempotency, a provider budget
   cap, approved model assets, consent/privacy review and separate owner
   authorization remain missing. A first-stage token can otherwise be reused
   for multiple continuations: signatures and step checks do **not** provide
   durable one-use/idempotency protection. Do not describe replay as solved.
4. Shoes and outer layers are not rendered by this chain; the UI discloses
   selected unrendered pieces. A dress uses one pass. Full outfit coverage
   and genuine clothing fidelity are not completed by this work.

The main conversation can resume by reviewing PR #14 and this handoff, then
reconciling PR #10 separately. No production merge/deploy, paid generation,
real user upload, source-photo replacement, or Drive Duel changes occurred.
