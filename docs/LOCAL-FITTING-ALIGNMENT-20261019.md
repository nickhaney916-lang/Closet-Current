# Local fitting alignment follow-up to PR #32

This branch starts at `1b36749fc6a3a7c2b46d9a85d72cbda470e23897` and keeps the same two figure assets. It changes only display copies. Original high-resolution recognition, clipping and indexing inputs are unchanged.

## Changes

- Remove fully clear padding before placement; include every nonzero alpha pixel so soft cuffs and hems are retained. Preserve native transparent cutout detail up to 600,000 pixels instead of 150,000. Conservative white-background matting retains its tested 150,000-pixel limit and ambiguous photographs remain held.
- Use separate shoulder/waist/hip rectangles calibrated by visual inspection of the existing female and male preview assets. Shorts and skirts receive shorter placement boxes. Existing bottom/top/outer-layer order and dress exclusions remain intact.
- Keep the central half of each mesh at identity coordinates to reduce distortion of central prints, buttons and seams. Deform only outside quarters, retain horizontal hems, and avoid the previous outward bottom-profile expansion that could clip hip pixels at the canvas edge. Canvas sampling uses high-quality smoothing. This is still approximate geometry, with no cloth reconstruction, hidden-body inference or real-fit guarantee.
- Add optional local selfie position/zoom sliders. Coordinates are bounded and adjust to the selected fixed figure. Removing the selfie, leaving the page or changing the rendered account revokes its object URL and resets controls. No persistence, transport or external inference added.

## Evidence and limits

The focused Node suite checks faint-alpha bounds, untouched source bytes, central geometry, non-inverted triangles, different fixed-body placements, short hems and selfie bounds. The integration browser script checks bottom/top ordering, unchanged source data, two figures, disabled paid UI, zero remote writes, ephemeral selfie placement/removal, and three repository-licensed photos with SHA-256 provenance.

Photo cases: Commons `0053` (black dress on white exterior) must display; `0002` (red shirt on dark mannequin scene) and `0003` (black shirt with trousers/gray scene) must be held rather than displaying an opaque scene. Original attribution/license records remain in `benchmark/locked-photo-sources.json`. CI uploads screenshots and JSON records; an accepted cutout is not a measured fabric-fidelity score. Do not treat these three cases as a garment accuracy benchmark.

Physical Android/iPhone tests have not been performed. Preview figure resolution remains only 160×297; increasing garment resolution cannot restore detail in the underlying figures. Figure commercial rights remain unverified. Folds, side sleeves, hands/hair occlusion, perspective mismatch, realistic drape, and garment-specific shoulder landmarks still require work and independent real-photo review. Current fixed figures already wear gray clothing, which can remain visible behind a shorter or narrower overlay. This branch does not invent a neutral body or erase that clothing.

No merge, deployment, paid services, customer-photo uploads or Drive Duel changes.
