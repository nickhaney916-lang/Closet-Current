# Closet Current — Mission 3 durable cloud capacity backoff (owner-private)

**FAMILY ALPHA HOLD #255. Isolated DRAFT research. No merges, deployments, existing staging writes, customer photo access, or modifications to Mission 1/2 work.**

## Exact prior verified baseline
Mission 3 PR #812, HEAD `773c4df18103a59bf54f2d63774b3bf30fe5f2dc`, GitHub Actions [#42936463577](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42936463577) **SUCCESS**: 1,404/1,404 Node tests; genuine synthetic-fixture Chromium/WebKit camera/manual-review/private closet/styling at 320/390/430; 37 validated PNGs, 36 automated axe reports without violations.

## Gap closed by this draft
PR #812 stopped repeated 413/507 uploads **only while the same JavaScript page remained active**. A full browser reload, PWA restart, or switching away and back into the original authenticated owner session could reset `pausedCapacity`, immediately re-upload oversized JPEGs or keep retrying against a known-full cloud backend.

### Scoped repair
- Store `capacityPause: 413 | 507 | null` in the **current owner's** existing IndexedDB `state['cloud-sync']` marker. Cloud serializable state IDs exclude `cloud-sync`; this value never enters the shared cloud document.
- A newly started signed owner controller reads this **small marker first**. A durable 413/507 refuses all automatic network access, including cloud GETs, before reading or cloning any owner JPEGs; it displays the precise status and keeps the existing Sync button available.
- Only explicit owner-initiated Sync clears the durable pause and tries again. If the remote still returns 413/507, the failure is re-persisted, and no automatic retries resume.
- Dirty source edits do not clear the pause or cause background upload storms. Successful recovery clears the marker, preserves all original photos and normal clean sync; 503 remains retryable.
- DB writes are protected by the existing generation, signed owner, and database identity lease. A failed IndexedDB write shows a candid warning rather than implying the pause will survive restart.
- The marker survives reload and owner account switching, yet stays scoped to the owner-specific IndexedDB. Other signed owners can back up independently.

## Exact parent-vs-repair acceptance
- `tests/mission3-durable-cloud-capacity.test.cjs` must reproduce automatic upload after reload on the verified PR #812 parent, then prove the repaired implementation blocks 413/507 across fresh VM/module recreations, preserves 6 original photos, requires manual recovery, retains the block on repeated failure and after new local edits, clears after successful recovery, distinguishes unrelated owners, and preserves 503 retry behavior.
- `scripts/test-mission3-durable-capacity-browser.mjs` performs actual Chromium and WebKit reload-and-retry flows at **320/390/430 CSS widths**, using synthetic garments and mocked owner-specific REST/Storage endpoints (not a hosted Supabase security acceptance). It verifies the actual app retains the owner-only photo and SHA receipt, has zero cloud network calls after reload while blocked, displays accessible capacity status, permits a genuine DOM Sync click after recovery, and emits screenshots plus axe reports.
- Strict no-deploy CI also builds the app, runs the complete serial Node suite, synthetic-owner Chromium cloud backup/restore and canonical Chromium/WebKit photo-to-private-closet/styling plus accessibility. Only five research paths may change. **Check CI at the final exact HEAD before declaring verified.**

## Remaining hard release constraints
True authorized signed two-account Supabase Auth/JWT/RLS/Storage rejection in a **new approved disposable project**, physical Android Chrome / iPhone Safari with camera interruption and OS kills, and full 1,000-distinct-real-JPEG peak heap/quota failure tests remain outstanding. Browser emulation is not physical-device acceptance. Independent recognition and photographed-clothing 3D quality belong to Missions 1 and 2. Family Alpha HOLD #255 remains active.

## Inherited regression expectation update
The complete application Node suite initially found an **inherited PR #812 test** expecting a restarted owner controller to clear a capacity failure and upload automatically. That expectation directly conflicts with this milestone's new durable owner-specific pause. The test now requires zero cloud requests after restart and explicitly clicking **Sync closet** once the capacity issue is resolved. This is an intentional semantic update, not a disabled test. This research branch changes six paths, including the updated inherited test and strict CI allowlist.
