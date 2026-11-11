# Mission 3 — bounded private JPEG response streaming (8 MiB)

## Baseline and release safety
Direct independently verified parent is draft PR #825 HEAD `1c03821079e63220f369cfe75cdfc34230293075` with [NO DEPLOY CI #42956551264](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42956551264), **1,449/1,449 Node and seven real Chromium/WebKit six-case browser workflows at 320/390/430 CSS widths**.

**FAMILY ALPHA HOLD #255.** Isolated draft research only: no merge, release, deployment, staging, production, hosted Supabase writes, real wardrobe accounts or original user photographs.

## Reproduced memory hazard
Prior controller uses `await response.arrayBuffer()` for an authenticated private object after HTTP headers, then checks whether the result exceeds 8,388,608 bytes or its claimed SHA. A misconfigured, compromised or truncated private-storage response could allocate an arbitrarily huge buffer **before** the size safety check, including during cloud restore or collision verification of an existing immutable upload object. Header-only `Content-Length` is insufficient: a body may lie about its length or use chunked transfer.

## Implementation
- `readBoundedPrivateJPEG(response, assertActive)` reads modern browser response streams in chunks, and tracks an 8 MiB total cap *before* appending any out-of-bound chunk.
- Reject an explicit oversized Content-Length before even obtaining a reader; cancel the response to release the connection.
- On streamed overage, cancel reader immediately, reject typed `cloud-photo-integrity`, and stop auto cloud retries via the already verified owner-specific IndexedDB integrity pause. Existing local original photographs, saved outfits, current wardrobe and revision remain intact.
- Cap individual private JPEG Storage GET during both **restore/decode** and **existing-object collision SHA verification**. Verified 8 MiB or smaller responses continue to undergo cryptographic SHA-256 checks before use.
- Enforce an additional 20-second response body deadline and preserve authenticated owner generation lease checks on every body chunk. On browser engines without a streaming reader, retain the legacy ArrayBuffer fallback with a postread cap; no claim of preallocation protection in that fallback.
- Preserve revision-only polling, exact signed owner/draft and nested Storage reference checks, durable device-local/cloud capacity pauses, atomic restores, manual owner recovery and 2D fallback.

## Independent testing
- Node fake-stream tests: oversized total chunks without Content-Length are rejected after the first overage, reader cancelled, no response.arrayBuffer called, owner wardrobe preserved; oversized Content-Length rejects before stream reader creation; conflicting immutable upload source never publishes; valid multi-chunk source restores with SHA; owner manual retry after repairing the remote source succeeds.
- Real Chromium and WebKit browser cases at 320/390/430 use synthetic exactly 8 MiB+1 Storage object, verify integrity refusal, unchanged prior JPEG/outfit/revision across full app reload, owner manual recovery after remote object fix, SHA-verified originals and accessibility.
- Inherited 1,449+ serial Node suite, real owner-pointer, cloud SHA integrity, device quota, foreign-owner, revision-first 1000-photo metadata, capacity, atomic restore, original/cutout private backup, styling and accessibility browser cases.
- Strict five changed research/test/CI/client paths, NO DEPLOY workflow.

**Creation-time status:** pending exact-head CI. This remains a bounded synthetic-byte acceptance, NOT peak heap data for 1,000 distinct genuine high-resolution photos, physical iPhone/Android browser, or live two-account hosted JWT/RLS/Storage. Family Alpha HOLD stays active.
