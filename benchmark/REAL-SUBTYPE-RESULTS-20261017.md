# Actual FashionCLIP recognition on eight real photos — October 17, 2026

Source workflow: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39054423372  
Stored evidence: `benchmark/real-subtype-observations-20261017.json`; original GitHub artifact `experimental-fashionclip-eight-photo-subtypes`.

The existing pinned recognition model (`ff13/fashion-clip`) scored eight hash-verified garment photographs using two differently padded framings. The model was loaded in GitHub's Node CPU environment; measured load ~957 ms and individual post-load inference/preprocessing observations ranged about 60–98 ms **in this runner**. These times do not establish on-phone responsiveness or account for actual app loading.

| Photo | Primary top-view result | Confirmation result | Safe conclusion |
| --- | --- | --- | --- |
| commons-0001, oversized T-shirt | Blouse | Blouse | Insufficient score; original/photo review |
| commons-0003, long-sleeve shirt | Sweatshirt | Sweatshirt | Tentative subtype, visibly risks incorrect garment type |
| commons-0041, skirt | Skirt | Skirt | Tentative subtype |
| commons-0043, skirt | Skirt | Skirt | Tentative subtype |
| commons-0060, jacket | Cardigan | Jacket | Disagreement, do not create |
| commons-0062, jacket | Blouse | Jacket | Disagreement, do not create |
| commons-0059, jacket + dress | Casual dress | Blouse | Conflicting category; semantic model missed jacket |
| validation-0008, woman with blouse/headwrap | Scarf | Scarf | Model identifies headwear rather than blouse |

**3 of 8** met the cross-view subtype rule; **0 garment entries** created. This is not 3/8 recognition accuracy: subtype consistency and correctness are different, and one 'Sweatshirt' classification came from a photo explicitly described as a long-sleeve shirt. Source labels were consulted for diagnostic review **after** inference, not to generate predictions.

## Architecture decision
1. Preserve original photographed item, its detail and source checksum.
2. Separate background cutout (BiRefNet) from semantic garment localization.
3. Keep existing FashionCLIP type recognition as an independent *view-based* signal, not a second independent classification model.
4. Refuse auto-created duplicates if shirt+jacket or shorts+pants share the same semantic region.
5. Flag uncertain or contradictory cases for background review instead of inventing extra buttons.
6. Investigate physical garment instance segmentation and feature-preserving reclassification before production pilot.

The tests lock the observed failure cases into regression coverage. No deployed pipeline modifications, benchmark score inflation or Drive Duel changes.
