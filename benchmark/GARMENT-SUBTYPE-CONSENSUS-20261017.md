# Garment subtype decision gate — October 17, 2026

**Why:** Real eight-photo comparisons showed extra semantic garment classes and failed to detect the jacket in a dress-and-jacket source. SegFormer assigns the same class 4 to tops and outerwear, and class 6 to shorts/pants. Reusing one mask for two catalog entries would create false inventory.

**New experimental gate:** `benchmark/garment-subtype-consensus.mjs`. Requires a SHA-256 photo identity, a valid semantic class, two independent framings, catalog-category/type agreement, minimum per-view score and margin. Any weak/contradictory or wrong-source input becomes a review candidate without an item type. Matching types are tentative *subtype candidates*, never proof of separate physical garment instances.

**No false layering:** `reconcileOutfitInstances` refuses two garment entries from one semantic region even if both predictions are confident. Distinct masks can be *candidate regions* but do not count as verified instance separation. The current local recognition engine uses whole/confirmation CLIP views, so this gate can later consume real evidence; this PR does not wire it to production.

**Evaluation limits:** Deterministic unit tests check decision rules, not measured accuracy. The eight-photo model benchmark is maintained separately; the garment labels in that benchmark cannot be inserted as AI classification results. We need actual on-phone and held-out photo recognition/instance mask measurements before integration.

User workflow stays one click, no new manual tabs. Preserve original full-quality photos, never auto-save uncertain wardrobe duplicates. Drive Duel untouched.
