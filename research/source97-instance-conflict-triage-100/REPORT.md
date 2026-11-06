# Closet Current — Priority #100 / SOURCE97-INSTANCE-CONFLICT-TRIAGE-100

**RESEARCH ONLY · Family Alpha #255 HOLD · no merges, production, existing staging, customer accounts or other projects.**

## Verified parent and problem

Priority #99 [draft PR #654](https://github.com/nickhaney916-lang/Closet-Current/pull/654), exact head `a096c5d9e6cea9068f145ee0712d5227bc166adb`. Strict independent [no-deploy Actions #42166982460](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42166982460) **SUCCESS**: 912/912 Node, 59 frozen + 2 earlier model-exposed + 7 quarantined Commons originals SHA-verified, 6/6 original-photo Chromium/WebKit source-locked reviewer workflows at 320/390/430, 20/20 independent screenshot audits.

The inherited P94 reviewer reconciliation uses a **greedy maximum local IoU** instance pairing algorithm. For overlapping garments, a high-scoring local choice can block two valid cross-pairs, causing a false A/B conflict even if a **maximum-cardinality one-to-one match** exists. Moreover identical polygons, identical timestamps, ambiguous garment association and accidental missing reviews need an explicit **human audit queue** rather than claims of independent scientifically verified humans.

## Implemented research engineering

- New **maximum-cardinality bipartite matcher** over normalized mask IoU; separate geometrical pairing and exact human category + subtype + primary/secondary color pairing. Deterministic thresholds, complete input bounds, no automatic learning or image synth.
- Explicit per-photo status: missing A/B, A/B provisional garment agreement, A/B provisional both-observed negative, A/B count/boundary/category/color disagreement requiring C, supplied independent C awaiting actual human-identity verification, or uncertain A/B correspondence requiring manual audit.
- Additional diagnostic flags: missing reviewers, mismatch between no-garment and clothes, instance count differences, boundary mismatch, human taxonomy/color disagreement, ambiguous overlapping masks, suspicious exactly copied polygon vertices, identical reported timestamps, or divergence from the inherited P99 legacy-greedy reconciliation. Identical data are **cautions, not proof of misconduct**.
- **Protect old P99 semantics**: If the new maximum matcher finds a full agreement but previous P99 greedy did not, flag `DISAGREES_WITH_LEGACY_GREEDY_MATCHER_MANUAL_AUDIT` and require manual review; never quietly promote either result.
- P99 and P94 continue to reject invalid original photo SHAs, wrong blinded role packet, malformed polygons, unsupported category/color taxonomy, robot-labelled submissions and a third reviewer submitted without A/B.
- Role-specific private A/B/C source-locked human JSON may be supplied **only by local file path**; no new API, upload, JSON store, model inference or local cache. The output is a **redacted source-ID-and-conflict-only queue**, with no masks, images, reviewer IDs, garment categories/colors or free-text notes. Automated fixtures are never treated as actual people.
- Twelve new adversarial tests, including a directly constructed 2x2 IoU matrix where greedy matches 1 while the correct maximum matches 2, negative controls, partial reviews, identical-geometry flags, taxonomy conflict and redaction. Strict dedicated no-deploy workflow.
- Preserve frozen 59 originals (32/11/16), older 2 quarantined and seven P97 SHA-pinned quarantine sources; never edit original photos or their partitions.

## Offline research use (do not commit reviewer exports)

```bash
node scripts/audit-source97-triage-100.mjs --empty
node scripts/audit-source97-triage-100.mjs --a /private/reviewer-A.json --b /private/reviewer-B.json
node scripts/audit-source97-triage-100.mjs --a /private/reviewer-A.json --b /private/reviewer-B.json --c /private/reviewer-C.json
```

A/B and C identities are **self-attested, not independently verified**. The redacted output is an adjudication queue only; this tool does not create genuine human annotations. Newly flagged copied polygons and ambiguous garment matches must be reviewed by actual independent people.

## Scientific and Family Alpha verdict

- Seven new sources: **SHA pinned but all quarantined**, not admitted into any genuinely never-before-seen independent benchmark. Exposure and separate license review are pending.
- **Zero** actual independent human reviews entered in CI or repo; **zero** real verified human instance masks; no real learned-instance model polygon predictions compared to locked human truth.
- 41 additional independently eligible sources required for ≥100 science gate, besides verification of independent human A/B/C and ≥30 held-out garments/≥10 negative controls.
- Instance precision/recall/IoU, category/subtype/primary/secondary color accuracy remain **NULL**. Physical Android/iPhone, live signed 4-account RLS and photographed 3D fabric realism remain separately unverified.
- **Family Alpha HOLD**, draft unmerged, strictly no changes to production or existing staging.

**Research engineering:** CI exact-head acceptance required; no success claimed until GitHub Actions independent run passes.
