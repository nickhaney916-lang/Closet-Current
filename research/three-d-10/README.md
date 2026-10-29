# Closet Current 3D-10 — Work56 photographic shirt + Work57 relaxed anatomical pose (HOLD)

## What this actually integrates

This is **main-thread integration**, not another garment-fit Work assignment and not another competing 3D avatar. Exact verified parent is [Work56 PR #400](https://github.com/nickhaney916-lang/Closet-Current/pull/400) head `89c4808cba4e790ae4fe7d268ada81ef3c90d966`, whose dedicated original-photo garment CI passed. Work57 pose source is copied **byte-for-byte** from [Work57 PR #402](https://github.com/nickhaney916-lang/Closet-Current/pull/402) commit `539552b9aafbd777bd40b5862d096de11fc989a8`, Git blob SHA1 `593a9044ab3c79ce9d99537648f57c680342c46f`. Neither source PR is edited or merged. The user's main priority is visually convincing **real 3D humanoid + photographed owned clothing**, not further 2D polish.

- **Same anatomical 163-bone CC0 male/female figures** with unchanged pinned source GLB hashes and local offline runtime. The separate Work56 photographed shirt **remains a genuine `THREE.SkinnedMesh`** with its own material, independent geometry, source-original RGB/alpha and existing Work47 exact JPEG/PNG SHA gate. The original A-pose is used to build rest-space shirt geometry and photographic UV coordinates.
- Add a **reversible source/relaxed pose control** to the experimental Work56 review page. When the user selects relaxed, only actual source skeleton bones move (~19° lowered upper arms; smaller forearm/wrist changes), and the shirt follows that *same skeleton*. The shirt is not reprojected or recreated for the pose change; real original JPEG/PNG source identity and the shell's triangle count stay unchanged. Returning to A-pose restores the original bone quaternions without accumulating transforms.
- If someone applies a shirt while already in relaxed mode, the renderer **temporarily restores exact A-pose**, builds the garment from original source-body geometry, then returns both wearer and shirt to the chosen relaxed pose. This prevents using posed/warped body landmarks as the new base clothing template.
- The frozen old **body-painted projection** is source-A-pose only; relaxed movement would make the approximate photo position swim on skin. The control explicitly resets comparison to the separate actual garment shell, and the lower-level API rejects unsafe relaxed+projection use.
- Original photo/cutout comparison, manual review, trusted click, removal, privacy/no-cloud, both adult figures, source-RGB crop, neutral unknown sides/rear, and all inherited model licenses remain preserved. No original Work56 garment builder was edited.

## Scope and verification

Only **eight explicitly allowed research/tests/workflow files** differ from exact Work56 head; Work57 original source remains unchanged in its PR. The old staged app, 2D cuts, source photos, account data, authentication, backups and Production are untouched. No merges, deploys, staging edits, original customer photos, purchases, paid per-use AI or Drive Duel code.

The new no-deploy CI:

1. Rebuilds the exact licensed Work47 15 original JPEGs and nine source-bound proposed cutouts from prior pinned commits; downloads only exact SHA-pinned CC0 GLBs.
2. Runs all 3D06/3D07 source/security cases, original Work56 garment tests excluding only its **historical PR-specific changed-file allowlist** (replaced here by the new strict eight-file gate), and Work57 source-hash/actual-glb pose + garment skeletal deformation/restoration tests.
3. Extends the **entire original Work56 actual Chromium/WebGL2 320/390/430 mobile journey**, not a mocked model: each male/female source-bound shirt fitted in original A-pose, rotated front/side/back with real photo print and reviewed cutout, toggled source→relaxed→source, checked real changed GPU pixels and same garment triangles/source hash, then cleared and reapplied **while relaxed** with correct source-rest fitting; captures genuine male/female photo-pose comparisons and checks zero external requests and proper disposal.

**Visual quality is still not accepted.** This only proves that a real separate photographed shirt can follow the nicer body pose, not that seams, shirt drape, source print perspective, collision, or real device performance are good enough. Work56's own 14/14 and 36 screenshot evidence specifically calls side drape/collar FAIL/REVIEW; Work57's pose/body mobile proof is simulated Chromium, not physical phone certification. Independent Work55 15-photo appearance baseline remains **0 PASS / 5 REVIEW / 10 FAIL**. Family Alpha #255 stays HOLD until visual owner signoff, real JWT/RLS and cloud backup/restore, physical iPhone/Samsung tests and unresolved broad camera/indexing suite are cleared.

This is a **development integration checkpoint**, not a production release.
