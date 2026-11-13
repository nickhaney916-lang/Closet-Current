# Mission 1 P857 — exact real public 32-photo regression triage + independently verified subtype decision hardening

**FAMILY ALPHA HOLD #255 OPEN. MISSION 1 RELEASE NO-GO.** Isolated draft unmerged undeployed research only. Never modify production/staging, hosted Supabase, private wardrobes/photos/accounts, protected main, other mission or parallel-branch HEADs. No real owner data accessed.

## Verified exact source lineage

- Mission 1 [P856 PR #994](https://github.com/nickhaney916-lang/Closet-Current/pull/994) exact immutable verified parent \`5651a28a970f72c48845aaa8c49735c31d47e8d4\`, [no-deploy #43373268832](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43373268832) 3/3 SUCCESS; 500/500 native, opt-in subtype owner-review browser tests, offline annotator UI, safe owner/photo lease, human consensus, unchanged source hashes.
- Parallel #80 current genuine-**model** generated-input safety [PR #990](https://github.com/nickhaney916-lang/Closet-Current/pull/990) exact final \`83f51ea97c5129f6e226c1f68c51aee8ca5d6fcf\`, [no-deploy #43373478832](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43373478832) 4/4 SUCCESS; 485 native and one actual pinned FashionCLIP worker invocation on **synthetic geometric JPEG**. This verifies runtime wiring (47 vocabulary scores per two frames), not clothing recognition accuracy.
- Parallel #80 independent failure triage [PR #991](https://github.com/nickhaney916-lang/Closet-Current/pull/991), exact final \`03c65653009b82be2b9305d8dbcc3e80946c2eab\`, [no-deploy #43372973997](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43372973997) SUCCESS; compares original historical regression strict checker without waivers.
- P857 imports exact blob objects from those sources **without modifying donor branches**: 7 updated/new P80 opt-in subtype implementation/test/report/operator/real-worker-smoke blobs and 2 independent triage tool/test blobs. The original P80 \`public/app.js\` and \`public/local-worker.mjs\` are byte-identical between old and latest P80, so the conflict-free P856 integration with P855's signed-original/photo-lease remains unchanged. The full-label independent reviewer consensus and source-private auth retain identical originals.

## Actually retrieved real public model run, not a synthetic transformation

The historical default-recognition Action [run #43372968710](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43372968710), HEAD \`12aba9b54d18b2da384781c005dfad13fd688410\`, published GitHub artifact \`real-photo-inference-results\` artifact ID \`14013321896\`. This artifact was **downloaded and inspected**, not inferred from a failure summary.

- Raw \`results.json\` SHA-256: \`087e5fe823adc8a04e5cb98e4e06182c9ee9e3a6b1896f64302319406983b8fb\`.
- Downloaded artifact ZIP SHA-256: \`6785d5b4e891aeb4b7a528179ba4ccadd82651d39444ee2d4b9440384d1d63a4\`.
- **All 32** publicly exposed development photos returned predictions; no per-result runtime errors. P857 preserves **only** 5 needed fields (public source ID, predicted broad category, specific type, \`strong\`, \`categoryConfirmed\`) in \`observed-32-results.mjs\`. No JPEGs, reviewer labels, private source receipts, secret keys or photo predictions score vectors are committed.
- Exactly **five** affected sources \`commons-0088\`, \`commons-0089\`, \`commons-0092\`, \`commons-0093\`, \`commons-0094\`: each actually returned \`Shoes / Unknown\`, \`strong:false\`, \`categoryConfirmed:true\`. Historical frozen developer-exposed baseline expected \`Shoes / Ankle boots\`, \`strong:true\`. The unchanged original checker therefore returns **10 FAILs**, two per affected source (\`type_regression\`, \`automatic_indexing_regression\`).
- P80's distinct diagnostic correctly calls these **five owner-review abstentions**, but **legacy CI stays FAIL**. It does not justify clearing the incorrect-strong regression expectations or asserting Unknown is correct ground truth. No actual human verified these old labels for a sealed independent blind cohort; the present input was public/development exposed.
- New P857 regression tests reproduce the original unchanged checker from the *actual downloaded public results*, independently run the triage, reject a tampered confidently wrong \`Sneakers\` case, and prove no change to release/owner-save authority. The P80 diagnostic test's synthetic transformation cases are retained separately. Reproducible by downloading the named artifact and re-deriving the exact compact rows and SHA checks.

## Updated safe opt-in subtype logic integrated

- Original P80 opt-in still requires \`?subtype80=1\` **on unsaved owner-reviewed signed drafts**, original-photo/crop/mask/unit/companion/model source bindings, explicit human photo/detail consent, conservative abstention on close scores and Unknown.
- Updated full 47-label two-frame relative FashionCLIP decision is deep-frozen, module-issued, exact full-source-bound, single-use across all handles. Rebuilt/rebound/cross-session/replayed decision objects cannot choose a garment type. Owner choice still edits only the *unsaved* draft with normal additional acknowledgment; never automatically indexes, learns, pairs shoes, or touches another owner.
- New P80 local-worker smoke invokes **actual original FashionCLIP weights** on a **synthetic geometric image** and verifies early consent rejection, full-vocabulary scores and exact model/receipt hashes without image uploads. This is **not real garment inference accuracy** or physical-phone performance.
- P857 does **not** change the default recognition engine, historical benchmark expected truth, P75/P79 private human source custody, reviewer signature gate, P851 release gate, private cloud, capture worker or active owner privacy.

## Exact-head acceptance and remaining blockers

A strict source-pinned 13-path NO DEPLOY workflow validates scope, exact imported blobs, full native tests/two builds, inherited desktop Chromium/WebKit subtype and owner-photo review, real worker geometric smoke, original legally sourced public JPEG integrity, and a **blocked** P851 independent release contract. Final results should be recorded in the P857 draft PR only after exact-head workflow finishes.

Independent actual model accuracy across real opt-in subtype photos: **UNKNOWN**, because independent approved double-human legal-source-disjoint labels/masks: **0**. Sealed blind scores: **0**, witnessed physical Android Chrome/iPhone Safari acceptance: **0**, authenticated signed two-owner hosted cloud RLS/recovery/session acceptance by Mission 1: **NOT RUN**. No 10/10 or production completion claim. Family Alpha HOLD #255 stays OPEN.
