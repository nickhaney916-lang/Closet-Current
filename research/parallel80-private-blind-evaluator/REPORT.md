# P80 independent-review candidate evaluation custody — research HOLD

**FAMILY ALPHA HOLD #255 OPEN. Draft, unmerged, undeployed.** No signed owner account, private wardrobe, main or existing staging, hosted Supabase, parallel branch, benchmark regression checker or blind dataset was modified.

## Engineering purpose

Closet Current now safely returns **Unknown and owner-confirmable subtype candidates** when the photograph is ambiguous. The verified [PR #1002](https://github.com/nickhaney916-lang/Closet-Current/pull/1002) tested the existing review UI with **54 desktop browser executions** using deliberately damaged public clothing-photo inputs; [PR #999](https://github.com/nickhaney916-lang/Closet-Current/pull/999) ran real FashionCLIP on **three original public development photographs and three altered versions** with original SHA evidence. These are programming and runtime safeguards, **not independently labeled subtype accuracy**.

The remaining critical external dependency is genuinely verified rights and source identity, **two independently signed and full-field agreeing human reviewer receipts**, sealed source-disjoint blind images, and a separately custody-pinned model scoring event. This follow-up adds an **offline, private, fail-closed candidate-set evaluation handoff**, not another public pseudo-ground-truth benchmark.

## Trust and source contract

`scripts/p80-private-blind-evaluator.mjs` integrates the preexisting authoritative P79 `loadSession`, P75 signed reviewer `reviewHandoff`, approved public registrar fingerprint, source originality (SHA-256/SHA-1/exact length), legal rights and physical source-group approval, historical exposure ledger, near-duplicate checks and blind permissions. It requires every source to have **exactly two** unmodified valid independent reviewer receipts agreeing on *all annotation fields*, and fails closed on any missing, disputed, foreign or duplicate source.

A distinct Ed25519 scoring seal must be signed by a separately **externally pinned** scorer public key over the complete private predictions SHA-256, source count, model SHA-256, and target commit; its model and source commit must exactly match **owner-preapproved** values frozen before the scoring timestamp. Adversarial synthetic tests confirm correct signature verification and reject tampered payloads and digests. Every prediction is paired one-to-one with a verified original source. Unknown must remain the result; no automatic subtype certification, save, learning, pair or merge is permitted.

The private report is withheld unless at least **60 fully source-verified blind originals** are present, preventing small-cohort aggregate disclosure and matching the existing P851 minimum sample-scale requirement. Only previously established **single-garment / single physical unit / complete acceptable-quality / known subtype** consensus may enter the conditional candidate-set calculation. An uncertain, clipped, multi-garment or mismatched source blocks the entire cohort instead of quietly shrinking the denominator. This restricted scope explicitly excludes multi-item outfits and photographed footwear pairs, which must receive their own evaluation with true masks/units.

Metrics are *conditional* on a separate pre-reveal human operator category, not a measure of initial category recognition. The tool reports only aggregate counts: source count, candidate-set hits/coverage, abstention count and broad-category-hint disagreements; never image bytes, source IDs, actual annotations, raw prediction vectors, names, private keys or photos. The tool **does not report top-1 subtype recognition accuracy**, independent real-world performance or approval to release. Actual human identity, curator rights and scorer independence require vetting outside the repository; a generated key or signer flag alone cannot prove a real human independently reviewed a garment.

**Critical model policy limitation:** A P80 candidate list only proposes up to three alternatives. The measured quantity, once a true blind cohort exists, is **whether the human-consensus subtype appears in that set**. It does not prove the model autonomously identified the correct type, and is not directly equivalent to top-1 accuracy or a lower confident-wrong-save rate. Because the system has not obtained 60 independent sealed originals or physical phone/hosted privacy acceptance, release and pilot authorization remain BLOCKED under P851.

## Offline private commands — DO NOT run on public CI

The input paths below must be absolute, outside the Git checkout, with private ownership/permissions. The evaluator rechecks realpaths to reject repository paths and symlinks pointing back into the checkout.

```bash
node scripts/p80-private-blind-evaluator.mjs \
  /private/vetted-blind-p79-session.json \
  /private/signed-two-human-receipts.json \
  /private/independently-signed-pretruth-category-lock.json \
  /private/source-matched-p80-candidates.json \
  /private/independently-signed-scoring-seal.json \
  /private/owner-pinned-registrar-and-scorer-fingerprints.json
```

The private \`trusted\` file MUST independently preapprove THREE distinct Ed25519 key fingerprints: \`registrarFingerprint\`, \`operatorFingerprint\` and \`scorerFingerprint\`. It also freezes \`targetCommit\` (40-hex), \`modelSha256\` (64-hex), and \`approvedAt\` (ISO-8601 timestamp). Both the separate category-operator lock and scorer seal must match these pinned source/model values. Model scoring cannot use a free-text category provenance flag without a separately signed category lock.

The P79 session includes source original external file paths, historical source/perceptual exposures and registrar-signed blind session; no source information is copied into repo or Actions. The scorer seal uses `p80-private-scorer-seal-v1` and fields `schema,targetCommit,modelSha256,predictionsSha256,sourceCount,scoredAt,publicKey,signature`. The signed payload contains all fields **except** `publicKey` and `signature`.

Each scored prediction contains exactly `sourceSha256,modelSha256,operatorCategory,operatorCategoryProvenance,status,itemType,requiresOwnerConfirmation,automaticallyCertified,alternatives`. `operatorCategoryProvenance` must be `blind-operator-before-truth-reveal`. `itemType` always `Unknown`, `automaticallyCertified` always false, `requiresOwnerConfirmation` true, `status` `hypotheses` or `abstain`, and `alternatives` is a rank-ordered array of 0–3 `{category,itemType,rank,relativeScore}` elements drawn from the unchanged category subtype taxonomy. The tool does not itself generate scores or run private photos through the model. An independent scoring operator must build and sign these receipts after genuine blind source/human custody is approved.

If the trust/rights/reviewer/scoring contract is absent, the tool produces numeric-safe `BLOCKED` with null accuracy. In CI it never reads private input and always produces `BLOCKED` even if supplied. The public automated test code uses only **ephemeral generated synthetic key fixtures**, has no independent humans, and does NOT exercise real sealed blind evidence. Synthetic arithmetic tests check *software accounting only* and may not be converted into empirical recognition accuracy.

## Verification and scope

The P80 private-score parent added the private evaluation module, adversarial tests, report and strict research no-deploy workflow. This FOLLOW-UP only adds a pure no-I/O independently signed category lock verifier and updates the private evaluator/tests/report/workflow (P853 cumulative allowlist 20 → 21 paths). It retains full native tests, builds, already verified P80 actual-browser real-photo preflight, actual public-photo worker/crop/dim checks, source SHA, safe Unknown and privacy browser regressions. The workflow invokes the new evaluator **without private inputs in CI** to check explicit blocked status. Exact-head CI evidence must be recorded after completion; never infer from prior passes.

**Still blocked:** 0 genuine vetted independent human subtype labels/masks; 0 sealed source-disjoint scored originals; 0 physical Android Chrome and iPhone Safari; 0 witnessed signed two-owner hosted cloud private E2E acceptance. Historical public default-path benchmark still fails five boot-Unknown vs old auto-indexing expectations; never waive them or advertise repository-wide green or “10/10” accuracy. P851 keeps `shouldLiftFamilyAlphaHold:false` and [Family Alpha HOLD #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) open.


## Follow-up: signed pretruth operator category lock and leakage chronology

**Security correction — unmerged / no-deploy research only.** The parent allowed the scorer to supply \`operatorCategoryProvenance: "blind-operator-before-truth-reveal"\` as self-reported text and accepted reviewer timestamps BEFORE the scorer timestamp. This did not prove that categories were independently assigned, and permitted scoring after human labels had been completed. The follow-up rejects both hazards.

- An **independently externally pinned category operator** signs an immutable 60-source source-to-category mapping BEFORE the model is scored and BEFORE either independent reviewer records a human label. Neither model predictions nor human labels may be displayed to that operator. This is a key-custody claim requiring independent external review, NOT proof of real humans or lack of leaked information.
- The operator lock JSON has schema \`p80-independent-operator-category-lock-v1\` and exact fields \`schema,targetCommit,modelSha256,sourceSetSha256,recordedAt,rows,publicKey,signature\`. The signed payload excludes publicKey and signature. Each entry in rows has exactly \`sourceSha256,operatorCategory,predictionsHidden:true,blindLabelsHidden:true\`. Source set digest is SHA-256 of the canonical sorted source SHA strings. The operator's Ed25519 fingerprint MUST differ from the scorer and registrar; every scored prediction's source SHA and category must exactly match the independent operator row. The user must externally vet operator independence.
- A successful timing claim must follow **externally frozen approval → independent category lock → scorer-signed model output → two blind independently human-reviewed labels** (each receipt strictly later than score sealing). Human raters must never be shown predictions; the scorer must never be shown labels. Source legality, exact originals, and sealed historical exposure continue through P75/P79. Signed timestamps alone can be backdated and are NOT a trusted timestamp authority; a real custodian must independently witness ordering.
- \`abstain\` predictions are now required to have exactly ZERO alternatives, to prevent hidden candidate-set successes being counted under an Unknown/abstain label.
- Tests are generated synthetic signatures/timestamps and do not make the 60 blind photos, human labels, legal approvals, or physical phones exist. Private output remains redacted and software evaluation remains blocked without them. Family Alpha HOLD #255 remains OPEN, with NO release claim.

The revised CLI now needs SIX external, realpath-checked and private JSON inputs: P79 blind source bundle, two-human receipts, separately signed operator category lock, source-matched model predictions, separate scorer seal, and three-key owner trust pins (in that exact order). Do not put these files or their signed keys in GitHub or public CI.
