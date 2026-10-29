# Closet Current 3D-33: posterior jeans side and seat fairing (DRAFT HOLD)

3D-first development, single coordination conversation, stacked **only** on [PR #438](https://github.com/nickhaney916-lang/Closet-Current/pull/438) exact source-bound dedicated-green head `6c4d7945dff8d8f050507ae4ed1197aa551b8d43`.

## Objective

The original photographed public-domain jeans are recognizable from the front but the anatomical rear, seat and side of the pant mesh retain visible muscle ridges, sculpted buttocks and rigid lower-leg steps. We do **not** have a photographed back, so do not synthesize back pockets, stitching or fantasy texture. The back remains explicit neutral **actual-source-derived denim color**.

### Actual geometric implementation

`posterior-fabric-fairing.mjs` only acts on verified `commons-public-domain-jeans-2005` that has already passed PR437 original JPEG/transparent PNG SHA checks and 3D32 bounded anatomical fit. It measures the real garment's skinned source-pose posterior surface, gathers a 26mm spatial neighborhood of its existing vertices, smooths stepped z-profile around seat, upper thigh and calf with bounded up-to-12mm edits and body-triangle clearance not worse than baseline. It leaves source photographed front pixels visually protected and never mutates photographed image bytes, exact pixel RGB, UV/crop texture attributes, skin weights, original body geometry, rest-pose mapping, skeleton, or dress/shirt meshes.

Research toggles `?pantsDrape=after&seatFairing=before` and `?pantsDrape=after&seatFairing=after` expose exact PR438 versus new 3D33 in the localhost-only photo jeans showroom. These toggles do **not** authorize a release preview or bypass original explicit provisional human review.

### Testing and limitations

Dedicated no-deploy CI: strict isolated source branch, SHA-pinned original jeans + exact licensed AJ shirt and CC0 male/female originals, actual source/rest/UV/skin hashes, original body immunity, no more than 12mm local posterior movement, female/male original-body nearest-triangle *oriented* gap not worsened, invalid source rejected, genuine 320/390/430px before/after male/female × source/relaxed × front/3/4/side/back WebGL screenshots, original photographed AJ shirt controls, no extra browser requests, neutral-fallback pixel-identical.

**Oriented contact samples are NOT full signed collision.** Some PR438 male source-pose samples were negative. We preserve them from worsening but cannot call a physical collision PASS. This operation is modest mesh fairing, **not** cloth dynamics, photo back projection, actual user's clothing, or automatic visual-owner signoff.

No production, staging, merge, deployed accounts, private user photos, Drive Duel, or paid per-outfit inference. **Family Alpha #255 HOLD.**
