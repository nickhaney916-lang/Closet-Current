# Six-photo alpha-mask review — 2026-10-17

**Source:** GitHub Actions run 39041073035, `experimental-six-garment-native-alpha-review`, artifact 12104325800. This is visual review and mask uncertainty, **not** approved ground truth or demonstrated shadow-removal accuracy.

## Priority cases (bottom-region uncertainty)

| Photo | Garment | Bottom-region uncertain pixels |
| --- | --- | ---: |
| commons-0094 | boot | 16.72% |
| commons-0079 | sneaker | 8.43% |
| commons-0065 | jacket | 8.25% |
| commons-0053 | dress | 1.74% |
| commons-0035 | shorts | 1.72% |
| commons-0049 | dress | 0.79% |

## Visual observations on original / native-alpha / threshold-128 comparisons

- **Sneaker (0079):** an attached hard ground shadow remains on the right side of the sole in both cutout previews. Changing global alpha thresholds alone should not be promoted as a shadow fix.
- **Boot (0094):** disjoint pale and gray patches persist below the boot and heel. Potential background leakage; review against a garment outline before removal.
- **Jacket (0065):** a pale patch remains below the sleeve and right of the jacket. The shape is not automatically classifiable as shadow without reviewed garment-versus-background annotation.

## Follow-up experiment

1. Obtain independent approved garment and shadow outlines for these three cases.
2. Measure garment retention and shadow/background contamination separately using the existing scoring utilities.
3. Compare any object-aware cleanup proposal against the native alpha and sharp-128 baselines on all six references.
4. Reject an algorithm that trims soles, shoelaces, jacket cuffs, seams, or other real garment detail.
5. Do **not** modify the production crop pipeline until both visual review and independently approved reference-mask scores support improvement.

All six approved shadow references remain unavailable. No pixel-removal algorithm was changed as part of this review.

## Sharp-baseline follow-up — October 17, morning Pacific

Experimental commit `0c469007781efd1e9e7f3475a84a78a8e8e178a3`, comparison run `39047730843`.

- Corrected selective-boundary and post-cleanup previews to use the selected hard threshold-128 baseline and hard candidate alpha. Removed implicit feathering and matte blending from these comparisons; the third post-check panel now highlights proposed removals in pink. Source RGB is retained in cutout panels; the diagnostic overlay intentionally recolors proposed removals.
- Eighteen focused Node checks passed. Camera/indexing, mobile persistence, segmentation and experimental six-photo workflows all passed. These are execution checks, not segmentation accuracy scores.
- Visually inspected all six regenerated selective-boundary sheets. The narrow color-similarity removal does not resolve the sneaker's attached ground shadow or the boot/jacket background patches. Do not promote this heuristic as a shadow fix.
- The sharp baseline also visibly omits interior fabric in the shorts and a small chest region in the jacket. Include these retention failures in future reference review; shadow-only evaluation would miss them.
- No production crop pipeline changes. Next evaluation needs garment retention, attached shadow and detached background measured separately against independently reviewed references. Do not repeat edge-softening experiments as the selected baseline.


## Supported enclosed-gap candidate — October 17, morning Pacific

Experimental commit `3886dcb61b3d5169c805503083d44122ec8832f6`, comparison run `39048128438`, artifact `12106094876` (`experimental-supported-interior-repair`).

- Added a review-only mask candidate that restores only enclosed background components with at least 98% SegFormer support, within a cumulative 2% baseline-foreground area budget. Eight-way background connectivity preserves openings connected diagonally to the image edge. It never removes foreground, alters RGB, softens edges or changes production.
- Actual added pixels: shorts 11,075; beige dress 0; black dress 54; jacket 4,808; sneaker 0; boot 0. These are candidate mask changes, not verified garment-recovery scores.
- Visual inspection confirms the obvious jacket chest hole and smaller shorts hole are filled. The larger shorts hole exceeds the budget and remains; missing outer garment portions also remain. Shadows and background leakage are unchanged.
- Four new safeguard tests and eight related comparison/baseline tests passed locally. The candidate is not authorized for production and is not independently approved ground truth.
- Next work: independently review recovered regions and the remaining large/open garment gaps, then evaluate shadow removal separately. Avoid subtracting the general SegFormer prediction from footwear: its visible omissions would cut away substantial shoe material.
