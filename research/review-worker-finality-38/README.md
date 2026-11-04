# REVIEW-WORKER-FINALITY-38 — no late model mutation during a confirmed save

**DRAFT RESEARCH ONLY. Family Alpha Issue #255 HOLD. No merges, production or staging changes, or deployments.**

## Confirmed source baseline

Verified [PR #594](https://github.com/nickhaney916-lang/Closet-Current/pull/594), exact parent `77d5c760c847d6e2f544512e80fd8598fd610dad`, dedicated 2-job success [Actions #41925586024](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41925586024): 543/543 Node, 6 fixture-auth two-owner browser flows/24 screenshots and 56 real signed disposable Supabase HTTP security checks (distinct scopes). Parallel #30 now independently owns genuine signed browser-to-cloud end to end. Parallel #27 owns SegFormer semantic accuracy. Neither is changed here.

## New issue found in source

`research/multi-garment-capture-01/review-ui.mjs` displayed the final human-confirmed state and acquired `submitting=true` before its async duplicate-preflight, but **left the automatic detection Worker running**. Late `piece`, `progress`, `done`, `error`, or timeout callbacks could then update the reviewed `state.pieces` and/or status during that atomic save. This introduced new unverified cards after human consent and could replace the pending-save status or already-persisted receipt with model progress. A worker may also deliver a previously queued callback even after termination.

## Corrected, bounded behavior

At the precise successful human-review → submit boundary, `freezeDetector38()` cancels the worker timeout, revokes `job` identity and calls Worker.terminate() **synchronously and before the first asynchronous IDB read**. The source image, original JPEG SHA, already visible suggestions and unconfirmed manual pieces remain in memory; it **does not** save them without consent. Additional `submitting` checks in detection, onmessage, onerror and timeout callbacks fail closed if browser tasks were queued before the save. A rejected preflight does not resume the stopped worker, but manual crop/correction and reimport remain available. This tradeoff favors a stable confirmed save over new proposals.

No recognition thresholds, masks, categories, photo extraction algorithms, public production runtime, auth, cloud, RLS or 3D mesh code changes.

## Acceptance plan and evidence

- Build the actual application and run **all inherited Node tests plus four new invariant tests**.
- Run original source-epoch browser acceptance and original immutable-save browser acceptance to guard compatibility.
- Run **six real Chromium/WebKit mobile UI and IndexedDB cases**, widths 320/390/430, using a locally generated synthetic JPEG and fixture worker that intentionally stays alive until save begins. Force late **piece, progress, done and error** callbacks after the detector has terminated, both during delayed genuine IndexedDB transaction and after its completed transaction and failed UI notification/refresh. Require zero new rows, zero new cards, truthful successful save receipt and preserved original photograph SHA.
- Independently verify **12 actual PNG screenshots** from these six new cases by file hash, PNG width/height, pixel variance and source identity.
- Reject external network requests. Original sample photo and model proposals are **synthetic**; there is **no real model inference accuracy, actual phone, signed browser-to-cloud, or customer-account claim**.
- CI has strict parent ancestry, changed-path allowlist, no deploy job and retains only synthetic test evidence.

**Completion is conditional on dedicated GitHub Actions success at exact final HEAD**, not a branch or pending PR. Never merge, deploy, or release Family Alpha based on this research-only milestone.
