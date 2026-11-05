# Closet Current — DETECTOR-MANUAL-RECOVERY-65

**Research only, Family Alpha Issue #255 HOLD, no production/staging modification, merge or deployment.** Exact verified starting point REVIEW63 SHA `78e6ecdaeb836626ee2c31dedfbf4b627036271c`, [no-deploy Actions #42067239185 SUCCESS](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42067239185), 673 inherited Node tests, 18 mobile browser scenarios and 48 reviewer screenshot hashes. Parallel Work #36 owns real learned segmentation accuracy, #37 owns genuine source benchmarks and human adjudication, and #38 owns genuine photo→3D cloth-fitting; this priority changes **none** of those and never touches other apps.

## Discovered actual defect

The active research native multi-garment viewer's `startFile` verifies and holds the unchanged source JPEG and shows the manual Add missed piece control. But `new Worker('outfit-worker.mjs')` and `worker.postMessage` ran under the outer source-verification try/catch. Any *synchronous* worker initialization/post failure consequently called `reset('Could not verify photo')`, falsely implying the good source photograph had failed verification, deleting the original from visible review and clearing manually added items. Ordinary worker error/timeout paths preserved the photo but provided no immediately available explicit **stop an unresponsive model while keeping manually reviewed crops** control. A late `piece` after `done` could enter the same still-live job before terminal cleanup had finished.

## Actual engineering mitigation

- Separate model initialization/postMessage exceptions from original photo SHA/decode failure. On worker failure, keep **same already authenticated owner session, original unchanged JPEG, existing crop cards and explicit human-confirmation requirements**. Never auto-save a crop.
- Provide an explicit **Stop AI; keep manual review** button while segmentation is active. It only revokes/terminates the detector job and its timeout. It never cancels the entire photograph or deletes human review work; Cancel extraction remains a deliberately separate full-session reset.
- Preserve the real model's existing 300-second watchdog. Timeout, worker runtime error, `messageerror`, constructor and `postMessage` failure all use the same source-safe manual fallback, with visible user-oriented instructions.
- Mark a worker `terminal=true` immediately on a matching done/error packet; ignore all later proposals or progress packets, even before microtask cleanup. Revoke exact worker identity on explicit stop, Save and logout.
- Preserve source SHA and crop-reviewed true boolean, user-confirmed category/subtype/color, existing 12-auto/24-total proposal limits, immutable atomic owner-private save, duplicate rejection, V4 backup/restore, Style My New Clothes and no unearned 3D Ready claims.
- No new model, model weights, classifier, segmentation accuracy claim or source image substitutions.

## Actual native browser acceptance

A deliberately **synthetic worker-failure fixture** (not an automatic clothing model) returns distinct failure types only when Playwright explicitly selects `DETECTOR65=1`:

| Actual WebKit/Chromium mobile-width view | Failure injected |
|---|---|
| Chromium 320 | Worker constructor throws |
| Chromium 390 | `postMessage` throws |
| Chromium 430 | Worker `onerror` |
| WebKit 320 | Worker `onmessageerror` |
| WebKit 390 | Worker timeout, test-accelerated ONLY in the fixture |
| WebKit 430 | User presses Stop AI on deliberately stalled worker |

For all six scenarios, use the unchanged, externally SHA-verified licensed 800×750 original Wikimedia JPEG, genuine mobile-size native UI, synthetic sign-in HTTP responses and authentic per-owner IndexedDB. Prove that worker failures leave the source hash intact and private rows zero; manually crop and explicitly select category/type/color for **three actual separate image pieces**; save private garments atomically; prove the real owned Style combination, duplicate rejection, saved Outfit Builder, V4 backup/restore and second-account isolation. Full-page 320/390/430 screenshots capture the failed-AI manual fallback before saving; each of the additional 66 screenshots is independently source/pixel-dimension/SHA audited.

Rerun six inherited native manual-source browser cases and six existing synthetic single untrusted-detector proposal cases. App/source build and all inherited Node tests, plus new adversarial finality, worker-error and source-provenance assertions, must pass on a strict exact-parent branch-scoped no-deploy CI.

**Scientific boundary:** An injected worker error validates safe fallback and private workflow, NOT actual SegFormer/FashionCLIP correctness or physical phone acceptance. Family Alpha remains HOLD. No production merge or staging deploy. Real independent category/subtype/color accuracy remains NEEDS REWORK; do not infer progress in #36/#37/#38 from these tests.

**Final evidence:** Draft research PR, exact commit HEAD, dedicated no-deploy Actions SUCCESS, complete Node count, six new browser flows, screenshots, SHA audit, honest technical blockers and no unauthorized changes.
