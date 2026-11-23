# Mission 2 — first genuine institutional physical size reference (HOLD)

## Source identity / museum record (real; not simulated)
- Institution: **The Metropolitan Museum of Art**, collection object **70759**, accession **1983.21a,b**, late nineteenth–early twentieth-century Chinese Qing skirt.
- Authenticated P89 photograph: institutional **image ID 2551406**, museum-curated caption **"a) front"**. This is the image already used by the original Mission 2 163-bone native regression. Do not import part B values into A, or treat unrelated museum photographs as the same observed part.
- Curatorial original record: https://www.metmuseum.org/art/collection/search/70759
- Original institutional image: https://collectionapi.metmuseum.org/api/collection/v1/iiif/70759/2551406/main-image
- **Real catalogue measurements for garment component A**:
  - Length: **39 inches = 990.6 mm**.
  - Bottom width: **52 1/2 inches = 1333.5 mm**.
  - Waistband width **excluding loop/button**: **28 1/2 inches = 723.9 mm**.
- The page also separately records **part B** (length 38 in; bottom width 51 1/4 in; waistband width 28 3/4 in). **Do not substitute these for A**.
- The catalogue does not specify measurement instrument, quantitative uncertainty, a calibrated camera model, physical marker positions in source JPEG, whether nominal bottom width represents a circumference when worn, or cloth mechanical data. The photo shows the displayed textile arrangement, not necessarily the measured path geometry. It does not prove wearer size.

## What is and is not established
- Established: a *real independently published* object-level physical length and two linear width measurements for the correct historical skirt part, matched to the exact P89 true-source photo identity at the already verified live native original-photo verifier.
- **Not established:** a source pixel-to-millimetre map, independent on-image ruler, lens distortion, camera plane/extrinsics, deformation of skirt pleats, stitching/pattern coordinates, body scale in real millimetres, closed waistband circumference, seam connection, actual reverse, contact and textile drape, or correctness of the automatic source foreground mask.
- In particular, **DO NOT divide museum published width by image bounding box width to manufacture mm/pixel**. The original displayed skirt is folded/draped and the photographed contour is not a measured physical width landmark; perspective and camera dimensions have not been calibrated.
- The source photo 2D display remains required; `consumer3DAdmitted:false` and Family Alpha #255 **HOLD**. This is a *real measured size anchor*, **NOT "real physical garment-to-body calibration complete"**.

## How to obtain the remaining real physical calibration (without changing production)
For an **accessible owner's garment**, capture an original JPEG laid flat with **both complete visible edges and a verified printed ruler or caliper in the same plane**. Position two **independently measured ruler spans**, one by the top and one by the lower garment edge. Record exact end-point pixel coordinates on the original unmodified JPEG, actual span lengths, instrument, uncertainty, orientation (EXIF), and physical placement. Take a straight-overhead photo; if the garment cannot be flattened, state that no planar conversion is justified. Record direct tape measurements of length and relevant seam widths; for fit, also measure actual closure/circumference and wearer reference dimensions, with uncertainty. Photograph any genuine back/side separately and retain all original SHA-256 identities in the user's authorized private account, never in this public repository.

Use the pre-existing no-upload research UI at `research/parallel107/` (draft PR #1505; **not merged into consumer**) to enter two ruler spans and manually measured dimensions. Its `parallel107-calibration-v1` remains `NOT_VERIFIED` until independent physical measurements/camera/ownership are validated. The existing #1514 recipient applies an independent source/rig and contact-readiness check, which still fails closed. Real device/accessibility and qualified owner review remain separate gates.

For the **museum garment** the real curator dimensions are now known, but an operator cannot obtain or pretend to have camera pose, lens calibration, verified relevant physical endpoints and garment topology merely from the museum photograph. Ask the institution for physical pattern/measurement diagrams, calibration chart, multiple true part-A views and their camera metadata if available. If those are unavailable, report the photographic mapping as `MISSING` instead of using guesses.

## Reproducible checks
- `node --test tests/m2-met70759-physical-dimension-anchor.test.mjs`
- In the research-only original-163bone Chromium/WebKit test, confirm the same source image ID 2551406, decoded original RGB and original SHA along with true real physical part-A lengths; confirm `localPhotoMillimetersPerPixel:null`, `photoToOriginalRigUnitsPerMillimeter:null` and `consumer3DAdmitted:false`.
- No merge, deploy, family data, Supabase, original JPEG edits, changes to other research branches or hold lifting.
