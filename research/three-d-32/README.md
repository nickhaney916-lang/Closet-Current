# 3D-32 — anatomical denim hip/thigh/knee/ankle drape on actual source photography

**State: DRAFT / HOLD / NO MERGE / NO DEPLOY.** Stacked on exact dedicated-CI-passed PR437 `c470801b8a83d0b3582fdcb62e8045a0bd630fde`.

## Goal and changes

The first real original-photo blue jeans on both anatomical figures had unnaturally bulky outer thighs, rigid hips and calves. `natural-jeans-drape.mjs` shapes the **separate existing Work60 skinned pants mesh** using real original CC0 anatomical hip, knee and ankle world landmarks. Source pose radial easing softens protruding outer thighs and seat, shapes knee/calf transition and permits bounded hem ease. Deformation is restrained to 15 mm maximum per vertex, uses measured closest original-body triangle normal to avoid pulling inside observed source-pose body clearance, and keeps repeated positional seams welded. This is deliberately not cloth simulation or a full signed collision solver. It does not invent missing rear jeans photo detail.

**Photo identity and anatomy protections:** The original exact Wikimedia public-domain JPEG SHA `b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c` and transparent original-RGB cutout SHA `e51ed275c6ff1c18d37dfbb821d8994576868f707c551da4fcccea1eaa4b9441` remain unchanged. The implementation moves only a new garment's `position` vertices; source UV attributes `pantsSourceUV`, `pantsSourceFront`, `pantsRest`, indices, original skin weights, original CC0 bodies, exact photographed shirt, dress, and neutral-pants fallback stay unchanged.

**Reversible test switch:** `/research/three-d-31/index.html?pantsDrape=before` is the exact original PR437 photo jean geometry. `?pantsDrape=after` exercises the natural ease. Only `commons-public-domain-jeans-2005` with validated source and explicit provisional review enables the change; default neutral pants are unchanged.

**Validation plan:** exact isolated scope check, original-source hashes and cutout RGB, two original male/female skeleton/bone/body/skin/source-UV geometry invariant regression, genuine 320/390/430 Chromium WebGL2 before/after male and female, source and relaxed poses, front, side, 3/4, back, and original photographed shirt+jeans. Tests forbid hidden approval, outside browser requests, fake model/poster imagery, and allow neutral rollback.

**Human acceptance:** real browser screenshots must still be inspected before declaring PASS. Unknown rear is still neutral source-derived blue. No customer wardrobe, account or cloud access, paid AI, staging, production, merge or deployment. Four-person Family Alpha #255 **HOLD** until owner visual acceptance and actual RLS/cloud/physical-phone gates.
