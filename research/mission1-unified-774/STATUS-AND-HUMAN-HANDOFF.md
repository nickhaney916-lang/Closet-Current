# CLOSET CURRENT — MISSION 1 UNIFIED INDEPENDENT RECOGNITION PROGRAM (P774)

**Repository:** nickhaney916-lang/Closet-Current

**Current status:** ENGINEERING INTEGRATION AND REAL-HUMAN READINESS RESEARCH ONLY. **MISSION 1 NOT COMPLETE; FAMILY ALPHA HOLD #255.** No merge, deployment, production/staging, hosted Supabase, private customer/account modifications.

## Actual integrated code — no competing isolated baselines

P774 begins from parallel [PR #767](https://github.com/nickhaney916-lang/Closet-Current/pull/767), verified exact HEAD `0d9534130cc1e72e9e9e0dd7827267babdc5a911`, which has the substantially broader 1,514-test native/3D/private-closet research stack. The 18 independently tested research, CLI and unit paths of P768–P773 have been imported as **Git object-identical blobs** into one branch, without overwriting or modifying the native app's `public/` source. This reconciles the otherwise separate 321-test source-integrity branch with P767's larger recognition/camera/private-owner base. Rejected P773 weak-logit unseeded proposals remain **research-only negative evidence** and must not be treated as a product feature.

### Real publisher photo diagnostics that dictate the next recognition work

Eight preselected original P772 Fashionpedia/Pexels publisher photos contained **20 individual published human mask annotations** and sixteen union semantic regions. In real Chromium and WebKit, original raw SegFormer semantic regions averaged **37.50% and 36.38% IoU**, with **five missed of sixteen** in each engine. On the same 20 publisher polygons, independent frozen-source model proposals **5 TP / 11 FP / 15 FN**. P767's review-only original-logit seeded growth improved this to **7 TP / 9 FP / 13 FN** on both engines. P773's separate unseeded weak-logit review added three extra false positives with **zero** additional true positives; it is **rejected for adoption**. These eight photos are exposed development examples, not a fresh independent human heldout.

### Closed integrity gap: all 73 already examined original sources now excluded

- P774 pinned original-source byte SHA and publisher IDs for the eight P772 photographs directly from the [verified P772 Actions artifact #13730830952](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42743671008/artifacts/13730830952).
- The historical 59 source SHA identities are read from the canonical original `benchmark/locked-photo-sources.json`, and the prior six Fashionpedia/Pexels publisher SHA sources are already pinned by P768. The **59 + six + eight = 73 distinct real source JPEG byte identities** are now required in the P768 pre-inference cryptographic cohort registry and evaluation. Omitting any one is rejected. Renaming a photo cannot bypass exact source SHA.
- `research/mission1-visual-source-overlap-769/original-perceptual-ledger.mjs` also supports an **all-73 real-original multi-crop visual fingerprint history**, in addition to its old 65-source development replay. **Only `requireComplete73:true` is acceptable for a NEW prospective source preflight.** A legacy 65-image ledger must never be described as enough to exclude cropped/re-encoded versions of the eight newest photos.
- `scripts/mission1-73-source-review-774.mjs` builds the full seven-crop fingerprint ledger from three actual original-source directories (59, six, eight) **only after SHA-verifying ALL 73 actual JPEG bytes**. It refuses missing/altered sources and stores only hashes and fingerprint receipts. A separate local `screen` command reviews new candidates against all 73 and NEVER automatically approves unseen status, legal license or foundation-model pretraining absence.
- One source from P772, publisher image ID **10927**, was already visually flagged as possibly similar to an older one and remains separately **QUARANTINED** (P769 64-bit image difference hash distance 8). A similarity nonmatch is **not** a novelty or license proof.

### Human annotations that can truly be collected and signed

There is no independent human source trust unless real people actually do the work. P774 provides:

1. `research/mission1-reviewer-774/offline-photo-polygon-review.html` — a locally opened, responsive original-JPEG-only drawing interface. The reviewer opens a **pre-inference seal**, selects its registered source photograph, verifies its JPEG SHA-256 and exact dimensions in browser, manually traces each garment polygon in **original pixel coordinates** and enters **actual per-garment category, subtype and primary color**. Each reviewer sees NO previous answers, model results or peer annotations. Exports an **unsigned** manually created polygon JSON file locally without ever uploading a photo.
2. `research/mission1-reviewer-774/offline-human-polygon-receipt.mjs` — converts those manual polygons, including optional holes and disconnected parts, into source-size binary masks and the exact alternating run-length encoding required by P768/P771. Produces separate one-piece/mixed-outfit/explicit-negative human labels. Rejects oversized contours, invalid shape, missing source, duplicate local IDs, unsupported class/subtype/color and empty claimed garments. **It cannot invent polygons or a human identity**.
3. `scripts/sign-manual-human-review-774.mjs` — an actual externally enrolled reviewer uses their **own existing Ed25519 private key, locally** to sign the exact label, source hash and manually authored polygon digest. The trusted public key must be present in the pre-inference signed cohort registry. Role cannot be the coordinator, and the reviewer must explicitly attest to manual tracing, blindness to model predictions and independent work. The CLI does not create keys or reviewers or independently verify such statements. The signing key must have owner-only file permissions, and receipt output is local-only. A real third human adjudicator supplies a signed reason when two blind reviewers disagree.
4. P768/P770/P771 compare independent blind reviewer mask geometry without shared local instance IDs, and require exact per-instance category/subtype/color consensus or human adjudication. Original source SHA, before-inference enrollment, frozen model hash, complete prediction rows and owner review walls remain intact.

The P774 browser and cryptographic automated tests use clearly synthetic/fixture JPEGs and robot-supplied polygons **only to prove the interface and security invariants**. These are not to be counted as independently verified actual human garment ground truth.

### Practical offline use (after real people and image permissions are available)

- Register new licensed/consented original JPEGs and four distinct externally verified reviewer public keys into a prospective cohort. Before inference, use `node scripts/prospective-holdout-768.mjs seal ...`, ensuring exposure list includes all 73 and a pre-inference committed, coordinator-signed enrollment receipt.
- First build the full 73-source JPEG visual ledger with `node scripts/mission1-73-source-review-774.mjs build OLD59_DIR SIX_DIR EIGHT_DIR LEDGER.json`, then preflight each proposed new JPEG with `... screen LEDGER.json CANDIDATES.json NEW_DIR PRIVATE.json`. Manually review near-duplicates and source rights; clean perceptual matches are still only **unreviewed**.
- Each genuine reviewer opens `research/mission1-reviewer-774/offline-photo-polygon-review.html` independently, loads the exact registered image, traces every visible garment, exports their own `manual-source-polygons-*.json`, then signs through `node scripts/sign-manual-human-review-774.mjs SEAL.json REGISTERED_KEYS.json reviewerA PHOTO_ID ORIGINAL.jpg HUMAN_POLYGONS.json AFFIRMATION.json PRIVATE_KEY.pem RECEIPT.json`. Repeat for reviewerB and a separate adjudicator on disagreement.
- AFTER a separately verifiable pre-inference Git registration, execute the **unchanged** model on the genuinely untouched originals, save actual error/abstention as well as predictions to a later distinct commit, and audit with `node scripts/prospective-holdout-768.mjs audit ...`. Never tune against this cohort and reuse it as "unseen." Signed keys do not automatically prove different actual people.

### Unmet acceptance requirements — deliberately NOT claimed

| Requirement | Evidence | Status |
| --- | --- | --- |
| Unified P767 recognition research + P768–P773 source evaluation | Combined source files and dedicated complete CI | INTEGRATING/VERIFY |
| Genuine publisher polygons and real SegFormer browser metrics | Verified P772/P773 public artifacts | MEASURED; ACCURACY INSUFFICIENT |
| Frozen prior 73-development-photo exclusion including changed JPEGs | Exact SHAs pinned; optional 73-source decoded visual preflight | ENFORCED IN CODE; COMPLETE REAL VISUAL LEDGER REQUIRES ALL SOURCE BYTES |
| Two actual **independently audited human persons**, genuinely blinded, per-instance original-image source masks | Reviewer UI + signature tools exist; human signatures / independent identity audit NOT supplied | **BLOCKED — EXTERNAL HUMAN WORK** |
| New, unseen, legally cleared source photo corpus with independent training-exposure review | Historic/parallel development photos cannot qualify | **BLOCKED — ACTUAL RIGHTS AND SOURCE PROCUREMENT** |
| Reliable automatic category, subtype, color, segmentation, boundary and garment-instance accuracy for new photos | Existing real masks around 35% instance recall in small exposed development sample | **FAIL — MODEL QUALITY** |
| Camera → review → private owner closet, safe original photo attribution, two-user isolation on actual Android/iOS physical phones | Numerous isolated app/browser/owner-receipt paths; no independently audited end-to-end actual device acceptance here | **NOT PROVEN END-TO-END** |
| Mission 1 independent sign-off / Family Alpha release authorization | Issue #255 explicit HOLD | **NOT AUTHORIZED** |

**No fabricated two-human dataset, no fabricated accuracy percentage or sign-off, no automatic activation of extra garment masks or photo-to-3D.** The next credible technical work is actual segmentation/model training or better learned instance separation with independent rights-clear validation, not another synthetic mask-only passing test. Parallel #66 owns original photo annotation/segmentation research; P774 provides a concrete compatible evidence intake path and source-disjoint acceptance protocol. All changes remain DRAFT, UNMERGED, UNDEPLOYED.

## CI and handoff rule

The dedicated NO DEPLOY workflow must assert the exact pinned P767 parent, no shipping/public/Supabase changes, all full application/recognition research Node regressions plus new 73-source and cryptographic human-adapter unit tests, Python source selection tests, and actual Chromium/WebKit offline reviewer UI export/screenshots at 320px and 390px. **Passing these unit/browser tests proves the tools work, not that real humans or accepted recognition accuracy now exist**.

Never allow any result with missing external humans, real original photo permissions, independent source/model overlap review, zero-error owner-private mobile camera-to-save, or incomplete mask/category/color accuracy to return `missionOneCompleted:true`.

## P774 continuation — prevent cross-photo manual-annotation transplant

The existing exact sealed JPEG digest is now also checked against the unsigned polygon export's own `sourceId` and `sourceSHA256` before any actual reviewer Ed25519 signature can be produced. Missing fields, a different image ID or a changed SHA fail closed. This matters because a perfectly SHA-verified JPEG could previously be paired with polygons accidentally drawn on another original; the downstream signed receipt would then have been cryptographically valid yet semantically misbound. Current offline browser exports already include both identity fields. A negative adversarial test and a positive valid-fixture signing test document the fix. This is **integrity engineering**, not new actual human labels or a model accuracy improvement; all Family Alpha HOLD requirements remain.

## P776 review-only real-source component experiment

The P776 candidate explores whether previously merged **disconnected** masks of one semantic class are hiding separate visible garment pieces. It does not modify source logits or model weights, and every source pixel remains conserved; no automatic owner acceptance, 3D fitting or shipping app changes are allowed. The independent real-publisher-photo comparison runs actual unaltered SegFormer in both Chromium and WebKit on the **same eight already exposed P772 photos and 20 published human polygons**. See research/mission1-component-review-776/REPORT.md. Even a favorable diagnostic cannot count as a new untouched holdout or genuine two-human annotation. Physical-phone owner workflow, independent reviewer identities and approved source rights remain outstanding; HOLD #255 remains.

## P777 — frozen alternative semantic model on authentic previously exposed JPEGs

Following zero P776 component gain, the research-only CI runner independently compares an **actual larger clothes parsing model** rather than retuning a pixel heuristic: pinned `Xenova/segformer_b2_clothes` commit `cb6ac44e641faa309f29561c1afe08d87ef52631`, quantized ONNX (`q8`) against the original B0 fp32 model on the exact same eight publisher-labeled P772 **development** JPEG photos in Chromium and WebKit. Both outputs use the same existing 18-class taxonomy, original publisher 20 individual polygons, source SHA receipts, unchanged mask matcher, and explicit missing/false-positive counts. Independent source model pretraining overlap, originally licensed photographer source pages, actual two-human reviewer identity, exact subtype/color ground truth and mobile production performance remain **unverified**. B2's upstream model card currently identifies its license as **other**: this experimental model is NOT commercially cleared, not a product recommendation and must never be merged, shipped, saved as an automatically accepted garment or deployed without explicit independent license and independent heldout review. An improvement on exposed development photos is not a mission pass; negative or failed comparisons must be retained, not hidden.

## P778 — cross-cohort B0/B2 comparison on earlier genuinely published human masks

A second NO DEPLOY real-browser experiment tests **both** frozen B0 and exact pinned B2 against the earlier **six** SHA-verified Fashionpedia/Pexels original publisher JPEGs containing **16** pre-existing human garment polygons. Both browsers and both model variants score the same 6×16 source data, with full false positives, missing predictions, semantic region IoU, and review-only seeded proposal matching. These six photos are previously exposed P66/P767 development evidence, NOT a new independent heldout, not novel model-training-disjoint images and not signed, genuinely blinded two-person annotation. The B2 model remains licensing-uncleared, unadopted and undeployed. Even improved accuracy on 14 development photos cannot qualify as Mission 1 acceptance.
