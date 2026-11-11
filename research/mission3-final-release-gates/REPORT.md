# CLOSET CURRENT — MISSION 3: Mobile Application, Owner-Private Wardrobe and Cloud, Final Integrated Acceptance

**Release restriction: FAMILY ALPHA HOLD GitHub #255. Strictly research-only, DRAFT, UNMERGED, UNDEPLOYED. Existing production/staging, original owner photos and hosted cloud data UNTOUCHED.**

## Development lineage (all earlier evidence independently CI verified)

- Mission 3 integrated owner/private cloud PR #839, direct baseline `57a1cea57c103c7d99514d003d3737dea3063124`; combines separate verified SHA/quota/revision-first/cloud privacy PRs #823, #825, #828, #833 and independent private JPEG validation PRs #826/#830. Its exact final HEAD CI must pass before assuming this baseline is independently green.
- PR #832 HEAD `4a71c5e3e49e4df550b30cdc02d5e43b5d732c56`: [NO DEPLOY Actions #42960625191](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42960625191) independently passed real disposable **PostgreSQL 17 RLS + cryptographically signed ephemeral RS256 two-owner JWT + native built app** cases with unchanged `supabase/cloud-backup.sql`. Six real Chromium/WebKit 320/390/430 browser cases, native private backup/restore and cross-owner denial. This is not hosted Supabase.
- PR #835 HEAD `a5524be6e4600c78c32df7f2859251b733fbc537`: [NO DEPLOY Actions #42961697269](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42961697269) independently passed exact-parent snapshot-race parent/fix comparison, 1,455 Node and six Chromium/WebKit signed-owner garment deletion/edit tests, plus actual PostgreSQL owner RLS integration. The local owner should not publish a deleted garment or outdated color after its cloud transport blocks.
- Existing camera→review→private saved closet→style, original/reviewed cutout private cloud backup, owner photo receipt/security, cross-browser cloud restoration, 8 MiB bounded private JPEG streaming, 1,000 visually unique synthetic 1280×1680 photo memory benchmark, durable 413/507 and local quota pauses, capacity and conflict handling, and owner session generation guards retained.

## Final unified engineering behaviors under test

1. Native mobile UI camera/review/private closet capture and original source JPEG retained. Mobile photo-to-closet/styling and saved outfit integration retain visual QA.
2. Signed owner account and private cloud RLS: real SQL owner-only `public.closet_backups`, `save_closet_backup` CAS, four `storage.objects` owner-folder policies, SHA-bound original bytes. Native browser real SQL integration uses **two real signed test JWT subjects and PostgreSQL roles**. It does not contact hosted Supabase.
3. User-local malformed/PNG/over-8-MiB JPEG validation: durable owner-only pause keyed to local revision (clears on new correctly saved source). Failed upload must not clear the original, overwrite outfits, upload malformed bytes or loop forever.
4. Remote missing (404) and tampered SHA-bound private JPEG restore: durable owner-only stop keyed to remote revision, zero repeated network calls on reload, deliberate current-owner repair and confirmed byte-level SHA restore. Temporary 503 uses backoff rather than false corruption certification.
5. No cross-account garment IDs/draft tags, nested photo paths, SHA-cutout references, owner token or remote private photos can be merged/retrieved across owner boundary. Session revoke and stale auth must not clear owner state.
6. First cloud login without owner wardrobe uses a metadata/count query, not large IndexedDB clone; initial 1,000-piece locally owned wardrobe needs **one** original-JPEG snapshot not two. Routine clean revision-first cloud check does not download full remote JSON. Real browser 1,000 distinct synthetic garment sources; sampled Chromium JS heap only is not total physical-phone RAM.
7. Uploaded/restore object bytes are capped at 8 MiB by streamed response size before untrusted bytes accumulate; correct SHA verified before replacing private owner garment.
8. Atomic IndexedDB quota failure must preserve all local originals/board/source SHA; durable owner-scoped pause across PWA reloads; restored only after explicit owner Sync following free storage. Remote cloud 413/507 and malformed source pauses independent.
9. **Stale revision CAS fence**: snapshot marker checked after remote revision GET, after photo encoding, just before upload, and again before save RPC. An owner delete or edit during an in-flight JPEG upload cannot publish stale wardrobe content. Already-started immutable JPEG POST may leave unreferenced owner-private storage bytes (no distributed transaction).
10. NO DEPLOY exact-parent strict allowlist prohibits source SQL/Auth, recognition/3D, camera, or existing production/staging modifications. Full serial Node tests and actual Chromium/WebKit 320/390/430 acceptance, automated accessibility, screenshot SHA receipts.

## Required CI proof at THIS exact HEAD

- Exact base SHA `57a1cea57c103c7d99514d003d3737dea3063124`, no forbidden changed paths, ephemeral PostgreSQL 17 service-only.
- Apply existing unchanged `research/two-owner-cloud-rls-recovery-128/local-postgres-bootstrap.sql` in PostgreSQL docker service. Verify owner policy counts 1:4, run independent signed P147 RSA JWT/PostgreSQL RLS acceptance with actual `auth.uid()` transaction-local role.
- Reproduce parent stale CAS and fix, run focused local invalid/missing remote/cold first login and all full serial Node test suite; build native app `dist` in CI only.
- Actual Chromium and WebKit at 320, 390 and 430 CSS viewport: six stale deletion/edit cases; six native signed owner A/B real SQL row/Storage policy cases; local invalid JPEG, missing/tampered cloud JPEG, 1,000 synthetic sources, capped 8 MiB stream, Storage owner references and native photo-to-closet styling.
- No hosted Supabase contact, no staging/production secrets or private owner photos, no actual deployment. Read structured JSON evidence, exact SHA screenshot receipts and manual visual QA. The PR description should be updated only after exact-HEAD all checks succeed.

## External mission completion gates — do NOT infer from passing desktop browser tests

### Physical phone acceptance — not yet verified
Test on actual **iPhone Safari and Android Chrome**, not Playwright viewport-only: camera permission/revocation, interrupted camera/photo capture, owner original JPEG preservation, 30/120/1,000 distinct real-device photo save/review, low-memory/killed-tab reload, private wardrobe render, storage quota recovery, accessible UI with a screen reader, PWA install/offline/online, cross-browser session restoration. Record device model/OS/browser, source SHA, clips/screens, heap/crash/memory, owner consent and acceptance evidence.

### Hosted signed two-account cloud acceptance — not yet verified
Use an **approved disposable hosted Supabase test project** separate from existing production/staging with two genuine independent Supabase Auth test users and real Storage service: correct owner backup/CAS/restore across browser, deny wrong-user row and Storage GET/PUT, signed token revocation, owner session switch, private backup 413/507/503 recovery. Keep old production/staging untouched. Current signed RSA/Postgres test proves real SQL RLS enforcement locally, but is NOT hosted Supabase Auth or full hosted Storage.

### Genuine photograph and release decisions — not yet verified
Legally usable independently sourced/owner-authorized real clothing photograph cohort and actual mobile heap/OS kill recovery, release security review, cross-mission integration review, CI artifact signoff, user or primary controller's explicit decision to lift Family Alpha HOLD #255, deployment plan and rollback evidence. Do not silently deploy, merge, disclose user photos or mark release accepted.

## Verdict and ownership

Research development can be certified independently only when this exact HEAD passes native browser/Node/real disposable PostgreSQL signed-owner QA. **The entire Mission 3 cannot honestly be labelled 100% accepted or release-ready until the physical-device and genuine hosted signed two-owner acceptance gates above are completed.** All tests and documentation preserve Family Alpha HOLD #255.

Report created before final integrated CI; this status must be updated with precise results once verification completes.