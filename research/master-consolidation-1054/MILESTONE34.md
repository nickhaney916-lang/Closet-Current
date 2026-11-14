# MAIN1054 M34 — content-derived private wardrobe revision and entire-roster CAS

**RESEARCH ONLY, DRAFT, UNMERGED, UNDEPLOYED. Family Alpha #255 OPEN/HOLD.**

## Parent and scope

- Parent M33 [draft PR #1167](https://github.com/nickhaney916-lang/Closet-Current/pull/1167), immutable no-deploy-successful source head \`9d560cb439241cf590b793ea4a6bf3fcbb0b8a8d\` and [Actions #43619690810](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43619690810).
- M34 branch: \`research/main1054-durable-roster34-HOLD\`.
- A new research-only gate \`?ownerPicker33=research&ownerRevision34=research\` must be explicitly enabled. The normal UI, M33-only path, source models, original photo binaries, hosted Supabase and other missions remain untouched.
- Seven changed research/test/CI paths; one already-research-gated \`public/outfit-board.js\`. The CI prevents modifications to auth, cloud, general capture, recognition, production/hosted schema and fixtures.

## What "durable revision" can honestly mean without rewriting all legacy writers

A plain monotonically increasing IDB \`state.wardrobeRevision\` counter would be **unsafe** unless every old writer, cloud restore, import, delete, correction and external research module updates it in the **same transaction**. There are older and different writers. Instead M34 uses a **content-derived source-of-truth revision**: sort the entire current signed owner's real IndexedDB \`items\` roster and SHA-256 hash its serialized full source records. Because it is derived from committed owner-private data, it survives tab restarts, cross-tab modifications and cloud restoral without a writer's cooperation. This revision is NOT a monotonically increasing change counter.

- \`research/main1054-revision34/durable-roster.mjs\` seals the actual owner-named IDB source snapshot, rejects duplicate/foreign IDs, validates exact signed auth object, database object, operation/session epochs and the local UI revision before and after asynchronous cryptographic digest.
- After M31/P87 photo hashes, M33 source verification and owner field-receipt CAS, M34 independently re-reads and rehashes the *entire* private roster. It refuses an unrelated edit, delete or restored-record change, not merely changes to the displayed outfit's selected rows.
- Immediately before the existing \`outfit-board\` \`state.put\`, a queued \`items.getAll()\` in the **same exclusive read/write \`items+state\` transaction** compares full exact serialized content against the pinned original roster; if any record differs, it aborts. Unlike a weak FNV-only comparison, transaction acceptance uses full exact row strings, not a probabilistic digest equality check.
- Original JPEG and auth/DB references remain private in the transient proof closure. No photograph bytes are added to the output verdict, telemetry, external network, screenshots or outfits. 3D grant remains false; no trial/release permission.

## Limitations and proof boundaries

- The content-derived SHA is **not an audit log or monotonic sequence**: a byte-for-byte restored older roster can have the same revision (ABA), and equal-content states cannot be distinguished. Outfit slot and full roster source content are identical in that case; for business semantics requiring event history, design an independently atomic version marker maintained by **all** writers.
- Full original image data is scanned/serialized and hashed; a strict 128 MiB cap and 10,000-row cap fail closed. Measure memory, latency and repeated-camera mobile WebKit behavior before promoting this mode.
- Only private saved clothing \`items\` are versioned. Draft photo reviews, cloud metadata, saved outfit lists and backups have separate CAS/lease and are not claimed as included in this digest. Full restore/photograph IDB stores require integration acceptance.
- No physical iPhone/Android, independent blind recognition labels, real hosted four-account RLS, 3D photo-derived geometry realism, production release or wife trial readiness is claimed.

## Exact-head planned no-deploy acceptance

- Node: genuine licensed Commons-0053 JPEG committed via actual PHOTO119 owner confirmation using synthetic private owners; secure digest and byte-exact roster equality; unrelated cross-tab write, changed original, delete, restore-style recategorization, same-ID new auth, logout, local revision change and foreign ID insertion.
- Actual signed native app in Chromium and WebKit at 320/390/430px with local synthetic HTTP auth: original PHOTO119-like owner field receipt, picker click and draft/saved outfits, cryptographic photo source integrity and another IndexedDB connection's unrelated row mutation. **All external asset requests are blocked**; browser runs never access hosted private wardrobes.
- Rerun unchanged M33 click/save tests, 2,656+ full inherited no-deploy Node suite, licensed P87 source browser audits, native 2D photo-preview browser suite. Record exact HEAD and job IDs after completion. Never extrapolate predecessor passes to final commit.
- All source changes remain isolated, DRAFT/HOLD, never merged or deployed.

## Next priority after acceptance

Real consumer/default promotion requires performance budgets on physical mobile Safari and Android Chrome, trustworthy resume/restart/restore UX, atomic consistency of other state documents, proof of owner-private hosted behavior under authorized test credentials, and explicit review of whether content-derived revision is sufficient or a cross-writer monotonic event counter is required.

Master [#1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054); Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) must stay OPEN/HOLD.
