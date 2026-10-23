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
clothing evidence before mask fallback. Uses existing .55 confidence and .15
margin gates; no new learned thresholds, labels, model weights or prompts. No
fabricated subtype correction. Normal unhinted garment recognition is unchanged.
A previous unit test explicitly expected strong Bottoms from negative-only scores;
that assertion is strengthened to require rejection. Accuracy manifests and
regression thresholds remain byte-identical. Four new negative contract cases
fail on baseline; valid shoe agreement remains accepted.

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

Local focused contracts: 10/10 pass. Two full local Node runs each 1788 pass,
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
