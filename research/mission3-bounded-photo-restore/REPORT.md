# Closet Current — Mission 3 bounded owner-private JPEG restore cache

**FAMILY ALPHA HOLD #255. Isolated draft research. No merge, deployment, staging changes, hosted signed-account access, physical owners or private garment photos.**

## Verified exact parent

Mission 3 clean-sync large-wardrobe PR #808 at `1c243b2da0fb3e785e8af59bcb1fd2ee0a35aa14`, [Actions #42929367957](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42929367957) passed 1,389/1,389 Node, genuine Chromium/WebKit 320/390/430 browser flows, 37 individually verified PNGs and 36 zero-violation axe reports.

## Problem

The cloud restore controller used one unbounded `Map` of every decoded Storage-photo promise. An owner recovering many distinct photographed garments retained every decoded JPEG in that private temporary map **even after the corresponding restored `items` document contained the same full data URL**. For up to 1,000 items with original+cutout photos this could duplicate substantial mobile heap during restoration, despite PR #803 already limiting concurrent fetches to four. This was an avoidable additional retention path, not a claim that entire restore memory was bounded.

## Isolated improvement

- Introduce `ClosetBackupEngine.createPhotoCache(limit=8)`: a strict eight-entry, LRU-bounded map of recently decoded or in-flight photo promises. Reject invalid limits and keys; repeated concurrent SHA-identified private photos share one request; rejected fetches are evicted to permit later retry.
- Native legacy cloud `decode()` uses that bounded cache for owner-scoped `closet-private/<owner>/<SHA>.jpg` objects while preserving SHA verification and the owner/session restore leases.
- The resulting restored items still receive complete verified base64 JPEGs. Cache eviction does **not** remove or crop restored clothes, discard the owner original, change saved outfit references, or trigger new 3D/review approvals.
- The existing four-at-a-time `mapImages` worker bound and atomic transaction remain untouched. The eight-entry bound is per restore operation only.

## Acceptance

- `tests/mission3-bounded-restore-photo-cache.test.cjs` confirms exact parent uses the unbounded Map, while repaired code caps at 8 across 1,000 unique cache loads, coalesces concurrent same-owner references, evicts failed reads for safe retry, preserves all 1,000 item source/cutout fields in order, and restores 64 independent original JPEGs in a real fake-indexeddb/private-fetch controller while checking each owner SHA-256 and avoiding duplicate original downloads.
- Dedicated NO DEPLOY workflow runs exact parent comparison, repaired tests, all application Node tests, genuine Chromium synthetic-owner cross-browser private photo/cutout/looks recovery, and actual Chromium/WebKit mobile photo review, outfit styling, storage recovery and accessibility at 320/390/430.
- Only five paths changed: `public/cloud-backup.js`, `public/cloud-backup-engine.js`, test, report, workflow. Do not claim success until the final exact HEAD jobs and artifact are independently checked.

## Unresolved limits

The result shrinks temporary decoded-photo cache retention. It does not solve total heap required for a full 1,000-real-JPEG decoded private wardrobe, browser IndexedDB quotas, photo download buffering or physical phone crashes. Real hosted authorized two-owner Supabase RLS/Storage, interruption under network and OS kill, real iPhone Safari / Android Chrome memory profiling, independent owner review, and full cross-mission integration remain unverified. Family Alpha HOLD #255 remains absolute.
