# Hybrid cutout disagreement audit — October 18, 2026

The five hash-verified reference photos are compared with the SAME already pinned
models (SegFormer clothing-part segmentation and BiRefNet Lite object alpha).
This offline-only diagnostic paints **amber** where the object-level model sees
foreground but the strict clothing-guided hybrid does not.

- Amber pixels are **not measured recovered garment fabric**. They may be true
  missing dress panels, a shoe toe, shadows, a person or a mannequin.
- Report areas, connected-region counts, whether rejected pixels touch retained
  garment pixels, and whether they are in the object's lower band. These are
  geometric *review priorities*, not independent accuracy.
- Person/mannequin scenes always carry a separate contamination-review warning.
  Even standalone shoes require shadow review; a connected cast shadow cannot
  be identified by connectivity alone.
- Separate audit images accompany the existing original/object/hybrid cutout
  views in the CI artifact; do not silently write or alter mask predictions.
- No confidence from CI model agreement replaces six independently approved
  garment-only masks or on-device phone performance and clarity tests.

The customer app, camera, recognition, color indexing, closet UI and production
deployments are unchanged. No paid model is enabled, and Drive Duel is untouched.
