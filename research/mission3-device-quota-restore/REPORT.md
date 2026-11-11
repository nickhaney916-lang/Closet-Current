# Closet Current — Mission 3 atomic local rollback on cloud restoration storage exhaustion

**FAMILY ALPHA HOLD #255. Independent isolated DRAFT. No merges, production/existing staging deployment, real owner photographs, hosted account writes, or Mission 1/2 modifications.**

## Exact previously verified parent
Mission 3 durable 413/507 cloud capacity PR #814 HEAD `e0bc31c5fe692524f5c57f0d50e572d1d21df47f`; [NO-DEPLOY Actions #42940206707](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42940206707) **SUCCESS**: 1,408/1,408 Node, six actual Chromium/WebKit 320/390/430 synthetic-owner reload/manual Sync cases, 43 verified screenshots and 36 axe reports without automated violations.

## Discovered local failure path
A cloud REST restore can decode all verified original JPEGs successfully but then run out of **device IndexedDB quota** while replacing private `items` and saved outfits. The previous implementation made all restore writes in one transaction, but asynchronous `state.get('cloud-sync').onsuccess` had no explicit catch/abort when an `IDBObjectStore.put` throws synchronously. That risks an uncaught browser error and an ambiguous generic 'cloud connection unavailable' retry loop. A huge private photo restore could repeatedly redownload a complete remote wardrobe without giving the owner a device-storage explanation.

## Implemented scope
- Wrap the asynchronous IndexedDB restore callback in a catch that explicitly aborts the **single** readwrite transaction on any synchronous item, outfit state or final revision marker failure. Preserve original quota exception for the sync error handler. Original local garment records, original photographs, saved outfit slot references and old revision remain unchanged after an abort.
- Distinguish `QuotaExceededError` and legacy quota DOMException from remote connectivity failures. Display a precise status explaining that existing local clothing is unchanged and device storage must be freed before retry.
- Suppress repeated automatic photo downloads from online/focus/interval/new-changes triggers for that session. An explicit owner click on **Sync closet** can safely retry after freeing local storage. The original owner/session lease and verified photo SHA checks remain enforced.
- Local storage exhaustion may prevent writing any persistent marker; therefore this new local-device quota pause is **per-page-session only** and a reload may reattempt. Do not claim durable suppression across device restarts. The **remote** 413/507 durable marker from PR #814 is unchanged.
- No changes to cloud RLS, authentication, public camera recognition, photographed clothing 3D, local photo deletion or protected environments.

## Evidence acceptance
- `tests/mission3-device-quota-atomic-restore.test.cjs` uses only synthetic two-item cloud JSON, genuine SHA-verified deterministic JPEG bytes, and owner-specific fake-indexeddb. It fault-injects `QuotaExceededError` at **the first incoming garment insert** and at **the final cloud revision-marker update after preceding items and outfits were queued**, independently verifies exact pre-restore owner records/outfits/revision unchanged, blocks repeated redownload, recovers via deliberate manual Sync, and proves successful SHA-bound original restoration. The exact parent comparator demonstrates absent explicit async quota abort, without triggering intentional uncontrolled exceptions in the parent.
- NO DEPLOY CI `.github/workflows/mission3-device-quota-restore-no-deploy.yml` must pass exact parent comparator, repaired fault injection, complete Node application regression, real Chromium/WebKit 320/390/430 synthetic-owner capacity persistence and original photo-to-private-closet/styling browser workflows, cross-browser private backup/restore and accessibility.
- Final exact-head CI and artifacts must be independently read before declaring this milestone verified.

## Remaining mission release blockers
No authorized disposable hosted Supabase project or genuine signed A/B test accounts were available; the existing staging/production RLS metadata read-only inspection cannot be represented as real JWT cross-owner acceptance. Real Android Chrome/iPhone Safari device memory/quota/OS-kill and 1,000-distinct-full-size actual garment JPEG peak heap/restore acceptance are outstanding. Missions 1 and 2 own independent real-photo recognition and 3D realism integration. Family Alpha HOLD #255 stays OPEN.
