# Parallel #78 — independent physical-mobile acceptance engineering report

**Tracking:** Issue #970 — https://github.com/nickhaney916-lang/Closet-Current/issues/970

**Source:** Mission 1 P850 draft PR #968, pinned exact verified parent 9ee284f501aff50c810a05caf69fc103bc0393b4; P850 no-deploy 3/3 CI #43360202067 was green (414/414 Node native).
**Branch:** research/parallel78-physical-mobile-photo-acceptance-HOLD
**Release:** **FAMILY ALPHA HOLD #255 OPEN**. Draft only / no merge / no deploy / no hosted Supabase / no private wardrobe or production/staging changes.

## Acceptance result — BLOCKED, not a failure disguised as PASS

- Physical Android Chrome executions: **0**.
- Physical iPhone Safari executions: **0**.
- Owner-authorized testers, signed real account/cloud execution: **0**.
- Independently source-disjoint human-labeled real garment test pairs available in this work session: **0 verified**; blind category/subtype/color/footwear accuracy: **UNKNOWN**.
- Actual camera/gallery original JPEGs sampled on phone: **0**; measured phone model load, inference, CPU and memory metrics: **UNKNOWN**.
- Cloud RLS, cross-user wardrobe privacy, backup/restore and cross-tab acceptance: **NOT TESTED / BLOCKED** (Mission 3).
- 23-case protocol on each platform, 46 total cases: **46 NOT RUN**. No human photos, screenshot claims or synthetic phone-provenance artifacts have been generated.

Engineering readiness CI may PASS independently. It can never lift these real-device gates, assert 10/10 or classify app release as ready.

## What was built

1. **Opt-in memory-only recorder**: public/device-acceptance-78.js, loaded by index.html but inactive unless BOTH ?deviceLab78=1 research flag AND an operator clicks Enable. The tool neither opens cameras nor changes clothing/owner workflows. It offers 23 named scenarios, manual stage interval timing, device-family/model/OS/browser, memory, network, cache, battery and charging categorical provenance, incident severity, original-preserved / owner-gate status and before/after owned-item count, separately deliberate original JPEG and private supporting artifact SHA-256 hashing, explicit operator-claimed manual outcomes and local JSON exports. No network, telemetry, IndexedDB/localStorage writes, auth token reads or upload. Invalid photo types, oversized files, missing proof, undated/stale or forged status fields fail closed. An operator-reported PASS remains unverified.
2. **Public/private receipt separation**: private export retains only whitelisted original/evidence SHA-256, timing and categorical device/case fields, without filename/EXIF/photo bytes/account. Shareable report omits all hashes, precise device/model/version/time, photos and wardrobe counts, always prints independent physical runs 0, accuracy UNKNOWN, and release BLOCKED. Receipts use a versioned fixed set of named scenarios; adding unrecognized data or forging a release status is rejected by the schema validator. SHA-256 is not a hardware attestation, and a user-agent string cannot prove a real phone.
3. **Source-executed tests**: Node checks for false PASS, malicious/free-form fields, missing/invalid digests, timestamp/source constraints, bounded files, 23-case lifecycle and release gate. Chromium/WebKit execute the actual opt-in module injected through real index.html script wiring at CSS 320/390/430, assert OFF by default, explicit launch, no automatic PASS, no horizontal overflow, browser error-free behavior and hash-only in-memory **desktop** screenshot proof. Inherited P850–P843 desktop browser suites validate the app controller separately.
4. **Operator protocol**: research/parallel78-physical-device/OPERATOR-PROTOCOL.md provides physical model and OS/browser matrix; camera permission, interrupted Safari/browser state, cold/warm Wi-Fi/offline, 1/10/25-photo batches, original JPEG hashes, owner-reviewed P843–P850 safety, observed error severity, no-photo-sharing policy and private independent reviewer handoff.

## Important limitations / falsifiable boundaries

- Tooling has **no ability to attest a physical device**. Even a self-declared operator PASS with a digest is an unverified claim until separately witnessed and independently reviewed. No public report can mark release READY; the formal validator always returns BLOCKED. A phone can be tested only through an owner-approved protected HTTPS research environment not provided by this assignment. No unauthorized tester invitations or real-hosted account work.
- Photo SHA checks are of *the exact file manually selected for local hashing*, not automatically of what the existing app persisted; a canvas re-encode changes source bytes and requires explicit original-versus-saved source comparison in a protected test account. A SHA is not evidence that a shoe pair matches physically or the category is true.
- Manual duration timers include human interaction; they are not FashionCLIP/SegFormer inference latency or reliable peak RSS/CPU readings. Desktop Chromium/WebKit emulation cannot simulate Safari hardware camera, tab eviction, actual iOS memory limits or Android power/cache effects.
- Previous P850 synthetic browser and lawful 11-photo source SHA checks do not constitute independently human-labeled ground truth, physical phone results or calibrated recognition performance. P843 owner-corrected acceptance is distinct from raw model accuracy and Mission 3 authenticated cloud privacy.
- The source-level module adds no owner read/write or recognition tuning; it is diagnostic overlay only. Core owner approve-first, repeat-submit lock, photo advice, source/mask and shoe grouping, learning consent, advisory color, cross-capture duplicate and batch-review mechanisms remain inherited and untouched.

## Verification and exact-head status

Dedicated research-only no-deploy workflow: .github/workflows/parallel78-device-acceptance-no-deploy.yml, strict seven-file allowlist against exact P850 9ee284f501aff50c810a05caf69fc103bc0393b4, full native regression and both builds, Chromium and WebKit 320/390/430 source execution plus inherited owner gates, source-hash controls and always-BLOCKED release assertion. **CI success and exact HEAD must be checked via the draft PR and GitHub Actions after final push; an in-progress run is not a pass.**

## Cross-stream handoff / stop conditions

No writes to or merges from #67–#77 branches. #71 and #75 must provide independent source-disjoint double-human original-photo labels; #67–#70, #72–#77 preserve classifier, segmentation, worker, shoe grouping, learning, quality, batch, color and duplicate ownership. Mission 1/P850 owns controller integration. Mission 3 owns authenticated RLS/cloud, atomic owner-private writes and restore/revocation evidence.

The remaining work is **real physical execution**, not paperwork: get separately authorized test devices and private HTTPS environment, photograph genuine labeled clothing, record source-and-owner verdicts, independently verify both Android and iPhone receipts, reconcile real accuracy denominators, run protected cloud account isolation under Mission 3, and have main controller explicitly decide on HOLD. Until then: **MISSION 1 NOT COMPLETE — PHYSICAL ACCEPTANCE BLOCKED — FAMILY ALPHA HOLD #255 OPEN**.
