# Closet Current Mission 3 — bounded owner-private backup JSON

**FAMILY ALPHA HOLD #255 — isolated draft, no merge, no deploy, no hosted Supabase or customer data write.**

## Exact independent baseline
[Final full Mission 3 engineering convergence PR #842](https://github.com/nickhaney916-lang/Closet-Current/pull/842), HEAD `96473768938bccfc60eb014c03908e8b2f789dcc`, [NO DEPLOY GitHub Actions #42963922484](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42963922484), **1,475/1,475 serial Node tests**, eight independent six-case Chromium/WebKit mobile browser groups, signed ephemeral RS256 two-owner native **real disposable PostgreSQL 17 RLS** and Storage owner-policy acceptance. Family Alpha HOLD remains open; hosted signed two-account credentials, physical Android/iPhone and 1,000 genuine legally usable photos are not certified.

## Found mobile memory/privacy fault
The private cloud JSON APIs previously used `await response.json()` directly for REST revision, full owner backup document and save RPC. An oversized owner-row JSON response (or huge malformed data) can allocate its entire response body **before JSON validation**, bypassing the existing 8-MiB private JPEG stream cap. A slow/hung body can continue after the HTTP header-level 20-second timeout is cleared.

This is especially harmful on mobile when the user has saved original JPEGs locally. A broken cloud JSON must never destroy local items, private original source JPEGs, saved outfits or an acknowledged cloud revision.

## Repair in the native owner cloud controller
- `readBoundedCloudJSON(response,limit,assertActive)` handles HTTP Response body streaming with a **64-KiB limit** for revision-only and one-number cloud CAS replies, **32 MiB** for full owner backup JSON (including bounded legacy inline reviewed cutouts). Reject oversized Content-Length **before acquiring a reader**. For chunked or missing-length responses, reject the first chunk that would exceed the cap, cancel the reader and stop further buffering. Recheck active signed-owner lease per chunk.
- Independent **20-second response-body deadline** after headers, with cancellation. Timeout errors remain transient connection retry rather than falsely claiming permanent SHA corruption.
- Decode via strict fatal UTF-8 TextDecoder and JSON.parse **only after** the full byte count is bounded. Truncated/malformed owner backup bytes become a typed private-cloud integrity failure, not a partial wardrobe restore. Existing owner-specific IndexedDB integrity quarantine persists across reload and requires deliberate signed-owner Sync after remote repair.
- All changes preserve real SHA-attested JPEG reference validation, 8 MiB photo Storage cap, remote 404 repair, local bad-photo pause, 1,000 garment cold-login memory improvement, signed owner/Storage path, stale edit/delete CAS fence, atomic IndexedDB restore and optional native styling; no backend/SQL/Auth/recognition/camera/3D changes.
- Legacy/mocked responses without a streaming reader retain the old `response.json()` compatibility path. **No claim** that this fallback prevents preallocation of unusually large bodies; native mobile HTTP fetch streams are the target.

## Independent safety/acceptance
- Fake-IndexedDB explicit owner test fixtures verify exact previously verified parent has unbounded calls; current controller refuses full 32 MiB+1 remote body (header, chunked and malformed UTF-8) before local restore. Verify zero extra cloud requests on re-sync/reload, unchanged local original/board/revision, safe owner manual restore after genuine repair.
- Revision-only and successful CAS response each refuse >64 KiB. Valid small native JSON restores and publishes as before.
- Actual Chromium and WebKit mobile viewport cases at 320,390,430 CSS px: synthetic 32 MiB+1 cloud document response with legitimate small revision, refused before **any private Storage photo GET**; durable integrity pause survives full reload, owner original/outfit/revision remain; manual Sync after JSON correction completes SHA-verified original/photo recovery and accessibility screenshot.
- Full serial Node regression; inherited real PostgreSQL 17 signed two-owner RLS in disposable CI with zero hosted account usage; owner deletions under held private JPEG POST, genuine Chromium/WebKit local/remote photo repair, 1,000 distinct 1280×1680 synthetic JPEG memory and 8 MiB streamed Storage cap.

## Acceptance limitations and release HOLD
A 32 MiB full backup JSON bound can reject extraordinarily large historical inline-cutout documents. This **fails closed with untouched local data**, not silent photo loss; requires approved operator migration or cleanup of unsupported large old backup. The 32-MiB ceiling is engineering judgment rather than independently validated production distribution quantile. Physical iOS Safari/Android OS-memory kills, real photographed garments, authentic hosted Supabase signed two-owner Storage and release sign-off remain unverified. No production or existing staging access or mutation. Family Alpha issue #255 must remain OPEN.

**At creation: exact-HEAD CI pending.** Do not claim green or 100%-complete until independently verified; this milestone alone does not lift any external release blocker.
