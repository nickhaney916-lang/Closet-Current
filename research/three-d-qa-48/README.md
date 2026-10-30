# 3D-QA-48 — genuine independent photo-garment shoulder seam witnesses (DRAFT HOLD)

**Reviewed parent:** PR #455 `2040be33d945a0c25e45a84f6841795c085a0108`. This change is a new *verification gate*, not a new cosmetic effect.

## Defect in previous acceptance evidence

3D47's summary reports `upperArmFabricSeamGap` from the seam groups it happened to move. A zero result does not by itself prove that actual real cap/torso seam vertices exist in both left and right sleeves or that all previously sewn shared vertices stayed connected.

## New functioning test

`tests/three-d-48-cap-seam-witness.test.mjs` independently reconstructs real cross-mesh seam-vertex correspondences from **the original geometries before the 3D47 change**. For both anatomical figures and both legally reviewed denim photo sources, it checks:

- There are real cap-to-torso seam witnesses on both arms (not a zero-gap result from an empty list).
- The same source-seam vertex IDs exist after tailoring and remain coincident within 0.00005 model units.
- A joined witness vertex physically moves on each side, showing the tailoring genuinely affects a shared seam instead of leaving the tested seam empty or unchanged.
- Original photo-source approval gate, photographed denim SHA, explicit source-garment construction, and release HOLD are retained.

The existing no-deploy 3D47 CI workflow now runs this stronger test before it accepts the original full-photo triangle/contact and browser screenshot evidence.

## Honest scope

This test does **not** certify signed body containment, complete sewn boundaries, natural fabric motion, human-perceived realism, or a real mobile device. The sample is exact original-anatomy local geometry; visual screenshots still require human inspection.

**State:** DRAFT/HOLD. No changes to customer app, staging, production, payments, real account/photos or Drive Duel. No merge or deploy. Four-person Family Alpha #255 HOLD.

**Actual test execution:** Await exact-branch CI; do not declare success based on code commit alone.
