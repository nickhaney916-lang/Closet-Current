# Closet Current — Mission 3 permanent cloud capacity refusal and owner recovery

**FAMILY ALPHA HOLD #255. Independent DRAFT, UNMERGED, UNDEPLOYED.** No production/existing staging changes, no live owner data, no secrets, no Mission 1/2 branch edits.

## Exact verified parent

Mission 3 bounded private upload PR #810 at `5bf5b4c153215313c2dc78aa727be8f3daef0c95`: [GitHub Actions #42934779208](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42934779208) success, **1,400 / 1,400 Node tests**, actual automated Chromium/WebKit 320/390/430 fixture-driven mobile flows, **37/37 independently decoded/hashed screenshot files** and **36/36 zero-axe-violation accessibility reports**. Original JPEGs and signed hosted accounts not modified.

## Defect

When the private cloud backend returns **HTTP 413** for an oversized photograph or **HTTP 507** for insufficient storage capacity, the legacy cloud client reported a generic network problem and repeatedly retried on timer/focus/online/60-second events, potentially re-sending many private JPEGs and consuming mobile data/battery without any corrective action.

This is different from a transient **503** network/server failure: automatic backoff is useful for 503, but wasteful for a persistent capacity limit.

## Isolated implementation

- A 413 or 507 on an already-dirty private backup stops automatic retry and provides a specific visible/accessible explanation: original photographs remain on this device, and the owner should resolve the cloud capacity/file-size problem then deliberately press **Sync**.
- The existing Sync button now performs an explicit user-driven retry even when the current owner session has been paused for capacity; failed 413/507 retry re-pauses; successful retry resumes normal syncing.
- Existing pending local garment/draft/outfit records and original JPEGs are not deleted or modified by the rejected cloud request.
- `online`, `focus`, periodic sync, and new `changed()` notifications cannot automatically restart a known-permanent capacity failure in that current session.
- A fresh authenticated `start()` resets the pause, and the original session/owner checks remain effective. An HTTP 503 or other transient error still receives existing exponential automatic backoff.
- This is an in-memory **per-session** pause. A full page reload will attempt sync again; the app does not yet persist the quota-blocked status across app restarts. This is an explicit remaining limitation, not a claim of permanent durable quota suppression.

## Verification requirements

`tests/mission3-cloud-capacity-pause.test.cjs` uses only synthetic owner UUIDs, fake-indexeddb, dummy JPEG data URLs and controlled in-memory cloud responses. It reproduces the parent's recurring 413 attempts, verifies the 413 quiet/recoverable state, 507 manual retry success, uninterrupted local photos, 503 backoff preserved, and owner controller restart recovery.

The `.github/workflows/mission3-cloud-capacity-no-deploy.yml` pipeline must run exact-parent comparator, repaired tests, full serial Node/build, actual Chromium synthetic-owner original/cutout backup/restore and real automated Chromium/WebKit 320/390/430 photo capture→manual review→private closet→styling, quota failure handling and accessibility. **Read the final exact HEAD run and artifact before declaring verified.**

## External acceptance still needed

Actual signed isolated hosted Supabase Auth/RLS/Storage test-account rejection, physical mobile network/quota measurements, OS kill/background camera and IndexedDB quota recovery, peak heap with real distinct large JPEGs, independent owner-reviewed photos, and full Mission 1/2 integration. Existing production/staging untouched; Family Alpha HOLD #255 remains OPEN.

## Inherited concurrent LRU test correction

The complete regression uncovered a pre-existing overstrict assertion from Mission 3 PR #809: the restore test required **exactly 64 Storage GETs** for 64 unique originals, each referenced twice. The eight-entry LRU deliberately permits a re-fetch if four asynchronous workers interleave and evict an entry between its first and second field. A observed 65th GET did not change any photo bytes, source SHA, owner isolation or atomic result. The corrected test now requires **64 unique owner-private SHA paths**, every file fetched at least once and at most twice, and all 64 source SHA receipts validated after restore. This is an evidence assertion correction, not permission to skip integrity verification; the separately tested promise cache still coalesces simultaneous same-key reads.
