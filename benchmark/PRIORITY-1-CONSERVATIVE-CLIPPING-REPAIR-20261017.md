# Priority 1 — Conservative garment clipping repair (2026-10-17)

## Scope
Closet Current's outfit pipeline already stores the original full-quality photo separately, keeps a full RGB recognition crop, and generates a white-background isolated **display thumbnail**. A coarse semantic segmentation mask sometimes contains **tiny internal missing spots** that appear as white holes. The customer wants clean, recognizable closet tiles without manually fixing every pixel.

## Implemented
`repairGarmentDisplayPinholes` in `public/outfit-segmentation.mjs` runs **only inside `isolateClothingPixels`** when generating its existing white-background display image. The recognition crop, raw source image, category/color sampling and segmentation classification are not altered. No additional AI model, download, UI control or camera step is added.

The conservative guard:
- repairs only holes fully enclosed under 8-connected background topology (no filling exterior gaps, necklines open to background, sleeves/sole edges, or holes connected diagonally);
- limits any individual hole to **4 model pixels**, and all repairs together to **1.5% of existing mask pixels**;
- requires at least two trusted adjacent garment pixels, with agreement from 75% of available adjacent references within a small local RGB threshold;
- refuses holes labelled as other garments, images clipped at the boundary, empty/malformed masks, or a source that doesn't preserve its image dimensions;
- uses original RGB from the same photo, **never synthesizes fabric texture** or applies symmetrical shape warping.

## Test completion criteria
Green specialized GitHub workflow, camera/indexing regression pass and build success. Tests cover known good pinholes, skin-colored missing sections, true button/neck openings, diagonal passage to exterior, different garment pixels, clipped masks, bounded total growth, zero-foreground, and malformed inputs. No unreviewed segmentation percentage is claimed.

## Limits and priority decision
This **does not** recover sleeves, shoe soles, entire folded sections, or 10% missing outer contours. The user also wants eventual **canonical closet tiles** that straighten shirts/pants: that is **Priority 2**, a separate derived display asset with original and raw mask retained. Generative reconstruction should be held until source-specific shapes/details can be preserved and evaluated. Do not claim production readiness or 90–100% segmentation accuracy from deterministic tests alone. No Drive Duel changes. Draft PR #7 only.
