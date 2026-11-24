# Assignment #75 — independently verifiable clothing-photo ground-truth infrastructure

**Tracking:** [Issue #950](https://github.com/nickhaney916-lang/Closet-Current/issues/950). **Immutable compatible parent:** Mission 1 P845 draft PR #947 exact 6aad19ae0705aa42e75b80583720210ce9d7e1ef. **Isolated branch:** research/parallel75-independent-blind-photo-ground-truth-20261112-HOLD. **RELEASE:** FAMILY ALPHA HOLD #255 OPEN. NO production, staging, hosted Supabase, private wardrobes or #67–#74 branches modified. DRAFT / UNMERGED / NO DEPLOY.

## Delivered implementation

1. scripts/p75-acquire-commons.mjs and research/parallel75/queries.json implement a bounded publicly logged **TRAIN/DEV discovery-only** original-photo acquisition from Wikimedia Commons. It verifies source File: page, allowed original Wikimedia upload host **without thumbnails**, explicitly matched compatible CC license name and URL, attribution author, Commons API original SHA-1 and byte size against actually downloaded bytes, computed SHA-256, accepted image MIME, decoder-reported dimensions/EXIF orientation, and 64-bit perceptual dHash. No source bytes or private photographic content are committed. Every discovered row is **UNLABELED**, **human rights review required**, **source grouping unreviewed**, and **quarantined**. File titles/search terms are never human truth.
2. scripts/p75-dataset-core.mjs provides valid-source schema, original-byte verification, freshness timeout, explicit license URL checks, normalized Commons URL identity, historical exposure registry from existing public manifests, exact SHA, same photo page, publisher-series, same-item ID and conservative perceptual near-duplicate checks. Partition validator forbids conflicting split groups, cross-split near duplicate, previously scored/exposed blind and unapproved blind.
3. tests/parallel75-independent-ground-truth.test.mjs tests malformed/expired origin, wrong license, thumbnails, source change and edited images, cross-split resized/cropped lookalikes, historical exposure, conflicting category/color, impossible boxes/shoe pairing, fake or AI-only rater, missing registrar trust anchor, altered signatures, duplicated same-human review, fake public blind and safe empty outputs. Generated test-only Ed25519 keys are **synthetic fixtures**, not independent human evidence.
4. research/parallel75/CODEBOOK.md and annotation-template.json define current taxonomy, quality/color/multi-garment/footwear-unit fields, uncertainty/abstention, two blinded independent raters, third human adjudication, curator/license approval, offline custody and sealed #71 handoff. Template is **empty/unverified**.
5. scripts/p75-review-offline.mjs provides deliberately **non-CI** local human signing and private review-bundle auditing with an externally owner-approved Ed25519 registrar, signed rights+subject-consent legal-evidence hash for **every** promoted TRAIN/DEV/BLIND source, signed independent human labels, source-group evidence, exact agreement denominators and a complete historical visual ledger before blind sealing. It does **not** automatically create real humans, permissions, consent, approved public keys, blind images or truth.
6. research/parallel75/pinned-public-training-development-candidates.json freezes the exact successful **32 distinct original-file SHA-256** public-source receipts from [NO DEPLOY run #43336405939](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43336405939). This is a public metadata-only TRAIN/DEV discovery resource; **all 32 remain QUARANTINED**. scripts/p75-verify-pinned.mjs performs 32/32 offline schema/rights/exposure tests and optional exact-image/actual current Commons-license rechecks for the first N sources, without committing images or any garment annotations.

## Blind/provenance red lines

The older public original manifests (locked sources, 16 holdout, 32 reviewed, 11 fresh) were already development-exposed; they **cannot be used as a new independent blind set**. The Commons query output itself is public and exposed; **no newly discovered row on this public CI workflow is blind eligible**. The blind set must come from a separately controlled *nonpublic* acquisition, independent legal/physical garment group vetting and double human review, followed by signed historical visual-fingerprint coverage and a one-time controlled #71 evaluation.

Cryptographic signature validation proves that a recognized reviewer KEY signed specific text. It **does not prove** that an independent human was behind the key. External human ID vetting plus an owner-approved registrar fingerprint are mandatory. AI/LLM annotations are not accepted.

Source hash + Commons license metadata prove exact bytes/claimed license metadata **only at the audit date**, not ongoing legal title, photo provenance beyond the publisher claim, distinct physical garments, or category/subtype/color truth. The human source/rights curator must approve these.

## Initial measurable evidence and shortfalls

**Before #75:** historically exposed recognition photo manifests exist, but there is no independently held SEALED blind test; no externally trusted two-human label adjudication or complete historical near-duplicate ledger is demonstrated. Do not treat previous development-exposed 13-photo FashionCLIP matches or #67 tuning scores as blind correctness.

**After #75, measured on completed source run #43336405939:** Wikimedia Commons API searches **12/12 succeeded**. The run fetched and validated the exact original bytes for **32/32 accepted files** against current Commons source SHA-1/byte lengths and local computed SHA-256, decoder metadata, EXIF and matched CC license metadata. There were **32 distinct SHA-256 source byte identities**. There were **2 source rows flagged as possible overlap** within the new cohort (including **1 suspected same-publisher numbered gallery series**); these are not counted as proven distinct garments. The historical exposed index contains **76 unique identity records**, with **59 valid distinct Commons page keys**; not all have complete image/perceptual fingerprints. New curator-confirmed separate physical garment groups **0**. New genuine independent sealed blind sources **0**. The cohort is strictly **PUBLIC/DEVELOPMENT-EXPOSED, UNLABELED and QUARANTINED**, not an accuracy evaluation dataset. Original photographs and human labels committed to repo: **0**.

**Before/after comparison:** previously **0 newly source-byte-verified P75 originals**; after acquisition **32 source byte receipts**, but **human-accepted groups remain 0→0**, eligible TRAIN **0→0**, DEV **0→0**, BLIND **0→0**, independent accuracy metrics **UNKNOWN→UNKNOWN**. The planning **240-source** shortfall is **208 original SHA-verified files** even before physical-group / quality / rights curator filtering. Hash uniqueness is not source-group disjointness. Manual curator rights/release checks are required (some source titles appear to involve people or unrelated scenes).

Externally confirmed HUMAN reviewers: **0 available in this session**. Independent category/subtype/color labels: **0**; independently agreed labels: **0**; human-drawn instance masks: **0**; verified shoe-pair unit labels: **0**; human quality ratings: **0**; independently eligible TRAIN: **0**, DEV: **0**, sealed BLIND: **0**; measured recognition accuracy/lift: **UNKNOWN**. Source-group uniqueness is **not established** from hashes alone.

Target remains 240 new, curator/group approved original photos with **120 train / 60 development / 60 sealed blind** distinct groups. Report discovered *metadata/bytes* separately from these human approval and split counts; never pad with crops or alternate views.

## Reproduction

Full no-deploy CI: .github/workflows/parallel75-independent-photo-ground-truth-no-deploy.yml. The workflow is read-only, strict 11-path allowlist relative to pinned P845, checks no production/recognition/hosted/cloud paths, runs both preview builds and full native app tests plus P75 adversarial suite. Second job runs limited Commons original-byte download and produces **only public candidate manifest/aggregate metric artifacts**, and quarantines everything; failures to reach Commons are acquisition blockers rather than invented photos. Data audit: run node scripts/p75-acquire-commons.mjs with node 22 and temporary sharp 0.34.3; set optional P75_MAX_ORIGINALS=36. For deterministic pinned candidate verification run node scripts/p75-verify-pinned.mjs (offline full manifest) and P75_RECHECK_LIMIT=5 node scripts/p75-verify-pinned.mjs (actual source/bytes/license metadata recheck, 5 of 32 sources). Only authorized independent real reviewers may use offline signing tool as described in CODEBOOK.md; it refuses Actions/CI and paths within Git checkout.

## Verified prior no-deploy CI evidence (not final branch HEAD)

At executable source/series-check commit 00b23e971932eaaea6a6c54731294d267f2e29b4, [Actions #43336405939](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43336405939) **completed SUCCESS, 2/2 jobs**: 15/15 focused adversarial tests, 348/348 full native suite with both app builds; source licensing/original SHA-1+SHA-256 and JPEG/PNG/WebP decoder audits verified 32 original receipts with zero eligible human labels/blind. This was before the subsequently pinned static public receipt and final governance refinements; obtain a **new exact-head passing run** for final acceptance.

## Coordination and release blockers

- #67 training/model receives **only human-curated train/dev after gate**, never blind.
- #68 segmentation and #70 footwear unit pairing receive ONLY licensed human-drawn/paired evidence where separately reviewed.
- #69 mobile speed, #72 owner learning, #73 optional photo quality, #74 batch UX are separate concerns; do not modify their branches.
- #71 is the eventual independent sealed blind scoring owner; **#75 does not score a model and never reports a model accuracy gain**.
- Signed identities, two real human raters, curator permissions/legal evidence, exact physical garment grouping, complete source-group near-duplicate audit versus old photos, truly nonpublic new blind acquisitions, sufficient category diversity, offline blind handoff and human disagreement reconciliation are **BLOCKED pending outside independent humans/authorized access**.
- Family Alpha HOLD #255 stays OPEN. No merge/no deploy.

## P0 footwear recovery (November 23, 2026 PT)

**P0 remains blocked on independent human ground truth and evaluator custody.** The [Mission 1 provenance audit](https://github.com/nickhaney916-lang/Closet-Current/commit/26e1042564394547f0e9ec88e113a12631d1625e) identified three nonwearable entries among 20 legacy positive footwear labels. The four retained boot photographs belong to one Auckland Museum source group. The corrected audit ledger stays separate from the legacy model fixtures.

All 34 executed Commons discovery calls succeeded across the initial search, a footwear category supplement and a shoe-shaped object supplement. Each of the **172 new receipts** records an exact original-file SHA-256, the Commons SHA-1 and byte count matched against the downloaded original, decoded dimensions and orientation, perceptual hash, source URL, author and compatible license metadata. The ledger contains no photograph bytes or receipts asserting human approval. A metadata match alone cannot establish reuse eligibility, photographed-person permissions or an independently labeled object.

| Discovery bucket | Distinct byte receipts | Distinct attribution strings | Receipts with overlap flags |
| --- | ---: | ---: | ---: |
| Sneakers | 15 | 12 | 0 |
| Ankle boots | 15 | 8 | 6 |
| Tall boots | 22 | 15 | 0 |
| Flats | 15 | 14 | 2 |
| Heels | 27 | 22 | 2 |
| Sandals | 19 | 16 | 3 |
| Loafers | 23 | 20 | 0 |
| Nonwearable look-alikes | 36 | 30 | 2 |
| Total | 172 | | 15 |

Attribution strings can represent aliases or the same collection. Search buckets are provisional. The receipts include false matches, worn footwear requiring the existing consent review, and alternate views. Recomputed overlap checks identified 3 receipts with a historical-source overlap flag and 15 flagged across the combined comparison. Auckland accession matching now catches differently numbered views of the same catalogued object, including in the historical benchmark. A 23-original visual spot check confirmed useful product-only photographs as well as unsuitable or ambiguous results. For development curator triage, start with candidate suffixes 0004, 0087, 0007, 0008, 0056, 0057, 0017, 0026, 0027, 0113, 0114, 0042, 0076, 0043 and 0044. These are preliminary visual leads. Use the signed human review process before assigning labels.

- **Mission 1 #1172/#1175 and model research #892:** use the public candidate ledger as a development sourcing lead. Independently approved development objects and labels are both **0**. The ledger is ineligible for blind use and cannot support an accuracy claim.
- **Independent evaluator #929:** sealed photos, labels and verified groups are all **0**. A genuine handoff requires a vetted registrar, two independent human reviewers, signed source rights/consent and grouping, the signed historical fingerprint audit and an evaluator-controlled offline channel for unexposed originals. The evaluator can then freeze the reviewed cohort against frozen candidate models. The audit emits only aggregate status and a salted commitment that binds the signed blind review receipts. Keep source originals and labels in evaluator custody outside Git and CI.
- Target shortfall in verified physical objects remains **140 wearable and 20 hard negatives**. The positive goal is 10 development and 10 blind objects per subtype, plus 10 hard negatives per split. Both splits must have independent publisher coverage, and the sneaker cohort must include low- and high-tops.

Run `node scripts/p75-acquire-commons.mjs --footwear` for the development search and add `--supplement` to extend a local discovery receipt with the targeted Commons categories. Run `node scripts/p75-verify-pinned.mjs --footwear` for a frozen-ledger audit. Set `P75_RECHECK_LIMIT=8` for a current-source recheck across the eight search buckets. The private `p75-review-offline.mjs audit … --footwear` mode binds reviews to exact original files, compares publisher and physical groups, verifies independent signatures and fails closed on target shortfalls. Family Alpha HOLD #255 continues.
