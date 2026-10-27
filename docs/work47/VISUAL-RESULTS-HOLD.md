# Work47 real clothing on the existing 2D humanoid

Family Alpha remains **HOLD**. This is a functional offline fitting prototype and a visual-development improvement, not completed realistic virtual try-on or an owner-approved release.

## What now works

Actual licensed JPEG pixels become separate transparent derivatives. Two human-marked source shoulders or waistband corners drive uniform scale/rotation onto the unchanged articulated humanoid. The blouse additionally uses manually calibrated rigid sleeve panels. Original fabric RGB is copied unchanged into native cutouts; the display renderer resamples it. It never synthesizes textures, fills occluded fabric or duplicates shoes.

The protected offline app exposes **Review garment fit** after the existing authenticated saved-photo boundary and explicit cutout review. Users can mark source landmarks, apply fit, move, resize and reset. Original-photo outfit boards, three recommendations, Style My New Clothes, swaps, favorites, atomic rollback and mobile navigation remain in place. Temporary fitting is not saved with favorites. Account/session changes and removed outfit views dispose of temporary sources and canvases.

Source: independent branch `research/work47-garment-fit`, stacked on PR358 at `ba55bf7ede6c621ae6e012004b67aa2f8c6e4339`. PR349 source ownership, Work35 cutout review, Work36/40 adjustments, Work38 skirt outline and the existing humanoid are reused. The parent asset comparison permits only offline UI/boot edits and two new fitting modules. Public production sources and all provider settings are untouched.

## Visual assessment

Assessment by the assistant from rendered Chromium and WebKit browser screenshots, with detailed inspection of the five rendered candidates and fallback cases. No owner approval, independent mask ground truth or physical phone evidence. The grade is for **worn-avatar acceptance**, not for the usefulness of a standalone source photograph.

**15 originals; 9 provisional transparent derivatives; 6 unavailable derivatives; 5 fitted candidates; 10 worn-avatar fallbacks. PASS 0 / REVIEW 5 / FAIL 10.** The previous frozen assessment was PASS 0 / REVIEW 1 / FAIL 14. Improvement in a review grade does not establish release readiness.

| ID | Garment | Current grade | Observed result / limitation |
| --- | --- | --- | --- |
| commons-0001 | Printed shirt | REVIEW | Hanger/stand cleanup and shoulder placement improve the worn silhouette. Oversized source pose and collar/edge completeness still need review. |
| commons-0003 | Long-sleeve shirt | REVIEW | New manually traced garment excludes the mannequin and jeans. Shoulder/hem placement is usable for inspection; sleeve seams, cuff openings and fabric-edge loss are unapproved. |
| commons-0065 | Jacket | FAIL | Source sleeves meet the frame; no reliable garment-only cutout or worn fit. Original-photo fallback. |
| commons-0068 | Coat | FAIL | Outdoor background and back-facing garment cannot supply a faithful front view. Original-photo fallback. |
| commons-0053 | Dress | REVIEW | Mannequin neck removed and shoulder scale/hem improved. Armhole fringe and manually erased collar boundaries remain unapproved. |
| commons-0043 | Skirt | REVIEW | Existing Work38 outline now renders at the avatar waistband with source pattern intact. Pale hem fringe and tracing completeness remain uncertain. |
| commons-0033 | Shorts | FAIL | Shirt, hands and legs occlude the garment. No invented replacement fabric; original-photo fallback. |
| commons-0021 | Jeans/pants | FAIL | Hands and shirt obscure the waist; no reliable garment-only cutout. Original-photo fallback. |
| commons-0082 | Sneaker | FAIL | One side-view shoe cannot honestly dress two front-facing feet. Reference only. |
| commons-0088 | Boot | FAIL | Single side-view boot and shaft perspective cannot supply a real pair. Reference only. |
| commons-0016 | Blouse/tunic | REVIEW | Sleeve rotation brings the cuffs toward the arms and retains the embroidery. Raglan joins, cuff contact and loose tunic proportions remain unresolved. |
| commons-0079 | Sneaker in surroundings | FAIL | Background/support contamination plus single-shoe perspective; no usable cutout. Original-photo reference. |
| commons-0089 | Boot | FAIL | Single boot perspective; no fabricated pair. Reference only. |
| commons-0094 | Lace-up boot | FAIL | Single side-view source; no front-facing two-foot fit. Reference only. |
| commons-0059 | Dress | FAIL | Clutter and clipped garment edges; no complete cutout or reconstructed fabric. Original-photo fallback. |

## Geometry measurements

Mean distance of the two annotated garment anchors to their supplied body targets, in the **360 × 600 avatar coordinate system**. Default placement and new fitting use the same new cutout to distinguish fitting from mask cleanup. These manually selected landmarks are not independent anatomical ground truth, a segmentation score or proof of natural drape. Rotated sleeves are measured using the actual panel matrix rather than assuming zero residual.

| Garment | Default anchor error (px) | Fitted anchor error (px) |
| --- | ---: | ---: |
| Printed shirt | 5.13 | 0.00 |
| Long-sleeve shirt | 15.09 | 0.00 |
| Dress | 37.00 | 0.00 |
| Skirt | 22.75 | 0.00 |
| Blouse | 13.11 | 2.98 |

## Cutout and integration evidence

The exact existing Work30 border-connected background algorithm was rerun on all fifteen originals. **All fifteen returned REVIEW.** This assignment does not claim a new reliable automatic segmenter. Seven prior frozen model proposals are reused, the Work38 skirt trace is reused, and one new manual shirt outline is added. Source-bound manual erasures clean the printed shirt and dress. Every derivative remains reversible and unapproved.

The integrity test checks all fifteen JPEG hashes and every retained RGB channel of all nine native cutouts against the decoded original. It does not prove that no fabric was removed by an imperfect mask. Six unavailable examples clear their prior image source; a regression assertion prevents a previous garment's cutout from remaining visible. Source and license links are retained.

The matrix captures **90 comparisons: 15 photos × Chromium/WebKit × 320/390/430**. Existing compiled app tests use synthetic Auth/cloud/classifier responses, with licensed originals in the separate existing workflow; they verify recommendation, swap, favorite, reload, source change, account change and twelve storage fault probes. Additional fitting tests apply, adjust and reset actual canvases and verify disposal after asynchronous outfit replacement. Already-started storage transactions can commit completely to the old account; results are rejected rather than transferred to the new account.

Earlier attempts remain visible in Actions: the first standalone matrix opened the wrong module-relative URL; a later visual inspection caught stale unavailable-cutout display; the disposal assertion initially checked before the asynchronous swap completed. These were corrected and rerun. Passing software tests never changes the visual grades above.

## Remaining limitations

- No full visual PASS or owner approval; no full virtual try-on realism claim.
- Automatic garment-only segmentation remains unreliable. Manual traces and erasures can lose fabric or leave fringe.
- Sleeve panel calibration is benchmark-specific. Generic app users currently mark two shoulders/waist corners, not automatic sleeve landmarks.
- No reconstructed occluded fabric, arbitrary pose transfer, cloth drape or validated body/garment occlusion. Jackets, pants, shorts, back-facing coats and cropped dresses in this cohort remain fallbacks. No sweater-specific licensed example exists in this frozen cohort.
- No accepted real front-facing footwear pair. Single shoes stay references.
- New landmark fits are volatile and discarded on rerender/session changes; favorites preserve garment selections, not a fitted rendering.
- Browser emulation is not physical Samsung/iPhone validation, live authenticated four-account isolation, actual recognition accuracy or recommendation quality on family wardrobes.

No merge, deployment, production/staging/provider modifications, private family photographs, paid services or Drive Duel changes. **Family Alpha HOLD.**
