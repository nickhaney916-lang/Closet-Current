# M20 — browser-tree memory evidence for genuine continuous-model WebKit acceptance

**Research-only / no deployment / Family Alpha #255 OPEN HOLD.** Master tracking #1054. Exact parent at branch creation: `adf8c3912c68a1a3fce6e7598a35d11c3251e4db` (master consolidation #1139; WebKit16 staged but unverified at start). This is **not** a new successful 16-photo inference claim.

## Gap and isolated fix

The integrated M4 real FashionCLIP/FashionSigLIP runner's source-bound receipts recorded browser worker events and genuine inference timing but explicitly set peak browser process RSS to **UNMEASURED**. That prevented a memory trend diagnosis on continuous WebKit. This branch adds only research instrumentation, adversarial tests, a disposable Chromium/WebKit desktop smoke test and a separate no-deploy CI workflow. It does **not** edit `public/`, `supabase/`, source photo manifests, model weights, owner approval, or original images.

`browser-process-memory.mjs` enumerates only the Playwright BrowserServer parent and descendants via Linux `/proc/<pid>/status`. It records sampled root RSS, sampled **sum of process-tree RSS** (which double-counts shared pages), optional sampled **sum of process-tree PSS** from `smaps_rollup` (proportional shared memory), process count and whether the reads were complete. It never exports PIDs, command lines, environment, user paths, JPEG bytes, usernames or tokens. If `/proc` or PSS is inaccessible the relevant values stay `null`, never estimated.

The genuine-model runner samples the browser process tree every two seconds and at completed inference rows, preserving whatever numerical observations exist even on an incomplete wall-budget run. Telemetry exceptions are fail-soft and **cannot turn an inference failure into a success** or interrupt the original result. The final acceptance still requires every real model/source/JPEG/owner and no-auto-save guard.

## Acceptance and limits

- Pure fixture tests: descendant scoping, unrelated host exclusion, missing PSS and missing root, and source-locked retention of owner/exit guards.
- Desktop browser smoke: launch actual disposable Chromium and WebKit, check Linux parent/child RSS values, leave PSS unavailable if inaccessible. This **does not** use genuine models.
- The branch's CI is limited to the research workflow on its own branch or draft PR; read-only, ephemeral container, no hosted cloud or paid service.
- The **actual 16-photo WebKit continuous real-model run**, sampled fitted-cloth visual authenticity, physical iPhone/Android, independent blind accuracy, production memory/real devices, and hosted owner accounts remain separate BLOCKED/UNVERIFIED gates.
- Sampled maxima are **not continuous peak usage or proof of OOM**. Total RSS is not physical unique consumption; use PSS if all component smaps are readable. No unobserved crash cause is inferred.

**Exit rule:** only call this instrumentation *verified on actual desktop browsers* if its exact-head branch CI completes successfully. Only call *WebKit16 model memory evidence verified* after a separate source-pinned full real-model run completes and the exported receipt actually contains non-null samples. This branch does not automatically merge into master or clear HOLD.
