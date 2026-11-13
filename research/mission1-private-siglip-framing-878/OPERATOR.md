# P878 PRIVATE paired original/full-frame SigLIP research: operator handoff

**Family Alpha HOLD #255 OPEN.** No production, staging, hosted Supabase, main, private wardrobes, or model promotion.

This contract is for a future **independently approved offline** 60-original-image blind evaluation of the P877 full-frame SigLIP candidate, after P75 lawful independent physical garment grouping and P79 externally vetted two-human annotations are genuinely available. As of this research change, verified independent humans and blind photos are **zero**. Do not fabricate them.

## Roles and separation
An externally approved rights curator controls legally sourced original bytes and photographs' physical-garment grouping outside this Git checkout. A separate externally vetted registrar authorizes source custody and two distinct human reviewers. Reviewers inspect originals independently with no model labels, scores, filename-derived truth or predictions. The pre-reveal operator locks main category using the existing P80 operator authorization. A distinct externally approved scorer runs the pinned original SigLIP and alternative full-frame SigLIP on **the same original source SHA** with fixed q8 weights, saves both complete 47-label ranking transcripts outside the repo, and signs the paired digest before any human truth is revealed. A private custodian evaluates only after both independently signed reviewer receipts and the sealed scorer proof are complete. CI must never receive any private photo, secret, label, reviewer key, seal, row-level score or source-identifying metadata.

## Existing evidence and interfaces that remain authoritative
- `scripts/p75-dataset-core.mjs` and `scripts/p75-review-offline.mjs` enforce lawful-original source identity, source-level disjointness, rights and two independently signed human labels.
- `scripts/p79-workstation-core.mjs` validates private, externally attested reviewer sessions, original bytes, source-group deduplication, full-field label consensus and historical exposure ledger.
- `scripts/p80-private-blind-evaluator.mjs` authoritatively verifies exact 60-source source/reviewer/score custody, pre-reveal operator category, full 47-label original-model proofs and separately pinned P80 scorer seal. Its result must be `PRIVATE_RESEARCH_ONLY_NOT_RELEASE` with exactly 60 sources before any P878 paired score aggregation is allowed.
- `scripts/p878-private-siglip-framing.mjs` adds a second, specifically preapproved and Ed25519-sealed **same-model, two-framing** proof. It does not create photos, call a model or invent human truth.

## Pre-register before processing originals or exposing labels
Custodian and independent scorer must agree offline on the **immutable Git commit SHA** of a subsequently reviewed, frozen scorer and evaluation policy. The private trust JSON must contain the existing P80-required independent fingerprints, source digest approvals, model SHA, P80 vector/source provenance, operator precommitment and:
`targetCommit` (40 hex, same as preceding P80 seal), `p878PolicySha256` = SHA256(canonical(`policy878(targetCommit)`)), `scorerFingerprint` = SHA256(approved Ed25519 scorer public-key DER), and `approvedAt` BEFORE both P80 and P878 signing. No self-minted key is accepted as verified independent custody merely because a signature validates. Require an independent external registrar to approve both real reviewer identities and scorer.

The P878 model policy is pinned Marqo FashionSigLIP revision `782eaf7a0b95411ac96893d2300d1a61a2bcb757`, its repository pinned text-vector SHA, original default processor view vs `fitWholePhoto224-white`, and explicitly **sameModelNotIndependent**. Category/type vocabulary remains all 47 unchanged candidate labels. Historical development originals, their near duplicates, same garment groups, user-private originals and photos seen in any earlier public benchmark must not enter this new blind cohort.

## Paired private transcript (60 records, no labels)
A JSON array with **exactly 60 objects**. Each object has exactly:
- `schema`: `p878-private-paired-full-frame-v1`
- `sourceSha256` and `inputSha256`: the same 64-character SHA-256 of independently approved original bytes
- `targetCommit`: 40-character preapproved immutable Git SHA
- `modelKey`: `fashionSiglip`; `modelRevision` and `vectorSha256`: exactly matching pinned source model
- `workerSourceCodeSha256`: source-verified pinned 64-character code digest
- `baseline`, `alternate`: full 47-entry ranked arrays of `{ "label": "...", "score": 0.0 }`, each label once, sorted by decreasing cosine score
- `sameModelNotIndependent:true`; `automaticAdmissions:0`

Do not add annotations, expected labels, identities, review notes, raw photo bytes, MIME/base64 frames, owner IDs, outcomes or garment-source URLs to this transcript. P878 validates source equivalence and full ranks, but a separately trusted human must independently verify genuine q8 inference and control of the scorer machine; signed JSON alone does **not** prove inference.

## Seal and evaluate — externally and ONLY after independently approved scoring
To sign, the offline scorer must use existing **outside-checkout** Ed25519 key and files. The scorer personally attests to original licensed image inference. Never set this environment variable on behalf of an absent person.
```bash
P878_SCORER_PERSONAL_ATTESTATION='I independently scored these originals with the pinned models before human label reveal' \
 node scripts/p878-sign-private-pairs.mjs \
 /private/custody/paired-ranks.json \
 /private/custody/scorer-ed25519-private.pem \
 /private/custody/p80-scorer-seal.json \
 /private/custody/preapproved-trusted.json \
 /private/custody/p878-paired-seal.json
```
The signer uses `wx` and 0600 output permissions; never overwrites an existing seal. The seal binds policy digest, paired transcript digest, source count, immutable target SHA and **previous P80 scorer seal digest**. For accuracy custody, human reviewers must submit genuinely independent original-photo reports **after scoring**, and registrar must verify this timing.

Only the private custodian then runs the offline read-only evaluator with **nine preexisting outside-checkout** JSON paths:
```bash
node scripts/p878-private-siglip-framing.mjs \
 /private/custody/p79-source-bundle.json \
 /private/custody/human-review-receipts.json \
 /private/custody/p80-operator-lock.json \
 /private/custody/p80-model-candidates.json \
 /private/custody/p80-full-score-proofs.json \
 /private/custody/p80-scorer-seal.json \
 /private/custody/preapproved-trusted.json \
 /private/custody/paired-ranks.json \
 /private/custody/p878-paired-seal.json
```
Paths are placeholders, **not** available or implied to exist. Neither command operates in GitHub Actions. A BLOCKED result returns null metric counts, refuses selective denominator shrinkage, does not show any photo, subtype, label, reviewer or row. When genuine independent proof exists, the only possible successful status is `PRIVATE_RESEARCH_ONLY_NOT_RELEASE` with aggregate paired top-1 consensus counts, improvements, regressions and first-rank changes, **never release authorization**. This conditional evaluation includes only fully verified single-garment, single-wardrobe-unit, acceptable-quality, human-consensus known subtype sources; non-clothing/multiple garment and pairing acceptance require additional independent protocols.

## Scientific and product decision
P877's exposed 48-photo original-vs-full-frame result (27/45 → 28/45 historical garment string matches; one negative source improved; sneaker→ankle boot unresolved) is development evidence and **not** a blind evaluation. If a complete future blind cohort reveals losses, document every loss rather than selecting only favorable categories. Even positive aggregate paired results cannot, by themselves, lift HOLD #255: real continuous WebKit two-model stability (#83), physical Android/iPhone owner acceptance (#78), signed two-owner privacy/cloud, segmentation, color, pairing and all release criteria must still pass. New private evidence always remains off GitHub and out of screenshots, chats and CI artifacts.
