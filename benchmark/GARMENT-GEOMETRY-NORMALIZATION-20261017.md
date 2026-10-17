# Category-aware derived garment straightening — Experimental, October 17 2026

Customer goal: neat garment-shaped closet tiles and hanger previews across all categories, from crumpled, crooked, or folded source photos. **We do not yet have a reliable generative unfolded-garment service**, so the safe first iteration is conservative geometric pose correction.

Implemented `public/garment-pose-normalizer.js`:
- Requires a **predominantly clean white backdrop along the image border**, a substantial dark/colored centered isolated garment, appropriate category, vertically elongated silhouette, and a near-linear 3-band axis lean between 4° and 13°.
- Straightens supported isolated garment previews by bounded rotation using only original photo pixels and aspect-preserving display centering.
- No attempt to reconstruct folded sleeves, exact trouser leg shapes, logos, complex patterns or hidden garment sections.
- Keeps original photo, raw cutout, recognition crop, clothing record and cloud storage untouched. Any ambiguous garment reverts to original centering.
- Used only for **derived closet display previews**; no server upload or paid inference.
- Adds lazy processing for tiles actually near the viewport, instead of full resolution scans of the entire closet. All categories can use the same Grid / Closet View UI; shoes and accessories remain unrotated.

Test gates check synthetic tilted shirt/pants, straight apparel, bad/busy backgrounds, white-on-white, unsupported categories, input correctness, build and regression. CI passing does **not** establish AI quality, silhouette completeness, or real-photo accuracy. Real garment evaluation and phone UI review required prior to production merge.

Future generative normalization needs a trusted server job + independent visual verification and consent/budget control; preserve source truth and expose only real garment details. Do not conflate output with the uploaded original. Live site and Drive Duel unchanged.
