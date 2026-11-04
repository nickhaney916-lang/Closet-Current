# Next model decision gate — 2026-10-16

The user has visually preferred MODNet for sneakers and boots and inside-edge feathering for smoother borders. The user reports persistent shadows and background attached to garments. Sparse-row deletion failed visually. Pink/cyan boundaries are unverified heuristics, not clothing/background ground truth.

## Evaluation
Use the existing independent SegFormer and MODNet predictions to generate side-by-side photo, softly composited MODNet, SegFormer, and difference overlays for all six licensed photos. Review shadow and leakage on side and bottom edges separately. Preserve exact original source pixels.

## Do not ship automatically
A model agreement or overlap test cannot verify shadow removal. Do not mark segmentation as production-ready without external human-reviewed masks and real mobile-camera testing. Treat the footwear user preference as subjective evidence limited to those two photos. Disable any candidate algorithm that deletes a substantial shoe part. Do not change Drive Duel.
