# Garment interior color evidence — experimental branch, October 17, 2026

## Scope

The mobile flow already separates distinct visible garments in whole-outfit photos
using a semantic mask. Its old color sampler took pixels from the complete
coarse garment mask, including the pixel-wide outside edge. Those edge pixels
can contain skin, adjacent garments, wall, floor or a hanger.

This change introduces `clothingInteriorColorSample` in
`public/outfit-segmentation.mjs`. It samples **only original source RGB**
pixels within a 3×3-supported interior mask, excluding the outer one-model-
pixel ring of the original mask. There are **no mask additions, generated
textures, category changes or user prompts**.

The worker independently computes palettes from the full mask and the interior
mask. A piece may receive an automatic color only if both palettes have
sufficient distinct pixel evidence, both are individually confident and their
primary colors agree. Otherwise, color remains unconfirmed and the already
available single-choice inline review is used. Slender garments and very small
masks fail closed rather than creating repeated pseudo-samples.

## What this does not establish

- The 14 verified Commons reference photos primarily exercise **single-item**
  recognition. Their 8/14 automatically saved with color baseline is not
  expected to rise from this **whole-outfit-only** change.
- Eroding the coarse mask is not proof the segmentation model labeled clothing
  correctly. Coherent false-positive areas may still remain. This does not
  change the model or the semantic mask.
- Fine hems, cuffs, straps, boots and stockings must retain their source
  pixels for recognition even when the interior-only color check returns null.
- Simulated/fixture tests do not establish real-phone accuracy, image quality,
  color correctness against fabric annotations, or additional automatic saves.

## Validation and promotion requirements

1. Test that inner garment RGB remains stable when only outside/background
   pixels change, and that a contaminated one-pixel mask ring cannot become
   trusted color evidence.
2. Reject narrow masks, tiny masks and malformed selections safely.
3. Exercise the worker's full+interior agreement gate in the complete Node
   suite and existing mobile workflow.
4. Before merging or deploying, independently validate whole-outfit masks on
   real phone photos for garment-boundary precision, missing details and
   category/color accuracy; compare the previous and proposed autosave rates
   with error counts, not only pass/fail.
5. Preserve customers' photos, existing closets, one-tap input and draft review
   behavior. Do not modify Drive Duel.

All code changes remain under draft PR #7 until approved.
