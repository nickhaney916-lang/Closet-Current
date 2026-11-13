# Closet Current Mission 3 — Owner-acceptance v4 lossless backup including unfinished original JPEGs

**Family Alpha HOLD #255 OPEN. DRAFT / RESEARCH GATED ONLY. DO NOT MERGE, DEPLOY, CHANGE HOSTED SUPABASE, PRIVATE FAMILY WARDROBES OR PRODUCTION/STAGING.**

Exact parent: verified [PR #1022](https://github.com/nickhaney916-lang/Closet-Current/pull/1022), HEAD `8b25439394f273561ec71fd9d2891ff601a439e7`.

## The data-loss risk
Default v3 export deliberately refuses pending Photo results because the v3 schema includes saved clothes, inspiration and outfits **only**. It cannot back up an already saved but not yet owner-reviewed original JPEG. While the v3 safeguard prevents a false “complete backup” claim, the owner still lacks an independently tested accessible lossless v4 alternative outside the nativeLossless04/restoreAtomic01 double opt-in 3D/outfit research workflow.

The existing `research/restore-atomic-01/atomic-restore.mjs` has source-confirmed v4 photo SHA verification, original JPEG retention, saved outfit validation, owner-bound full read snapshot, exact database CAS, one-transaction items+draft+looks+board restore, cloud dirty revision and fault-injected rollback. The isolated owner acceptance layer uses this engine without weakening or deploying the existing 3D research gate.

## Milestone implementation
- New module `public/native-lossless-v4-owner-acceptance-m3.mjs` invokes the **exact verified research v4 validator and atomic restore**, adding owner-private v4 format enforcement, full saved+draft source SHA checking, duplicate draft-ID rejection and original/source SHA consistency.
- Its export starts from one owner-bound native readonly `items` + `state` snapshot. It preserves existing JPEG bytes, original-photo proofs, owner edits, recognition metadata, pending Photo results, outfits (including temporarily absent referenced pieces) and inspiration **without normalization**. It validates photo bytes/SHA, then reads a SECOND source snapshot and aborts if any same-owner tab changed the database during asynchronous verification. File cap is the existing 100 MiB import limit.
- Its restore clones and validates owner-bound incoming v4 data BEFORE asking for consent, obtains an exact durable baseline snapshot, requires owner confirmation equal to literal `true` (an asynchronous promise resolving false cannot approve), then uses the prior proven **single IndexedDB readwrite CAS restore**. It restores saved clothes, unfinished draft, looks, board and cloud dirty revision **all together or not at all**.
- `public/app.js` exports and imports lossless v4 on an **explicit `?losslessV4M3=research` URL**. Default v3 remains unchanged; the nativeLossless04/restoreAtomic01 research route remains separate and unchanged.
- The owner UI requires a stable signed-account session+DB lease, completed local write tail, idle camera/recognition/photo import/outfit edits, and no active 3D preview. It **permits already committed unfinished Photo results** (the very JPEGs v4 is designed to preserve) but never replaces unsaved in-memory captures.
- The v4 Export button downloads `closet-current-owner-backup-v4.json` and reports exact counts of saved clothes and unfinished photos. The v4 Import file handler requires explicit confirmation that all current saved and pending photos will be replaced, and never accepts an ownerless/foreign account v4 file. It reports successful commit truthfully even if an asynchronous view refresh requires reloading.
- No private cloud operations, production deploy, or acceptance claim beyond synthetic tests. The new research path does not assert that 3D geometry is photorealistic or that recognition has passed 10/10 ground truth.

## Reproduction / verification
1. `node --test tests/mission3-lossless-v4-owner-acceptance.test.mjs` uses source-executed production wrapper and genuine native fake IndexedDB transaction/CAS. Checks SHA-proven saved+pending JPEGs, correction history and outfit metadata survival, atomic restored cloud revision, strict owner consent, foreign owner refusal, draft SHA mismatch, duplicate and cross-owner drafts, second-tab writes during confirmation, mid-transaction power-failure rollback, and revoked owner.
2. `node scripts/test-mission3-lossless-v4-owner-acceptance-browser.mjs benchmark/mission3-lossless-v4-owner-acceptance-browser` runs actual unmodified app's Export button and Import file handler on Chromium and WebKit at 320/390/430 CSS widths; native IndexedDB + synthetic signed owners and SHA-JPEGs. Downloads v4 including pending original, refuses tampered JPEG and foreign owner, cancels without writes, restores actual changed local clothing+pending draft+outfits, rejects injected power-failure without any partial erase, protects same-owner re-login and cross-account isolation. Every external host is blocked.
3. Strict exact-parent **six-path no-deploy** GitHub Actions inherits full serial Node, all Mission 3 photo, cloud, private account, safe editing and default v3 backup regressions, native 320/390/430 browser suite, and disposable signed PostgreSQL two-owner RLS.

### Status
**Verification must be verified on the exact final branch HEAD.** Never claim v4 complete or Family Alpha releasable from an unconfirmed CI run.

### Still blocked
Actual native Android Chrome and iPhone Safari physical-camera acceptance; authorized hosted Supabase Auth/Storage remote backup/restore and token revocation; independently human-labeled genuine photo subtype/color/model accuracy; end-to-end Missions 1/2/3 integration and photo-derived realistic 3D cloth fit; owner signoff. **Keep Family Alpha HOLD #255 OPEN.**
