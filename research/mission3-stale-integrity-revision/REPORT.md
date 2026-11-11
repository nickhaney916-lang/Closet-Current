# Closet Current Mission 3 — owner local-revision fence for stale integrity errors

**FAMILY ALPHA HOLD #255. DRAFT / UNMERGED / NO DEPLOY.** No production/staging/Supabase hosted accounts/real owner photographs changed.

## Exact verified baseline

Direct parent PR #850 `9884536c9c6ce95993834f909ff83b11aa7a73ac`, [Actions #42969336746](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42969336746) PASSED **1,489/1,489 serial Node tests**, ten six-case Chromium/WebKit 320/390/430 browser groups, original-photo and mobile 2D styling, synthetic high-resolution 1,000-garment workload, and cryptographically signed ephemeral two-owner JWT enforcement with unchanged real disposable PostgreSQL RLS. No live hosted Auth/Storage or physical phone verification was claimed.

## Independently reproduced failure race

A cloud response can begin under signed owner localRevision 8, then the owner saves or deletes a garment, incrementing localRevision to 9 **before** the old response's malformed HTTP-200 JSON is processed. The old code's generic catch unconditionally called `writeIntegrityPause(true)`, which marks `cloud-sync.integrityPause=true` against the **newer** revision 9. That prevents the legitimate owner edit from synchronizing until manual repair—even though that edit was not the source of the stale failed cloud response.

This can occur during both a clean GET of duplicate/malformed private backup rows and after an in-flight save RPC already committed but returned a malformed successful acknowledgement. Existing prior protections already revision-fence explicit remote photo and local malformed-photo errors; generic integrity errors did not.

## Surgical implementation

- Extend `writeIntegrityPause(paused,assertActive,expectedRevision)` to compare localRevision in the **same IndexedDB readwrite transaction** before persisting a new quarantine. Clear requests from an explicit owner Sync retain their existing behavior.
- Pass the actual localRevision captured before the in-flight cloud revision fetch into the failing generic integrity handler.
- If the owner has since committed a newer local edit, treat the old integrity fault as stale; do not store an owner poison marker or set `pausedIntegrity`. Preserve the latest dirty wardrobe, original photographs and saved outfits. Show pending state and schedule a fresh revision-first retry so an independently still-bad current cloud response can quarantine the current revision properly.
- For truly current-revision malformed or oversized cloud bytes, preserve the verified **durable owner quarantine** that survives reload and requires explicit owner Sync after fixing the upstream JSON; no retry storm or unsafe cloud CAS.
- Preserve existing Session generation/owner isolation, 8 MiB JPEG and 32 MiB cloud JSON stream limits, capacity/quota/revision-first memory, save upload fence, signed two-owner RLS and mobile functionality unchanged.

## Acceptance

1. Replay verified PR #850 source as exact-parent fake IndexedDB baseline: delay a malformed cloud revision GET or malformed successful cloud save RPC; mark newer private owner local edit before releasing the response; demonstrate old implementation improperly writes `integrityPause=true`.
2. Run the identical held GET and held RPC against new implementation. Expect localRevision advances, dirty remains true, no permanent integrityPause, unchanged private source garment and baseVersion, **pending cloud backup** and no stale repeated publication.
3. Native built app Chromium/WebKit 320/390/430: hold malformed successful `GET /closet_backups` response while signed owner edits/deletes clothing using real `closetCloud.beforeWrite(db)`; after release assert no stale quarantine, no stale publish, and explicit owner Sync publishes only the updated/deleted garment. Verify screenshot SHA receipts, accessibility, owner isolation.
4. Run full serial 1,489+ Node suite and all inherited ten six-case browser groups, including 1,000 SHA-distinct high-resolution **synthetic** garment images, 8-MiB photo, 32-MiB backup JSON, owner-private Storage references, remote 404/SHA repair, signed ephemeral two-owner genuine PostgreSQL RLS, native photo-to-closet and styling. Strict NO DEPLOY five-path research change scope.

## Remaining external release gates

Physical Android Chrome/iPhone Safari camera lifecycle, actual OS memory crash/restart and real legally usable garments remain untested by desktop Playwright viewport simulations. Real disposable PostgreSQL RLS with signed ephemeral JWTs is NOT a hosted Supabase Auth + Storage service two-account test. An approved test tenant/accounts and real devices are still necessary before Mission 3 release acceptance. **Family Alpha HOLD #255 remains OPEN.** No hosted production/staging writes and no PR merge/deployment.

**Initial status:** pending exact-HEAD independent CI before claiming this research milestone verified.
