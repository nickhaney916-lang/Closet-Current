# Assignment #75 — independently verifiable clothing-photo ground-truth infrastructure

**Tracking:** [Issue #950](https://github.com/nickhaney916-lang/Closet-Current/issues/950). **Immutable compatible parent:** Mission 1 P845 draft PR #947 exact 6aad19ae0705aa42e75b80583720210ce9d7e1ef. **Isolated branch:** research/parallel75-independent-blind-photo-ground-truth-20261112-HOLD. **RELEASE:** FAMILY ALPHA HOLD #255 OPEN. NO production, staging, hosted Supabase, private wardrobes or #67–#74 branches modified. DRAFT / UNMERGED / NO DEPLOY.

## Delivered implementation

1. scripts/p75-acquire-commons.mjs and research/parallel75/queries.json implement a bounded publicly logged **TRAIN/DEV discovery-only** original-photo acquisition from Wikimedia Commons. It verifies source File: page, allowed original Wikimedia upload host **without thumbnails**, explicitly matched compatible CC license name and URL, attribution author, Commons API original SHA-1 and byte size against actually downloaded bytes, computed SHA-256, accepted image MIME, decoder-reported dimensions/EXIF orientation, and 64-bit perceptual dHash. No source bytes or private photographic content are committed. Every discovered row is **UNLABELED**, **human rights review required**, **source grouping unreviewed**, and **quarantined**. File titles/search terms are never human truth.
2. scripts/p75-dataset-core.mjs provides valid-source schema, original-byte verification, freshness timeout, explicit license URL checks, normalized Commons URL identity, historical exposure registry from existing public manifests, exact SHA, same photo page, publisher-series, same-item ID and conservative perceptual near-duplicate checks. Partition validator forbids conflicting split groups, cross-split near duplicate, previously scored/exposed blind and unapproved blind.
3. tests/parallel75-independent-ground-truth.test.mjs tests malformed/expired origin, wrong license, thumbnails, source change and edited images, cross-split resized/cropped lookalikes, historical exposure, conflicting category/color, impossible boxes/shoe pairing, fake or AI-only rater, missing registrar trust anchor, altered signatures, duplicated same-human review, fake public blind and safe empty outputs. Generated test-only Ed25519 keys are **synthetic fixtures**, not independent human evidence.
4. research/parallel75/CODEBOOK.md and annotation-template.json define current taxonomy, quality/color/multi-garment/footwear-unit fields, uncertainty/abstention, two blinded independent raters, third human adjudication, curator/license approval, offline custody and sealed #71 handoff. Template is **empty/unverified**.
5. scripts/p75-review-offline.mjs provides two deliberately **non-CI** operations: human-key local signing and validation of a private review bundle against an externally owner-approved Ed25519 registrar fingerprint, source-group rights attestation, independence/agreement, known exposure and historical visual-hash coverage, and private-salt blind commitment hash. It does **not** automatically create humans, consent, approved public keys, blind images or human truth.

## Blind/provenance red lines

The older public original manifests (locked sources, 16 holdout, 32 reviewed, 11 fresh) were already development-exposed; they **cannot be used as a new independent blind set**. The Commons query output itself is public and exposed; **no newly discovered row on this public CI workflow is blind eligible**. The blind set must come from a separately controlled *nonpublic* acquisition, independent legal/physical garment group vetting and double human review, followed by signed historical visual-fingerprint coverage and a one-time controlled #71 evaluation.

Cryptographic signature validation proves that a recognized reviewer KEY signed specific text. It **does not prove** that an independent human was behind the key. External human ID vetting plus an owner-approved registrar fingerprint are mandatory. AI/LLM annotations are not accepted.

Source hash + Commons license metadata prove exact bytes/claimed license metadata **only at the audit date**, not ongoing legal title, photo provenance beyond the publisher claim, distinct physical garments, or category/subtype/color truth. The human source/rights curator must approve these.

## Initial measurable evidence and shortfalls

**Before #75:** historically exposed recognition photo manifests exist, but there is no independently held SEALED blind test; no externally trusted two-human label adjudication or complete historical near-duplicate ledger is demonstrated. Do not treat previous development-exposed 13-photo FashionCLIP matches or #67 tuning scores as blind correctness.

**After #75 implementation:** deterministic code, adversarial tests, human signature review workflow, source/rights/acquisition audit and strict no-deploy CI are implemented. The source query job emits the *exact* SHA-verified source acquisition count and overlap risk with explicit totals, without image bytes or any independent labels. Before CI finishes, **new actually acquired bytes proven in this run = UNVERIFIED**. Existing historical sources do NOT count toward the new 240 target.

Externally confirmed HUMAN reviewers: **0 available in this session**. Independent category/subtype/color labels: **0**; independently agreed labels: **0**; human-drawn instance masks: **0**; verified shoe-pair unit labels: **0**; human quality ratings: **0**; independently eligible TRAIN: **0**, DEV: **0**, sealed BLIND: **0**; measured recognition accuracy/lift: **UNKNOWN**. Source-group uniqueness is **not established** from hashes alone.

Target remains 240 new, curator/group approved original photos with **120 train / 60 development / 60 sealed blind** distinct groups. Report discovered *metadata/bytes* separately from these human approval and split counts; never pad with crops or alternate views.

## Reproduction

Full no-deploy CI: .github/workflows/parallel75-independent-photo-ground-truth-no-deploy.yml. The workflow is read-only, strict 9-path allowlist relative to pinned P845, checks no production/recognition/hosted/cloud paths, runs both preview builds and full native app tests plus P75 adversarial suite. Second job runs limited Commons original-byte download and produces **only public candidate manifest/aggregate metric artifacts**, and quarantines everything; failures to reach Commons are acquisition blockers rather than invented photos. Data audit: run node scripts/p75-acquire-commons.mjs with node 22, local sharp 0.34.3 installed; set optional P75_MAX_ORIGINALS=18. Only authorized independent real reviewers may use offline signing tool as described in CODEBOOK.md; it refuses Actions/CI and paths within Git checkout.

## Coordination and release blockers

- #67 training/model receives **only human-curated train/dev after gate**, never blind.
- #68 segmentation and #70 footwear unit pairing receive ONLY licensed human-drawn/paired evidence where separately reviewed.
- #69 mobile speed, #72 owner learning, #73 optional photo quality, #74 batch UX are separate concerns; do not modify their branches.
- #71 is the eventual independent sealed blind scoring owner; **#75 does not score a model and never reports a model accuracy gain**.
- Signed identities, two real human raters, curator permissions/legal evidence, exact physical garment grouping, complete source-group near-duplicate audit versus old photos, truly nonpublic new blind acquisitions, sufficient category diversity, offline blind handoff and human disagreement reconciliation are **BLOCKED pending outside independent humans/authorized access**.
- Family Alpha HOLD #255 stays OPEN. No merge/no deploy.
