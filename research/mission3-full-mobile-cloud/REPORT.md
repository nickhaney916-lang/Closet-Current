# Closet Current — Mission 3 integrated mobile/private-cloud engineering acceptance

**Mission status: engineering integration under verification. Release: FAMILY ALPHA HOLD #255.**

## Scope and safety
Repository `nickhaney916-lang/Closet-Current`. Exact independently verified baseline: draft [PR #833](https://github.com/nickhaney916-lang/Closet-Current/pull/833), HEAD `7dbb66ab57299f5613a4342b737c5212d021c93e`; [Actions #42960793149](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42960793149) passed **1,458/1,458 Node** and **54/54 Chromium/WebKit mobile browser cases** (all synthetic). Added independent completed security/repair work from [PR #826](https://github.com/nickhaney916-lang/Closet-Current/pull/826) HEAD `dafe12c792c6a7fe2ff2041389ce4e802fad9814` and [PR #830](https://github.com/nickhaney916-lang/Closet-Current/pull/830) HEAD `e9d45020a057697eea8b3a00579518b4654d9a15` to avoid separate, mutually divergent cloud controllers.

All changes are in **one isolated draft integration branch**, not main, production, existing staging or Supabase. GitHub Actions strict path allowlist excludes Auth, cloud-backup-engine, recognition, camera, data migrations, 3D, release or deployment workflows. No genuine owner JPEGs, customer rows or hosted Supabase Auth/Storage used by tests. **No merge or deployment is authorized.**

## Delivered engineering functionality

1. Mobile owner-authenticated photo capture, original JPEG source preservation, garment review, saved private wardrobe and photo-to-closet styling remain covered by inherited real Chromium/WebKit app browser journeys. Native mobile viewport cases do not prove physical iPhone Safari or Android Chrome camera capture.
2. Owner-isolated signed private cloud documents, original/photo Storage SHA receipts, recursive private owner references, foreign garment/draft refusal and owner-auth/session revocation protections.
3. Revision-first cloud metadata checks: 1,000-item wardrobes do not re-download full JSON or clone all JPEGs for routine clean checks. On clean initial account, first `items.count()` plus three whitelisted user-facing state keys prevents a needless first photo clone; existing 1,000-photo first backup needs one full snapshot instead of two.
4. Bounded JPEG source object downloads enforce an 8-MiB stream limit prior to full allocation, guard immutable upload collisions and cancel malformed oversized streams, without compromising original-byte SHA.
5. Atomic IndexedDB quota recovery; owner-scoped durable device-full pause across reload with manual recovery; durable 413/507 private cloud capacity stop; transient network retry without panic re-download; multi-device conflict keep-both and owner revision integrity.
6. New unified permanent-until-repaired photo stops: a malformed/PNG/non-JPEG owner-local original (including over-8-MiB) must not cause repeated automatic cloud uploads on focus/online/reload; a missing (404) or SHA-tampered immutable private remote JPEG must not repeatedly fetch a broken cloud backup on reload. Both preserve prior original photo, saved outfit and revision, are stored only in signed owner's IndexedDB, and permit deliberate owner Sync after corrections. New local photo revisions clear only their own stale source-specific pause; stale/other-owner session cannot clear pauses. Generic corrupt document/remote JPEG quarantines from PR #821 remain supported.
7. Full inherited synthetic mobile cross-browser acceptance at 320/390/430 CSS pixels, with original/reviewed cloud backup, owner-photo source, signed owner/draft isolation, large-wardrobe revision, quota, capacity, photo/styling and accessibility checks.

## Exact integrated HEAD acceptance (must run before claiming green)
- Strict parent SHA and changed-path verification / NO DEPLOY.
- Complete serial Node suite + all newly ported local/remote photo tests.
- New local JPEG validation and remote missing/tampered-photo **genuine Chromium/WebKit browser** cases at 320/390/430 viewports, plus 9 inherited 6-case suites.
- Synthetic 1,000 SHA-distinct 1280×1680 JPEG memory browser workload (72.2 MiB source bytes), sampled Chromium JavaScript heap, WebKit browser behavior; 8-MiB+1 byte adversarial response stream test.
- No console errors, successful original-photo recovery and no damaged-data cloud write. Screenshots/JSON artifacts must be independently reviewed.
- Existing production/staging unchanged; no real hosted customer data.

## Hard release gates that cannot honestly be marked completed by synthetic browser CI

- **Physical iPhone Safari and Android Chrome**: actual device camera lifecycle (permissions, OS interruptions, background tab kills, low-memory crashes), camera→review→private original-photo save, installable PWA, 320/390/430 equivalent layouts and accessible controls. Requires device and approved owner/tester interaction. Mock viewport alone is insufficient.
- **Genuine hosted signed two-account Supabase acceptance**: two valid independent Auth JWTs, wrong-owner `closet_backups` row and `closet-private` Storage GET/PUT denial, actual RPC CAS, session revocation, cloud restore on a second browser, and owner consent. Existing staging and production must remain protected. A dedicated disposable authorized project/tenant is required; no pseudo-user or synthetic owner is a substitute.
- **Real legally usable photographic dataset**: owner-approved photographs, category variety, reviewed corrections and color/source integrity, genuine mobile heap/resident memory and storage quota at large number of distinct 8-MiB-cap images, and unexpected OS termination/recovery.
- **Full release decision**: main controller acceptance, security and QA artifact review, explicit release authorization, issue #255 resolution and documented rollback. No PR merge/deployment in this research mission.

## Security-policy inspection already completed (read-only)
The connected live Closet Current Supabase project was inspected through metadata read-only tools in the verified integration predecessor PR #823: owner `closet_backups` RLS, private `closet-private` JPEG-only 8-MiB bucket with authenticated owner-folder policies, auth-scoped RPC; one advisor warning for disabled leaked-password protection. **No hosted signed two-account test**, and no setting was modified. See [PR #823](https://github.com/nickhaney916-lang/Closet-Current/pull/823). Recheck immediately before a future release.

**Document status:** creation draft. The exact new HEAD's dedicated CI must complete successfully before changing "under verification" to "verified draft research." The Mission 3 release acceptance gates above remain open; do not call this application complete or lift HOLD.
