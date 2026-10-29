# Chat 3D-08 — independent anatomical 3D real-shirt visual acceptance (HOLD)

This is independent visual QUALITY ASSURANCE only. Base is exact verified [Work59 PR #408](https://github.com/nickhaney916-lang/Closet-Current/pull/408) commit \`d09786163eb52a4a0fa05a5ffc546fc171896080\`, which includes prior actual CC0 anatomies PR396, original photograph PR397, Work56 separate garment, and Work58 posed garment. Our branch **does not edit any actual garment geometry, camera, shader, loader, photo, source hash, production, staging or account files**. PR407 is a separate broad 3D release gate and is not duplicated; this work adds specifically close-up anatomy and photograph visual comparisons on the *newer Work59 drape*.

## Reproducible real WebGL evidence

Run pinned read-only GitHub workflow \`three-d-08-anatomical-visual-no-deploy.yml\`, or in an existing repository checkout after dependencies/historical benchmark and GLBs have been reconstructed:

\`\`\`sh
node scripts/test-three-d-08-anatomical-capture.mjs
node scripts/test-three-d-11-evidence.mjs
node scripts/test-three-d-08-anatomical-qa.mjs
node scripts/test-three-d-08-anatomical-gallery.mjs
\`\`\`

The first script is an isolated source-pinned Work59 capture harness with a measured 0–1 late idle-frame tolerance; Work59's original harness remains unchanged. The second script is Work59's unchanged evidence creator. Both use real Chromium SwiftShader 3D dress-and-rotate tests that generate **96 authentic captures**: before/after × female/male × 320/390/430 × source/relaxed × front/three-quarter/side/back. No generated garments or fake human views. Original licensed black AJ \`commons-0003\` JPEG and its *existing* source-RGB transparent PNG are independently SHA-256 verified, including unchanged Work47 license/identity and no owner approval. A newly generated comparison test checks all 96 PNGs for data, 48 paired actual framebuffer differences, angle uniqueness, and limits unrelated lower-body changes from a garment-only refinement. This is a **regression check**, not a silhouette-based declaration of realistic fit.

The QA creates:
- \`benchmark/three-d-08-anatomical-qa/female-visual-inspection-HOLD.jpg\`
- \`benchmark/three-d-08-anatomical-qa/male-visual-inspection-HOLD.jpg\`
- \`benchmark/three-d-08-anatomical-qa/results-HOLD.json\`
- \`research/three-d-08-anatomical-qa/gallery.html\`: mobile responsive **interactive gallery** with both genuine source photographs; figure, width, pose and camera selectors; before/after actual WebGL PNGs; manual PASS/REVIEW/FAIL per criterion and local JSON download **with explicit HOLD**. Local reviewer feedback is not uploaded or silently saved in customer data.

For offline review, download the GitHub CI artifact, extract it keeping the repository-relative directories intact, then open the gallery HTML. The source images and 96 PNGs are included in the artifact. All viewers may change views and export notes; they **cannot approve** Family Alpha with this static file.

## Independent visible findings and areas to inspect

Visually inspected the existing real Work59 original source/relaxed male/female before-after contact sheets. Both use the actual licensed AJ fabric and distinct 163-bone anatomical source figures. The white chest AJ logo remains recognizable and is not mirrored on the inferred rear.

| Area | Male | Female | Evidence / limitation |
| --- | --- | --- | --- |
| Source identity and front print | PASS | PASS | Existing original JPEG/PNG hashes, visible white source print; neutral backside has no invented logo |
| Human anatomical silhouette | REVIEW | REVIEW | More human-like than tube shapes but stock mannequin straight/neutral stance, generic head/hands, not personal body measurements |
| Shoulder and collar | REVIEW | REVIEW | Refined geometry softens shoulder and closes collar opening, still angular and schematic |
| Cuffs / sleeve attachment | **FAIL** | REVIEW | Male inner-cuff sliver in three-quarter. No general collision/clearance guarantee |
| Side/waist silhouette | REVIEW | REVIEW | New waist drape incrementally broadens fabric but follows body and still looks stiff, especially female |
| Overall photographic garment realism | **FAIL** | **FAIL** | Real photo folds are shading rather than actual cloth folds, front/side inferred-material transitions remain visible |

These scoped PASS grades are only for evidence of original-photo identity, **not family visual approval**. The overall 3D appearance fails the current release quality expectation. All 15 licensed Work47 photographs are not yet model-integrated: this research avatar source covers **1 original shirt**, not an independent 15-garment 3D benchmark. Do not pretend additional categories can be dressed because a screenshot gallery renders.

## Family Alpha HOLD blockers

No physical Android/iPhone or native Safari testing, robust memory/FPS/battery acceptance, user-specific clothing fit, continuous pose clipping, all wardrobe garment categories, four-account/RLS/backup/privacy or owner visual approval. PR409 owns GPU unavailable fallback, PR410 owns model loading performance, Work59 owns drape, and main thread owns garment startup and integration. Do not overwrite any of them. No production, staging, cloud, original image, wardrobe/account, Drive Duel, deployment, merge, fees or invitations.
