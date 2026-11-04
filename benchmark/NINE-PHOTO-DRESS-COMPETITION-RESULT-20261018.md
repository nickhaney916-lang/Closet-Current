# Nine real-photo class-competition checkpoint — October 18, 2026

Pinned model `Xenova/segformer_b0_clothes`, same original SHA-verified images
and existing preprocessing; no production mask/recognition changes.

| Scene | Original dress-class cells | Runner-up score within 2 logits | Upper alternatives | Skirt alternatives | Lower alternatives |
|---|---:|---:|---:|---:|---:|
| validation-0031 (worn blazer, shirt, skirt, tights and heels) | 521 | 151 | 88 | 59 | 4 |
| commons-0059 (single dress with separate jacket in photograph) | 10,648 | 0 | 0 | 0 | 0 |
| commons-0062 (jacket reference) | 1,901 | 475 | 440 | 11 | 24 |
| commons-0001 (oversized tee) | 82 | 66 | 62 | 4 | 0 |

In validation-0031 the weak upper-garment competitor occupies 83 cells in
the upper ambiguity band; the skirt competitor occupies 54 in the lower band.
This meets a **review-only** heuristic requiring at least 16 cells for
each of those disjointly located alternatives and at least 64 total dress
cells. The same heuristic is **not** triggered by the above three controls.
All nine photos were processed in the experimental workflow, not just the
cases tabulated here.

Important limitations: numerical margins and thresholds are exploratory and
not calibrated. Many weak alternatives fall on garments' actual edges or
background, especially around chairs, arms and patterned clothes. The pixel
overlays are model speculation, not alternate masks or measured ground truth.
The current experiment creates **zero garments**, reports zero confirmed
physical instances, preserves source photos and does not change customer
clipping. Do not promote until independent reference outlines and actual
phone validation can establish whether separate cloth masks are recoverable.

Next engineering experiment: use a model capable of independent clothing
instances on a held-out sample. Use these flagged photos to focus a
side-by-side comparison without mistaking a semantic runner-up for a second
garment.
