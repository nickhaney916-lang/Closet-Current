# Mission 3 — recover a quota-failed verified video frame without duplicate loss

**FAMILY ALPHA HOLD #255, RESEARCH DRAFT ONLY.** No merge, deployment, live Supabase request, staging changes, or real customer media.

## Exact accepted parent
Draft P877 HEAD `63119fd83b5418f11a8e206309a21c572bbc6045`, [full no-deploy native video browser CI #43115744489](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43115744489) completed **2/2 SUCCESS**, six genuine Chromium/WebKit decoded synthetic video-to-private-draft viewport cases, evidence artifact #13898282013. P871 app video-frame durable-commit fix also separately passed its entire no-deploy workflow.

## Independent defect

When the owner imports or captures a verified original JPEG and its **required IndexedDB draft commit fails** (for example, device quota), `candidate()` intentionally retains the original frame visibly in `batch` but cannot claim it is saved. On retrying the exact frame after repairing device storage, the existing unconditional duplicate-image check returns false before performing a new durable save, trapping an unsaved item. A restart can lose it. This is a recovery usability/integrity failure, distinct from the original video-frame early acknowledgment issue.

## Correction

- Track only the **ephemeral in-memory** IDs of owner-reviewed photo drafts whose required commit failed. Never store the list in the cloud or in another account's IndexedDB.
- For the exact same verified original JPEG, owner ID and original SHA receipt, `candidate()` now retries the existing owner-private `persistDraft({required:true})` rather than creating another item or dismissing a duplicate.
- A repeated quota failure keeps the same visible record and pending marker; only a successful guarded IndexedDB commit clears that marker and queues recognition. After success, further identical photos remain ordinary duplicates.
- Source digest mismatch, missing source attestation, changed owner, and already saved rows remain rejected. Session lock clears all unsaved pending IDs.

## Verification

A new source-extracted regression executes the real `public/app.js` `candidate()` in a Node VM against **exact accepted P877 parent** and current source. Parent demonstrably loses duplicate retry; new code preserves one row through repeated failures, commits the owner photo after repair, refuses other-owner and wrong-SHA retries, and clears the session-scoped retry set. Dedicated no-deploy CI uses strict four-file allowance, immutable baseline, full serial Node regression, disposable signed RSA owner PostgreSQL 17 RLS, and all prior Chromium/WebKit 320/390/430 photo/cloud/styling browser cases, plus split synthetic-only evidence archives.

## Boundaries

Actual phone quota exhaustion and user-produced garment video need independent physical iPhone/Android acceptance. Hosted Supabase Auth+Storage two-owner external tests require separate approved test accounts. Recognition and 3D fidelity remain Missions 1/2. Family Alpha is NOT approved.

**Status: exact-head CI pending.**
