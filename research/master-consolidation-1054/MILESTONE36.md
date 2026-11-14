# MAIN1054 M36 — bounded cost probe and incompatible-donor integration ledger

**RESEARCH ONLY. DO NOT MERGE/DEPLOY. Family Alpha #255 stays OPEN/HOLD.**

## Source pinned
- Base: Main integration M34 #1170 exact 050a39b8fa1e6ee8084bed23855d90e2879609d7, [dedicated no-deploy CI #43621695239](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43621695239) reported 1/1 SUCCESS, 2,666 Node PASS, 24 new desktop browser cases PASS.
- This branch: research/main1054-roster-performance36-HOLD. Four isolated new files: this report, a Node-only synthetic cost script, its evidence-boundary tests, and strict no-deploy workflow. No consumer application, auth, source photo, model, geometry or hosted data changes.
- M34 remains opt-in only with both ?ownerPicker33=research and &ownerRevision34=research; it is not default or user acceptance.

## What M36 probes and does not probe
M34 seals and SHA-256 hashes the entire private clothing roster, re-reads it, and synchronously compares all serialized rows inside the outfit-write transaction. The correctness of the fail-closed whole-roster CAS is important; its *performance* for large saved original-photo records was not measured on physical phones.

The new script executes the **real M34 module** with synthetic signed session object references and bounded fake in-memory garment records, using five wardrobe sizes (1, 25, 100, 250, 500) and 8,192 repeated synthetic characters per record, 5 sequential iterations per tier. Measures p50/p95 seal, re-read/verify and synchronous roster equality times plus process-wide Node RSS high-water sample. Tests assert changed and newly added unrelated rows are rejected and emitted metrics never contain fixture contents. All probe input is generated in-process, not a genuine JPEG, real IndexedDB database, browser, physical device or owner account. Metrics vary with host and are *diagnostic*, not performance thresholds.

**Required gate output:** DESKTOP_NODE_SYNTHETIC_BENCHMARK_ONLY_NO_MOBILE_GO. Browser=NOT_TESTED, realIdb=NOT_TESTED, physicalAndroid=NOT_TESTED, physicalIphone=NOT_TESTED, hostedAccounts=NOT_TESTED, source3d=NOT_TESTED. Node RSS is an aggregate process sample, not a camera/image-decoder/GPU/phone PSS or a peak allocation certificate. Only actual mobile hardware/source access can establish those.

## New parallel donor audit — independent source trees are NOT integrated by green CI

On November 14, 2026, the GitHub compare endpoint returned:
- M34 #1170 SHA 050a39b8... vs Mission 1 Parallel #88 #1175 SHA 4544318c...: **diverged**, 428 donor commits ahead / 2,054 behind M34; merge-base 39deed987afe2e5668d64e145835ad43ad14c7be. P88's new disconnected same-class garment proposal remains **off by default** and has synthetic pixel-conservation tests, **not independently human-labeled real-mask recall**. The P88 report notes its adapter public/outfit-instance-review-840.mjs is absent on the M34 research head. Do NOT silently cherry-pick or infer ABI compatibility.
- M34 #1170 vs Mission 2 Parallel #89 #1177 SHA 9af4cd8e...: **diverged**, 737 ahead / 831 behind; merge-base faac51857d57356fb5568f035566a171cadaa418. P89 supplies six actual licensed JPEG source checks across five garment categories, front-panel/eligibility *research*, not fitted two-piece 3D or consumer 3D authorization. Its source/mesh/photo IDs must be mapped to the actual M34 approved private wardrobe and P87 eligibility shape, not inferred from matching garment names.
- P88 vs P89: **diverged**, 1,960 ahead / 428 behind (compare P88 base → P89 head). There is no jointly tested native/photo→private-save→3D path.
- Parallel #90 [issue #1174](https://github.com/nickhaney916-lang/Closet-Current/issues/1174) is a separate interactive avatar/viewer assignment; current main branch must not assume the forthcoming viewer can consume proposed garment source records without exact signed-owner, photo and 3D admission proof.
- Master M35 [draft #1176](https://github.com/nickhaney916-lang/Closet-Current/pull/1176) independently investigates an observed real WebKit CPU worker failure; do not falsely convert a retry success into production reliability.

**Integration gate:** Require explicit immutable branch/parent ancestry and schema snapshots, a source SHA and signed owner-approved category/item/garment-unit mapping, trusted saved private item ID and board slots, strictly verified 3D provenance/rig/contact eligibility, and a preserved original-photo 2D fallback. If any transition has no actual compatible consumer, classify BLOCKED/NOT TESTED. Never turn source receipt existence, source front panel geometry, mask proposals or isolated green research CI into 3D_ELIGIBLE_VERIFIED.

## Exit and next priority
1. Inspect exact-head M36 Actions results for the **new** Node-only cost probe before crediting it. All existing M34 tests are predecessor evidence, not retested by this branch.
2. Run this same whole-roster scan under actual native private IndexedDB on authorized physical iPhone Safari and Android Chrome with varied real-photo sizes and repeated edit/restore/switch (after owner approval). Measure total transaction wall time, browser process memory/thermal where available, and fail-close behavior under memory pressure.
3. Freeze exact native recognition→owner-reviewed private row→Outfit Builder→3D or original-photo 2D handoff between M34, P88 and P89 before attempting a cherry-pick or default promotion.
4. Keep **all PRs DRAFT**; Family Alpha #255 **OPEN/HOLD**. No merges, deployment, production, staging, hosted Supabase or private wardrobe access.
