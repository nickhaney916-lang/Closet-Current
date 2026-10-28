# Closet Current — 3D-01 proof of concept (HOLD, isolated)

**Decision:** Stop expanding the 2D humanoid's visual-polishing track and establish whether realistic-looking **3D garment meshes** can outperform the existing flat clothing presentation. This branch is an **offline, research-only, real-WebGL2** prototype, not the production or staging app, and not a deployable release feature.

## Run locally

From the repository root (with any simple **local** static server, not a remote CDN):

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/research/three-d-01/index.html` in a modern browser with WebGL2.

The page renders a **genuinely curved three-dimensional humanoid and garment meshes**, not CSS 3D, a photo billboard, or a prerendered angle sequence. Drag/touch to rotate; Front/Side/Back/Turn controls change the actual model's yaw. Switch between shirt, pants and dress templates, and adult or youth-size shape presets. The three fixed local source images are exact existing **licensed** benchmark photographs, shown unchanged beside the 3D figure. The front of each 3D garment may be optionally projected with its original photo; the back is explicitly an **inferred neutral material**, NOT a reconstructed backside or physically measured drape. White backgrounds or mannequins in photographs may be visible in this exploratory texture projection. A clean reviewed transparent cutout is necessary for a credible garment texture. Nothing here implies automatic clothing recreation or true virtual try-on.

The three source photos come from the repository's locked manifest, with on-page author/license links:
- Shirt: `commons-0002`, CC BY-SA 3.0
- Pants: `commons-0021`, public domain
- Dress: `commons-0049`, CC BY 4.0

The app reads only local benchmark assets. No visitor's wardrobe, camera, photos, owner tokens, cloud services, paid inference, 3rd-party scripts or account APIs are used. No personally identifiable avatar or custom model measurements. The static document is responsive and has an explicit non-release/fallback message if WebGL2 is unavailable.

## Actual reuse of 2D development

`garment-adapter.mjs` maps verified existing **Tops/Bottoms/Dresses** recognition categories to 3D shirt/pants/dress slots. It reuses the **unchanged Work47 reviewed-cutout alpha integrity gate** (rejects unisolated rectangular PNGs), carries the exact source SHA-256 binding provided by the trusted wardrobe caller and can reuse the **unchanged Work54 shoulder/waist starting-fit assessor** as evidence. Crucially it does NOT treat 2D fit pixels as a 3D body measurement or approve a photograph. Caller must independently enforce owner/account/session and confirmed manual review. Unsupported/opaque/unknown source fails closed.

`geometry.mjs` builds original static 3D circumference meshes with shoulders, sleeves, torso, legs and a flared dress skirt. `webgl-renderer.mjs` draws them using native WebGL2 shaders and local source textures, with genuine depth testing, rotation and directional lighting. Reusable meshes have approximate 3D geometry, **no cloth physics, rear surface acquisition, skeletal posing, reliable fit proportions, avatar facial likeness or live wardrobe integration**. No generated user assets or proprietary purchased avatar files.

## Offline quality gates

```sh
node --test tests/three-d-01-prototype.test.mjs
npm install --no-save --no-package-lock --no-audit --no-fund playwright@1.56.1
node scripts/test-three-d-01-browser.mjs
```

Native Node tests check true 3D mesh vertices/index/normal/depth, fixed slot/size templates, exact existing cutout-integrity rejection and source ID guards, unsupported shoes, no account/photo side effects, known licensed photo manifest, and no external scripts/cloud calls.

A dedicated **no-deploy** CI tests actual Chromium software-WebGL2 across 320/390/430px. It must render a nonempty GPU canvas; front/side/back pixels must differ, front redraw must be deterministic, all 3 clothing types must change the rendered model, toggle photo projection, change size preset, show original photos with licenses and issue **zero external network requests**. Screenshots are labelled HOLD. If headless WebGL2 is unavailable, fail clearly; do not pretend a 2D image is a successful 3D check.

## Next technical decision gate

In the next iteration, feed **only correctly reviewed real garment cutouts** from Work #53 and run their front textures on the 3D templates, preserving original image RGB and source-bound fit recipes. Compare side-by-side with Work #55's visual benchmark. A neutral-geometry mesh with a photograph printed on it **is not equivalent to realistic worn fabric**. The 3D workflow should continue only if actual real-clothing appearance, mobile performance and honest rear-view treatment improve.

**Family Alpha: HOLD.** Current last independently graded 2D visuals: **0 PASS / 5 REVIEW / 10 FAIL**. No family photos used, no 3D garment acceptance claim, real JWT/RLS, cloud restore or physical phone testing. Separate 4-person limited-alpha preparation remains independent. No merging, deploy, staging/production modification, fees or Drive Duel edits.
