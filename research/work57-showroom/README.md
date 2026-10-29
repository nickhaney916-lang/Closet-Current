# Work57 — anatomical fashion showroom (Family Alpha HOLD)

Independent branch from verified PR396 commit `e24dcbe417fcca9e52f412f83e65f8ebe58a49c3`. All changes are new Work57 files. PR397 garment projection/startup, Work56 shirt meshes, Work53 isolation, Work55 acceptance and every existing application/shared renderer file remain untouched.

## Inspected source and visible improvements

Reviewed the actual verified PR396 workflow artifact `12858348018` from run `40784885429`, exact source head above, including both figures at 390 px. Original archive SHA256: `a368433d8585fda641ef602cbdf67a2ba064c433a237f773ed21d380bb6eb280`. Re-rendered the untouched PR396 module in the new layout at the same 390×844 viewport for comparable front/side/back captures. Before images are real WebGL output of that original renderer, not reconstructed pictures. Different framing/material/pose are intentional parts of the comparison.

- **Reversible skeletal pose:** lower each upper arm 19° in the frontal plane, gently flex elbows 5° and turn wrists 3°. Feet, pelvis, leg length, shoulder width and all source proportions remain unchanged. Source fitting pose restores the exact original quaternions; switching poses does not accumulate rotations. Hands remain outside the hips. No automatic body reshaping, measurements or likeness capture.
- **Smoother fashion presentation:** average coincident normal seams on cloned geometry. Under the opaque basewear only, blend normals toward a broad torso/pelvis envelope to suppress fine anatomical relief. Original vertex positions, UVs, weights and silhouette stay unchanged; this is a mannequin shading treatment, not anatomical reconstruction or cloth.
- **Modest neutral basewear:** darker opaque torso/pelvis presentation material, higher coverage toward the shoulders, with rest-position attributes that stay attached when arms move. Never shown as actual photographed wardrobe clothing. The fabric is still painted on body topology and is not a sewn garment.
- **Studio lighting/framing:** reduce washed-out fill, add soft front fill, matte ceramic/graphite options, procedural contact-shadow texture and a closer full-body camera. No shadow maps, new body meshes, paid services or external runtime assets.
- **Mobile layout:** figure/model selection, front/¾/side/back, source/relaxed pose, material, turntable, reset and zoom controls share one viewport down to 320×568. Canvas aspect follows its actual compact height to preserve proportions. Supplemental research/license information is collapsed below the main controls.
- **Resource hygiene:** cap rendering DPR at 1.5, request low-power graphics, stop idle GPU redraws and cap turntable updates at approximately 30 fps. Dispose old source geometries, materials and skeleton bone textures on switching; dispose contact texture on teardown. Old skeleton textures previously accumulated across model switches. The change does not promise physical-phone frame rate or battery performance.

## Actual browser tests

`node scripts/test-work57-browser.mjs` uses real Chromium WebGL2 with SwiftShader, mobile viewport/DPR/touch emulation and CDP touch input. It does not run native Android, iOS Safari or a physical GPU.

| Profile | CSS viewport | Emulated DPR |
| --- | --- | --- |
| Small iPhone size | 320×568 | 2 |
| iPhone 13 size | 390×844 | 3 |
| Large iPhone size | 430×932 | 3 |
| Compact Android size | 360×800 | 3 |
| Large Android size | 412×915 | 2.625 |

For every profile, both rigs and four viewing angles render; a genuine one-finger touch drag changes pixels and a two-touch pinch changes camera distance. Zoom buttons, material/pose changes, view presets, turntable/reset, canvas aspect ratio, no horizontal overflow and all primary controls inside the viewport are checked. Repeated male/female switches retain **9 geometries / 2 textures**, with **109,064 source triangles / 163 bones** unchanged. No external browser requests or page exceptions. Idle GPU draw count stays constant. Simulated WebGL loss/restoration is exercised on the large Android profile. Local WebKit installation cannot run because this environment lacks its system libraries and package installation is blocked; Safari remains unverified.

Six Node tests cover existing source/license bounds, actual model SHA256, both rigs, geometry/normal-source immutability, unchanged bone weights, pose reversibility/idempotence, fixed pelvis/feet and the untouched original renderer.

`evidence/mobile-results.json` records actual software-rendered measurements. Readback timings include a render plus PNG encoding and synchronization; they are **not physical-phone FPS**. Renderer submit time alone is also not GPU time. Memory counts demonstrate stable resource counts across switches, not measured total hardware VRAM. A full extra rest-position attribute costs roughly one extra XYZ float vector per source vertex; no extra body triangles are introduced.

## Visual assessment after inspecting rendered comparisons

| Area | Male | Female | Remaining limitation |
| --- | --- | --- | --- |
| Relaxed stance/arms | Visible improvement | Visible improvement | Hands still have source-model finger splay; legs retain a symmetric stance. |
| Chest/waist/hips | Cleaner, less clinical shading | Cleaner, less anatomical relief | Original proportions intentionally preserved; no body personalization. Side silhouette stays anatomical. |
| Surface/material | More coherent matte shading | More coherent matte shading | Faces/ears/fingers remain generic; basewear edges are painted, with no cloth thickness. |
| Lighting/framing | Clearer shape and closer framing | Clearer shape and closer framing | Simple studio/contact effect, not photoreal lighting or calibrated skin. |
| Mobile showroom | Controls fit tested sizes | Controls fit tested sizes | Figure is smaller on 320×568; real phone/Safari performance still requires testing. |

**Overall: visibly improved presentation; REVIEW / Family Alpha HOLD.** This implementing-assistant inspection is not independent Work55 or owner approval. No garment appearance acceptance, new 15-photo PASS, realistic fabric fit or family-release authorization is claimed.

## Reproduce

From repository root:

```sh
npm install --no-save --no-package-lock --no-audit --no-fund three@0.180.0 playwright@1.56.1 sharp@0.34.3
npx playwright install chromium
node research/three-d-06/fetch-licensed-avatars.mjs
node --test tests/three-d-06-anatomical-models.test.mjs tests/work57-showroom.test.mjs
node scripts/test-work57-browser.mjs
node scripts/test-work57-evidence.mjs
```

Serve the repository on loopback and open `/research/work57-showroom/index.html`. `?variant=baseline` imports the untouched verified renderer; its source-relative models resolve through an explicit HTML base to the existing 3D06 directory. The new renderer uses those same local assets. No fixes to PR397's loader/startup are included.

The existing procurement script pins male SHA256 `d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8` and female SHA256 `a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1`. Both remain CC0 MakeHuman-derived models published by Innerscene. Binaries are not committed. Dedicated read-only CI builds full mobile screenshots, two before/after sheets and measured results as artifacts.

## Next integration step

Do not merge this showroom fork wholesale. Review the separate pose helper, normal/material treatment and compact controls individually after PR397 startup work is resolved. Keep the **original source fitting pose** while aligning the photographed shirt. Bind a separate garment mesh to the same existing skeleton, then apply the relaxed pose to body and garment together, preserving original-photo identity and rest-position garment UVs. A world-space photographic body projection must be revalidated under bone motion before enabling this pose in that experiment. Keep source/relaxed pose selection explicit, preserve shoulder anchors and dispose clothing/body handles together.

Require real garment front/side/back review, shoulder/underarm/cuff collision checks, physical Android/iPhone Safari tests and independent acceptance before Family Alpha. No deploy/merge, staging/production, auth/Supabase/Cloudflare, account data, family photos, original garment edits, money or Drive Duel changes.
