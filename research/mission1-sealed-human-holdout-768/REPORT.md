# Closet Current — Mission 1: prospective, independent human/photo holdout firewall

**Research acceptance infrastructure only; FAMILY ALPHA HOLD #255; NO MERGE / NO DEPLOY.**

## Why this comes next

PR #764 independently reran local FashionCLIP/WASM on 59 licensed JPEGs: 51/56 categories and 43/56 accepted subtypes matched historical labels, with four incorrect automatic subtype saves. PR #766 removed all four observed wrong automatic saves by reserving high-risk subtype classes for owner review, at a cost of five previously correct automatic subtype saves. **All 59 photographs are now exposed development data.**

Parallel #66 / Mission 1 PR #765 and #767 measured 16 publisher-labeled garment instances in six Fashionpedia photographs. They also are exposed development samples; an opt-in bounded mask growth candidate improved one match on those same six photos, **not** independent held-out acceptance. The other parallel PR #763 owns the separate Fashionpedia candidate intake (153 quarantined metadata records, zero promoted). Do not duplicate, overwrite, or call any of that new unseen ground truth.

The next missing system is a reproducible **prospective enrollment + dual blinded review + model evaluation** process that refuses re-use of the 65 already evaluated source byte hashes, validates a frozen model identity and original photograph bytes, and cannot quietly replace missing human/recognition records with synthetic or historical success. This research implements that process; **it does not invent new human photography, annotations, signing identities or permissions**.

## Added implementation

- `research/mission1-sealed-human-holdout-768/prospective-gate.mjs`:
  - Byte-verify COMPLETE JPEG and independent SOF dimensions, SHA-256 original source, valid per-photo rights-metadata fields and no duplicate source SHA.
  - Require the immutable 59 historical public-photo exclusions plus **all six exact P66 Fashionpedia source SHA digests**, and refuse their re-enrollment under any new filename or label. Detect duplicate hash across prospective items.
  - Freeze prospective cohort, model local worker hash, model vector index hash, source exclusion-ledger digest, and public-key reviewer registry to a SHA-256 enrollment seal.
  - Verify an external coordinator's Ed25519 enrollment signature and **two independently keyed Ed25519 review records** per original image. Records must claim no exposure to predictions and not to be model-generated. Verify each signature over exact source SHA and category, subtype, primary color and nonempty instance RLE mask when garment-positive.
  - Require matching reviewers' categorical/color labels and at least .85 binary-mask intersection-over-union per instance, or a separately signed third adjudicator with explicit conflict rationale. No out-of-bounds/empty masks, duplicate instances, missing reviewer, improper source binding, unreviewed negatives or out-of-vocabulary colors.
  - Demand **every inference row**, including errors and abstentions, on the registered source hash and frozen model fingerprint. Score category, subtype and color from the signed human annotation and maximum-cardinality one-to-one instance IoU >= .5 (prevents greedy undercounting across overlapping human garments); deliberately return null for color/mask metrics if model predictions are absent rather than claiming a fake zero or 100.
  - Return explicit `missionOneCompleted:false`, `eligibleToAdvanceToMissionTwo:false`, `releaseAuthorized:false`, and `familyAlpha:'HOLD'`. Even signed keys do not independently establish truly separate human identities, legal photo rights, human blindness or non-overlap with pretrained FashionCLIP training sources.
- `scripts/prospective-holdout-768.mjs`: two local-only commands to enroll and audit with immutable Git provenance. Enrollment seals original JPEGs, the current real local-worker source SHA and recognition-vector bin SHA **before** any inference. Audit strictly verifies a pre-inference enrolled commit is an ancestor of a different inference commit, the exact seal file is present in the registration commit and predictions file in the later commit, the same local worker/vector SHA survives, the signed human receipts are valid, and the current real original JPEG bytes match. Both commands only output a non-release research report. Original JPEGs, user credentials and signing private keys must never be added to the repo.
- `tests/mission1-prospective-holdout-768.test.mjs`: synthetic-only adversarial tests of JPEG tampering, excluded real SHA, altered seal, independent signatures, reviewer key aliases, source-binding, third-reviewer disagreements, missing predictions, mask corruption, absent color metrics and late registration. Unit images are **synthetic test fixtures only**, not counted as new human photo evidence.

## Human review and operational handoff

**Prerequisite: approved source rights and at least two genuine external reviewers enrolled under an owner-audited public-key registry.** This repository has no such new reviewers or actual unseen photograph labels. Keys are NEVER to be generated as invented people, and source rights and human identities must be inspected outside the signing software.

Suggested handoff sequence:

1. Work parallel obtains permission-reviewed JPEGs **not in the exposed 59+6** and legally supported original photo/creator metadata. Human/private photos stay off GitHub. Confirm model training overlap as far as practical and record any unknowns.
2. Owner-approved coordinator establishes a trusted key identity out-of-band. Two real reviewers, who are not shown model results, independently annotate each exact photograph with category/subtype/color and pixel instance masks. On disagreement, a distinct human adjudicator resolves and signs the result; no AI-generated labels masquerade as human reviews.
3. Before any inference, run `node scripts/prospective-holdout-768.mjs seal ENROLLMENT_JSON SOURCE_JPEG_DIRECTORY OUT_JSON`. Commit the **metadata-only** seal to a designated `research/mission1-seals/` path on a new isolated branch and obtain a coordinator-signed witness. Do not commit private JPGs, passwords, private signing keys or private wardrobe metadata.
4. Execute the unchanged real model on those genuinely unseen originals. Commit only approved read-only model predictions to a later isolated research commit under `research/mission1-seals/`; the prerequisite ancestor relationship is checked via `git merge-base --is-ancestor`, not asserted by an unverified timestamp.
5. Run `node scripts/prospective-holdout-768.mjs audit SEAL_JSON WITNESS_JSON REVIEWERS_JSON PREDICTIONS_JSON GIT_CHRONOLOGY_JSON SOURCE_JPEG_DIRECTORY OUT_JSON`. The CLI refuses mismatched image/model/register/prediction Git blobs, altered reviewer keys, missing photos/labels, unadjudicated disagreements or private-source fingerprint changes. Only share aggregate metrics and permitted public-source identifiers; keep real user image bytes and reviewer private keys out of artifacts.
6. Obtain independent external review of original rights, distinct actual human identities, human blindness, training-set exposure and category representation. Quantitative owner-selected acceptance criteria and visual inspection are required before ANY Mission 1 completion or Mission 2 release transition.

## Scope and limitations

Research diff stacks only on exact proven PR #766 SHA `bd31bccac787f0b7830ed5e405ef5ef101e18100`. No shipping public app, model, private closet, cloud, production or protected staging changes. A source SHA only detects byte-identical duplicates: it does not detect near-duplicates, alternate crops, publicly pretrained visual overlap or rights misrepresentation. Ed25519 verifies signer-key possession but cannot guarantee distinct actual people; an independently trusted coordinator and reviewer identity audit are still essential. A Git ancestor relation confirms recorded commit order but cannot prove an image was never processed outside Git.

**There are presently zero newly admitted unseen human-verified real-photo labels in this research branch.** The tests establish that future evidence cannot be silently falsified, not that the future evidence has arrived. Prospective cohort sample composition, actual real-model benchmark, independent segmentation/color accuracy and physical-device reliability remain outstanding. Family Alpha HOLD #255 unchanged.
