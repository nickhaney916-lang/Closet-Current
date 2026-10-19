# Three real sneaker photographs — conservative toe/sole edge comparison

The pinned BiRefNet Lite original-photo holdout already contains
`validation-0019`, `validation-0023` and `validation-0024`, each a
SHA-256 verified, independently sourced sneaker photograph.

This change compares a threshold-128 versus a threshold-224 mask using
the SAME original 8-bit model alpha for each sneaker (no repeated model
inference or expensive new service). Both masks display the ORIGINAL RGB,
never simulated texture. The report measures predicted foreground pixels
discarded by the stricter threshold, including those in the bottom 30%
of the model's own foreground bounds. That band is **not independently
verified as the actual sole**; the sneaker toe can face either direction.

Each case includes original/128/224 side-by-side review imagery and a
distinct, unapproved strict threshold prediction for potential correction
in the existing annotation editor. Neither threshold is assumed best.
Only genuinely human-approved outlines can establish loss of shoe toes,
lace eyelets, uppers, soles or shadow contamination. No automatic closet
save, customer model promotion, new paid model, production merge or
Drive Duel change. CPU benchmark time is not physical phone latency.
