# PR #64 + #65 integration — October 20, 2026

Common foundation: PR #51, `9d1dd7d4898dff7697f43eeecafdcfa1c10fe588`.
Source heads: #64 `da7138acec65fffe45e3c53beef9eadee99607cb`; #65
`6bf0364c1fd9d838e432a3a7e02eb60bc17602fd`. Their git merge-base was
independently checked and equals PR #51. Source branches stay unchanged.

## Source evidence verified from GitHub Actions

- #64: runs 39441202514 (preview/browser QA) and 39441202669 (camera/indexing)
  completed successfully at its exact head; 1,054 Node passes, 0 failures, 3 skips. Browser job steps include both
  Android Chromium and iPhone WebKit and original-source-before-clipping checks.
- #65: runs 39442878586 (styling/browser QA) and 39442878896 (camera/indexing)
  completed successfully at its exact head; 1,064 Node passes, 0 failures, 3 skips. Browser job steps include both
  engines, saved-outfit persistence and fitting reuse/retry scenarios.
- These results validate the source PRs only, not the new integrated branch.

## Conflict decisions

| Area | Integrated behavior |
| --- | --- |
| Entry and preview | #64 single-item Style new clothes shortcut; one #65 Preview on model button with focus/scroll handoff; immediate navigation despite background storage failure |
| Outfit saves | #65 serialized transaction-complete publication; account/database/owned-slot/capacity checks within queue; no pop rollback; pending state survives card rebuilds |
| Rendering | #64 microtask scheduling and full source/board/account rechecks, combined with #65 completed-plan reuse and base-image decoding |
| Cache/retry | #64 failed-output eviction; #65 successful identical-plan DOM reuse; failed/unfinished results never count as reusable completed output |
| Image preparation | Five-second bound per decode; high-quality bounded display downsampling; originals and recognition-before-clipping pipeline unchanged |
| Phone display | First option photos eager, later options lazy; async image decode, wrapping labels and at least 48px actions; one retry button |
| Lifecycle | pagehide cancels jobs and clears images/selfie/cache; pageshow can rebuild; obsolete jobs cannot publish or overwrite a newer result |

A return-to-prior-outfit race was found during integration: a previous successful
plan must be invalidated when a different render starts, otherwise returning to
that first outfit while a replacement is pending can reuse a success whose DOM
was already cleared. A behavioral regression covers the replacement and the late
completion of its obsolete predecessor.

## Validation at initial publication

- Build passed. Full Node suite: **1,074 passed, 0 failed, 3 skipped; 1,077 total**.
  Ten renderer lifecycle regressions cover coalescing, exact-source/board/category/
  account changes, decode timeout/eviction/retry, page lifecycle, errors, identical
  completed-plan reuse and returning during a replacement.
- Local Playwright download failed with truncated ZIPs. No local mobile-browser
  pass is claimed. The integration workflow runs original-source crop checks,
  synthetic capture/save/style, swap/save/reload, actual IndexedDB abort isolation,
  320/390/430px layouts, both model figures, stale-source changes, stalled decode
  recovery and identical-outfit reuse on Chromium and WebKit in GitHub CI.
- Browser JSON records elapsed time for 12 identical-preview requests over two
  animation frames, DOM mutation count and retained nodes. This is a synthetic CI
  scheduling/reuse measurement, not phone latency, FPS or garment accuracy.

## Limits and coordination

No physical Android/iPhone tests, new independently scored garment masks or
recognition accuracy measurement. Synthetic workers/transparent rectangles prove
software behavior only. Existing licensed-photo holds remain holds. Local fitting
remains an approximate collage with unresolved realistic drape/body occlusion and
final production figure/art rights. No paid provider calls, production merge,
deployment, customer-photo upload, human-review script changes, original PR #58
artwork changes or Drive Duel changes. Same-page queued saves do not establish
cross-tab/cross-browser synchronization.

## Verified integrated runtime checkpoint

Runtime/browser-test head: `d47eccb8011c89ecc622f6384adc90c3daa5dba6`.
Both [customer/fitting run 39447656592](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39447656592)
and [camera/indexing run 39447656752](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39447656752)
completed **SUCCESS** at that exact SHA. The runtime also passed the earlier
6c326481 run before the additional final-layer source/account race coverage.

- GitHub full Node suite: **1,074 passed, 0 failed, 3 skipped (1,077 total)**.
- Local Python discovery with `PYTHONPATH=benchmark`: **37 passed, 0 failed**.
- Android Chromium and iPhone WebKit customer journeys passed save/swap/reload,
  actual local IndexedDB abort isolation, pending-save rerender protection,
  preview after failed storage, long labels at 320/390/430px, single-item entry,
  direct-source and account changes during final garment decode and stalled
  decoder recovery. Both report zero page errors.
- Existing fitting browser scenarios passed in both engines: both figures,
  layers/dress exclusions, completed-plan reuse, delayed stale-image refusal,
  transient garment/base retry, original-photo integrity and conservative real
  licensed-photo holds. Both fitting profiles report **zero remote POSTs**.
- Reuse measurement: **12 synchronous requests, zero child-list DOM mutations,
  same decoded garment nodes retained** in both customer-browser profiles.
  Elapsed two-frame timings are recorded in the JSON; no latency/FPS speedup is
  inferred from these synthetic CI checks.
- [Screenshots and JSON artifact 12277457392](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39447656592/artifacts/12277457392)
  is 3,425,551 bytes and expires January 18, 2027. The connector's local ZIP
  export failed, so no additional visual screenshot inspection or extracted
  elapsed-time value is claimed.

This documentation-only follow-up does not change tested runtime or browser
harness code. Draft integration PR: #69. No merge or deployment.

## Continuation: requests started with an already mismatched account/database

The previous final-decode tests covered an identity change during asynchronous
work. Four further behavioral regressions exposed a separate starting state:
Auth can already identify B while the live database still belongs to A. Capturing
B and checking only that B stays unchanged does not establish database ownership.

The save/persistence context now requires an authenticated owner matching the
native account-specific database name, before entering the write queue and again
before transaction creation. The local renderer checks that binding before any
plan/cache reuse or source decoding, and includes the captured database identity
in asynchronous cancellation. Invalid bindings clear garment/selfie output and
show reload/sign-in guidance. No account database is opened or migrated here.

Build and full local Node suite passed: **1078 / 0 / 3 (1081 total)**; local Python
suite **37 passed**. Four new Node tests failed before the runtime fix. Browser
coverage adds an already-mismatched-owner probe using the actual open IndexedDB,
expecting two rejected writes, zero readwrite transactions, no saved additions,
no published layers and recovery after restoring the valid fixture account.
Exact follow-up runtime CI is now verified at
`875bd61fc3102c90ef4579bb377623a7ec9823b9`:
[customer/fitting 39450202771](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39450202771)
and [camera/indexing 39450202746](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39450202746)
both **SUCCESS**. Full CI Node counts: **1078 passed, 0 failed, 3 skipped**.
Android Chromium and iPhone WebKit customer journeys and fitting profiles all
passed. The new already-mismatched database probes rejected both attempted writes,
opened zero readwrite transactions, added no saved outfits and published zero
garment layers. Restoring the valid fixture account and rerendering recovered.
Both customer profiles report zero page errors; fitting profiles report zero
remote POSTs. Existing 12-request unchanged-preview reuse assertions still pass.
[Evidence artifact 12278895682](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39450202771/artifacts/12278895682)
contains screenshots and JSON (3,425,574 bytes; expires January 18, 2027).
These are browser emulations with synthetic identities/photos, not real accounts,
physical phones, model inference or real-photo accuracy proof. The documentation
follow-up changes no runtime or test-harness code.
