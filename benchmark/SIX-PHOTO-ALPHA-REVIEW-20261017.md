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
