# Closet Current Mission 1 — P871 fail-fast Worker transport protocol

**Family Alpha HOLD #255 OPEN. DRAFT, UNMERGED, UNDEPLOYED.**

## Exact parent
[Mission 1 P870 PR #1057](https://github.com/nickhaney916-lang/Closet-Current/pull/1057), immutable verified `5e181dcbd090ea79aa998bbb2aa2dbbe48047883` — [NO DEPLOY run #43511943277](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43511943277): 580/580 native tests and six Chromium/WebKit desktop browser policy profiles. Do not merge, deploy or modify protected main/staging/production, private wardrobes or hosted Supabase.

## Actual source gap
`public/dual-core-82.mjs` `browserRequest82()` handled normal Worker `error`, `postMessage` synchronous failures, progress callback faults, cancellation and timeout, but had no `onmessageerror` handler. The Worker API uses the *separate* `messageerror` event for an inbound message it cannot deserialize. It is not guaranteed to invoke `error`. That can leave `busy82` occupied, keep a large optional model Worker alive until the 240-second deadline and prevent immediate retry. A same-request message with an unknown `type` also previously fell through without resolution. These are source-level transport gaps, **not an observed or proven cause of #83 continuous WebKit process closure**.

## Conservative fix
- Register `worker.onmessageerror` to settle immediately with `P82_MESSAGE_DECODE_FAILURE`, close the Worker and release `busy82`.
- On terminal cleanup, detach `onmessageerror` alongside message/error handlers, making stale late events inert.
- Treat a same-request but unknown Worker message type as `P82_WORKER_PROTOCOL` instead of silently waiting for timeout. Keep known `progress`, `result`, `error` messages unchanged.
- Source-running fake Worker regressions prove deterministic decode failure, ordinary retry not BUSY, unknown-type protocol fault, continued valid progress, late stale decode event, throwing `terminate`, and inherited review-first HOLD. No automatic saves or owner/private photo access.

## Test and evidence scope
Exact-parent, only-four-path GitHub Actions NO DEPLOY workflow checks source scope; full serial Node suite and both builds; original-JPEG SHA + IndexedDB reload and owner Remove in desktop Chromium/WebKit; dual-model consent/revision/stale owner/error policy at 320/390/430 CSS widths, private footwear pairing and release evaluator status BLOCKED. Record pass only after exact final-head CI completes successfully.

The test fabricates Worker transport events; it does **not** perform real FashionCLIP/FashionSigLIP inference, prove WebKit repeated-photo stability, improve 48 public development JPEG model accuracy, supply independent human ground truth, or test physical phones. Real-model crash research stays with issue #1034 (Parallel #83). No claims of 10/10 recognition, owner pilot readiness or release approval.

## Gate
Keep source originals, owner consent, no wrong auto save, 2D fallback, physical garment unit protections and Family Alpha HOLD issue #255. Release and owner trial remain **NO GO** until independently labelled source-disjoint real-photo accuracy, real continuous WebKit, physical devices and signed multi-user cloud are validated.
