# Mission 3 — native no-stream private cloud response memory fence

**FAMILY ALPHA HOLD #255. Research draft only. No merge, deployment, staging, hosted Supabase, or owner photos.**

## Verified baseline

Exact direct parent is Mission 3 [draft PR #861](https://github.com/nickhaney916-lang/Closet-Current/pull/861) HEAD `d2465623520a9e9faa48f79726ba177198594675`. [No-deploy Actions #43061712223](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43061712223) completed 2/2 jobs success, **1,502/1,502 serial Node tests**, all inherited mobile Chromium/WebKit 320/390/430 suites and disposable signed RS256 owner-scoped PostgreSQL 17 RLS.

## Defect

Current `readBoundedCloudJSON` correctly caps a streamed owner response at 32 MiB (full metadata), 64 KiB (revision or RPC), and `readBoundedPrivateJPEG` caps a streamed photo at 8 MiB. But when a **native `Response` has no readable `body` stream**, their compatibility fallbacks call `response.json()` or `response.arrayBuffer()` **before checking the size**. A misleading or missing Content-Length leaves this path unbounded. It cannot establish a mobile memory bound.

## Correction

Both actual native cloud reader functions now refuse a real platform `Response` whose body does not provide `getReader()`, using the existing `cloud-photo-integrity` fail-closed status. This preserves local originals, saved outfits and the existing durable owner-specific integrity recovery path. Normal streaming Fetch responses remain unchanged. The old non-Response plain JavaScript stubs used in legacy Node tests still have their historical fallback; **those stubs are not proof of a production network size bound**.

## Independent targeted test

`tests/mission3-native-unstreamed-response.test.cjs` extracts and executes the **actual** private JSON and JPEG readers. It runs against the verified parent source (which demonstrably invokes unbounded parse/buffer) and the changed current source (which refuses both before allocation). It also exercises real native `Response` streaming with legitimate JSON/JPEG and verifies legacy stub compatibility. No fabricated code copies are used for the reader functions.

## Acceptance and exclusions

Dedicated strict 4-path, exact verified-parent, no-deploy CI preserves the entire existing P861 local signed-JWT PostgreSQL, 1,502+ Node regression and Chromium/WebKit 320/390/430 tests. **Require final exact-head 2/2 SUCCESS before claiming completed checkpoint.**

This does not certify live Supabase Auth + Storage, physical Android/iOS camera and memory, real owner garments, or integration of Missions 1 and 2. Existing Family Alpha HOLD #255 remains in force.

**Status when authored: CI pending.**
