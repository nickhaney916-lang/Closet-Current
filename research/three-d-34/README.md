# 3D-34 — hanging seat-to-knee source-denim silhouette (DRAFT HOLD)

**PR parent:** exact no-deploy-CI-green 3D33 branch head `df57315ee503a5dc33eac6958180d2f0b75dd7d8`.

Original photographed pants from a CC0 body preserve the anatomy's muscle contour behind the seat and upper thigh. 3D32/3D33 local ≤15mm / ≤12mm smoothing passed CI but visual change was small. This stage attempts a visibly different, *structural* hanging rear outline: measure the **actual source-pose skinned pant posterior profile on each anatomical leg**, sample original seat/knee z-depth anchors, interpolate the hanging depth between them, and move inward hollows **outward**, not into skin, with a smooth ease and hard 42mm cap. No body deformation or skeleton alteration. Front source photo UV, original image RGB/hashes, original pantsRest, skin weights and neutral fallback stay unchanged; the unphotographed rear is still a solid neutral denim shade with **no fabricated rear pockets**.

This is a research fit, **not cloth simulation**. It uses closest actual-body triangles as an oriented contact audit only. No full signed collision. Some pre-existing male negative samples may remain; any sampled point that would worsen its original gap by more than 0.5mm is rejected. Original front texture remains unchanged, and the garment stays skinned to the actual original anatomy.

## A/B proof

Local-only test URLs after explicit source review: `/research/three-d-31/index.html?pantsDrape=after&seatFairing=after&envelope=before` vs `...&envelope=after`. Both use the exact same licensed source photo, two actual 163-bone male/female CC0 rig models, poses and 3D33 fairing.

Dedicated CI checks real original JPEG and alpha SHA, byte-identical source RGB/UV/skin/rest/body attributes, measured garment movement ≤42mm, two original models, neutral fallback identity, original shirt outfit, mobile Chromium 320/390/430 × source/relaxed × front/3/4/side/back, artifact screenshots and JSON. Independent visual review still required to judge shape and avoid overinflating pants. No release, merge, deploy, private wardrobe, production, staging, paid inference, or Drive Duel. **Family Alpha #255 HOLD.**
