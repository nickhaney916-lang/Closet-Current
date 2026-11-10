# Closet Current — Mission 1 P791: cryptographic human-truth taxonomy/instance integrity

**Source base:** P790 exact independently verified HEAD `b4634800663f88591da0033f4162049c3cbaf381`. **Research-only, DRAFT, UNMERGED, UNDEPLOYED, Family Alpha HOLD #255**. No model weights, shipping public recognition, signed account, cloud, private user JPEGs, physical device or deployment modified.

## Critical measurement defect fixed

The P768 prospective human ground-truth scorer previously allowed a **cryptographically valid signed photo-level label** of `Tops / Blouse` to contain:
- multiple separate source-pixel mask instances (two blouses represented as **one** recognized garment);
- a **contradictory instance category** (`label.category='Tops'`, but actual source mask `instance.category='Shoes'`);
- an **unsupported or invented subtype** (not represented in the native `localCandidates` catalog);
- for mixed photos, arbitrary per-instance subtype names that cannot actually be saved.

This is genuine acceptance evidence integrity, not a model learning defect. These contradictory receipts could previously inflate or confuse model-level subtype and mask scores despite passing cryptographic signature verification. Neither real human identity nor photo truth is proven by any Ed25519 key.

## Complete corrective implementation

- `research/mission1-human-truth-taxonomy-integrity-791/canonical-human-truth.mjs` derives the **exact supported category/subtype set** from unchanged `public/local-catalog.mjs`. It excludes `Uncategorized`, placeholder `Unknown` and unreviewable `Other`; includes valid `Accessories` such as Hat/Bag. No parallel hardcoded subtype source.
- `research/mission1-sealed-human-holdout-768/prospective-gate.mjs`: AFTER cryptographically verifying two independently keyed source-review receipts, a **single-photo label must contain EXACTLY ONE** source-pixel mask instance whose category matches the top-level category, with a supported specific app subtype. Two or more garments **must** use `Multiple` with individual labels and masks, which the P771 evaluator already supports. No silent fallback, masked truth retyping, source rerasterization, or scoring of mismatched human truth.
- `research/mission1-mixed-outfit-771/garment-instance-contract.mjs`: every separately human-labeled garment in `Multiple` must have a supported category/subtype from the native catalog; no invented class or placeholder can be treated as truth.
- `research/mission1-reviewer-774/offline-human-polygon-receipt.mjs`: actual manual annotation signing path now applies that SAME catalog at source, so it cannot emit a cryptographically valid but evaluator-rejected `Other` subtype. It can sign Accessories including Hat.
- Adversarial synthetic **signatures, source masks and exact-app taxonomy tests** now reject misleading cases, and preserve valid single, mixed, accessories, and negative source behavior. The older unit test that claimed two blobs as a single Blouse was corrected to assert a failure. Two-source synthetic fixtures are **NOT actual independent reviewers or real garment photographs**.

## Engineering acceptance vs. real mission blockers

The strict no-deploy workflow checks exactly nine approved research/test/CI paths from the pinned P790 parent, complete native/recognition/3D/cloud Node regressions, original B0 CC BY 4.0 dress in Chromium/WebKit plus actual native manual Adjust→private owner-local IndexedDB from earlier research flow. Real AI still does not identify exact dress subtype/owner color autonomously.

**End-to-end Mission 1 is NOT complete.** Missing evidence remains: a truly *new*, legally cleared, pre-enrolled and externally witnessed source cohort; two separately verified truly blind human annotators, genuine human-drawn source masks with primary colors and subtypes; independent untouched photo accuracy improvement (the P786 alternate instance model was only 4/16 TP with 21 FP/12 FN on exposed publisher masks); two physically real Android/iPhone phones and two hosted signed users with protected cloud recovery/RLS; explicit owner review and release authorization. Source SHA or reviewer key signatures alone are not proofs of these facts. This PR never authorizes adoption, deployment, Family Alpha or an automatic owner save.

## Exact-head GitHub Actions result

To be recorded in PR only after final job completion and verified commit SHA. The no-deploy workflow measures engineering integrity and genuine original-photo browser regression; it cannot certify what the external human/physical tests have not supplied.
