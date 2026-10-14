# Core clothing identity before optional details

Recognition prioritizes usable clothing records in this order:

1. Color and broad garment category.
2. Specific garment type, such as T-shirt versus polo.
3. Pattern, sleeves and fit.
4. User-confirmed season, brand, size, material and other optional details.

Optional detail comparison failures no longer discard an identity that already passed category/type and independent-view checks. Successful optional fields are kept; unavailable fields stay unknown. No material, brand or size is invented.

Color is evaluated locally from a 16×16 image sample before type recognition. Central regions reduce influence from framing borders. Common colors use HSV-based color families; strongly mixed colors use Multicolor. Readable opaque photos always receive a color estimate, with mixed/ambiguous estimates requiring confirmation. These are coarse photo estimates, not guaranteed garment colors: racks, backgrounds, labels, patterns and lighting can affect them. Cropping the garment tightly improves relevance. The model's independently checked color supersedes a photo estimate; manual colors are preserved.

Missing color estimates populate when Adjust opens, without a model download or another click. The photo remains visible for review. Color is first among the detailed clothing fields. Save changes confirms the displayed estimate as user-reviewed; editing color also marks it as user-entered. Automatic captures retain the photo-estimate marker until review.

If specific type votes disagree, a broad category may be retained only with strong primary and independent-view category agreement, matching full-vocabulary clothing support, and low negative evidence. Existing specific-type and negative rejection gates are unchanged. An uncertain category remains reviewable and never triggers automatic saving. Confident broad category plus color can save a single item with type Unknown. Duplicates, ownership confirmation for separated outfits and clipping/segmentation safeguards still apply. Missing optional attributes do not block saving.

Category-and-color records can contribute to casual outfit suggestions at lower priority than known subtypes, with unconfirmed-type and estimated-color notices. They do not stand in for activewear, workwear, formal clothing or an unknown accessory subtype. Estimated colors produce tentative inspiration matches instead of exact color claims; user-reviewed colors can match normally. Known seasonal conflicts remain excluded.

## Validation

213 Node checks passed, covering pixel color families, bright borders, mixed colors, unsupported samples, preservation of manual colors, source precedence, optional model errors, subtype disagreement, contradictory views, negative evidence, partial autosaving, outfit ownership and tentative versus confirmed matches.

[Real-photo benchmark](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38633129245): 32 reviewed, 16 additional/negative and 11 independent photographs passed locked per-photo regression checks. The 32-photo category result remains 26/32, including one broad dress category. All 3 negative controls remain rejected. The independent category result improves from 10/11 to 11/11 by retaining a broad Bottoms category with an unconfirmed subtype; this small benchmark is not a general accuracy estimate.

On the 26 garments with a retained category, color field coverage rises from 12 verified model-returned values to 26 values after local estimates. Pattern/fit/sleeve coverage does not change. This measures availability, not color correctness: these fixtures lack color ground-truth annotations. Estimates must be reviewed on the actual photo.

Browser tests use licensed samples and a controlled recognition backend, plus a synthetic gradient JPEG for the core autosave path. They verify color appearing when the editor opens, retaining color after a type failure, saving and matching category/color with type Unknown, automatic core saving, private restoration, manual edit preservation and the existing interrupted-save/recovery suite. No actual user wardrobe photos were inspected. No physical-phone accuracy claim is made.

The model, text vectors, camera resolution and simplified navigation are preserved. Drive Duel was not accessed or modified.

[Browser priority/recovery run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38633525766). Reports: `core-color-coverage.json` and `core-identity-flow-results.json`.
