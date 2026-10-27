# Work 37 — landmark feasibility spike, HOLD

This is an **incomplete research spike**, not a garment renderer or a Family Alpha integration. It proposes a conservative single rigid transform from manually reviewed landmark pairs, with an independent third landmark as a mismatch guard. It rejects missing review, large scale/rotation, poor third-landmark agreement, and frame clipping, returning a clearly labeled original-cutout fallback. The numeric limits are exploratory, not visually validated or guarantees of realism. The function never handles image bytes, creates masks, performs occlusion or changes the existing app.

## Evidence and constraints

- Candidate #333 head `7cde76dc8c96d9382e8dfc4b37451cfd28379db5`: manual proportional placement of the real dress improved neck clearance but remained flat and unapproved.
- Research #327 head `a7578781d885109e86934543e3c8d3be3cfbf5ec`: the 6% taper did not consistently improve synthetic examples; its conclusions cannot establish real-photo fit. This spike does not apply that taper.
- Licensed gallery #329 head `53f2ad344dc56a1477e343531c423aed0e66c17d`: seven rendered provisional cutouts; long-sleeve shirt #0003, jacket #0065, pants #0021 and skirt #0043 have no cutout. The photo blouse #0016 was REVIEW; shirt #0001 and dress #0053 FAIL in that gallery. Those are prior gallery grades, not grades of this unrendered spike. The revised dress mask in #332 is still a human-proposed cleanup, not owner approved.

A single 2D similarity transform cannot bend sleeves along elbows, separate trouser legs, infer hidden fabric, resolve open jacket overlap, or simulate drape. Hand/arm occlusion requires reliable reviewed garment parts and body depth masks; incorrect occlusion can erase real details. A possible next experiment is a human-reviewed, source-bound segmented mesh with protected details, seam checks and explicit per-item original-preview fallback. It requires usable licensed cutouts and visual comparison before any integration. No fabric invention or claims of physical simulation.

## Validation and missing work

`node --test tests/research37/*.test.mjs` exercises input preservation, fallback and geometry bounds. It does not validate visual improvement, browser compatibility, image quality, privacy, wardrobe functionality, or account isolation. No new real-photo screenshots, A/B/C comparisons, 320/390/430 Chromium/WebKit tests or full offline workflow have been produced. No garment receives a PASS from this spike. Existing #333 exact-head tests remain evidence for that unchanged candidate only, not for this spike.

Family Alpha remains HOLD. Do not integrate or deploy this spike without reviewed cutouts, image-bound annotations, a renderer, real-photo visual evidence, the requested browser/workflow regression matrix and owner review.
