# Source-locked recognition safety follow-up — October 23, 2026

Base: issue #211 / draft PR #213 exact `33744dc0900fcb0cc2d014510e22fa03c2a96637`.
New branch: `work/recognition-subtype-safety-20261023`, targeting #213, not main.
PR #214's independent comparator is read from exact
`d499d0583cf989e6af5d34a4992526895425e1f9` during CI, never altered.

## Defect and safe fix

A high-confidence single-category mask hint could override negative-only model
results. Before: `classifyIsolatedGarment` with .99 shoe mask, .70 wall + .27 pet
+ .03 sneaker returned strong=true / Shoes / Unknown. Empty model outputs could
also become a strong hinted Dress/Bottoms category. This is a false recognition
signal even though current app type guards can independently prevent saving
Unknown types. No assertion of an actual customer auto-save incident.

The candidate rejects strong nonclothing evidence from EITHER view and absent
clothing evidence. It also removes mask-confidence-only category authority:
both full-catalog views AND both broad-vocabulary category gates must support
the proposed category. Existing .55/.15 full-catalog and .45/.15 broad gates
are unchanged; no learned thresholds, labels, model weights or prompts change. No
fabricated subtype correction. Normal unhinted garment recognition is unchanged.
Two previous unit assertions expected strong Bottoms from negative-only or
unrelated uncertain scores; both are strengthened to require rejection. Accuracy manifests and
regression thresholds remain byte-identical. Negative contracts fail on baseline; valid shoe agreement and classifier-supported
broad shoe category remain accepted. The stricter rule may reduce automatic
coverage on real uncertain masked garments; that tradeoff is not measured without
independent human masks and is a central integration decision.

## Original-photo integrity and independent measurement

The legacy benchmark decodes every original, caps it at 2048px and recompresses
to JPEG .94 before classification. Its original file hash does not prove those
were the bytes sent to inference. Prior #213 results remain valid for that legacy
pipeline, not a native-source inference claim.

New `run-source-locked-recognition.mjs` validates 59 licensed fixture SHA-256s,
passes the original JPEG bytes directly as data URLs, records decoded native
stored dimensions and hashes before/after, and runs baseline/candidate engines
on identical inputs. It warms the existing pinned model/runtime before denying
all remote network requests; no API key or paid provider is involved. Post-warmup
requests and unhinted result equality are asserted. This is full STORED fixture
resolution, not proof of native camera originals or unprocessed camera capture.
Three nonclothing controls also receive intentionally false .99 Shoes hints;
these are adversarial test hints, NOT reviewed physical masks.

Seven fixed error/abstention scenes receive padding diagnostics at 288/320/336,
including sneakers vs ankle boots, dress ambiguity and skirts. Diagnostics never
change recognition decisions. The historical cohorts were already inspected;
none is newly untouched validation. Source-locked outcomes and legacy outcomes
must be reported separately, never attributed to a causal model improvement.

## Validation and release limits

Local focused contracts: 13/13 pass. Final full Node counts are recorded in the
issue/PR after exact-head verification. Initial two full local Node runs each 1788 pass,
0 fail, 0 skip, using only bundled licensed fixtures and simulations. Exact-head
CI runs full suite twice, synthetic Chromium/WebKit contracts and original-image
handling, and source-locked real Chromium inference before applying unchanged
independent admission and PR214 comparison rules. See draft PR/issue for final
exact SHA, CI links and per-source results; queued jobs are not passes.

No physical mask IoU, segmentation recall, true object separation/false-positive
rates, independent color accuracy, device fidelity, customer accuracy or faithful
multi-item try-on is claimed. These require human-reviewed inventory/masks and
real devices. No new human annotations, customer files, threshold relaxation,
production/cloud changes, merge, deploy, provider activation, spending or Drive
Duel. Main conversation owns integration and release.

## Failed intermediate experiment retained

Run 39957251137 at intermediate `cb8316d502ee361b0a72954234138fa2782136e9`
ran all source-locked baseline/candidate inferences with identical ordinary
predictions, then FAILED the unchanged zero-false-hint assertion: one control
still admitted. Artifact 12502539141 retains the six ordinary result arrays.
The partial implementation was not declared complete. The next revision removes
mask-confidence-only authority and requires the ordinary broad category gates
on both views; the zero-false-hint assertion is unchanged. Diagnostic reports are
now written before that assertion so a future failure retains the exact source ID.
No accuracy labels or expected wrong subtype lists were changed.

Independent scoring of the intermediate direct-original observations (not the
legacy recompressed stream): reviewed 29/32 categories, holdout 7/13 garments,
fresh 11/11; nine category abstentions and three wrong automatic subtypes.
This difference is a source-pipeline measurement, NOT a model improvement or a
promotion recommendation. Source-locked and legacy results must not be pooled.

## Verified final application behavior

[Application-head CI 39958489407](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39958489407)
SUCCESS at `c30d402babf8dd62b0b0282dba9579ae6e0da24e`: two full Node runs each
1791 PASS / 0 FAIL / 0 SKIP; updated synthetic Chromium/WebKit mask contracts,
masked-original color and native-resolution import/account-switch tests PASS.
All 59 original JPEG byte streams hash-match; zero re-encodes, zero post-warmup
remote requests. All 59 ordinary baseline/candidate prediction rows match
exactly. All three intentionally false shoe hints (0046,0086,0090) changed from
strong Shoes/Unknown under baseline to rejected under candidate. This is an
adversarial hint test, NOT a physical mask accuracy metric. Artifact 12503668083
ZIP SHA-256 `1ee1dcc83a3a6f89abfc945dddf8db2703e782efe9983a8c06c5ee3af863555d`.
Complete JSON evidence is preserved in `SOURCE-LOCKED-RESULTS-20261023.json`.

| Same reused source cohort | Direct original bytes: correct broad category | Legacy recompressed stream: correct broad category |
|---|---:|---:|
| Reviewed | 29/32 | 32/32 |
| Existing holdout clothing | 7/13 | 8/13 |
| Existing fresh | 11/11 | 11/11 |
| Total clothing | 47/56 (83.93%) | 51/56 (91.07%) |

Direct-original stream: nine category abstentions; 43 automatic decisions with
three incorrect subtypes (6.98%): 0064 Jacket→Blazer, 0014 Blouse→Tunic,
0078 Sneakers→Ankle boots. Three nonclothing controls rejected in ordinary mode.
The T-shirt 0003 now needs subtype review on direct originals; this is NOT a
corrected T-shirt prediction. Legacy stream still has all four previously known
subtype errors, independently reproduced in run 39956298733. Different input
preprocessing must not be pooled or described as a gain caused by this patch.
PR214's unchanged comparator finds zero regressions versus its locked historical
observations, but independently measured unsafe subtypes keep admission BLOCKED.

Padding diagnostics, top labels at 288/320/336 respectively:
- 0078: Ankle boots / Ankle boots / Ankle boots (wrong sneaker subtype persists).
- 0064: Blazer / Blazer / Blazer (wrong jacket subtype persists).
- 0014: Tunic / Tunic / Tunic (wrong blouse subtype persists).
- 0003: Sweatshirt / Sweatshirt / Sweatshirt (ordinary decision stays review).
- 0036: Blouse / Hat / Skirt (unstable skirt; abstain).
- 0059: Tunic / Blouse / Formal dress (unstable dress; abstain).
- 0095: Sneakers / nonclothing hand / nonclothing hand (unstable boots; abstain).
No frame was selected or threshold tuned to make the reviewed answer win.
No new untouched validation set was created; these reused-source diagnostics
cannot establish general accuracy, true multi-item recall, pixel mask quality,
independent color correctness or physical-phone fidelity.

Avatar research additionally identifies a commercial blocker in FASHN's standard
human-parser dependency: its documented inherited SegFormer license restricts
non-NVIDIA use to noncommercial research/evaluation. See the source-backed
license addendum; no unlicensed weights were downloaded or service activated.
Final report-only / CI setup commits, if present, must be distinguished from the
exact application head above; current branch app pixels and rules remain pinned.
