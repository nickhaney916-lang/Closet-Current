# Work48 visual result — Family Alpha HOLD

**PASS 0 / REVIEW 5 / FAIL 10. No grade promotions and no owner approval.** The implementation produces visible positioning changes; it does not establish realistic cloth drape or accepted virtual try-on.

## Functioning changes

- Exclusive sleeve polygons and a torso complement replace the blouse's overlapping/incomplete source partitions. Rigid rotation uses reviewed shoulder pivots; shoulder and underarm contact are checked against the actual rasterized torso before replacing the current view.
- Five source profiles adjust garment proportions and attachment. The long-sleeve shirt gains shoulder/upper-arm coverage; the skirt waistband moves from y306 to y286 in the unchanged 360×600 humanoid; the dress and printed shirt use slightly broader proportional fits.
- Native controls provide proportional width/length, shoulder tilt, horizontal position and vertical/hem alignment. Hem alignment moves the whole garment. Users can trace each source sleeve, starting at its shoulder attachment and finishing at the underarm, then rotate it independently. Invalid joins or source outlines are refused while the previous rendering remains available.
- PR361's original sampled coverage floor and frame bounds remain. New exclusive traces additionally require ≥99.5% sampled coverage and ≤0.3% duplicate assignment. These are defensive geometry limits, not fidelity approval.
- PR362's existing anatomy paths and PR363's alpha-only edge helper remain source-identical. A temporary inverse garment-alpha mask prevents neck skin from covering opaque collar fabric. The face and hands retain their existing foreground paths. A face-collision check rejects fabric overlap rather than concealing a print behind the face.
- The original JPEG, reviewed PNG, recognition/indexing, wardrobe data and favorites are not rewritten. Fitting state is volatile and guarded by the current user/session/source. Reset, view replacement, pagehide and account changes discard it.

## Measured blouse comparison

Same immutable cutout, edge cleanup OFF, same 240px-longest-side alpha sample, same existing humanoid. Source assignment measures alpha ≥128. Cuff targets are manually annotated forearm reference points, not independent anatomical ground truth. Contact distances are nearest opaque torso pixels around the transformed joint in the 360×600 display raster.

| Measurement | Previous PR363 fit | Work48 fit |
| --- | ---: | ---: |
| Sampled opaque source pixels | 32,061 | 32,061 |
| Assigned at least once | 30,235 (94.30%) | 32,061 (100%) |
| Assigned to multiple source panels | 1,156 (3.61%) | 0 |
| Mean annotated cuff error | 19.51 px | 5.79 px |
| New shoulder contact residual | — | 0.80 px each |
| New underarm contact residual | — | 0.09 px each |

The source assignment gain uses fabric already present in the cutout. It does not reconstruct unseen fabric. All pieces use rotation/translation and **uniform** scale; no independent horizontal stretch, motif warp, recoloring or invented texture. Projected sleeve/torso overlap remains a flat 2D occlusion approximation.

## Fifteen-photo assessment

Assistant inspection of actual rendered original/cutout/before/after panels and shoulder/underarm/waist close-ups. All five supported profiles remain REVIEW; ten other sources retain original-photo fallback. The benchmark cutouts remain provisional, not owner-approved masks. Unsupported rows explicitly show unavailability or reference-only status.

| ID | Garment | Grade | Before → after / remaining limit |
| --- | --- | --- | --- |
| commons-0001 | Printed shirt | REVIEW | Slightly broader source-proportional fit; original print preserved. Hanging source pose, collar and fine edges remain uncertain. |
| commons-0003 | Long-sleeve shirt | REVIEW | Broader shoulder/upper-arm coverage; neck no longer painted over opaque collar. Cuff angle, manual mask edges and cloth folds remain unapproved. |
| commons-0065 | Jacket | FAIL | Clipped source sleeves and no reliable isolated cutout. Original fallback unchanged. |
| commons-0068 | Coat | FAIL | Back-facing source and complex surroundings. No fabricated front view. |
| commons-0053 | Dress | REVIEW | Slightly broader fit improves chest/shoulder contact and preserves logos proportionally. Armhole fringe and side silhouette still need review. |
| commons-0043 | Skirt | REVIEW | Waistband raised 20 avatar pixels and width scaled proportionally. Pale hem fringe and wearer-specific fit remain uncertain. |
| commons-0033 | Shorts | FAIL | Hands/shirt/legs obscure garment; no invented material. |
| commons-0021 | Jeans/pants | FAIL | Occluded waist and missing trustworthy cutout. Original fallback unchanged. |
| commons-0082 | Sneaker | FAIL | One side-view shoe remains a reference; no fabricated pair. |
| commons-0088 | Boot | FAIL | Single boot perspective remains reference-only. |
| commons-0016 | Blouse/tunic | REVIEW | Missing/duplicated source-panel regions removed; cuffs move toward forearms and source-continuous shoulder/underarm joins are checked. Loose tunic shape, sleeve/torso occlusion and fine embroidery joins remain unapproved. |
| commons-0079 | Sneaker in surroundings | FAIL | Support/background contamination and single-shoe view; original fallback. |
| commons-0089 | Boot | FAIL | Single shoe remains reference-only. |
| commons-0094 | Lace-up boot | FAIL | Single side view remains reference-only. |
| commons-0059 | Dress | FAIL | Clipped fabric/clutter and no reliable complete cutout. Original fallback unchanged. |

## Verification and boundaries

The no-deploy workflow builds the actual protected app, runs inherited source/private storage/session, original-photo, coverage, anatomy and edge regressions, then exercises the new fitting controls and manual sleeve tracing. A separate licensed app journey covers three recommendations, swaps, favorites, save/reload, mobile control reachability and twelve storage fault probes. Browser Auth/cloud/classifier responses are synthetic; no real accounts or provider configuration is changed.

The visual matrix is **15 × Chromium/WebKit × 320/390/430 = 90 comparisons**, with full pages and attachment/waist close-ups. It checks exact reset restoration, optional edge ON/OFF restoration, refusal of detached sleeves and fabric-on-face poses, correct fallback source clearing, and no external requests. Green checks do not change visual grades. CI and exact-head screenshot artifact links are recorded in draft PR366 and issue255 after completion.

Remaining: manual annotation dependence; imperfect alpha edges and source pose; no physical cloth drape, full underarm self-occlusion or fit to individual body measurements; occluded pants/shorts, clipped jackets/dresses, back-view coats and missing shoe pairs; no persistent geometry in favorites; no physical phone or live four-account/RLS validation. Independent width/length stretching is intentionally unavailable because it would distort prints. Sleeve length can change only with proportional garment scaling or a different reviewed source; there is no fabricated sleeve extension.

No merge, deployment, production/staging/provider changes, private family photographs, new accounts, paid service activation, spending or Drive Duel changes. **Family Alpha HOLD.**
