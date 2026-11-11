# Mission 2 — Contact-constrained source-proportion 3D and original-photo fallback

**FAMILY ALPHA HOLD #255 — research-only isolated draft; no merge/deployment or hosted/staging/private data changes.**

## Evidence-led problem

The genuine PR843 real-browser source baseline has 1,321/1,119 Chromium female/male intersecting body/garment triangle-pairs before shape change, and the longer photographic geometry introduces 845/728 NEW intersections while binary body mesh-pair counts do not change. WebKit measured 1,327/1,121 baseline and 849/735 NEW. These are actual 163-bone source garment results at 320/390/430 CSS widths, not a synthetic proof of adequate physical fabric.

A full-length source-proportion extension is therefore **not** automatically eligible for 3D merely because it looks longer and has no net increase in aggregate intersection totals.

## Engineering correction

- The existing `fitSourceLength` can dry-run an exact world-space skinned mesh candidate without mutating positions, panel projection, original JPEG, alpha, weights or owner metadata. Bounded scales of 1.0, .75, .5 and .25 preserve the origin and source projection safety; alpha-source and identity checks remain mandatory.
- `planNoNewContactSourceLength` measures actual before/after triangle identities for each staged scale with the independent P843 BVH audit. It selects the **first** candidate with no *new* intersections and at least seven centimeters of evidenced lower hem displacement in the sampled source pose.
- If all candidates create new contacts, `applyNoNewContactSourceLength` refuses the 3D transformation **before any mutation**, with an explicit original-photo/2D fallback error. No unsafe proposed geometry is committed. A dry-run is not a release certificate; existing intersections and hidden rear geometry remain unverified.
- The isolated native donor installs this only under `?photoSourceLength=research&photoSourceTrianglePolicy=adaptive`. The native 3D admission refuses missing or dishonest positive contact receipts and preserves the owner's existing photo-backed builder on 3D rejection.
- Unit tests cover zero-mutation previews, a real skinned obstacle where reducing the extension avoids introduced contacts, and a blocked source where all candidate scales refuse while source arrays, panel attributes, and weights remain byte-identical.
- Dedicated no-deploy browser jobs also exercise the native signed-fixture original JPEG and saved outfit, accept 3D **only** on actual zero-new-contact receipts, otherwise require an explicit photo-backed fallback without account switching, wardrobe mutation or fabricated garment imagery.

## Certification boundary

This does **not** solve all collisions. A zero-new-intersection candidate can still have existing penetrations; swept poses, full self/layer collision, internal containment, physics, source rear fabric, natural real material drape and independent human-perceived realism remain unresolved. The current photographed source is one licensed test garment with owner-asserted/synthetic mask and simulated auth. Actual physical Android/iPhone camera/GPU/memory acceptance, multi-category 3D construction, original-human independent ground truth and multi-owner hosted approval remain required.

No claim of full Mission 2 completion or Family Alpha release readiness.

## Verification

**Pending final exact-head Actions CI.** Only verified passing commands/artifacts and sampled outcome counts may be added after the run completes.
