# Assignment 10: diverse owned-clothing recommendations

Separate development branch from PR #220 `0f62e253c1fd0024a939cd401710dcd3784a9e77`. Reviewed #231/#245/#250, #201/#204, and #240/#242. Existing #242 is a standalone lifecycle QA module and remains untouched. No 3D renderer/browser fixture, recognition or backend code changes.

## Implementation

The engine previously bounded each slot to its first eight ranked records. A closet with many similar black jeans could crowd out other compatible bottoms. Final core-ID variation could then present three different jean records with the same visible attributes.

The bounded shortlist now preserves distinct recorded category/type/color/pattern/material descriptions before filling duplicate descriptions. It stays within eight ranking points of the best item while selecting feature representatives, retains the same shortlist size and dress/separates partition, and then fills remaining capacity. Final selection preserves structural choice and differing core garment IDs, then maximizes the minimum recorded appearance distance from existing selections within an eight-point quality window. Top/bottom types and colors carry more weight than footwear/layer variation. Deterministic signature ties prevent record ordering from changing results. Near-identical options remain possible in sparse wardrobes and receive a limited-variation notice; nothing is invented to pad results.

Recorded occasion tags (Casual/Work/Dinner/Active) add modest context preference. Wool/fleece and linen receive small season-dependent heuristic adjustments. Unknown/free-text metadata is neutral; known season exclusions and explicit pins retain existing behavior. These are transparent metadata heuristics, not physical comfort or taste accuracy. Color still comes from the existing saved record/original-photo indexing path; this change does not infer colors from photos or claim recognition accuracy. Existing estimated-color notices remain.

Prepared-source snapshots now include recorded material and occasion, so an edit invalidates recommendations just as existing original-byte/source-identity, color, category and seasonal changes do. Existing duplicate-ID rejection, photo checks, caller-scoped ownership, persisted anchor pins, one-piece swaps and save guards are preserved. Client owner fields do not replace authenticated storage or the existing database/session boundary.

## Independent synthetic comparison

The exact #220 engine is stored only as an offline QA reference at `benchmark/assignment10-baseline/closet-stylist-engine.js`, SHA-256 `b1ab9d2323d163e2cff5cd1166214c57edb02225d3126260d8eceb4594fd24ec`. The comparison checks this digest and runs without Git history or network. Production does not load the reference.

The fixture has one pinned new top, nine nearly identical black jeans, distinct trousers/skirt alternatives, and three matching shoes. An independent visible-type/color/pattern oracle deliberately ignores record IDs and material:

| Measure | Exact baseline | Candidate |
| --- | --- | --- |
| Complete recommendations | 3 | 3 |
| Visibly distinct metadata combinations | 1 | 3 |
| Scores in existing engine units | 52.5 / 52.5 / 52.5 | 52.5 / 51.5 / 49.5 |
| New top retained in all looks | yes | yes |

This is one adversarial synthetic wardrobe, not a user preference study. Synthetic 2×2 JPEG swatches exercise source records; they are not actual garment recognition or visual try-on evidence. All source records/strings remain unchanged.

## Verification and limits

Local full root suite: **1,805 pass / 0 fail / 3 skip**, including seven new tests. The three existing skips require a licensed pilot photograph downloaded only in dedicated pilot CI; it was not fetched for this synthetic-only assignment. The unchanged independent #201/#204 product gate passes **22/22**. An early candidate violated the existing bottom-before-shoe variation test; implementation was corrected without altering that test or benchmark.

New tests cover the baseline comparison, reversed-input determinism, one-slot swaps and serialized pin preservation, deleted/duplicate/invalid/foreign anchors, contextual preference, metadata/original-only invalidation, sparse closets and dress exclusions. Final exact-head CI results are reported in the draft PR and issue #240.

CI runs the full Node suite, locked product gate, original real-app synthetic Chromium/WebKit 390px journeys, plus six engine-only browser contexts at 320/390/430. The latter test cross-engine deterministic generation, visual-metadata diversity, pin/swap constraints, source immutability and duplicate/foreign rejection, with a 500-record synthetic timing measurement. They do not test rendered mobile UI; the unchanged full-app browser script does. No physical device or real account is used.

Integration requires main-chat review against its current candidate; this branch does not integrate the separate #242 lifecycle module or change saved-outfit schemas. Existing UI/session guards and locked benchmark cover source invalidation and saved-pin restoration, but broader multi-pin integration remains owned by the lifecycle track. Metadata quality, garment comfort, human preferences and genuine photo color correctness remain unmeasured. No new interface controls, paid services, customer data, deployment, production/cloud changes or Drive Duel modifications.
