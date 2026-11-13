# Parallel 80 — subtype evidence review and private evaluation handoff

FAMILY ALPHA HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED. This feature is research, not recognition-accuracy certification.

## Owner review, local research only

Check out this isolated branch and build with `node scripts/build.mjs`. Use an existing authorized **local synthetic test environment**, never production/staging, and open the application with `?subtype80=1`. The feature is OFF by default. It mounts only for an unsaved pending photograph in Adjust with a current signed-owner object. It is absent for saved closet edits, guests and the standalone no-account preview. This assignment does not authorize hosted accounts, private wardrobes or family photographs; real account use requires the existing authorized acceptance process outside this assignment.

1. Inspect the original photograph and confirm the broad category yourself using the existing Main category field. For a skort, an unfamiliar garment or a partly hidden waist/ankle, keep Item type Unknown or choose an appropriate existing manual value. No new Skort/Boots taxonomy label is introduced.
2. In the optional Subtype hypotheses panel, explicitly consent to the local subtype check and declare that the whole garment and distinguishing details are visible. These declarations are owner claims, not independent proof. Keep Unknown if you cannot make them honestly.
3. Click Compare subtype hypotheses. Existing FashionCLIP runs locally, with its existing first-use model/runtime downloads if needed. Only code, metadata and model weights are fetched; garment pixels are not uploaded by this adapter. Additional comparisons are bounded to two full-catalog framings per deliberate request. No background reclassification is scheduled.
4. The interface shows a few same-category hypotheses, or Unknown / Needs owner review. Same-model agreement is not independent verification. Relative softmax scores depend on the competing vocabulary and are not calibrated probabilities. A conflicting broad category/background, unsupported type, weak detail or stale evidence blocks a winner; it never changes the category on your behalf.
5. Acknowledge actual visual inspection before choosing any displayed hypothesis. Choosing it edits only the **unsaved Item type field**. It clears the normal photo confirmation. Inspect category/type/color again, check the existing owner photo-review box, and then use Save changes. The pre-existing transaction lock, pairing, duplicate and learning-consent fences remain responsible for the write.
6. Choosing a hypothesis never saves, trains, links, merges, splits shoes, creates a second record or claims independent human ground truth. Unknown remains available in the normal Item type selector even if the model cannot load. Existing explicit owner learning consent remains separate and is cleared by ordinary editor input.
7. A photo/crop/mask/unit revision, owner/session replacement, category edit, withdrawal of consent, closed dialog, elapsed result age or save in progress revokes the hypotheses. Source/mask/owner changes detected at selection prevent application. Any unavailable model/source receipt leaves the normal manual editor available. Do not retry by forging a hash or copying a result between garments/accounts.

## Evidence interface for #67 / #68 / #69 / #70

`public/subtype-review-80.mjs` provides `evidence80`, `decide80`, `createReview80` and the versioned `CONFUSIONS` map. Evidence pins the exact original JPEG SHA-256, actual recognition-input JPEG SHA-256, item/physical-unit ID, original/crop/segment/unit/companion revision digest, mask receipt and descriptor digests, pseudonymous owner scope and ephemeral reviewer session. For segmented items the existing #70 source/mask receipts and owner-confirmed unit status are mandatory; paired shoes also require two distinct same-source masks and actual owner grouping confirmation. Hashes bind bytes and receipts, not semantic mask correctness.

`public/subtype-worker-80.mjs` consumes the existing pinned FashionCLIP scorer, never a replacement model. It checks request opt-in and input SHA, executes two complete frozen-vocabulary comparisons including nonclothing controls, and returns no `identified` event or strong subtype. Model evidence contains `ff13/fashion-clip`, exact model revision, vector SHA and a deterministic digest of eight relevant recognition-source modules. Main-thread expected model/source metadata must agree with the worker, and every field is rechecked against the current live item before applying a manual choice. A returned numeric `score` is a vocabulary-relative score, not an empirically calibrated likelihood.

The core policy returns at most three alternatives, always `itemType: Unknown`, `requiresOwnerConfirmation: true`, `automaticallyCertified: false`. Strongly separated same-category scores can produce `status: hypotheses`, never an automatic subtype certificate. Close scores in either framing, cross-category or negative winners, missing full vocabulary, invalid numbers and inadequate detail abstain. Tiny residual candidates are excluded. These frozen thresholds are engineering controls, **not #71 calibration**.

## Public challenge receipts — no answer keys

```bash
node scripts/p80-challenge.mjs
node scripts/p80-challenge.mjs --recheck 3
node scripts/p80-synthetic-evaluation.mjs
```

The challenge loader reuses #75's frozen public quarantine manifest, source validator, exact SHA-1/SHA-256/length verification, overlap checks and original decoder metadata. It reads at most three actual original URLs for live byte verification, limits response size/pixels/time, retains photos in memory only, and prints aggregate counts only. It never opens sealed labels, derives subtype truth from filenames, writes source images or claims that a mechanical license receipt proves consent. Every source still needs actual curator rights/source-group approval and an approved correct-instance mask before accuracy testing. Mechanical duplicate checks do not prove physical source disjointness. All these publicly exposed sources are ineligible for new sealed blind use.

`p80-synthetic-evaluation` compares the actual previous P766 guard/top-one proposal path to the new policy on 36 explicitly synthetic score/quality/provenance fixtures. These are programming-behavior counts, not real-image model predictions, human labels, false-confidence rates or recognition gains. Existing P843 already blocks unconfirmed saves; this comparison does **not** demonstrate a reduction in actual wrong closet saves.

## #75 / #79 / #71 handoff and unresolved evidence

#75/#79 must independently approve lawful rights/consent, real physical source groups, distinct genuine reviewer identities, exact original hashes, correct region/mask associations and signed human annotations. Use their unchanged offline workstation, registrar, signing and custody workflows. Do not send a sealed blind answer key, source ID, private photo, reviewer identity or annotation into this research branch/CI. #80 does not provide a new truth signer or override.

For #71's independent evaluator, freeze this branch SHA, model/vector/source-code hashes and policy before evaluation. The custodian can invoke `decide80` privately on source-disjoint approved records, compare exact human-reviewed subtype families and retain per-image data outside Git. Required metrics are top-one subtype accuracy, candidate-set coverage, abstention/coverage tradeoff, confident-wrong rate with a declared definition, per-class denominators and source/mask invalidations. Undefined metrics stay null for an empty human cohort. Never treat an all-Unknown output as 100% accuracy, and never retune against sealed outputs.

This delivery has zero vetted human reviewers, zero approved subtype labels/mask receipts and zero independent blind scores. **Independent real-photo accuracy acceptance remains BLOCKED.** #78 alone owns actual Android/iPhone testing; desktop Chromium/WebKit at phone widths are not physical devices. P853/controller owns integration; Mission 3 owns signed cloud/privacy authority. No release or family invitation is authorized.
