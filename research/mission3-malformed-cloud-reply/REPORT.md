# Closet Current Mission 3 — malformed successful cloud response quarantine

**FAMILY ALPHA HOLD #255; isolated draft research only. No changes or deployment to main, existing staging/production, hosted Supabase settings or customer photographs.**

## Parent evidence and problem

Direct independently verified parent [PR #845](https://github.com/nickhaney916-lang/Closet-Current/pull/845) exact HEAD `98385b5ef1aab20f6b9aa101d1ff8841f7c2c9ae` passed [NO DEPLOY CI #42967517555](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42967517555): **1,482/1,482 serial Node tests** and **54/54 genuine Chromium/WebKit 320/390/430 CSS viewport cases**, including signed two-owner ephemeral RS256 Auth/JWT against real disposable PostgreSQL 17 RLS, 1,000 high-resolution *synthetic* garment images, private SHA/JPEG source/restore, a 32-MiB streamed cloud-document body cap and owner-scoped durable integrity quarantine.

An untrusted successful HTTP 200 cloud response could still be **syntactically valid JSON but structurally invalid**. For `GET /rest/v1/closet_backups`, duplicate rows, a null row, or an invalid revision type/number threw ordinary `Error`/TypeError. The controller treated these as transient network errors and scheduled repeated background retries/focus/online requests. For `POST /rest/v1/rpc/save_closet_backup`, malformed JSON such as `{"revision":1}` could arrive **after a real successful remote CAS**, but its ordinary `Error('Invalid cloud save')` caused automatic retries of a state-changing backup, risking repeated cloud writes or conflicts.

## Surgical fix

- Reject valid-JSON but invalid REST row collection, null/non-object row, invalid revision with the existing typed `cloud-photo-integrity` failure. No original/photo/outfit/metadata restore occurs before validating the owner revision envelope. This is distinct from normal 503, which remains retryable.
- Reject malformed but HTTP-200 successful save RPC payloads with the same durable per-owner signed-session integrity quarantine. Preserve the old base revision, local dirty edit and source photo; require explicit owner Sync after the backend shape/revision is repaired and verified.
- Reuse existing secure per-owner `cloud-sync.integrityPause`, session lease checks, immutable JPEG SHA/photo path constraints, capacity and quota stops, and safe manual recovery. Do not change SQL, owner Auth, recognition or 3D.
- Expand the owner-visible integrity warning to mention an invalid cloud response in addition to photo/SHA/oversized data.
- A **JSON null** RPC result remains the established CAS contention signal and schedules the normal CAS retry; no false quarantine. Temporary HTTP 503 should still retry.

## Verification contract

- Exact verified parent-only reproduction test explicitly proves old generic malformed REST and save errors; new fake-IndexedDB suite tests duplicate rows, null row, wrong revision type and wrong JSON envelope; all must persist owner-only stop without a single background re-fetch, survive controller start/reload, preserve original source/items and saved local revision.
- Simulate a **remote save which already committed**, but returns malformed JSON `{"revision":1}`. The new controller must **not** issue another write until user clicks Sync; after successful repair it re-reads the actual remote revision, reconciles the original owner record and publishes without duplicate/edit loss. Owner's private local original stays intact.
- Actual native app Chromium/WebKit at **320/390/430 CSS px** test three distinct malformed valid JSON revision envelopes (duplicate rows/null row/wrong revision type) across fresh-page reload and manual repair, including original JPEG SHA, outfit preservation and accessibility.
- Entire serial Node regression, real browser 32-MiB cloud-response and 8-MiB storage-object guards, 1000 distinct synthetic 1280×1680 JPEG startup memory, stale owner delete/edit CAS fence, photo correction/recovery/ownership, photo-to-private-closet styling and **real disposable PostgreSQL RS256 signed two-owner RLS** acceptance. Strict NO DEPLOY five changed-path allowlist.
- Inspect exact run SHA and screenshot/JSON artifacts independently before marking this milestone verified.

## Hard acceptance limits

This protects only structurally invalid success envelopes; cannot compensate for a compromised server returning **plausible but maliciously false** integer revisions. Local SQL RLS with cryptographically signed ephemeral subjects is not hosted Supabase Auth+Storage. Playwright mobile viewport and synthetic photos are not physical Android Chrome/iPhone Safari low-memory/permission acceptance or real licensed photographed garment evidence. Existing production/staging/cloud accounts unchanged. **Family Alpha HOLD #255 remains OPEN and no merge or deployment occurs.**

**Created before exact-HEAD CI**. Do not claim complete or release-ready until genuine external hardware and authorized hosted two-account acceptance gates pass.
