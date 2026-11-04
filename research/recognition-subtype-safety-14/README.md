# RECOGNITION-SUBTYPE-SAFETY-14 — draft research only

Parent PR570 exact SHA d60c9fbc725d01ac991c6ab4b476971a9531ead4. Family Alpha #255 HOLD. NEVER merge, deploy or modify production.

## Verified root cause and baseline
FashionCLIP branch, overall and confirmation views share the same pretrained model. High normalized scores and view agreement are correlated and **not calibrated truth**. Three confident wrong automatic types (T-shirt as Sweatshirt, Blouse as Tunic, high-top Sneakers as Ankle boots) were verified by actual licensed-photo inference; this is not specific-photo exception logic. Prior actual original-photo results: broad category 8/13, correct automatically accepted subtype 4/13, incorrect automatically accepted subtype 3/13, accepted 7/13, category review 1, abstention 5, negatives rejected 3/3, model errors 0.

## New safety boundary
All typed automatic recognition results including recovery and isolated garments pass a generalized broad-category subtype challenge before the worker signals an identified result. The entire existing subtype family and negative prompts are compared over 336, 320 and 288 pixel source-preserving frames; a near-original full source view provides a contradiction veto. Tops and shoes require stronger evidence uniformly across their subtype groups. Missing scorer, failed model, weak vote, ambiguity, or conflicting subtype leads to review; if the broad category is consistent, review shows Unknown subtype and actual catalogue subtype choices, otherwise abstains. No guessed color, sleeve or pattern is accepted from an uncertain identity. Original photograph, source SHA-256, manual owner corrections and private wardrobe/outfit/3D paths remain untouched.

All image views still use the SAME pretrained model. There is no claim of independent model corroboration, calibrated confidence, new learned high-top sneaker class, or automatic 3D fitting.

## Actual acceptance evidence
Unchanged frozen 16-photo sample (13 real garments, 3 negatives); separate disjoint development 11 and 32 human-reviewed licensed original examples; SHA-locked original downloads; real local-worker FashionCLIP browser inference. Full inherited Node suite, owner-private multiple garment/Style integrations and Chromium/WebKit screenshot testing at 320, 390 and 430. Archive only metrics and licensed test screenshots, not original customer or family images. Rerun and inspect after final commit.

Quality gate: zero incorrectly auto-accepted subtypes, zero non-clothing false positives, zero runtime errors, and useful correct automatic coverage. Green infrastructure CI alone never establishes model accuracy. No verified color ground truth is available, so COLOR ACCURACY NOT MEASURED. Real signed Supabase RLS, physical Android/iPhone, automatic multi-garment segmentation accuracy, distinct 15-photo 2D fit QA and arbitrary 3D reconstruction remain HOLD.
