# Closet Current — neutral human figure refinement with image-backed clothes (HOLD)

**Family Alpha issue #255 · October 26, 2026 PT · offline only**

## Reproduced visible problem

The inspected actual Chromium screenshots from draft #323 show a bald, featureless oval face and large mitten-shaped hands underneath synthetic outfit cutouts. The head/hand artwork is independent of the real original-JPEG garment clipping and owner-verification pipeline, so it can be improved without touching cutting masks, clothing pixels or Work #32 garment fitting.

## Single-source change

- Keep the existing 360×600 normalized 2D figure, exact `data-humanoid=articulated-2d-v1` contract, neutral skin colors, shoulder/hip/leg anchors and accessible no-likeness claim.
- Replace oval head with a tapered cheek/jaw contour; reduce ear prominence; draw fine eyes/eyelids, brows, nose, mouth/chin and muted neutral hairline strokes. Neutral identity, no photographed likeness, personalized ethnicity/body profile or assumed hairstyle.
- Narrow and delineate both hands/fingers rather than chunky mittens.
- **Preserve the exact clothing image strategy**: source-backed decoded transparent approved `HTMLImageElement` images, no color substitution; existing slots, original review, alpha-footprint alignment, model/classification, cloud ownership and staged HOLD unchanged.
- Extend unit and browser assertions for distinct facial detail and hand anatomy. Reuse #323's synthetic-only 12 screenshot recording to allow visible side-by-side comparison with the previous PR.

## Honest visual limit

This work addresses only **figure artwork**. It does not solve oversized angular jackets, paper-flat dresses, shirt sleeve placement, physical fit, human-body personalization, bad garment masks or mannequin/background residue. Work #30 owns source-matting improvements; Work #31 handles owned-outfit integration; Work #32 explores conservative clothing-to-body fit. Real owner signoff still requires evaluating photographed clothes on a phone.

No family four-account staging until the owner visibly accepts the combined avatar and genuine garment cutouts and private multiaccount checks pass.

All screenshots are **SYNTHETIC ONLY**, not real clothing. CI **does not establish visual appeal or native-device performance**. No production or staged app deployment, Supabase/Cloudflare/Resend change, model/API expense, source JPEG modification, family/customer data, Drive Duel, or merges.
