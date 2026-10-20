# PR #64 + #65 integration — October 20, 2026

Common foundation: PR #51, `9d1dd7d4898dff7697f43eeecafdcfa1c10fe588`.
Source heads: #64 `da7138acec65fffe45e3c53beef9eadee99607cb`; #65
`6bf0364c1fd9d838e432a3a7e02eb60bc17602fd`. Their git merge-base was
independently checked and equals PR #51. Source branches stay unchanged.

## Source evidence verified from GitHub Actions

- #64: runs 39441202514 (preview/browser QA) and 39441202669 (camera/indexing)
  completed successfully at its exact head. Browser job steps include both
  Android Chromium and iPhone WebKit and original-source-before-clipping checks.
- #65: runs 39442878586 (styling/browser QA) and 39442878896 (camera/indexing)
  completed successfully at its exact head. Browser job steps include both
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
