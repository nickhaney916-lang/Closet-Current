# DENIM-SIDE-15 — anatomical modeled rear/side thigh transition (DRAFT HOLD)

Starting from fully verified PR #526, commit `595b56630980bc306ec7f73a635648c63a6a1ea0`, dedicated workflow #41526321449 SUCCESS.

## Purpose
The earlier R14 photographed jeans preserve genuine front fabric detail but their unphotographed posterior/side upper leg remains comparatively cylindrical. Adjust *only existing source-neutral rear upper-thigh vertices*, outward by <=6.5 mm with a seamless zero-boundary phase against the **original 163-bone hip/knee reference**. This adds no color, UV, missing rear photograph, fake crease, fabric image, segmentation or generic body-generated texture.

## Implementation
- New opt-in `?denimFit=after&denimSilhouette=after&denimFairing=after&denimRear14=after&denimSide15=after`; all modes default OFF.
- S15 requires R14 plus verified original F07/F08 and changes lateral world X geometry only for original R14-eligible unphotographed garment rows, symmetric outward on each leg.
- Preserve original JPEG and SHA, owner/account binding, front geometry, UV, original rest, skin indices/weights, and separated sewn topology. Fail closed on missing original anatomical anchors, mesh, or source owner.
- Static BVH audit must prove no *new* intersections; this is neither physical cloth simulation nor certified zero penetration.
- Genuine 390px Chromium WebGL comparison: **female and male, two distinct licensed source jeans, exact same 135-degree and 180-degree cameras**, R14 versus S15, 8 matched pairs / 16 PNGs, >=20 changed real RGB pixels each. All inherited 3D dress, denim F06-F08, multiangle F09, photo-coverage F10, touch F11-F12 and pinch/reset F13 tests remain mandatory.

## Acceptance / release boundary
Dedicated exact-head GitHub Actions green and saved evidence required to complete **research validation**. Passing tests is not human ten-out-of-ten photorealism or physical Android/iPhone acceptance; original photograph still covers only photographed views and modeled rear stays explicitly labeled unphotographed. No merge, deployment, production edits, private wardrobe photos, other apps or billing. Family Alpha Issue #255 remains HOLD.
