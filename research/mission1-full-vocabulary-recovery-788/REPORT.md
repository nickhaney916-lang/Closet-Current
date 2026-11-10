# Closet Current — Mission 1 P788: full-vocabulary corroboration for recovery

**Engineering scope:** eliminate false subtype promotion from prompt-set-forced category agreement in the native on-device FashionCLIP recognition fallback. **DRAFT / UNMERGED / UNDEPLOYED; FAMILY ALPHA HOLD #255.** P788 is isolated on verified P786 HEAD `8de4c954e54e2ab2015a5b7a3d8c2af3ff226bdd`; the separate parallel P787 work is not edited.

## Why this matters

`recognizeWithRecovery` had two stronger-than-justified `strong:true` branches. For weak Bottoms (e.g. skirt/shorts/jeans) or a disputed skirt-vs-dress category, it asked two image views to choose among **only Bottoms** or **only Bottoms plus Dresses plus negative prompts**. Even two agreement votes in this limited set can classify a top, coat or other excluded garment as Bottoms. These logits are normalized **relative to the subset of labels**, so a narrow high score is not independent full-catalog confirmation. The original skirt/dress branch returned early before its later full-catalog diagnostics ran.

## Implemented corrective behavior

- Source change only in `public/recognition-engine.mjs`: the two affected fallback branches may gather narrow proposal votes, but now require **two additional independently evaluated full-catalog views** before raising `strong:true` or emitting `onIdentified`.
- Both unmodified whole catalog and independently framed full-catalog model outputs must contain every registered `localCandidates` label **exactly once**, valid finite normalized probabilities and a score sum of one. Incomplete, duplicate, missing or misnormalized pseudo-confidence cannot masquerade as independent corroboration.
- Both complete views must choose the **same exact subtype and category** as the narrow proposal, show sufficient top-type margin, and separately show the category winning the summed all-clothing-family confidence by a wide margin. Bottoms requires category total ≥0.70 and ≥0.35 above the next; skirt/dress ≥0.70 and ≥0.40 above the next. Thresholds are conservative gates, **not accuracy-calibrated probabilities**.
- Any complete-vocabulary contradiction leaves the unchanged **uncertain** recognition result, no `onIdentified`, no automatic recognition subtype, and a `bottomsFullCatalogVeto` or `skirtDressFullCatalogVeto` diagnostic. Existing actual owner photo and Adjust are retained.
- Six adversarial **synthetic mathematical-score** cases: two narrow false-Jeans vs full top, true full-Jeans, incomplete model response, two narrow false-Skirt vs full top, true full-Skirt, and one dissenting full-catalog view. These tests prove the decision rule, **not** new real-image accuracy.
- No new model weights, service, API or business logic outside recognition decision gating. Original image remains preserved and 3D/photo pipelines are unchanged.

## Required independent checks

A dedicated NO DEPLOY workflow `.github/workflows/mission1-full-vocabulary-recovery-788-no-deploy.yml` asserts direct parent SHA, **four approved paths only**, node build, entire Node test suite including the six adversarial checks, and **actual immutable B0 SegFormer on the real pinned CC BY 4.0 dress** through Chromium and WebKit native review and owner-local IndexedDB research. This real-photo path still has simulated human selection; it does not demonstrate automatic recognized subtype, color, independent blind human accuracy or hosted owner/private-cloud phone tests.

**No general guarantee the existing classifier can accurately recognize garments.** Additional full-catalog passes may increase CPU latency and increase manual review; this is a fail-closed category-safety change, not a measured segmentation/accuracy improvement. The external P786/P787 instance model failed actual published masks and remains licensing-uncleared. Prospective untouched photo rights, two independent actual humans, subtype/color/instance criteria and real devices still block full Mission 1 completion and Family Alpha release.
